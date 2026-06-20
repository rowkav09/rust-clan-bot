'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const clan = require('../../utils/clan');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarning')
    .setDescription('Deactivate a warning by its ID (Leader only).')
    .addStringOption((o) =>
      o.setName('warning_id').setDescription('The warning ID to clear.').setRequired(true),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.LEADER))) return;

    const id = interaction.options.getString('warning_id', true).trim();
    const warnings = db.read('warnings');
    const warning = warnings[id];

    if (!warning) {
      return interaction.reply({
        embeds: [embeds.error('Not found', `No warning with ID \`${id}\`.`)],
        ephemeral: true,
      });
    }
    if (!warning.active) {
      return interaction.reply({
        embeds: [embeds.info('Already cleared', 'That warning is already inactive.')],
        ephemeral: true,
      });
    }

    warning.active = false;
    db.write('warnings', warnings);

    // Recompute the member's active warning count.
    const remaining = Object.values(warnings).filter(
      (w) => w.userId === warning.userId && w.active,
    ).length;
    const members = db.read('members');
    if (members[warning.userId]) {
      members[warning.userId].warnings = remaining;
      db.write('members', members);
    }

    return interaction.reply({
      embeds: [
        embeds.success(
          'Warning cleared',
          `Warning \`${id}\` for <@${warning.userId}> is now inactive. ` +
            `Remaining active: **${remaining}**.`,
        ),
      ],
      ephemeral: true,
    });
  },
};
