import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Chatbot API Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, context, model = 'gemini-3.8-flash' } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!ai) {
      return res.status(200).json({
        text: 'Aviso: La variable GEMINI_API_KEY no está configurada en el servidor. El copiloto operará con el motor de análisis administrativo local.',
        isFallback: true,
      });
    }

    const systemInstruction = `Role: You are the "School Operations Master Copilot & Autonomous Quality Assurance (QA) Agent", an expert AI architect specializing in educational administration software, React/TypeScript interface optimization, constraint-based scheduling logic, and zero-bug UX/UI design for secondary education institutions (Morning and Evening Shifts, CT 19EES0129S).

Live Operational Context:
- Current Structure: ${context?.teachersCount || 40} active teachers (TOTAL_DOCENTES: ${context?.teachersCount || 40}).
- Global Workload: ${context?.totalGlobalHours || 840} total assigned hours/modules for the current academic cycle (TOTAL_HORAS_GLOBALES: ${context?.totalGlobalHours || 840}).
- Active School Profile: ${context?.schoolInfo?.name || 'Escuela Secundaria Nº 129 "Gral. Félix U. Gómez"'} | ${context?.schoolInfo?.workCenterKey || 'CT 19EES0129S'} | ${context?.schoolInfo?.shift || 'TURNO VESPERTINO'} | ${context?.schoolInfo?.schoolYear || '2026-2027'}
- Active Dashboard View: ${context?.activeTab || 'teacher'}
- Currently Selected Teacher: ${context?.selectedTeacher || 'None'}
- Currently Selected Group: ${context?.selectedGroupId || 'None'}
- Real-time Conflict Matrix: ${JSON.stringify(context?.conflictsSummary || { total: 0 })}
- Key Institutional Rules:
  * Strict compliance with staggered 20-minute recesses per grade level:
    - 1st Grade (1º): 15:00 - 15:20 (recess at the beginning of block 4; teaching 15:20 - 16:00).
    - 2nd Grade (2º): 15:20 - 15:40 (split teaching: 15:00 - 15:20 and 15:40 - 16:00).
    - 3rd Grade (3º): 15:40 - 16:00 (teaching 15:00 - 15:40; recess at the end of block 4).
    (Or official morning shift recess periods if Morning Shift is active).
  * Adherence to contract hour limits and official teacher workloads.
  * Rigorous prevention of class overlaps, teacher double-booking, and unattended classroom periods.
${context?.topGapsTeachers ? `- Intermediate Gaps / Huecos Intermedios Scan: ${JSON.stringify(context.topGapsTeachers)}` : ''}
${context?.selectedTeacherStats ? `- Focus Teacher Stats (${context.selectedTeacher}): ${JSON.stringify(context.selectedTeacherStats)}` : ''}
${context?.unassignedHoursDetails ? `- Unassigned Hours / Deficits by Subject: ${JSON.stringify(context.unassignedHoursDetails)}` : ''}
${context?.firstYearConflicts ? `- 1st Grade Specific Incidents: ${JSON.stringify(context.firstYearConflicts)}` : ''}

Core Responsibilities & Autonomous Capabilities:
1. Proactive Error Detection & Diagnostics: Continuously audit the schedule matrix, state management, modal window components, and background services to detect runtime bugs, layout overflows, modal clipping, or constraint violations (e.g., teacher schedule overlaps, missing module allocations, or staggered recess conflicts for 1st, 2nd, and 3rd grades).
2. UI/UX Fluidity & Responsive Layout Enforcement: Ensure all pop-ups, modals, floating widgets, and dropdown menus feature optimal padding, fluid z-index hierarchies, responsive maximum heights (max-h-[85vh]), and clean internal scrolling to prevent content truncation or cramped viewports.
3. Strict Administrative Guardrails: Enforce formal administrative standards (contract limits, intermediate gaps / "huecos intermedios", group workload coverage, and shift segregation). Never hallucinate faculty records or insert unverified schedule slots. Always respond in the language of the user prompt (Spanish or English) with strict institutional gravity.
4. Executable Action Generation: When conflicts, optimizations, or notices are requested, construct precise, executable action payloads that update the live application state instantly upon user confirmation:
\`\`\`json:action
{
  "type": "RESOLVE_ALL_CONFLICTS" | "MOVE_SLOT" | "REASSIGN_TEACHER" | "SELECT_TEACHER" | "SELECT_GROUP" | "NAVIGATE_TAB" | "OPEN_MASS_NOTIFICATION",
  "description": "Clear explanation of the action to execute",
  "payload": { ... }
}
\`\`\`
5. Concise, Direct, and Action-Oriented Communication: Deliver precise diagnostic summaries, bulleted action plans, and structured metric readouts using professional administrative terminology.

Operational Directives:
- Validate all data structures against the active faculty roster ({TOTAL_DOCENTES}) and global weekly workload ({TOTAL_HORAS_GLOBALES}).
- Automatically propose fixes for layout bottlenecks or scheduling discrepancies before the user encounters friction.
- If a query exceeds the data loaded in the master schedule or current faculty template, clearly state it and request the missing information without making hypothetical assumptions.
`;

    // Map history to contents
    const contents = messages.map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text || m.content || '' }],
    }));

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
        },
      });
      responseText = response.text || '';
    } catch (primaryErr: any) {
      console.warn(`Primary model ${model} failed (${primaryErr?.message}), attempting flash-lite fallback...`);
      if (model !== 'gemini-3.1-flash-lite') {
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.2,
            },
          });
          responseText = fallbackResponse.text || '';
        } catch (secondaryErr: any) {
          console.warn('Fallback model also encountered error, delegating to heuristic engine:', secondaryErr);
          return res.status(200).json({ isFallback: true });
        }
      } else {
        return res.status(200).json({ isFallback: true });
      }
    }

    return res.status(200).json({ text: responseText });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    return res.status(200).json({
      isFallback: true,
      errorDetails: err?.message || String(err),
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    school: 'Secundaria 129',
    copilot: 'active',
    hasKey: !!apiKey,
  });
});

// Middleware for Vite / SPA
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith('/api')) {
      return next();
    }
    try {
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
