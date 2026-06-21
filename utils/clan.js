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
  fetchChannel,
  log,
};
