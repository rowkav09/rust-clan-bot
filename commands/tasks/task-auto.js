'use strict';

const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const taskgen = require('../../utils/taskgen');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('task-auto')
    .setDescription('Auto-generate & assign clan tasks by category (Officer+).')
    .addStringOption((o) =>
      o
        .setName('category')
        .setDescription('Only generate for this category (default: all).')
        .addChoices(
          { name: 'Farm', value: 'farm' },
          { name: 'PvP', value: 'pvp' },
          { name: 'Build', value: 'build' },
          { name: 'Scout', value: 'scout' },
          { name: 'Defend', value: 'defend' },
          { name: 'Other', value: 'other' },
        ),
    )
    .addIntegerOption((o) =>
      o
        .setName('count')
        .setDescription('Tasks per category (default 1).')
        .setMinValue(1)
        .setMaxValue(5),
    ),

  async execute(interaction, client) {
    if (!(await requireTier(interaction, TIER.OFFICER))) return;
    await interaction.deferReply({ ephemeral: true });

    const category = interaction.options.getString('category');
    const count = interaction.options.getInteger('count') || 1;
    const created = await taskgen.generateTasks(client, category ? [category] : null, count);

    if (created.length === 0) {
      return interaction.editReply({
        embeds: [embeds.warning('Nothing generated', 'No tasks were created — check your category.')],
      });
    }

    const lines = created.map((t) => {
      const who = (t.assignedTo || []).map((u) => `<@${u}>`).join(', ') || '*unassigned*';
      return `**${t.title}** \`${t.id}\` → ${who}`;
    });
    return interaction.editReply({
      embeds: [
        embeds.success(
          `Generated ${created.length} task(s)`,
          lines.join('\n') + '\n\n*Posted to the log channel and assigned automatically.*',
        ),
      ],
    });
  },
};
