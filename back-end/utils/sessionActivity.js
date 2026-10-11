/**
 * In-memory "is this session still in use" tracker for the single-session rule.
 *
 * Activity is marked by every authenticated request and by the client heartbeat.
 * When a tab is closed or the user navigates away the client fires a beacon
 * (markClosing); if the page is only reloading it comes straight back and the
 * next authenticated request clears the mark again. A session with no activity
 * for SESSION_IDLE_MS is also treated as ended (covers a crashed browser).
 */
const SESSION_IDLE_MS = 5 * 60 * 1000; // 5 minutes

const activity = new Map();
const closing = new Map();

const prune = (now) => {
  if (activity.size <= 500) return;
  for (const [sessionId, seenAt] of activity) {
    if (now - seenAt >= SESSION_IDLE_MS) activity.delete(sessionId);
  }
};

module.exports = {
  SESSION_IDLE_MS,

  /** Record activity for a session (also cancels a pending close). */
  touch(sessionId) {
    if (!sessionId) return;
    const now = Date.now();
    prune(now);
    activity.set(sessionId, now);
    closing.delete(sessionId);
  },

  /** Mark a session as closing (tab closed / navigated away). */
  markClosing(sessionId) {
    if (!sessionId) return;
    const seenAt = activity.get(sessionId);
    // Ignore a delayed beacon when the page has clearly come back already
    // (a reload reconnects within ~3s), otherwise a refresh could look closed.
    if (seenAt && (Date.now() - seenAt) < 3000) return;
    closing.set(sessionId, Date.now());
  },

  /** True while the session is still in use (seen recently and not closing). */
  isActive(sessionId) {
    if (!sessionId) return false;
    if (closing.has(sessionId)) return false;
    const seenAt = activity.get(sessionId);
    return !!seenAt && (Date.now() - seenAt) < SESSION_IDLE_MS;
  },

  /** Drop a session from the tracker (e.g. on logout). */
  clear(sessionId) {
    if (!sessionId) return;
    activity.delete(sessionId);
    closing.delete(sessionId);
  },
};
