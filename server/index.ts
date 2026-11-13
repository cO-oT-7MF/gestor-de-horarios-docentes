import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.ts';
import scheduleRoutes from './routes/schedule.routes.ts';
import { securityHeaders } from './middleware/securityHeaders.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));

// Rutas de Autenticación (Admin ADMIN_PASSWORD + Docente RFC, TTL 8h) y Sincronización
app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Chatbot API Endpoint (Copiloto Escolar)
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

    const systemInstruction = `Role: You are the "School Operations Master Copilot", expert AI architect for secondary education institutions.
Live Context:
- Active Teachers: ${context?.teachersCount || 40}
- Global Workload: ${context?.totalGlobalHours || 840}
- Active School Profile: ${context?.schoolInfo?.name || 'Escuela Secundaria'} | ${context?.schoolInfo?.workCenterKey || 'CCT'} | ${context?.schoolInfo?.shift || 'TURNO'} | ${context?.schoolInfo?.schoolYear || '2027-2028'}
- Active Tab: ${context?.activeTab || 'teacher'}
- Conflicts Summary: ${JSON.stringify(context?.conflictsSummary || { total: 0 })}
Always respond in the language of the user prompt with professional administrative terminology.`;

    const contents = messages.map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text || m.content || '' }],
    }));

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction, temperature: 0.2 },
      });
      responseText = response.text || '';
    } catch {
      return res.status(200).json({ isFallback: true });
    }

    return res.status(200).json({ text: responseText });
  } catch (err: any) {
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
    cycle: '2027-2028',
    auth: 'hmac-8h',
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
    if (url.startsWith('/api')) return next();
    try {
      let template = fs.readFileSync(path.resolve(rootDir, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  app.use(express.static(path.resolve(rootDir, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(rootDir, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express Server listening on http://0.0.0.0:${PORT}`);
});
