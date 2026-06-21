'use strict';

const { Events } = require('discord.js');
const db = require('../utils/db');
const time = require('../utils/time');
const clan = require('../utils/clan');
const { getConfig } = require('../utils/permissions');

// "Counting" = in a voice channel that isn't the AFK channel, and not deafened.
function isCounting(state) {
  if (!state.channelId) return false;
  if (state.guild && state.channelId === state.guild.afkChannelId) return false;
  if (state.deaf || state.selfDeaf) return false;
  return true;
}

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(oldState, newState) {
    const cfg = getConfig();
    if (!cfg.automation.vcTracking) return;

    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const members = db.read('members');
    const rec = clan.ensureMember(members, member.user);

    // Close any open counting interval and bank the time.
    if (rec.vcJoinedAt) {
      const hrs = time.hoursBetween(rec.vcJoinedAt);
      if (hrs > 0 && hrs < 24) {
        rec.vcHours = Number(((rec.vcHours || 0) + hrs).toFixed(3));
        rec.vcCurrentWipe = Number(((rec.vcCurrentWipe || 0) + hrs).toFixed(3));
      }
      rec.vcJoinedAt = null;
    }

    // Open a new interval if they're now actively in voice.
    if (isCounting(newState)) {
      rec.vcJoinedAt = new Date().toISOString();
      clan.touch(rec);
    }

    db.write('members', members);
  },
};
