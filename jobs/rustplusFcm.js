'use strict';

const fs = require('fs');
const path = require('path');
const PushReceiverClient = require('@liamcottle/push-receiver/src/client');
const embeds = require('../utils/embeds');
const clan = require('../utils/clan');
const rustplus = require('../utils/rustplus');
const permissions = require('../utils/permissions');

// Written by `npm run rustplus:register` (the rustplus.js CLI).
const CONFIG_PATH = path.join(__dirname, '..', 'rustplus.config.json');

let clientRef = null;

/** Read the FCM credentials saved during pairing registration. */
function readFcmConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return cfg?.fcm_credentials?.gcm?.androidId ? cfg : null;
  } catch (err) {
    console.error('[rustplusFcm] Failed to read rustplus.config.json:', err.message);
    return null;
  }
}

/**
 * Flatten a push notification into a single object.
 * `appData` is an array of {key, value}; the meaningful payload is usually a
 * JSON string under the `body` key (the Rust Companion API "Data" dictionary).
 */
function parseNotification(data) {
  const out = {};
  for (const entry of data?.appData || []) {
    if (entry && entry.key != null) out[entry.key] = entry.value;
  }
  if (out.body) {
    try { Object.assign(out, JSON.parse(out.body)); } catch { /* body wasn't JSON */ }
  }
  return out;
}

async function postTo(channelId, payload) {
  const ch = await clan.fetchChannel(clientRef, channelId);
  if (ch && ch.isTextBased?.()) await ch.send(payload).catch(() => {});
}

async function handleNotification(data) {
  const n = parseNotification(data);
  const cfg = permissions.getConfig();
  const alarmChannel = cfg.rustplusAlarmChannelId || cfg.logChannelId;

  // ── Server pairing → save creds + connect the websocket ──────────────
  if (n.type === 'server' && n.ip && n.playerToken) {
    rustplus.saveServerCreds({
      ip: n.ip,
      port: n.port,
      playerId: n.playerId,
      playerToken: n.playerToken,
      name: n.name || n.desc || 'Rust server',
    });
    console.log(`[rustplusFcm] Paired with server "${n.name || n.ip}". Connecting…`);
    rustplus.connect();
    await postTo(alarmChannel, {
      embeds: [embeds.success('🔗 Rust+ paired', `Paired with **${n.name || n.ip}**. Connecting to live data…`)],
    });
    return;
  }

  // ── Entity pairing (smart alarm / switch / storage monitor) ──────────
  if (n.type === 'entity') {
    console.log(`[rustplusFcm] Paired entity "${n.entityName || n.entityId}" (type ${n.entityType}).`);
    await postTo(alarmChannel, {
      embeds: [
        embeds.info(
          '🔔 Rust+ device paired',
          `Paired **${n.entityName || 'device'}** (\`${n.entityId}\`). ` +
            'Smart-alarm alerts for it will now be forwarded here.',
        ),
      ],
    });
    return;
  }

  // ── Smart-alarm trigger → loud raid / base-defense alert ─────────────
  if (n.channelId === 'alarm' || (n.title && n.message)) {
    if (!cfg.automation.rustplusAlarms) return;
    // Raid alerts prefer the raid channel, then the alarm/log channel.
    const raidChannel = cfg.raidChannelId || alarmChannel;
    const ping = cfg.automation.rustplusRaidPing ? '@everyone' : '@here';
    await postTo(raidChannel, {
      content: `${ping} 🚨 **BASE ALARM — RAID DEFENSE**`,
      embeds: [
        embeds.error(
          `🚨 ${n.title || 'Smart Alarm Triggered'}`,
          `${n.message || 'Your base alarm just went off!'}\n\n**Get on and defend the base! 🛡️**`,
        ),
      ],
      allowedMentions: { parse: ['everyone'] },
    });
  }
}

module.exports = {
  start(client) {
    clientRef = client;
    const cfg = readFcmConfig();
    if (!cfg) {
      console.log('[rustplusFcm] Disabled (no rustplus.config.json — run `npm run rustplus:register`).');
      return;
    }

    const { androidId, securityToken } = cfg.fcm_credentials.gcm;
    const fcm = new PushReceiverClient(androidId, securityToken, []);
    fcm.on('ON_DATA_RECEIVED', (data) =>
      handleNotification(data).catch((e) => console.error('[rustplusFcm] handler error:', e.message)),
    );
    fcm
      .connect()
      .then(() => console.log('[rustplusFcm] Listening for Rust+ pairing & smart-alarm notifications.'))
      .catch((e) => console.error('[rustplusFcm] connect failed:', e.message));
  },
};
