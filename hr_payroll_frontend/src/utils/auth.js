/**
 * Auth Utilities
 * 
 * Manages token retrieval and auth state from localStorage.
 * HR frontend reads auth state from the ERP's persisted Redux store.
 */

const ERP_PERSIST_KEY = 'persist:root';

/**
 * Get the stored auth token from ERP's redux-persist storage.
 */
export const getToken = () => {
  try {
    const rootState = localStorage.getItem(ERP_PERSIST_KEY);
    if (!rootState) return null;
    const parsed = JSON.parse(rootState);
    if (parsed.auth) {
      const auth = JSON.parse(parsed.auth);
      return auth.accessToken || null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
};

/**
 * Get the refresh token from ERP's redux-persist storage.
 */
export const getRefreshToken = () => {
  try {
    const rootState = localStorage.getItem(ERP_PERSIST_KEY);
    if (!rootState) return null;
    const parsed = JSON.parse(rootState);
    if (parsed.auth) {
      const auth = JSON.parse(parsed.auth);
      return auth.refreshToken || null;
    }
  } catch {
    // Ignore
  }
  return null;
};

/**
 * Get the current user info from ERP's persisted auth state.
 */
export const getUser = () => {
  try {
    const rootState = localStorage.getItem(ERP_PERSIST_KEY);
    if (!rootState) return null;
    const parsed = JSON.parse(rootState);
    if (parsed.auth) {
      const auth = JSON.parse(parsed.auth);
      return auth.user || null;
    }
  } catch {
    // Ignore
  }
  return null;
};

/**
 * Get the active company ID from ERP's persisted company state.
 * Priority: URL param → localStorage
 */
export const getActiveCompanyId = () => {
  // Check URL query params first
  const urlParams = new URLSearchParams(window.location.search);
  const urlCompanyId = urlParams.get('companyId');
  if (urlCompanyId) return urlCompanyId;

  // Check ERP persisted state
  try {
    const rootState = localStorage.getItem(ERP_PERSIST_KEY);
    if (!rootState) return null;
    const parsed = JSON.parse(rootState);
    if (parsed.company) {
      const company = JSON.parse(parsed.company);
      return company.activeCompanyId || null;
    }
  } catch {
    // Ignore
  }
  return null;
};

/**
 * Check if user is authenticated (has a valid-looking token).
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};
