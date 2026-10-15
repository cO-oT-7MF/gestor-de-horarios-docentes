import React, { useEffect } from 'react';
import { CheckCircle2, Info, AlertTriangle, RotateCcw, Save, RotateCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'undo' | 'redo' | 'save';
  shortcut?: string;
}

interface ToastNotificationProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onDismiss,
}) => {
  const { isLight } = useTheme();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 2800);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'save':
        return <Save className="w-4 h-4 text-amber-400" />;
      case 'undo':
        return <RotateCcw className="w-4 h-4 text-blue-400" />;
      case 'redo':
        return <RotateCw className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'info':
        return <Info className="w-4 h-4 text-sky-400" />;
      case 'success':
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 pointer-events-none flex flex-col items-end">
      <div
        className={`pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-2xl transition-all transform animate-in slide-in-from-bottom-3 duration-200 ${
          isLight
            ? 'bg-white border-slate-300 text-slate-800 shadow-slate-400/40'
            : 'bg-[#12151e] border-slate-700/80 text-slate-100 shadow-black/80'
        }`}
      >
        <div className="shrink-0 p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
          {getIcon()}
        </div>

        <div className="flex flex-col">
          <p className="text-xs font-bold leading-tight">{toast.message}</p>
        </div>

        {toast.shortcut && (
          <span
            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border shadow-2xs ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-slate-900 border-slate-700 text-amber-300'
            }`}
          >
            {toast.shortcut}
          </span>
        )}
      </div>
    </div>
  );
};
