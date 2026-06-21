'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require('discord.js');
const embeds = require('../../utils/embeds');
const clan = require('../../utils/clan');
const steam = require('../../utils/steam');
const { linkMemberBySteam } = require('../../utils/linkplayer');
const { requireTier, TIER, getConfig } = require('../../utils/permissions');
const apply = require('./apply');

// Specialist role catalogue: category → emoji + display label.
const ROLES = [
  ['farm', '🌾', 'Farmer'],
  ['pvp', '⚔️', 'PvPer'],
  ['build', '🏗️', 'Builder'],
  ['scout', '🔭', 'Scout'],
  ['defend', '🛡️', 'Defender'],
];
const metaFor = (cat) => ROLES.find((r) => r[0] === cat);
const configuredRoles = (cfg) => ROLES.filter(([cat]) => cfg.specialistRoles?.[cat]);

function buildIdModal() {
  return new ModalBuilder()
    .setCustomId('hub_id_modal')
    .setTitle('Link your ID')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('steam')
          .setLabel('Steam profile (URL, SteamID64, or vanity)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('steamcommunity.com/id/yourname'),
      ),
    );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Post the all-in-one clan panel: link ID, apply for rank, request roles (Leader).')
    .addChannelOption((o) =>
      o.setName('channel').setDescription('Where to post (defaults to here).').addChannelTypes(ChannelType.GuildText),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.LEADER))) return;

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const embed = embeds
      .info(
        '🦀 Clan Hub',
        '**Everything in one place.**\n\n' +
          '🆔 **Link ID** — connect your Steam / BattleMetrics so we can track & verify your hours. ' +
          '*(Do this first.)*\n' +
          '🎖️ **Apply for Rank** — submit a verification application. Requires a linked ID.\n' +
          '🎭 **Request Role** — pick a specialist role (Farmer, PvPer, Builder…).',
      )
      .setThumbnail(interaction.guild.iconURL({ size: 128 }) || null);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('hub_id').setLabel('Link ID').setEmoji('🆔').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('hub_rank').setLabel('Apply for Rank').setEmoji('🎖️').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('hub_role').setLabel('Request Role').setEmoji('🎭').setStyle(ButtonStyle.Secondary),
    );

    try {
      await channel.send({ embeds: [embed], components: [row] });
    } catch {
      return interaction.reply({
        embeds: [embeds.error('Could not post', `I can’t send messages in ${channel}.`)],
        ephemeral: true,
      });
    }
    return interaction.reply({
      embeds: [embeds.success('Panel posted', `Clan hub posted in ${channel}.`)],
      ephemeral: true,
    });
  },

  buttons: {
    // 🆔 Link ID → open the Steam modal.
    async hub_id(interaction) {
      return interaction.showModal(buildIdModal());
    },

    // 🎖️ Apply for Rank → the shared application flow (gated on a linked ID).
    async hub_rank(interaction) {
      return apply.openApplication(interaction);
    },

    // 🎭 Request Role → show the configured specialist roles as buttons.
    async hub_role(interaction) {
      const cfg = getConfig();
      const available = configuredRoles(cfg);
      if (available.length === 0) {
        return interaction.reply({
          embeds: [embeds.error('No roles available', 'No specialist roles are configured yet. Ask a leader to set them with `/automation specialist`.')],
          ephemeral: true,
        });
      }
      const row = new ActionRowBuilder().addComponents(
        available.map(([cat, emoji, label]) =>
          new ButtonBuilder().setCustomId(`rolereq:${cat}`).setLabel(label).setEmoji(emoji).setStyle(ButtonStyle.Secondary),
        ),
      );
      return interaction.reply({
        embeds: [
          embeds.info(
            '🎭 Request a role',
            'Click a role to **request** it (an officer approves). Already have one? Clicking removes it.',
          ),
        ],
        components: [row],
        ephemeral: true,
      });
    },

    // Member requests a specialist role.
    async rolereq(interaction, args, client) {
      const cat = args[0];
      const cfg = getConfig();
      const roleId = cfg.specialistRoles?.[cat];
      const meta = metaFor(cat);
      if (!roleId || !meta) {
        return interaction.reply({
          embeds: [embeds.error('Unavailable', 'That role isn’t configured anymore.')],
          ephemeral: true,
        });
      }

      const member = interaction.member;
      // Already have it → self-remove instantly.
      if (member.roles.cache.has(roleId)) {
        try {
          await member.roles.remove(roleId);
          return interaction.reply({
            embeds: [embeds.info('Role removed', `Removed **${meta[2]}** ${meta[1]}.`)],
            ephemeral: true,
          });
        } catch {
          return interaction.reply({
            embeds: [embeds.error('Error', 'Could not remove the role. Check my permissions.')],
            ephemeral: true,
          });
        }
      }

      // Otherwise submit a request to officers.
      const reviewChannelId = cfg.applicationChannelId || cfg.logChannelId;
      const channel = await clan.fetchChannel(client, reviewChannelId);
      if (!channel || !channel.isTextBased?.()) {
        return interaction.reply({
          embeds: [embeds.error('Requests not set up', 'No application/log channel is configured. Ask a leader to run `/setup`.')],
          ephemeral: true,
        });
      }

      const reqEmbed = embeds
        .info(`${meta[1]} Role Request — ${interaction.user.tag}`, `<@${interaction.user.id}> is requesting the **${meta[2]}** role.`)
        .setThumbnail(interaction.user.displayAvatarURL());
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`rolereq_approve:${cat}:${interaction.user.id}`).setLabel('Approve').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId(`rolereq_deny:${cat}:${interaction.user.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger).setEmoji('❌'),
      );
      const ping = cfg.officerRoleId ? `<@&${cfg.officerRoleId}>` : undefined;
      await channel.send({ content: ping, embeds: [reqEmbed], components: [row] });

      return interaction.reply({
        embeds: [embeds.success('Request submitted', `Your **${meta[2]}** request was sent to the officers for approval.`)],
        ephemeral: true,
      });
    },

    // Officer approves a role request.
    async rolereq_approve(interaction, args, client) {
      if (!(await requireTier(interaction, TIER.OFFICER))) return;
      const [cat, userId] = args;
      const cfg = getConfig();
      const roleId = cfg.specialistRoles?.[cat];
      const meta = metaFor(cat);
      if (!roleId || !meta) {
        return interaction.reply({ embeds: [embeds.error('Unavailable', 'That role isn’t configured anymore.')], ephemeral: true });
      }

      const res = await clan.assignRole(interaction.guild, userId, roleId);
      if (!res.ok) {
        return interaction.reply({
          embeds: [embeds.error('Could not assign', clan.roleErrorText(res.reason, roleId))],
          ephemeral: true,
        });
      }

      const updated = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(embeds.COLORS.success)
        .setDescription(`✅ **${meta[2]}** granted to <@${userId}> by <@${interaction.user.id}>.`);
      await interaction.update({ embeds: [updated], components: [] });

      try {
        const user = await client.users.fetch(userId);
        await user.send({ embeds: [embeds.success('Role approved', `You’ve been given the **${meta[2]}** ${meta[1]} role!`)] });
      } catch { /* DMs closed */ }
    },

    // Officer denies a role request.
    async rolereq_deny(interaction, args, client) {
      if (!(await requireTier(interaction, TIER.OFFICER))) return;
      const [cat, userId] = args;
      const meta = metaFor(cat) || [cat, '', cat];
      const updated = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(embeds.COLORS.error)
        .setDescription(`❌ **${meta[2]}** request from <@${userId}> denied by <@${interaction.user.id}>.`);
      await interaction.update({ embeds: [updated], components: [] });

      try {
        const user = await client.users.fetch(userId);
        await user.send({ embeds: [embeds.error('Role denied', `Your **${meta[2]}** role request was denied.`)] });
      } catch { /* DMs closed */ }
    },
  },

  modals: {
    // 🆔 Link ID submission.
    async hub_id_modal(interaction, args, client) {
      await interaction.deferReply({ ephemeral: true });
      const steamInput = interaction.fields.getTextInputValue('steam').trim();

      let result;
      try {
        result = await linkMemberBySteam(interaction.user, steamInput);
      } catch (err) {
        console.error('[panel] link error:', err.message);
        return interaction.editReply({
          embeds: [embeds.error('Link failed', 'Something went wrong reaching Steam/BattleMetrics. Try again shortly.')],
        });
      }

      if (result.status === 'no_steam') {
        return interaction.editReply({
          embeds: [
            embeds.error(
              'Couldn’t read that profile',
              steam.hasKey()
                ? 'That doesn’t look like a valid Steam profile. Use a full profile URL, a SteamID64, or a vanity name.'
                : 'No Steam API key is set, so I can only read **`/profiles/<id>`** URLs or a raw SteamID64.',
            ),
          ],
        });
      }

      // Log the link to the ID-log channel (mentions the member).
      clan.logIdLink(client, interaction.user, result).catch(() => {});

      // Linking an ID = verified → grant the rank and drop Unverified.
      const verifyNote = (await clan.autoVerifyOnLink(interaction.guild, interaction.user.id).catch(() => null)) || '';

      const hoursLine = result.rustHours != null ? `\n🕒 Rust hours: **${result.rustHours}h**` : '';
      if (result.status === 'linked') {
        return interaction.editReply({
          embeds: [
            embeds.success(
              'ID linked! 🎉',
              `Linked to BattleMetrics \`${result.bmPlayerId}\`${result.ingameName ? ` (**${result.ingameName}**)` : ''}.` +
                `${hoursLine}${verifyNote}\n\nTime tracks automatically. 🦀`,
            ),
          ],
        });
      }

      return interaction.editReply({
        embeds: [
          embeds.warning(
            'ID saved — BattleMetrics pending',
            `Saved your Steam profile.${hoursLine}${verifyNote}\n\nI couldn’t match a BattleMetrics profile on the clan server yet — ` +
              'it usually resolves once you’ve **played on the server**.',
          ),
        ],
      });
    },
  },
};
