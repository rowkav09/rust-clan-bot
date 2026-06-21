'use strict';

const { SlashCommandBuilder, ChannelType, AttachmentBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const rustplus = require('../../utils/rustplus');
const { requireTier, TIER, getConfig } = require('../../utils/permissions');

const CHANNEL_TYPES = {
  chat: ['rustplusChatChannelId', 'Team chat bridge'],
  events: ['rustplusEventChannelId', 'Game events'],
  alarms: ['rustplusAlarmChannelId', 'Smart alarms'],
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rustplus')
    .setDescription('Rust+ live integration — chat bridge, alarms, events and map.')
    .addSubcommand((s) => s.setName('status').setDescription('Show Rust+ connection and live server status.'))
    .addSubcommand((s) => s.setName('pair').setDescription('How to pair the bot with your Rust server.'))
    .addSubcommand((s) =>
      s
        .setName('say')
        .setDescription('Send a message to in-game team chat (Member+).')
        .addStringOption((o) => o.setName('message').setDescription('Message to send in-game.').setRequired(true)),
    )
    .addSubcommand((s) => s.setName('map').setDescription('Post the current in-game map image (Member+).'))
    .addSubcommand((s) =>
      s
        .setName('channel')
        .setDescription('Set a Rust+ channel (Leader).')
        .addStringOption((o) =>
          o
            .setName('type')
            .setDescription('Which Rust+ channel to set.')
            .setRequired(true)
            .addChoices(
              { name: 'Team chat bridge', value: 'chat' },
              { name: 'Game events (cargo/heli/etc)', value: 'events' },
              { name: 'Smart alarms', value: 'alarms' },
            ),
        )
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Target text channel.').addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('invite')
        .setDescription('Invite a player to the in-game clan/team — modded servers only (Officer+).')
        .addUserOption((o) => o.setName('member').setDescription('A linked clan member to invite.'))
        .addStringOption((o) => o.setName('steamid').setDescription('Or a raw SteamID64.')),
    )
    .addSubcommand((s) =>
      s
        .setName('invite-command')
        .setDescription('Set the in-game invite command template (Leader).')
        .addStringOption((o) =>
          o
            .setName('template')
            .setDescription('Use {steamid} as the placeholder, e.g. /clan invite {steamid}')
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── /rustplus pair ─────────────────────────────────────────────────
    if (sub === 'pair') {
      return interaction.reply({
        embeds: [
          embeds.info(
            '🔗 Pairing Rust+',
            'Rust+ lets the bot read team chat, smart alarms, map events and more.\n\n' +
              '**One-time setup:**\n' +
              '1. Run `npm run rustplus:register` — a browser opens to log in with Steam.\n' +
              '2. This saves `rustplus.config.json` and starts listening for pairings.\n' +
              '3. In-game, open the **Rust+** menu and tap **Pair** on the server.\n' +
              '4. The bot auto-saves the server and connects — you’ll see a ✅ here.\n\n' +
              '**Headless / no browser on the host?** Run step 1 on your own PC, then copy ' +
              'the generated `rustplus.config.json` into the bot’s folder and restart. When ' +
              'you tap **Pair** in-game, the bot picks it up automatically.\n\n' +
              '**Smart alarms:** pair any Smart Alarm in-game and its triggers are forwarded ' +
              'to your alarms channel.\n\n' +
              '**Clan invites (modded):** `/rustplus invite` sends your server’s invite ' +
              'command in team chat. Set the template with `/rustplus invite-command`.\n\n' +
              'Set channels with `/rustplus channel`. Toggle features with `/automation toggle`.',
          ),
        ],
        ephemeral: true,
      });
    }

    // ── /rustplus status ───────────────────────────────────────────────
    if (sub === 'status') {
      await interaction.deferReply({ ephemeral: true });
      const creds = rustplus.getServerCreds();
      if (!creds) {
        return interaction.editReply({
          embeds: [
            embeds.warning('Not paired yet', 'No Rust+ server is paired. Run `/rustplus pair` for setup steps.'),
          ],
        });
      }
      if (!rustplus.isReady()) {
        return interaction.editReply({
          embeds: [
            embeds.warning(
              'Paired, not connected',
              `Saved **${creds.name || creds.ip}** but the websocket isn’t connected right now. ` +
                'It retries automatically — check the server is online.',
            ),
          ],
        });
      }
      let info = null;
      try { info = await rustplus.info(); } catch { /* ignore */ }
      const embed = embeds.success('🟢 Rust+ connected', `**${creds.name || creds.ip}**`);
      if (info) {
        embed.addFields(
          { name: 'Players', value: `${info.players}/${info.maxPlayers}${info.queuedPlayers ? ` (+${info.queuedPlayers} queue)` : ''}`, inline: true },
          { name: 'Map', value: `${info.map || '—'}`, inline: true },
          { name: 'Wipe', value: info.wipeTime ? `<t:${info.wipeTime}:R>` : '—', inline: true },
        );
      }
      return interaction.editReply({ embeds: [embed] });
    }

    // ── /rustplus say ──────────────────────────────────────────────────
    if (sub === 'say') {
      if (!(await requireTier(interaction, TIER.MEMBER))) return;
      const message = interaction.options.getString('message', true).trim();
      await interaction.deferReply({ ephemeral: true });
      if (!rustplus.isReady()) {
        return interaction.editReply({
          embeds: [embeds.error('Not connected', 'Rust+ isn’t connected. See `/rustplus status`.')],
        });
      }
      const author = interaction.member?.displayName || interaction.user.username;
      const ok = await rustplus.say(`[${author}] ${message}`.slice(0, 128));
      return interaction.editReply({
        embeds: ok
          ? [embeds.success('Sent', 'Message delivered to in-game team chat. 🎮')]
          : [embeds.error('Failed', 'Could not send the message in-game.')],
      });
    }

    // ── /rustplus map ──────────────────────────────────────────────────
    if (sub === 'map') {
      if (!(await requireTier(interaction, TIER.MEMBER))) return;
      await interaction.deferReply();
      if (!rustplus.isReady()) {
        return interaction.editReply({
          embeds: [embeds.error('Not connected', 'Rust+ isn’t connected. See `/rustplus status`.')],
        });
      }
      let map = null;
      try { map = await rustplus.map(); } catch { /* ignore */ }
      if (!map || !map.jpgImage) {
        return interaction.editReply({
          embeds: [embeds.error('No map', 'Couldn’t fetch the map image from the server.')],
        });
      }
      const file = new AttachmentBuilder(Buffer.from(map.jpgImage), { name: 'map.jpg' });
      const embed = embeds.wipe('🗺️ Live Map').setImage('attachment://map.jpg');
      return interaction.editReply({ embeds: [embed], files: [file] });
    }

    // ── /rustplus channel ──────────────────────────────────────────────
    if (sub === 'channel') {
      if (!(await requireTier(interaction, TIER.LEADER))) return;
      const type = interaction.options.getString('type', true);
      const channel = interaction.options.getChannel('channel', true);
      const meta = CHANNEL_TYPES[type];
      if (!meta) return;
      const cfg = db.read('config');
      cfg[meta[0]] = channel.id;
      db.write('config', cfg);
      return interaction.reply({
        embeds: [embeds.success('Updated', `**${meta[1]}** channel set to ${channel}.`)],
        ephemeral: true,
      });
    }

    // ── /rustplus invite ───────────────────────────────────────────────
    if (sub === 'invite') {
      if (!(await requireTier(interaction, TIER.OFFICER))) return;
      const member = interaction.options.getUser('member');
      let steamid = interaction.options.getString('steamid')?.trim() || null;

      if (member && !steamid) {
        const rec = db.read('members')[member.id];
        steamid = rec?.steamId || null;
        if (!steamid) {
          return interaction.reply({
            embeds: [embeds.error('No linked SteamID', `${member} hasn’t linked a Steam ID yet (🆔 Link ID or \`/setsteam\`).`)],
            ephemeral: true,
          });
        }
      }
      if (!steamid) {
        return interaction.reply({
          embeds: [embeds.error('Nothing to invite', 'Provide a member (with a linked ID) or a raw SteamID64.')],
          ephemeral: true,
        });
      }
      if (!/^\d{17}$/.test(steamid)) {
        return interaction.reply({
          embeds: [embeds.error('Bad SteamID', 'That doesn’t look like a SteamID64 (17 digits).')],
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });
      if (!rustplus.isReady()) {
        return interaction.editReply({
          embeds: [embeds.error('Not connected', 'Rust+ isn’t connected. See `/rustplus status`.')],
        });
      }
      const cfg = getConfig();
      const command = (cfg.rustplusInviteCommand || '/clan invite {steamid}').replace('{steamid}', steamid);
      const ok = await rustplus.say(command);
      return interaction.editReply({
        embeds: ok
          ? [
              embeds.success(
                'Invite sent',
                `Sent in team chat: \`${command}\`\n\n` +
                  '*Only works on modded servers that read team-chat commands, and the paired ' +
                  'account needs permission to invite. Tweak the command with `/rustplus invite-command`.*',
              ),
            ]
          : [embeds.error('Failed', 'Could not send the command in-game.')],
      });
    }

    // ── /rustplus invite-command ───────────────────────────────────────
    if (sub === 'invite-command') {
      if (!(await requireTier(interaction, TIER.LEADER))) return;
      const template = interaction.options.getString('template', true).trim();
      if (!template.includes('{steamid}')) {
        return interaction.reply({
          embeds: [embeds.warning('Missing placeholder', 'Include `{steamid}` so I know where to insert the ID, e.g. `/clan invite {steamid}`.')],
          ephemeral: true,
        });
      }
      const cfg = db.read('config');
      cfg.rustplusInviteCommand = template;
      db.write('config', cfg);
      return interaction.reply({
        embeds: [embeds.success('Updated', `In-game invite command set to:\n\`${template}\``)],
        ephemeral: true,
      });
    }
  },
};
