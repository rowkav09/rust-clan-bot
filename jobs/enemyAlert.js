'use strict';

const cron = require('node-cron');
const db = require('../utils/db');
const embeds = require('../utils/embeds');
const clan = require('../utils/clan');
const bm = require('../utils/battlemetrics');
const permissions = require('../utils/permissions');

async function tick(client) {
  const cfg = permissions.getConfig();
  if (!cfg.automation.enemyAlerts) return;

  const srvId = bm.serverId();
  if (!srvId) return;

  const enemies = db.read('enemies');
  const ids = Object.keys(enemies);
  if (ids.length === 0) return;

  let changed = false;
  const nowIso = new Date().toISOString();

  for (const id of ids) {
    const e = enemies[id];
    const info = await bm.getPlayerServerTime(e.bmPlayerId, srvId);
    if (!info) continue;

    if (info.online && !e.online) {
      // Rising edge — they just came online.
      const channel = await clan.fetchChannel(client, cfg.enemyAlertChannelId);
      if (channel && channel.isTextBased?.()) {
        await channel
          .send({
            content: '@here',
            embeds: [
              embeds.error('👁️ Rival online!', `**${e.name}** just logged onto the server. Stay sharp! 💀`),
            ],
          })
          .catch(() => {});
      }
    }

    if (info.online !== e.online) {
      e.online = info.online;
      if (info.online) e.lastSeen = nowIso;
      changed = true;
    }
  }

  if (changed) db.write('enemies', enemies);
}

module.exports = {
  start(client) {
    if (!bm.serverId()) return;
    cron.schedule('*/10 * * * *', () => tick(client).catch((e) => console.error('[enemyAlert]', e.message)));
  },
  tick,
};
