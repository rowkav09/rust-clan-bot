'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const { requireTier, getTier, TIER } = require('../../utils/permissions');

const STATUS_ICON = {
  pending: '⏳',
  in_progress: '🔄',
  done: '✅',
  failed: '❌',
};

const CATEGORY_BADGE = {
  farm: '🌾',
  pvp: '⚔️',
  build: '🏗️',
  scout: '🔭',
  defend: '🛡️',
  other: '📌',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('task-list')
    .setDescription('List tasks, optionally filtered.')
    .addUserOption((o) => o.setName('member').setDescription('Filter by assignee.'))
    .addStringOption((o) =>
      o
        .setName('status')
        .setDescription('Filter by status.')
        .addChoices(
          { name: 'Pending', value: 'pending' },
          { name: 'In Progress', value: 'in_progress' },
          { name: 'Done', value: 'done' },
          { name: 'Failed', value: 'failed' },
        ),
    )
    .addStringOption((o) =>
      o
        .setName('category')
        .setDescription('Filter by category.')
        .addChoices(
          { name: 'Farm', value: 'farm' },
          { name: 'PvP', value: 'pvp' },
          { name: 'Build', value: 'build' },
          { name: 'Scout', value: 'scout' },
          { name: 'Defend', value: 'defend' },
          { name: 'Other', value: 'other' },
        ),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.RECRUIT))) return;

    const memberOpt = interaction.options.getUser('member');
    const statusOpt = interaction.options.getString('status');
    const categoryOpt = interaction.options.getString('category');
    const isOfficer = getTier(interaction.member) >= TIER.OFFICER;

    // Non-officers only see their own tasks unless they explicitly look at themselves.
    let assigneeFilter;
    if (memberOpt) {
      if (memberOpt.id !== interaction.user.id && !isOfficer) {
        return interaction.reply({
          embeds: [
            embeds.error('Not allowed', 'Only Officers+ can view other members’ task lists.'),
          ],
          ephemeral: true,
        });
      }
      assigneeFilter = memberOpt.id;
    } else if (!isOfficer) {
      assigneeFilter = interaction.user.id;
    }

    const tasks = Object.values(db.read('tasks'));
    let filtered = tasks;
    if (assigneeFilter) filtered = filtered.filter((t) => (t.assignedTo || []).includes(assigneeFilter));
    if (statusOpt) filtered = filtered.filter((t) => t.status === statusOpt);
    if (categoryOpt) filtered = filtered.filter((t) => t.category === categoryOpt);

    // Sort: open tasks first, then by deadline (soonest first), then created.
    const openRank = { pending: 0, in_progress: 1, done: 2, failed: 3 };
    filtered.sort((a, b) => {
      const r = (openRank[a.status] ?? 9) - (openRank[b.status] ?? 9);
      if (r !== 0) return r;
      const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return ad - bd;
    });

    if (filtered.length === 0) {
      return interaction.reply({
        embeds: [embeds.info('No tasks', 'No tasks match those filters.')],
        ephemeral: true,
      });
    }

    const embed = embeds.info(`📋 Tasks (${filtered.length})`);
    for (const t of filtered.slice(0, 25)) {
      const badge = CATEGORY_BADGE[t.category] || '📌';
      const icon = STATUS_ICON[t.status] || '⏳';
      const who = (t.assignedTo || []).map((id) => `<@${id}>`).join(', ') || '—';
      const deadline = t.deadline ? ` · due ${time.relative(t.deadline)}` : '';
      embed.addFields({
        name: `${icon} ${badge} ${t.title}  \`${t.id}\``,
        value: `${who} · *${t.status.replace('_', ' ')}* · ${t.priority}${deadline}`,
      });
    }
    if (filtered.length > 25) {
      embed.setFooter({ text: `Showing 25 of ${filtered.length} tasks — narrow your filters` });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
