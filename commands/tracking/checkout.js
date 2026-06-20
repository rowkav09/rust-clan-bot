'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const clan = require('../../utils/clan');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkout')
    .setDescription('Log that you are leaving the game (ends your play session).'),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.RECRUIT))) return;

    const members = db.read('members');
    const rec = clan.ensureMember(members, interaction.user);

    if (!rec.checkInTime) {
      return interaction.reply({
        embeds: [
          embeds.error(
            'No active session',
            'You are not currently checked in. Use `/checkin` to start a session.',
          ),
        ],
        ephemeral: true,
      });
    }

    const sessionHours = time.hoursBetween(rec.checkInTime);
    rec.currentWipeHours = Number(((rec.currentWipeHours || 0) + sessionHours).toFixed(3));
    rec.totalHours = Number(((rec.totalHours || 0) + sessionHours).toFixed(3));
    rec.checkInTime = null;
    rec.autoTracked = false;
    clan.touch(rec);
    db.write('members', members);
    clan.syncAllTime(interaction.user.id, rec);

    return interaction.reply({
      embeds: [
        embeds.success(
          'Checked out',
          `**Session:** ${time.formatHours(sessionHours)}\n` +
            `**Wipe total:** ${time.formatHours(rec.currentWipeHours)}\n` +
            `**All-time:** ${time.formatHours(rec.totalHours)}`,
        ),
      ],
      ephemeral: true,
    });
  },
};
