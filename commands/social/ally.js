'use strict';

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const { genId } = require('../../utils/ids');
const { requireTier, TIER } = require('../../utils/permissions');

const STATUS_EMOJI = { active: '🤝', neutral: '⚪', enemy: '💀' };
const STATUS_ORDER = { active: 0, neutral: 1, enemy: 2 };
const FIELD_MAP = {
  clan_name: 'clanName',
  status: 'status',
  contact_name: 'contactName',
  discord_invite: 'discordInvite',
  notes: 'notes',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ally')
    .setDescription('Track allied, neutral and enemy clans.')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a clan relationship (Officer+).')
        .addStringOption((o) => o.setName('clan_name').setDescription('Clan name.').setRequired(true))
        .addStringOption((o) =>
          o
            .setName('status')
            .setDescription('Relationship.')
            .setRequired(true)
            .addChoices(
              { name: 'Active (ally)', value: 'active' },
              { name: 'Neutral', value: 'neutral' },
              { name: 'Enemy', value: 'enemy' },
            ),
        )
        .addStringOption((o) => o.setName('contact_name').setDescription('Primary contact.'))
        .addStringOption((o) => o.setName('discord_invite').setDescription('Discord invite link.'))
        .addStringOption((o) => o.setName('notes').setDescription('Free-form notes.')),
    )
    .addSubcommand((s) =>
      s
        .setName('list')
        .setDescription('List tracked clans (Member+).')
        .addStringOption((o) =>
          o
            .setName('status')
            .setDescription('Filter by status.')
            .addChoices(
              { name: 'Active (ally)', value: 'active' },
              { name: 'Neutral', value: 'neutral' },
              { name: 'Enemy', value: 'enemy' },
            ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a tracked clan (Leader only).')
        .addStringOption((o) => o.setName('ally_id').setDescription('The ally ID.').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('update')
        .setDescription('Update a field on a tracked clan (Officer+).')
        .addStringOption((o) => o.setName('ally_id').setDescription('The ally ID.').setRequired(true))
        .addStringOption((o) =>
          o
            .setName('field')
            .setDescription('Field to update.')
            .setRequired(true)
            .addChoices(
              { name: 'Clan Name', value: 'clan_name' },
              { name: 'Status', value: 'status' },
              { name: 'Contact Name', value: 'contact_name' },
              { name: 'Discord Invite', value: 'discord_invite' },
              { name: 'Notes', value: 'notes' },
            ),
        )
        .addStringOption((o) => o.setName('value').setDescription('New value.').setRequired(true)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      if (!(await requireTier(interaction, TIER.OFFICER))) return;
      const id = genId();
      const allies = db.read('allies');
      allies[id] = {
        id,
        clanName: interaction.options.getString('clan_name', true).trim(),
        discordInvite: interaction.options.getString('discord_invite')?.trim() || null,
        contactName: interaction.options.getString('contact_name')?.trim() || '—',
        notes: interaction.options.getString('notes')?.trim() || '',
        status: interaction.options.getString('status', true),
        addedBy: interaction.user.id,
        addedAt: new Date().toISOString(),
      };
      db.write('allies', allies);
      return interaction.reply({
        embeds: [
          embeds.success(
            'Clan added',
            `${STATUS_EMOJI[allies[id].status]} \`${id}\` — **${allies[id].clanName}** (${allies[id].status}).`,
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === 'list') {
      if (!(await requireTier(interaction, TIER.MEMBER))) return;
      const filter = interaction.options.getString('status');
      let allies = Object.values(db.read('allies'));
      if (filter) allies = allies.filter((a) => a.status === filter);
      allies.sort((a, b) => (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || a.clanName.localeCompare(b.clanName));

      if (allies.length === 0) {
        return interaction.reply({
          embeds: [embeds.info('No clans tracked', 'Nothing here yet. Add one with `/ally add`.')],
          ephemeral: true,
        });
      }

      const embed = embeds.info(`Tracked Clans (${allies.length})`);
      for (const a of allies.slice(0, 25)) {
        const invite = a.discordInvite ? ` · [discord](${a.discordInvite})` : '';
        embed.addFields({
          name: `${STATUS_EMOJI[a.status] || '⚪'} ${a.clanName}  \`${a.id}\``,
          value: `*${a.status}* · contact: ${a.contactName}${invite}\n${a.notes || ''}`.trim(),
        });
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'remove') {
      if (!(await requireTier(interaction, TIER.LEADER))) return;
      const id = interaction.options.getString('ally_id', true).trim();
      const allies = db.read('allies');
      if (!allies[id]) {
        return interaction.reply({
          embeds: [embeds.error('Not found', `No clan with ID \`${id}\`.`)],
          ephemeral: true,
        });
      }
      const name = allies[id].clanName;
      delete allies[id];
      db.write('allies', allies);
      return interaction.reply({
        embeds: [embeds.success('Clan removed', `Removed **${name}** (\`${id}\`).`)],
        ephemeral: true,
      });
    }

    if (sub === 'update') {
      if (!(await requireTier(interaction, TIER.OFFICER))) return;
      const id = interaction.options.getString('ally_id', true).trim();
      const field = interaction.options.getString('field', true);
      const value = interaction.options.getString('value', true).trim();

      const allies = db.read('allies');
      const ally = allies[id];
      if (!ally) {
        return interaction.reply({
          embeds: [embeds.error('Not found', `No clan with ID \`${id}\`.`)],
          ephemeral: true,
        });
      }

      const key = FIELD_MAP[field];
      if (key === 'status' && !['active', 'neutral', 'enemy'].includes(value.toLowerCase())) {
        return interaction.reply({
          embeds: [embeds.error('Invalid status', 'Status must be `active`, `neutral` or `enemy`.')],
          ephemeral: true,
        });
      }
      ally[key] = key === 'status' ? value.toLowerCase() : value;
      db.write('allies', allies);

      return interaction.reply({
        embeds: [embeds.success('Clan updated', `Updated **${field}** for **${ally.clanName}** (\`${id}\`).`)],
        ephemeral: true,
      });
    }
  },
};
