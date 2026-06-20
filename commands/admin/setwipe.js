'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwipe')
    .setDescription('Update the current wipe’s metadata (Leader only).')
    .addStringOption((o) => o.setName('server_name').setDescription('Server name.'))
    .addStringOption((o) => o.setName('map_seed').setDescription('Map seed.'))
    .addIntegerOption((o) =>
      o.setName('map_size').setDescription('Map size (e.g. 3500).').setMinValue(1000).setMaxValue(6000),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.LEADER))) return;

    const serverName = interaction.options.getString('server_name');
    const mapSeed = interaction.options.getString('map_seed');
    const mapSize = interaction.options.getInteger('map_size');

    if (!serverName && !mapSeed && mapSize === null) {
      return interaction.reply({
        embeds: [embeds.error('Nothing to update', 'Provide at least one field to change.')],
        ephemeral: true,
      });
    }

    const wipe = db.read('wipe');
    if (serverName) wipe.serverName = serverName;
    if (mapSeed) wipe.mapSeed = mapSeed;
    if (mapSize !== null) wipe.mapSize = mapSize;
    db.write('wipe', wipe);

    return interaction.reply({
      embeds: [
        embeds.success(
          'Wipe details updated',
          `**Wipe #${wipe.wipeNumber || 1}**\n` +
            `Server: ${wipe.serverName || '—'}\n` +
            `Map seed: ${wipe.mapSeed || '—'}\n` +
            `Map size: ${wipe.mapSize || '—'}`,
        ),
      ],
      ephemeral: true,
    });
  },
};
