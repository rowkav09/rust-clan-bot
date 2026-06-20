'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const { genId } = require('../../utils/ids');
const { requireTier, TIER } = require('../../utils/permissions');

const LETTERS = ['🇦', '🇧', '🇨', '🇩'];

function tallies(poll) {
  return poll.options.map((_, i) => (poll.votes[i] || []).length);
}

function buildPollEmbed(poll) {
  const counts = tallies(poll);
  const total = counts.reduce((a, b) => a + b, 0);

  const lines = poll.options.map((opt, i) => {
    const c = counts[i];
    const pct = total ? Math.round((c / total) * 100) : 0;
    const filled = Math.round(pct / 10);
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
    return `${LETTERS[i]} **${opt}**\n\`${bar}\` ${c} vote(s) · ${pct}%`;
  });

  const embed = new EmbedBuilder()
    .setColor(poll.closed ? embeds.COLORS.info : embeds.COLORS.warning)
    .setTitle(`📊 ${poll.question}`)
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: `Poll ID: ${poll.id} · ${total} total vote(s)` })
    .setTimestamp();

  if (poll.closed) {
    embed.addFields({ name: 'Status', value: '🔒 Closed' });
  } else if (poll.endsAt) {
    embed.addFields({ name: 'Closes', value: time.relative(poll.endsAt) });
  }
  return embed;
}

function buildPollComponents(poll) {
  if (poll.closed) return [];
  const buttons = poll.options.map((opt, i) =>
    new ButtonBuilder()
      .setCustomId(`poll_vote:${poll.id}:${i}`)
      .setLabel(opt.slice(0, 40))
      .setEmoji(LETTERS[i])
      .setStyle(ButtonStyle.Primary),
  );
  // Up to 4 options → fits in one action row.
  return [new ActionRowBuilder().addComponents(buttons)];
}

async function closePoll(client, poll) {
  const polls = db.read('polls');
  const current = polls[poll.id];
  if (!current || current.closed) return;
  current.closed = true;
  db.write('polls', polls);

  const counts = tallies(current);
  const max = Math.max(...counts, 0);
  const winners = current.options.filter((_, i) => counts[i] === max && max > 0);
  const resultText = winners.length
    ? winners.length === 1
      ? `🏆 Winner: **${winners[0]}** (${max} votes)`
      : `🤝 Tie between: **${winners.join(', ')}** (${max} votes each)`
    : 'No votes were cast.';

  try {
    const channel = await client.channels.fetch(current.channelId);
    const msg = await channel.messages.fetch(current.messageId);
    await msg.edit({ embeds: [buildPollEmbed(current)], components: [] });
    await channel.send({
      embeds: [embeds.info(`📊 Poll closed — ${current.question}`, resultText)],
    });
  } catch (err) {
    console.error('[poll] Failed to finalize message:', err.message);
  }
}

module.exports = {
  data: (() => {
    const b = new SlashCommandBuilder()
      .setName('poll')
      .setDescription('Create a poll (Member+).')
      .addStringOption((o) => o.setName('question').setDescription('Poll question.').setRequired(true))
      .addStringOption((o) => o.setName('option1').setDescription('Option A.').setRequired(true))
      .addStringOption((o) => o.setName('option2').setDescription('Option B.').setRequired(true))
      .addStringOption((o) => o.setName('option3').setDescription('Option C.'))
      .addStringOption((o) => o.setName('option4').setDescription('Option D.'))
      .addIntegerOption((o) =>
        o.setName('duration_hours').setDescription('Auto-close after N hours.').setMinValue(1).setMaxValue(720),
      );
    return b;
  })(),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.MEMBER))) return;

    const options = ['option1', 'option2', 'option3', 'option4']
      .map((k) => interaction.options.getString(k))
      .filter(Boolean)
      .map((s) => s.trim());

    const duration = interaction.options.getInteger('duration_hours');
    const id = genId().slice(0, 8);
    const now = new Date();
    const poll = {
      id,
      question: interaction.options.getString('question', true).trim(),
      options,
      votes: {},
      createdBy: interaction.user.id,
      createdAt: now.toISOString(),
      endsAt: duration ? new Date(now.getTime() + duration * 3600000).toISOString() : null,
      messageId: null,
      channelId: interaction.channelId,
      closed: false,
    };
    options.forEach((_, i) => (poll.votes[i] = []));

    await interaction.reply({ embeds: [buildPollEmbed(poll)], components: buildPollComponents(poll) });
    const msg = await interaction.fetchReply();
    poll.messageId = msg.id;

    const polls = db.read('polls');
    polls[id] = poll;
    db.write('polls', polls);
  },

  buttons: {
    async poll_vote(interaction, args) {
      const [pollId, optionIdxRaw] = args;
      const optionIdx = parseInt(optionIdxRaw, 10);
      const polls = db.read('polls');
      const poll = polls[pollId];
      if (!poll) {
        return interaction.reply({
          embeds: [embeds.error('Poll not found', 'This poll no longer exists.')],
          ephemeral: true,
        });
      }
      if (poll.closed) {
        return interaction.reply({
          embeds: [embeds.info('Poll closed', 'Voting has ended for this poll.')],
          ephemeral: true,
        });
      }

      const uid = interaction.user.id;
      const wasSelected = (poll.votes[optionIdx] || []).includes(uid);
      // One vote per user — clear all, then re-add unless toggling off.
      for (const key of Object.keys(poll.votes)) {
        poll.votes[key] = poll.votes[key].filter((id) => id !== uid);
      }
      if (!wasSelected) poll.votes[optionIdx].push(uid);

      db.write('polls', polls);
      return interaction.update({
        embeds: [buildPollEmbed(poll)],
        components: buildPollComponents(poll),
      });
    },
  },

  closePoll,
  buildPollEmbed,
  buildPollComponents,
};
