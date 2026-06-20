'use strict';

const cron = require('node-cron');
const db = require('../utils/db');

async function tick(client) {
  // Lazy-require to avoid a load-order cycle with the command file.
  const poll = require('../commands/social/poll');
  const polls = db.read('polls');
  const now = Date.now();
  let changed = false;

  for (const p of Object.values(polls)) {
    if (p.closed) continue;
    if (!p.endsAt) continue;
    if (new Date(p.endsAt).getTime() > now) continue;

    try {
      await poll.closePoll(client, p);
      changed = true;
    } catch (err) {
      console.error(`[pollExpiry] Failed to close poll ${p.id}:`, err.message);
    }
  }

  if (changed) {
    // closePoll persists each poll individually; nothing more to do here.
  }
}

module.exports = {
  start(client) {
    cron.schedule('*/5 * * * *', () => tick(client));
  },
  tick,
};
