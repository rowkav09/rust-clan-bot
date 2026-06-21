'use strict';

const axios = require('axios');

const RUST_APPID = 252490;

function hasKey() {
  return Boolean(process.env.STEAM_API_KEY);
}

/** Extract a steamid64 or vanity name from raw input (id, URL, or vanity). */
function parseInput(input) {
  const s = (input || '').trim();
  if (/^\d{17}$/.test(s)) return { steamid: s };

  const profiles = s.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profiles) return { steamid: profiles[1] };

  const vanityUrl = s.match(/steamcommunity\.com\/id\/([^/\s]+)/);
  if (vanityUrl) return { vanity: vanityUrl[1] };

  // Bare vanity name.
  if (s) return { vanity: s };
  return {};
}

async function resolveVanity(vanity) {
  try {
    const res = await axios.get(
      'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/',
      { params: { key: process.env.STEAM_API_KEY, vanityurl: vanity }, timeout: 10000 },
    );
    if (res.data?.response?.success === 1) return res.data.response.steamid;
    return null;
  } catch (err) {
    console.error('[steam] vanity resolve error:', err.message);
    return null;
  }
}

/**
 * Get a player's Rust hours from their Steam profile.
 * @returns {Promise<{hours:number, steamid:string}|null>} null if unavailable
 *   (no API key, private profile, game not owned, or bad input).
 */
async function getRustHours(input) {
  if (!hasKey()) return null;
  const parsed = parseInput(input);
  let steamid = parsed.steamid;
  if (!steamid && parsed.vanity) steamid = await resolveVanity(parsed.vanity);
  if (!steamid) return null;

  try {
    const res = await axios.get(
      'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/',
      {
        params: {
          key: process.env.STEAM_API_KEY,
          steamid,
          include_played_free_games: 1,
          format: 'json',
        },
        timeout: 10000,
      },
    );
    const games = res.data?.response?.games;
    if (!Array.isArray(games)) return null; // private profile
    const rust = games.find((g) => g.appid === RUST_APPID);
    const minutes = rust ? rust.playtime_forever || 0 : 0;
    return { hours: Math.round(minutes / 60), steamid };
  } catch (err) {
    console.error('[steam] owned games error:', err.message);
    return null;
  }
}

/** Resolve raw input to a SteamID64. Works without an API key for /profiles/ URLs. */
async function resolveSteamId(input) {
  const parsed = parseInput(input);
  if (parsed.steamid) return parsed.steamid;
  if (parsed.vanity && hasKey()) return resolveVanity(parsed.vanity);
  return null;
}

/** Get a player's persona (display) name. Needs an API key. */
async function getPersonaName(steamid) {
  if (!hasKey() || !steamid) return null;
  try {
    const res = await axios.get(
      'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/',
      { params: { key: process.env.STEAM_API_KEY, steamids: steamid }, timeout: 10000 },
    );
    return res.data?.response?.players?.[0]?.personaname || null;
  } catch (err) {
    console.error('[steam] persona name error:', err.message);
    return null;
  }
}

/**
 * One-shot lookup of everything we can learn from a Steam profile.
 * @returns {Promise<{steamid:string|null, personaName:string|null, rustHours:number|null}>}
 */
async function lookup(input) {
  const steamid = await resolveSteamId(input);
  if (!steamid) return { steamid: null, personaName: null, rustHours: null };

  const [personaName, hoursInfo] = await Promise.all([
    getPersonaName(steamid),
    getRustHours(input),
  ]);
  return {
    steamid,
    personaName,
    rustHours: hoursInfo ? hoursInfo.hours : null,
  };
}

module.exports = { getRustHours, resolveSteamId, getPersonaName, lookup, hasKey, RUST_APPID };
