'use strict';

const cron = require('node-cron');
const embeds = require('../utils/embeds');
const clan = require('../utils/clan');
const bm = require('../utils/battlemetrics');
const permissions = require('../utils/permissions');

let lastAlert = 0; // timestamp of the last alert sent

async function tick(client) {
  const cfg = permissions.getConfig();
  if (!cfg.automation.popAlerts) return;

  const id = bm.serverId();
  if (!id) return;

  const server = await bm.getServer(id, false);
  if (!server || !server.maxPlayers) return;

  const fraction = server.players / server.maxPlayers;
  const queue = server.queue || 0;
  const popping = fraction >= cfg.popAlert.highFraction;
  const queued = cfg.popAlert.alertOnQueue && queue > 0;
  if (!popping && !queued) return;

  // Respect the cooldown.
  if (Date.now() - lastAlert < cfg.popAlert.cooldownMin * 60000) return;
  lastAlert = Date.now();

  const channel = await clan.fetchChannel(client, cfg.popAlertChannelId);
  if (!channel || !channel.isTextBased?.()) return;

  const reason = queued
    ? `There’s a **queue of ${queue}** forming!`
    : `It’s at **${Math.round(fraction * 100)}%** capacity!`;

  const embed = embeds.warning(
    '📈 Server is popping!',
    `**${server.name}**\n` +
      `${reason}\n\n` +
      `Players: **${server.players}/${server.maxPlayers}**` +
      (queue ? ` · Queue: **${queue}**` : '') +
      '\n\nLog in now to hold a slot! 🦀',
  );

  await channel.send({ content: '@here', embeds: [embed] }).catch(() => {});
}

module.exports = {
  start(client) {
    if (!bm.serverId()) return;
    cron.schedule('*/5 * * * *', () => tick(client).catch((e) => console.error('[popAlert]', e.message)));
  },
  tick,
};
