'use strict';

const cron = require('node-cron');
const db = require('../utils/db');
const time = require('../utils/time');
const permissions = require('../utils/permissions');

let lastName = null;

async function tick(client) {
  const cfg = permissions.getConfig();
  if (!cfg.wipeChannelId) return;

  const wipeDay = parseInt(process.env.WIPE_DAY ?? '4', 10);
  const wipeHour = parseInt(process.env.WIPE_HOUR ?? '19', 10);
  const next = time.nextWipe(wipeDay, wipeHour);
  const remaining = next.getTime() - Date.now();

  const name = `⏳ wipe: ${time.formatDuration(remaining)}`;
  if (name === lastName) return; // Avoid pointless rename calls.

  try {
    const channel = await client.channels.fetch(cfg.wipeChannelId);
    if (channel && channel.setName) {
      await channel.setName(name);
      lastName = name;
    }
  } catch (err) {
    console.error('[wipeCountdown] Failed to rename channel:', err.message);
  }
}

module.exports = {
  start(client) {
    // Every 10 minutes (Discord rate-limits channel renames to 2 / 10 min).
    cron.schedule('*/10 * * * *', () => tick(client));
    // Run once shortly after boot.
    setTimeout(() => tick(client), 5000);
  },
  tick,
};
