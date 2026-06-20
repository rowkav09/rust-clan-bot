'use strict';

const cron = require('node-cron');
const db = require('../utils/db');
const embeds = require('../utils/embeds');
const time = require('../utils/time');
const clan = require('../utils/clan');

/** Return member records inactive for `days`+ days. */
function findInactive(days = 7, requireZeroHours = false) {
  const members = db.read('members');
  const result = [];
  for (const [id, m] of Object.entries(members)) {
    const inactiveFor = time.daysSince(m.lastSeen || m.joinedAt);
    if (inactiveFor < days) continue;
    if (requireZeroHours && (m.currentWipeHours || 0) > 0) continue;
    result.push({ id, member: m, inactiveFor });
  }
  return result.sort((a, b) => b.inactiveFor - a.inactiveFor);
}

async function tick(client) {
  const inactive = findInactive(7, true);
  if (inactive.length === 0) return;

  const lines = inactive.map(
    ({ id, member, inactiveFor }) =>
      `• <@${id}> — last seen ${time.relative(member.lastSeen || member.joinedAt)} ` +
      `(${inactiveFor}d) · ${(member.currentWipeHours || 0).toFixed(1)}h this wipe`,
  );

  const embed = embeds.warning(
    'Weekly Activity Report',
    `The following **${inactive.length}** member(s) have been inactive for 7+ days ` +
      `with no hours this wipe:\n\n${lines.join('\n')}`,
  );

  await clan.log(client, embed);
}

module.exports = {
  start(client) {
    // Every Monday at 09:00 UTC.
    cron.schedule('0 9 * * 1', () => tick(client), { timezone: 'UTC' });
  },
  tick,
  findInactive,
};
