'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

// ── Registries ──────────────────────────────────────────────────────────────
client.commands = new Collection();
// Component handlers are matched by customId prefix (the part before the first ":").
client.buttonHandlers = [];
client.modalHandlers = [];
client.selectHandlers = [];

/** Recursively collect every .js file under a directory. */
function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function registerHandlers(mod) {
  const collect = (source, target) => {
    if (!source) return;
    for (const [prefix, fn] of Object.entries(source)) {
      if (typeof fn === 'function') target.push({ prefix, fn });
    }
  };
  collect(mod.buttons, client.buttonHandlers);
  collect(mod.modals, client.modalHandlers);
  collect(mod.selects, client.selectHandlers);
}

// ── Load commands ─────────────────────────────────────────────────────────────
const commandsDir = path.join(__dirname, 'commands');
for (const file of walk(commandsDir)) {
  try {
    const mod = require(file);
    if (mod.data && typeof mod.execute === 'function') {
      client.commands.set(mod.data.name, mod);
      registerHandlers(mod);
    } else {
      console.warn(`[load] Skipping ${file}: missing "data" or "execute".`);
    }
  } catch (err) {
    console.error(`[load] Failed to load command ${file}:`, err);
  }
}

// ── Load events ───────────────────────────────────────────────────────────────
const eventsDir = path.join(__dirname, 'events');
for (const file of walk(eventsDir)) {
  try {
    const event = require(file);
    if (!event.name || typeof event.execute !== 'function') {
      console.warn(`[load] Skipping event ${file}: missing "name" or "execute".`);
      continue;
    }
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  } catch (err) {
    console.error(`[load] Failed to load event ${file}:`, err);
  }
}

console.log(
  `[load] ${client.commands.size} commands, ` +
    `${client.buttonHandlers.length} button / ${client.modalHandlers.length} modal / ` +
    `${client.selectHandlers.length} select handlers registered.`,
);

// ── Safety nets ──────────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[process] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[process] Uncaught exception:', err);
});

if (!process.env.BOT_TOKEN) {
  console.error('[fatal] BOT_TOKEN is not set. Fill in your .env file.');
  process.exit(1);
}

client.login(process.env.BOT_TOKEN);
