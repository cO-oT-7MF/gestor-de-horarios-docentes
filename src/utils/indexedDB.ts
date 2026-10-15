import {
  ScheduleEntry,
  AcademicLoadItem,
  SchoolInfo,
  TimeSlotConfig,
  DutyAssignment,
  SubstitutionAssignment,
} from '../types';

export interface FullCycleState {
  id: 'current_cycle';
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  schoolInfo: SchoolInfo;
  customTimeSlots?: TimeSlotConfig[];
  dutyAssignments?: DutyAssignment[];
  substitutionAssignments?: SubstitutionAssignment[];
  lastSavedTimestamp: string;
  version: string;
}

const DB_NAME = 'sec129_school_db';
const DB_VERSION = 1;
const CYCLE_STORE = 'cycle_state';
const DUTIES_STORE = 'duties';
const SUBS_STORE = 'substitutions';

let dbInstance: IDBDatabase | null = null;

/**
 * Initializes and returns a singleton IndexedDB connection.
 */
export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no está disponible en este entorno.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(CYCLE_STORE)) {
        db.createObjectStore(CYCLE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DUTIES_STORE)) {
        db.createObjectStore(DUTIES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SUBS_STORE)) {
        db.createObjectStore(SUBS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: Event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error || new Error('No se pudo abrir la base de datos IndexedDB.'));
    };
  });
}

/**
 * Persists the entire cycle state and schedule matrix into IndexedDB.
 */
export async function saveCycleToIndexedDB(data: {
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  schoolInfo: SchoolInfo;
  customTimeSlots?: TimeSlotConfig[];
  dutyAssignments?: DutyAssignment[];
  substitutionAssignments?: SubstitutionAssignment[];
}): Promise<FullCycleState> {
  const timestamp = new Date().toISOString();
  const record: FullCycleState = {
    id: 'current_cycle',
    entries: data.entries,
    academicLoads: data.academicLoads,
    schoolInfo: data.schoolInfo,
    customTimeSlots: data.customTimeSlots,
    dutyAssignments: data.dutyAssignments,
    substitutionAssignments: data.substitutionAssignments,
    lastSavedTimestamp: timestamp,
    version: '2.0',
  };

  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([CYCLE_STORE], 'readwrite');
      const store = transaction.objectStore(CYCLE_STORE);
      const putReq = store.put(record);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
      transaction.onerror = () => reject(transaction.error);
    });

    // Also persist duties and substitutions to their stores if provided
    if (data.dutyAssignments) {
      await saveDutiesToIndexedDB(data.dutyAssignments);
    }
    if (data.substitutionAssignments) {
      await saveSubstitutionsToIndexedDB(data.substitutionAssignments);
    }

    return record;
  } catch (error) {
    console.error('Error guardando el ciclo en IndexedDB, usando fallback:', error);
    // Graceful fallback to localStorage
    try {
      localStorage.setItem('sec129_cycle_indexeddb_fallback', JSON.stringify(record));
    } catch {
      // Ignore quota error
    }
    return record;
  }
}

/**
 * Loads the cycle state from IndexedDB. Returns null if not found.
 */
export async function loadCycleFromIndexedDB(): Promise<FullCycleState | null> {
  try {
    const db = await openIndexedDB();
    return await new Promise<FullCycleState | null>((resolve, reject) => {
      const transaction = db.transaction([CYCLE_STORE], 'readonly');
      const store = transaction.objectStore(CYCLE_STORE);
      const getReq = store.get('current_cycle');

      getReq.onsuccess = () => {
        const result = getReq.result as FullCycleState | undefined;
        resolve(result || null);
      };
      getReq.onerror = () => reject(getReq.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('No se pudo leer de IndexedDB, intentando fallback de localStorage:', error);
    try {
      const fallback = localStorage.getItem('sec129_cycle_indexeddb_fallback');
      if (fallback) {
        return JSON.parse(fallback) as FullCycleState;
      }
    } catch {
      // Ignore
    }
    return null;
  }
}

/**
 * Saves duty assignments to IndexedDB.
 */
export async function saveDutiesToIndexedDB(duties: DutyAssignment[]): Promise<void> {
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([DUTIES_STORE], 'readwrite');
      const store = transaction.objectStore(DUTIES_STORE);
      store.clear();
      duties.forEach((d) => store.put(d));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Error guardando guardias en IndexedDB:', err);
  }
}

/**
 * Loads duty assignments from IndexedDB.
 */
export async function loadDutiesFromIndexedDB(): Promise<DutyAssignment[]> {
  try {
    const db = await openIndexedDB();
    return await new Promise<DutyAssignment[]>((resolve, reject) => {
      const transaction = db.transaction([DUTIES_STORE], 'readonly');
      const store = transaction.objectStore(DUTIES_STORE);
      const getReq = store.getAll();

      getReq.onsuccess = () => {
        resolve((getReq.result as DutyAssignment[]) || []);
      };
      getReq.onerror = () => reject(getReq.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Error cargando guardias de IndexedDB:', err);
    return [];
  }
}

/**
 * Saves substitutions to IndexedDB.
 */
export async function saveSubstitutionsToIndexedDB(subs: SubstitutionAssignment[]): Promise<void> {
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([SUBS_STORE], 'readwrite');
      const store = transaction.objectStore(SUBS_STORE);
      store.clear();
      subs.forEach((s) => store.put(s));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Error guardando suplencias en IndexedDB:', err);
  }
}

/**
 * Loads substitutions from IndexedDB.
 */
export async function loadSubstitutionsFromIndexedDB(): Promise<SubstitutionAssignment[]> {
  try {
    const db = await openIndexedDB();
    return await new Promise<SubstitutionAssignment[]>((resolve, reject) => {
      const transaction = db.transaction([SUBS_STORE], 'readonly');
      const store = transaction.objectStore(SUBS_STORE);
      const getReq = store.getAll();

      getReq.onsuccess = () => {
        resolve((getReq.result as SubstitutionAssignment[]) || []);
      };
      getReq.onerror = () => reject(getReq.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Error cargando suplencias de IndexedDB:', err);
    return [];
  }
}

/**
 * Clears the cycle and schedule data from IndexedDB.
 */
export async function clearCycleFromIndexedDB(): Promise<void> {
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([CYCLE_STORE, DUTIES_STORE, SUBS_STORE], 'readwrite');
      transaction.objectStore(CYCLE_STORE).clear();
      transaction.objectStore(DUTIES_STORE).clear();
      transaction.objectStore(SUBS_STORE).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Error limpiando IndexedDB:', err);
  }
}

/**
 * Helper to migrate data from legacy localStorage into IndexedDB on first run.
 */
export async function migrateLegacyLocalStorageToIndexedDB(): Promise<FullCycleState | null> {
  try {
    const existing = await loadCycleFromIndexedDB();
    if (existing && Array.isArray(existing.entries) && existing.entries.length > 0) {
      return existing;
    }

    // Check localStorage
    const savedEntries = localStorage.getItem('sec129_schedule_entries');
    const savedLoads = localStorage.getItem('sec129_academic_loads');
    const savedSchool = localStorage.getItem('sec129_school_info');
    const savedSlots = localStorage.getItem('sec129_custom_time_slots');

    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      const academicLoads = savedLoads ? JSON.parse(savedLoads) : [];
      const schoolInfo = savedSchool ? JSON.parse(savedSchool) : undefined;
      const customTimeSlots = savedSlots ? JSON.parse(savedSlots) : undefined;

      if (Array.isArray(entries) && entries.length > 0) {
        console.log('Migrando matriz de horario y ciclo desde localStorage a IndexedDB...');
        const saved = await saveCycleToIndexedDB({
          entries,
          academicLoads,
          schoolInfo: schoolInfo || {
            name: 'Escuela Secundaria Técnica No. 129',
            schoolYear: '2025 - 2026',
            zone: '023',
            workCenterKey: '27DST0129Y',
            regionalUnit: 'Cárdenas, Tabasco',
            shift: 'TURNO VESPERTINO',
          },
          customTimeSlots,
        });
        return saved;
      }
    }
  } catch (err) {
    console.warn('Error durante la migración a IndexedDB:', err);
  }
  return null;
}
