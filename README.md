# 🏫 Gestor de Horarios y Carga Académica - Secundaria Nº 129
### Ciclo Escolar 2026-2027 | CT 19EES0129S

Sistema web progresivo y de alto rendimiento diseñado para la administración integral de plantillas docentes, planeación de horarios escolares, control de cargas horarias por contrato, gestión de guardias/suplencias y comunicación institucional directa.

---

## 🚀 Características Principales

### 1. 📊 Control y Carga Académica Inteligente
- **Matriz Interactiva de Horarios:** Visualización por docente, por grupo y en formato de sábana general completa.
- **Verificación Automática:** Detección en tiempo real de empalmes de horas y solapamientos de aulas.
- **Dashboard de Cumplimiento:** Monitoreo dinámico del avance de horas asignadas frente al contrato oficial de cada docente.

### 2. 📱 Comunicación Institucional Directa (Nuevo)
- **Información de Contacto Integrada:** Cada profesor cuenta con campos dedicados para Correo Electrónico Institucional y número de WhatsApp con formato internacional.
- **Acciones Rápidas por Docente:**
  - ✉️ **Enlace Mailto Directo:** Abre el cliente de correo preconfigurado con asunto escolar y saludo formal.
  - 💬 **Enlace WhatsApp Directo:** Abre chats inmediatos vía `wa.me` con mensajes institucionales predefinidos.
- **Notificaciones Masivas (BCC):** Módulo centralizado para generar correos masivos a los 40 docentes resguardando su privacidad mediante Copia Oculta (BCC).

### 3. ⚙️ Edición Rápida e Importación Masiva
- **Edición en Pantalla:** Modales flotantes para actualizar datos de contacto de manera instantánea sin perder el contexto de trabajo.
- **Sincronización con Sábanas Académicas:** Importación y exportación de plantillas (CSV / Excel) que reconocen automáticamente las columnas de correo y teléfono para actualizar a toda la plantilla en un solo paso.

### 4. 🛡️ Módulo de Guardias y Suplencias
- **Listas de Disponibilidad Optimizadas:** Virtualización de alto rendimiento (60 FPS) para consultar docentes libres y en aula de forma simultánea.
- **Asignación en 1 Clic:** Modales rápidos para cubrir recesos, zonas del plantel (patio, canchas, portón) y coberturas por ausencia.

---

## 🛠️ Tecnologías y Arquitectura

Este proyecto está construido con un stack web moderno y enfocado en el rendimiento offline-first:

- **Frontend:** React, TypeScript, Vite.
- **Estilos:** Tailwind CSS / Componentes nativos optimizados.
- **Rendimiento:** Listas virtualizadas (@tanstack/react-virtual) para soporte fluido de plantillas extensas.
- **Persistencia de Datos:** Almacenamiento local optimizado e IndexedDB para mantener el estado completo del ciclo escolar sin pérdida de información.

---

## 📋 Estructura del Proyecto

```text
gestor-de-horarios-docentes-academicos/
├── src/
│   ├── components/         # Módulos de interfaz (Horarios, Sábana, Contactos, Guardias)
│   ├── data/              # Catálogo oficial de docentes y materias (19EES0129S)
│   ├── hooks/             # Lucha de estados y persistencia local/IndexedDB
│   ├── utils/             # Utilidades de programación, scheduler y parseo CSV
│   ├── App.tsx            # Componente raíz y enrutador de vistas
│   └── main.tsx           # Punto de montaje de la aplicación
├── public/                # Recursos estáticos e imágenes institucionales
├── package.json           # Dependencias y scripts de compilación
└── README.md              # Documentación oficial del repositorio
