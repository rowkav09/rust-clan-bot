'use strict';

const { SlashCommandBuilder, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireTier, TIER, getConfig } = require('../../utils/permissions');

function buildRulesEmbed(guild) {
  const leaderId = getConfig().leaderRoleId;
  const dmLine = leaderId
    ? `DM a <@&${leaderId}> for a report or help.`
    : 'DM a clan leader for a report or help.';

  return embeds
    .info(
      '🌙 Moon Clan — Rules',
      'Keep it simple. Keep it Moon. 🦀\n\n' +
        '**1. No ego.** Leave it at the door — we win and lose as a team.\n' +
        '**2. Respect your clanmates.** No toxicity, no flaming, no drama.\n' +
        '**3. Communicate & share.** Call outs, resources, and play together.\n' +
        '**4. Pull your weight.** Farm, build, defend — everyone contributes.\n' +
        `**5. Need to report something or get help?** ${dmLine}\n\n` +
        '*Break these and a leader will have a word. Now go take some loot. 🌙*',
    )
    .setThumbnail(guild.iconURL({ size: 128 }) || null);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Show the Moon Clan rules (Leaders can post them to a channel).')
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Post the rules publicly here (Leader only).')
        .addChannelTypes(ChannelType.GuildText),
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    // No channel → just show the rules to whoever asked.
    if (!channel) {
      return interaction.reply({ embeds: [buildRulesEmbed(interaction.guild)], ephemeral: true });
    }

    // Posting publicly is a Leader action.
    if (!(await requireTier(interaction, TIER.LEADER))) return;
    try {
      await channel.send({ embeds: [buildRulesEmbed(interaction.guild)] });
    } catch {
      return interaction.reply({
        embeds: [embeds.error('Could not post', `I can’t send messages in ${channel}.`)],
        ephemeral: true,
      });
    }
    return interaction.reply({
      embeds: [embeds.success('Rules posted', `Moon Clan rules posted in ${channel}.`)],
      ephemeral: true,
    });
  },
};
