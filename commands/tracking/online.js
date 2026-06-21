'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const bm = require('../../utils/battlemetrics');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('online')
    .setDescription('Show clan members currently in-game.'),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.RECRUIT))) return;

    const members = db.read('members');
    const online = Object.entries(members)
      .filter(([, m]) => m.online && m.bmPlayerId)
      .map(([id, m]) => ({ id, m }))
      .sort((a, b) => (b.m.currentWipeHours || 0) - (a.m.currentWipeHours || 0));

    if (!bm.serverId()) {
      return interaction.reply({
        embeds: [
          embeds.info(
            'Live status unavailable',
            'No BattleMetrics server is linked, so live in-game status isn’t tracked. ' +
              'A leader can run `/setserver`.',
          ),
        ],
        ephemeral: true,
      });
    }

    if (online.length === 0) {
      return interaction.reply({
        embeds: [embeds.info('🟢 Online Now', '*No clan members are in-game right now.*')],
      });
    }

    const lines = online.map(
      ({ id, m }) =>
        `🟢 <@${id}>${m.ingameName ? ` (${m.ingameName})` : ''} — ` +
        `${time.formatHours(m.currentWipeHours || 0)} this wipe`,
    );

    const embed = embeds.success(`Online Now (${online.length})`, lines.join('\n'));
    return interaction.reply({ embeds: [embed] });
  },
};
