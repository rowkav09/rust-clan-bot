'use strict';

const cron = require('node-cron');
const db = require('../utils/db');
const lbview = require('../utils/leaderboardview');
const permissions = require('../utils/permissions');

async function tick(client) {
  const cfg = permissions.getConfig();
  if (!cfg.automation.autoLeaderboard || !cfg.leaderboardChannelId) return;

  let channel;
  try {
    channel = await client.channels.fetch(cfg.leaderboardChannelId);
  } catch {
    return;
  }
  if (!channel || !channel.isTextBased?.()) return;

  const embed = lbview.build('wipe');

  // Edit the existing message if we have one; otherwise post + remember it.
  if (cfg.leaderboardMessageId) {
    try {
      const msg = await channel.messages.fetch(cfg.leaderboardMessageId);
      await msg.edit({ embeds: [embed] });
      return;
    } catch {
      // Message was deleted — fall through to create a new one.
    }
  }

  try {
    const msg = await channel.send({ embeds: [embed] });
    const raw = db.read('config');
    raw.leaderboardMessageId = msg.id;
    db.write('config', raw);
  } catch (err) {
    console.error('[leaderboardUpdater] post failed:', err.message);
  }
}

module.exports = {
  start(client) {
    cron.schedule('*/30 * * * *', () => tick(client).catch((e) => console.error('[leaderboardUpdater]', e.message)));
    setTimeout(() => tick(client).catch(() => {}), 20000);
  },
  tick,
};
