/**
 * Tracks users whose browser/tab was just closed (via the page-unload beacon).
 *
 * The beacon is unreliable for distinguishing "closed" from "reloading", so a
 * pending logout is only enforced after a short grace period. Any authenticated
 * request coming back within that window (a reload) cancels it.
 */
const GRACE_MS = 15000;

const pending = new Map();

module.exports = {
  GRACE_MS,

  mark(userId) {
    if (userId) pending.set(userId, Date.now());
  },

  clear(userId) {
    if (userId) pending.delete(userId);
  },

  /** True when the browser has stayed closed past the grace period. */
  isClosed(userId) {
    const at = pending.get(userId);
    return !!at && (Date.now() - at) > GRACE_MS;
  },

  /** True when a close was recorded but the page may still come back. */
  isPending(userId) {
    return pending.has(userId);
  },
};
