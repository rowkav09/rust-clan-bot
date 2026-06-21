'use strict';

const axios = require('axios');

const BASE = 'https://api.battlemetrics.com';

/** True when a BattleMetrics server id is configured (env or wipe.json). */
function serverId() {
  const db = require('./db');
  const wipe = db.read('wipe');
  return wipe.battlemetricsServerId || process.env.BATTLEMETRICS_SERVER_ID || null;
}

function authHeaders() {
  const token = process.env.BATTLEMETRICS_API_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch normalized server status. Returns null on any failure.
 * @param {boolean} includePlayers - request the online player list (needs API token for full data).
 */
async function getServer(id = serverId(), includePlayers = false) {
  if (!id) return null;
  try {
    const params = includePlayers ? { include: 'player' } : {};
    const res = await axios.get(`${BASE}/servers/${id}`, {
      params,
      headers: authHeaders(),
      timeout: 10000,
    });

    const data = res.data?.data;
    if (!data) return null;
    const a = data.attributes || {};
    const details = a.details || {};

    const players = (res.data.included || [])
      .filter((i) => i.type === 'player')
      .map((p) => p.attributes?.name)
      .filter(Boolean);

    const maps = details.rust_maps || {};

    // Determine the soonest upcoming wipe and its type from the schedule.
    const schedule = Array.isArray(details.rust_wipes) ? details.rust_wipes : [];
    let nextWipe = details.rust_next_wipe || null;
    let nextWipeType = null;
    const upcoming = schedule
      .filter((w) => w.timestamp && new Date(w.timestamp).getTime() > Date.now())
      .sort((x, y) => new Date(x.timestamp) - new Date(y.timestamp));
    if (upcoming.length) {
      nextWipe = upcoming[0].timestamp;
      nextWipeType = upcoming[0].type; // 'map' | 'full' | 'bp'
    } else if (nextWipe) {
      if (details.rust_next_wipe_full === nextWipe || details.rust_next_wipe_bp === nextWipe) {
        nextWipeType = 'full';
      } else if (details.rust_next_wipe_map === nextWipe) {
        nextWipeType = 'map';
      }
    }

    return {
      id: data.id,
      name: a.name || 'Unknown',
      status: a.status || 'unknown',
      players: a.players ?? 0,
      maxPlayers: a.maxPlayers ?? 0,
      rank: a.rank ?? null,
      mapName: details.map || 'Unknown',
      mapSeed: maps.seed ?? details.rust_world_seed ?? null,
      mapSize: maps.size ?? details.rust_world_size ?? null,
      mapImage: maps.thumbnailUrl || maps.imageIconUrl || null,
      mapUrl: maps.url || null, // RustMaps web page
      mapMonuments: maps.monumentCount ?? null,
      headerImage: details.rust_headerimage || null,
      queue: details.rust_queued_players ?? 0,
      address: a.ip && a.port ? `${a.ip}:${a.port}` : null,
      link: `https://www.battlemetrics.com/servers/rust/${data.id}`,
      onlinePlayerNames: players,
      lastWipe: details.rust_last_wipe || null,
      nextWipe,
      nextWipeType,
      nextWipeMap: details.rust_next_wipe_map || null,
      nextWipeFull: details.rust_next_wipe_full || details.rust_next_wipe_bp || null,
      wipeSchedule: schedule,
    };
  } catch (err) {
    console.error('[battlemetrics] API error:', err.message);
    return null;
  }
}

/**
 * Fetch a single player's time on a specific server (from their BM profile).
 * Returns { timePlayed (seconds), online, firstSeen, lastSeen } or null if the
 * player has no record on that server / the request fails.
 */
async function getPlayerServerTime(playerId, srvId = serverId()) {
  if (!playerId || !srvId) return null;
  try {
    const res = await axios.get(`${BASE}/players/${playerId}`, {
      params: { include: 'server' },
      headers: authHeaders(),
      timeout: 10000,
    });
    const included = res.data?.included || [];
    const match = included.find((s) => s.type === 'server' && String(s.id) === String(srvId));
    if (!match) return null;
    const meta = match.meta || {};
    return {
      timePlayed: Number(meta.timePlayed || 0), // seconds
      online: Boolean(meta.online),
      firstSeen: meta.firstSeen || null,
      lastSeen: meta.lastSeen || null,
    };
  } catch (err) {
    console.error('[battlemetrics] Player lookup error:', err.message);
    return null;
  }
}

/** Resolve a BattleMetrics player by name. Returns the first match {id, name} or null. */
async function findPlayerByName(name) {
  if (!name) return null;
  try {
    const res = await axios.get(`${BASE}/players`, {
      params: { 'filter[search]': name, 'page[size]': 1 },
      headers: authHeaders(),
      timeout: 10000,
    });
    const p = res.data?.data?.[0];
    return p ? { id: p.id, name: p.attributes?.name } : null;
  } catch (err) {
    console.error('[battlemetrics] Player search error:', err.message);
    return null;
  }
}

/**
 * Match a SteamID64 to a BattleMetrics player ID via the match endpoint.
 * Returns the player id string, or null if no match / not permitted.
 */
async function matchSteamId(steamid64) {
  if (!steamid64) return null;
  try {
    const res = await axios.post(
      `${BASE}/players/match`,
      { data: [{ type: 'identifier', attributes: { type: 'steamID', identifier: String(steamid64) } }] },
      { headers: { ...authHeaders(), 'Content-Type': 'application/json' }, timeout: 10000 },
    );
    const entry = res.data?.data?.[0];
    const pid = entry?.relationships?.player?.data?.id;
    return pid || null;
  } catch (err) {
    console.error('[battlemetrics] steam match error:', err.message);
    return null;
  }
}

/**
 * Best-effort resolve a member to a BM player on the clan server.
 * Tries SteamID match first, then a name search filtered to the server.
 * @returns {Promise<{id:string, name:string|null, source:string}|null>}
 */
async function resolveClanPlayer({ steamid, personaName } = {}) {
  // 1. Exact SteamID match.
  if (steamid) {
    const pid = await matchSteamId(steamid);
    if (pid) return { id: pid, name: null, source: 'steamID' };
  }
  // 2. Name search confirmed against the clan server.
  if (personaName) {
    const srv = serverId();
    try {
      const res = await axios.get(`${BASE}/players`, {
        params: {
          'filter[search]': personaName,
          'filter[server]': srv || undefined,
          'page[size]': 1,
        },
        headers: authHeaders(),
        timeout: 10000,
      });
      const p = res.data?.data?.[0];
      if (p) return { id: p.id, name: p.attributes?.name, source: 'nameSearch' };
    } catch (err) {
      console.error('[battlemetrics] resolve name error:', err.message);
    }
  }
  return null;
}

module.exports = {
  getServer,
  serverId,
  getPlayerServerTime,
  findPlayerByName,
  matchSteamId,
  resolveClanPlayer,
};
