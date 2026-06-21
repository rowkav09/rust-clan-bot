'use strict';

const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const popstats = require('../../utils/popstats');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('popgraph')
    .setDescription('Show the server population over time.')
    .addIntegerOption((o) =>
      o.setName('hours').setDescription('How far back (default 24h).').setMinValue(1).setMaxValue(168),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.RECRUIT))) return;

    const hours = interaction.options.getInteger('hours') || 24;
    const points = popstats.recent(hours);

    if (points.length < 2) {
      return interaction.reply({
        embeds: [
          embeds.info(
            'Not enough data yet',
            'I haven’t recorded enough population samples. Check back in a little while — ' +
              'samples are taken every 5 minutes (needs a linked server).',
          ),
        ],
        ephemeral: true,
      });
    }

    const { peak, avg } = popstats.summary(points);
    const embed = embeds
      .wipe(`📊 Population — last ${hours}h`, `Peak: **${peak}** · Average: **${avg}**`)
      .setImage(popstats.chartUrl(points));

    return interaction.reply({ embeds: [embed] });
  },
};
