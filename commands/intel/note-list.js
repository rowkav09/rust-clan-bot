'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const { requireTier, TIER } = require('../../utils/permissions');

const PER_PAGE = 5;
const TYPE_BADGE = {
  enemy_base: '🏚️',
  resource_node: '⛏️',
  safe_house: '🏠',
  intel: '🔍',
  other: '📌',
};

function getNotes(type) {
  let notes = Object.values(db.read('notes'));
  if (type) notes = notes.filter((n) => n.type === type);
  notes.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  return notes;
}

function render(type, page) {
  const notes = getNotes(type);
  const totalPages = Math.max(1, Math.ceil(notes.length / PER_PAGE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = notes.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  const embed = embeds.info(
    `🔍 Intel Notes${type ? ` — ${type}` : ''}`,
    notes.length === 0 ? '*No notes found.*' : null,
  );

  for (const n of slice) {
    embed.addFields({
      name: `${TYPE_BADGE[n.type] || '📌'} ${n.title}  \`${n.id}\``,
      value:
        `${n.content.slice(0, 900)}\n` +
        `*${n.gridRef ? `grid ${n.gridRef} · ` : ''}by <@${n.addedBy}> · ${time.relative(n.addedAt)}*`,
    });
  }
  embed.setFooter({ text: `Page ${safePage + 1}/${totalPages} · ${notes.length} note(s)` });

  const components = [];
  if (totalPages > 1) {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`note_page:${safePage - 1}:${type || ''}`)
          .setLabel('◀ Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(safePage === 0),
        new ButtonBuilder()
          .setCustomId(`note_page:${safePage + 1}:${type || ''}`)
          .setLabel('Next ▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(safePage >= totalPages - 1),
      ),
    );
  }
  return { embeds: [embed], components };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('note-list')
    .setDescription('List intel notes (Member+).')
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('Filter by type.')
        .addChoices(
          { name: 'Enemy Base', value: 'enemy_base' },
          { name: 'Resource Node', value: 'resource_node' },
          { name: 'Safe House', value: 'safe_house' },
          { name: 'Intel', value: 'intel' },
          { name: 'Other', value: 'other' },
        ),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.MEMBER))) return;
    const type = interaction.options.getString('type') || '';
    return interaction.reply({ ...render(type, 0), ephemeral: true });
  },

  buttons: {
    async note_page(interaction, args) {
      const page = parseInt(args[0], 10) || 0;
      const type = args[1] || '';
      return interaction.update(render(type, page));
    },
  },
};
