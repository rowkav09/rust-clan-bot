'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const clan = require('../../utils/clan');
const { requireTier, TIER, getTier, getConfig } = require('../../utils/permissions');

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

    // ── 2. Post an ID card for each linked member not yet in the channel ─
    const linked = Object.entries(members)
      .filter(([, m]) => m.steamId)
      .sort((a, b) => (a[1].ingameName || a[1].username || '').localeCompare(b[1].ingameName || b[1].username || ''));

    let synced = 0;
    let skipped = 0;
    let channelNote = '';
    const idChannel = await clan.fetchChannel(client, cfg.idLogChannelId);
    if (!cfg.idLogChannelId) {
      channelNote = '\n⚠️ No ID channel set — run `/automation id-channel` to enable the roster.';
    } else if (!idChannel || !idChannel.isTextBased?.()) {
      channelNote = '\n⚠️ The configured ID channel is unavailable.';
    } else {
      // Scan recent history so we never duplicate someone already posted
      // (covers cards posted before the idPosted flag existed).
      const postedIds = new Set();
      const postedSteam = new Set();
      try {
        const history = await idChannel.messages.fetch({ limit: 100 });
        for (const msg of history.values()) {
          if (msg.author.id !== client.user.id) continue;
          let text = msg.content || '';
          for (const e of msg.embeds) text += `\n${e.title || ''}\n${e.description || ''}`;
          for (const mm of text.matchAll(/<@!?(\d+)>/g)) postedIds.add(mm[1]);
          for (const mm of text.matchAll(/\b(7656\d{13})\b/g)) postedSteam.add(mm[1]);
        }
      } catch { /* ignore history fetch failures */ }

      for (const [id, m] of linked) {
        const already = m.idPosted || postedIds.has(id) || postedSteam.has(m.steamId);
        if (already) {
          if (!m.idPosted) m.idPosted = true; // backfill the flag
          skipped += 1;
          continue;
        }
        const gm = guild.members.cache.get(id);
        const user = gm?.user || { id, displayAvatarURL: () => null };
        const result = {
          steamid: m.steamId,
          bmPlayerId: m.bmPlayerId || null,
          ingameName: m.ingameName || null,
          rustHours: m.steamRustHours ?? null,
          status: m.bmPlayerId ? 'linked' : 'steam_only',
        };
        await clan.logIdLink(client, user, result); // posts the card + sets idPosted
        synced += 1;
      }
      db.write('members', members); // persist backfilled idPosted flags
    }

    // ── Summary ────────────────────────────────────────────────────────
    let desc =
      `🔒 Marked **${marked}** member(s) without a linked ID as Unverified.\n` +
      `🆔 Posted **${synced}** new ID card(s)${skipped ? ` (${skipped} already in the channel)` : ''} to ${idChannel ? `<#${cfg.idLogChannelId}>` : 'the ID channel'}.`;
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
