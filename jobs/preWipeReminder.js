'use strict';

const cron = require('node-cron');
const embeds = require('../utils/embeds');
const time = require('../utils/time');
const clan = require('../utils/clan');
const wipeinfo = require('../utils/wipeinfo');
const permissions = require('../utils/permissions');

// Milestones before wipe (ms) and their labels.
const MILESTONES = [
  [24 * 3600000, '24 hours'],
  [6 * 3600000, '6 hours'],
  [3600000, '1 hour'],
  [15 * 60000, '15 minutes'],
];

// The job runs every 10 min; only fire a milestone when we're crossing it
// (i.e. within roughly one tick of the mark) — never for everything below it.
const WINDOW_MS = 11 * 60000;

// Remember which milestones we've fired, keyed by `${wipeISO}:${ms}`.
const fired = new Set();

async function tick(client) {
  const cfg = permissions.getConfig();
  if (!cfg.automation.preWipeReminders) return;

  const next = wipeinfo.getNextWipe();
  const remaining = next.date.getTime() - Date.now();
  if (remaining <= 0) return;

  const wipeKey = next.date.toISOString();
  const typeLabel = next.type ? wipeinfo.wipeTypeLabel(next.type) : 'Wipe';

  for (const [ms, label] of MILESTONES) {
    // Fire only while remaining is just below the milestone, not for every
    // smaller threshold. Larger milestones already passed are silently skipped.
    if (remaining > ms || remaining <= ms - WINDOW_MS) continue;
    const key = `${wipeKey}:${ms}`;
    if (fired.has(key)) continue;
    fired.add(key);

    const channel = await clan.fetchChannel(client, cfg.wipeChannelId);
    if (!channel || !channel.isTextBased?.()) return;

    const embed = embeds.wipe(
      `⏰ Wipe in ~${label}!`,
      `${typeLabel} lands ${time.relative(next.date)} (${time.full(next.date)}).\n\n` +
        'Get your loot sorted, regroup, and prep for the fresh start! 🦀',
    );
    await channel.send({ content: '@here', embeds: [embed] }).catch(() => {});
  }

  // Garbage-collect keys from past wipes occasionally.
  if (fired.size > 50) fired.clear();
}

module.exports = {
  start(client) {
    cron.schedule('*/10 * * * *', () => tick(client).catch((e) => console.error('[preWipeReminder]', e.message)));
  },
  tick,
};
