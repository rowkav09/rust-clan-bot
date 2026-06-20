'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const { findInactive } = require('../../jobs/activityCheck');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activity')
    .setDescription('List members inactive for 7+ days (Officer+).'),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.OFFICER))) return;

    const inactive = findInactive(7, false);
    if (inactive.length === 0) {
      return interaction.reply({
        embeds: [embeds.success('All active', 'No members have been inactive for 7+ days. 🎉')],
        ephemeral: true,
      });
    }

    const lines = inactive.map(
      ({ id, member, inactiveFor }) =>
        `• <@${id}> — last seen ${time.relative(member.lastSeen || member.joinedAt)} ` +
        `(${inactiveFor}d) · ${(member.currentWipeHours || 0).toFixed(1)}h this wipe`,
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('activity_dm_all')
        .setLabel('DM All Inactive')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📨'),
    );

    return interaction.reply({
      embeds: [embeds.warning(`Inactive Members (${inactive.length})`, lines.join('\n'))],
      components: [row],
      ephemeral: true,
    });
  },

  buttons: {
    async activity_dm_all(interaction, args, client) {
      if (!(await requireTier(interaction, TIER.OFFICER))) return;
      await interaction.deferUpdate();

      const inactive = findInactive(7, false);
      let sent = 0;
      let failed = 0;
      for (const { id } of inactive) {
        try {
          const user = await client.users.fetch(id);
          await user.send({
            embeds: [
              embeds.warning(
                'We miss you! 🦀',
                'You’ve been inactive for a while. Hop back in-game and `/checkin` ' +
                  'to stay on the roster and climb the leaderboard!',
              ),
            ],
          });
          sent += 1;
        } catch {
          failed += 1;
        }
      }

      return interaction.followUp({
        embeds: [
          embeds.success(
            'Reminders sent',
            `📨 DMed **${sent}** member(s).` + (failed ? ` ${failed} had DMs closed.` : ''),
          ),
        ],
        ephemeral: true,
      });
    },
  },
};
