'use strict';

const db = require('./db');
const permissions = require('./permissions');

/** Build a fresh member record. */
function defaultMember(user) {
  const now = new Date().toISOString();
  return {
    discordId: user.id,
    username: user.username || user.tag || 'Unknown',
    tier: 0,
    joinedAt: now,
    lastSeen: now,
    currentWipeHours: 0,
    totalHours: 0,
    checkInTime: null,
    wipeRaids: 0,
    totalRaids: 0,
    currentWipeTasks: 0,
    tasksCompleted: 0,
    warnings: 0,
    ingameName: null,
    bmPlayerId: null, // BattleMetrics player ID for auto time-tracking
    bmLast: null, // last observed timePlayed (seconds) on the clan server
    online: false, // live in-game status (from BattleMetrics sync)
    promoted: false, // has been auto-promoted Recruit -> Member
    steamId: null, // linked SteamID64
    steamRustHours: null, // verified Rust hours from Steam
    vcHours: 0, // total voice-channel hours (active, non-AFK)
    vcCurrentWipe: 0, // voice hours this wipe
    vcJoinedAt: null, // timestamp of current counting voice session
  };
}

/**
 * Return the member record for a user, creating it (in the given object) if absent.
 * Always refreshes the cached username. Does NOT persist — caller writes back.
 */
function ensureMember(members, user) {
  if (!members[user.id]) {
    members[user.id] = defaultMember(user);
  } else {
    members[user.id].username = user.username || members[user.id].username;
    // Backfill any fields added after the record was first created.
    const template = defaultMember(user);
    for (const key of Object.keys(template)) {
      if (members[user.id][key] === undefined) members[user.id][key] = template[key];
    }
  }
  return members[user.id];
}

/** Mark a member as seen now. */
function touch(record) {
  record.lastSeen = new Date().toISOString();
}

/** Current-wipe score per the spec formula. */
function wipeScore(record) {
  return Math.round(
    (record.currentWipeHours || 0) * 10 +
      (record.wipeRaids || 0) * 25 +
      (record.currentWipeTasks || 0) * 15,
  );
}

/** All-time score. */
function allTimeScore(record) {
  return Math.round(
    (record.totalHours || 0) * 10 +
      (record.totalRaids || 0) * 25 +
      (record.tasksCompleted || 0) * 15,
  );
}

/**
 * Sync a member's all-time stats into leaderboard.json.
 * Reads + writes the leaderboard file.
 */
function syncAllTime(userId, record) {
  const lb = db.read('leaderboard');
  if (!lb.allTime) lb.allTime = {};
  if (!lb.wipes) lb.wipes = [];
  lb.allTime[userId] = {
    totalHours: Number((record.totalHours || 0).toFixed(2)),
    totalRaids: record.totalRaids || 0,
    tasksCompleted: record.tasksCompleted || 0,
    score: allTimeScore(record),
  };
  db.write('leaderboard', lb);
}

/**
 * Add a role to a member with precise diagnostics.
 * @returns {Promise<{ok:boolean, reason:string}>}
 *   reason ∈ ok | no_role | no_permission | hierarchy | not_in_guild | error
 */
async function assignRole(guild, userId, roleId) {
  const { PermissionFlagsBits } = require('discord.js');
  try {
    const role = guild.roles.cache.get(roleId) || (await guild.roles.fetch(roleId).catch(() => null));
    if (!role) return { ok: false, reason: 'no_role' };

    const me = await guild.members.fetchMe();
    if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return { ok: false, reason: 'no_permission' };
    }
    if (role.position >= me.roles.highest.position) {
      return { ok: false, reason: 'hierarchy' };
    }

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return { ok: false, reason: 'not_in_guild' };

    await member.roles.add(role);
    return { ok: true, reason: 'ok' };
  } catch (err) {
    console.error('[clan] assignRole error:', err.message);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Remove a role from a member with the same diagnostics as assignRole.
 * @returns {Promise<{ok:boolean, reason:string}>}
 */
async function removeRole(guild, userId, roleId) {
  const { PermissionFlagsBits } = require('discord.js');
  try {
    const role = guild.roles.cache.get(roleId) || (await guild.roles.fetch(roleId).catch(() => null));
    if (!role) return { ok: false, reason: 'no_role' };

    const me = await guild.members.fetchMe();
    if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return { ok: false, reason: 'no_permission' };
    }
    if (role.position >= me.roles.highest.position) {
      return { ok: false, reason: 'hierarchy' };
    }

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return { ok: false, reason: 'not_in_guild' };

    if (member.roles.cache.has(roleId)) await member.roles.remove(role);
    return { ok: true, reason: 'ok' };
  } catch (err) {
    console.error('[clan] removeRole error:', err.message);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Verify a member: grant the configured verified role (Recruit) and remove the
 * Unverified role. Used by application approval and auto-approve.
 * @returns {Promise<{roleOk:boolean, reason:string, removedUnverified:boolean}>}
 */
async function verifyMember(guild, userId) {
  const cfg = permissions.getConfig();
  const out = { roleOk: false, reason: 'no_recruit', removedUnverified: false, inviteSent: false };

  if (cfg.recruitRoleId) {
    const res = await assignRole(guild, userId, cfg.recruitRoleId);
    out.roleOk = res.ok;
    out.reason = res.reason;
  }
  if (cfg.unverifiedRoleId) {
    const r = await removeRole(guild, userId, cfg.unverifiedRoleId).catch(() => ({ ok: false }));
    out.removedUnverified = !!r.ok;
  }

  // Optional: invite the player to the in-game clan/team on modded servers.
  out.inviteSent = await maybeClanInvite(userId).catch(() => false);
  return out;
}

/**
 * Send the configured in-game clan-invite command via Rust+ team chat, if the
 * feature is enabled, Rust+ is connected, and the member has a linked SteamID.
 * @returns {Promise<boolean>} true if a command was sent.
 */
async function maybeClanInvite(userId) {
  const cfg = permissions.getConfig();
  if (!cfg.automation.autoClanInvite) return false;
  const rec = db.read('members')[userId];
  if (!rec || !rec.steamId) return false;

  const rustplus = require('./rustplus');
  if (!rustplus.isReady()) return false;

  const command = (cfg.rustplusInviteCommand || '/clan invite {steamid}').replace('{steamid}', rec.steamId);
  const ok = await rustplus.say(command).catch(() => false);
  if (ok) console.log(`[clan] sent in-game invite for ${userId}: ${command}`);
  return !!ok;
}

/** Human-readable explanation for an assignRole failure reason. */
function roleErrorText(reason, roleId) {
  switch (reason) {
    case 'no_role':
      return `The configured role (\`${roleId}\`) no longer exists. Re-run \`/setup\`.`;
    case 'no_permission':
      return 'I’m missing the **Manage Roles** permission. Grant it in Server Settings → Roles.';
    case 'hierarchy':
      return 'My role is **below** that role. Drag my bot role **above** it in Server Settings → Roles.';
    case 'not_in_guild':
      return 'That member isn’t in the server anymore.';
    default:
      return 'An unknown error occurred while assigning the role.';
  }
}

/** Resolve a configured channel and fetch it (returns null on failure). */
async function fetchChannel(client, channelId) {
  if (!channelId) return null;
  try {
    return await client.channels.fetch(channelId);
  } catch (err) {
    console.error(`[clan] Could not fetch channel ${channelId}:`, err.message);
    return null;
  }
}

/**
 * Post a successful ID link to the configured ID-log channel, mentioning the
 * member. No-op if the channel isn't configured. `result` is the object from
 * linkMemberBySteam.
 */
async function logIdLink(client, user, result) {
  const cfg = permissions.getConfig();
  const channel = await fetchChannel(client, cfg.idLogChannelId);
  if (!channel || !channel.isTextBased?.()) return;

  const embeds = require('./embeds');
  const lines = [`**SteamID:** \`${result.steamid || '—'}\``];
  if (result.bmPlayerId) lines.push(`**BattleMetrics:** \`${result.bmPlayerId}\``);
  if (result.ingameName) lines.push(`**In-game:** ${result.ingameName}`);
  if (result.rustHours != null) lines.push(`**Rust hours:** ${result.rustHours}h`);
  if (result.status === 'steam_only') lines.push('*(BattleMetrics match pending — will resolve once they play.)*');

  const embed = embeds
    .success('🆔 ID linked', `<@${user.id}> linked their account.\n${lines.join('\n')}`)
    .setThumbnail(user.displayAvatarURL?.() || null);

  await channel.send({ content: `<@${user.id}>`, embeds: [embed] }).catch(() => {});
}

/** Send an embed (and optional components) to the configured log channel. */
async function log(client, embed, components = []) {
  const cfg = permissions.getConfig();
  const channel = await fetchChannel(client, cfg.logChannelId);
  if (!channel || !channel.isTextBased?.()) return null;
  try {
    return await channel.send({ embeds: [embed], components });
  } catch (err) {
    console.error('[clan] Failed to send to log channel:', err.message);
    return null;
  }
}

module.exports = {
  defaultMember,
  ensureMember,
  touch,
  wipeScore,
  allTimeScore,
  syncAllTime,
  assignRole,
  removeRole,
  verifyMember,
  maybeClanInvite,
  roleErrorText,
  fetchChannel,
  logIdLink,
  log,
};
