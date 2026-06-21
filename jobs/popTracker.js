'use strict';

const cron = require('node-cron');
const db = require('../utils/db');
const embeds = require('../utils/embeds');
const time = require('../utils/time');
const bm = require('../utils/battlemetrics');
const popstats = require('../utils/popstats');
const permissions = require('../utils/permissions');

async function buildEmbed(server) {
  const points = popstats.recent(24);
  const { peak, avg } = popstats.summary(points);
  const online = server.status === 'online';

  const embed = embeds
    .wipe(`${online ? '🟢' : '🔴'} ${server.name}`)
    .addFields(
      { name: 'Players', value: `**${server.players}/${server.maxPlayers}**`, inline: true },
      { name: 'Queue', value: `${server.queue || 0}`, inline: true },
      { name: '24h Peak / Avg', value: `${peak} / ${avg}`, inline: true },
    )
    .setFooter({ text: `Live · updates every 5 min · last ${new Date().toLocaleTimeString()}` });

  if (points.length >= 2) {
    const url = await popstats.chartUrl(points);
    if (url) embed.setImage(url);
  }
  return embed;
}

let lastName = null;

// Rename the channel to show the live count whenever it changes.
// The job runs every 5 min, matching Discord's 2-renames-per-10-min limit.
async function maybeRename(channel, server) {
  const name = `📊-pop-${server.players}-${server.maxPlayers}`;
  if (name === lastName) return;
  try {
    await channel.setName(name);
    lastName = name;
  } catch (err) {
    console.error('[popTracker] rename failed:', err.message);
  }
}

async function tick(client) {
  const id = bm.serverId();
  if (!id) return;

  const server = await bm.getServer(id, false);
  if (!server) return;

  popstats.record({ players: server.players, max: server.maxPlayers, queue: server.queue });

  const cfg = permissions.getConfig();
  if (!cfg.automation.livePop || !cfg.popChannelId) return;

  let channel;
  try {
    channel = await client.channels.fetch(cfg.popChannelId);
  } catch {
    return;
  }
  if (!channel || !channel.isTextBased?.()) return;

  // Also reflect the count in the channel name (rate-limited to ~10 min).
  await maybeRename(channel, server);

  const embed = await buildEmbed(server);

  // Edit the live message if we have one; otherwise post + remember it.
  if (cfg.popMessageId) {
    try {
      const msg = await channel.messages.fetch(cfg.popMessageId);
      await msg.edit({ embeds: [embed] });
      return;
    } catch {
      // deleted — fall through and repost
    }
  }
  try {
    const msg = await channel.send({ embeds: [embed] });
    const raw = db.read('config');
    raw.popMessageId = msg.id;
    db.write('config', raw);
  } catch (err) {
    console.error('[popTracker] post failed:', err.message);
  }
}

module.exports = {
  start(client) {
    if (!bm.serverId()) return;
    cron.schedule('*/5 * * * *', () => tick(client).catch((e) => console.error('[popTracker]', e.message)));
    setTimeout(() => tick(client).catch(() => {}), 8000);
  },
  tick,
};
