'use strict';

const { Events } = require('discord.js');
const embeds = require('../utils/embeds');
const clan = require('../utils/clan');
const { getConfig } = require('../utils/permissions');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member, client) {
    if (member.user.bot) return;
    const cfg = getConfig();

    // ── Auto-assign the Unverified role ────────────────────────────────
    let roleProblem = null;
    if (cfg.automation.autoUnverifiedRole && cfg.unverifiedRoleId) {
      const res = await clan.assignRole(member.guild, member.id, cfg.unverifiedRoleId);
      if (!res.ok) {
        roleProblem = clan.roleErrorText(res.reason, cfg.unverifiedRoleId);
        console.error(`[guildMemberAdd] Could not assign Unverified role to ${member.user.tag}: ${res.reason}`);
        // Surface the problem to leaders so it gets fixed.
        await clan.log(client, embeds.warning(
          'Could not assign Unverified role',
          `New member <@${member.id}> joined but I couldn’t give them the Unverified role.\n${roleProblem}`,
        )).catch(() => {});
      }
    }

    // ── Welcome DM with verification instructions ──────────────────────
    const embed = embeds
      .info(
        `Welcome to ${member.guild.name}! 🦀`,
        'You’ve joined as **Unverified**. To get access and join the roster, ' +
          'use the **`/apply`** command (or the Apply button if there’s an application panel) ' +
          'to open a verification ticket.\n\n' +
          'An officer will review it' +
          (cfg.automation.autoApproveApplications ? ' (or it’s approved automatically)' : '') +
          ', then you’ll be verified. Good luck!',
      )
      .setThumbnail(member.guild.iconURL({ size: 128 }) || null);

    try {
      await member.send({ embeds: [embed] });
    } catch {
      console.log(`[guildMemberAdd] Could not DM ${member.user.tag} (DMs closed).`);
    }
  },
};
