'use strict';

const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const clan = require('../../utils/clan');
const { genShortId } = require('../../utils/ids');
const { requireTier, TIER } = require('../../utils/permissions');

const CATEGORIES = ['farm', 'pvp', 'build', 'scout', 'defend', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('task-assign')
    .setDescription('Create and assign a task (Officer+).')
    .addUserOption((o) =>
      o.setName('assignee').setDescription('Primary assignee.').setRequired(true),
    )
    .addUserOption((o) => o.setName('assignee2').setDescription('Second assignee (optional).'))
    .addUserOption((o) => o.setName('assignee3').setDescription('Third assignee (optional).')),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.OFFICER))) return;

    const ids = [
      interaction.options.getUser('assignee', true).id,
      interaction.options.getUser('assignee2')?.id,
      interaction.options.getUser('assignee3')?.id,
    ].filter(Boolean);

    const modal = new ModalBuilder()
      .setCustomId(`task_modal:${ids.join(',')}`)
      .setTitle('New Task');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('title')
          .setLabel('Title')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(100)
          .setRequired(true),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('description')
          .setLabel('Description')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('category')
          .setLabel('Category: farm/pvp/build/scout/defend/other')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('other'),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('priority')
          .setLabel('Priority: low/medium/high')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('medium'),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('deadline')
          .setLabel('Deadline (DD/MM HH:MM UTC, optional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('e.g. 13/04 19:00'),
      ),
    );

    await interaction.showModal(modal);
  },

  modals: {
    async task_modal(interaction, args, client) {
      const assignees = (args[0] || '').split(',').filter(Boolean);
      const title = interaction.fields.getTextInputValue('title').trim();
      const description = interaction.fields.getTextInputValue('description').trim();

      let category = interaction.fields.getTextInputValue('category').trim().toLowerCase();
      if (!CATEGORIES.includes(category)) category = 'other';

      let priority = interaction.fields.getTextInputValue('priority').trim().toLowerCase();
      if (!PRIORITIES.includes(priority)) priority = 'medium';

      const deadlineRaw = interaction.fields.getTextInputValue('deadline').trim();
      let deadline = null;
      if (deadlineRaw) {
        const parsed = time.parseDateTime(deadlineRaw);
        if (!parsed) {
          return interaction.reply({
            embeds: [
              embeds.error('Invalid deadline', 'Use the format `DD/MM HH:MM` (UTC), e.g. `13/04 19:00`.'),
            ],
            ephemeral: true,
          });
        }
        deadline = parsed.toISOString();
      }

      const now = new Date().toISOString();
      const tasks = db.read('tasks');
      const id = genShortId(tasks);
      tasks[id] = {
        id,
        title,
        description,
        category,
        assignedTo: assignees,
        assignedBy: interaction.user.id,
        status: 'pending',
        priority,
        deadline,
        createdAt: now,
        updatedAt: now,
      };
      db.write('tasks', tasks);

      const mentions = assignees.map((a) => `<@${a}>`).join(' ');
      const embed = embeds
        .info(`📋 New Task: ${title}`)
        .addFields(
          { name: 'ID', value: `\`${id}\``, inline: true },
          { name: 'Category', value: category, inline: true },
          { name: 'Priority', value: priority, inline: true },
          { name: 'Assigned To', value: mentions || '—', inline: false },
          {
            name: 'Deadline',
            value: deadline ? `${time.full(deadline)} (${time.relative(deadline)})` : 'None',
            inline: false,
          },
        )
        .setDescription(description || '*No description provided.*');

      const logMsg = await clan.log(client, embed);
      if (logMsg && mentions) {
        try {
          await logMsg.channel.send({ content: `🆕 New task for ${mentions}` });
        } catch { /* ignore */ }
      }

      return interaction.reply({
        embeds: [
          embeds.success(
            'Task created',
            `Task \`${id}\` — **${title}** assigned to ${mentions || '—'}.` +
              (logMsg ? '' : '\n\n*Note: no log channel configured, so assignees were not pinged.*'),
          ),
        ],
        ephemeral: true,
      });
    },
  },
};
