'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const { requireTier, TIER } = require('../../utils/permissions');

const ROLE_FIELDS = [
  ['leader', 'leaderRoleId', 'Leader'],
  ['officer', 'officerRoleId', 'Officer'],
  ['member', 'memberRoleId', 'Member'],
  ['recruit', 'recruitRoleId', 'Recruit (verified)'],
];

const CHANNEL_FIELDS = [
  ['log', 'logChannelId', 'Log'],
  ['application', 'applicationChannelId', 'Application'],
  ['raid', 'raidChannelId', 'Raid'],
  ['wipe', 'wipeChannelId', 'Wipe Countdown'],
];

function summary(cfg) {
  const role = (id) => (id ? `<@&${id}>` : '*not set*');
  const chan = (id) => (id ? `<#${id}>` : '*not set*');
  return (
    '**Roles**\n' +
    ROLE_FIELDS.map(([, key, label]) => `• ${label}: ${role(cfg[key])}`).join('\n') +
    '\n\n**Channels**\n' +
    CHANNEL_FIELDS.map(([, key, label]) => `• ${label}: ${chan(cfg[key])}`).join('\n')
  );
}

function renderRoles() {
  const cfg = db.read('config');
  const embed = embeds.info(
    '⚙️ Setup — Step 1: Roles',
    'Pick the Discord role for each clan tier, then continue to channels.\n\n' + summary(cfg),
  );
  const rows = ROLE_FIELDS.map(([slug, , label]) =>
    new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(`setup_role:${slug}`)
        .setPlaceholder(`Select the ${label} role`)
        .setMinValues(1)
        .setMaxValues(1),
    ),
  );
  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_nav:channels')
        .setLabel('Configure Channels →')
        .setStyle(ButtonStyle.Primary),
    ),
  );
  return { embeds: [embed], components: rows };
}

function renderChannels() {
  const cfg = db.read('config');
  const embed = embeds.info(
    '⚙️ Setup — Step 2: Channels',
    'Pick the channel for each function, then finish setup.\n\n' + summary(cfg),
  );
  const rows = CHANNEL_FIELDS.map(([slug, , label]) =>
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`setup_channel:${slug}`)
        .setPlaceholder(`Select the ${label} channel`)
        .addChannelTypes(ChannelType.GuildText)
        .setMinValues(1)
        .setMaxValues(1),
    ),
  );
  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_nav:roles')
        .setLabel('← Roles')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setup_finish')
        .setLabel('Finish Setup ✅')
        .setStyle(ButtonStyle.Success),
    ),
  );
  return { embeds: [embed], components: rows };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure clan roles and channels (Leader only).'),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.LEADER))) return;
    const payload = renderRoles();
    return interaction.reply({ ...payload, ephemeral: true });
  },

  selects: {
    async setup_role(interaction, args) {
      if (!(await requireTier(interaction, TIER.LEADER))) return;
      const slug = args[0];
      const field = ROLE_FIELDS.find((f) => f[0] === slug);
      if (!field) return;
      const cfg = db.read('config');
      cfg[field[1]] = interaction.values[0];
      db.write('config', cfg);
      return interaction.update(renderRoles());
    },

    async setup_channel(interaction, args) {
      if (!(await requireTier(interaction, TIER.LEADER))) return;
      const slug = args[0];
      const field = CHANNEL_FIELDS.find((f) => f[0] === slug);
      if (!field) return;
      const cfg = db.read('config');
      cfg[field[1]] = interaction.values[0];
      db.write('config', cfg);
      return interaction.update(renderChannels());
    },
  },

  buttons: {
    async setup_nav(interaction, args) {
      if (!(await requireTier(interaction, TIER.LEADER))) return;
      return interaction.update(args[0] === 'channels' ? renderChannels() : renderRoles());
    },

    async setup_finish(interaction, args, client) {
      if (!(await requireTier(interaction, TIER.LEADER))) return;
      const cfg = db.read('config');

      // Validate the bot can rename the wipe channel.
      let wipeWarning = '';
      if (cfg.wipeChannelId) {
        try {
          const channel = await client.channels.fetch(cfg.wipeChannelId);
          const me = await channel.guild.members.fetchMe();
          const perms = channel.permissionsFor(me);
          if (!perms || !perms.has(PermissionFlagsBits.ManageChannels)) {
            wipeWarning =
              '\n\n⚠️ I lack **Manage Channels** permission on the wipe channel, ' +
              'so I cannot rename it for the countdown. Grant it and re-run `/setup`.';
          }
        } catch {
          wipeWarning = '\n\n⚠️ Could not verify permissions on the wipe channel.';
        }
      }

      // Verify the bot can actually assign the configured roles (its own role
      // must sit ABOVE them) — the usual reason roles "don't get given".
      let hierarchyWarning = '';
      try {
        const guild = await client.guilds.fetch(interaction.guildId);
        const me = await guild.members.fetchMe();
        const myTop = me.roles.highest.position;
        const tooHigh = [];
        for (const [, key, label] of ROLE_FIELDS) {
          if (!cfg[key]) continue;
          const role = guild.roles.cache.get(cfg[key]) || (await guild.roles.fetch(cfg[key]).catch(() => null));
          if (role && role.position >= myTop) tooHigh.push(label);
        }
        if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
          hierarchyWarning = '\n\n⚠️ I’m missing the **Manage Roles** permission — I can’t assign any roles until you grant it.';
        } else if (tooHigh.length) {
          hierarchyWarning =
            `\n\n⚠️ My bot role is **below** ${tooHigh.join(', ')}, so I can’t assign ${tooHigh.length > 1 ? 'them' : 'it'}. ` +
            'Drag my role **above** them in Server Settings → Roles.';
        }
      } catch { /* ignore */ }

      const missing = [...ROLE_FIELDS, ...CHANNEL_FIELDS].filter(([, key]) => !cfg[key]);
      const embed = (missing.length ? embeds.warning : embeds.success)(
        'Setup complete',
        summary(cfg) +
          (missing.length
            ? `\n\n⚠️ ${missing.length} value(s) still unset — you can re-run \`/setup\` anytime.`
            : '\n\nAll values configured! 🎉') +
          wipeWarning +
          hierarchyWarning,
      );
      return interaction.update({ embeds: [embed], components: [] });
    },
  },
};
