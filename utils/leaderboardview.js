'use strict';

const db = require('./db');
const embeds = require('./embeds');
const time = require('./time');
const clan = require('./clan');

const MEDALS = ['🥇', '🥈', '🥉'];

/** Build the leaderboard embed for 'wipe' or 'alltime'. */
function build(type = 'wipe') {
  const members = db.read('members');
  const wipe = db.read('wipe');

  const rows = Object.entries(members).map(([id, m]) =>
    type === 'alltime'
      ? { id, name: m.username, hours: m.totalHours || 0, raids: m.totalRaids || 0, tasks: m.tasksCompleted || 0, score: clan.allTimeScore(m) }
      : { id, name: m.username, hours: m.currentWipeHours || 0, raids: m.wipeRaids || 0, tasks: m.currentWipeTasks || 0, score: clan.wipeScore(m) },
  );
  rows.sort((a, b) => b.score - a.score || b.hours - a.hours);
  const top = rows.slice(0, 10);

  const body =
    top.length === 0
      ? '*No tracked activity yet. Use `/checkin` to get on the board!*'
      : top
          .map((r, i) => {
            const rank = MEDALS[i] || `\`#${i + 1}\``;
            return `${rank} **${r.name}** │ ${time.formatHours(r.hours)} │ ${r.raids} raids │ ${r.tasks} tasks │ **${r.score}**`;
          })
          .join('\n');

  const title = type === 'alltime' ? '🏆  ALL-TIME LEADERBOARD' : `🏆  WIPE #${wipe.wipeNumber || 1} LEADERBOARD`;
  const subtitle =
    type === 'alltime'
      ? 'Cumulative across all wipes'
      : `Since ${wipe.wipeStart ? time.shortDateTime(wipe.wipeStart) : 'wipe start'} — ongoing`;

  return embeds.leaderboard(title, `*${subtitle}*\n\n${body}`).setFooter({ text: 'Auto-updates every 30 min' });
}

module.exports = { build };
