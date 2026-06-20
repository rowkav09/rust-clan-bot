'use strict';

/**
 * Generate a short, reasonably-unique id.
 * Format per spec: base36 timestamp + 4 random base36 chars.
 */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

module.exports = { genId };
