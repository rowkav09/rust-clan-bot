'use strict';

const EventEmitter = require('events');
const RustPlus = require('@liamcottle/rustplus.js');
const db = require('./db');

/**
 * Singleton manager around a RustPlus websocket connection.
 * Credentials live in data/rustplus.json: { server: { ip, port, playerId, playerToken, name } }.
 * Emits: 'connected', 'disconnected', 'teamMessage' ({steamId,name,message}), 'error'.
 */
class RustPlusManager extends EventEmitter {
  constructor() {
    super();
    this.rp = null;
    this.connected = false;
    this.stopped = false;
    this.reconnectTimer = null;
    this.recentOutgoing = new Set(); // messages we sent, to suppress echo
  }

  getServerCreds() {
    const data = db.read('rustplus');
    return data.server || null;
  }

  saveServerCreds(server) {
    const data = db.read('rustplus');
    data.server = server;
    db.write('rustplus', data);
  }

  isReady() {
    return this.connected && this.rp && this.rp.isConnected?.();
  }

  /** Connect (or reconnect) using saved credentials. Safe to call repeatedly. */
  connect() {
    this.stopped = false;
    const creds = this.getServerCreds();
    if (!creds || !creds.ip || !creds.playerToken) return false;

    // Tear down any existing connection first.
    this._teardown();

    try {
      this.rp = new RustPlus(creds.ip, creds.port, creds.playerId, creds.playerToken);
    } catch (err) {
      console.error('[rustplus] failed to construct:', err.message);
      return false;
    }

    this.rp.on('connected', () => {
      this.connected = true;
      console.log(`[rustplus] Connected to ${creds.name || creds.ip}.`);
      this.emit('connected', creds);
    });

    this.rp.on('disconnected', () => {
      this.connected = false;
      this.emit('disconnected');
      if (!this.stopped) this._scheduleReconnect();
    });

    this.rp.on('error', (err) => {
      console.error('[rustplus] socket error:', err?.message || err);
      this.emit('error', err);
    });

    // Incoming broadcasts (team chat, team changes, entity changes).
    this.rp.on('message', (msg) => {
      try {
        const b = msg?.broadcast;
        if (b?.teamMessage?.message) {
          const m = b.teamMessage.message;
          // Suppress echo of messages we just relayed from Discord.
          if (this.recentOutgoing.has(m.message)) {
            this.recentOutgoing.delete(m.message);
            return;
          }
          this.emit('teamMessage', { steamId: m.steamId, name: m.name, message: m.message });
        }
      } catch { /* ignore */ }
    });

    try {
      this.rp.connect();
    } catch (err) {
      console.error('[rustplus] connect threw:', err.message);
      this._scheduleReconnect();
    }
    return true;
  }

  _scheduleReconnect() {
    if (this.reconnectTimer || this.stopped) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log('[rustplus] reconnecting…');
      this.connect();
    }, 30000);
  }

  _teardown() {
    if (this.rp) {
      try { this.rp.disconnect(); } catch { /* ignore */ }
      this.rp.removeAllListeners?.();
      this.rp = null;
    }
    this.connected = false;
  }

  disconnect() {
    this.stopped = true;
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this._teardown();
  }

  /** Promisify a callback-style helper with a timeout. */
  _call(invoke, timeoutMs = 10000) {
    if (!this.isReady()) return Promise.reject(new Error('not connected'));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      try {
        invoke((msg) => {
          clearTimeout(timer);
          resolve(msg);
          return true; // tell rustplus.js we handled it
        });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  async info() {
    const m = await this._call((cb) => this.rp.getInfo(cb));
    return m?.response?.info || null;
  }

  async teamInfo() {
    const m = await this._call((cb) => this.rp.getTeamInfo(cb));
    return m?.response?.teamInfo || null;
  }

  async mapMarkers() {
    const m = await this._call((cb) => this.rp.getMapMarkers(cb));
    return m?.response?.mapMarkers?.markers || [];
  }

  async map() {
    // Larger timeout — the map image can be a few hundred KB.
    const m = await this._call((cb) => this.rp.getMap(cb), 20000);
    return m?.response?.map || null; // { width, height, jpgImage, monuments, ... }
  }

  say(message) {
    if (!this.isReady()) return Promise.reject(new Error('not connected'));
    this.recentOutgoing.add(message);
    setTimeout(() => this.recentOutgoing.delete(message), 15000);
    return new Promise((resolve) => {
      try { this.rp.sendTeamMessage(message, () => resolve(true)); }
      catch { resolve(false); }
    });
  }
}

module.exports = new RustPlusManager();
