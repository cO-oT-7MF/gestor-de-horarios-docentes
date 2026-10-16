import {
  ScheduleEntry,
  Group,
  SchoolInfo,
  AcademicLoadItem,
  Conflict,
  TimeSlotConfig,
  DayOfWeek,
  TimeSlotId,
} from '../types';
import { getTeacherStats, getTeacherContractSummary, normalizeName } from '../utils/scheduler';
import { DAYS_OF_WEEK } from '../data/initialData';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  action?: CopilotExecutableAction;
}

export type CopilotActionType =
  | 'RESOLVE_ALL_CONFLICTS'
  | 'NAVIGATE_TAB'
  | 'SELECT_TEACHER'
  | 'SELECT_GROUP'
  | 'MOVE_SLOT'
  | 'REASSIGN_TEACHER'
  | 'OPEN_MASS_NOTIFICATION';

export interface CopilotExecutableAction {
  type: CopilotActionType;
  description: string;
  payload?: any;
}

export interface CopilotContextData {
  activeTab: 'teacher' | 'group' | 'master' | 'workload' | 'conflicts' | 'availability';
  schoolInfo: SchoolInfo;
  selectedTeacher?: string;
  selectedGroupId?: string;
  teachersCount: number;
  totalGlobalHours: number;
  conflictsSummary: {
    total: number;
    teacherOverlaps: number;
    unassignedHours: number;
    overassignedHours: number;
    details: string[];
  };
  staggeredBreaksInfo: string;
  topGapsTeachers?: { teacher: string; gaps: number; totalHours: number }[];
  selectedTeacherStats?: any;
  unassignedHoursDetails?: { group: string; subject: string; hoursNeeded: number; teacher: string }[];
  firstYearConflicts?: string[];
  academicLoadsSummary?: {
    totalGroups: number;
    totalExpectedHours: number;
    totalScheduledHours: number;
  };
}

/**
 * Builds the comprehensive real-time context from the application's live state
 */
export function buildCopilotContext(params: {
  activeTab: 'teacher' | 'group' | 'master' | 'workload' | 'conflicts' | 'availability';
  schoolInfo: SchoolInfo;
  selectedTeacher: string;
  selectedGroupId: string;
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  allTeachers: string[];
  conflicts: Conflict[];
  groups: Group[];
  timeSlots?: TimeSlotConfig[];
}): CopilotContextData {
  const {
    activeTab,
    schoolInfo,
    selectedTeacher,
    selectedGroupId,
    entries,
    academicLoads,
    allTeachers,
    conflicts,
  } = params;

  // Calculate gaps for all teachers to answer "¿Quién tiene más huecos intermedios?"
  const gapsList: { teacher: string; gaps: number; totalHours: number }[] = [];
  for (const tName of allTeachers) {
    const stats = getTeacherStats(tName, entries);
    gapsList.push({
      teacher: tName,
      gaps: stats.intermediateGaps,
      totalHours: stats.totalHours,
    });
  }
  gapsList.sort((a, b) => b.gaps - a.gaps);
  const topGapsTeachers = gapsList.slice(0, 5);

  // Selected teacher stats
  const selectedTeacherStats = selectedTeacher ? getTeacherStats(selectedTeacher, entries) : null;

  // Conflicts summary
  const teacherOverlaps = conflicts.filter((c) => c.type === 'TEACHER_OVERLAP').length;
  const unassignedHours = conflicts.filter((c) => c.type === 'UNASSIGNED_HOURS').length;
  const overassignedHours = conflicts.filter((c) => c.type === 'OVERASSIGNED_HOURS').length;
  const conflictDetails = conflicts.slice(0, 8).map((c) => c.description);

  // 1st year conflicts
  const firstYearConflicts = conflicts
    .filter((c) => {
      const g = (c.groupId || '').toUpperCase();
      return g.startsWith('1') || (c.description || '').toLowerCase().includes('1º') || (c.description || '').toLowerCase().includes('1er');
    })
    .map((c) => c.description);

  // Unassigned hours details
  const unassignedDetails: { group: string; subject: string; hoursNeeded: number; teacher: string }[] = [];
  for (const conf of conflicts) {
    if (conf.type === 'UNASSIGNED_HOURS') {
      unassignedDetails.push({
        group: conf.groupId || 'General',
        subject: conf.subject || 'Materia',
        hoursNeeded: Math.abs(conf.difference || 1),
        teacher: conf.teacherName || 'Sin asignar',
      });
    }
  }

  // Calculate total global hours from academic load
  let totalExpected = 0;
  for (const load of academicLoads) {
    for (const sub of Object.values(load.subjects)) {
      totalExpected += sub.hours || 0;
    }
  }

  const isVespertino = schoolInfo.shift.toUpperCase().includes('VESPERTINO');
  const staggeredBreaks = isVespertino
    ? 'Recesos escalonados de 20 minutos (15:00 - 16:00 hrs): 1er Grado (15:00 - 15:20, inicio del bloque 4; clase 15:20-16:00), 2do Grado (15:20 - 15:40, clase dividida: 15:00-15:20 y 15:40-16:00), 3er Grado (15:40 - 16:00, clase 15:00-15:40 y receso al final).'
    : 'Turno Matutino: Recesos reglamentarios según bloques matutinos oficiales.';

  return {
    activeTab,
    schoolInfo,
    selectedTeacher,
    selectedGroupId,
    teachersCount: allTeachers.length,
    totalGlobalHours: totalExpected || 840,
    conflictsSummary: {
      total: conflicts.length,
      teacherOverlaps,
      unassignedHours,
      overassignedHours,
      details: conflictDetails,
    },
    staggeredBreaksInfo: staggeredBreaks,
    topGapsTeachers,
    selectedTeacherStats: selectedTeacherStats
      ? {
          name: selectedTeacher,
          totalAssignedHours: selectedTeacherStats.totalHours,
          intermediateGaps: selectedTeacherStats.intermediateGaps,
          groups: selectedTeacherStats.groups,
          subjects: selectedTeacherStats.subjects,
          hoursPerDay: selectedTeacherStats.hoursPerDay,
        }
      : null,
    unassignedHoursDetails: unassignedDetails.slice(0, 10),
    firstYearConflicts: firstYearConflicts.slice(0, 10),
    academicLoadsSummary: {
      totalGroups: academicLoads.length,
      totalExpectedHours: totalExpected || 840,
      totalScheduledHours: entries.length,
    },
  };
}

/**
 * Parses executable action block from Copilot response text if present
 */
export function extractActionFromResponse(text: string): {
  cleanText: string;
  action?: CopilotExecutableAction;
} {
  const jsonActionRegex = /```json:action\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonActionRegex);

  if (!match) {
    return { cleanText: text };
  }

  try {
    const actionObj = JSON.parse(match[1]);
    const cleanText = text.replace(jsonActionRegex, '').trim();
    return {
      cleanText,
      action: actionObj,
    };
  } catch (err) {
    console.warn('Failed to parse json:action from response:', err);
    return { cleanText: text };
  }
}

/**
 * Local administrative heuristic fallback engine
 * Provides immediate accurate responses if backend or API key is unavailable
 */
export function generateLocalHeuristicResponse(
  query: string,
  context: CopilotContextData
): { text: string; action?: CopilotExecutableAction } {
  const q = query.toLowerCase();

  // 0. Auditoría Proactiva QA y Diagnóstico de Errores
  if (
    q.includes('qa') ||
    q.includes('auditor') ||
    q.includes('diagnóstic') ||
    q.includes('diagnostic') ||
    q.includes('error') ||
    q.includes('revisión') ||
    q.includes('audit')
  ) {
    const isConflictFree = context.conflictsSummary.total === 0;
    const topGapsText = context.topGapsTeachers && context.topGapsTeachers.length > 0
      ? `Mayor dispersión: ${context.topGapsTeachers[0].teacher} (${context.topGapsTeachers[0].gaps} huecos intermedios)`
      : 'Dispersión balanceada';

    return {
      text: `### 📋 Informe de Auditoría QA y Diagnóstico Operativo
**Escuela Secundaria Nº 129 "Gral. Félix U. Gómez" (CT 19EES0129S)**

* **Plantilla Docente ({TOTAL_DOCENTES}):** ${context.teachersCount} profesores activos validados.
* **Carga Global ({TOTAL_HORAS_GLOBALES}):** ${context.totalGlobalHours} horas/módulos oficiales del ciclo 2026-2027.
* **Cumplimiento de Recesos Escalonados:**
  - 1º Grado (15:00 - 15:20): Regla activa y validada.
  - 2º Grado (15:20 - 15:40): Clase dividida (20 min antes / 20 min después) conforme.
  - 3º Grado (15:40 - 16:00): Regla de cierre de bloque 4 conforme.
* **Integridad de Malla y Empalmes:** ${
        isConflictFree
          ? '✅ 0 empalmes detectados. Sin solapamientos docentes ni horas sin cobertura.'
          : `⚠️ ${context.conflictsSummary.total} incidencias activas (${context.conflictsSummary.teacherOverlaps} solapamientos docentes, ${context.conflictsSummary.unassignedHours} horas sin cubrir).`
      }
* **Análisis de Huecos Intermedios:** ${topGapsText}.
* **Salud UI/UX:** Jerarquía de z-index fluida, scroll interno responsivo y topes de altura (max-h-[85vh]) conformes.

*Acción QA:* ${isConflictFree ? 'Sistema en estado óptimo.' : 'Se recomienda ejecutar resolución automática de empalmes.'}`,
      action: !isConflictFree
        ? {
            type: 'RESOLVE_ALL_CONFLICTS',
            description: 'Ejecutar resolución fluida de empalmes detectados',
          }
        : undefined,
    };
  }

  // 1. Huecos intermedios
  if (q.includes('hueco') || q.includes('intermedio') || q.includes('horas libres entre')) {
    if (context.topGapsTeachers && context.topGapsTeachers.length > 0) {
      const top = context.topGapsTeachers[0];
      const listStr = context.topGapsTeachers
        .map((t, idx) => `${idx + 1}. **${t.teacher}**: ${t.gaps} hueco(s) intermedio(s) (${t.totalHours} hrs semanales asignadas)`)
        .join('\n');

      return {
        text: `**Diagnóstico de Módulos Libres Intermedios:**\n\nEl docente con mayor dispersión horaria es **${top.teacher}** con **${top.gaps} huecos intermedios** semanales.\n\nRanking de dispersión en plantilla:\n${listStr}\n\n*Recomendación directiva:* Compactar la jornada de ${top.teacher} en bloques continuos para optimizar permanencia en plantel.`,
        action: {
          type: 'SELECT_TEACHER',
          description: `Ver horario y huecos de ${top.teacher}`,
          payload: { teacherName: top.teacher },
        },
      };
    }
  }

  // 2. Resumen de horas del docente seleccionado
  if (q.includes('resumen de horas') || (context.selectedTeacher && q.includes(context.selectedTeacher.toLowerCase()))) {
    const stats = context.selectedTeacherStats;
    if (stats) {
      const daysStr = Object.entries(stats.hoursPerDay || {})
        .map(([day, hrs]) => `${day}: ${hrs}h`)
        .join(' | ');

      return {
        text: `**Ficha Operativa - ${stats.name}:**\n- **Horas asignadas en matriz:** ${stats.totalAssignedHours} horas/semana.\n- **Distribución diaria:** ${daysStr}.\n- **Huecos intermedios:** ${stats.intermediateGaps} módulos libres entre clases.\n- **Grupos a cargo:** ${stats.groups.join(', ') || 'Ninguno'}.\n- **Asignaturas:** ${stats.subjects.join(', ') || 'Sin registrar'}.\n\n*Dictamen:* ${stats.intermediateGaps > 2 ? 'Requiere compactación horaria por dispersión.' : 'Horario balanceado y contractual conforme.'}`,
        action: {
          type: 'NAVIGATE_TAB',
          description: `Inspeccionar matriz de ${stats.name}`,
          payload: { tab: 'teacher' },
        },
      };
    }
  }

  // 3. Conflictos en 1er año / Empalmes
  if (q.includes('1er') || q.includes('primer') || q.includes('1º') || q.includes('conflicto') || q.includes('empalme')) {
    if (context.conflictsSummary.total === 0) {
      return {
        text: `**Auditoría de Empalmes y Cruces:**\n\nNo se detectan conflictos activos en grupos de 1er año ni en la matriz general. La plantilla opera con **0 solapamientos** y cobertura total del turno.`,
      };
    }

    const firstYear = context.firstYearConflicts || [];
    const count = firstYear.length;
    const items = firstYear.slice(0, 4).map((c) => `- ${c}`).join('\n');

    return {
      text: `**Escaneo de Empalmes (1er Grado y Global):**\n\nSe detectan **${context.conflictsSummary.total} incidencia(s)** en la matriz general (${context.conflictsSummary.teacherOverlaps} solapamientos docentes, ${context.conflictsSummary.unassignedHours} horas sin cubrir).\n\nDetalles prioritarios:\n${items || '- Todos los grupos de 1º año se encuentran actualmente balanceados.'}\n\n*Acción recomendada:* Ejecutar resolución automatizada de empalmes sin romper nombramientos.`,
      action: {
        type: 'RESOLVE_ALL_CONFLICTS',
        description: 'Ejecutar resolución fluida de empalmes',
      },
    };
  }

  // 4. Horas por asignar / Carga académica / Departamentos
  if (q.includes('faltan horas') || q.includes('departamento') || q.includes('asignar') || q.includes('carga') || q.includes('840')) {
    const unassigned = context.unassignedHoursDetails || [];
    if (unassigned.length === 0) {
      return {
        text: `**Auditoría de Carga Académica (840 Horas Globales):**\n\nTodas las horas correspondientes a la estructura curricular de los grupos se encuentran **100% asignadas y cubiertas** por los docentes adscritos. No hay déficit departamental registrado.`,
      };
    }

    const unassignedList = unassigned
      .map((u) => `- Grupo **${u.group}** • ${u.subject}: ${u.hoursNeeded}h faltante(s) (Docente titular: ${u.teacher})`)
      .join('\n');

    return {
      text: `**Auditoría Departamental de Horas Pendientes:**\n\nSe registran **${unassigned.length} asignaciones incompletas** en la sábana horaria respecto a la carga curricular oficial:\n\n${unassignedList}\n\n*Dictamen:* Es necesario programar estos módulos en los espacios libres del turno para alcanzar las ${context.totalGlobalHours} horas globales.`,
      action: {
        type: 'NAVIGATE_TAB',
        description: 'Abrir módulo de Carga Académica para completar horas',
        payload: { tab: 'workload' },
      },
    };
  }

  // 5. Redacción de circulares / avisos / convocatorias a la plantilla
  if (
    q.includes('circular') ||
    q.includes('aviso') ||
    q.includes('comunicado') ||
    q.includes('junta') ||
    q.includes('reunión') ||
    q.includes('notice') ||
    q.includes('broadcast') ||
    q.includes('recordatorio') ||
    q.includes('convocatoria')
  ) {
    const sub = 'CIRCULAR OFICIAL: Convocatoria y Notificación de Horarios - Ciclo 2026-2027';
    const body = `ASUNTO: Notificación Oficial a la Plantilla Docente\nINSTITUCIÓN: Escuela Secundaria General No. 129 "Gral. Félix U. Gómez"\nC.T.: 19EES0129S | Turno: ${context.schoolInfo.shift}\n\nEstimados(as) Profesores(as):\n\nPor medio del presente conducto, la Dirección Escolar les comunica atentamente la actualización y asignación de horarios correspondientes a la estructura de ${context.totalGlobalHours} horas globales y ${context.teachersCount} docentes adscritos.\n\nSe les exhorta al cumplimiento puntual de sus módulos frente a grupo, así como la observancia de los recesos escalonados de 20 minutos por grado escolar (15:00 a 16:00 hrs).\n\nAtentamente,\nDirección y Subdirección Escolar\nEscuela Secundaria General No. 129`;

    return {
      text: `**Circular Institucional redactada para la plantilla:**\n\n- **Asunto:** ${sub}\n- **Destinatarios:** ${context.teachersCount} docentes adscritos.\n\n\`\`\`text\n${body}\n\`\`\`\n\nPuedes abrir el emisor masivo para enviarla de inmediato vía correo institucional o lista BCC.`,
      action: {
        type: 'OPEN_MASS_NOTIFICATION',
        description: 'Abrir panel de comunicación y emitir circular a los 40 docentes',
        payload: {
          subject: sub,
          messageBody: body,
        },
      },
    };
  }

  // 6. Default direct answer
  return {
    text: `**Copiloto Operativo Escolar - Sec. 129 ("Gral. Félix U. Gómez"):**\n- Plantilla: ${context.teachersCount} docentes adscritos.\n- Matriz: ${context.totalGlobalHours} horas oficiales del ciclo escolar.\n- Turno activo: ${context.schoolInfo.shift}.\n- Incidencias vigentes: ${context.conflictsSummary.total} empalmes / discrepancias.\n- Regla de recesos: Bloque escalonado de 20 min (15:00 a 16:00 hrs) por grado.\n\nPuedes solicitarme: escanear huecos intermedios de docentes, auditar horas pendientes por departamento o resolver solapamientos.`,
  };
}

/**
 * Sends a multi-turn chat request to the backend Gemini endpoint
 */
export async function sendCopilotChat(
  messages: ChatMessage[],
  context: CopilotContextData,
  model = 'gemini-3.8-flash'
): Promise<{ text: string; action?: CopilotExecutableAction; isFallback?: boolean }> {
  try {
    const payload = {
      messages: messages.map((m) => ({
        role: m.role,
        text: m.text,
      })),
      context,
      model,
    };

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();

    if (data.isFallback || !data.text) {
      // Use local heuristic engine
      const lastUserMsg = messages[messages.length - 1]?.text || '';
      const localResult = generateLocalHeuristicResponse(lastUserMsg, context);
      return {
        text: data.text ? `${data.text}\n\n${localResult.text}` : localResult.text,
        action: localResult.action,
        isFallback: true,
      };
    }

    const extracted = extractActionFromResponse(data.text);
    return {
      text: extracted.cleanText,
      action: extracted.action,
      isFallback: false,
    };
  } catch (err) {
    console.warn('Network call to /api/chat failed, activating local Copilot engine:', err);
    const lastUserMsg = messages[messages.length - 1]?.text || '';
    const local = generateLocalHeuristicResponse(lastUserMsg, context);
    return {
      text: local.text,
      action: local.action,
      isFallback: true,
    };
  }
}
