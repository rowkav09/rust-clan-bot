'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const embeds = require('../../utils/embeds');
const clan = require('../../utils/clan');
const { requireTier, TIER, getConfig } = require('../../utils/permissions');

// category → emoji + display label
const ROLES = [
  ['farm', '🌾', 'Farmer'],
  ['pvp', '⚔️', 'PvPer'],
  ['build', '🏗️', 'Builder'],
  ['scout', '🔭', 'Scout'],
  ['defend', '🛡️', 'Defender'],
];

const metaFor = (cat) => ROLES.find((r) => r[0] === cat);
const configuredRoles = (cfg) => ROLES.filter(([cat]) => cfg.specialistRoles?.[cat]);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolepanel')
    .setDescription('Post a panel where members request a role (Farmer, PvPer…) (Leader only).')
    .addChannelOption((o) =>
      o.setName('channel').setDescription('Where to post (defaults to here).').addChannelTypes(ChannelType.GuildText),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.LEADER))) return;

    const cfg = getConfig();
    const available = configuredRoles(cfg);
    if (available.length === 0) {
      return interaction.reply({
        embeds: [
          embeds.error(
            'No specialist roles set',
            'Configure them first with `/automation specialist <category> <role>` ' +
              '(farm, pvp, build, scout, defend), then re-run this.',
          ),
        ],
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const embed = embeds
      .info(
        '🎭 Request a role',
        'Click a button to **request** a role. An officer will approve it, then it’s yours. ' +
          'Already have one? Clicking it removes it.\n\n' +
          available.map(([, emoji, label]) => `${emoji} **${label}**`).join('\n'),
      )
      .setThumbnail(interaction.guild.iconURL({ size: 128 }) || null);

    const row = new ActionRowBuilder().addComponents(
      available.map(([cat, emoji, label]) =>
        new ButtonBuilder().setCustomId(`rolereq:${cat}`).setLabel(label).setEmoji(emoji).setStyle(ButtonStyle.Secondary),
      ),
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
      embeds: [embeds.success('Panel posted', `Role panel posted in ${channel}.`)],
      ephemeral: true,
    });
  },

  buttons: {
    // Member clicked a role on the panel.
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

      // Already have it → self-remove instantly (no approval needed to drop a role).
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
          embeds: [
            embeds.error(
              'Requests not set up',
              'No application/log channel is configured for officers to review. Ask a leader to run `/setup`.',
            ),
          ],
          ephemeral: true,
        });
      }

      const reqEmbed = embeds
        .info(
          `${meta[1]} Role Request — ${interaction.user.tag}`,
          `<@${interaction.user.id}> is requesting the **${meta[2]}** role.`,
        )
        .setThumbnail(interaction.user.displayAvatarURL());

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`rolereq_approve:${cat}:${interaction.user.id}`).setLabel('Approve').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId(`rolereq_deny:${cat}:${interaction.user.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger).setEmoji('❌'),
      );

      const ping = cfg.officerRoleId ? `<@&${cfg.officerRoleId}>` : '';
      await channel.send({ content: ping || undefined, embeds: [reqEmbed], components: [row] });

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
};
