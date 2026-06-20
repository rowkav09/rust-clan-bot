'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wipe-history')
    .setDescription('View results from past wipes.')
    .addIntegerOption((o) =>
      o
        .setName('wipe_number')
        .setDescription('A specific wipe number to inspect (omit to list all).')
        .setMinValue(1),
    ),

  async execute(interaction) {
    const lb = db.read('leaderboard');
    const wipes = Array.isArray(lb.wipes) ? lb.wipes : [];

    if (wipes.length === 0) {
      return interaction.reply({
        embeds: [
          embeds.info('No wipe history', 'No wipes have been archived yet. Run `/wipereset` to close a wipe.'),
        ],
        ephemeral: true,
      });
    }

    const wantNumber = interaction.options.getInteger('wipe_number');

    // ── Detailed single-wipe view ────────────────────────────────────
    if (wantNumber) {
      const w = wipes.find((x) => x.wipeNumber === wantNumber);
      if (!w) {
        return interaction.reply({
          embeds: [embeds.error('Not found', `No archived data for wipe #${wantNumber}.`)],
          ephemeral: true,
        });
      }

      const entries = Object.entries(w.entries || {})
        .map(([id, e]) => ({ id, ...e }))
        .sort((a, b) => b.score - a.score);

      const body =
        entries.length === 0
          ? '*No tracked entries for this wipe.*'
          : entries
              .slice(0, 10)
              .map((e, i) => {
                const rank = MEDALS[i] || `\`#${i + 1}\``;
                return `${rank} <@${e.id}> │ ${time.formatHours(e.hours || 0)} │ ${e.raids || 0} raids │ ${e.tasks || 0} tasks │ **${e.score || 0}**`;
              })
              .join('\n');

      const embed = embeds.leaderboard(
        `🏆 Wipe #${w.wipeNumber} — Final Results`,
        `*${w.wipeStart ? time.shortDateTime(w.wipeStart) : '?'} → ` +
          `${w.wipeEnd ? time.shortDateTime(w.wipeEnd) : '?'}*\n\n${body}`,
      );
      return interaction.reply({ embeds: [embed] });
    }

    // ── Overview of all wipes ────────────────────────────────────────
    const lines = wipes
      .slice()
      .sort((a, b) => b.wipeNumber - a.wipeNumber)
      .map((w) => {
        const entries = Object.entries(w.entries || {}).sort(
          (a, b) => (b[1].score || 0) - (a[1].score || 0),
        );
        const winner = entries.length ? `<@${entries[0][0]}> (${entries[0][1].score} pts)` : '—';
        return (
          `**Wipe #${w.wipeNumber}** · ${w.wipeStart ? time.shortDateTime(w.wipeStart) : '?'} → ` +
          `${w.wipeEnd ? time.shortDateTime(w.wipeEnd) : '?'}\n` +
          `└ 🥇 MVP: ${winner}`
        );
      });

    const embed = embeds.leaderboard('🏆 Wipe History', lines.join('\n\n'));
    embed.setFooter({ text: 'Use /wipe-history <number> for full results' });
    return interaction.reply({ embeds: [embed] });
  },
};
