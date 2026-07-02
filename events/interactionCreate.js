'use strict';

const { Events } = require('discord.js');
const embeds = require('../utils/embeds');
const { getConfig } = require('../utils/permissions');

// Command → feature module. Disabling a module from the dashboard turns its
// slash commands off. Admin commands (setup/automation/…) are never gated.
const COMMAND_MODULES = {
  checkin: 'tracking', checkout: 'tracking', online: 'tracking', stats: 'tracking',
  setbattlemetrics: 'tracking', setingamename: 'tracking', setsteam: 'tracking',
  leaderboard: 'tracking', 'wipe-history': 'tracking',
  'task-assign': 'tasks', 'task-auto': 'tasks', 'task-delete': 'tasks',
  'task-list': 'tasks', 'task-status': 'tasks',
  wipe: 'wipe', raid: 'wipe',
  serverstatus: 'battlemetrics', popgraph: 'battlemetrics',
  enemy: 'intel', 'note-add': 'intel', 'note-delete': 'intel', 'note-list': 'intel',
  poll: 'polls',
  ally: 'allies',
  apply: 'clan', 'application-review': 'clan', warn: 'clan', warnings: 'clan',
  clearwarning: 'clan', 'member-info': 'clan', activity: 'clan',
  'verify-sync': 'clan', panel: 'clan', rules: 'clan', dashboard: 'clan',
  rustplus: 'rustplus',
};

function errorReply(interaction) {
  const embed = embeds.error(
    'Something went wrong',
    'An unexpected error occurred while handling that interaction. ' +
      'The issue has been logged.',
  );
  const payload = { embeds: [embed], ephemeral: true };
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply({ embeds: [embed] }).catch(() => {});
  }
  return interaction.reply(payload).catch(() => {});
}

/** Find a component handler whose prefix matches the customId's prefix. */
function matchHandler(handlers, customId) {
  const prefix = customId.split(':')[0];
  return handlers.find((h) => h.prefix === prefix);
}

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    try {
      // ── Slash commands ──────────────────────────────────────────────
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          return interaction.reply({
            embeds: [embeds.error('Unknown command', 'That command is not registered.')],
            ephemeral: true,
          });
        }
        const moduleKey = COMMAND_MODULES[interaction.commandName];
        if (moduleKey && getConfig().modules[moduleKey] === false) {
          return interaction.reply({
            embeds: [
              embeds.error(
                'Module disabled',
                `The **${moduleKey}** module is turned off for this server. ` +
                  'A Leader can re-enable it from the web dashboard.',
              ),
            ],
            ephemeral: true,
          });
        }
        return await command.execute(interaction, client);
      }

      // ── Autocomplete ────────────────────────────────────────────────
      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command && typeof command.autocomplete === 'function') {
          return await command.autocomplete(interaction, client);
        }
        return;
      }

      // ── Buttons ─────────────────────────────────────────────────────
      if (interaction.isButton()) {
        const handler = matchHandler(client.buttonHandlers, interaction.customId);
        if (!handler) return;
        const args = interaction.customId.split(':').slice(1);
        return await handler.fn(interaction, args, client);
      }

      // ── Select menus ────────────────────────────────────────────────
      if (interaction.isAnySelectMenu()) {
        const handler = matchHandler(client.selectHandlers, interaction.customId);
        if (!handler) return;
        const args = interaction.customId.split(':').slice(1);
        return await handler.fn(interaction, args, client);
      }

      // ── Modal submissions ───────────────────────────────────────────
      if (interaction.isModalSubmit()) {
        const handler = matchHandler(client.modalHandlers, interaction.customId);
        if (!handler) return;
        const args = interaction.customId.split(':').slice(1);
        return await handler.fn(interaction, args, client);
      }
    } catch (err) {
      console.error(
        `[interaction] Error handling ${interaction.type} (${interaction.customId || interaction.commandName}):`,
        err,
      );
      await errorReply(interaction);
    }
  },
};
