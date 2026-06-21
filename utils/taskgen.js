'use strict';

const db = require('./db');
const embeds = require('./embeds');
const time = require('./time');
const clan = require('./clan');
const { genId } = require('./ids');
const { getConfig } = require('./permissions');

// "What for" objectives per category — the bot rotates through these.
const TEMPLATES = {
  farm: [
    ['Farm sulfur', 'Stockpile sulfur for gunpowder/explosives.'],
    ['Farm metal fragments', 'Keep the metal frag supply topped up for tools & ammo.'],
    ['Farm wood', 'Gather wood for upgrades and furnaces.'],
    ['Farm stone', 'Stone for base upgrades and walls.'],
    ['Run recyclers for scrap', 'Recycle components into scrap for the tech tree.'],
    ['Farm HQM', 'High quality metal for tier-3 gear and armoured walls.'],
  ],
  pvp: [
    ['Roam & deny resources', 'Pressure neighbours and deny their farm.'],
    ['Monument control', 'Hold a monument for loot and tech components.'],
    ['Counter-raid watch', 'Be ready to respond if we get hit.'],
    ['Spread bags for a raid', 'Place sleeping bags near the next target.'],
  ],
  build: [
    ['Upgrade base to stone', 'Get all external walls to stone minimum.'],
    ['Build honeycomb', 'Add honeycomb layers around the core.'],
    ['Expand & place TCs', 'Extend the base and lock down build privilege.'],
    ['Repair raid damage', 'Patch up walls after the last hit.'],
  ],
  scout: [
    ['Scout neighbours', 'Identify nearby bases and their strength.'],
    ['Map enemy bases', 'Add grid refs of enemy bases to intel notes.'],
    ['Track online enemies', 'Watch who’s online and where they roam.'],
    ['Recon a monument', 'Check activity at a key monument before a run.'],
  ],
  defend: [
    ['Restock turrets & ammo', 'Load turrets and keep an ammo reserve.'],
    ['Set shotgun traps', 'Trap key chokepoints and the loot room.'],
    ['Wall stability check', 'Verify external walls and stability.'],
    ['Roof / raid watch', 'Keep eyes out during prime raid hours.'],
  ],
  other: [
    ['Sort the base', 'Organise loot rooms and shared boxes.'],
    ['Tech tree progress', 'Push scrap into the next tier of the tech tree.'],
  ],
};

const CATEGORIES = Object.keys(TEMPLATES);

// Per-category rotation pointer (in-memory; resets on restart — that's fine).
const rotation = {};

function nextObjective(category) {
  const list = TEMPLATES[category] || TEMPLATES.other;
  const i = (rotation[category] = (rotation[category] ?? -1) + 1) % list.length;
  return list[i];
}

/**
 * Pick the best people to assign a category's task to.
 * Preference: members holding the category's specialist role → online → recently active → any tracked.
 * Returns up to `limit` userIds (least-loaded first).
 */
async function eligibleAssignees(guild, category, members, tasks, limit = 1) {
  const cfg = getConfig();
  const specialistRoleId = cfg.specialistRoles?.[category];

  let pool = Object.keys(members);

  // 1. Specialist role takes priority if configured.
  if (specialistRoleId && guild) {
    const withRole = [];
    for (const id of pool) {
      const gm = await guild.members.fetch(id).catch(() => null);
      if (gm && gm.roles.cache.has(specialistRoleId)) withRole.push(id);
    }
    if (withRole.length) pool = withRole;
  }

  // 2. Prefer online, then recently active.
  const online = pool.filter((id) => members[id].online);
  const recent = pool.filter((id) => time.daysSince(members[id].lastSeen || members[id].joinedAt) <= 3);
  let candidates = online.length ? online : recent.length ? recent : pool;

  // 3. Least open-task load first.
  const openCount = (uid) =>
    Object.values(tasks).filter(
      (t) => (t.assignedTo || []).includes(uid) && t.status !== 'done' && t.status !== 'failed',
    ).length;
  candidates = candidates.sort((a, b) => openCount(a) - openCount(b));

  return candidates.slice(0, limit);
}

/**
 * Generate and assign tasks.
 * @param client
 * @param {string[]|null} categories - categories to generate for (default: all)
 * @param {number} perCategory - how many tasks per category
 * @returns {Promise<object[]>} created tasks
 */
async function generateTasks(client, categories = null, perCategory = 1) {
  const cfg = getConfig();
  const members = db.read('members');
  const tasks = db.read('tasks');
  const cats = (categories && categories.length ? categories : CATEGORIES).filter((c) => TEMPLATES[c]);

  let guild = null;
  if (process.env.GUILD_ID) guild = await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);

  const created = [];
  const now = new Date();
  const deadline = new Date(now.getTime() + 24 * 3600000).toISOString();

  for (const category of cats) {
    for (let n = 0; n < perCategory; n += 1) {
      const [title, description] = nextObjective(category);
      const assignees = await eligibleAssignees(guild, category, members, tasks, 1);

      const id = genId().slice(0, 8);
      const task = {
        id,
        title,
        description,
        category,
        assignedTo: assignees,
        assignedBy: 'auto',
        status: 'pending',
        priority: 'medium',
        deadline,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        auto: true,
      };
      tasks[id] = task;
      created.push(task);
    }
  }

  db.write('tasks', tasks);

  // Post a single summary to the log channel.
  if (created.length) {
    const badge = { farm: '🌾', pvp: '⚔️', build: '🏗️', scout: '🔭', defend: '🛡️', other: '📌' };
    const lines = created.map((t) => {
      const who = (t.assignedTo || []).map((u) => `<@${u}>`).join(', ') || '*unassigned*';
      return `${badge[t.category] || '📌'} **${t.title}** \`${t.id}\` → ${who}`;
    });
    const embed = embeds.info(
      `🤖 Auto-assigned ${created.length} task(s)`,
      lines.join('\n') + `\n\n*Due ${time.relative(deadline)}. Mark done with \`/task-status\`.*`,
    );
    await clan.log(client, embed).catch(() => {});
  }

  return created;
}

module.exports = { generateTasks, eligibleAssignees, TEMPLATES, CATEGORIES };
