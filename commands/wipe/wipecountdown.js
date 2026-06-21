'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const wipeinfo = require('../../utils/wipeinfo');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wipecountdown')
    .setDescription('Show the time remaining until the next wipe.'),

  async execute(interaction) {
    const next = wipeinfo.getNextWipe();
    const remaining = next.date.getTime() - Date.now();
    const wipe = db.read('wipe');

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

    // Show the upcoming schedule if BattleMetrics provided one.
    if (Array.isArray(wipe.wipeSchedule) && wipe.wipeSchedule.length) {
      const upcoming = wipe.wipeSchedule
        .filter((w) => w.timestamp && new Date(w.timestamp).getTime() > Date.now())
        .slice(0, 4)
        .map((w) => `${wipeinfo.wipeTypeLabel(w.type)} — ${time.relative(w.timestamp)}`)
        .join('\n');
      if (upcoming) embed.addFields({ name: 'Upcoming Schedule', value: upcoming });
    }

    if (wipe.mapImage || wipe.headerImage) embed.setThumbnail(wipe.mapImage || wipe.headerImage);

    return interaction.reply({ embeds: [embed] });
  },
};
