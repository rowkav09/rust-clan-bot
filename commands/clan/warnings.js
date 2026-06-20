'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('List active warnings for a member (Officer+).')
    .addUserOption((o) => o.setName('member').setDescription('Member to check.').setRequired(true)),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.OFFICER))) return;

    const target = interaction.options.getUser('member', true);
    const warnings = db.read('warnings');
    const active = Object.values(warnings)
      .filter((w) => w.userId === target.id && w.active)
      .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

    if (active.length === 0) {
      return interaction.reply({
        embeds: [embeds.success('Clean record', `<@${target.id}> has no active warnings.`)],
        ephemeral: true,
      });
    }

    const sevEmoji = { minor: '⚠️', major: '🟠', final: '🔴' };
    const embed = embeds.warning(`Active Warnings — ${target.username} (${active.length})`);
    for (const w of active.slice(0, 25)) {
      embed.addFields({
        name: `${sevEmoji[w.severity] || '⚠️'} ${w.severity} · \`${w.id}\``,
        value: `${w.reason}\n*by <@${w.issuedBy}> · ${time.relative(w.issuedAt)}*`,
      });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
