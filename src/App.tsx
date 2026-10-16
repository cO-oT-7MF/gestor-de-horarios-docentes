/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  DayOfWeek,
  TimeSlotId,
  ScheduleEntry,
  Group,
  SchoolInfo,
  AcademicLoadItem,
  TimeSlotConfig,
  Conflict,
} from './types';
import {
  DEFAULT_SCHOOL_INFO,
  GROUPS,
  INITIAL_ACADEMIC_LOAD,
  parseInitialEntriesFromCSV,
  getTimeSlotsForShift,
} from './data/initialData';
import {
  autoResolveFluidScheduling,
  detectConflicts,
  getTeacherContractSummary,
  normalizeName,
  sanitizeAcademicLoads,
  solveTeacherOverlaps,
  solveAllConflicts,
  solveSingleConflict,
  sortScheduleEntries,
} from './utils/scheduler';
import { Navbar } from './components/Navbar';
import { TeacherScheduleView } from './components/TeacherScheduleView';
import { GroupScheduleView } from './components/GroupScheduleView';
import { MasterScheduleMatrix } from './components/MasterScheduleMatrix';
import { AcademicLoadView } from './components/AcademicLoadView';
import { ConflictDetectorView } from './components/ConflictDetectorView';
import { TeacherAvailabilityView } from './components/TeacherAvailabilityView';
import { EditSlotModal } from './components/EditSlotModal';
import { PrintScheduleModal } from './components/PrintScheduleModal';
import { ExportImportModal } from './components/ExportImportModal';
import { SchoolSettingsModal } from './components/SchoolSettingsModal';
import { UploadWorkloadModal, UploadWorkloadMode } from './components/UploadWorkloadModal';
import { GenerateScheduleModal } from './components/GenerateScheduleModal';
import { RestoreInitialModal } from './components/RestoreInitialModal';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal';
import { ToastNotification, ToastData } from './components/ToastNotification';
import { CopilotoEscolarChat } from './components/CopilotoEscolarChat';
import { MassNotificationModal } from './components/MassNotificationModal';
import { Sparkles } from 'lucide-react';
import { generateFullScheduleFromWorkload } from './utils/scheduler';
import { getInitialFactoryData, integrateNewTeacherWorkload } from './utils/googleDocParser';
import { getLastKnownGoodSnapshot } from './utils/autoSave';
import {
  saveCycleToIndexedDB,
  loadCycleFromIndexedDB,
  clearCycleFromIndexedDB,
  migrateLegacyLocalStorageToIndexedDB,
} from './utils/indexedDB';
import { standardizeTeacherName, getCanonicalTeacherId } from './data/teacherCatalog';
import { cleanseAndStandardizeScheduleData } from './utils/dataCleansing';
import { useOneClickSave } from './hooks/useAutoSave';
import { useScheduleHistory } from './hooks/useScheduleHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import confetti from 'canvas-confetti';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function ScheduleApp() {
  const { isLight } = useTheme();
  // Application Data States (persisted in localStorage for convenience)
  const [entries, setEntries] = useState<ScheduleEntry[]>(() => {
    const saved = localStorage.getItem('sec129_schedule_entries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((e: ScheduleEntry) => {
            const canonicalTeacher = standardizeTeacherName(e.teacherName);
            return {
              ...e,
              teacherName: canonicalTeacher,
              teacherId: e.teacherId || getCanonicalTeacherId(canonicalTeacher),
            };
          });
        }
      } catch {
        // Fallback
      }
    }
    // Fallback to secondary last_known_good key if primary is absent or corrupted
    const backup = getLastKnownGoodSnapshot();
    if (backup && Array.isArray(backup.entries) && backup.entries.length > 0) {
      return backup.entries.map((e: ScheduleEntry) => {
        const canonicalTeacher = standardizeTeacherName(e.teacherName);
        return {
          ...e,
          teacherName: canonicalTeacher,
          teacherId: e.teacherId || getCanonicalTeacherId(canonicalTeacher),
        };
      });
    }
    return getInitialFactoryData().entries;
  });

  const [academicLoads, setAcademicLoads] = useState<AcademicLoadItem[]>(() => {
    const saved = localStorage.getItem('sec129_academic_loads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = sanitizeAcademicLoads(parsed);
          if (cleaned.length > 0) {
            localStorage.setItem('sec129_academic_loads', JSON.stringify(cleaned));
            return cleaned;
          }
        }
      } catch {
        // Fallback
      }
    }
    // Fallback to secondary last_known_good key if primary is absent or corrupted
    const backup = getLastKnownGoodSnapshot();
    if (backup && Array.isArray(backup.academicLoads) && backup.academicLoads.length > 0) {
      const cleaned = sanitizeAcademicLoads(backup.academicLoads);
      if (cleaned.length > 0) {
        return cleaned;
      }
    }
    return INITIAL_ACADEMIC_LOAD;
  });

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const saved = localStorage.getItem('sec129_school_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    // Fallback to secondary last_known_good key
    const backup = getLastKnownGoodSnapshot();
    if (backup && backup.schoolInfo) {
      return backup.schoolInfo;
    }
    return DEFAULT_SCHOOL_INFO;
  });

  // Tracks the serialized schedule entries currently confirmed in localStorage
  const [lastPersistedEntriesStr, setLastPersistedEntriesStr] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sec129_schedule_entries');
      if (saved) return saved;
    } catch {
      // Ignore
    }
    return '';
  });

  // Ensure initial baseline is stored in IndexedDB and localStorage on first run and run data cleansing migration
  useEffect(() => {
    let isMounted = true;

    // Asynchronously load/verify full cycle state from IndexedDB
    loadCycleFromIndexedDB().then((cycle) => {
      if (isMounted && cycle && Array.isArray(cycle.entries) && cycle.entries.length > 0) {
        setEntries(cycle.entries);
        if (cycle.academicLoads && cycle.academicLoads.length > 0) {
          setAcademicLoads(cycle.academicLoads);
        }
        if (cycle.schoolInfo) {
          setSchoolInfo(cycle.schoolInfo);
        }
        if (cycle.customTimeSlots) {
          setCustomTimeSlots(cycle.customTimeSlots);
        }
        setLastPersistedEntriesStr(JSON.stringify(cycle.entries));
      } else {
        // If IndexedDB was empty, migrate legacy localStorage entries
        migrateLegacyLocalStorageToIndexedDB().then((migrated) => {
          if (isMounted && migrated && Array.isArray(migrated.entries) && migrated.entries.length > 0) {
            setEntries(migrated.entries);
            if (migrated.academicLoads) setAcademicLoads(migrated.academicLoads);
            if (migrated.schoolInfo) setSchoolInfo(migrated.schoolInfo);
            if (migrated.customTimeSlots) setCustomTimeSlots(migrated.customTimeSlots);
            setLastPersistedEntriesStr(JSON.stringify(migrated.entries));
          }
        });
      }
    });

    const saved = localStorage.getItem('sec129_schedule_entries');
    if (saved) {
      setLastPersistedEntriesStr(saved);
    } else {
      const initialStr = JSON.stringify(entries);
      try {
        localStorage.setItem('sec129_schedule_entries', initialStr);
      } catch {
        // Ignore
      }
      setLastPersistedEntriesStr(initialStr);
    }

    // Auto-migration and data cleansing check (merges duplicates like BRENDAS -> BRENDA S., ROSA M. variants)
    try {
      const cleansingApplied = localStorage.getItem('sec129_data_cleansing_v2_applied');
      if (!cleansingApplied) {
        const cleansed = cleanseAndStandardizeScheduleData(entries, academicLoads, GROUPS);
        setEntries(cleansed.cleanedEntries);
        setAcademicLoads(cleansed.cleanedLoads);
        const entriesJson = JSON.stringify(cleansed.cleanedEntries);
        const loadsJson = JSON.stringify(cleansed.cleanedLoads);
        localStorage.setItem('sec129_schedule_entries', entriesJson);
        localStorage.setItem('sec129_academic_loads', loadsJson);
        setLastPersistedEntriesStr(entriesJson);
        localStorage.setItem('sec129_data_cleansing_v2_applied', 'true');

        if (cleansed.deduplicatedTeachersCount > 0 || cleansed.resolvedOverlapsCount > 0) {
          showToast(
            `Depuración de datos completada: ${cleansed.deduplicatedTeachersCount} variaciones unificadas, ${cleansed.resolvedOverlapsCount} empalmes resueltos y catálogo institucional sincronizado.`,
            'info'
          );
        }
      }
    } catch (err) {
      console.warn('Error during data cleansing migration:', err);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Detect whether current schedule in memory differs from what has been persisted in localStorage
  const hasUnsavedScheduleChanges = useMemo(() => {
    if (!lastPersistedEntriesStr) return false;
    try {
      return JSON.stringify(entries) !== lastPersistedEntriesStr;
    } catch {
      return false;
    }
  }, [entries, lastPersistedEntriesStr]);

  // Safety guard: persist any pending unsaved schedule changes if the window/tab is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedScheduleChanges) {
        try {
          localStorage.setItem('sec129_schedule_entries', JSON.stringify(entries));
        } catch {
          // Ignore
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedScheduleChanges, entries]);

  useEffect(() => {
    localStorage.setItem('sec129_academic_loads', JSON.stringify(academicLoads));
  }, [academicLoads]);

  useEffect(() => {
    localStorage.setItem('sec129_school_info', JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'teacher' | 'group' | 'master' | 'workload' | 'conflicts' | 'availability'
  >('teacher');

  // Selected entities
  const [selectedTeacher, setSelectedTeacher] = useState<string>('Karen A');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('1A');

  // Modals state
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    day: DayOfWeek;
    slot: TimeSlotId;
    teacherName?: string;
    groupId?: string;
  }>({
    isOpen: false,
    day: 'Lunes',
    slot: 1,
  });

  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    initialType?: 'teacher' | 'group' | 'load';
    initialTeacher?: string;
    initialGroup?: string;
  }>({
    isOpen: false,
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSchoolSettingsOpen, setIsSchoolSettingsOpen] = useState(false);
  const [isUploadWorkloadOpen, setIsUploadWorkloadOpen] = useState(false);
  const [uploadWorkloadInitialMode, setUploadWorkloadInitialMode] = useState<UploadWorkloadMode>('new_cycle');
  const [isRestoreInitialOpen, setIsRestoreInitialOpen] = useState(false);
  const [isGenerateScheduleOpen, setIsGenerateScheduleOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isMassNotificationOpen, setIsMassNotificationOpen] = useState(false);
  const [massNotificationSubject, setMassNotificationSubject] = useState<string | undefined>(undefined);
  const [massNotificationBody, setMassNotificationBody] = useState<string | undefined>(undefined);

  // Global Toast Notifications
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback(
    (message: string, type?: ToastData['type'], shortcut?: string) => {
      setToast({
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        message,
        type,
        shortcut,
      });
    },
    []
  );

  // Undo / Redo history tracking for schedule modifications
  const { undo, redo, canUndo, canRedo } = useScheduleHistory({
    entries,
    setEntries,
    maxHistory: 35,
  });

  const handleUndo = useCallback(() => {
    const success = undo();
    if (success) {
      showToast('Horario restaurado al cambio anterior', 'undo', 'Ctrl+Z');
    } else {
      showToast('No hay más cambios previos para deshacer', 'info');
    }
  }, [undo, showToast]);

  const handleRedo = useCallback(() => {
    const success = redo();
    if (success) {
      showToast('Cambio restablecido en el horario', 'redo', 'Ctrl+Y');
    } else {
      showToast('No hay cambios para rehacer', 'info');
    }
  }, [redo, showToast]);

  // Handle uploaded workload and auto-generation
  const handleSaveUploadedWorkload = (
    loads: AcademicLoadItem[],
    shouldAutoGenerate: boolean
  ) => {
    const cleanLoads = sanitizeAcademicLoads(loads);
    setAcademicLoads(cleanLoads);
    localStorage.setItem('sec129_academic_loads', JSON.stringify(cleanLoads));
    if (shouldAutoGenerate) {
      const result = generateFullScheduleFromWorkload(cleanLoads, GROUPS);
      setEntries(result.entries);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe confetti fallback
      }
    }
  };

  // Handle adding new teacher into workload & schedule
  const handleAddNewTeacher = (
    teacherName: string,
    subject: string,
    groupsWithHours: { groupId: string; hours: number }[]
  ) => {
    const res = integrateNewTeacherWorkload(
      teacherName,
      subject,
      groupsWithHours,
      academicLoads,
      entries
    );
    const cleanLoads = sanitizeAcademicLoads(res.updatedLoads);
    setAcademicLoads(cleanLoads);
    localStorage.setItem('sec129_academic_loads', JSON.stringify(cleanLoads));
    setEntries(res.updatedEntries);
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Safe confetti fallback
    }
  };

  // Handle confirm restore initial values to factory settings
  const handleConfirmRestoreInitialValues = () => {
    const factory = getInitialFactoryData();
    localStorage.removeItem('sec129_schedule_entries');
    localStorage.removeItem('sec129_academic_loads');
    localStorage.removeItem('sec129_school_info');
    localStorage.removeItem('sec129_custom_time_slots');

    // Reset IndexedDB
    clearCycleFromIndexedDB().then(() => {
      saveCycleToIndexedDB({
        entries: factory.entries,
        academicLoads: factory.academicLoads,
        schoolInfo: factory.schoolInfo,
      });
    });

    const factoryEntriesStr = JSON.stringify(factory.entries);
    try {
      localStorage.setItem('sec129_schedule_entries', factoryEntriesStr);
    } catch {
      // Ignore
    }
    setLastPersistedEntriesStr(factoryEntriesStr);

    setEntries(factory.entries);
    setAcademicLoads(factory.academicLoads);
    setSchoolInfo(factory.schoolInfo);
    setCustomTimeSlots(undefined);

    try {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Safe confetti fallback
    }
  };

  // Handle upload dropdown options (new_cycle, add_teacher, reset_initial)
  const handleSelectUploadOption = (option: UploadWorkloadMode) => {
    if (option === 'reset_initial') {
      setIsRestoreInitialOpen(true);
    } else {
      setUploadWorkloadInitialMode(option);
      setIsUploadWorkloadOpen(true);
    }
  };

  const handleApplyGeneratedSchedule = (newEntries: ScheduleEntry[]) => {
    setEntries(newEntries);
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Safe confetti fallback
    }
  };

  // Custom time slots state (persisted in localStorage)
  const [customTimeSlots, setCustomTimeSlots] = useState<TimeSlotConfig[] | undefined>(() => {
    const saved = localStorage.getItem('sec129_custom_time_slots');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    // Fallback to secondary last_known_good key
    const backup = getLastKnownGoodSnapshot();
    if (backup && backup.customTimeSlots && Array.isArray(backup.customTimeSlots)) {
      return backup.customTimeSlots;
    }
    return undefined;
  });

  useEffect(() => {
    if (customTimeSlots) {
      localStorage.setItem('sec129_custom_time_slots', JSON.stringify(customTimeSlots));
    } else {
      localStorage.removeItem('sec129_custom_time_slots');
    }
  }, [customTimeSlots]);

  // One-Click Manual Save: persists full cycle state and schedule matrix into IndexedDB
  const {
    lastSavedTimestamp,
    isSaving: isAutoSaving,
    saveNow: saveAutoSaveNow,
  } = useOneClickSave({
    entries,
    academicLoads,
    schoolInfo,
    customTimeSlots,
    onSave: () => {
      const serializedEntries = JSON.stringify(entries);
      try {
        localStorage.setItem('sec129_schedule_entries', serializedEntries);
        localStorage.setItem('sec129_academic_loads', JSON.stringify(academicLoads));
        localStorage.setItem('sec129_school_info', JSON.stringify(schoolInfo));
        if (customTimeSlots) {
          localStorage.setItem('sec129_custom_time_slots', JSON.stringify(customTimeSlots));
        }
      } catch {
        // Ignore quota error
      }
      setLastPersistedEntriesStr(serializedEntries);
    },
  });

  // Manual Immediate Save (Ctrl+S / One-Click Save button)
  const handleManualSave = useCallback(async () => {
    const serializedEntries = JSON.stringify(entries);
    try {
      await saveCycleToIndexedDB({
        entries,
        academicLoads,
        schoolInfo,
        customTimeSlots,
      });
    } catch (err) {
      console.error('Error guardando en IndexedDB:', err);
    }
    try {
      localStorage.setItem('sec129_schedule_entries', serializedEntries);
      localStorage.setItem('sec129_academic_loads', JSON.stringify(academicLoads));
      localStorage.setItem('sec129_school_info', JSON.stringify(schoolInfo));
      if (customTimeSlots) {
        localStorage.setItem('sec129_custom_time_slots', JSON.stringify(customTimeSlots));
      }
    } catch {
      // Ignore quota error
    }
    setLastPersistedEntriesStr(serializedEntries);
    saveAutoSaveNow();
    showToast('Ciclo escolar y matriz de horarios guardados en IndexedDB', 'save', 'Ctrl+S');
  }, [entries, academicLoads, schoolInfo, customTimeSlots, saveAutoSaveNow, showToast]);

  // Derive time slots dynamically based on active shift
  const timeSlots = useMemo(() => {
    if (customTimeSlots && customTimeSlots.length === 7) {
      return customTimeSlots;
    }
    return getTimeSlotsForShift(schoolInfo.shift);
  }, [schoolInfo.shift, customTimeSlots]);

  const handleToggleShift = () => {
    setCustomTimeSlots(undefined);
    setSchoolInfo((prev) => {
      const isVespertino = prev.shift.toUpperCase().includes('VESPERTINO');
      return {
        ...prev,
        shift: isVespertino ? 'TURNO MATUTINO' : 'TURNO VESPERTINO',
      };
    });
  };

  // Derive unique teachers list with standardized canonical names
  const allTeachers = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.teacherName && e.teacherName.trim()) {
        set.add(standardizeTeacherName(e.teacherName));
      }
    });
    academicLoads.forEach((l) => {
      if (l.advisor && l.advisor.trim()) {
        set.add(standardizeTeacherName(l.advisor));
      }
      Object.values(l.subjects).forEach((s: { teacherName: string; hours: number }) => {
        if (s.teacherName && s.teacherName.trim()) {
          set.add(standardizeTeacherName(s.teacherName));
        }
      });
    });
    return Array.from(set).sort();
  }, [entries, academicLoads]);

  // Update selected teacher if not in list
  useEffect(() => {
    if (allTeachers.length > 0 && !allTeachers.includes(selectedTeacher)) {
      setSelectedTeacher(allTeachers[0]);
    }
  }, [allTeachers, selectedTeacher]);

  // Run Conflict Detection
  const conflicts = useMemo(() => {
    return detectConflicts(entries, GROUPS, academicLoads);
  }, [entries, academicLoads]);

  const teacherOverlapsCount = conflicts.filter((c) => c.type === 'TEACHER_OVERLAP').length;

  // Self-healing: Automatically resolve fluid scheduling for all teachers so no hours are missing
  useEffect(() => {
    const summary = getTeacherContractSummary(allTeachers, academicLoads, entries, conflicts);
    const underTeachers = summary.filter((t) => t.status === 'under');
    // If any teacher is missing assigned hours or conflicts exist, automatically resolve fluidly
    if (underTeachers.length > 0 || conflicts.length > 0) {
      const res = autoResolveFluidScheduling(entries, academicLoads, GROUPS);
      if (res.totalPlaced >= entries.length && res.conflictsCount === 0) {
        setEntries(res.entries);
      }
    }
  }, [academicLoads]);

  // Handlers
  const handleOpenEditSlot = (
    day: DayOfWeek,
    slot: TimeSlotId,
    teacherName?: string,
    groupId?: string
  ) => {
    setEditModalState({
      isOpen: true,
      day,
      slot,
      teacherName,
      groupId,
    });
  };

  const handleSaveSlotEntry = (data: {
    id?: string;
    day: DayOfWeek;
    slot: TimeSlotId;
    groupId: string;
    teacherName: string;
    teacherId?: string;
    subject: string;
  }) => {
    const canonicalTeacher = standardizeTeacherName(data.teacherName);
    const canonicalTeacherId = data.teacherId || getCanonicalTeacherId(canonicalTeacher);

    setEntries((prev) => {
      let updated: ScheduleEntry[];
      if (data.id) {
        // Update existing
        updated = prev.map((e) =>
          e.id === data.id
            ? {
                ...e,
                day: data.day,
                slot: data.slot,
                groupId: data.groupId,
                teacherName: canonicalTeacher,
                teacherId: canonicalTeacherId,
                subject: data.subject,
              }
            : e
        );
      } else {
        // Create new
        const newEntry: ScheduleEntry = {
          id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          day: data.day,
          slot: data.slot,
          groupId: data.groupId,
          teacherName: canonicalTeacher,
          teacherId: canonicalTeacherId,
          subject: data.subject,
        };
        updated = [...prev, newEntry];
      }
      return sortScheduleEntries(updated);
    });
  };

  const handleDeleteSlotEntry = (entryId: string) => {
    setEntries((prev) => sortScheduleEntries(prev.filter((e) => e.id !== entryId)));
  };

  const handleUpdateEntries = (newEntries: ScheduleEntry[]) => {
    setEntries(sortScheduleEntries(newEntries));
  };

  const handleGlobalAutoSolve = () => {
    const res = autoResolveFluidScheduling(entries, academicLoads, GROUPS);
    setEntries(res.entries);
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Safe fallback
    }
  };

  const handleSolveSingleConflict = (conflict?: Conflict) => {
    if (!conflict) return;
    const result = solveSingleConflict(conflict, entries, GROUPS, academicLoads);
    if (result.success) {
      setEntries(result.newEntries);
      showToast(result.message, 'success');
      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }
    } else {
      showToast(result.message, 'error');
    }
    return result;
  };

  const handleOpenPrintForTeacher = (tName: string) => {
    setPrintModalState({
      isOpen: true,
      initialType: 'teacher',
      initialTeacher: tName,
    });
  };

  const handleOpenPrintForGroup = (gId: string) => {
    setPrintModalState({
      isOpen: true,
      initialType: 'group',
      initialGroup: gId,
    });
  };

  // Global Keyboard Shortcuts for Power Users (Ctrl+S, Ctrl+Z, Ctrl+Y, Ctrl+P, Tabs, Esc, Help)
  useKeyboardShortcuts({
    onSave: handleManualSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onPrint: () => setPrintModalState({ isOpen: true, initialType: 'teacher' }),
    onExport: () => setIsExportModalOpen(true),
    onAutoSolve: handleGlobalAutoSolve,
    onSelectTab: (tabIndex) => {
      const tabMap: Record<number, typeof activeTab> = {
        1: 'teacher',
        2: 'group',
        3: 'master',
        4: 'workload',
        5: 'conflicts',
        6: 'availability',
      };
      if (tabMap[tabIndex]) {
        setActiveTab(tabMap[tabIndex]);
      }
    },
    onToggleHelp: () => setIsShortcutsModalOpen((prev) => !prev),
    onToggleCopilot: () => setIsCopilotOpen((prev) => !prev),
    onEscape: () => {
      setIsCopilotOpen(false);
      setIsShortcutsModalOpen(false);
      setEditModalState((prev) => ({ ...prev, isOpen: false }));
      setIsSchoolSettingsOpen(false);
      setIsExportModalOpen(false);
      setPrintModalState((prev) => ({ ...prev, isOpen: false }));
      setIsUploadWorkloadOpen(false);
      setIsRestoreInitialOpen(false);
      setIsGenerateScheduleOpen(false);
    },
    enabled: true,
  });

  return (
    <div
      className={`min-h-screen ${
        isLight ? 'theme-light bg-slate-100 text-slate-900' : 'bg-[#0a0a0a] text-slate-200'
      } flex flex-col font-sans transition-colors duration-200 selection:bg-amber-500/30 selection:text-amber-900`}
    >
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conflictCount={conflicts.length}
        schoolInfo={schoolInfo}
        timeSlots={timeSlots}
        onOpenPrintModal={() => setPrintModalState({ isOpen: true })}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSchoolSettings={() => setIsSchoolSettingsOpen(true)}
        onOpenUploadModal={() => {
          setUploadWorkloadInitialMode('new_cycle');
          setIsUploadWorkloadOpen(true);
        }}
        onOpenGenerateModal={() => setIsGenerateScheduleOpen(true)}
        onToggleShift={handleToggleShift}
        onAutoSolve={handleGlobalAutoSolve}
        onRestoreInitialValues={() => setIsRestoreInitialOpen(true)}
        onSelectUploadOption={handleSelectUploadOption}
        lastSavedTimestamp={lastSavedTimestamp}
        isAutoSaving={isAutoSaving}
        onManualAutoSave={handleManualSave}
        hasUnsavedChanges={hasUnsavedScheduleChanges}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
      />

      {/* Main View Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'teacher' && (
          <TeacherScheduleView
            entries={entries}
            allTeachers={allTeachers}
            selectedTeacher={selectedTeacher}
            setSelectedTeacher={setSelectedTeacher}
            conflicts={conflicts}
            groups={GROUPS}
            academicLoads={academicLoads}
            timeSlots={timeSlots}
            onEditSlot={handleOpenEditSlot}
            onPrintTeacher={handleOpenPrintForTeacher}
            onSolveConflict={handleSolveSingleConflict}
            onSolveAllConflicts={handleGlobalAutoSolve}
            onUpdateEntries={handleUpdateEntries}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'group' && (
          <GroupScheduleView
            entries={entries}
            groups={GROUPS}
            academicLoads={academicLoads}
            selectedGroupId={selectedGroupId}
            setSelectedGroupId={setSelectedGroupId}
            conflicts={conflicts}
            timeSlots={timeSlots}
            onEditSlot={handleOpenEditSlot}
            onPrintGroup={handleOpenPrintForGroup}
            onSolveConflict={handleSolveSingleConflict}
            onSolveAllConflicts={handleGlobalAutoSolve}
          />
        )}

        {activeTab === 'master' && (
          <MasterScheduleMatrix
            entries={entries}
            allTeachers={allTeachers}
            groups={GROUPS}
            conflicts={conflicts}
            academicLoads={academicLoads}
            timeSlots={timeSlots}
            onEditSlot={handleOpenEditSlot}
            onSolveConflict={handleSolveSingleConflict}
            onSolveAllConflicts={handleGlobalAutoSolve}
            onUpdateEntries={handleUpdateEntries}
          />
        )}

        {activeTab === 'workload' && (
          <AcademicLoadView
            academicLoads={academicLoads}
            setAcademicLoads={setAcademicLoads}
            allTeachers={allTeachers}
            groups={GROUPS}
            schoolInfo={schoolInfo}
            onPrintLoad={() => setPrintModalState({ isOpen: true, initialType: 'load' })}
            onOpenUploadModal={() => {
              setUploadWorkloadInitialMode('new_cycle');
              setIsUploadWorkloadOpen(true);
            }}
            onOpenGenerateModal={() => setIsGenerateScheduleOpen(true)}
            onRestoreInitialValues={() => setIsRestoreInitialOpen(true)}
            onSelectUploadOption={handleSelectUploadOption}
          />
        )}

        {activeTab === 'conflicts' && (
          <ConflictDetectorView
            conflicts={conflicts}
            entries={entries}
            setEntries={setEntries}
            groups={GROUPS}
            academicLoads={academicLoads}
            onEditSlot={handleOpenEditSlot}
            onSolveConflict={handleSolveSingleConflict}
            onSolveAllConflicts={handleGlobalAutoSolve}
          />
        )}

        {activeTab === 'availability' && (
          <TeacherAvailabilityView
            entries={entries}
            allTeachers={allTeachers}
            academicLoads={academicLoads}
            groups={GROUPS}
            timeSlots={timeSlots}
            onSelectTeacher={(t) => {
              setSelectedTeacher(t);
              setActiveTab('teacher');
            }}
          />
        )}
      </main>

      {/* Modals */}
      <UploadWorkloadModal
        isOpen={isUploadWorkloadOpen}
        onClose={() => setIsUploadWorkloadOpen(false)}
        initialMode={uploadWorkloadInitialMode}
        onSaveWorkload={handleSaveUploadedWorkload}
        onAddNewTeacher={handleAddNewTeacher}
        onResetInitial={() => setIsRestoreInitialOpen(true)}
        groups={GROUPS}
        allTeachers={allTeachers}
        schoolInfo={schoolInfo}
        currentLoads={academicLoads}
        currentEntries={entries}
      />

      <RestoreInitialModal
        isOpen={isRestoreInitialOpen}
        onClose={() => setIsRestoreInitialOpen(false)}
        onConfirmRestore={handleConfirmRestoreInitialValues}
      />

      <GenerateScheduleModal
        isOpen={isGenerateScheduleOpen}
        onClose={() => setIsGenerateScheduleOpen(false)}
        academicLoads={academicLoads}
        groups={GROUPS}
        schoolInfo={schoolInfo}
        onApplySchedule={handleApplyGeneratedSchedule}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Modals */}
      <EditSlotModal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState((prev) => ({ ...prev, isOpen: false }))}
        day={editModalState.day}
        slot={editModalState.slot}
        initialTeacherName={editModalState.teacherName}
        initialGroupId={editModalState.groupId}
        entries={entries}
        groups={GROUPS}
        allTeachers={allTeachers}
        timeSlots={timeSlots}
        onSaveEntry={handleSaveSlotEntry}
        onDeleteEntry={handleDeleteSlotEntry}
      />

      <PrintScheduleModal
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState({ isOpen: false })}
        entries={entries}
        allTeachers={allTeachers}
        groups={GROUPS}
        academicLoads={academicLoads}
        schoolInfo={schoolInfo}
        timeSlots={timeSlots}
        initialType={printModalState.initialType}
        initialTeacher={printModalState.initialTeacher || selectedTeacher}
        initialGroup={printModalState.initialGroup || selectedGroupId}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        entries={entries}
        setEntries={setEntries}
        allTeachers={allTeachers}
        groups={GROUPS}
        academicLoads={academicLoads}
        setAcademicLoads={setAcademicLoads}
        schoolInfo={schoolInfo}
        setSchoolInfo={setSchoolInfo}
        customTimeSlots={customTimeSlots}
        setCustomTimeSlots={setCustomTimeSlots}
        onOpenPrintModal={() => setPrintModalState({ isOpen: true })}
      />

      <SchoolSettingsModal
        isOpen={isSchoolSettingsOpen}
        onClose={() => setIsSchoolSettingsOpen(false)}
        schoolInfo={schoolInfo}
        onUpdateSchoolInfo={setSchoolInfo}
        setSchoolInfo={setSchoolInfo}
        customTimeSlots={customTimeSlots}
        onUpdateTimeSlots={setCustomTimeSlots}
        onRestoreInitialValues={() => setIsRestoreInitialOpen(true)}
      />

      {/* Keyboard Shortcuts Reference Modal for Power Users */}
      <ShortcutsHelpModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Copiloto Operativo Escolar IA Chatbot */}
      <CopilotoEscolarChat
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        activeTab={activeTab}
        onNavigateTab={(tab) => setActiveTab(tab)}
        schoolInfo={schoolInfo}
        selectedTeacher={selectedTeacher}
        onSelectTeacher={setSelectedTeacher}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        entries={entries}
        academicLoads={academicLoads}
        allTeachers={allTeachers}
        conflicts={conflicts}
        groups={GROUPS}
        timeSlots={timeSlots}
        onSolveAllConflicts={handleGlobalAutoSolve}
        onOpenMassNotification={(sub, body) => {
          if (sub) setMassNotificationSubject(sub);
          if (body) setMassNotificationBody(body);
          setIsMassNotificationOpen(true);
        }}
        onShowToast={showToast}
      />

      {/* Mass Notification Modal for Broadcast Notices / Circulars */}
      <MassNotificationModal
        isOpen={isMassNotificationOpen}
        onClose={() => setIsMassNotificationOpen(false)}
        allTeachers={allTeachers}
        initialSubject={massNotificationSubject}
        initialMessageBody={massNotificationBody}
      />

      {/* Floating launcher widget button when closed */}
      {!isCopilotOpen && (
        <button
          id="copiloto-floating-trigger-btn"
          onClick={() => setIsCopilotOpen(true)}
          className={`fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-200 cursor-pointer active:scale-95 group hover:-translate-y-0.5 ${
            isLight
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/30 hover:shadow-amber-500/50'
              : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-400/30 shadow-amber-900/50 hover:shadow-amber-600/50'
          }`}
          title="Abrir Copiloto Operativo Escolar IA (Ctrl+K)"
        >
          <div className="relative">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </span>
            {conflicts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping" />
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
              Copiloto IA
              <span className="text-[10px] opacity-75 font-mono">Sec. 129</span>
            </span>
            <span className="text-[10px] text-amber-100/90 leading-none">
              {conflicts.length > 0 ? `${conflicts.length} empalmes activos` : 'Plantilla 100% óptima'}
            </span>
          </div>
          <kbd className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-black/25 font-mono text-amber-100 ml-1">
            Ctrl+K
          </kbd>
        </button>
      )}

      {/* Global Shortcut and Action Toast Notification */}
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ScheduleApp />
    </ThemeProvider>
  );
}
