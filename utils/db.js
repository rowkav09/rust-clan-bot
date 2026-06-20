'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure the data directory exists so first writes never fail.
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.error('[db] Failed to ensure data directory exists:', err);
}

function filePath(filename) {
  // Accept both "members" and "members.json".
  const name = filename.endsWith('.json') ? filename : `${filename}.json`;
  return path.join(DATA_DIR, name);
}

/**
 * Read and parse data/<filename>.json.
 * Returns {} if the file is missing or unreadable.
 */
function read(filename) {
  const fp = filePath(filename);
  try {
    if (!fs.existsSync(fp)) return {};
    const raw = fs.readFileSync(fp, 'utf8');
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[db] Error reading ${filename}:`, err);
    return {};
  }
}

/**
 * Serialize and write data to data/<filename>.json (2-space indent).
 * Returns true on success, false on failure.
 */
function write(filename, data) {
  const fp = filePath(filename);
  try {
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[db] Error writing ${filename}:`, err);
    return false;
  }
}

/**
 * Convenience: read a file, mutate it via callback, write it back.
 * The callback receives the parsed object and must return the object to write.
 */
function update(filename, mutator) {
  const data = read(filename);
  const result = mutator(data) || data;
  write(filename, result);
  return result;
}

module.exports = { read, write, update, DATA_DIR };
