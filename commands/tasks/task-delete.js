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
    .setName('task-delete')
    .setDescription('Delete a task (Officer+).')
    .addStringOption((o) =>
      o.setName('task_id').setDescription('The task ID to delete.').setRequired(true),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.OFFICER))) return;

    const taskId = interaction.options.getString('task_id', true).trim();
    const tasks = db.read('tasks');
    const task = tasks[taskId];
    if (!task) {
      return interaction.reply({
        embeds: [embeds.error('Not found', `No task with ID \`${taskId}\`.`)],
        ephemeral: true,
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`task_delete:${taskId}`)
        .setLabel('Confirm delete')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('task_delete_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary),
    );

    return interaction.reply({
      embeds: [
        embeds.warning(
          'Confirm deletion',
          `Are you sure you want to delete task \`${taskId}\` — **${task.title}**? ` +
            'This cannot be undone.',
        ),
      ],
      components: [row],
      ephemeral: true,
    });
  },

  buttons: {
    async task_delete(interaction, args) {
      if (!(await requireTier(interaction, TIER.OFFICER))) return;
      const taskId = args[0];
      const tasks = db.read('tasks');
      if (!tasks[taskId]) {
        return interaction.update({
          embeds: [embeds.error('Already gone', 'That task no longer exists.')],
          components: [],
        });
      }
      const title = tasks[taskId].title;
      delete tasks[taskId];
      db.write('tasks', tasks);

      return interaction.update({
        embeds: [embeds.success('Task deleted', `Task \`${taskId}\` — **${title}** was removed.`)],
        components: [],
      });
    },

    async task_delete_cancel(interaction) {
      return interaction.update({
        embeds: [embeds.info('Cancelled', 'No task was deleted.')],
        components: [],
      });
    },
  },
};
