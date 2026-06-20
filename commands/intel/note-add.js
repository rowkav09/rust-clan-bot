'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const { genId } = require('../../utils/ids');
const { requireTier, TIER } = require('../../utils/permissions');

const TYPES = ['enemy_base', 'resource_node', 'safe_house', 'intel', 'other'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('note-add')
    .setDescription('Add an intel note (Officer+).')
    .addStringOption((o) => o.setName('title').setDescription('Short title.').setRequired(true).setMaxLength(100))
    .addStringOption((o) => o.setName('content').setDescription('Note content.').setRequired(true))
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('Note type.')
        .setRequired(true)
        .addChoices(
          { name: 'Enemy Base', value: 'enemy_base' },
          { name: 'Resource Node', value: 'resource_node' },
          { name: 'Safe House', value: 'safe_house' },
          { name: 'Intel', value: 'intel' },
          { name: 'Other', value: 'other' },
        ),
    )
    .addStringOption((o) => o.setName('grid_ref').setDescription('Map grid reference, e.g. K12.')),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.OFFICER))) return;

    const type = interaction.options.getString('type', true);
    const id = genId();
    const notes = db.read('notes');
    notes[id] = {
      id,
      title: interaction.options.getString('title', true).trim(),
      content: interaction.options.getString('content', true).trim(),
      gridRef: interaction.options.getString('grid_ref')?.trim() || null,
      type: TYPES.includes(type) ? type : 'other',
      addedBy: interaction.user.id,
      addedAt: new Date().toISOString(),
    };
    db.write('notes', notes);

    return interaction.reply({
      embeds: [
        embeds.success(
          'Note added',
          `🔍 \`${id}\` — **${notes[id].title}** (${notes[id].type})` +
            (notes[id].gridRef ? ` · grid ${notes[id].gridRef}` : ''),
        ),
      ],
      ephemeral: true,
    });
  },
};
