'use strict';

const cron = require('node-cron');
const db = require('../utils/db');
const embeds = require('../utils/embeds');
const clan = require('../utils/clan');
const bm = require('../utils/battlemetrics');
const permissions = require('../utils/permissions');

/**
 * Sync each linked member's play time + live online status from BattleMetrics.
 *
 * - Hours: cumulative `timePlayed` delta → wipe + total hours (can't miss sessions).
 * - Online status: stored on the record and reflected via an optional "in-game" role.
 */
async function tick(client) {
  const srvId = bm.serverId();
  if (!srvId) return;

  const cfg = permissions.getConfig();
  const members = db.read('members');
  let changed = false;

  let guild = null;
  if (cfg.inGameRoleId && cfg.automation.autoCheckInOut && process.env.GUILD_ID) {
    guild = await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);
  }

  let tracked = 0;
  let unresolved = 0;
  for (const [, m] of Object.entries(members)) {
    // Self-heal: members who only linked Steam get their BattleMetrics player
    // resolved here once BM has seen them on the server.
    if (!m.bmPlayerId && m.steamId) {
      const resolved = await bm.resolveClanPlayer({ steamid: m.steamId, personaName: m.ingameName });
      if (resolved) {
        m.bmPlayerId = String(resolved.id);
        if (resolved.name && !m.ingameName) m.ingameName = resolved.name;
        changed = true;
        console.log(`[battlemetricsSync] Resolved ${m.username} → BM ${m.bmPlayerId} (${resolved.source}).`);
      }
    }
    if (!m.bmPlayerId) {
      if (m.steamId) unresolved += 1;
      continue;
    }
    tracked += 1;

    const info = await bm.getPlayerServerTime(m.bmPlayerId, srvId);
    if (!info) continue;

    const tp = info.timePlayed; // seconds, lifetime on this server

    // ── Hours via delta ────────────────────────────────────────────
    if (m.bmLast == null) {
      m.bmLast = tp;
      changed = true;
    } else {
      const deltaSec = Math.max(0, tp - m.bmLast);
      if (deltaSec > 0) {
        const hours = deltaSec / 3600;
        m.currentWipeHours = Number(((m.currentWipeHours || 0) + hours).toFixed(3));
        m.totalHours = Number(((m.totalHours || 0) + hours).toFixed(3));
        m.bmLast = tp;
        clan.syncAllTime(m.discordId, m);
        changed = true;
      }
    }

    // ── Live online status + auto check-in/out ─────────────────────
    const wasOnline = !!m.online;
    if (wasOnline !== info.online) {
      m.online = info.online;
      changed = true;
      await handleStatusChange(client, guild, cfg, m, info.online).catch(() => {});
    }
    if (info.online) {
      clan.touch(m);
      changed = true;
    }
  }

  if (changed) db.write('members', members);
  console.log(`[battlemetricsSync] Synced: ${tracked} tracked, ${unresolved} linked-but-unresolved.`);

  // Auto-promotion runs off the freshly-synced stats.
  if (cfg.automation.autoPromote) {
    try {
      await require('./autoPromote').tick(client);
    } catch (e) {
      console.error('[battlemetricsSync] auto-promote failed:', e.message);
    }
  }
}

/** Add/remove the in-game role and optionally note the session in the record. */
async function handleStatusChange(client, guild, cfg, member, online) {
  if (!cfg.automation.autoCheckInOut) return;

  // Track an auto session window (display only — hours come from timePlayed).
  member.checkInTime = online ? new Date().toISOString() : null;
  member.autoTracked = online;

  if (guild && cfg.inGameRoleId) {
    const gm = await guild.members.fetch(member.discordId).catch(() => null);
    if (gm) {
      try {
        if (online) await gm.roles.add(cfg.inGameRoleId);
        else await gm.roles.remove(cfg.inGameRoleId);
      } catch (e) {
        console.error('[battlemetricsSync] role update failed:', e.message);
      }
    }
  }
}

module.exports = {
  start(client) {
    if (!bm.serverId()) {
      console.log('[battlemetricsSync] Disabled (no server linked — run /wipe server).');
      return;
    }
    console.log('[battlemetricsSync] Enabled — syncing linked players every 15 minutes.');
    if (!process.env.BATTLEMETRICS_API_TOKEN) {
      console.warn('[battlemetricsSync] No BATTLEMETRICS_API_TOKEN set — SteamID auto-matching is disabled. ' +
        'Members resolve only by in-game name (set with /setingamename) or manually via /setbattlemetrics.');
    }
    cron.schedule('*/15 * * * *', () => tick(client).catch((e) => console.error('[battlemetricsSync]', e.message)));
    setTimeout(() => tick(client).catch(() => {}), 15000);
  },
  tick,
};
