'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const { requireTier, TIER } = require('../../utils/permissions');

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

      const { performWipeReset } = require('../../utils/wipereset');
      const { archive, wipeNumber } = await performWipeReset(client);

      return interaction.editReply({
        embeds: [
          embeds.success(
            'Wipe reset complete',
            `Wipe #${archive.wipeNumber} archived. Now on **Wipe #${wipeNumber}**.`,
          ),
        ],
      });
    },
  },
};
