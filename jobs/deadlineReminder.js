'use strict';

const cron = require('node-cron');
const db = require('../utils/db');
const embeds = require('../utils/embeds');
const time = require('../utils/time');
const clan = require('../utils/clan');

// Track tasks we have already reminded about to avoid spam.
const notified = new Set();

async function tick(client) {
  const tasks = db.read('tasks');
  const now = Date.now();
  const horizon = now + 60 * 60 * 1000; // 60 minutes ahead.

  for (const task of Object.values(tasks)) {
    if (!task.deadline) continue;
    if (task.status === 'done' || task.status === 'failed') continue;
    if (notified.has(task.id)) continue;

    const due = new Date(task.deadline).getTime();
    if (Number.isNaN(due)) continue;
    if (due < now || due > horizon) continue;

    const mentions = (task.assignedTo || []).map((id) => `<@${id}>`).join(' ');
    const embed = embeds.warning(
      `Task deadline approaching: ${task.title}`,
      `**ID:** \`${task.id}\`\n` +
        `**Due:** ${time.relative(task.deadline)} (${time.full(task.deadline)})\n` +
        `**Priority:** ${task.priority || 'medium'}\n\n` +
        `${task.description || ''}`,
    );

    const msg = await clan.log(client, embed);
    if (msg && mentions) {
      try {
        await msg.channel.send({ content: `⏰ ${mentions}` });
      } catch { /* ignore */ }
    }
    notified.add(task.id);
  }

  // Also settle any raids whose scheduled time has passed (credits attendees).
  try {
    const raid = require('../commands/wipe/raid');
    await raid.settleRaids(client);
  } catch (err) {
    console.error('[deadlineReminder] Raid settlement failed:', err.message);
  }
}

module.exports = {
  start(client) {
    cron.schedule('*/30 * * * *', () => tick(client));
  },
  tick,
  notified,
};
