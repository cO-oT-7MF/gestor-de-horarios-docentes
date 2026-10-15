import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ScheduleEntry,
  AcademicLoadItem,
  SchoolInfo,
  TimeSlotConfig,
} from '../types';
import {
  saveCycleToIndexedDB,
  loadCycleFromIndexedDB,
} from '../utils/indexedDB';
import { saveLastKnownGoodSnapshot, getLastKnownGoodSnapshot } from '../utils/autoSave';

interface UseOneClickSaveProps {
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  schoolInfo: SchoolInfo;
  customTimeSlots?: TimeSlotConfig[];
  onSave?: () => void;
  onAutoSave?: () => void; // Kept for backwards compatibility
}

/**
 * Hook providing one-click manual saving of the full cycle state and schedule matrix
 * into IndexedDB (with localStorage backup), eliminating background auto-save intervals.
 */
export function useOneClickSave({
  entries,
  academicLoads,
  schoolInfo,
  customTimeSlots,
  onSave,
  onAutoSave,
}: UseOneClickSaveProps) {
  // Use a ref to hold the latest state values
  const stateRef = useRef({
    entries,
    academicLoads,
    schoolInfo,
    customTimeSlots,
  });

  const onSaveCallbackRef = useRef(onSave || onAutoSave);
  useEffect(() => {
    onSaveCallbackRef.current = onSave || onAutoSave;
  }, [onSave, onAutoSave]);

  // Keep ref synchronized on every render
  useEffect(() => {
    stateRef.current = {
      entries,
      academicLoads,
      schoolInfo,
      customTimeSlots,
    };
  }, [entries, academicLoads, schoolInfo, customTimeSlots]);

  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize timestamp from IndexedDB or snapshot on mount
  useEffect(() => {
    let isMounted = true;
    loadCycleFromIndexedDB()
      .then((record) => {
        if (isMounted && record && record.lastSavedTimestamp) {
          setLastSavedTimestamp(record.lastSavedTimestamp);
        } else {
          const snap = getLastKnownGoodSnapshot();
          if (isMounted && snap?.timestamp) {
            setLastSavedTimestamp(snap.timestamp);
          }
        }
      })
      .catch(() => {
        const snap = getLastKnownGoodSnapshot();
        if (isMounted && snap?.timestamp) {
          setLastSavedTimestamp(snap.timestamp);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // One-click save function: triggers explicitly without any background setInterval
  const performSave = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      // 1. Save full cycle state and schedule matrix into IndexedDB
      const saved = await saveCycleToIndexedDB(stateRef.current);
      if (saved && saved.lastSavedTimestamp) {
        setLastSavedTimestamp(saved.lastSavedTimestamp);
      }

      // 2. Also keep last_known_good snapshot updated
      saveLastKnownGoodSnapshot(stateRef.current);

      // 3. Trigger callback
      if (onSaveCallbackRef.current) {
        try {
          onSaveCallbackRef.current();
        } catch (err) {
          console.error('Error in onSave callback:', err);
        }
      }

      return true;
    } catch (err) {
      console.error('Error saving cycle state to IndexedDB:', err);
      return false;
    } finally {
      setTimeout(() => {
        setIsSaving(false);
      }, 800);
    }
  }, []);

  // NOTE: Periodic auto-save (setInterval) has been removed as requested by the user.
  // Saving is now strictly manual via the one-click save button or Ctrl+S shortcut.

  return {
    lastSavedTimestamp,
    isSaving,
    saveNow: performSave,
  };
}

// Backwards-compatible alias
export const useAutoSave = useOneClickSave;
