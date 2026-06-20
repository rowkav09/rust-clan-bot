'use strict';

const cron = require('node-cron');
const db = require('../utils/db');
const time = require('../utils/time');
const clan = require('../utils/clan');
const bm = require('../utils/battlemetrics');

async function tick() {
  const id = bm.serverId();
  if (!id) return;

  const server = await bm.getServer(id, true);
  if (!server) return;

  const online = new Set(
    (server.onlinePlayerNames || []).map((n) => n.toLowerCase()),
  );

  const members = db.read('members');
  let changed = false;

  for (const [, m] of Object.entries(members)) {
    if (!m.ingameName) continue;
    const isOnline = online.has(m.ingameName.toLowerCase());

    if (isOnline && !m.checkInTime) {
      // Auto check-in.
      m.checkInTime = new Date().toISOString();
      m.autoTracked = true;
      clan.touch(m);
      changed = true;
    } else if (!isOnline && m.checkInTime && m.autoTracked) {
      // Auto check-out — only for sessions we started automatically.
      const hours = time.hoursBetween(m.checkInTime);
      m.currentWipeHours = Number(((m.currentWipeHours || 0) + hours).toFixed(3));
      m.totalHours = Number(((m.totalHours || 0) + hours).toFixed(3));
      m.checkInTime = null;
      m.autoTracked = false;
      clan.touch(m);
      clan.syncAllTime(m.discordId, m);
      changed = true;
    } else if (isOnline) {
      clan.touch(m);
      changed = true;
    }
  }

  if (changed) db.write('members', members);
}

module.exports = {
  start() {
    if (!bm.serverId()) {
      console.log('[battlemetricsSync] Disabled (no BATTLEMETRICS_SERVER_ID).');
      return;
    }
    console.log('[battlemetricsSync] Enabled — syncing every 15 minutes.');
    cron.schedule('*/15 * * * *', () => tick());
  },
  tick,
};
