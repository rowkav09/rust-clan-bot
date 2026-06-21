'use strict';

const { SlashCommandBuilder, ChannelType } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const { requireTier, TIER, getConfig } = require('../../utils/permissions');

const FEATURES = [
  ['autoWipeReset', 'Auto wipe reset'],
  ['autoCheckInOut', 'Auto check-in/out + in-game role'],
  ['autoPromote', 'Auto promotion (Recruit→Member)'],
  ['autoRecruitRole', 'Auto-give Recruit role on accept'],
  ['popAlerts', 'Population alerts'],
  ['preWipeReminders', 'Pre-wipe reminders'],
  ['raidReminders', 'Raid attendee reminders'],
  ['autoTasks', 'Daily auto tasks'],
  ['livePop', 'Live population channel'],
  ['autoLeaderboard', 'Auto-updating leaderboard'],
  ['enemyAlerts', 'Rival online alerts'],
  ['vcTracking', 'Voice-channel time tracking'],
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automation')
    .setDescription('Configure automation features (Leader only).')
    .addSubcommand((s) => s.setName('view').setDescription('Show current automation settings.'))
    .addSubcommand((s) =>
      s
        .setName('toggle')
        .setDescription('Turn an automation feature on or off.')
        .addStringOption((o) =>
          o
            .setName('feature')
            .setDescription('Which feature.')
            .setRequired(true)
            .addChoices(...FEATURES.map(([value, name]) => ({ name, value }))),
        )
        .addBooleanOption((o) => o.setName('enabled').setDescription('On or off.').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('specialist')
        .setDescription('Set the Discord role that auto-tasks of a category get assigned to.')
        .addStringOption((o) =>
          o
            .setName('category')
            .setDescription('Task category.')
            .setRequired(true)
            .addChoices(
              { name: 'Farm', value: 'farm' },
              { name: 'PvP', value: 'pvp' },
              { name: 'Build', value: 'build' },
              { name: 'Scout', value: 'scout' },
              { name: 'Defend', value: 'defend' },
            ),
        )
        .addRoleOption((o) => o.setName('role').setDescription('Specialist role for this category.').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('ingame-role')
        .setDescription('Set the role applied while a member is in-game.')
        .addRoleOption((o) => o.setName('role').setDescription('In-game role.').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('link-channel')
        .setDescription('Set the channel where members paste their Steam profile to auto-link.')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Steam-link channel.').addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('pop-channel')
        .setDescription('Set the text channel for the live population embed (pop + graph + alerts).')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Population channel.').addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('leaderboard-channel')
        .setDescription('Set the channel for the auto-updating leaderboard.')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Leaderboard channel.').addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('enemy-channel')
        .setDescription('Set the channel for rival-online alerts.')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Rival alert channel.').addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('promotion')
        .setDescription('Set Recruit→Member promotion thresholds.')
        .addNumberOption((o) => o.setName('hours').setDescription('Total hours required.').setMinValue(0))
        .addIntegerOption((o) => o.setName('raids').setDescription('Total raids required.').setMinValue(0))
        .addIntegerOption((o) => o.setName('days').setDescription('Days in clan required.').setMinValue(0)),
    )
    .addSubcommand((s) =>
      s
        .setName('popalert')
        .setDescription('Configure population alerts.')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Channel for alerts.').addChannelTypes(ChannelType.GuildText),
        )
        .addIntegerOption((o) => o.setName('percent').setDescription('Alert at this % full (e.g. 85).').setMinValue(1).setMaxValue(100))
        .addIntegerOption((o) => o.setName('cooldown').setDescription('Minutes between alerts.').setMinValue(5)),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.LEADER))) return;
    const sub = interaction.options.getSubcommand();
    const cfg = db.read('config');

    if (sub === 'view') {
      const merged = getConfig();
      const onoff = (b) => (b ? '🟢 on' : '🔴 off');
      const role = (id) => (id ? `<@&${id}>` : '*unset*');
      const featureLines = FEATURES.map(([k, label]) => `${onoff(merged.automation[k])} — ${label}`).join('\n');
      const specialistLines = Object.entries(merged.specialistRoles)
        .map(([cat, id]) => `• ${cat}: ${role(id)}`)
        .join('\n');

      const embed = embeds
        .info('⚙️ Automation Settings')
        .addFields(
          { name: 'Features', value: featureLines },
          { name: 'In-game role', value: role(merged.inGameRoleId), inline: true },
          { name: 'Steam-link channel', value: merged.linkChannelId ? `<#${merged.linkChannelId}>` : '*unset*', inline: true },
          { name: 'Live pop channel', value: merged.popChannelId ? `<#${merged.popChannelId}>` : '*unset*', inline: true },
          { name: 'Leaderboard channel', value: merged.leaderboardChannelId ? `<#${merged.leaderboardChannelId}>` : '*unset*', inline: true },
          { name: 'Rival alert channel', value: merged.enemyAlertChannelId ? `<#${merged.enemyAlertChannelId}>` : '*unset*', inline: true },
          { name: 'Pop alert channel', value: merged.popAlertChannelId ? `<#${merged.popAlertChannelId}>` : '*unset*', inline: true },
          {
            name: 'Pop alert',
            value: `${Math.round(merged.popAlert.highFraction * 100)}% · ${merged.popAlert.cooldownMin}m cooldown`,
            inline: true,
          },
          {
            name: 'Promotion thresholds',
            value: `${merged.promotion.hours}h · ${merged.promotion.raids} raids · ${merged.promotion.days}d`,
          },
          { name: 'Specialist roles', value: specialistLines },
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'toggle') {
      const feature = interaction.options.getString('feature', true);
      const enabled = interaction.options.getBoolean('enabled', true);
      cfg.automation = cfg.automation || {};
      cfg.automation[feature] = enabled;
      db.write('config', cfg);
      const label = FEATURES.find((f) => f[0] === feature)?.[1] || feature;
      return interaction.reply({
        embeds: [embeds.success('Updated', `**${label}** is now ${enabled ? '🟢 on' : '🔴 off'}.`)],
        ephemeral: true,
      });
    }

    if (sub === 'specialist') {
      const category = interaction.options.getString('category', true);
      const roleObj = interaction.options.getRole('role', true);
      cfg.specialistRoles = cfg.specialistRoles || {};
      cfg.specialistRoles[category] = roleObj.id;
      db.write('config', cfg);
      return interaction.reply({
        embeds: [embeds.success('Updated', `**${category}** auto-tasks will be assigned to ${roleObj}.`)],
        ephemeral: true,
      });
    }

    if (sub === 'ingame-role') {
      const roleObj = interaction.options.getRole('role', true);
      cfg.inGameRoleId = roleObj.id;
      db.write('config', cfg);
      return interaction.reply({
        embeds: [embeds.success('Updated', `In-game role set to ${roleObj}.`)],
        ephemeral: true,
      });
    }

    if (sub === 'link-channel') {
      const channel = interaction.options.getChannel('channel', true);
      cfg.linkChannelId = channel.id;
      db.write('config', cfg);
      return interaction.reply({
        embeds: [
          embeds.success(
            'Updated',
            `Members can now paste their Steam profile in ${channel} to auto-link ` +
              'their BattleMetrics tracking.',
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === 'pop-channel') {
      const channel = interaction.options.getChannel('channel', true);
      cfg.popChannelId = channel.id;
      cfg.popMessageId = null; // force a fresh live message
      db.write('config', cfg);
      return interaction.reply({
        embeds: [
          embeds.success(
            'Updated',
            `${channel} will now host the live population embed (current pop + 24h graph) ` +
              'and population alerts, all in one place.',
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === 'leaderboard-channel') {
      const channel = interaction.options.getChannel('channel', true);
      cfg.leaderboardChannelId = channel.id;
      cfg.leaderboardMessageId = null; // force a fresh message
      db.write('config', cfg);
      return interaction.reply({
        embeds: [embeds.success('Updated', `The auto-updating leaderboard will post in ${channel} within ~30 min.`)],
        ephemeral: true,
      });
    }

    if (sub === 'enemy-channel') {
      const channel = interaction.options.getChannel('channel', true);
      cfg.enemyAlertChannelId = channel.id;
      db.write('config', cfg);
      return interaction.reply({
        embeds: [embeds.success('Updated', `Rival-online alerts will post in ${channel}.`)],
        ephemeral: true,
      });
    }

    if (sub === 'promotion') {
      const hours = interaction.options.getNumber('hours');
      const raids = interaction.options.getInteger('raids');
      const days = interaction.options.getInteger('days');
      cfg.promotion = cfg.promotion || {};
      if (hours !== null) cfg.promotion.hours = hours;
      if (raids !== null) cfg.promotion.raids = raids;
      if (days !== null) cfg.promotion.days = days;
      db.write('config', cfg);
      const m = getConfig().promotion;
      return interaction.reply({
        embeds: [embeds.success('Updated', `Promotion: **${m.hours}h · ${m.raids} raids · ${m.days}d**.`)],
        ephemeral: true,
      });
    }

    if (sub === 'popalert') {
      const channel = interaction.options.getChannel('channel');
      const percent = interaction.options.getInteger('percent');
      const cooldown = interaction.options.getInteger('cooldown');
      if (channel) cfg.popAlertChannelId = channel.id;
      cfg.popAlert = cfg.popAlert || {};
      if (percent !== null) cfg.popAlert.highFraction = percent / 100;
      if (cooldown !== null) cfg.popAlert.cooldownMin = cooldown;
      db.write('config', cfg);
      const m = getConfig();
      return interaction.reply({
        embeds: [
          embeds.success(
            'Updated',
            `Pop alerts → ${m.popAlertChannelId ? `<#${m.popAlertChannelId}>` : '*unset*'} · ` +
              `${Math.round(m.popAlert.highFraction * 100)}% · ${m.popAlert.cooldownMin}m.`,
          ),
        ],
        ephemeral: true,
      });
    }
  },
};
