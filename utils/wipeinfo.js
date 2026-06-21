'use strict';

const db = require('./db');
const time = require('./time');
const bm = require('./battlemetrics');

/**
 * Resolve the next wipe.
 * Prefers the live BattleMetrics schedule cached in wipe.json; falls back to the
 * WIPE_DAY / WIPE_HOUR env schedule when no BM data is available.
 * @returns {{date: Date, type: string|null, source: 'battlemetrics'|'schedule'}}
 */
function getNextWipe() {
  const wipe = db.read('wipe');
  if (wipe.nextWipe) {
    const d = new Date(wipe.nextWipe);
    if (d.getTime() > Date.now()) {
      return { date: d, type: wipe.nextWipeType || null, source: 'battlemetrics' };
    }
  }
  const day = parseInt(process.env.WIPE_DAY ?? '4', 10);
  const hour = parseInt(process.env.WIPE_HOUR ?? '19', 10);
  return { date: time.nextWipe(day, hour), type: null, source: 'schedule' };
}

/**
 * Pull the latest wipe schedule + map info from BattleMetrics into wipe.json.
 * @returns {Promise<{wipe: object, newWipeDetected: boolean, server: object|null}>}
 */
async function refreshFromBM() {
  const wipe = db.read('wipe');
  const id = bm.serverId();
  if (!id) return { wipe, newWipeDetected: false, server: null };

  const server = await bm.getServer(id, false);
  if (!server) return { wipe, newWipeDetected: false, server: null };

  // Detect a brand-new wipe: BM's last wipe is newer than what we had recorded.
  // Only when we already had a baseline — never on the first observation, so
  // linking a server doesn't trigger a false "just wiped" announcement.
  const prevLast = wipe.lastWipe ? new Date(wipe.lastWipe).getTime() : 0;
  const newLast = server.lastWipe ? new Date(server.lastWipe).getTime() : 0;
  const newWipeDetected = prevLast > 0 && newLast > prevLast;

  wipe.serverName = server.name || wipe.serverName;
  wipe.mapSeed = server.mapSeed != null ? String(server.mapSeed) : wipe.mapSeed;
  wipe.mapSize = server.mapSize != null ? Number(server.mapSize) : wipe.mapSize;
  wipe.mapImage = server.mapImage || wipe.mapImage || null;
  wipe.mapUrl = server.mapUrl || wipe.mapUrl || null;
  wipe.mapMonuments = server.mapMonuments ?? wipe.mapMonuments ?? null;
  wipe.headerImage = server.headerImage || wipe.headerImage || null;
  wipe.connect = server.address || wipe.connect || null; // ip:port for client.connect
  wipe.serverLink = server.link || wipe.serverLink || null; // BattleMetrics page
  wipe.lastWipe = server.lastWipe || wipe.lastWipe || null;
  wipe.nextWipe = server.nextWipe || null;
  wipe.nextWipeType = server.nextWipeType || null;
  wipe.wipeSchedule = server.wipeSchedule || [];
  db.write('wipe', wipe);

  return { wipe, newWipeDetected, server };
}

/** BattleMetrics web link for the currently tracked server (null if none). */
function serverLink() {
  const wipe = db.read('wipe');
  if (wipe.serverLink) return wipe.serverLink;
  const id = bm.serverId();
  return id ? `https://www.battlemetrics.com/servers/rust/${id}` : null;
}

/**
 * Reset every linked member's time-tracking baseline to their lifetime on
 * `srvId`. Critical when the clan moves to a new server: `bmLast` was the
 * lifetime on the *previous* server, so without this the delta math is wrong
 * (and current-wipe hours never advance).
 * @returns {Promise<number>} number of members re-baselined.
 */
async function rebaselineMembers(srvId) {
  const members = db.read('members');
  let count = 0;
  for (const m of Object.values(members)) {
    if (!m.bmPlayerId) continue;
    const info = await bm.getPlayerServerTime(m.bmPlayerId, srvId);
    m.bmLast = info ? info.timePlayed : null; // null → next sync re-establishes it
    count += 1;
  }
  if (count) db.write('members', members);
  return count;
}

/**
 * Switch the tracked BattleMetrics server *now*. Validates the ID, repoints
 * tracking, refreshes live data, and re-baselines members so time keeps
 * counting correctly on the new server.
 * @returns {Promise<{ok:boolean, server?:object, changed?:boolean, rebased?:number}>}
 */
async function setActiveServer(id) {
  const clean = String(id).trim();
  const server = await bm.getServer(clean, false);
  if (!server) return { ok: false };

  const wipe = db.read('wipe');
  const changed = String(wipe.battlemetricsServerId || '') !== clean;
  wipe.battlemetricsServerId = clean;
  // Force fresh map/wipe fields for the new server.
  wipe.nextWipe = null;
  wipe.wipeSchedule = [];
  db.write('wipe', wipe);

  await refreshFromBM();
  // Always re-baseline: on a switch it's required, and on the same server it
  // repairs any stale baselines (the common cause of "hours stuck at zero").
  const rebased = await rebaselineMembers(clean);
  return { ok: true, server, changed, rebased };
}

/**
 * Activate any scheduled server whose switch time has passed. Removes due
 * (and stale) entries from the schedule. Returns details of the server that
 * became active, or null if nothing changed.
 */
async function activateDueScheduledServers() {
  const wipe = db.read('wipe');
  const sched = Array.isArray(wipe.serverSchedule) ? wipe.serverSchedule : [];
  if (!sched.length) return null;

  const now = Date.now();
  const due = sched
    .filter((s) => s.id && s.date && new Date(s.date).getTime() <= now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Drop everything already due (keep only future entries).
  wipe.serverSchedule = sched.filter((s) => s.date && new Date(s.date).getTime() > now);
  db.write('wipe', wipe);

  if (!due.length) return null;
  const target = due[0]; // most recent that became due
  if (String(wipe.battlemetricsServerId || '') === String(target.id)) return null;

  const res = await setActiveServer(target.id);
  return res.ok ? { ...res, label: target.label || null } : null;
}

/** Human label for a wipe type. */
function wipeTypeLabel(type) {
  switch (type) {
    case 'full':
    case 'bp':
      return '🧨 Full/BP wipe';
    case 'map':
      return '🗺️ Map wipe';
    default:
      return 'Wipe';
  }
}

module.exports = {
  getNextWipe,
  refreshFromBM,
  wipeTypeLabel,
  serverLink,
  rebaselineMembers,
  setActiveServer,
  activateDueScheduledServers,
};
