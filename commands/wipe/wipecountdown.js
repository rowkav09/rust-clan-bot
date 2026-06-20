'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wipecountdown')
    .setDescription('Show the time remaining until the next wipe.'),

  async execute(interaction) {
    const wipeDay = parseInt(process.env.WIPE_DAY ?? '4', 10);
    const wipeHour = parseInt(process.env.WIPE_HOUR ?? '19', 10);
    const next = time.nextWipe(wipeDay, wipeHour);
    const remaining = next.getTime() - Date.now();

    const wipe = db.read('wipe');
    const embed = embeds
      .wipe(
        '⏳ Next Wipe Countdown',
        `**${time.formatDuration(remaining)}** remaining\n\n` +
          `Wipe lands ${time.full(next)} (${time.relative(next)})`,
      )
      .addFields(
        { name: 'Current Wipe', value: `#${wipe.wipeNumber || 1}`, inline: true },
        { name: 'Server', value: wipe.serverName || '—', inline: true },
        { name: 'Map Size', value: wipe.mapSize ? String(wipe.mapSize) : '—', inline: true },
      );

    return interaction.reply({ embeds: [embed] });
  },
};
