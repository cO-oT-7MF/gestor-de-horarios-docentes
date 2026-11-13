---
name: build-android
description: Audita todas las carpetas del proyecto, corrige errores de React/TypeScript/Vite y genera el proyecto completo de Android Studio compilando sin errores.
---

# Flujo Autónomo: Auditoría de Carpetas y Creación de Proyecto Android Studio

Sigue estrictamente este ciclo **Explorar → Planificar → Ejecutar → Verificar** usando la terminal integrada de Antigravity:

## Fase 1: Auditoría y Corrección de Carpetas (Frontend y Configuración)
1. Ejecuta en la terminal `powershell -ExecutionPolicy Bypass -File ./scripts/audit-android.ps1` para identificar archivos faltantes, archivos de 0 bytes, problemas de dependencias o errores de compilación en `src/`.
2. Inspecciona recursivamente la carpeta `src/`:
   - Corrige todas las rutas de importación rotas (`import ... from ...`), componentes no encontrados o errores de tipado en TypeScript.
   - Asegúrate de que `index.html` apunte correctamente a `/src/main.tsx` o `/src/index.tsx`.
   - Ajusta `vite.config.ts` para incluir `base: './'` y `build: { outDir: 'dist', emptyOutDir: true }`.
3. Ejecuta `npm run build` en la terminal y **no avances a la Fase 2** hasta que la carpeta `dist/` se genere con `0 errors`.

## Fase 2: Generación y Configuración de Android Studio (Cero Errores)
1. **Detección o Inicialización de Plataforma Android:**
   - **Si existe `src-tauri/`:**
     - Revisa `src-tauri/tauri.conf.json` y cambia `identifier` a `"com.costudio.gestorhorarios"` (elimina cualquier guion medio `-`).
     - Revisa `src-tauri/Cargo.toml` para que el nombre de la librería sea `gestor_horarios_lib`.
     - Si no existe `src-tauri/gen/android`, ejecuta `npx tauri android init`.
   - **Si NO existe `src-tauri/` (Proyecto Web React/Vite puro):**
     - Instala Capacitor para generar el proyecto nativo de Android Studio limpio:
       `npm install @capacitor/core @capacitor/cli @capacitor/android`
     - Inicializa la configuración con `npx cap init "Gestor de Horarios" "com.costudio.gestorhorarios" --web-dir dist`
     - Agrega el proyecto de Android Studio con `npx cap add android` y sincroniza con `npx cap sync android`.

2. **Ajuste de Archivos Nativos de Android Studio:**
   - Verifica y corrige `build.gradle` / `build.gradle.kts` (en `android/` o `src-tauri/gen/android/`):
     - Asegura `namespace = "com.costudio.gestorhorarios"`, `compileSdk = 35`, `minSdk = 24`, `targetSdk = 35`.
   - Verifica `gradle.properties`:
     - Añade `org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8` y `android.useAndroidX=true`.
   - Verifica `AndroidManifest.xml`:
     - Confirma que incluya `<uses-permission android:name="android.permission.INTERNET" />`, `android:usesCleartextTraffic="true"` y `android:windowSoftInputMode="adjustResize"`.
   - Verifica `MainActivity.kt`:
     - Asegúrate de que el `package com.costudio.gestorhorarios` coincida exactamente con la estructura de carpetas `java/com/costudio/gestorhorarios/MainActivity.kt`.

## Fase 3: Verificación de Compilación Gradle (Autocomprobación)
1. Entra a la carpeta de Android (`cd android` o `cd src-tauri/gen/android`) y ejecuta en terminal:
   `.\gradlew.bat assembleDebug --stacktrace`
2. Si Gradle reporta algún error (SDK, Kotlin version, ProGuard o recursos XML), lee el stacktrace, corrige el archivo correspondiente y vuelve a ejecutar `.\gradlew.bat assembleDebug` hasta que muestre `BUILD SUCCESSFUL`.
3. Genera un Artifact de resumen indicando la ruta exacta del `.apk` generado y abre el proyecto en Android Studio.
