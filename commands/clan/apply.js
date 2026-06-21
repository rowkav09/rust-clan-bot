'use strict';

const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const clan = require('../../utils/clan');
const steam = require('../../utils/steam');
const { genId } = require('../../utils/ids');
const { getConfig, isMember } = require('../../utils/permissions');

function buildApplyModal() {
  const modal = new ModalBuilder().setCustomId('apply_modal').setTitle('Clan Application');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('age').setLabel('How old are you?').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('steam')
        .setLabel('Steam profile (URL, ID, or vanity name)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('steamcommunity.com/id/yourname'),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('previousClans').setLabel('Previous clans?').setStyle(TextInputStyle.Paragraph).setRequired(false),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('availability').setLabel('Weekly availability?').setStyle(TextInputStyle.Paragraph).setRequired(true),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('whyJoin').setLabel('Why do you want to join?').setStyle(TextInputStyle.Paragraph).setRequired(true),
    ),
  );
  return modal;
}

async function openApplication(interaction) {
  if (isMember(interaction.member)) {
    return interaction.reply({
      embeds: [embeds.info('Already a member', 'You are already part of the clan! 🦀')],
      ephemeral: true,
    });
  }
  const cfg = getConfig();
  if (!cfg.applicationChannelId) {
    return interaction.reply({
      embeds: [embeds.error('Applications not set up', 'No application channel is configured. Ask a leader to run `/setup`.')],
      ephemeral: true,
    });
  }
  return interaction.showModal(buildApplyModal());
}

module.exports = {
  data: new SlashCommandBuilder().setName('apply').setDescription('Apply to join the clan.'),

  async execute(interaction) {
    return openApplication(interaction);
  },

  buttons: {
    // "Apply" button on the public application panel.
    async apply_panel(interaction) {
      return openApplication(interaction);
    },
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

      const steamInput = interaction.fields.getTextInputValue('steam').trim();

      // ── Steam vetting ───────────────────────────────────────────────
      let rustHours = 'Not verified';
      let vetting = '';
      if (steam.hasKey()) {
        const r = await steam.getRustHours(steamInput);
        if (r) {
          rustHours = `${r.hours}h (✅ verified via Steam)`;
          vetting = r.hours < 500 ? '⚠️ Below 500h' : '✅ Experienced';
        } else {
          rustHours = 'Unknown — private profile or not found';
          vetting = '⚠️ Could not verify';
        }
      }

      const id = genId();
      const app = {
        id,
        userId: interaction.user.id,
        username: interaction.user.username,
        age: interaction.fields.getTextInputValue('age').trim(),
        steamProfile: steamInput,
        rustHours,
        previousClans: interaction.fields.getTextInputValue('previousClans').trim() || 'None',
        availability: interaction.fields.getTextInputValue('availability').trim(),
        whyJoin: interaction.fields.getTextInputValue('whyJoin').trim(),
        status: 'pending',
        submittedAt: new Date().toISOString(),
        reviewedBy: null,
        messageId: null,
        threadId: null,
      };

      const embed = embeds
        .info(`📥 Application — ${interaction.user.tag}`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: 'Applicant', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Age', value: app.age, inline: true },
          { name: 'Rust Hours', value: rustHours, inline: true },
          { name: 'Steam', value: app.steamProfile.slice(0, 1024) },
          { name: 'Previous Clans', value: app.previousClans.slice(0, 1024) },
          { name: 'Availability', value: app.availability.slice(0, 1024) },
          { name: 'Why Join', value: app.whyJoin.slice(0, 1024) },
          { name: 'Status', value: '⏳ Pending' + (vetting ? ` · ${vetting}` : ''), inline: true },
        )
        .setFooter({ text: `Application ID: ${id}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`app_accept:${id}`).setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId(`app_deny:${id}`).setLabel('Deny').setStyle(ButtonStyle.Danger).setEmoji('❌'),
      );

      // ── Create a private ticket thread for officers ─────────────────
      let destination = channel;
      let ticketNote = '';
      try {
        if (channel.type === ChannelType.GuildText) {
          const thread = await channel.threads.create({
            name: `app-${interaction.user.username}`.slice(0, 90),
            type: ChannelType.PrivateThread,
            invitable: false,
            reason: `Application ticket for ${interaction.user.tag}`,
          });
          await thread.members.add(interaction.user.id).catch(() => {});
          app.threadId = thread.id;
          destination = thread;
          ticketNote = `\nA private ticket was opened: <#${thread.id}>`;
        }
      } catch (e) {
        console.error('[apply] thread create failed, falling back to channel:', e.message);
      }

      const officerPing = cfg.officerRoleId ? `<@&${cfg.officerRoleId}> new application` : 'New application';
      const msg = await destination.send({ content: officerPing, embeds: [embed], components: [row] });
      app.messageId = msg.id;

      const apps = db.read('applications');
      apps[id] = app;
      db.write('applications', apps);

      return interaction.editReply({
        embeds: [
          embeds.success(
            'Application submitted',
            'Thanks! Officers will review it and you’ll get a DM with the outcome.' + ticketNote,
          ),
        ],
      });
    },
  },
};
