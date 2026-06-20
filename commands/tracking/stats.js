'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const clan = require('../../utils/clan');
const { requireTier, getTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View play-time and activity stats for yourself or another member.')
    .addUserOption((o) =>
      o.setName('member').setDescription('Member to view (defaults to you).'),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.RECRUIT))) return;

    const target = interaction.options.getUser('member') || interaction.user;
    const isSelf = target.id === interaction.user.id;

    if (!isSelf && getTier(interaction.member) < TIER.MEMBER) {
      return interaction.reply({
        embeds: [
          embeds.error('Not allowed', 'Only Members and above can view other members’ stats.'),
        ],
        ephemeral: true,
      });
    }

    const members = db.read('members');
    const rec = members[target.id];
    if (!rec) {
      return interaction.reply({
        embeds: [
          embeds.info(
            'No data yet',
            `${isSelf ? 'You have' : `${target.username} has`} no tracked stats yet. ` +
              'Use `/checkin` to start logging play time.',
          ),
        ],
        ephemeral: true,
      });
    }

    const sessionLine = rec.checkInTime
      ? `🟢 In a session since ${time.relative(rec.checkInTime)}`
      : '⚪ Not currently checked in';

    const embed = embeds
      .info(`📊 Stats — ${rec.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'Wipe Hours', value: time.formatHours(rec.currentWipeHours || 0), inline: true },
        { name: 'Total Hours', value: time.formatHours(rec.totalHours || 0), inline: true },
        { name: 'Wipe Score', value: `${clan.wipeScore(rec)}`, inline: true },
        { name: 'Raids (wipe)', value: `${rec.wipeRaids || 0}`, inline: true },
        { name: 'Raids (total)', value: `${rec.totalRaids || 0}`, inline: true },
        { name: 'Tasks Done', value: `${rec.tasksCompleted || 0}`, inline: true },
        { name: 'Warnings', value: `${rec.warnings || 0}`, inline: true },
        { name: 'In-game Name', value: rec.ingameName || '*not set*', inline: true },
        { name: 'Last Seen', value: time.relative(rec.lastSeen || rec.joinedAt), inline: true },
      )
      .setDescription(sessionLine);

    return interaction.reply({ embeds: [embed], ephemeral: isSelf });
  },
};
