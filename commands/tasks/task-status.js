'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const clan = require('../../utils/clan');
const { requireTier, getTier, TIER } = require('../../utils/permissions');

const STATUS_ICON = {
  pending: '⏳',
  in_progress: '🔄',
  done: '✅',
  failed: '❌',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('task-status')
    .setDescription('Update the status of a task.')
    .addStringOption((o) =>
      o.setName('task_id').setDescription('The task ID.').setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName('status')
        .setDescription('New status.')
        .setRequired(true)
        .addChoices(
          { name: '🔄 In Progress', value: 'in_progress' },
          { name: '✅ Done', value: 'done' },
          { name: '❌ Failed', value: 'failed' },
          { name: '⏳ Pending', value: 'pending' },
        ),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.RECRUIT))) return;

    const taskId = interaction.options.getString('task_id', true).trim();
    const status = interaction.options.getString('status', true);

    const tasks = db.read('tasks');
    const task = tasks[taskId];
    if (!task) {
      return interaction.reply({
        embeds: [embeds.error('Not found', `No task with ID \`${taskId}\`.`)],
        ephemeral: true,
      });
    }

    const isAssignee = (task.assignedTo || []).includes(interaction.user.id);
    const isOfficer = getTier(interaction.member) >= TIER.OFFICER;
    if (!isAssignee && !isOfficer) {
      return interaction.reply({
        embeds: [
          embeds.error('Not allowed', 'Only an assignee or an Officer+ can change this task.'),
        ],
        ephemeral: true,
      });
    }

    const previous = task.status;
    task.status = status;
    task.updatedAt = new Date().toISOString();

    // Award task-completion credit only on the pending/in_progress → done transition.
    if (status === 'done' && previous !== 'done') {
      const members = db.read('members');
      for (const uid of task.assignedTo || []) {
        const userLike = { id: uid, username: `User-${uid}` };
        const rec = clan.ensureMember(members, userLike);
        rec.tasksCompleted = (rec.tasksCompleted || 0) + 1;
        rec.currentWipeTasks = (rec.currentWipeTasks || 0) + 1;
        clan.syncAllTime(uid, rec);
      }
      db.write('members', members);
    }

    db.write('tasks', tasks);

    return interaction.reply({
      embeds: [
        embeds.success(
          'Task updated',
          `${STATUS_ICON[status]} Task \`${taskId}\` — **${task.title}** is now **${status.replace('_', ' ')}**.`,
        ),
      ],
      ephemeral: true,
    });
  },
};
