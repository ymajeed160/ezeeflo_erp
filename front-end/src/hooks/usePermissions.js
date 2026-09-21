import { useState, useEffect, useCallback } from 'react';
import authApi from '../services/authApi';

// Module-level cache so we only fetch /auth/me once per app session.
let cached = null;

/**
 * Provides the current user's permission codes (RBAC) on the frontend.
 * Permissions are fetched once from /auth/me and cached.
 * Usage:
 *   const { hasPermission } = usePermissions();
 *   if (hasPermission('supplier.create')) ...
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState(cached ? cached.permissions : []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return;
    let mounted = true;

    authApi
      .getMe()
      .then((res) => {
        // /auth/me -> { success, data: { user, permissions: [{ id, code }, ...] } }
        const perms = res?.data?.permissions || res?.permissions || [];
        cached = { permissions: perms };
        if (mounted) {
          setPermissions(perms);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const hasPermission = useCallback(
    (code) => permissions.some((p) => (p?.code || p) === code),
    [permissions],
  );

  return { permissions, hasPermission, loading };
}

export default usePermissions;
