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
  wipe.lastWipe = server.lastWipe || wipe.lastWipe || null;
  wipe.nextWipe = server.nextWipe || null;
  wipe.nextWipeType = server.nextWipeType || null;
  wipe.wipeSchedule = server.wipeSchedule || [];
  db.write('wipe', wipe);

  return { wipe, newWipeDetected, server };
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

module.exports = { getNextWipe, refreshFromBM, wipeTypeLabel };
