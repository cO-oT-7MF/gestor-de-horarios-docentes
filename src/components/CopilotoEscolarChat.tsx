import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  AlertCircle,
  Zap,
  ArrowRight,
  Shield,
  Clock,
  Layers,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  ScheduleEntry,
  Group,
  SchoolInfo,
  AcademicLoadItem,
  Conflict,
  TimeSlotConfig,
} from '../types';
import {
  ChatMessage,
  CopilotExecutableAction,
  buildCopilotContext,
  sendCopilotChat,
} from '../services/copilotService';
import { useTheme } from '../context/ThemeContext';

interface CopilotoEscolarChatProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'teacher' | 'group' | 'master' | 'workload' | 'conflicts' | 'availability';
  onNavigateTab: (tab: 'teacher' | 'group' | 'master' | 'workload' | 'conflicts' | 'availability') => void;
  schoolInfo: SchoolInfo;
  selectedTeacher: string;
  onSelectTeacher: (teacherName: string) => void;
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  allTeachers: string[];
  conflicts: Conflict[];
  groups: Group[];
  onSolveAllConflicts: () => void;
  onOpenMassNotification?: (subject?: string, messageBody?: string) => void;
  onShowToast: (message: string, type?: 'save' | 'undo' | 'redo' | 'success' | 'info' | 'error') => void;
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome-0',
  role: 'model',
  text: `**School Operations Copilot (Copiloto Operativo Escolar) en línea.**\n\nAsistente de administración educativa y optimización de horarios para la **Escuela Secundaria Nº 129 "Gral. Félix U. Gómez"** (CT 19EES0129S).\n\nConozco la estructura de los 40 docentes, las 840 horas globales del ciclo 2026-2027 y las reglas de recesos escalonados de 20 min (15:00 - 16:00 hrs). ¿Qué aspecto operativo, ajuste de horario o redacción de circular deseas realizar?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const CopilotoEscolarChat: React.FC<CopilotoEscolarChatProps> = ({
  isOpen,
  onClose,
  activeTab,
  onNavigateTab,
  schoolInfo,
  selectedTeacher,
  onSelectTeacher,
  selectedGroupId,
  onSelectGroup,
  entries,
  academicLoads,
  allTeachers,
  conflicts,
  groups,
  timeSlots,
  onSolveAllConflicts,
  onOpenMassNotification,
  onShowToast,
}) => {
  const { isLight } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('sec129_copiloto_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist conversation history to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('sec129_copiloto_chat_history', JSON.stringify(messages));
    } catch {
      // Ignore quota
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Build dynamic chips based on current active view
  const dynamicChips = React.useMemo(() => {
    switch (activeTab) {
      case 'teacher':
        return [
          { label: '¿Quién tiene más huecos intermedios?', query: '¿Quién tiene más huecos intermedios?' },
          { label: `Ver resumen de horas de ${selectedTeacher || 'docente'}`, query: `Ver resumen de horas de ${selectedTeacher}` },
          { label: 'Redactar circular para docentes', query: 'Redactar circular formal para convocar a la plantilla docente e informar sobre sus horas asignadas y recesos escalonados' },
          { label: '¿Hay docentes con sobrecarga o déficit?', query: '¿Qué profesores tienen sobrecarga o les faltan horas según su contrato?' },
        ];
      case 'conflicts':
        return [
          { label: 'Auditoría QA y diagnóstico operativo', query: 'Ejecutar auditoría proactiva QA de la matriz de horarios, recesos escalonados y salud de componentes' },
          { label: 'Escanear conflictos actuales en grupos de 1er año', query: 'Escanear conflictos actuales en grupos de 1er año' },
          { label: '¿Cómo resolver los empalmes detectados?', query: '¿Cómo resolver los empalmes detectados de forma segura?' },
          { label: 'Analizar solapamientos de docentes', query: 'Analizar solapamientos simultáneos de profesores por módulo' },
        ];
      case 'workload':
        return [
          { label: '¿Faltan horas por asignar en algún departamento?', query: '¿Faltan horas por asignar en algún departamento?' },
          { label: 'Auditar balance de las 840 horas globales', query: 'Auditar balance de las 840 horas globales del ciclo escolar' },
          { label: '¿Qué asignaturas tienen horas pendientes?', query: '¿Qué asignaturas o academias tienen horas sin asignar en la sábana?' },
        ];
      case 'group':
        return [
          { label: `Revisar huecos libres en el grupo ${selectedGroupId}`, query: `Revisar huecos libres y distribución en el grupo ${selectedGroupId}` },
          { label: `Verificar cobertura de materias en ${selectedGroupId}`, query: `Verificar cobertura de materias y recesos en el grupo ${selectedGroupId}` },
        ];
      case 'master':
        return [
          { label: 'Auditoría QA de la matriz completa', query: 'Ejecutar auditoría proactiva QA de la matriz de horarios, recesos escalonados y salud de componentes' },
          { label: 'Analizar módulos críticos del turno', query: 'Analizar módulos críticos y distribución de horas del turno' },
          { label: 'Detectar horas pico de docentes simultáneos', query: 'Detectar horas pico de docentes simultáneos en el plantel' },
        ];
      case 'availability':
        return [
          { label: '¿Qué profesores tienen módulos libres los viernes?', query: '¿Qué profesores tienen módulos libres los viernes?' },
          { label: 'Docentes disponibles para suplencias hoy', query: 'Buscar docentes con horas libres para cubrir una suplencia' },
        ];
      default:
        return [
          { label: '¿Quién tiene más huecos intermedios?', query: '¿Quién tiene más huecos intermedios?' },
          { label: 'Escanear empalmes activos', query: 'Escanear conflictos actuales en grupos de 1er año' },
        ];
    }
  }, [activeTab, selectedTeacher, selectedGroupId]);

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const context = buildCopilotContext({
        activeTab,
        schoolInfo,
        selectedTeacher,
        selectedGroupId,
        entries,
        academicLoads,
        allTeachers,
        conflicts,
        groups,
        timeSlots,
      });

      const response = await sendCopilotChat(updatedMessages, context, selectedModel);

      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-m`,
        role: 'model',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: response.action,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Error invoking Copilot:', err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'model',
        text: 'Ocurrió un error al contactar al motor de IA. Puedes intentar de nuevo o verificar la conexión con el servidor.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute structured action returned by Copilot
  const handleExecuteAction = (action?: CopilotExecutableAction) => {
    if (!action) return;

    switch (action.type) {
      case 'RESOLVE_ALL_CONFLICTS':
        onSolveAllConflicts();
        onShowToast('Resolución de empalmes ejecutada por el Copiloto Operativo', 'success');
        break;

      case 'NAVIGATE_TAB':
        if (action.payload?.tab) {
          onNavigateTab(action.payload.tab);
          onShowToast(`Navegando a la vista: ${action.payload.tab}`, 'info');
        }
        break;

      case 'SELECT_TEACHER':
        if (action.payload?.teacherName) {
          onSelectTeacher(action.payload.teacherName);
          onNavigateTab('teacher');
          onShowToast(`Docente seleccionado: ${action.payload.teacherName}`, 'info');
        }
        break;

      case 'SELECT_GROUP':
        if (action.payload?.groupId) {
          onSelectGroup(action.payload.groupId);
          onNavigateTab('group');
          onShowToast(`Grupo seleccionado: ${action.payload.groupId}`, 'info');
        }
        break;

      case 'OPEN_MASS_NOTIFICATION':
        if (onOpenMassNotification) {
          onOpenMassNotification(action.payload?.subject, action.payload?.messageBody);
          onShowToast('Panel de notificación institucional masiva preparado', 'info');
        }
        break;

      default:
        onShowToast(`Acción solicitada: ${action.description}`, 'info');
        break;
    }

    // Add confirmation notice in conversation
    const confirmMsg: ChatMessage = {
      id: `msg-${Date.now()}-action-ack`,
      role: 'model',
      text: `✓ **Acción ejecutada:** ${action.description}. La matriz horaria y el estado en vivo han sido actualizados.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, confirmMsg]);
  };

  const handleClearHistory = () => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    sessionStorage.removeItem('sec129_copiloto_chat_history');
    onShowToast('Historial del Copiloto reiniciado', 'info');
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-x-2 bottom-2 sm:inset-auto sm:bottom-4 sm:right-4 z-50 flex flex-col shadow-2xl rounded-2xl border transition-all duration-300 overflow-hidden max-h-[85vh] sm:max-h-[80dvh] w-auto sm:w-full ${
        isExpanded
          ? 'sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-[85vh]'
          : 'sm:max-w-md md:max-w-lg lg:w-[440px] h-[min(620px,85vh)]'
      } ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#121214] border-amber-500/25 text-slate-100'
      }`}
      style={{
        boxShadow: isLight
          ? '0 20px 40px -15px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
          : '0 25px 50px -12px rgba(0,0,0,0.85), 0 0 25px rgba(245,158,11,0.1)',
      }}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b shrink-0 ${
          isLight
            ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border-amber-200/60'
            : 'bg-gradient-to-r from-amber-950/40 via-[#18181b] to-amber-950/20 border-amber-500/20'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-amber-500 uppercase flex items-center gap-1.5">
                Copiloto Operativo Escolar
              </h3>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                  isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                Sec. 129
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
              {schoolInfo.name} • {schoolInfo.shift}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Model indicator / selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className={`text-[10px] px-2 py-1 rounded border font-mono cursor-pointer transition-colors ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:border-amber-400'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-amber-500/50'
            }`}
            title="Modelo de Inteligencia Artificial Gemini"
          >
            <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recomendado)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Rápido)</option>
            <option value="gemini-4-argon">Gemini 4 Argon (Razonamiento)</option>
          </select>

          {/* Clear history */}
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Limpiar conversación"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Expand / Minimize */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            title={isExpanded ? 'Reducir tamaño' : 'Maximizar'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/30 transition-colors"
            title="Cerrar copiloto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Context pill banner */}
      <div
        className={`px-3 py-1.5 text-[11px] flex items-center justify-between border-b shrink-0 ${
          isLight
            ? 'bg-slate-50 border-slate-100 text-slate-500'
            : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="truncate">
            Contexto en vivo: <strong className="text-amber-500 capitalize">{activeTab}</strong>
            {activeTab === 'teacher' && selectedTeacher && ` • Docente: ${selectedTeacher}`}
            {activeTab === 'group' && selectedGroupId && ` • Grupo: ${selectedGroupId}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] shrink-0 font-mono">
          <span
            className={`px-1.5 py-0.5 rounded ${
              conflicts.length > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {conflicts.length} empalmes
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
            40 docentes / 840h
          </span>
        </div>
      </div>

      {/* Messages Thread */}
      <div
        className={`flex-1 p-4 overflow-y-auto space-y-3.5 text-xs scroll-smooth ${
          isLight ? 'bg-slate-50/50' : 'bg-zinc-950/40'
        }`}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-7 h-7 rounded-lg bg-amber-600/30 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm relative group transition-all ${
                msg.role === 'user'
                  ? isLight
                    ? 'bg-amber-600 text-white rounded-br-none'
                    : 'bg-amber-600/90 text-white rounded-br-none'
                  : isLight
                  ? 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-none'
                  : 'bg-[#1a1a1e] border border-zinc-800 text-slate-200 rounded-bl-none'
              }`}
            >
              {/* Message content */}
              <div className="leading-relaxed whitespace-pre-wrap break-words">
                {msg.text}
              </div>

              {/* Action Card if suggested by Copilot */}
              {msg.action && (
                <div
                  className={`mt-2.5 p-2.5 rounded-xl border flex flex-col gap-2 ${
                    isLight
                      ? 'bg-amber-50/80 border-amber-300/80 text-amber-950'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[11px] text-amber-400">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Acción Operativa Sugerida</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-normal">
                    {msg.action.description}
                  </p>
                  <button
                    onClick={() => handleExecuteAction(msg.action)}
                    className="mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] shadow transition-transform active:scale-95 cursor-pointer"
                  >
                    <span>Ejecutar cambio en matriz</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Footer info (timestamp & copy) */}
              <div
                className={`flex items-center justify-between gap-3 mt-1.5 text-[10px] ${
                  msg.role === 'user' ? 'text-amber-200/80' : 'text-slate-400'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.role === 'model' && (
                  <button
                    onClick={() => handleCopyText(msg.id, msg.text)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-amber-400"
                    title="Copiar texto"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-slate-300 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-amber-600/30 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div
              className={`rounded-2xl px-4 py-3 rounded-bl-none border flex items-center gap-2 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#1a1a1e] border-zinc-800'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-150" />
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-300" />
              <span className="text-[11px] text-slate-400 ml-1">
                Consultando plantilla y reglas de horario...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Suggestion Chips according to current View */}
      <div
        className={`px-3 py-2 border-t flex flex-wrap gap-1.5 ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-zinc-900/70 border-zinc-800/80'
        }`}
      >
        <span className="text-[10px] text-amber-500/90 font-medium flex items-center gap-1 w-full mb-0.5">
          <Sparkles className="w-3 h-3" /> Sugerencias rápidas para esta vista:
        </span>
        {dynamicChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.query)}
            disabled={isLoading}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left truncate max-w-full font-medium ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/50'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:border-amber-500/60 hover:text-amber-300 hover:bg-amber-950/20'
            }`}
          >
            💬 {chip.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div
        className={`p-3 border-t flex items-center gap-2 shrink-0 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#141417] border-zinc-800'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Consulta sobre horas contrato, huecos, empalmes..."
          disabled={isLoading}
          className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              : 'bg-zinc-900/90 border-zinc-700 text-slate-100 placeholder:text-zinc-500'
          }`}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputPrompt.trim()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-95 shadow-md shadow-amber-500/20"
          title="Enviar consulta al copiloto"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
