'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const clan = require('../../utils/clan');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Clan health overview: activity, retention, recruitment (Officer+).'),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.OFFICER))) return;

    const members = Object.values(db.read('members'));
    const apps = Object.values(db.read('applications'));
    const wipe = db.read('wipe');

    const total = members.length;
    const online = members.filter((m) => m.online).length;
    const activeWipe = members.filter((m) => (m.currentWipeHours || 0) > 0).length;
    const inactive7 = members.filter((m) => time.daysSince(m.lastSeen || m.joinedAt) >= 7).length;
    const atRisk = members.filter(
      (m) => (m.currentWipeHours || 0) > 0 && time.daysSince(m.lastSeen || m.joinedAt) >= 3,
    );

    const totalWipeHours = members.reduce((s, m) => s + (m.currentWipeHours || 0), 0);
    const avgHours = activeWipe ? totalWipeHours / activeWipe : 0;
    const topScorer = [...members].sort((a, b) => clan.wipeScore(b) - clan.wipeScore(a))[0];

    const pending = apps.filter((a) => a.status === 'pending').length;
    const approved = apps.filter((a) => a.status === 'approved').length;
    const denied = apps.filter((a) => a.status === 'denied').length;
    const conversion = approved + denied ? Math.round((approved / (approved + denied)) * 100) : 0;

    const retention = total ? Math.round((activeWipe / total) * 100) : 0;

    const embed = embeds
      .info(`📊 Clan Health — Wipe #${wipe.wipeNumber || 1}`)
      .addFields(
        { name: '👥 Members', value: `${total}`, inline: true },
        { name: '🟢 Online now', value: `${online}`, inline: true },
        { name: '✅ Active this wipe', value: `${activeWipe} (${retention}%)`, inline: true },
        { name: '⏱️ Total wipe hours', value: time.formatHours(totalWipeHours), inline: true },
        { name: '📈 Avg / active', value: time.formatHours(avgHours), inline: true },
        { name: '🏆 Top', value: topScorer ? `${topScorer.username} (${clan.wipeScore(topScorer)})` : '—', inline: true },
        { name: '😴 Inactive 7d+', value: `${inactive7}`, inline: true },
        { name: '⚠️ At-risk', value: `${atRisk.length}`, inline: true },
        { name: '📥 Apps (pending/✅/❌)', value: `${pending} / ${approved} / ${denied} · ${conversion}% accept`, inline: true },
      );

    if (atRisk.length) {
      embed.addFields({
        name: 'At-risk members (had hours, quiet 3d+)',
        value: atRisk
          .slice(0, 8)
          .map((m) => `• ${m.username} — last ${time.relative(m.lastSeen || m.joinedAt)}`)
          .join('\n'),
      });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
