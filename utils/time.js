'use strict';

/**
 * Time / formatting helpers shared across commands and jobs.
 */

/** Unix seconds for a Date or ISO string (defaults to now). */
function unix(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return Math.floor(d.getTime() / 1000);
}

/** Discord relative timestamp, e.g. "in 3 hours". */
function relative(date) {
  return `<t:${unix(date)}:R>`;
}

/** Discord full timestamp, e.g. "Tuesday, 13 April 2025 19:00". */
function full(date) {
  return `<t:${unix(date)}:F>`;
}

/** Discord short date-time timestamp. */
function shortDateTime(date) {
  return `<t:${unix(date)}:f>`;
}

/**
 * Format a duration in milliseconds as "3d 14h 22m".
 * Omits leading zero units. Falls back to "0m".
 */
function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

/**
 * Format a number of hours (float) as "2h 34m".
 */
function formatHours(hoursFloat) {
  const ms = Math.round(hoursFloat * 3600000);
  return formatDuration(ms);
}

/**
 * Compute the next wipe Date given a weekday (0=Sun..6=Sat) and hour (UTC).
 * Always returns a Date strictly in the future.
 */
function nextWipe(wipeDay, wipeHour, from = new Date()) {
  const day = Number.isFinite(wipeDay) ? wipeDay : 4;
  const hour = Number.isFinite(wipeHour) ? wipeHour : 19;

  const next = new Date(Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
    hour, 0, 0, 0,
  ));

  let dayDiff = (day - next.getUTCDay() + 7) % 7;
  next.setUTCDate(next.getUTCDate() + dayDiff);

  // If the computed time is in the past, jump a full week ahead.
  if (next.getTime() <= from.getTime()) {
    next.setUTCDate(next.getUTCDate() + 7);
  }
  return next;
}

/**
 * Parse a "DD/MM HH:MM" string into a Date (UTC, current year).
 * Returns null if the format is invalid.
 */
function parseDateTime(input, baseYear = new Date().getUTCFullYear()) {
  if (!input || typeof input !== 'string') return null;
  const m = input.trim().match(/^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, dd, mm, hh, min] = m.map(Number);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || hh > 23 || min > 59) return null;

  let date = new Date(Date.UTC(baseYear, mm - 1, dd, hh, min, 0, 0));
  // If the date is well in the past, assume next year.
  if (date.getTime() < Date.now() - 86400000) {
    date = new Date(Date.UTC(baseYear + 1, mm - 1, dd, hh, min, 0, 0));
  }
  return date;
}

/** Hours elapsed between two dates (float). */
function hoursBetween(start, end = new Date()) {
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  return (e.getTime() - s.getTime()) / 3600000;
}

/** Whole days since a given date. */
function daysSince(date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

module.exports = {
  unix,
  relative,
  full,
  shortDateTime,
  formatDuration,
  formatHours,
  nextWipe,
  parseDateTime,
  hoursBetween,
  daysSince,
};
