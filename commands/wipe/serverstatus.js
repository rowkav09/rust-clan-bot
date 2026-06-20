'use strict';

const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const bm = require('../../utils/battlemetrics');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstatus')
    .setDescription('Show live status for the clan’s BattleMetrics server.'),

  async execute(interaction) {
    const id = bm.serverId();
    if (!id) {
      return interaction.reply({
        embeds: [
          embeds.error(
            'No server configured',
            'Ask an officer to link a server with `/setserver <battlemetrics_server_id>`.',
          ),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    const server = await bm.getServer(id, false);
    if (!server) {
      return interaction.editReply({
        embeds: [
          embeds.error(
            'Status unavailable',
            'Could not reach BattleMetrics right now. Try again shortly.',
          ),
        ],
      });
    }

    const online = server.status === 'online';
    const embed = embeds
      .wipe(`${online ? '🟢' : '🔴'} ${server.name}`)
      .addFields(
        { name: 'Status', value: server.status, inline: true },
        { name: 'Players', value: `${server.players} / ${server.maxPlayers}`, inline: true },
        { name: 'Queue', value: `${server.queue || 0}`, inline: true },
        { name: 'Map', value: String(server.mapName || 'Unknown'), inline: true },
        { name: 'Map Size', value: server.mapSize ? String(server.mapSize) : '—', inline: true },
        { name: 'Seed', value: server.mapSeed ? String(server.mapSeed) : '—', inline: true },
      )
      .setDescription(`[View on BattleMetrics](${server.link})`);

    return interaction.editReply({ embeds: [embed] });
  },
};
