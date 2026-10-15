import { useEffect, useRef, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { ScheduleEntry } from '../types';

interface UseScheduleHistoryProps {
  entries: ScheduleEntry[];
  setEntries: Dispatch<SetStateAction<ScheduleEntry[]>>;
  maxHistory?: number;
}

export function useScheduleHistory({
  entries,
  setEntries,
  maxHistory = 30,
}: UseScheduleHistoryProps) {
  const undoStackRef = useRef<ScheduleEntry[][]>([]);
  const redoStackRef = useRef<ScheduleEntry[][]>([]);
  const prevEntriesRef = useRef<ScheduleEntry[]>(entries);
  const isPerformingUndoRedoRef = useRef<boolean>(false);

  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Synchronize history when entries change via user actions
  useEffect(() => {
    if (isPerformingUndoRedoRef.current) {
      isPerformingUndoRedoRef.current = false;
      prevEntriesRef.current = entries;
      return;
    }

    if (prevEntriesRef.current !== entries) {
      // Check if there is actual meaningful difference
      const prev = prevEntriesRef.current;
      if (prev && prev.length > 0) {
        undoStackRef.current.push(prev);
        if (undoStackRef.current.length > maxHistory) {
          undoStackRef.current.shift();
        }
        // New change clears the redo stack
        redoStackRef.current = [];
        setCanUndo(true);
        setCanRedo(false);
      }
      prevEntriesRef.current = entries;
    }
  }, [entries, maxHistory]);

  const undo = useCallback((): boolean => {
    if (undoStackRef.current.length === 0) {
      return false;
    }

    const previous = undoStackRef.current.pop()!;
    redoStackRef.current.push(entries);
    isPerformingUndoRedoRef.current = true;

    setEntries(previous);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
    return true;
  }, [entries, setEntries]);

  const redo = useCallback((): boolean => {
    if (redoStackRef.current.length === 0) {
      return false;
    }

    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(entries);
    isPerformingUndoRedoRef.current = true;

    setEntries(next);
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
    return true;
  }, [entries, setEntries]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    undoCount: undoStackRef.current.length,
    redoCount: redoStackRef.current.length,
  };
}
