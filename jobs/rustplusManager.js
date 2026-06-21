'use strict';

const embeds = require('../utils/embeds');
const clan = require('../utils/clan');
const rustplus = require('../utils/rustplus');
const permissions = require('../utils/permissions');

// Map marker types we care about (AppMarker.Type).
const EVENTS = {
  4: { label: 'Chinook (CH47) inbound — locked crate dropping', emoji: '🚁' },
  5: { label: 'Cargo Ship spawned', emoji: '🚢' },
  8: { label: 'Patrol Helicopter inbound', emoji: '🚁' },
};

let prevTeam = null; // steamId -> { isAlive, isOnline, name }
let prevMarkers = null; // Set of marker ids seen
let clientRef = null;

async function relayTeamMessage({ name, message }) {
  const cfg = permissions.getConfig();
  if (!cfg.automation.rustplusChatBridge || !cfg.rustplusChatChannelId) return;
  const channel = await clan.fetchChannel(clientRef, cfg.rustplusChatChannelId);
  if (!channel || !channel.isTextBased?.()) return;
  await channel.send({ content: `🎮 **${name}:** ${message}`.slice(0, 1900) }).catch(() => {});
}

async function pollTeam() {
  const cfg = permissions.getConfig();
  if (!cfg.automation.rustplusDownedAlerts) return;
  let info;
  try { info = await rustplus.teamInfo(); } catch { return; }
  if (!info || !Array.isArray(info.members)) return;

  const current = {};
  for (const m of info.members) current[m.steamId] = { isAlive: m.isAlive, isOnline: m.isOnline, name: m.name };

  if (prevTeam) {
    const channel = await clan.fetchChannel(clientRef, cfg.rustplusEventChannelId || cfg.rustplusChatChannelId);
    for (const [steamId, now] of Object.entries(current)) {
      const before = prevTeam[steamId];
      if (!before) continue;
      // Death (was alive, now dead).
      if (before.isAlive && !now.isAlive) {
        if (channel && channel.isTextBased?.()) {
          await channel.send({ embeds: [embeds.error('💀 Teammate down', `**${now.name}** was killed!`)] }).catch(() => {});
        }
        rustplus.say(`${now.name} was killed!`).catch(() => {});
      }
    }
  }
  prevTeam = current;
}

async function pollEvents() {
  const cfg = permissions.getConfig();
  if (!cfg.automation.rustplusEvents) return;
  let markers;
  try { markers = await rustplus.mapMarkers(); } catch { return; }

  const currentIds = new Set(markers.map((m) => m.id));

  if (prevMarkers) {
    const channel = await clan.fetchChannel(clientRef, cfg.rustplusEventChannelId);
    for (const m of markers) {
      if (prevMarkers.has(m.id)) continue; // already seen
      const ev = EVENTS[m.type];
      if (!ev) continue;
      if (channel && channel.isTextBased?.()) {
        await channel.send({
          content: cfg.rustplusEventChannelId ? '@here' : undefined,
          embeds: [embeds.wipe(`${ev.emoji} ${ev.label}`, 'Get out there and contest it! 🦀')],
        }).catch(() => {});
      }
    }
  }
  prevMarkers = currentIds;
}

module.exports = {
  start(client) {
    clientRef = client;

    rustplus.on('teamMessage', (m) => relayTeamMessage(m).catch(() => {}));
    rustplus.on('connected', async () => {
      const cfg = permissions.getConfig();
      const channel = await clan.fetchChannel(client, cfg.rustplusEventChannelId || cfg.rustplusChatChannelId);
      if (channel && channel.isTextBased?.()) {
        channel.send({ embeds: [embeds.success('🔌 Rust+ connected', 'Live chat, events and alerts are active.')] }).catch(() => {});
      }
    });

    // Attempt initial connection (no-op until paired).
    rustplus.connect();

    // Poll team state + map events every 30s while connected.
    setInterval(() => {
      if (!rustplus.isReady()) return;
      pollTeam().catch(() => {});
      pollEvents().catch(() => {});
    }, 30000);
  },
};
