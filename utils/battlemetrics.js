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

    return {
      id: data.id,
      name: a.name || 'Unknown',
      status: a.status || 'unknown',
      players: a.players ?? 0,
      maxPlayers: a.maxPlayers ?? 0,
      rank: a.rank ?? null,
      mapName: details.map || details.rust_world_size || 'Unknown',
      mapSeed: details.rust_world_seed ?? null,
      mapSize: details.rust_world_size ?? null,
      queue: details.rust_queued_players ?? 0,
      address: a.ip && a.port ? `${a.ip}:${a.port}` : null,
      link: `https://www.battlemetrics.com/servers/rust/${data.id}`,
      onlinePlayerNames: players,
    };
  } catch (err) {
    console.error('[battlemetrics] API error:', err.message);
    return null;
  }
}

module.exports = { getServer, serverId };
