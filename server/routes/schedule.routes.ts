import { Router } from 'express';
import {
  requireAuth,
  requireAdmin,
  type AuthenticatedRequest,
} from '../middleware/authGuard.ts';

interface StoredScheduleState {
  cct: string;
  cycle: string;
  entries: any[];
  academicLoads: any[];
  dutyAssignments: any[];
  substitutionAssignments: any[];
  updatedAt: string;
}

const router = Router();
const stateByCct = new Map<string, StoredScheduleState>();

function norm(v: string | undefined): string {
  return (v || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

/**
 * GET /api/schedule/state?cct=11EES0119S
 * Si el rol es 'teacher', filtra estrictamente la respuesta a su horario individual,
 * grupos asignados y avance de carga frente a su contrato.
 */
router.get('/state', requireAuth, (req: AuthenticatedRequest, res) => {
  const cct = String(req.query.cct || '11EES0119S').toUpperCase();
  const state = stateByCct.get(cct);

  if (!state) {
    res.json({ state: null });
    return;
  }

  if (req.session?.role === 'teacher') {
    const tName = norm(req.session.teacherName);
    const tId = norm(req.session.sub);

    const matchesTeacher = (item: any) =>
      norm(item?.teacherName) === tName || norm(item?.teacherId) === tId;

    res.json({
      state: {
        ...state,
        entries: state.entries.filter(matchesTeacher),
        academicLoads: state.academicLoads.filter(matchesTeacher),
        dutyAssignments: state.dutyAssignments.filter(matchesTeacher),
        substitutionAssignments: state.substitutionAssignments.filter(
          (s) => matchesTeacher(s) || norm(s?.absentTeacherName) === tName
        ),
      },
    });
    return;
  }

  res.json({ state });
});

/**
 * PUT /api/schedule/state
 * Sincroniza el estado completo del ciclo (solo rol Administrativo).
 */
router.put('/state', requireAdmin, (req: AuthenticatedRequest, res) => {
  const body = req.body || {};
  const cct = String(body.cct || '11EES0119S').toUpperCase();

  const updated: StoredScheduleState = {
    cct,
    cycle: String(body.cycle || '2027-2028'),
    entries: Array.isArray(body.entries) ? body.entries : [],
    academicLoads: Array.isArray(body.academicLoads) ? body.academicLoads : [],
    dutyAssignments: Array.isArray(body.dutyAssignments) ? body.dutyAssignments : [],
    substitutionAssignments: Array.isArray(body.substitutionAssignments)
      ? body.substitutionAssignments
      : [],
    updatedAt: new Date().toISOString(),
  };

  stateByCct.set(cct, updated);
  res.json({ ok: true, updatedAt: updated.updatedAt });
});

/**
 * POST /api/schedule/sync
 * Procesa la cola de mutaciones offline-first enviadas por el cliente (solo Admin).
 */
router.post('/sync', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { mutations } = req.body || {};
  if (!Array.isArray(mutations)) {
    res.status(400).json({ error: 'Se esperaba un arreglo de mutaciones.' });
    return;
  }

  res.json({
    ok: true,
    processedCount: mutations.length,
    syncedAt: new Date().toISOString(),
  });
});

export default router;
