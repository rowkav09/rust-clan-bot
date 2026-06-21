'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const clan = require('../../utils/clan');
const { getTier, TIER, TIER_NAMES } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('member-info')
    .setDescription('Show a clan member’s profile, stats and Rust hours.')
    .addUserOption((o) => o.setName('member').setDescription('Member to inspect (defaults to you).')),

  async execute(interaction) {
    const target = interaction.options.getUser('member') || interaction.user;
    const members = db.read('members');
    const rec = members[target.id];

    const tier = getTier(interaction.guild.members.cache.get(target.id));
    const tierName = TIER_NAMES[tier] ?? 'None';

    // Disciplinary info is only shown to officers, or to someone viewing themselves.
    const canSeeWarnings = getTier(interaction.member) >= TIER.OFFICER || target.id === interaction.user.id;

    if (!rec) {
      return interaction.reply({
        embeds: [
          embeds.info(
            `Member Info — ${target.username}`,
            `<@${target.id}> has no tracked data yet.\n**Tier:** ${tierName}`,
          ),
        ],
      });
    }

    const tasks = Object.values(db.read('tasks')).filter((t) =>
      (t.assignedTo || []).includes(target.id),
    );
    const openTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'failed').length;
    const activeWarnings = Object.values(db.read('warnings')).filter(
      (w) => w.userId === target.id && w.active,
    ).length;

    const online = rec.online ? '🟢 In-game' : rec.checkInTime ? '🟢 In session' : '⚪ Offline';

    const embed = embeds
      .info(`👤 Member Info — ${rec.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'Tier', value: tierName, inline: true },
        { name: 'In-game Name', value: rec.ingameName || '*not set*', inline: true },
        { name: 'Status', value: online, inline: true },
        { name: 'Joined', value: time.relative(rec.joinedAt), inline: true },
        { name: 'Last Seen', value: time.relative(rec.lastSeen || rec.joinedAt), inline: true },
        { name: 'Wipe Score', value: `${clan.wipeScore(rec)}`, inline: true },
        { name: 'Wipe Hours', value: time.formatHours(rec.currentWipeHours || 0), inline: true },
        { name: 'Total Hours', value: time.formatHours(rec.totalHours || 0), inline: true },
        { name: 'Rust Hours (Steam)', value: rec.steamRustHours != null ? `${rec.steamRustHours}h` : '*not linked*', inline: true },
        { name: 'Raids (wipe/total)', value: `${rec.wipeRaids || 0} / ${rec.totalRaids || 0}`, inline: true },
        { name: 'Tasks Done', value: `${rec.tasksCompleted || 0}`, inline: true },
        { name: 'Open Tasks', value: `${openTasks}`, inline: true },
      );

    if (canSeeWarnings) {
      embed.addFields({ name: 'Active Warnings', value: `${activeWarnings}`, inline: true });
    }

    return interaction.reply({ embeds: [embed] });
  },
};
