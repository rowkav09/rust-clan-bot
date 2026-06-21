'use strict';

const { Events, ActivityType } = require('discord.js');
const db = require('../utils/db');

const wipeCountdown = require('../jobs/wipeCountdown');
const deadlineReminder = require('../jobs/deadlineReminder');
const activityCheck = require('../jobs/activityCheck');
const pollExpiry = require('../jobs/pollExpiry');
const battlemetricsSync = require('../jobs/battlemetricsSync');
const autoPromote = require('../jobs/autoPromote');
const popAlert = require('../jobs/popAlert');
const preWipeReminder = require('../jobs/preWipeReminder');
const raidReminder = require('../jobs/raidReminder');
const autoTasks = require('../jobs/autoTasks');
const popTracker = require('../jobs/popTracker');
const leaderboardUpdater = require('../jobs/leaderboardUpdater');
const enemyAlert = require('../jobs/enemyAlert');
const rustplusManager = require('../jobs/rustplusManager');
const rustplusFcm = require('../jobs/rustplusFcm');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`[ready] Logged in as ${client.user.tag}`);
    console.log(`[ready] Serving ${client.guilds.cache.size} guild(s).`);

    client.user.setActivity('the wipe timer', { type: ActivityType.Watching });

    // Initialise wipe state on first boot.
    const wipe = db.read('wipe');
    if (!wipe.wipeStart) {
      wipe.wipeStart = new Date().toISOString();
      if (!wipe.wipeNumber) wipe.wipeNumber = 1;
      if (wipe.mapSize === undefined) wipe.mapSize = 3500;
      if (!Array.isArray(wipe.currentRaids)) wipe.currentRaids = [];
      if (!Array.isArray(wipe.raidHistory)) wipe.raidHistory = [];
      db.write('wipe', wipe);
      console.log('[ready] Initialised wipe.json.');
    }

    // Start scheduled jobs.
    const jobs = [
      wipeCountdown,
      deadlineReminder,
      activityCheck,
      pollExpiry,
      battlemetricsSync,
      autoPromote,
      popAlert,
      preWipeReminder,
      raidReminder,
      autoTasks,
      popTracker,
      leaderboardUpdater,
      enemyAlert,
      rustplusManager,
      rustplusFcm,
    ];
    for (const job of jobs) {
      try {
        job.start(client);
      } catch (err) {
        console.error('[ready] Failed to start a job:', err);
      }
    }
    console.log('[ready] Scheduled jobs started.');
  },
};
