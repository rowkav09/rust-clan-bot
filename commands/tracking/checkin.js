'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const clan = require('../../utils/clan');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkin')
    .setDescription('Log that you are going in-game (starts a play session).'),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.RECRUIT))) return;

    const members = db.read('members');
    const rec = clan.ensureMember(members, interaction.user);

    if (rec.checkInTime) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('checkin_override')
          .setLabel('Override & restart session')
          .setStyle(ButtonStyle.Danger),
      );
      return interaction.reply({
        embeds: [
          embeds.warning(
            'Already checked in',
            `You started a session ${time.relative(rec.checkInTime)}. ` +
              'Use `/checkout` to end it, or override to restart the timer now.',
          ),
        ],
        components: [row],
        ephemeral: true,
      });
    }

    rec.checkInTime = new Date().toISOString();
    rec.autoTracked = false;
    clan.touch(rec);
    db.write('members', members);

    return interaction.reply({
      embeds: [
        embeds.success(
          'Checked in',
          `Session started ${time.relative(rec.checkInTime)}. ` +
            'Have a good grind — remember to `/checkout` when you log off!',
        ),
      ],
      ephemeral: true,
    });
  },

  buttons: {
    async checkin_override(interaction) {
      const members = db.read('members');
      const rec = clan.ensureMember(members, interaction.user);
      rec.checkInTime = new Date().toISOString();
      rec.autoTracked = false;
      clan.touch(rec);
      db.write('members', members);

      return interaction.update({
        embeds: [
          embeds.success('Session restarted', `Timer reset to ${time.relative(rec.checkInTime)}.`),
        ],
        components: [],
      });
    },
  },
};
