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

/** The rank application form. Steam/ID is collected separately (Link ID), so it's not here. */
function buildApplyModal() {
  const modal = new ModalBuilder().setCustomId('apply_modal').setTitle('Rank Application');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('age').setLabel('How old are you?').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10),
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

/**
 * Open the rank application — but only once the member has linked an ID.
 * Used by the /apply command and the Clan Hub "Apply for Rank" button.
 */
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

  // Verification requires a linked ID first.
  const rec = db.read('members')[interaction.user.id];
  if (!rec || (!rec.steamId && !rec.bmPlayerId)) {
    return interaction.reply({
      embeds: [
        embeds.warning(
          'Link your ID first',
          'Before applying for a rank you must link your Steam / BattleMetrics ID so we can ' +
            'verify your hours.\n\nUse the **🆔 Link ID** button on the clan panel, or run `/setsteam`.',
        ),
      ],
      ephemeral: true,
    });
  }

  return interaction.showModal(buildApplyModal());
}

module.exports = {
  data: new SlashCommandBuilder().setName('apply').setDescription('Apply to join the clan (requires a linked ID).'),

  async execute(interaction) {
    return openApplication(interaction);
  },

  // Exposed so the Clan Hub panel can reuse the exact same flow.
  openApplication,

  buttons: {
    // Legacy standalone apply panel button (kept working if any old panels exist).
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

      // Pull verification data from the member's linked ID.
      const rec = db.read('members')[interaction.user.id] || {};
      const steamId = rec.steamId || null;

      let rustHours = 'Not verified';
      let vetting = '';
      if (steam.hasKey() && steamId) {
        const r = await steam.getRustHours(steamId);
        if (r) {
          rustHours = `${r.hours}h (✅ verified via Steam)`;
          vetting = r.hours < 500 ? '⚠️ Below 500h' : '✅ Experienced';
        } else {
          rustHours = 'Unknown — private profile';
          vetting = '⚠️ Could not verify';
        }
      } else if (rec.steamRustHours != null) {
        rustHours = `${rec.steamRustHours}h (linked)`;
      }

      const idDisplay = steamId
        ? `https://steamcommunity.com/profiles/${steamId}`
        : rec.bmPlayerId
          ? `BattleMetrics player ${rec.bmPlayerId}`
          : 'linked';

      const id = genId();
      const app = {
        id,
        userId: interaction.user.id,
        username: interaction.user.username,
        age: interaction.fields.getTextInputValue('age').trim(),
        steamProfile: idDisplay,
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

      // ── Auto-approve path (verify immediately, skip officer review) ──
      const autoApprove = cfg.automation.autoApproveApplications;
      let autoRoleNote = '';
      if (autoApprove) {
        app.status = 'approved';
        app.reviewedBy = 'auto';
        if (!cfg.recruitRoleId) {
          autoRoleNote = '\n⚠️ No verified role is configured — a leader should set one with `/setup`.';
        } else {
          const v = await clan.verifyMember(interaction.guild, interaction.user.id);
          if (!v.roleOk) {
            autoRoleNote = `\n⚠️ Could not assign the verified role: ${clan.roleErrorText(v.reason, cfg.recruitRoleId)}`;
          }
        }
      }

      const statusValue = (autoApprove ? '✅ Auto-approved' : '⏳ Pending') + (vetting ? ` · ${vetting}` : '');

      const embed = embeds
        .info(`📥 Rank Application — ${interaction.user.tag}`)
        .setColor(autoApprove ? embeds.COLORS.success : embeds.COLORS.info)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: 'Applicant', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Age', value: app.age, inline: true },
          { name: 'Rust Hours', value: rustHours, inline: true },
          { name: 'Linked ID', value: app.steamProfile.slice(0, 1024) },
          { name: 'Previous Clans', value: app.previousClans.slice(0, 1024) },
          { name: 'Availability', value: app.availability.slice(0, 1024) },
          { name: 'Why Join', value: app.whyJoin.slice(0, 1024) },
          { name: 'Status', value: statusValue, inline: true },
        )
        .setFooter({ text: `Application ID: ${id}` });

      const components = autoApprove
        ? []
        : [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`app_accept:${id}`).setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('✅'),
              new ButtonBuilder().setCustomId(`app_deny:${id}`).setLabel('Deny').setStyle(ButtonStyle.Danger).setEmoji('❌'),
            ),
          ];

      // ── Private ticket thread for officers (manual review only) ──────
      let destination = channel;
      let ticketNote = '';
      if (!autoApprove) {
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
      }

      const headerContent = autoApprove
        ? `✅ Auto-approved application — <@${interaction.user.id}> verified.`
        : cfg.officerRoleId
          ? `<@&${cfg.officerRoleId}> new application`
          : 'New application';
      const msg = await destination.send({ content: headerContent, embeds: [embed], components }).catch(() => null);
      if (msg) app.messageId = msg.id;

      const apps = db.read('applications');
      apps[id] = app;
      db.write('applications', apps);

      try {
        const dm = autoApprove
          ? embeds.success(
              'You’re verified! 🎉',
              'Your application was approved automatically. Welcome to the clan! ' +
                'Use `/checkin` when you go in-game and `/help` to see what you can do.',
            )
          : embeds.info('Application submitted', 'Thanks! Officers will review it and you’ll get a DM with the outcome.');
        await interaction.user.send({ embeds: [dm] });
      } catch { /* DMs closed */ }

      return interaction.editReply({
        embeds: [
          autoApprove
            ? embeds.success('Approved! 🎉', 'You’ve been verified and given access. Welcome aboard! 🦀' + autoRoleNote)
            : embeds.success('Application submitted', 'Thanks! Officers will review it and you’ll get a DM with the outcome.' + ticketNote),
        ],
      });
    },
  },
};
