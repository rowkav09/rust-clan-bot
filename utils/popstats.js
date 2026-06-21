'use strict';

const axios = require('axios');
const db = require('./db');

const MAX_POINTS = 2016; // ~7 days at one sample / 5 min

/** Append a population snapshot. data/pophistory.json = { points: [{t, players, max, queue}] }. */
function record({ players, max, queue }) {
  const hist = db.read('pophistory');
  if (!Array.isArray(hist.points)) hist.points = [];
  hist.points.push({
    t: Date.now(),
    players: players || 0,
    max: max || 0,
    queue: queue || 0,
  });
  if (hist.points.length > MAX_POINTS) hist.points = hist.points.slice(-MAX_POINTS);
  db.write('pophistory', hist);
}

/** Return snapshots from the last `hours` hours. */
function recent(hours = 24) {
  const hist = db.read('pophistory');
  const points = Array.isArray(hist.points) ? hist.points : [];
  const cutoff = Date.now() - hours * 3600000;
  return points.filter((p) => p.t >= cutoff);
}

/** Summary stats over a set of points. */
function summary(points) {
  if (!points.length) return { peak: 0, avg: 0, latest: null };
  const peak = Math.max(...points.map((p) => p.players));
  const avg = Math.round(points.reduce((s, p) => s + p.players, 0) / points.length);
  return { peak, avg, latest: points[points.length - 1] };
}

/**
 * Build a population line-graph and return a SHORT QuickChart URL (via their
 * create API) so it never exceeds Discord's 2048-char image-URL limit.
 * Returns null if the chart service can't be reached.
 */
async function chartUrl(points) {
  const step = Math.max(1, Math.ceil(points.length / 60));
  const sampled = points.filter((_, i) => i % step === 0);
  const labels = sampled.map((p) =>
    new Date(p.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );
  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Players', data: sampled.map((p) => p.players), borderColor: '#3498db', fill: true, backgroundColor: 'rgba(52,152,219,0.2)', tension: 0.3 },
        { label: 'Queue', data: sampled.map((p) => p.queue), borderColor: '#e67e22', fill: false, tension: 0.3 },
      ],
    },
    options: {
      plugins: { legend: { labels: { fontColor: '#fff' } } },
      scales: {
        x: { ticks: { fontColor: '#bbb', maxTicksLimit: 8 } },
        y: { ticks: { fontColor: '#bbb' }, beginAtZero: true },
      },
    },
  };

  try {
    const res = await axios.post(
      'https://quickchart.io/chart/create',
      { chart: config, width: 700, height: 350, backgroundColor: '#2c2f33' },
      { timeout: 10000 },
    );
    return res.data?.url || null;
  } catch (err) {
    console.error('[popstats] chart url error:', err.message);
    return null;
  }
}

module.exports = { record, recent, summary, chartUrl, MAX_POINTS };
