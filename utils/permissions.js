'use strict';

const db = require('./db');
const embeds = require('./embeds');

/** Permission tiers. */
const TIER = {
  RECRUIT: 0,
  MEMBER: 1,
  OFFICER: 2,
  LEADER: 3,
};

const TIER_NAMES = {
  3: 'Leader',
  2: 'Officer',
  1: 'Member',
  0: 'Recruit',
};

/**
 * Merge configuration from data/config.json over the .env defaults.
 * config.json (written by /setup) always wins when present.
 */
function getConfig() {
  const cfg = db.read('config');
  return {
    leaderRoleId: cfg.leaderRoleId || process.env.LEADER_ROLE_ID || null,
    officerRoleId: cfg.officerRoleId || process.env.OFFICER_ROLE_ID || null,
    memberRoleId: cfg.memberRoleId || process.env.MEMBER_ROLE_ID || null,
    recruitRoleId: cfg.recruitRoleId || process.env.RECRUIT_ROLE_ID || null,
    logChannelId: cfg.logChannelId || process.env.LOG_CHANNEL_ID || null,
    applicationChannelId:
      cfg.applicationChannelId || process.env.APPLICATION_CHANNEL_ID || null,
    raidChannelId: cfg.raidChannelId || process.env.RAID_CHANNEL_ID || null,
    wipeChannelId: cfg.wipeChannelId || process.env.WIPE_CHANNEL_ID || null,
  };
}

/**
 * Determine the highest tier a member qualifies for from their roles.
 * Returns -1 if the member holds none of the configured roles.
 */
function getTier(member) {
  if (!member || !member.roles || !member.roles.cache) return -1;
  const cfg = getConfig();
  const roles = member.roles.cache;

  if (cfg.leaderRoleId && roles.has(cfg.leaderRoleId)) return TIER.LEADER;
  if (cfg.officerRoleId && roles.has(cfg.officerRoleId)) return TIER.OFFICER;
  if (cfg.memberRoleId && roles.has(cfg.memberRoleId)) return TIER.MEMBER;
  if (cfg.recruitRoleId && roles.has(cfg.recruitRoleId)) return TIER.RECRUIT;

  // Guild owner / administrators implicitly act as Leader.
  if (member.permissions && member.permissions.has?.('Administrator')) {
    return TIER.LEADER;
  }
  return -1;
}

/**
 * Ensure the caller meets a minimum tier.
 * Replies with an ephemeral error embed and returns false if not.
 */
async function requireTier(interaction, minTier) {
  const tier = getTier(interaction.member);
  if (tier >= minTier) return true;

  const embed = embeds.error(
    'Insufficient Permissions',
    `This command requires the **${TIER_NAMES[minTier]}** tier or higher.\n` +
      `Your current tier: **${TIER_NAMES[tier] ?? 'None'}**.`,
  );

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (err) {
    console.error('[permissions] Failed to send permission error:', err);
  }
  return false;
}

/** True if the member holds the configured Member role (or higher). */
function isMember(member) {
  return getTier(member) >= TIER.MEMBER;
}

module.exports = {
  TIER,
  TIER_NAMES,
  getConfig,
  getTier,
  requireTier,
  isMember,
};
