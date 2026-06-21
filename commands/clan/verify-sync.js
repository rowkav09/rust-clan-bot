'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const clan = require('../../utils/clan');
const { requireTier, TIER, getTier, getConfig } = require('../../utils/permissions');

/** Split an array of lines into messages under Discord's embed-description limit. */
function chunkLines(lines, max = 3500) {
  const chunks = [];
  let buf = '';
  for (const line of lines) {
    if ((buf + line + '\n').length > max) {
      chunks.push(buf);
      buf = '';
    }
    buf += line + '\n';
  }
  if (buf) chunks.push(buf);
  return chunks;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify-sync')
    .setDescription('Unverify members with no linked SteamID + post all linked IDs to the ID channel (Leader).'),

  async execute(interaction, client) {
    if (!(await requireTier(interaction, TIER.LEADER))) return;
    await interaction.deferReply({ ephemeral: true });

    const cfg = getConfig();
    const guild = interaction.guild;
    const members = db.read('members');

    // Need the full member list to catch people not in members.json.
    await guild.members.fetch().catch(() => {});

    // ── 1. Mark ID-less members as Unverified ──────────────────────────
    let marked = 0;
    const problems = [];
    if (cfg.unverifiedRoleId) {
      for (const gm of guild.members.cache.values()) {
        if (gm.user.bot) continue;
        if (getTier(gm) >= TIER.OFFICER) continue; // never touch staff

        const rec = members[gm.id];
        if (rec && rec.steamId) continue; // has a linked ID — fine

        const add = await clan.assignRole(guild, gm.id, cfg.unverifiedRoleId);
        if (!add.ok) {
          problems.push(`<@${gm.id}> — ${clan.roleErrorText(add.reason, cfg.unverifiedRoleId)}`);
          continue;
        }
        // Drop the verified (recruit) role so they truly read as unverified.
        if (cfg.recruitRoleId && gm.roles.cache.has(cfg.recruitRoleId)) {
          await clan.removeRole(guild, gm.id, cfg.recruitRoleId).catch(() => {});
        }
        marked += 1;
      }
    }

    // ── 2. Sync all linked SteamIDs to the ID channel ──────────────────
    const linked = Object.entries(members)
      .filter(([, m]) => m.steamId)
      .sort((a, b) => (a[1].ingameName || a[1].username || '').localeCompare(b[1].ingameName || b[1].username || ''));

    let synced = 0;
    let channelNote = '';
    const idChannel = await clan.fetchChannel(client, cfg.idLogChannelId);
    if (!cfg.idLogChannelId) {
      channelNote = '\n⚠️ No ID channel set — run `/automation id-channel` to enable the roster.';
    } else if (!idChannel || !idChannel.isTextBased?.()) {
      channelNote = '\n⚠️ The configured ID channel is unavailable.';
    } else {
      const lines = linked.map(([id, m]) => {
        const bm = m.bmPlayerId ? ` · BM \`${m.bmPlayerId}\`` : '';
        const name = m.ingameName ? ` (${m.ingameName})` : '';
        return `• <@${id}>${name} — \`${m.steamId}\`${bm}`;
      });
      const chunks = lines.length ? chunkLines(lines) : ['*No members have linked a SteamID yet.*'];
      for (let i = 0; i < chunks.length; i++) {
        const title = chunks.length > 1 ? `🆔 Linked SteamIDs (${i + 1}/${chunks.length})` : '🆔 Linked SteamIDs';
        await idChannel.send({ embeds: [embeds.info(title, chunks[i])] }).catch(() => {});
      }
      synced = linked.length;
    }

    // ── Summary ────────────────────────────────────────────────────────
    let desc =
      `🔒 Marked **${marked}** member(s) without a linked ID as Unverified.\n` +
      `🆔 Posted **${synced}** linked SteamID(s) to ${idChannel ? `<#${cfg.idLogChannelId}>` : 'the ID channel'}.`;
    if (!cfg.unverifiedRoleId) {
      desc += '\n\n⚠️ No Unverified role configured — set one with `/automation unverified-role` to enable marking.';
    }
    if (problems.length) {
      desc += `\n\n**Couldn’t mark ${problems.length}:**\n` + problems.slice(0, 10).join('\n');
    }
    desc += channelNote;

    return interaction.editReply({ embeds: [embeds.success('Verification sync complete', desc)] });
  },
};
