'use strict';

const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const clan = require('../../utils/clan');
const { genShortId } = require('../../utils/ids');
const { requireTier, TIER, getConfig } = require('../../utils/permissions');

function getRaids() {
  const wipe = db.read('wipe');
  if (!Array.isArray(wipe.currentRaids)) wipe.currentRaids = [];
  if (!Array.isArray(wipe.raidHistory)) wipe.raidHistory = [];
  return wipe;
}

function buildRaidEmbed(raid) {
  const inList = raid.rsvps.in.map((id) => `<@${id}>`).join('\n') || '*none*';
  const outList = raid.rsvps.out.map((id) => `<@${id}>`).join('\n') || '*none*';
  const maybeList = raid.rsvps.maybe.map((id) => `<@${id}>`).join('\n') || '*none*';

  const embed = new EmbedBuilder()
    .setColor(raid.settled ? embeds.COLORS.info : embeds.COLORS.error)
    .setTitle(`💀 RAID — ${raid.name}${raid.settled ? ' (completed)' : ''}`)
    .setDescription(raid.target || '*No target description.*')
    .addFields(
      { name: 'Grid Ref', value: raid.gridRef || '—', inline: true },
      { name: 'When', value: `${time.full(raid.time)}\n${time.relative(raid.time)}`, inline: true },
      { name: 'Slots', value: `IN: ${raid.rsvps.in.length} / ${raid.maxMembers}`, inline: true },
      { name: `✅ In (${raid.rsvps.in.length})`, value: inList, inline: true },
      { name: `❌ Out (${raid.rsvps.out.length})`, value: outList, inline: true },
      { name: `❓ Maybe (${raid.rsvps.maybe.length})`, value: maybeList, inline: true },
    )
    .setFooter({ text: `Raid ID: ${raid.id}` })
    .setTimestamp();
  return embed;
}

function buildRaidComponents(raid) {
  if (raid.settled) return [];
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`raid_rsvp:${raid.id}:in`).setLabel('In').setStyle(ButtonStyle.Success).setEmoji('✅'),
      new ButtonBuilder().setCustomId(`raid_rsvp:${raid.id}:out`).setLabel('Out').setStyle(ButtonStyle.Danger).setEmoji('❌'),
      new ButtonBuilder().setCustomId(`raid_rsvp:${raid.id}:maybe`).setLabel('Maybe').setStyle(ButtonStyle.Secondary).setEmoji('❓'),
    ),
  ];
}

/** Credit attendance for raids whose time has passed. Called from a cron job. */
async function settleRaids(client) {
  const wipe = getRaids();
  const now = Date.now();
  const stillCurrent = [];
  let membersChanged = false;
  const members = db.read('members');
  let wipeChanged = false;

  for (const raid of wipe.currentRaids) {
    if (raid.settled || new Date(raid.time).getTime() > now) {
      stillCurrent.push(raid);
      continue;
    }
    // Credit confirmed attendees.
    for (const uid of raid.rsvps.in) {
      const rec = clan.ensureMember(members, { id: uid, username: `User-${uid}` });
      rec.wipeRaids = (rec.wipeRaids || 0) + 1;
      rec.totalRaids = (rec.totalRaids || 0) + 1;
      clan.syncAllTime(uid, rec);
      membersChanged = true;
    }
    raid.settled = true;
    wipe.raidHistory.push(raid);
    wipeChanged = true;

    // Update the original message to reflect completion.
    try {
      const channel = await client.channels.fetch(raid.channelId);
      const msg = await channel.messages.fetch(raid.messageId);
      await msg.edit({ embeds: [buildRaidEmbed(raid)], components: [] });
    } catch { /* message gone — ignore */ }
  }

  wipe.currentRaids = stillCurrent;
  if (membersChanged) db.write('members', members);
  if (wipeChanged || membersChanged) db.write('wipe', wipe);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Schedule a raid with RSVPs (Member+).'),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.MEMBER))) return;

    const cfg = getConfig();
    if (!cfg.raidChannelId) {
      return interaction.reply({
        embeds: [embeds.error('Not configured', 'No raid channel set. Ask a leader to run `/setup`.')],
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder().setCustomId('raid_modal').setTitle('Schedule Raid');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('name').setLabel('Raid Name').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('target').setLabel('Target Description').setStyle(TextInputStyle.Paragraph).setRequired(true),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('grid').setLabel('Grid Reference').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('e.g. K12'),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('datetime').setLabel('Date/Time (DD/MM HH:MM UTC)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('13/04 20:30'),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('max').setLabel('Max Members').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('8'),
      ),
    );
    await interaction.showModal(modal);
  },

  modals: {
    async raid_modal(interaction, args, client) {
      const datetimeRaw = interaction.fields.getTextInputValue('datetime').trim();
      const parsed = time.parseDateTime(datetimeRaw);
      if (!parsed) {
        return interaction.reply({
          embeds: [embeds.error('Invalid date/time', 'Use `DD/MM HH:MM` (UTC), e.g. `13/04 20:30`.')],
          ephemeral: true,
        });
      }
      const maxRaw = parseInt(interaction.fields.getTextInputValue('max').trim(), 10);
      const maxMembers = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 8;

      await interaction.deferReply({ ephemeral: true });

      const cfg = getConfig();
      const channel = await clan.fetchChannel(client, cfg.raidChannelId);
      if (!channel || !channel.isTextBased?.()) {
        return interaction.editReply({
          embeds: [embeds.error('Failed', 'The raid channel is unavailable.')],
        });
      }

      const raid = {
        id: genShortId(),
        name: interaction.fields.getTextInputValue('name').trim(),
        target: interaction.fields.getTextInputValue('target').trim(),
        gridRef: interaction.fields.getTextInputValue('grid').trim() || null,
        time: parsed.toISOString(),
        maxMembers,
        createdBy: interaction.user.id,
        channelId: channel.id,
        messageId: null,
        settled: false,
        rsvps: { in: [], out: [], maybe: [] },
      };

      const msg = await channel.send({
        content: '@here a new raid has been scheduled!',
        embeds: [buildRaidEmbed(raid)],
        components: buildRaidComponents(raid),
      });
      raid.messageId = msg.id;

      const wipe = getRaids();
      wipe.currentRaids.push(raid);
      db.write('wipe', wipe);

      return interaction.editReply({
        embeds: [embeds.success('Raid scheduled', `**${raid.name}** posted in <#${channel.id}>.`)],
      });
    },
  },

  buttons: {
    async raid_rsvp(interaction, args) {
      const [raidId, choice] = args;
      const wipe = getRaids();
      const raid = wipe.currentRaids.find((r) => r.id === raidId);
      if (!raid) {
        return interaction.reply({
          embeds: [embeds.error('Raid not found', 'This raid is no longer active.')],
          ephemeral: true,
        });
      }
      if (raid.settled) {
        return interaction.reply({
          embeds: [embeds.info('Raid closed', 'This raid has already happened.')],
          ephemeral: true,
        });
      }

      const uid = interaction.user.id;
      const already = raid.rsvps[choice].includes(uid);

      // Remove from every list first.
      for (const key of ['in', 'out', 'maybe']) {
        raid.rsvps[key] = raid.rsvps[key].filter((id) => id !== uid);
      }

      if (!already) {
        if (choice === 'in' && raid.rsvps.in.length >= raid.maxMembers) {
          // Put the user back where they were (nowhere) and warn.
          db.write('wipe', wipe);
          await interaction.update({
            embeds: [buildRaidEmbed(raid)],
            components: buildRaidComponents(raid),
          });
          return interaction.followUp({
            embeds: [embeds.warning('Raid full', `All ${raid.maxMembers} slots are taken.`)],
            ephemeral: true,
          });
        }
        raid.rsvps[choice].push(uid);
      }

      db.write('wipe', wipe);
      return interaction.update({
        embeds: [buildRaidEmbed(raid)],
        components: buildRaidComponents(raid),
      });
    },
  },

  settleRaids,
  buildRaidEmbed,
};
