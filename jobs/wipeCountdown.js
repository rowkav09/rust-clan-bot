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
  const embed = embeds
    .wipe(
      '🆕 New Wipe Detected!',
      `**${wipe.serverName || 'The server'}** just wiped.\n\n` +
        `**Seed:** \`${wipe.mapSeed || '?'}\`  ·  **Size:** \`${wipe.mapSize || '?'}\`\n` +
        (info.server?.mapUrl ? `[View map on RustMaps](${info.server.mapUrl})\n` : '') +
        '\nA leader can run `/wipereset` to archive last wipe’s stats and start fresh.',
    )
    .setImage(wipe.mapImage || wipe.headerImage || null);

  await channel.send({ content: '@here', embeds: [embed] });
}

module.exports = {
  start(client) {
    // Every 10 minutes (Discord rate-limits channel renames to 2 / 10 min).
    cron.schedule('*/10 * * * *', () => tick(client));
    setTimeout(() => tick(client), 5000);
  },
  tick,
};
