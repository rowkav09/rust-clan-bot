'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const bm = require('../../utils/battlemetrics');
const { genId } = require('../../utils/ids');
const { requireTier, TIER } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('enemy')
    .setDescription('Track rival players and get alerts when they come online.')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Track a rival by BattleMetrics player ID or name (Officer+).')
        .addStringOption((o) => o.setName('player').setDescription('BM player ID or in-game name.').setRequired(true)),
    )
    .addSubcommand((s) => s.setName('list').setDescription('List tracked rivals + who’s online (Member+).'))
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Stop tracking a rival (Officer+).')
        .addStringOption((o) => o.setName('id').setDescription('The enemy entry ID.').setRequired(true)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      if (!(await requireTier(interaction, TIER.OFFICER))) return;
      await interaction.deferReply({ ephemeral: true });

      const input = interaction.options.getString('player', true).trim();
      let bmId = /^\d+$/.test(input) ? input : null;
      let name = input;
      if (!bmId) {
        const found = await bm.findPlayerByName(input);
        if (!found) {
          return interaction.editReply({
            embeds: [embeds.error('Not found', `No BattleMetrics player named **${input}**.`)],
          });
        }
        bmId = found.id;
        name = found.name || input;
      }

      const id = genId().slice(0, 8);
      const enemies = db.read('enemies');
      enemies[id] = {
        id,
        bmPlayerId: bmId,
        name,
        addedBy: interaction.user.id,
        addedAt: new Date().toISOString(),
        online: false,
        lastSeen: null,
      };
      db.write('enemies', enemies);

      return interaction.editReply({
        embeds: [embeds.success('Rival tracked', `👁️ \`${id}\` — **${name}** (BM \`${bmId}\`). You’ll be alerted when they log on.`)],
      });
    }

    if (sub === 'list') {
      if (!(await requireTier(interaction, TIER.MEMBER))) return;
      const enemies = Object.values(db.read('enemies'));
      if (enemies.length === 0) {
        return interaction.reply({
          embeds: [embeds.info('No rivals tracked', 'Add one with `/enemy add <player>`.')],
          ephemeral: true,
        });
      }
      const lines = enemies
        .sort((a, b) => Number(b.online) - Number(a.online))
        .map((e) => {
          const status = e.online ? '🟢 ONLINE' : '⚪ offline';
          const seen = e.lastSeen ? ` · last ${time.relative(e.lastSeen)}` : '';
          return `${status} **${e.name}** \`${e.id}\`${seen}`;
        });
      return interaction.reply({
        embeds: [embeds.info(`👁️ Tracked Rivals (${enemies.length})`, lines.join('\n'))],
      });
    }

    if (sub === 'remove') {
      if (!(await requireTier(interaction, TIER.OFFICER))) return;
      const id = interaction.options.getString('id', true).trim();
      const enemies = db.read('enemies');
      if (!enemies[id]) {
        return interaction.reply({
          embeds: [embeds.error('Not found', `No tracked rival with ID \`${id}\`.`)],
          ephemeral: true,
        });
      }
      const name = enemies[id].name;
      delete enemies[id];
      db.write('enemies', enemies);
      return interaction.reply({
        embeds: [embeds.success('Removed', `No longer tracking **${name}**.`)],
        ephemeral: true,
      });
    }
  },
};
