'use strict';

const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../utils/embeds');

const CATEGORIES = {
  tracking: {
    label: '⏱️ Time Tracking',
    commands: [
      ['/checkin', 'Start a play session.'],
      ['/checkout', 'End your session and bank the hours.'],
      ['/setbattlemetrics <player>', 'Link your BattleMetrics profile for auto-tracking.'],
      ['/setsteam <steam> [member]', 'Link a Steam profile (others = Officer+).'],
      ['/setingamename <name>', 'Set your displayed in-game name.'],
      ['/online', 'See which clan members are in-game now.'],
      ['/popgraph [hours]', 'Server population over time.'],
      ['/stats [member]', 'View play-time & activity stats.'],
    ],
  },
  leaderboard: {
    label: '🏆 Leaderboard',
    commands: [
      ['/leaderboard [type]', 'Top members this wipe or all-time.'],
      ['/wipe-history [wipe_number]', 'Past wipe results.'],
    ],
  },
  tasks: {
    label: '📋 Tasks',
    commands: [
      ['/task-assign', 'Create & assign a task (Officer+).'],
      ['/task-auto [category]', 'Auto-generate & assign tasks (Officer+).'],
      ['/task-status <id> <status>', 'Update a task’s status.'],
      ['/task-list [filters]', 'List tasks.'],
      ['/task-delete <id>', 'Delete a task (Officer+).'],
    ],
  },
  wipe: {
    label: '💀 Wipe & Raids',
    commands: [
      ['/wipe info', 'Countdown + server info (refreshes live).'],
      ['/wipe server <id>', 'Switch the tracked BattleMetrics server (Leader).'],
      ['/wipe plan <id> <date>', 'Schedule a server for a future wipe (Leader).'],
      ['/raid', 'Schedule a raid with RSVPs (Member+).'],
      ['/serverstatus', 'Live BattleMetrics server status.'],
    ],
  },
  rustplus: {
    label: '🎮 Rust+',
    commands: [
      ['/rustplus pair', 'How to pair the bot with your server.'],
      ['/rustplus status', 'Connection + live server status.'],
      ['/rustplus say <message>', 'Send to in-game team chat (Member+).'],
      ['/rustplus map', 'Post the live in-game map (Member+).'],
      ['/rustplus invite [member|steamid]', 'In-game clan invite — modded (Officer+).'],
      ['/rustplus channel <type> <channel>', 'Set chat/events/alarm channels (Leader).'],
    ],
  },
  clan: {
    label: '🦀 Clan',
    commands: [
      ['/panel [channel]', 'Post the all-in-one clan hub: ID, rank, roles (Leader).'],
      ['/rules [channel]', 'Show the clan rules (post publicly = Leader).'],
      ['/apply', 'Apply for a rank (requires a linked ID).'],
      ['/application-review [id]', 'Review applications (Officer+).'],
      ['/verify-sync', 'Unverify ID-less members + post all IDs (Leader).'],
      ['/warn <member> ...', 'Issue a warning (Officer+).'],
      ['/warnings <member>', 'List active warnings (Officer+).'],
      ['/clearwarning <id>', 'Clear a warning (Leader).'],
      ['/activity', 'List inactive members (Officer+).'],
      ['/member-info [member]', 'Member profile, stats & Rust hours.'],
      ['/dashboard', 'Clan health overview (Officer+).'],
    ],
  },
  intel: {
    label: '🔍 Intel',
    commands: [
      ['/note-add ...', 'Add an intel note (Officer+).'],
      ['/note-list [type]', 'Browse intel notes (Member+).'],
      ['/note-delete <id>', 'Delete a note (Officer+).'],
      ['/enemy add|list|remove', 'Track rivals + online alerts.'],
    ],
  },
  polls: {
    label: '📊 Polls',
    commands: [['/poll <question> <options> [hours]', 'Create a poll (Member+).']],
  },
  allies: {
    label: '🤝 Allies',
    commands: [
      ['/ally add ...', 'Track a clan (Officer+).'],
      ['/ally list [status]', 'List tracked clans (Member+).'],
      ['/ally update <id> ...', 'Update a clan (Officer+).'],
      ['/ally remove <id>', 'Remove a clan (Leader).'],
    ],
  },
  admin: {
    label: '⚙️ Admin',
    commands: [
      ['/setup', 'Configure roles & channels (Leader).'],
      ['/automation ...', 'Configure automation features (Leader).'],
      ['/setwipe ...', 'Edit wipe metadata (Leader).'],
      ['/wipe server <id>', 'Link/switch BattleMetrics server (Leader).'],
      ['/wipereset', 'Archive wipe & start fresh (Leader).'],
    ],
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List the bot’s commands.')
    .addStringOption((o) =>
      o
        .setName('category')
        .setDescription('Show one category only.')
        .addChoices(
          ...Object.entries(CATEGORIES).map(([value, c]) => ({
            name: c.label.replace(/^\S+\s/, ''),
            value,
          })),
        ),
    ),

  async execute(interaction) {
    const category = interaction.options.getString('category');

    if (category && CATEGORIES[category]) {
      const c = CATEGORIES[category];
      const embed = embeds.info(
        `${c.label} — Commands`,
        c.commands.map(([cmd, desc]) => `**${cmd}**\n${desc}`).join('\n\n'),
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = embeds.info(
      '🦀 Rust Clan Bot — Help',
      'Use `/help <category>` for details on any group.',
    );
    for (const c of Object.values(CATEGORIES)) {
      embed.addFields({
        name: c.label,
        value: c.commands.map(([cmd]) => `\`${cmd.split(' ')[0]}\``).join(' · '),
      });
    }
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
