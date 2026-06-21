'use strict';

const db = require('./db');
const clan = require('./clan');
const steam = require('./steam');
const bm = require('./battlemetrics');

/**
 * Link a Discord user to their Steam + BattleMetrics profile from a Steam input
 * (URL / SteamID64 / vanity). Persists to members.json.
 *
 * @returns {Promise<{
 *   status: 'linked'|'steam_only'|'no_steam',
 *   steamid: string|null,
 *   rustHours: number|null,
 *   bmPlayerId: string|null,
 *   ingameName: string|null,
 *   source: string|null,
 * }>}
 */
async function linkMemberBySteam(user, steamInput) {
  const steamData = await steam.lookup(steamInput);

  if (!steamData.steamid) {
    return { status: 'no_steam', steamid: null, rustHours: null, bmPlayerId: null, ingameName: null, source: null };
  }

  // Try to resolve their BattleMetrics player on the clan server.
  const resolved = await bm.resolveClanPlayer({
    steamid: steamData.steamid,
    personaName: steamData.personaName,
  });

  const members = db.read('members');
  const rec = clan.ensureMember(members, user);
  rec.steamId = steamData.steamid;
  if (steamData.rustHours != null) rec.steamRustHours = steamData.rustHours;

  let result = {
    status: 'steam_only',
    steamid: steamData.steamid,
    rustHours: steamData.rustHours,
    bmPlayerId: null,
    ingameName: steamData.personaName || rec.ingameName,
    source: null,
  };

  if (resolved) {
    rec.bmPlayerId = String(resolved.id);
    const info = await bm.getPlayerServerTime(resolved.id);
    rec.bmLast = info ? info.timePlayed : 0; // baseline — only future time counts
    rec.ingameName = resolved.name || steamData.personaName || rec.ingameName;
    result = {
      status: 'linked',
      steamid: steamData.steamid,
      rustHours: steamData.rustHours,
      bmPlayerId: rec.bmPlayerId,
      ingameName: rec.ingameName,
      source: resolved.source,
    };
  } else if (steamData.personaName && !rec.ingameName) {
    rec.ingameName = steamData.personaName;
  }

  clan.touch(rec);
  db.write('members', members);
  return result;
}

/**
 * Extract a BattleMetrics player ID from a profile URL or a raw numeric ID.
 * Rejects 17-digit SteamID64s so they aren't mistaken for BM IDs.
 */
function extractBmId(input) {
  if (!input) return null;
  const s = String(input).trim();
  const url = s.match(/battlemetrics\.com\/players\/(\d+)/i);
  if (url) return url[1];
  if (/^\d{1,16}$/.test(s)) return s; // bare BM id (BM ids are shorter than a SteamID64)
  return null;
}

/**
 * Link a Discord user directly to a BattleMetrics player (from a profile link
 * or numeric ID). This is the reliable path — no name guessing.
 * @returns {Promise<{status:'linked'|'bm_set'|'bad_bm', bmPlayerId:string|null, ingameName:string|null}>}
 */
async function linkMemberByBattlemetrics(user, bmInput) {
  const id = extractBmId(bmInput);
  if (!id) return { status: 'bad_bm', bmPlayerId: null, ingameName: null };

  const [info, name] = await Promise.all([bm.getPlayerServerTime(id), bm.getPlayerName(id)]);

  const members = db.read('members');
  const rec = clan.ensureMember(members, user);
  rec.bmPlayerId = String(id);
  rec.bmLast = info ? info.timePlayed : null; // baseline — only future time counts
  if (name) rec.ingameName = rec.ingameName || name;
  clan.touch(rec);
  db.write('members', members);

  return {
    status: info ? 'linked' : 'bm_set', // bm_set = saved but not seen on the server yet
    bmPlayerId: String(id),
    ingameName: rec.ingameName || name || null,
  };
}

module.exports = { linkMemberBySteam, linkMemberByBattlemetrics, extractBmId };
