'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('applypanel')
    .setDescription('Post a public “Apply to join” panel with a button (Leader only).')
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Where to post the panel (defaults to here).')
        .addChannelTypes(ChannelType.GuildText),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.LEADER))) return;

    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = embeds
      .info(
        '🦀 Join the Clan',
        'Think you’ve got what it takes? Click **Apply** below to submit your ' +
          'application. We’ll review it and an officer will get back to you via DM.\n\n' +
          '**You’ll be asked for:** your age, Steam profile (for hour verification), ' +
          'past clans, availability, and why you want to join.',
      )
      .setThumbnail(interaction.guild.iconURL({ size: 128 }) || null);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('apply_panel').setLabel('Apply').setStyle(ButtonStyle.Success).setEmoji('📝'),
    );

    try {
      await channel.send({ embeds: [embed], components: [row] });
    } catch (e) {
      return interaction.reply({
        embeds: [embeds.error('Could not post', `I can’t send messages in ${channel}. Check my permissions.`)],
        ephemeral: true,
      });
    }

    return interaction.reply({
      embeds: [embeds.success('Panel posted', `Application panel posted in ${channel}.`)],
      ephemeral: true,
    });
  },
};
