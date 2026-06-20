'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const clan = require('../../utils/clan');
const { requireTier, TIER } = require('../../utils/permissions');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the clan leaderboard.')
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('Which leaderboard to show (default: current wipe).')
        .addChoices(
          { name: 'Current Wipe', value: 'wipe' },
          { name: 'All-Time', value: 'alltime' },
        ),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.RECRUIT))) return;

    const type = interaction.options.getString('type') || 'wipe';
    const members = db.read('members');
    const wipe = db.read('wipe');

    const rows = Object.entries(members).map(([id, m]) => {
      if (type === 'alltime') {
        return {
          id,
          name: m.username,
          hours: m.totalHours || 0,
          raids: m.totalRaids || 0,
          tasks: m.tasksCompleted || 0,
          score: clan.allTimeScore(m),
        };
      }
      return {
        id,
        name: m.username,
        hours: m.currentWipeHours || 0,
        raids: m.wipeRaids || 0,
        tasks: m.currentWipeTasks || 0,
        score: clan.wipeScore(m),
      };
    });

    rows.sort((a, b) => b.score - a.score || b.hours - a.hours);
    const top = rows.slice(0, 10);

    let description;
    if (top.length === 0) {
      description = '*No tracked activity yet. Use `/checkin` to get on the board!*';
    } else {
      description = top
        .map((r, i) => {
          const rank = MEDALS[i] || `\`#${i + 1}\``;
          return (
            `${rank} **${r.name}** │ ${time.formatHours(r.hours)} │ ` +
            `${r.raids} raids │ ${r.tasks} tasks │ **Score: ${r.score}**`
          );
        })
        .join('\n');
    }

    const title =
      type === 'alltime'
        ? '🏆  ALL-TIME LEADERBOARD'
        : `🏆  WIPE #${wipe.wipeNumber || 1} LEADERBOARD`;

    const subtitle =
      type === 'alltime'
        ? 'Cumulative across all wipes'
        : `Since ${wipe.wipeStart ? time.shortDateTime(wipe.wipeStart) : 'wipe start'} — ongoing`;

    const embed = embeds.leaderboard(title, `*${subtitle}*\n\n${description}`);
    embeds.withGuildIcon(embed, interaction.guild);
    return interaction.reply({ embeds: [embed] });
  },
};
