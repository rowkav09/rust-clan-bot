'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const clan = require('../../utils/clan');
const { requireTier, TIER, getConfig } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wipereset')
    .setDescription('Archive the current wipe and start a fresh one (Leader only).'),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.LEADER))) return;

    const wipe = db.read('wipe');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('wipereset_confirm')
        .setLabel('Confirm Reset')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('wipereset_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary),
    );

    return interaction.reply({
      embeds: [
        embeds.warning(
          `Reset Wipe #${wipe.wipeNumber || 1}?`,
          'This will:\n' +
            '• Archive all current-wipe stats to the leaderboard history\n' +
            '• Reset every member’s wipe hours, raids and tasks to zero\n' +
            '• Mark all open tasks as failed\n' +
            '• Post final results and DM each member their summary\n\n' +
            '**This cannot be undone.**',
        ),
      ],
      components: [row],
      ephemeral: true,
    });
  },

  buttons: {
    async wipereset_cancel(interaction) {
      return interaction.update({
        embeds: [embeds.info('Cancelled', 'The wipe was not reset.')],
        components: [],
      });
    },

    async wipereset_confirm(interaction, args, client) {
      if (!(await requireTier(interaction, TIER.LEADER))) return;
      await interaction.update({
        embeds: [embeds.info('Processing…', 'Archiving the wipe — this may take a moment.')],
        components: [],
      });

      const wipe = db.read('wipe');
      const members = db.read('members');
      const lb = db.read('leaderboard');
      if (!Array.isArray(lb.wipes)) lb.wipes = [];
      if (!lb.allTime) lb.allTime = {};

      const now = new Date();
      const nowIso = now.toISOString();

      // 1. Build the archive entry from current-wipe stats.
      const entries = {};
      for (const [id, m] of Object.entries(members)) {
        entries[id] = {
          hours: Number((m.currentWipeHours || 0).toFixed(2)),
          raids: m.wipeRaids || 0,
          tasks: m.currentWipeTasks || 0,
          score: clan.wipeScore(m),
        };
      }
      const archive = {
        wipeNumber: wipe.wipeNumber || 1,
        wipeStart: wipe.wipeStart || nowIso,
        wipeEnd: nowIso,
        entries,
      };
      lb.wipes.push(archive);
      db.write('leaderboard', lb);

      // 2. Compute awards for the results embed.
      const ranked = Object.entries(entries)
        .map(([id, e]) => ({ id, ...e, name: members[id]?.username || id }))
        .sort((a, b) => b.score - a.score);

      const mvp = ranked[0];
      const mostHours = [...ranked].sort((a, b) => b.hours - a.hours)[0];
      const mostRaids = [...ranked].sort((a, b) => b.raids - a.raids)[0];

      const resultsEmbed = embeds.leaderboard(
        `🏁 Wipe #${archive.wipeNumber} — Final Results`,
        `*${time.shortDateTime(archive.wipeStart)} → ${time.shortDateTime(archive.wipeEnd)}*\n\n` +
          (ranked.length
            ? ranked
                .slice(0, 10)
                .map((r, i) => {
                  const medal = ['🥇', '🥈', '🥉'][i] || `\`#${i + 1}\``;
                  return `${medal} **${r.name}** │ ${time.formatHours(r.hours)} │ ${r.raids} raids │ **${r.score}**`;
                })
                .join('\n')
            : '*No tracked activity this wipe.*'),
      );
      if (mvp && mvp.score > 0) {
        resultsEmbed.addFields(
          { name: '🏆 MVP', value: `<@${mvp.id}> (${mvp.score} pts)`, inline: true },
          { name: '⏱️ Most Hours', value: `<@${mostHours.id}> (${time.formatHours(mostHours.hours)})`, inline: true },
          { name: '💀 Most Raids', value: `<@${mostRaids.id}> (${mostRaids.raids})`, inline: true },
        );
      }

      const cfg = getConfig();
      const wipeChannel = await clan.fetchChannel(client, cfg.wipeChannelId);
      if (wipeChannel && wipeChannel.isTextBased?.()) {
        await wipeChannel.send({ embeds: [resultsEmbed] }).catch(() => {});
      }

      // 3. DM each member their personal summary, then reset their stats.
      for (const [id, m] of Object.entries(members)) {
        const personal = embeds.info(
          `Wipe #${archive.wipeNumber} Summary`,
          `Here’s how you did:\n` +
            `• Hours: **${time.formatHours(m.currentWipeHours || 0)}**\n` +
            `• Raids: **${m.wipeRaids || 0}**\n` +
            `• Tasks: **${m.currentWipeTasks || 0}**\n` +
            `• Score: **${clan.wipeScore(m)}**\n\n` +
            'A new wipe has begun — good luck! 🦀',
        );
        try {
          const user = await client.users.fetch(id);
          await user.send({ embeds: [personal] });
        } catch { /* DMs closed — skip */ }

        // Reset wipe-scoped stats.
        m.currentWipeHours = 0;
        m.wipeRaids = 0;
        m.currentWipeTasks = 0;
        m.checkInTime = null;
        m.autoTracked = false;
      }
      db.write('members', members);

      // 4. Mark all open tasks as failed.
      const tasks = db.read('tasks');
      for (const t of Object.values(tasks)) {
        if (t.status !== 'done' && t.status !== 'failed') {
          t.status = 'failed';
          t.updatedAt = nowIso;
        }
      }
      db.write('tasks', tasks);

      // 5. Advance the wipe counter.
      wipe.wipeNumber = (wipe.wipeNumber || 1) + 1;
      wipe.wipeStart = nowIso;
      wipe.wipeEnd = null;
      wipe.currentRaids = [];
      db.write('wipe', wipe);

      return interaction.editReply({
        embeds: [
          embeds.success(
            'Wipe reset complete',
            `Wipe #${archive.wipeNumber} archived. Now on **Wipe #${wipe.wipeNumber}**.`,
          ),
        ],
      });
    },
  },
};
