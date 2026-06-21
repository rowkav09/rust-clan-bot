'use strict';

const { Events } = require('discord.js');
const embeds = require('../utils/embeds');
const time = require('../utils/time');
const { getConfig } = require('../utils/permissions');
const { linkMemberBySteam } = require('../utils/linkplayer');
const steam = require('../utils/steam');

// Only react to an actual Steam profile URL or a 17-digit SteamID64.
// Regular chat is ignored so the channel can still be used to talk.
function extractSteamInput(content) {
  const url = content.match(/https?:\/\/steamcommunity\.com\/(?:id|profiles)\/[^\s]+/i);
  if (url) return url[0];
  const id = content.match(/(?<!\d)\d{17}(?!\d)/);
  if (id) return id[0];
  return null;
}

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    if (message.author.bot || !message.guild) return;
    const cfg = getConfig();
    if (!cfg.linkChannelId || message.channel.id !== cfg.linkChannelId) return;

    const steamInput = extractSteamInput(message.content);
    if (!steamInput) return;

    await message.react('⏳').catch(() => {});

    try {
      const result = await linkMemberBySteam(message.author, steamInput);

      if (result.status === 'no_steam') {
        await message.react('❌').catch(() => {});
        await message.reply({
          embeds: [
            embeds.error(
              'Couldn’t read that profile',
              steam.hasKey()
                ? 'That doesn’t look like a valid Steam profile. Paste your full profile URL ' +
                  '(e.g. `https://steamcommunity.com/id/yourname`) or your SteamID64.'
                : 'No Steam API key is configured, so I can only read **`/profiles/<id>`** style URLs ' +
                  'or a raw SteamID64. Paste one of those, or ask a leader to set `STEAM_API_KEY`.',
            ),
          ],
        });
        return;
      }

      if (result.status === 'linked') {
        await message.react('✅').catch(() => {});
        const hoursLine = result.rustHours != null ? `\n🕒 Rust hours: **${result.rustHours}h**` : '';
        await message.reply({
          embeds: [
            embeds.success(
              'All set! 🎉',
              `Linked to BattleMetrics player \`${result.bmPlayerId}\`` +
                `${result.ingameName ? ` (**${result.ingameName}**)` : ''}.` +
                `${hoursLine}\n\nYour in-game time will now track automatically every 15 minutes. 🦀`,
            ),
          ],
        });
        return;
      }

      // steam_only — Steam saved, but couldn't match a BM profile yet.
      await message.react('☑️').catch(() => {});
      const hoursLine = result.rustHours != null ? ` Verified **${result.rustHours}h** in Rust.` : '';
      await message.reply({
        embeds: [
          embeds.warning(
            'Steam linked — finishing up',
            `Saved your Steam profile.${hoursLine}\n\n` +
              'I couldn’t match your BattleMetrics profile on the clan server yet — this usually ' +
              'resolves automatically once you’ve **played on the server** and BattleMetrics has seen you. ' +
              'Try again after a session, or use `/setbattlemetrics <player id>` if you know it.',
          ),
        ],
      });
    } catch (err) {
      console.error('[messageCreate] link error:', err);
      await message.react('❌').catch(() => {});
    }
  },
};
