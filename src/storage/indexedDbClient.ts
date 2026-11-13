import type {
  ScheduleEntry,
  AcademicLoadItem,
  SchoolInfo,
  TimeSlotConfig,
  DutyAssignment,
  SubstitutionAssignment,
  Teacher,
} from '../types';
import type { SyncMutation } from '../core/models/schedule.types';

export interface OfflineCycleRecord {
  key: string; // `${cct}__${cycle}` e.g. '11EES0119S__2027-2028'
  cct: string;
  cycle: string;
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  schoolInfo: SchoolInfo;
  customTimeSlots?: TimeSlotConfig[];
  dutyAssignments: DutyAssignment[];
  substitutionAssignments: SubstitutionAssignment[];
  contacts: Teacher[];
  updatedAt: string;
}

const DB_NAME = 'gestor_horarios_offline_v2';
const DB_VERSION = 1;
const STORE_CYCLES = 'cycles';
const STORE_DRAFTS = 'drafts';
const STORE_SYNC_QUEUE = 'sync_queue';

class OfflineIndexedDbClient {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB no disponible'));
      }

      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_CYCLES)) {
          db.createObjectStore(STORE_CYCLES, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
          db.createObjectStore(STORE_DRAFTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
          db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id' });
        }
      };

      req.onsuccess = () => {
        const db = req.result;
        db.onclose = () => {
          this.dbPromise = null;
        };
        resolve(db);
      };

      req.onerror = () => reject(req.error || new Error('Error abriendo IndexedDB'));
    });

    return this.dbPromise;
  }

  async saveCycleState(record: OfflineCycleRecord): Promise<void> {
    try {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_CYCLES, 'readwrite');
        tx.objectStore(STORE_CYCLES).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      try {
        localStorage.setItem(`offline_cycle_${record.key}`, JSON.stringify(record));
      } catch {
        // Quota exceeded
      }
    }
  }

  async loadCycleState(cct: string, cycle: string): Promise<OfflineCycleRecord | null> {
    const key = `${cct}__${cycle}`;
    try {
      const db = await this.open();
      return await new Promise<OfflineCycleRecord | null>((resolve, reject) => {
        const tx = db.transaction(STORE_CYCLES, 'readonly');
        const req = tx.objectStore(STORE_CYCLES).get(key);
        req.onsuccess = () => resolve((req.result as OfflineCycleRecord) || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const raw = localStorage.getItem(`offline_cycle_${key}`);
      return raw ? (JSON.parse(raw) as OfflineCycleRecord) : null;
    }
  }

  async saveDraft(id: string, label: string, entries: ScheduleEntry[]): Promise<void> {
    const draft = { id, label, entries, savedAt: new Date().toISOString() };
    try {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readwrite');
        tx.objectStore(STORE_DRAFTS).put(draft);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
  }

  async listDrafts(): Promise<{ id: string; label: string; entries: ScheduleEntry[]; savedAt: string }[]> {
    try {
      const db = await this.open();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readonly');
        const req = tx.objectStore(STORE_DRAFTS).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async enqueueMutation(
    type: SyncMutation['type'],
    payload: unknown
  ): Promise<SyncMutation> {
    const mutation: SyncMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      payload,
      synced: false,
    };

    try {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
        tx.objectStore(STORE_SYNC_QUEUE).put(mutation);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Fallback
    }
    return mutation;
  }

  async getPendingMutations(): Promise<SyncMutation[]> {
    try {
      const db = await this.open();
      const all = await new Promise<SyncMutation[]>((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
        const req = tx.objectStore(STORE_SYNC_QUEUE).getAll();
        req.onsuccess = () => resolve((req.result as SyncMutation[]) || []);
        req.onerror = () => reject(req.error);
      });
      return all.filter((m) => !m.synced);
    } catch {
      return [];
    }
  }

  async flushSyncQueue(token: string | null): Promise<{ syncedCount: number; remaining: number }> {
    const pending = await this.getPendingMutations();
    if (pending.length === 0 || !token || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return { syncedCount: 0, remaining: pending.length };
    }

    try {
      const res = await fetch('/api/schedule/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mutations: pending }),
      });

      if (!res.ok) {
        return { syncedCount: 0, remaining: pending.length };
      }

      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_SYNC_QUEUE);
        for (const m of pending) {
          store.delete(m.id);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      return { syncedCount: pending.length, remaining: 0 };
    } catch {
      return { syncedCount: 0, remaining: pending.length };
    }
  }
}

export const indexedDbClient = new OfflineIndexedDbClient();
