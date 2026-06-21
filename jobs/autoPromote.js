'use strict';

const cron = require('node-cron');
const db = require('../utils/db');
const embeds = require('../utils/embeds');
const time = require('../utils/time');
const clan = require('../utils/clan');
const permissions = require('../utils/permissions');

/**
 * Promote Recruits to Members once they meet the configured thresholds
 * (total hours + raids + days in the clan).
 */
async function tick(client) {
  const cfg = permissions.getConfig();
  if (!cfg.automation.autoPromote) return;
  if (!cfg.recruitRoleId || !cfg.memberRoleId || !process.env.GUILD_ID) return;

  const guild = await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);
  if (!guild) return;

  const members = db.read('members');
  let changed = false;
  const { hours, raids, days } = cfg.promotion;

  for (const [id, m] of Object.entries(members)) {
    if (m.promoted) continue;

    const meetsHours = (m.totalHours || 0) >= hours;
    const meetsRaids = (m.totalRaids || 0) >= raids;
    const meetsDays = time.daysSince(m.joinedAt) >= days;
    if (!(meetsHours && meetsRaids && meetsDays)) continue;

    const gm = await guild.members.fetch(id).catch(() => null);
    if (!gm) continue;
    if (!gm.roles.cache.has(cfg.recruitRoleId)) continue; // only promote current recruits
    if (gm.roles.cache.has(cfg.memberRoleId)) continue;

    const res = await clan.assignRole(guild, id, cfg.memberRoleId);
    if (!res.ok) {
      console.error(`[autoPromote] cannot promote ${id}: ${res.reason}`);
      continue;
    }
    await gm.roles.remove(cfg.recruitRoleId).catch(() => {});

    m.promoted = true;
    m.tier = permissions.TIER.MEMBER;
    changed = true;

    const announce = embeds.success(
      '⬆️ Member Promoted',
      `<@${id}> has been promoted from **Recruit** to **Member**!\n` +
        `*${time.formatHours(m.totalHours || 0)} played · ${m.totalRaids || 0} raids · ` +
        `${time.daysSince(m.joinedAt)}d in the clan.*`,
    );
    await clan.log(client, announce).catch(() => {});
    try {
      const user = await client.users.fetch(id);
      await user.send({
        embeds: [
          embeds.success(
            'You’ve been promoted! 🎉',
            'You’re now a full **Member** of the clan. Welcome aboard! 🦀',
          ),
        ],
      });
    } catch { /* DMs closed */ }
  }

  if (changed) db.write('members', members);
}

module.exports = {
  start(client) {
    // Hourly check (also invoked right after each BattleMetrics sync).
    cron.schedule('15 * * * *', () => tick(client).catch((e) => console.error('[autoPromote]', e.message)));
  },
  tick,
};
