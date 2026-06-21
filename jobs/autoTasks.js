'use strict';

const cron = require('node-cron');
const taskgen = require('../utils/taskgen');
const permissions = require('../utils/permissions');

async function tick(client) {
  const cfg = permissions.getConfig();
  if (!cfg.automation.autoTasks) return;
  await taskgen.generateTasks(client, null, 1);
}

module.exports = {
  start(client) {
    // Daily at 12:00 UTC — generate a fresh set of clan tasks.
    cron.schedule('0 12 * * *', () => tick(client).catch((e) => console.error('[autoTasks]', e.message)), {
      timezone: 'UTC',
    });
  },
  tick,
};
