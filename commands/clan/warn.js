'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const clan = require('../../utils/clan');
const { genId } = require('../../utils/ids');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a warning to a member (Officer+).')
    .addUserOption((o) => o.setName('member').setDescription('Member to warn.').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the warning.').setRequired(true))
    .addStringOption((o) =>
      o
        .setName('severity')
        .setDescription('Severity of the warning.')
        .setRequired(true)
        .addChoices(
          { name: 'Minor', value: 'minor' },
          { name: 'Major', value: 'major' },
          { name: 'Final', value: 'final' },
        ),
    ),

  async execute(interaction, client) {
    if (!(await requireTier(interaction, TIER.OFFICER))) return;

    const target = interaction.options.getUser('member', true);
    const reason = interaction.options.getString('reason', true);
    const severity = interaction.options.getString('severity', true);

    const id = genId();
    const warnings = db.read('warnings');
    warnings[id] = {
      id,
      userId: target.id,
      issuedBy: interaction.user.id,
      reason,
      severity,
      issuedAt: new Date().toISOString(),
      active: true,
    };
    db.write('warnings', warnings);

    // Increment the member's active warning count.
    const members = db.read('members');
    const rec = clan.ensureMember(members, target);
    const activeCount = Object.values(warnings).filter((w) => w.userId === target.id && w.active).length;
    rec.warnings = activeCount;
    db.write('members', members);

    const sevEmoji = { minor: '⚠️', major: '🟠', final: '🔴' }[severity] || '⚠️';
    const logEmbed = embeds.warning(
      `${sevEmoji} Warning Issued — ${target.username}`,
      `**Member:** <@${target.id}>\n` +
        `**Severity:** ${severity}\n` +
        `**Reason:** ${reason}\n` +
        `**Issued by:** <@${interaction.user.id}>\n` +
        `**Active warnings:** ${activeCount}\n` +
        `\`ID: ${id}\``,
    );
    await clan.log(client, logEmbed);

    // DM the warned member.
    try {
      const u = await client.users.fetch(target.id);
      await u.send({
        embeds: [
          embeds.warning(
            'You received a warning',
            `**Severity:** ${severity}\n**Reason:** ${reason}\n\n` +
              `You now have **${activeCount}** active warning(s).`,
          ),
        ],
      });
    } catch { /* DMs closed */ }

    // Auto-flag at 3+ active warnings.
    if (activeCount >= 3) {
      await clan.log(
        client,
        embeds.error(
          '🚩 Warning Threshold Reached',
          `<@${target.id}> now has **${activeCount}** active warnings and should be reviewed by leadership.`,
        ),
      );
    }

    return interaction.reply({
      embeds: [
        embeds.success(
          'Warning issued',
          `${sevEmoji} <@${target.id}> warned (${severity}). Active warnings: **${activeCount}**.`,
        ),
      ],
      ephemeral: true,
    });
  },
};
