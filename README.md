# Gestor de Horarios y Carga Académica (Multi-Plantel y Multi-Plataforma)

Sistema integral para la gestión, generación heurística y consulta de horarios escolares (PWA + Tauri v2 / Capacitor Mobile + API Express).

## Arquitectura del Sistema

```text
gestor-horarios-academicos/
├── mobile/                              # Configuración nativa Android / iOS (Capacitor / Tauri)
├── server/                              # API Express y capa de autorización
│   ├── middleware/
│   │   └── authGuard.ts                 # Validación de tokens firmados HMAC-SHA256 (TTL 8h)
│   ├── routes/
│   │   ├── auth.routes.ts               # Login Admin (ADMIN_PASSWORD) y acceso Docente (RFC)
│   │   └── schedule.routes.ts           # Sincronización de plantillas, horarios y mutaciones protegidas
│   └── index.ts                         # Servidor Express con variables de entorno seguras
├── src/
│   ├── core/
│   │   ├── models/                      # Modelos estrictos (Institución, Docente, Horario)
│   │   ├── scheduler/                   # Web Worker heurístico, detector de empalmes y guardias
│   │   └── parsers/                     # Parseador unificado CSV / XLSX con autodetección
│   ├── data/presets/                    # Mapa curricular SEP 2027 (35 hrs) y presets por CCT
│   ├── features/                        # Auth dual, KPIs, Sábana 60 FPS, Directorio y Guardias 1-Clic
│   ├── storage/                         # Cliente IndexedDB offline-first y cola de sincronización
│   ├── App.tsx                          # Enrutador protegido por rol, Bottom Tab Bar y White-Label CSS
│   └── main.tsx                         # Punto de montaje PWA y registro de Service Worker
├── .env.example                         # ADMIN_PASSWORD, ADMIN_SESSION_SECRET, PORT (sin prefijos VITE_)
└── package.json
```

## Variables de Entorno

Copia `.env.example` a `.env` y define las credenciales de servidor (nunca expuestas con prefijo `VITE_`):

- `PORT`: Puerto del servidor Express (por defecto `3000`).
- `ADMIN_PASSWORD`: Contraseña del Portal Administrativo.
- `ADMIN_SESSION_SECRET`: Secreto HMAC para tokens con expiración estricta de 8 horas.
- `GEMINI_API_KEY`: Opcional para el Copiloto Escolar IA.

## Comandos

```bash
npm install
npm run lint     # Verificación estricta de TypeScript (tsc --noEmit)
npm run build    # Compilación de producción en dist/ (base: './')
npm run dev      # Servidor Express + Vite en desarrollo
```
