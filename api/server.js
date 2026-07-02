'use strict';

/**
 * Dashboard API — a small HTTP server that runs inside the bot process.
 *
 * This is the integration seam between the web dashboard (static Next.js site,
 * e.g. on Netlify) and the bot. The dashboard cannot touch data/*.json directly
 * because it is hosted elsewhere, so this API reads/writes the SAME JSON store
 * the bot already uses (utils/db). JSON stays the single source of truth — no
 * database is introduced.
 *
 * It also handles Discord OAuth2 for the dashboard ("Login with Discord"),
 * because the static site has nowhere safe to keep the client secret.
 *
 * Env:
 *   DASHBOARD_API_PORT     port to listen on (default 3055; set "0" to disable)
 *   DASHBOARD_URL          public URL of the dashboard (default http://localhost:3000)
 *   DASHBOARD_JWT_SECRET   secret for signing session tokens (random per boot if unset)
 *   DISCORD_CLIENT_ID      OAuth2 client id (falls back to CLIENT_ID)
 *   DISCORD_CLIENT_SECRET  OAuth2 client secret (login disabled without it)
 *   DISCORD_REDIRECT_URI   OAuth2 redirect (default http://localhost:<port>/auth/callback)
 *
 * Built entirely on Node built-ins — no new dependencies.
 */

const http = require('http');
const crypto = require('crypto');
const db = require('../utils/db');
const { getConfig } = require('../utils/permissions');

const DISCORD_API = 'https://discord.com/api/v10';
const MANAGE_GUILD = 0x20n;
const SESSION_TTL_S = 7 * 24 * 60 * 60; // 7 days

const clientId = () => process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || null;
const clientSecret = () => process.env.DISCORD_CLIENT_SECRET || null;
const dashboardUrl = () => (process.env.DASHBOARD_URL || 'http://localhost:3000').replace(/\/$/, '');

let jwtSecret = process.env.DASHBOARD_JWT_SECRET;
if (!jwtSecret) {
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn(
    '[api] DASHBOARD_JWT_SECRET not set — using a random per-boot secret. ' +
      'Dashboard sessions will not survive a bot restart.',
  );
}

// ── Minimal HMAC-SHA256 JWT ──────────────────────────────────────────────────
const b64url = (buf) => Buffer.from(buf).toString('base64url');

function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', jwtSecret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = crypto.createHmac('sha256', jwtSecret).update(`${parts[0]}.${parts[1]}`).digest('base64url');
  const given = parts[2];
  if (
    expected.length !== given.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given))
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// OAuth "state" — HMAC-signed timestamp, valid for 10 minutes.
function makeState() {
  const ts = String(Date.now());
  const sig = crypto.createHmac('sha256', jwtSecret).update(`state:${ts}`).digest('base64url');
  return `${ts}.${sig}`;
}

function checkState(state) {
  if (!state) return false;
  const [ts, sig] = String(state).split('.');
  if (!ts || !sig) return false;
  const expected = crypto.createHmac('sha256', jwtSecret).update(`state:${ts}`).digest('base64url');
  if (expected.length !== sig.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  return Date.now() - Number(ts) < 10 * 60 * 1000;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(data);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Session from the Authorization: Bearer header, or null. */
function session(req) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? verifyToken(m[1]) : null;
}

/** True if the session user has Manage Server on the given guild. */
function managesGuild(sess, guildId) {
  return Array.isArray(sess?.g) && sess.g.some((g) => g.id === guildId);
}

// ── Config whitelist — only these keys can be written from the dashboard ─────
const CONFIG_STRING_KEYS = [
  'leaderRoleId', 'officerRoleId', 'memberRoleId', 'recruitRoleId',
  'unverifiedRoleId', 'inGameRoleId',
  'logChannelId', 'applicationChannelId', 'raidChannelId', 'wipeChannelId',
  'linkChannelId', 'idLogChannelId', 'popChannelId', 'leaderboardChannelId',
  'enemyAlertChannelId', 'popAlertChannelId',
  'rustplusChatChannelId', 'rustplusEventChannelId', 'rustplusAlarmChannelId',
  'rustplusInviteCommand',
];
const SPECIALIST_KEYS = ['farm', 'pvp', 'build', 'scout', 'defend'];
const AUTOMATION_KEYS = [
  'autoWipeReset', 'autoCheckInOut', 'autoPromote', 'autoUnverifiedRole',
  'autoVerifyOnLink', 'autoApproveApplications', 'popAlerts', 'preWipeReminders',
  'raidReminders', 'autoTasks', 'livePop', 'autoLeaderboard', 'enemyAlerts',
  'vcTracking', 'rustplusChatBridge', 'rustplusEvents', 'rustplusDownedAlerts',
  'rustplusAlarms', 'rustplusRaidPing', 'autoClanInvite',
];
const MODULE_KEYS = [
  'tracking', 'tasks', 'wipe', 'intel', 'polls', 'allies', 'clan',
  'battlemetrics', 'rustplus',
];
const WIPE_KEYS = ['serverName', 'nextWipe', 'nextWipeType', 'battlemetricsServerId', 'connect'];

const asId = (v) => (typeof v === 'string' && /^\d{5,25}$/.test(v) ? v : null);

/** Validate + merge a dashboard payload into data/config.json. */
function applyConfigPatch(patch) {
  const cfg = db.read('config');

  for (const key of CONFIG_STRING_KEYS) {
    if (!(key in patch)) continue;
    const v = patch[key];
    if (key === 'rustplusInviteCommand') {
      cfg[key] = typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : null;
    } else {
      cfg[key] = asId(v); // snowflake or null
    }
  }

  if (patch.specialistRoles && typeof patch.specialistRoles === 'object') {
    cfg.specialistRoles = cfg.specialistRoles || {};
    for (const k of SPECIALIST_KEYS) {
      if (k in patch.specialistRoles) cfg.specialistRoles[k] = asId(patch.specialistRoles[k]);
    }
  }

  if (patch.automation && typeof patch.automation === 'object') {
    cfg.automation = cfg.automation || {};
    for (const k of AUTOMATION_KEYS) {
      if (k in patch.automation) cfg.automation[k] = Boolean(patch.automation[k]);
    }
  }

  if (patch.modules && typeof patch.modules === 'object') {
    cfg.modules = cfg.modules || {};
    for (const k of MODULE_KEYS) {
      if (k in patch.modules) cfg.modules[k] = Boolean(patch.modules[k]);
    }
  }

  if (patch.promotion && typeof patch.promotion === 'object') {
    cfg.promotion = cfg.promotion || {};
    for (const k of ['hours', 'raids', 'days']) {
      const n = Number(patch.promotion[k]);
      if (Number.isFinite(n) && n >= 0) cfg.promotion[k] = n;
    }
  }

  if (patch.scoring && typeof patch.scoring === 'object') {
    cfg.scoring = cfg.scoring || {};
    for (const k of ['hours', 'raids', 'tasks']) {
      const n = Number(patch.scoring[k]);
      if (Number.isFinite(n) && n >= 0 && n <= 1000) cfg.scoring[k] = n;
    }
  }

  if (patch.popAlert && typeof patch.popAlert === 'object') {
    cfg.popAlert = cfg.popAlert || {};
    const frac = Number(patch.popAlert.highFraction);
    if (Number.isFinite(frac) && frac > 0 && frac <= 1) cfg.popAlert.highFraction = frac;
    const cd = Number(patch.popAlert.cooldownMin);
    if (Number.isFinite(cd) && cd >= 5) cfg.popAlert.cooldownMin = Math.round(cd);
    if ('alertOnQueue' in patch.popAlert) cfg.popAlert.alertOnQueue = Boolean(patch.popAlert.alertOnQueue);
  }

  if (patch.battlemetrics && typeof patch.battlemetrics === 'object') {
    cfg.battlemetrics = cfg.battlemetrics || {};
    if ('serverId' in patch.battlemetrics) {
      const v = patch.battlemetrics.serverId;
      cfg.battlemetrics.serverId = typeof v === 'string' && /^\d{1,12}$/.test(v) ? v : null;
    }
    if ('apiToken' in patch.battlemetrics) {
      const v = patch.battlemetrics.apiToken;
      // Ignore the masked placeholder the dashboard echoes back untouched.
      if (v !== '__unchanged__') {
        cfg.battlemetrics.apiToken = typeof v === 'string' && v.trim() ? v.trim() : null;
      }
    }
  }

  db.write('config', cfg);
  return cfg;
}

function applyWipePatch(patch) {
  const wipe = db.read('wipe');
  for (const key of WIPE_KEYS) {
    if (!(key in patch)) continue;
    const v = patch[key];
    if (key === 'nextWipe') {
      const d = v ? new Date(v) : null;
      wipe.nextWipe = d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
    } else {
      wipe[key] = typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : null;
    }
  }
  db.write('wipe', wipe);
  return wipe;
}

/** Shape the config for the dashboard (mask the BattleMetrics token). */
function configForDashboard() {
  const merged = getConfig();
  const raw = db.read('config');
  const wipe = db.read('wipe');
  const bm = raw.battlemetrics || {};
  return {
    config: {
      ...merged,
      modules: {
        ...Object.fromEntries(MODULE_KEYS.map((k) => [k, raw.modules?.[k] ?? true])),
      },
      scoring: {
        hours: raw.scoring?.hours ?? 10,
        raids: raw.scoring?.raids ?? 25,
        tasks: raw.scoring?.tasks ?? 15,
      },
      battlemetrics: {
        serverId: bm.serverId || process.env.BATTLEMETRICS_SERVER_ID || null,
        apiToken: bm.apiToken || process.env.BATTLEMETRICS_API_TOKEN ? '__unchanged__' : null, // masked — never sent to the browser
        hasToken: Boolean(bm.apiToken || process.env.BATTLEMETRICS_API_TOKEN),
      },
    },
    wipe: {
      serverName: wipe.serverName || null,
      nextWipe: wipe.nextWipe || null,
      nextWipeType: wipe.nextWipeType || null,
      battlemetricsServerId: wipe.battlemetricsServerId || null,
      connect: wipe.connect || null,
    },
  };
}

// ── Discord OAuth ────────────────────────────────────────────────────────────
async function exchangeCode(code, redirectUri) {
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
  return res.json();
}

async function discordGet(path, accessToken) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Discord GET ${path} failed (${res.status})`);
  return res.json();
}

// ── Server ───────────────────────────────────────────────────────────────────
function start(client) {
  const port = Number(process.env.DASHBOARD_API_PORT ?? 3055);
  if (!port) {
    console.log('[api] Dashboard API disabled (DASHBOARD_API_PORT=0).');
    return null;
  }
  const redirectUri = () =>
    process.env.DISCORD_REDIRECT_URI || `http://localhost:${port}/auth/callback`;

  const server = http.createServer(async (req, res) => {
    // CORS — the dashboard is served from another origin (Netlify / localhost:3000).
    res.setHeader('Access-Control-Allow-Origin', dashboardUrl());
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const url = new URL(req.url, `http://localhost:${port}`);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      // ── Health ────────────────────────────────────────────────────────
      if (req.method === 'GET' && path === '/health') {
        return json(res, 200, {
          ok: true,
          bot: Boolean(client?.isReady?.()),
          guilds: client?.guilds?.cache?.size ?? 0,
          oauth: Boolean(clientId() && clientSecret()),
        });
      }

      // ── OAuth: kick off login ─────────────────────────────────────────
      if (req.method === 'GET' && path === '/auth/login') {
        if (!clientId() || !clientSecret()) {
          return redirect(res, `${dashboardUrl()}/auth/#error=oauth_not_configured`);
        }
        const authorize = new URL('https://discord.com/oauth2/authorize');
        authorize.searchParams.set('client_id', clientId());
        authorize.searchParams.set('redirect_uri', redirectUri());
        authorize.searchParams.set('response_type', 'code');
        authorize.searchParams.set('scope', 'identify guilds');
        authorize.searchParams.set('prompt', 'none');
        authorize.searchParams.set('state', makeState());
        return redirect(res, authorize.toString());
      }

      // ── OAuth: callback ───────────────────────────────────────────────
      if (req.method === 'GET' && path === '/auth/callback') {
        const code = url.searchParams.get('code');
        if (!code || !checkState(url.searchParams.get('state'))) {
          return redirect(res, `${dashboardUrl()}/auth/#error=oauth_denied`);
        }
        const token = await exchangeCode(code, redirectUri());
        const user = await discordGet('/users/@me', token.access_token);
        const guilds = await discordGet('/users/@me/guilds', token.access_token);

        // Keep only guilds the user can manage — that's all the dashboard needs.
        const manageable = (Array.isArray(guilds) ? guilds : [])
          .filter((g) => g.owner || (BigInt(g.permissions || 0) & MANAGE_GUILD) === MANAGE_GUILD)
          .slice(0, 50)
          .map((g) => ({ id: g.id, name: g.name, icon: g.icon || null }));

        const now = Math.floor(Date.now() / 1000);
        const jwt = signToken({
          u: {
            id: user.id,
            username: user.global_name || user.username,
            avatar: user.avatar || null,
          },
          g: manageable,
          iat: now,
          exp: now + SESSION_TTL_S,
        });
        return redirect(res, `${dashboardUrl()}/auth/#token=${jwt}`);
      }

      // ── Everything below requires a session ───────────────────────────
      const sess = session(req);
      if (!sess) {
        if (path.startsWith('/api/')) return json(res, 401, { error: 'Unauthorized' });
        return json(res, 404, { error: 'Not found' });
      }

      if (req.method === 'GET' && path === '/api/me') {
        return json(res, 200, {
          user: sess.u,
          guilds: sess.g.map((g) => ({
            ...g,
            botIn: Boolean(client?.guilds?.cache?.has(g.id)),
          })),
        });
      }

      // /api/guilds/:id/(meta|config)
      const m = path.match(/^\/api\/guilds\/(\d+)\/(meta|config)$/);
      if (m) {
        const [, guildId, resource] = m;
        if (!managesGuild(sess, guildId)) {
          return json(res, 403, { error: 'You need Manage Server on that guild.' });
        }
        const guild = client?.guilds?.cache?.get(guildId);
        if (!guild) {
          return json(res, 404, { error: 'The bot is not in that guild.', botIn: false });
        }

        if (resource === 'meta' && req.method === 'GET') {
          const roles = guild.roles.cache
            .filter((r) => r.id !== guild.id && !r.managed)
            .sort((a, b) => b.position - a.position)
            .map((r) => ({ id: r.id, name: r.name, color: r.hexColor }));
          const channels = guild.channels.cache
            .filter((c) => c.isTextBased?.() && !c.isThread?.())
            .sort((a, b) => (a.rawPosition ?? 0) - (b.rawPosition ?? 0))
            .map((c) => ({ id: c.id, name: c.name, parent: c.parent?.name || null }));
          return json(res, 200, {
            guild: { id: guild.id, name: guild.name, icon: guild.icon, memberCount: guild.memberCount },
            roles: [...roles.values()],
            channels: [...channels.values()],
          });
        }

        if (resource === 'config' && req.method === 'GET') {
          return json(res, 200, configForDashboard());
        }

        if (resource === 'config' && req.method === 'PUT') {
          let body;
          try {
            body = JSON.parse(await readBody(req));
          } catch {
            return json(res, 400, { error: 'Invalid JSON body.' });
          }
          if (body.config && typeof body.config === 'object') applyConfigPatch(body.config);
          if (body.wipe && typeof body.wipe === 'object') applyWipePatch(body.wipe);
          console.log(`[api] Config updated via dashboard by ${sess.u.username} (${sess.u.id}).`);
          return json(res, 200, { ok: true, ...configForDashboard() });
        }
      }

      return json(res, 404, { error: 'Not found' });
    } catch (err) {
      console.error('[api] Request error:', err);
      return json(res, 500, { error: 'Internal error' });
    }
  });

  server.on('error', (err) => {
    console.error(`[api] Dashboard API failed to start on port ${port}: ${err.message}`);
  });
  server.listen(port, () => {
    console.log(`[api] Dashboard API listening on http://localhost:${port} (CORS: ${dashboardUrl()}).`);
    if (!clientId() || !clientSecret()) {
      console.warn('[api] DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET not set — dashboard login disabled (dashboard falls back to dev/mock login).');
    }
  });
  return server;
}

module.exports = { start };
