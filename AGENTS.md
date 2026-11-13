# Reglas del Espacio de Trabajo - Gestor de Horarios Docentes Académicos

## Contexto de la Arquitectura
- **Frontend:** React, TypeScript, Vite (`src/`, `index.html`, `vite.config.ts`).
- **Empaquetado Nativo / Móvil:** Compatible con Tauri v2 (`src-tauri/`) y/o Capacitor para Android Studio.
- **Identificador de Paquete Android:** `com.costudio.gestorhorarios` (PROHIBIDO usar guiones medios `-` en `applicationId` o `namespace` de Kotlin/Java).

## Invariantes y Reglas Estrictas de Corrección
1. **Rutas Relativas en Vite:** `vite.config.ts` debe tener `base: './'` y `server: { host: true, port: 5173, strictPort: true }` para que el `WebView` de Android cargue correctamente los assets locales.
2. **Validación TypeScript y Build:** Antes de tocar la carpeta de Android, `npm install` y `npm run build` deben terminar con código de salida `0`. Corrige cualquier importación rota, componente faltante o tipo implícito `any`.
3. **Configuración de Gradle (Android Studio):**
   - `compileSdk = 35`
   - `minSdk = 24`
   - `targetSdk = 35`
   - Java/JVM Target: `JavaVersion.VERSION_17`
   - En `gradle.properties`: `org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8`, `android.useAndroidX=true`, `android.nonTransitiveRClass=true`.
4. **Bucle de Verificación Obligatorio:** Después de modificar cualquier archivo, ejecuta los comandos en terminal para comprobar que no existan errores antes de dar la tarea por finalizada.
