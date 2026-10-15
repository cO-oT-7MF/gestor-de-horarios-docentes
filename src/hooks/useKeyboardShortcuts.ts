import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPrint?: () => void;
  onExport?: () => void;
  onAutoSolve?: () => void;
  onSelectTab?: (tabIndex: number) => void;
  onToggleHelp?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
  onPrint,
  onExport,
  onAutoSolve,
  onSelectTab,
  onToggleHelp,
  onEscape,
  enabled = true,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac =
        typeof navigator !== 'undefined' &&
        navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isModifier = isMac ? e.metaKey : e.ctrlKey;

      const target = e.target as HTMLElement | null;
      const isTextInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // 1. Escape key: Close any active modal or menu
      if (e.key === 'Escape') {
        if (onEscape) {
          onEscape();
        }
        return;
      }

      // 2. Help dialog: '?' (without modifier) or 'Ctrl+/' / 'Cmd+/'
      if (
        (e.key === '?' && !isTextInput && !e.ctrlKey && !e.altKey && !e.metaKey) ||
        (isModifier && (e.key === '/' || e.key === '?'))
      ) {
        e.preventDefault();
        onToggleHelp?.();
        return;
      }

      // Modifier key shortcuts (Ctrl / Cmd)
      if (isModifier) {
        const key = e.key.toLowerCase();

        // Save: Ctrl+S / Cmd+S (Always intercepted, even if inside an input field)
        if (key === 's') {
          e.preventDefault();
          onSave();
          return;
        }

        // Undo & Redo
        if (key === 'z') {
          // If the user is currently typing in an input or textarea, let the native text undo handle it
          if (isTextInput) return;

          e.preventDefault();
          if (e.shiftKey) {
            onRedo();
          } else {
            onUndo();
          }
          return;
        }

        if (key === 'y') {
          if (isTextInput) return;
          e.preventDefault();
          onRedo();
          return;
        }

        // Print: Ctrl+P / Cmd+P
        if (key === 'p' && onPrint) {
          e.preventDefault();
          onPrint();
          return;
        }

        // Export: Ctrl+E / Cmd+E
        if (key === 'e' && onExport) {
          e.preventDefault();
          onExport();
          return;
        }

        // Auto-Solve: Ctrl+Shift+A / Cmd+Shift+A
        if (key === 'a' && e.shiftKey && onAutoSolve) {
          e.preventDefault();
          onAutoSolve();
          return;
        }

        // Tabs: Ctrl+1 through Ctrl+6
        if (!isTextInput && onSelectTab) {
          const tabNumber = parseInt(e.key, 10);
          if (tabNumber >= 1 && tabNumber <= 6) {
            e.preventDefault();
            onSelectTab(tabNumber);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    onSave,
    onUndo,
    onRedo,
    onPrint,
    onExport,
    onAutoSolve,
    onSelectTab,
    onToggleHelp,
    onEscape,
  ]);
}
