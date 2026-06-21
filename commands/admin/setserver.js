'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const bm = require('../../utils/battlemetrics');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setserver')
    .setDescription('Link the clan’s BattleMetrics server (Leader only).')
    .addStringOption((o) =>
      o
        .setName('battlemetrics_server_id')
        .setDescription('The BattleMetrics server ID (digits from the server URL).')
        .setRequired(true),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.LEADER))) return;

    const id = interaction.options.getString('battlemetrics_server_id', true).trim();
    await interaction.deferReply({ ephemeral: true });

    const server = await bm.getServer(id, false);
    if (!server) {
      return interaction.editReply({
        embeds: [
          embeds.error(
            'Could not reach that server',
            `BattleMetrics returned no data for ID \`${id}\`. Double-check the ID and try again.`,
          ),
        ],
      });
    }

    const wipe = db.read('wipe');
    wipe.battlemetricsServerId = id;
    db.write('wipe', wipe);

    // Pull the live wipe schedule + map info now that the server is linked.
    const wipeinfo = require('../../utils/wipeinfo');
    await wipeinfo.refreshFromBM();
    const next = wipeinfo.getNextWipe();
    const time = require('../../utils/time');

    return interaction.editReply({
      embeds: [
        embeds.success(
          'Server linked',
          `**${server.name}**\n` +
            `Players: ${server.players}/${server.maxPlayers}\n` +
            `Map: ${server.mapSize || '?'} · seed ${server.mapSeed || '?'}\n` +
            (next.source === 'battlemetrics'
              ? `Next wipe: ${time.relative(next.date)}${next.type ? ` (${wipeinfo.wipeTypeLabel(next.type)})` : ''}\n`
              : '') +
            `[View on BattleMetrics](${server.link})\n\n` +
            'Live status, **auto wipe schedule**, and (with an API token) auto time-tracking are now enabled.',
        ),
      ],
    });
  },
};
