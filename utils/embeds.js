'use strict';

const { EmbedBuilder } = require('discord.js');

/** Brand colours per the style guide. */
const COLORS = {
  info: 0x2c2f33,
  success: 0x57f287,
  warning: 0xfee75c,
  error: 0xed4245,
  leaderboard: 0xe67e22,
  wipe: 0x3498db,
};

const EMOJI = {
  done: '✅',
  denied: '❌',
  failed: '❌',
  pending: '⏳',
  in_progress: '🔄',
  warning: '⚠️',
  leaderboard: '🏆',
  raid: '💀',
  intel: '🔍',
  poll: '📊',
};

function base(color) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: 'Rust Clan Bot' })
    .setTimestamp();
}

function info(title, description) {
  const e = base(COLORS.info);
  if (title) e.setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

function success(title, description) {
  const e = base(COLORS.success);
  if (title) e.setTitle(`✅ ${title}`);
  if (description) e.setDescription(description);
  return e;
}

function warning(title, description) {
  const e = base(COLORS.warning);
  if (title) e.setTitle(`⚠️ ${title}`);
  if (description) e.setDescription(description);
  return e;
}

function error(title, description) {
  const e = base(COLORS.error);
  if (title) e.setTitle(`❌ ${title}`);
  if (description) e.setDescription(description);
  return e;
}

function leaderboard(title, description) {
  const e = base(COLORS.leaderboard);
  if (title) e.setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

function wipe(title, description) {
  const e = base(COLORS.wipe);
  if (title) e.setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

/** Attach the guild icon as a thumbnail when available. */
function withGuildIcon(embed, guild) {
  if (guild && guild.iconURL) {
    const url = guild.iconURL({ size: 128 });
    if (url) embed.setThumbnail(url);
  }
  return embed;
}

module.exports = {
  COLORS,
  EMOJI,
  info,
  success,
  warning,
  error,
  leaderboard,
  wipe,
  withGuildIcon,
};
