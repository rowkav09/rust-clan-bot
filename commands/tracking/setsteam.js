'use strict';

const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const steam = require('../../utils/steam');
const { linkMemberBySteam } = require('../../utils/linkplayer');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setsteam')
    .setDescription('Link a Steam profile (yourself, or another member if you’re an officer).')
    .addStringOption((o) =>
      o
        .setName('steam')
        .setDescription('Steam profile URL, SteamID64, or vanity name.')
        .setRequired(true),
    )
    .addUserOption((o) =>
      o.setName('member').setDescription('Set it for this member instead of yourself (Officer+).'),
    ),

  async execute(interaction) {
    const steamInput = interaction.options.getString('steam', true).trim();
    const target = interaction.options.getUser('member');
    const settingOther = target && target.id !== interaction.user.id;

    // Officers+ may link on behalf of another member; anyone may link themselves.
    if (settingOther) {
      if (!(await requireTier(interaction, TIER.OFFICER))) return;
    } else if (!(await requireTier(interaction, TIER.RECRUIT))) {
      return;
    }

    if (target?.bot) {
      return interaction.reply({
        embeds: [embeds.error('Not a player', 'You can’t link a Steam profile to a bot.')],
        ephemeral: true,
      });
    }

    const user = target || interaction.user;
    const who = settingOther ? `<@${user.id}>` : 'you';
    await interaction.deferReply({ ephemeral: true });

    let result;
    try {
      result = await linkMemberBySteam(user, steamInput);
    } catch (err) {
      console.error('[setsteam] link error:', err.message);
      return interaction.editReply({
        embeds: [embeds.error('Link failed', 'Something went wrong reaching Steam/BattleMetrics. Try again shortly.')],
      });
    }

    if (result.status === 'no_steam') {
      return interaction.editReply({
        embeds: [
          embeds.error(
            'Couldn’t read that profile',
            steam.hasKey()
              ? 'That doesn’t look like a valid Steam profile. Use a full profile URL ' +
                '(e.g. `https://steamcommunity.com/id/yourname`), a SteamID64, or a vanity name.'
              : 'No Steam API key is configured, so I can only read **`/profiles/<id>`** URLs ' +
                'or a raw SteamID64. Use one of those, or ask a leader to set `STEAM_API_KEY`.',
          ),
        ],
      });
    }

    const hoursLine = result.rustHours != null ? `\n🕒 Rust hours: **${result.rustHours}h**` : '';

    if (result.status === 'linked') {
      return interaction.editReply({
        embeds: [
          embeds.success(
            'Linked! 🎉',
            `Linked ${who} to SteamID \`${result.steamid}\` and BattleMetrics player ` +
              `\`${result.bmPlayerId}\`${result.ingameName ? ` (**${result.ingameName}**)` : ''}.` +
              `${hoursLine}\n\nIn-game time will now track automatically every 15 minutes. 🦀`,
          ),
        ],
      });
    }

    // steam_only — Steam saved, BM not matched yet.
    return interaction.editReply({
      embeds: [
        embeds.warning(
          'Steam linked — BattleMetrics pending',
          `Saved SteamID \`${result.steamid}\` for ${who}.${hoursLine}\n\n` +
            'I couldn’t match a BattleMetrics profile on the clan server yet — this usually ' +
            'resolves once they’ve **played on the server**. You can also set it directly with ' +
            '`/setbattlemetrics <player>`.',
        ),
      ],
    });
  },
};
