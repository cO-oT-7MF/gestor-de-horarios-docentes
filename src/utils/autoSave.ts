import {
  ScheduleEntry,
  AcademicLoadItem,
  SchoolInfo,
  TimeSlotConfig,
  LastKnownGoodState,
} from '../types';

export const LAST_KNOWN_GOOD_KEY = 'last_known_good';

/**
 * Saves a snapshot of the current application state to the secondary 'last_known_good' key in localStorage.
 */
export function saveLastKnownGoodSnapshot(data: {
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  schoolInfo: SchoolInfo;
  customTimeSlots?: TimeSlotConfig[];
}): LastKnownGoodState | null {
  try {
    const snapshot: LastKnownGoodState = {
      entries: data.entries,
      academicLoads: data.academicLoads,
      schoolInfo: data.schoolInfo,
      customTimeSlots: data.customTimeSlots,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(LAST_KNOWN_GOOD_KEY, JSON.stringify(snapshot));
    return snapshot;
  } catch (error) {
    console.error('Error saving to last_known_good in localStorage:', error);
    return null;
  }
}

/**
 * Retrieves the snapshot stored in the secondary 'last_known_good' key in localStorage.
 */
export function getLastKnownGoodSnapshot(): LastKnownGoodState | null {
  try {
    const raw = localStorage.getItem(LAST_KNOWN_GOOD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as LastKnownGoodState;
    }
    return null;
  } catch (error) {
    console.error('Error reading last_known_good from localStorage:', error);
    return null;
  }
}

/**
 * Formats the timestamp for display in the UI.
 */
export function formatAutoSaveTime(isoString?: string | null): string {
  if (!isoString) return 'Pendiente';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return 'Reciente';
  }
}

/**
 * Clears the 'last_known_good' key if needed.
 */
export function clearLastKnownGoodSnapshot(): void {
  try {
    localStorage.removeItem(LAST_KNOWN_GOOD_KEY);
  } catch (error) {
    console.error('Error removing last_known_good:', error);
  }
}
