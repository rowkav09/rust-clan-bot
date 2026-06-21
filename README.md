# 🦀 Rust Clan Discord Bot

A production-ready Discord bot for managing a Rust clan: time tracking, leaderboards,
task management, wipe countdowns, raid scheduling, applications, warnings, intel notes,
polls and ally tracking — all backed by simple JSON flat files (no database required).

---

## Features

| Module | Commands |
|--------|----------|
| ⏱️ Tracking | `/checkin` `/checkout` `/setingamename` `/stats` |
| 🏆 Leaderboard | `/leaderboard` `/wipe-history` |
| 📋 Tasks | `/task-assign` `/task-status` `/task-list` `/task-delete` |
| 💀 Wipe & Raids | `/wipe info\|server\|plan` `/raid` `/serverstatus` |
| 🎮 Rust+ | `/rustplus pair\|status\|say\|map\|channel` |
| 🦀 Clan | `/panel` `/apply` `/application-review` `/warn` `/warnings` `/clearwarning` `/activity` `/member-info` |
| 🔍 Intel | `/note-add` `/note-list` `/note-delete` |
| 📊 Polls | `/poll` |
| 🤝 Allies | `/ally add\|list\|update\|remove` |
| ⚙️ Admin | `/setup` `/setwipe` `/wipereset` |
| ❓ Help | `/help` |

Scheduled jobs run automatically: wipe-channel countdown, task deadline reminders,
weekly inactivity scan, poll auto-close, raid attendance settlement, and (optional)
BattleMetrics auto time-tracking.

---

## 1. Prerequisites

- **Node.js 20+**
- A **Discord bot application** (see below)
- *(Optional)* A **BattleMetrics** server ID + API token for live status and auto-tracking

---

## 2. Create the bot on Discord

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. Open **Bot** → **Reset Token** → copy the token into `BOT_TOKEN`.
3. Under **Bot**, enable **Privileged Gateway Intents → Server Members Intent**.
4. Open **General Information** → copy the **Application ID** into `CLIENT_ID`.
5. Get your server's ID: enable Developer Mode in Discord (User Settings → Advanced),
   right-click your server → **Copy Server ID** → put it in `GUILD_ID`.

---

## 3. Invite the bot

In the Developer Portal → **OAuth2 → URL Generator**:

- **Scopes:** `bot`, `applications.commands`
- **Bot Permissions:** `Manage Channels` (for wipe countdown renaming), `Manage Roles`
  (to assign the recruit role), `Send Messages`, `Embed Links`, `Read Message History`,
  `Use Application Commands`.

Open the generated URL and invite the bot to your server. Make sure the bot's role is
**above** the Recruit role in the role list so it can assign it.

---

## 4. Setup & run

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env      # then fill in BOT_TOKEN, CLIENT_ID, GUILD_ID

# Register slash commands (guild-scoped commands appear instantly)
node deploy-commands.js

# Start the bot
node index.js
```

> The `data/` directory is created automatically. Template files are provided as
> `data/*.example.json` — the bot writes the live `*.json` files itself on first use.

---

## 5. Configure the clan (`/setup`)

Once the bot is online, a server admin / clan leader runs **`/setup`**:

1. Pick the **Leader / Officer / Member / Recruit** roles via the select menus.
2. Click **Configure Channels →** and pick the **Log / Application / Raid / Wipe** channels.
3. Click **Finish Setup**. The bot validates it can rename the wipe channel and reports
   any missing values. Re-run `/setup` anytime — choices are saved to `data/config.json`.

The values in `.env` act as defaults; anything chosen via `/setup` overrides them.

### Optional: BattleMetrics

Run **`/wipe server <battlemetrics_id>`** (the digits in your server's BattleMetrics
URL). Add `BATTLEMETRICS_API_TOKEN` to `.env` to enable auto time-tracking — members link
their in-game name with `/setingamename` and their hours sync every 15 minutes.

Playing a different server each week? Use **`/wipe plan <id> <date>`** to queue the
switch ahead of time, or **`/wipe server <id>`** to switch immediately. Either way the
bot re-baselines everyone's tracking so hours keep counting correctly on the new server.

### Optional: Rust+ (live chat, alarms, map, events)

Run **`npm run rustplus:register`** once on the bot host (opens a browser to log in with
Steam), then tap **Pair** on your server in the in-game Rust+ menu. The bot saves the
server and connects automatically. Set channels with `/rustplus channel` and toggle
features under `/automation`. See `/rustplus pair` for the full walkthrough.

---

## 6. Permission tiers

| Tier | Role | Capabilities |
|------|------|--------------|
| 3 Leader | `LEADER_ROLE_ID` | Everything: setup, wipe reset, role/server config |
| 2 Officer | `OFFICER_ROLE_ID` | Tasks, applications, warnings, notes, allies |
| 1 Member | `MEMBER_ROLE_ID` | Check in/out, polls, raids, leaderboard, notes |
| 0 Recruit | `RECRUIT_ROLE_ID` | Check in/out, leaderboard, apply |

Server administrators are always treated as Leader.

---

## 7. Scoring

```
score = (hours × 10) + (raids × 25) + (tasksCompleted × 15)
```

Wipe scores reset on `/wipereset`; all-time scores accumulate forever.

---

## 8. Deploy from GitHub to bot-hosting.net

1. Push this repo to GitHub:
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
   > `.env` and the live `data/*.json` files are gitignored and stay off GitHub.
2. In the **bot-hosting.net** dashboard, create a server and **connect your GitHub repo**.
3. Add the environment variables from `.env` in the hosting dashboard's env/secrets panel.
4. Set the **start command** to:
   ```
   node index.js
   ```
5. (First deploy only) run `node deploy-commands.js` once — either as a one-off console
   command on the host or locally — to register the slash commands.
6. The `data/` JSON files persist on the host's volume between restarts, so member stats,
   tasks and history survive redeploys.

---

## Project structure

```
rust-clan-bot/
├── index.js              # entry point — loads commands, events, logs in
├── deploy-commands.js    # registers slash commands with Discord
├── utils/                # db, permissions, embeds, time, ids, clan, battlemetrics
├── data/                 # JSON storage (+ *.example.json templates)
├── events/               # ready, interactionCreate, guildMemberAdd
├── jobs/                 # cron jobs
└── commands/             # slash commands grouped by module
```

## Cron schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| wipeCountdown | `*/10 * * * *` | Rename the wipe channel |
| deadlineReminder | `*/30 * * * *` | Task deadline pings + raid settlement |
| activityCheck | `0 9 * * 1` | Weekly inactive-member scan |
| pollExpiry | `*/5 * * * *` | Close expired polls |
| battlemetricsSync | `*/15 * * * *` | Auto check-in/out (if configured) |

---

## License

MIT
