/**
 * useOfflineSync Hook
 * 
 * Manages offline attendance storage and sync.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AttendanceAPI from '../api/attendanceApi';
import type { OfflineAttendanceRecord, GeoLocation } from '../types';
import Config from '../config';

const STORAGE_KEY = 'ezeeflo_offline_attendance';

export const useOfflineSync = () => {
  const [offlineRecords, setOfflineRecords] = useState<OfflineAttendanceRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load offline records from storage
  const loadOfflineRecords = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setOfflineRecords(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load offline records:', error);
    }
  }, []);

  // Save offline records to storage
  const saveOfflineRecords = useCallback(async (records: OfflineAttendanceRecord[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      setOfflineRecords(records);
    } catch (error) {
      console.warn('Failed to save offline records:', error);
    }
  }, []);

  // Add a new offline record
  const addOfflineRecord = useCallback(
    async (data: {
      employeeId: string;
      companyId: string;
      action: OfflineAttendanceRecord['action'];
      location?: GeoLocation;
    }) => {
      const record: OfflineAttendanceRecord = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        employeeId: data.employeeId,
        companyId: data.companyId,
        action: data.action,
        timestamp: new Date().toISOString(),
        location: data.location,
        synced: false,
        syncAttempts: 0,
        createdAt: new Date().toISOString(),
      };

      const updatedRecords = [...offlineRecords, record];
      if (updatedRecords.length > Config.OFFLINE.MAX_OFFLINE_ATTENDANCE) {
        updatedRecords.shift();
      }
      await saveOfflineRecords(updatedRecords);
      return record;
    },
    [offlineRecords, saveOfflineRecords]
  );

  // Sync offline records
  const syncOfflineRecords = useCallback(async () => {
    if (isSyncing || offlineRecords.length === 0) return;

    const unsynced = offlineRecords.filter((r) => !r.synced);
    if (unsynced.length === 0) return;

    setIsSyncing(true);

    try {
      const response = await AttendanceAPI.syncOffline(
        unsynced.map((r) => ({
          action: r.action,
          timestamp: r.timestamp,
          location: r.location,
        }))
      );

      const result = response.data || { synced: 0, failed: 0 };
      setLastSyncResult(result);

      // Mark synced records
      const updated = offlineRecords.map((r) => {
        if (!r.synced) {
          return { ...r, synced: true };
        }
        return r;
      });

      // Remove successfully synced records
      const remaining = updated.filter((r) => !r.synced);
      await saveOfflineRecords(remaining);
    } catch (error) {
      console.warn('Offline sync failed:', error);
      // Increment sync attempts
      const updated = offlineRecords.map((r) => ({
        ...r,
        syncAttempts: r.syncAttempts + 1,
      }));
      await saveOfflineRecords(updated);
    } finally {
      setIsSyncing(false);
    }
  }, [offlineRecords, isSyncing, saveOfflineRecords]);

  // Auto-sync on interval
  useEffect(() => {
    loadOfflineRecords();
  }, [loadOfflineRecords]);

  useEffect(() => {
    if (offlineRecords.some((r) => !r.synced)) {
      intervalRef.current = setInterval(syncOfflineRecords, Config.OFFLINE.SYNC_INTERVAL);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [offlineRecords, syncOfflineRecords]);

  return {
    offlineRecords,
    unsyncedCount: offlineRecords.filter((r) => !r.synced).length,
    isSyncing,
    lastSyncResult,
    addOfflineRecord,
    syncOfflineRecords,
  };
};
