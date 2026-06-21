'use strict';

const cron = require('node-cron');
const db = require('../utils/db');
const time = require('../utils/time');
const embeds = require('../utils/embeds');
const clan = require('../utils/clan');
const wipeinfo = require('../utils/wipeinfo');
const permissions = require('../utils/permissions');

let lastName = null;

async function tick(client) {
  // Activate any scheduled server switch whose time has arrived (clan plays a
  // different server some weeks). Re-baselines tracking automatically.
  try {
    const activated = await wipeinfo.activateDueScheduledServers();
    if (activated && activated.ok) {
      const cfg = permissions.getConfig();
      const channel = await clan.fetchChannel(client, cfg.wipeChannelId);
      if (channel && channel.isTextBased?.()) {
        await channel.send({
          embeds: [
            embeds.success(
              '🔄 Switched tracked server',
              `Now tracking **${activated.server.name}**${activated.label ? ` (${activated.label})` : ''}.\n` +
                `Re-baselined ${activated.rebased} member(s). [View on BattleMetrics](${activated.server.link})`,
            ),
          ],
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[wipeCountdown] schedule activation failed:', err.message);
  }

  // Refresh the live wipe schedule from BattleMetrics (no-op without a linked server).
  let info;
  try {
    info = await wipeinfo.refreshFromBM();
  } catch (err) {
    console.error('[wipeCountdown] BM refresh failed:', err.message);
  }

  // Announce a freshly-detected wipe once.
  if (info && info.newWipeDetected) {
    await announceNewWipe(client, info).catch((e) =>
      console.error('[wipeCountdown] announce failed:', e.message),
    );

    // Optionally run the full archive + reset automatically.
    const cfg = permissions.getConfig();
    if (cfg.automation.autoWipeReset) {
      try {
        const { performWipeReset } = require('../utils/wipereset');
        const { wipeNumber } = await performWipeReset(client);
        const channel = await clan.fetchChannel(client, cfg.wipeChannelId);
        if (channel && channel.isTextBased?.()) {
          await channel.send({
            embeds: [
              embeds.success(
                'Auto wipe reset complete',
                `Stats archived automatically. Now on **Wipe #${wipeNumber}**.`,
              ),
            ],
          });
        }
      } catch (e) {
        console.error('[wipeCountdown] auto reset failed:', e.message);
      }
    }
  }

  const cfg = permissions.getConfig();
  if (!cfg.wipeChannelId) return;

  const next = wipeinfo.getNextWipe();
  const remaining = next.date.getTime() - Date.now();
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

async function announceNewWipe(client, info) {
  const cfg = permissions.getConfig();
  const channel = await clan.fetchChannel(client, cfg.wipeChannelId);
  if (!channel || !channel.isTextBased?.()) return;

  const wipe = info.wipe;
  const mapUrl = wipe.mapUrl || info.server?.mapUrl || null;
  const mapImage = wipe.mapImage || info.server?.mapImage || null;

  const embed = embeds
    .wipe(
      '🆕 The server just wiped!',
      `**${wipe.serverName || 'The server'}** is fresh — drop in and stake a base! 🦀`,
    )
    .addFields(
      { name: '🌱 Seed', value: `\`${wipe.mapSeed || '?'}\``, inline: true },
      { name: '📐 Size', value: `\`${wipe.mapSize || '?'}\``, inline: true },
      { name: '🏛️ Monuments', value: `${wipe.mapMonuments ?? '?'}`, inline: true },
    );

  const connect = wipe.connect || info.server?.address || null;
  if (connect) {
    embed.addFields({ name: '🔌 Connect', value: `\`\`\`client.connect ${connect}\`\`\`` });
  }
  const bmLink = wipe.serverLink || info.server?.link || wipeinfo.serverLink();
  if (bmLink) embed.addFields({ name: '🔗 BattleMetrics', value: `[View server page](${bmLink})` });
  if (mapUrl) embed.addFields({ name: '🗺️ Map', value: `[Open full map on RustMaps](${mapUrl})` });
  if (mapImage) embed.setImage(mapImage);
  else if (wipe.headerImage) embed.setImage(wipe.headerImage);

  if (!cfg.automation.autoWipeReset) {
    embed.setFooter({ text: 'A leader can run /wipereset to archive last wipe and start fresh.' });
  }

  await channel.send({ content: '@here 🆕 **WIPE IS LIVE!**', embeds: [embed] });
}

module.exports = {
  start(client) {
    // Every 10 minutes (Discord rate-limits channel renames to 2 / 10 min).
    cron.schedule('*/10 * * * *', () => tick(client));
    setTimeout(() => tick(client), 5000);
  },
  tick,
};
