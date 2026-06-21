'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const wipeinfo = require('../../utils/wipeinfo');
const { requireTier, TIER } = require('../../utils/permissions');

/** Build the wipe-info embed from freshly-refreshed data. */
function buildInfoEmbed() {
  const next = wipeinfo.getNextWipe();
  const remaining = next.date.getTime() - Date.now();
  const wipe = db.read('wipe');
  const link = wipeinfo.serverLink();

  const sourceNote =
    next.source === 'battlemetrics'
      ? `Live from BattleMetrics${next.type ? ` · ${wipeinfo.wipeTypeLabel(next.type)}` : ''}`
      : 'Estimated from configured schedule';

  const embed = embeds
    .wipe(
      '⏳ Next Wipe Countdown',
      `**${time.formatDuration(remaining)}** remaining\n\n` +
        `Wipe lands ${time.full(next.date)} (${time.relative(next.date)})\n` +
        `*${sourceNote}*`,
    )
    .addFields(
      { name: 'Current Wipe', value: `#${wipe.wipeNumber || 1}`, inline: true },
      { name: 'Server', value: wipe.serverName || '—', inline: true },
      { name: 'Map', value: `${wipe.mapSize || '—'} · seed ${wipe.mapSeed || '—'}`, inline: true },
    );

  // Upcoming wipe schedule from BattleMetrics.
  if (Array.isArray(wipe.wipeSchedule) && wipe.wipeSchedule.length) {
    const upcoming = wipe.wipeSchedule
      .filter((w) => w.timestamp && new Date(w.timestamp).getTime() > Date.now())
      .slice(0, 4)
      .map((w) => `${wipeinfo.wipeTypeLabel(w.type)} — ${time.relative(w.timestamp)}`)
      .join('\n');
    if (upcoming) embed.addFields({ name: 'Upcoming Schedule', value: upcoming });
  }

  // Planned server switches (clan plays a different server some weeks).
  if (Array.isArray(wipe.serverSchedule) && wipe.serverSchedule.length) {
    const planned = [...wipe.serverSchedule]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4)
      .map((s) => `\`${s.id}\`${s.label ? ` (${s.label})` : ''} — ${time.relative(s.date)}`)
      .join('\n');
    if (planned) embed.addFields({ name: '📅 Planned Servers', value: planned });
  }

  if (wipe.connect) embed.addFields({ name: '🔌 Connect', value: `\`\`\`client.connect ${wipe.connect}\`\`\`` });
  if (link) embed.addFields({ name: '🔗 BattleMetrics', value: `[View server page](${link})` });
  if (wipe.mapUrl) embed.addFields({ name: '🗺️ Map', value: `[Open on RustMaps](${wipe.mapUrl})` });
  if (wipe.mapImage || wipe.headerImage) embed.setThumbnail(wipe.mapImage || wipe.headerImage);

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wipe')
    .setDescription('Wipe countdown, tracked server, and per-week server scheduling.')
    .addSubcommand((s) =>
      s.setName('info').setDescription('Show the wipe countdown + server info (refreshes live from BattleMetrics).'),
    )
    .addSubcommand((s) =>
      s
        .setName('server')
        .setDescription('Switch the tracked BattleMetrics server now (Leader).')
        .addStringOption((o) =>
          o
            .setName('battlemetrics_id')
            .setDescription('BattleMetrics server ID (the digits in the server URL).')
            .setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('plan')
        .setDescription('Schedule a server to start tracking at a future time (Leader).')
        .addStringOption((o) =>
          o.setName('battlemetrics_id').setDescription('BattleMetrics server ID to switch to.').setRequired(true),
        )
        .addStringOption((o) =>
          o
            .setName('date')
            .setDescription('When to switch, e.g. 2026-06-26 19:00 (server local time).')
            .setRequired(true),
        )
        .addStringOption((o) => o.setName('label').setDescription('Optional label (e.g. “Rustafied EU Thursday”).')),
    )
    .addSubcommand((s) => s.setName('plan-clear').setDescription('Clear all scheduled server switches (Leader).')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── /wipe info ─────────────────────────────────────────────────────
    if (sub === 'info') {
      await interaction.deferReply();
      try {
        await wipeinfo.refreshFromBM(); // pull the freshest data on demand
      } catch (e) {
        console.error('[wipe] refresh failed:', e.message);
      }
      return interaction.editReply({ embeds: [buildInfoEmbed()] });
    }

    // ── /wipe server (switch now) ──────────────────────────────────────
    if (sub === 'server') {
      if (!(await requireTier(interaction, TIER.LEADER))) return;
      const id = interaction.options.getString('battlemetrics_id', true).trim();
      await interaction.deferReply({ ephemeral: true });

      const res = await wipeinfo.setActiveServer(id);
      if (!res.ok) {
        return interaction.editReply({
          embeds: [
            embeds.error(
              'Could not reach that server',
              `BattleMetrics returned no data for ID \`${id}\`. Double-check the ID and try again.`,
            ),
          ],
        });
      }

      const next = wipeinfo.getNextWipe();
      return interaction.editReply({
        embeds: [
          embeds.success(
            res.changed ? 'Switched server' : 'Server confirmed',
            `Now tracking **${res.server.name}** (${res.server.players}/${res.server.maxPlayers}).\n` +
              `Map: ${res.server.mapSize || '?'} · seed ${res.server.mapSeed || '?'}\n` +
              (next.source === 'battlemetrics'
                ? `Next wipe: ${time.relative(next.date)}${next.type ? ` (${wipeinfo.wipeTypeLabel(next.type)})` : ''}\n`
                : '') +
              `[View on BattleMetrics](${res.server.link})` +
              (res.rebased
                ? `\n\n🔄 Re-baselined **${res.rebased}** linked member(s) so their playtime tracks correctly.` +
                  (res.changed
                    ? '\n*Tip: run `/wipereset` if you also want to archive last wipe and reset the leaderboard.*'
                    : '')
                : ''),
          ),
        ],
      });
    }

    // ── /wipe plan (schedule a future switch) ──────────────────────────
    if (sub === 'plan') {
      if (!(await requireTier(interaction, TIER.LEADER))) return;
      const id = interaction.options.getString('battlemetrics_id', true).trim();
      const dateInput = interaction.options.getString('date', true).trim();
      const label = interaction.options.getString('label')?.trim() || null;

      // Accept "2026-06-26 19:00" as well as ISO "2026-06-26T19:00".
      const parsed = new Date(dateInput.replace(' ', 'T'));
      if (Number.isNaN(parsed.getTime())) {
        return interaction.reply({
          embeds: [
            embeds.error(
              'Bad date',
              'I couldn’t read that date. Use a format like `2026-06-26 19:00` or `2026-06-26T19:00`.',
            ),
          ],
          ephemeral: true,
        });
      }
      if (parsed.getTime() <= Date.now()) {
        return interaction.reply({
          embeds: [embeds.error('Date in the past', 'Pick a time in the future for the switch.')],
          ephemeral: true,
        });
      }

      const wipe = db.read('wipe');
      if (!Array.isArray(wipe.serverSchedule)) wipe.serverSchedule = [];
      wipe.serverSchedule.push({ id, date: parsed.toISOString(), label });
      db.write('wipe', wipe);

      return interaction.reply({
        embeds: [
          embeds.success(
            'Server scheduled',
            `Will switch tracking to \`${id}\`${label ? ` (**${label}**)` : ''} ${time.relative(parsed)}.\n` +
              'Members will be re-baselined automatically when it activates.',
          ),
        ],
        ephemeral: true,
      });
    }

    // ── /wipe plan-clear ───────────────────────────────────────────────
    if (sub === 'plan-clear') {
      if (!(await requireTier(interaction, TIER.LEADER))) return;
      const wipe = db.read('wipe');
      const had = Array.isArray(wipe.serverSchedule) ? wipe.serverSchedule.length : 0;
      wipe.serverSchedule = [];
      db.write('wipe', wipe);
      return interaction.reply({
        embeds: [embeds.success('Schedule cleared', `Removed ${had} planned server switch(es).`)],
        ephemeral: true,
      });
    }
  },
};
