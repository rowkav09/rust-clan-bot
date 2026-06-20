'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

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

const commands = [];
const commandsDir = path.join(__dirname, 'commands');
for (const file of walk(commandsDir)) {
  try {
    const mod = require(file);
    if (mod.data && typeof mod.execute === 'function') {
      commands.push(mod.data.toJSON());
    }
  } catch (err) {
    console.error(`[deploy] Failed to load ${file}:`, err);
  }
}

const { BOT_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!BOT_TOKEN || !CLIENT_ID) {
  console.error('[deploy] BOT_TOKEN and CLIENT_ID are required in .env.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

(async () => {
  try {
    console.log(`[deploy] Registering ${commands.length} commands...`);

    if (GUILD_ID) {
      // Guild commands update instantly — ideal during development.
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log(`[deploy] Registered guild commands to ${GUILD_ID}.`);
    } else {
      // Global commands can take up to an hour to propagate.
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log('[deploy] Registered global commands.');
    }
  } catch (err) {
    console.error('[deploy] Failed to register commands:', err);
    process.exit(1);
  }
})();
