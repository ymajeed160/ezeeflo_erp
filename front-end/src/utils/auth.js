/**
 * Auth utility functions.
 * Provides helpers for token management used across the application.
 */

/**
 * Retrieve the current access token from the persisted Redux store.
 * @returns {string|null} The access token, or null if not found.
 */
export const getToken = () => {
  try {
    const rootState = localStorage.getItem('persist:root');
    if (!rootState) return null;

    const parsed = JSON.parse(rootState);
    if (!parsed.auth) return null;

    const auth = JSON.parse(parsed.auth);
    return auth.accessToken || null;
  } catch {
    return null;
  }
};

/**
 * Retrieve the current refresh token from the persisted Redux store.
 * @returns {string|null} The refresh token, or null if not found.
 */
/**
 * Retrieve the active company ID — URL query param takes priority, falls back to localStorage.
 * @returns {string|null} The active company ID, or null if not found.
 */
export const getActiveCompanyId = () => {
  try {
    // 1. Check URL query param first (most reliable — survives page reloads)
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const urlCompanyId = params.get('companyId');
      console.log('[getActiveCompanyId] URL param:', urlCompanyId);
      if (urlCompanyId) {
        console.log('[getActiveCompanyId] Using URL companyId:', urlCompanyId);
        return urlCompanyId;
      }
    }

    // 2. Fall back to persisted Redux state in localStorage
    const rootState = localStorage.getItem('persist:root');
    if (rootState) {
      const parsed = JSON.parse(rootState);
      if (parsed.company) {
        const company = JSON.parse(parsed.company);
        if (company.activeCompanyId) {
          console.log('[getActiveCompanyId] Using localStorage companyId:', company.activeCompanyId);
          return company.activeCompanyId;
        }
      }
    }
  } catch (e) {
    console.warn('[getActiveCompanyId] Error:', e);
  }
  console.warn('[getActiveCompanyId] No companyId found');
  return null;
};

export const getRefreshToken = () => {
  try {
    const rootState = localStorage.getItem('persist:root');
    if (!rootState) return null;

    const parsed = JSON.parse(rootState);
    if (!parsed.auth) return null;

    const auth = JSON.parse(parsed.auth);
    return auth.refreshToken || null;
  } catch {
    return null;
  }
};

export default { getToken, getRefreshToken };
