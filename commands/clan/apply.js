'use strict';

const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const clan = require('../../utils/clan');
const { genId } = require('../../utils/ids');
const { getConfig, isMember } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Apply to join the clan.'),

  async execute(interaction) {
    if (isMember(interaction.member)) {
      return interaction.reply({
        embeds: [embeds.info('Already a member', 'You are already part of the clan! 🦀')],
        ephemeral: true,
      });
    }

    const cfg = getConfig();
    if (!cfg.applicationChannelId) {
      return interaction.reply({
        embeds: [
          embeds.error(
            'Applications not set up',
            'No application channel is configured yet. Ask a leader to run `/setup`.',
          ),
        ],
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder().setCustomId('apply_modal').setTitle('Clan Application');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('age')
          .setLabel('How old are you?')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(10),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('rustHours')
          .setLabel('How many hours do you have in Rust?')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(20),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('previousClans')
          .setLabel('What previous clans have you been in?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('availability')
          .setLabel('What is your weekly availability?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('whyJoin')
          .setLabel('Why do you want to join?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true),
      ),
    );

    await interaction.showModal(modal);
  },

  modals: {
    async apply_modal(interaction, args, client) {
      await interaction.deferReply({ ephemeral: true });

      const cfg = getConfig();
      const channel = await clan.fetchChannel(client, cfg.applicationChannelId);
      if (!channel || !channel.isTextBased?.()) {
        return interaction.editReply({
          embeds: [embeds.error('Submission failed', 'The application channel is unavailable.')],
        });
      }

      const id = genId();
      const app = {
        id,
        userId: interaction.user.id,
        username: interaction.user.username,
        age: interaction.fields.getTextInputValue('age').trim(),
        rustHours: interaction.fields.getTextInputValue('rustHours').trim(),
        previousClans: interaction.fields.getTextInputValue('previousClans').trim() || 'None',
        availability: interaction.fields.getTextInputValue('availability').trim(),
        whyJoin: interaction.fields.getTextInputValue('whyJoin').trim(),
        status: 'pending',
        submittedAt: new Date().toISOString(),
        reviewedBy: null,
        messageId: null,
      };

      const embed = embeds
        .info(`📥 Application — ${interaction.user.tag}`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: 'Applicant', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Age', value: app.age, inline: true },
          { name: 'Rust Hours', value: app.rustHours, inline: true },
          { name: 'Previous Clans', value: app.previousClans.slice(0, 1024) },
          { name: 'Availability', value: app.availability.slice(0, 1024) },
          { name: 'Why Join', value: app.whyJoin.slice(0, 1024) },
          { name: 'Status', value: '⏳ Pending', inline: true },
        )
        .setFooter({ text: `Application ID: ${id}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`app_accept:${id}`).setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId(`app_deny:${id}`).setLabel('Deny').setStyle(ButtonStyle.Danger).setEmoji('❌'),
      );

      const msg = await channel.send({ embeds: [embed], components: [row] });
      app.messageId = msg.id;

      const apps = db.read('applications');
      apps[id] = app;
      db.write('applications', apps);

      return interaction.editReply({
        embeds: [
          embeds.success(
            'Application submitted',
            'Thanks! Your application has been sent to the officers for review. ' +
              'You’ll receive a DM with the outcome.',
          ),
        ],
      });
    },
  },
};
