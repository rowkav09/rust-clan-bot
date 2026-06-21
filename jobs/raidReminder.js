'use strict';

const cron = require('node-cron');
const db = require('../utils/db');
const embeds = require('../utils/embeds');
const time = require('../utils/time');
const permissions = require('../utils/permissions');

const WINDOW_MS = 15 * 60000; // remind ~15 minutes before start

async function tick(client) {
  const cfg = permissions.getConfig();
  if (!cfg.automation.raidReminders) return;

  const wipe = db.read('wipe');
  if (!Array.isArray(wipe.currentRaids)) return;

  const now = Date.now();
  let changed = false;

  for (const raid of wipe.currentRaids) {
    if (raid.settled || raid.reminded) continue;
    const start = new Date(raid.time).getTime();
    if (Number.isNaN(start)) continue;
    if (start <= now || start > now + WINDOW_MS) continue;

    const embed = embeds.warning(
      `💀 Raid starting soon: ${raid.name}`,
      `Starts ${time.relative(raid.time)}!\n` +
        `**Target:** ${raid.target || '—'}\n` +
        `**Grid:** ${raid.gridRef || '—'}\n\n` +
        'You RSVP’d ✅ — get online and ready!',
    );

    for (const uid of raid.rsvps?.in || []) {
      try {
        const user = await client.users.fetch(uid);
        await user.send({ embeds: [embed] });
      } catch { /* DMs closed */ }
    }
    raid.reminded = true;
    changed = true;
  }

  if (changed) db.write('wipe', wipe);
}

module.exports = {
  start(client) {
    cron.schedule('*/5 * * * *', () => tick(client).catch((e) => console.error('[raidReminder]', e.message)));
  },
  tick,
};
