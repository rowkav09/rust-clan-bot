'use strict';

/**
 * Generate a short, reasonably-unique id.
 * Format per spec: base36 timestamp + 4 random base36 chars.
 */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Short, mostly-random 8-char id. Unlike genId().slice(0,8) this keeps real
 * randomness, so ids generated in the same millisecond don't collide.
 * Pass an existing keyed object to guarantee uniqueness against it.
 */
function genShortId(existing = null) {
  let id;
  do {
    id = Math.random().toString(36).slice(2, 6) + Date.now().toString(36).slice(-4);
  } while (existing && existing[id]);
  return id;
}

module.exports = { genId, genShortId };
