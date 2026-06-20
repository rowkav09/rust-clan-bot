'use strict';

const { Events } = require('discord.js');
const embeds = require('../utils/embeds');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    const embed = embeds
      .info(
        `Welcome to ${member.guild.name}! 🦀`,
        'This server is home to a Rust clan. If you would like to join the ' +
          'roster, use the **`/apply`** command anywhere in the server to ' +
          'submit an application.\n\n' +
          'An officer will review it and get back to you. Good luck!',
      )
      .setThumbnail(member.guild.iconURL({ size: 128 }) || null);

    try {
      await member.send({ embeds: [embed] });
    } catch {
      // DMs closed — nothing we can do, fail silently.
      console.log(`[guildMemberAdd] Could not DM ${member.user.tag} (DMs closed).`);
    }
  },
};
