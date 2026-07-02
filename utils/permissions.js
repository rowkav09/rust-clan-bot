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
    // Role auto-assigned on join; removed once a member is verified/approved.
    unverifiedRoleId: cfg.unverifiedRoleId || process.env.UNVERIFIED_ROLE_ID || null,
    logChannelId: cfg.logChannelId || process.env.LOG_CHANNEL_ID || null,
    applicationChannelId:
      cfg.applicationChannelId || process.env.APPLICATION_CHANNEL_ID || null,
    raidChannelId: cfg.raidChannelId || process.env.RAID_CHANNEL_ID || null,
    wipeChannelId: cfg.wipeChannelId || process.env.WIPE_CHANNEL_ID || null,

    // Optional extra wiring for automation features.
    inGameRoleId: cfg.inGameRoleId || process.env.INGAME_ROLE_ID || null,
    // Channel where members paste their Steam profile to auto-link.
    linkChannelId: cfg.linkChannelId || process.env.LINK_CHANNEL_ID || null,
    // Channel where successful ID links are logged (mentions the member).
    idLogChannelId: cfg.idLogChannelId || null,
    // Text channel hosting the live population embed (current pop + graph + alerts).
    popChannelId: cfg.popChannelId || process.env.POP_CHANNEL_ID || null,
    popMessageId: cfg.popMessageId || null,
    // Channel + message holding the auto-updating leaderboard.
    leaderboardChannelId: cfg.leaderboardChannelId || null,
    leaderboardMessageId: cfg.leaderboardMessageId || null,
    // Where rival-online alerts post (defaults to the log channel).
    enemyAlertChannelId:
      cfg.enemyAlertChannelId || cfg.logChannelId || process.env.LOG_CHANNEL_ID || null,

    // Rust+ channels (chat bridge, events, smart alarms, status).
    rustplusChatChannelId: cfg.rustplusChatChannelId || null,
    rustplusEventChannelId: cfg.rustplusEventChannelId || null,
    rustplusAlarmChannelId: cfg.rustplusAlarmChannelId || cfg.logChannelId || null,
    // Chat command template for inviting players to the in-game clan/team on
    // modded servers. {steamid} is substituted with the member's SteamID64.
    rustplusInviteCommand: cfg.rustplusInviteCommand || '/clan invite {steamid}',
    popAlertChannelId:
      cfg.popAlertChannelId || cfg.logChannelId || process.env.LOG_CHANNEL_ID || null,

    // Discord role to assign per task category (the "specialists" for that work).
    specialistRoles: cfg.specialistRoles || {
      farm: null,
      pvp: null,
      build: null,
      scout: null,
      defend: null,
    },

    // Promotion thresholds: Recruit -> Member.
    promotion: {
      hours: cfg.promotion?.hours ?? 10,
      raids: cfg.promotion?.raids ?? 1,
      days: cfg.promotion?.days ?? 3,
    },

    // Leaderboard scoring weights: score = hours×H + raids×R + tasks×T.
    scoring: {
      hours: cfg.scoring?.hours ?? 10,
      raids: cfg.scoring?.raids ?? 25,
      tasks: cfg.scoring?.tasks ?? 15,
    },

    // Feature modules — turning one off disables its slash commands entirely.
    // Managed from the web dashboard; everything defaults to enabled.
    modules: {
      tracking: cfg.modules?.tracking ?? true,
      tasks: cfg.modules?.tasks ?? true,
      wipe: cfg.modules?.wipe ?? true,
      intel: cfg.modules?.intel ?? true,
      polls: cfg.modules?.polls ?? true,
      allies: cfg.modules?.allies ?? true,
      clan: cfg.modules?.clan ?? true,
      battlemetrics: cfg.modules?.battlemetrics ?? true,
      rustplus: cfg.modules?.rustplus ?? true,
    },

    // BattleMetrics credentials (dashboard-managed; env vars as fallback).
    battlemetrics: {
      serverId: cfg.battlemetrics?.serverId || process.env.BATTLEMETRICS_SERVER_ID || null,
      apiToken: cfg.battlemetrics?.apiToken || process.env.BATTLEMETRICS_API_TOKEN || null,
    },

    // Population-alert tuning.
    popAlert: {
      // Fraction of max players that counts as "popping" (0-1).
      highFraction: cfg.popAlert?.highFraction ?? 0.85,
      // Alert when a queue forms.
      alertOnQueue: cfg.popAlert?.alertOnQueue ?? true,
      // Minimum minutes between alerts.
      cooldownMin: cfg.popAlert?.cooldownMin ?? 60,
    },

    // Master automation toggles (default ON except the destructive auto-wipe-reset).
    automation: {
      autoWipeReset: cfg.automation?.autoWipeReset ?? false,
      autoCheckInOut: cfg.automation?.autoCheckInOut ?? true,
      autoPromote: cfg.automation?.autoPromote ?? true,
      // Assign the Unverified role automatically when someone joins.
      autoUnverifiedRole: cfg.automation?.autoUnverifiedRole ?? true,
      // Grant the verified rank (and drop Unverified) the moment a member links an ID.
      autoVerifyOnLink: cfg.automation?.autoVerifyOnLink ?? true,
      // Approve applications instantly on submit (skip officer review).
      autoApproveApplications: cfg.automation?.autoApproveApplications ?? false,
      popAlerts: cfg.automation?.popAlerts ?? true,
      preWipeReminders: cfg.automation?.preWipeReminders ?? true,
      raidReminders: cfg.automation?.raidReminders ?? true,
      autoTasks: cfg.automation?.autoTasks ?? true,
      livePop: cfg.automation?.livePop ?? true,
      autoLeaderboard: cfg.automation?.autoLeaderboard ?? true,
      enemyAlerts: cfg.automation?.enemyAlerts ?? true,
      vcTracking: cfg.automation?.vcTracking ?? true,
      rustplusChatBridge: cfg.automation?.rustplusChatBridge ?? true,
      rustplusEvents: cfg.automation?.rustplusEvents ?? true,
      rustplusDownedAlerts: cfg.automation?.rustplusDownedAlerts ?? true,
      rustplusAlarms: cfg.automation?.rustplusAlarms ?? true,
      // Ping @everyone (vs @here) when a smart alarm / base raid alarm fires.
      rustplusRaidPing: cfg.automation?.rustplusRaidPing ?? true,
      // Auto-send the in-game clan invite when a member is verified (modded servers).
      autoClanInvite: cfg.automation?.autoClanInvite ?? false,
    },
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
