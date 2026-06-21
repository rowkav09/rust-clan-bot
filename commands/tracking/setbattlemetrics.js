'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const clan = require('../../utils/clan');
const bm = require('../../utils/battlemetrics');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbattlemetrics')
    .setDescription('Link your BattleMetrics profile for automatic time tracking.')
    .addStringOption((o) =>
      o
        .setName('player')
        .setDescription('Your BattleMetrics player ID (digits) or exact in-game name.')
        .setRequired(true),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.RECRUIT))) return;

    const input = interaction.options.getString('player', true).trim();
    await interaction.deferReply({ ephemeral: true });

    const srvId = bm.serverId();
    if (!srvId) {
      return interaction.editReply({
        embeds: [
          embeds.error(
            'No server linked',
            'A leader must link the clan server first with `/wipe server <battlemetrics_id>`.',
          ),
        ],
      });
    }

    // Accept a BattleMetrics profile URL or numeric ID directly; else search by name.
    const { extractBmId } = require('../../utils/linkplayer');
    let playerId = extractBmId(input);
    let resolvedName = null;
    if (!playerId) {
      const found = await bm.findPlayerByName(input);
      if (!found) {
        return interaction.editReply({
          embeds: [
            embeds.error(
              'Player not found',
              `Couldn't find a BattleMetrics player named **${input}**. ` +
                'Try your numeric player ID instead (the digits in your BattleMetrics profile URL).',
            ),
          ],
        });
      }
      playerId = found.id;
      resolvedName = found.name;
    }

    // Confirm we can read their time on the clan server, and capture a baseline.
    const info = await bm.getPlayerServerTime(playerId, srvId);
    if (!info) {
      return interaction.editReply({
        embeds: [
          embeds.warning(
            'Linked, but no time recorded yet',
            `Player \`${playerId}\` has no tracked time on the clan server yet. ` +
              'That’s normal if you haven’t played there — your hours will start counting ' +
              'from your next session. (If this seems wrong, double-check the player ID.)',
          ),
        ],
      });
    }

    const members = db.read('members');
    const rec = clan.ensureMember(members, interaction.user);
    rec.bmPlayerId = String(playerId);
    rec.bmLast = info.timePlayed; // baseline — only future time counts toward this wipe
    if (resolvedName) rec.ingameName = resolvedName;
    clan.touch(rec);
    db.write('members', members);

    return interaction.editReply({
      embeds: [
        embeds.success(
          'BattleMetrics linked',
          `Linked to player \`${playerId}\`${resolvedName ? ` (**${resolvedName}**)` : ''}.\n` +
            `Lifetime on this server: **${time.formatHours(info.timePlayed / 3600)}**\n\n` +
            'Your hours will now sync automatically every 15 minutes while you play. ' +
            `${info.online ? '🟢 You appear to be online right now!' : ''}`,
        ),
      ],
    });
  },
};
