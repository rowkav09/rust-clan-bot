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

module.exports = { linkMemberBySteam };
