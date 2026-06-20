'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('note-delete')
    .setDescription('Delete an intel note (Officer+).')
    .addStringOption((o) =>
      o.setName('note_id').setDescription('The note ID to delete.').setRequired(true),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.OFFICER))) return;

    const id = interaction.options.getString('note_id', true).trim();
    const notes = db.read('notes');
    const note = notes[id];
    if (!note) {
      return interaction.reply({
        embeds: [embeds.error('Not found', `No note with ID \`${id}\`.`)],
        ephemeral: true,
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`note_delete:${id}`).setLabel('Confirm delete').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('note_delete_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
    );

    return interaction.reply({
      embeds: [embeds.warning('Confirm deletion', `Delete note \`${id}\` — **${note.title}**?`)],
      components: [row],
      ephemeral: true,
    });
  },

  buttons: {
    async note_delete(interaction, args) {
      if (!(await requireTier(interaction, TIER.OFFICER))) return;
      const id = args[0];
      const notes = db.read('notes');
      if (!notes[id]) {
        return interaction.update({
          embeds: [embeds.error('Already gone', 'That note no longer exists.')],
          components: [],
        });
      }
      const title = notes[id].title;
      delete notes[id];
      db.write('notes', notes);
      return interaction.update({
        embeds: [embeds.success('Note deleted', `Note \`${id}\` — **${title}** removed.`)],
        components: [],
      });
    },

    async note_delete_cancel(interaction) {
      return interaction.update({
        embeds: [embeds.info('Cancelled', 'No note was deleted.')],
        components: [],
      });
    },
  },
};
