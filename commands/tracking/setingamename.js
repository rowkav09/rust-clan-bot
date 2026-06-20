'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const clan = require('../../utils/clan');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setingamename')
    .setDescription('Link your in-game Rust/Steam name for automatic time tracking.')
    .addStringOption((o) =>
      o
        .setName('name')
        .setDescription('Your exact in-game name as it appears on the server.')
        .setRequired(true)
        .setMaxLength(64),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.RECRUIT))) return;

    const name = interaction.options.getString('name', true).trim();
    const members = db.read('members');
    const rec = clan.ensureMember(members, interaction.user);
    rec.ingameName = name;
    clan.touch(rec);
    db.write('members', members);

    return interaction.reply({
      embeds: [
        embeds.success(
          'In-game name set',
          `Your in-game name is now **${name}**. ` +
            'If BattleMetrics tracking is enabled, your hours will sync automatically ' +
            'when you are online.',
        ),
      ],
      ephemeral: true,
    });
  },
};
