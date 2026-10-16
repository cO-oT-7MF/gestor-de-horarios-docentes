import React, { useState } from 'react';
import {
  ScheduleEntry,
  AcademicLoadItem,
  Group,
  SchoolInfo,
  TimeSlotConfig,
  LastKnownGoodState,
} from '../types';
import {
  exportMasterScheduleCSV,
  exportTeacherScheduleCSV,
  exportGroupScheduleCSV,
  parseAcademicLoadCSV,
  generateAcademicLoadMatrixTemplate,
  generateAcademicLoadListTemplate,
  generateTeacherContactsTemplate,
  generateFullScheduleFromWorkload,
  sanitizeAcademicLoads,
} from '../utils/scheduler';
import {
  parseInitialEntriesFromCSV,
  DEFAULT_SCHOOL_INFO,
  INITIAL_ACADEMIC_LOAD,
  GROUPS,
} from '../data/initialData';
import {
  saveBatchTeacherContacts,
  exportTeacherContactsCSV,
} from '../data/teacherCatalog';
import { WhatsAppIcon } from './TeacherContactBadge';
import {
  getLastKnownGoodSnapshot,
  saveLastKnownGoodSnapshot,
  formatAutoSaveTime,
} from '../utils/autoSave';
import { saveCycleToIndexedDB } from '../utils/indexedDB';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Sparkles,
  Printer,
  FileDown,
  ShieldCheck,
  Clock,
  Save,
  Mail,
  FileText,
  Users,
} from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: ScheduleEntry[];
  setEntries: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
  allTeachers: string[];
  groups: Group[];
  academicLoads: AcademicLoadItem[];
  setAcademicLoads: React.Dispatch<React.SetStateAction<AcademicLoadItem[]>>;
  schoolInfo: SchoolInfo;
  setSchoolInfo: React.Dispatch<React.SetStateAction<SchoolInfo>>;
  customTimeSlots?: TimeSlotConfig[];
  setCustomTimeSlots?: (slots?: TimeSlotConfig[]) => void;
  onOpenPrintModal?: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  entries,
  setEntries,
  allTeachers,
  groups,
  academicLoads,
  setAcademicLoads,
  schoolInfo,
  setSchoolInfo,
  customTimeSlots,
  setCustomTimeSlots,
  onOpenPrintModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'export' | 'import' | 'backup'>('export');
  const [importMode, setImportMode] = useState<'workload' | 'schedule'>('workload');
  const [importCsvText, setImportCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [autoGenAfterLoad, setAutoGenAfterLoad] = useState(true);
  const [lastKnownGood, setLastKnownGood] = useState<LastKnownGoodState | null>(() =>
    getLastKnownGoodSnapshot()
  );

  if (!isOpen) return null;

  const downloadFile = (content: string, fileName: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMasterCSV = () => {
    const csv = exportMasterScheduleCSV(entries, allTeachers);
    downloadFile(csv, `Horarios_Secundaria_129_Completo.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportTeacherContacts = () => {
    const csv = exportTeacherContactsCSV(allTeachers);
    downloadFile(
      csv,
      `Directorio_Docentes_Contactos_Sec129_${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const handleBackupJSON = () => {
    const data = {
      schoolInfo,
      entries,
      academicLoads,
      timestamp: new Date().toISOString(),
    };
    downloadFile(
      JSON.stringify(data, null, 2),
      `Copia_Seguridad_Horarios_Sec129_${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
  };

  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.entries && Array.isArray(parsed.entries)) {
          setEntries(parsed.entries);
        }
        if (parsed.academicLoads && Array.isArray(parsed.academicLoads)) {
          setAcademicLoads(sanitizeAcademicLoads(parsed.academicLoads));
        }
        if (parsed.schoolInfo) {
          setSchoolInfo(parsed.schoolInfo);
        }
        setImportStatus('✓ Copia de seguridad restaurada exitosamente.');
      } catch {
        setImportStatus('❌ Error: El archivo JSON no tiene un formato válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportWorkloadOrSchedule = () => {
    if (!importCsvText.trim()) {
      setImportStatus('❌ Por favor pegue el contenido CSV o seleccione un archivo.');
      return;
    }

    try {
      if (importMode === 'workload') {
        const parsed = parseAcademicLoadCSV(importCsvText);

        // 1. Process batch teacher contacts if present
        let contactsUpdated = 0;
        if (parsed.teacherContacts && parsed.teacherContacts.length > 0) {
          contactsUpdated = saveBatchTeacherContacts(
            parsed.teacherContacts.map((c) => ({
              nameOrAlias: c.teacherName,
              email: c.email,
              whatsapp: c.whatsapp,
            }))
          );
        }

        const cleanLoads = sanitizeAcademicLoads(parsed.loads);

        // If it was a dedicated contact directory without academic groups
        if (cleanLoads.length === 0) {
          if (contactsUpdated > 0) {
            setImportStatus(
              `✓ Se actualizaron masivamente los correos y números de WhatsApp de ${contactsUpdated} docentes en el directorio escolar.`
            );
            return;
          }
          setImportStatus('❌ No se pudieron detectar grupos o materias en el formato de carga.');
          return;
        }

        setAcademicLoads(cleanLoads);
        let msg = `✓ Carga docente importada con éxito: ${cleanLoads.length} grupos y ${parsed.teachers.length} docentes (${parsed.totalHours} horas semanales).`;

        if (contactsUpdated > 0) {
          msg += ` Se actualizaron masivamente los datos de contacto (Email y WhatsApp) de ${contactsUpdated} docentes.`;
        }

        if (autoGenAfterLoad) {
          const genResult = generateFullScheduleFromWorkload(cleanLoads, groups);
          setEntries(genResult.entries);
          msg += ` Se generaron automáticamente ${genResult.entries.length} asignaciones sin empalmes.`;
        }
        setImportStatus(msg);
      } else {
        const parsedEntries = parseInitialEntriesFromCSV(importCsvText);
        if (parsedEntries.length > 0) {
          setEntries(parsedEntries);
          setImportStatus(`✓ Se importaron ${parsedEntries.length} asignaciones de horario correctamente.`);
        } else {
          setImportStatus('❌ No se encontraron asignaciones válidas en el CSV.');
        }
      }
    } catch {
      setImportStatus('❌ Error al procesar el archivo CSV.');
    }
  };

  const handleResetToDefault = () => {
    if (confirm('¿Está seguro de restablecer todos los horarios y cargas a los datos oficiales iniciales?')) {
      const defaultEntries = parseInitialEntriesFromCSV();
      setEntries(defaultEntries);
      setAcademicLoads(INITIAL_ACADEMIC_LOAD);
      setSchoolInfo(DEFAULT_SCHOOL_INFO);
      setImportStatus('✓ Datos restablecidos al estado original de la Escuela Sec. 129.');
    }
  };

  const handleRestoreLastKnownGood = () => {
    const snapshot = getLastKnownGoodSnapshot();
    if (!snapshot) {
      setImportStatus('❌ No se encontró ningún respaldo en la clave "last_known_good".');
      return;
    }
    const formattedDate = new Date(snapshot.timestamp).toLocaleString();
    if (
      confirm(
        `¿Desea restaurar el estado respaldado en 'last_known_good' del ${formattedDate}?`
      )
    ) {
      if (snapshot.entries && Array.isArray(snapshot.entries)) {
        setEntries(snapshot.entries);
      }
      if (snapshot.academicLoads && Array.isArray(snapshot.academicLoads)) {
        setAcademicLoads(sanitizeAcademicLoads(snapshot.academicLoads));
      }
      if (snapshot.schoolInfo) {
        setSchoolInfo(snapshot.schoolInfo);
      }
      if (setCustomTimeSlots && snapshot.customTimeSlots) {
        setCustomTimeSlots(snapshot.customTimeSlots);
      }
      setImportStatus(
        `✓ Estado restaurado exitosamente desde 'last_known_good' (${snapshot.entries?.length || 0} asignaciones, ${snapshot.academicLoads?.length || 0} grupos).`
      );
    }
  };

  const handleManualSnapshot = () => {
    const saved = saveLastKnownGoodSnapshot({
      entries,
      academicLoads,
      schoolInfo,
      customTimeSlots,
    });
    saveCycleToIndexedDB({
      entries,
      academicLoads,
      schoolInfo,
      customTimeSlots,
    }).catch((err) => console.warn('Error guardando respaldo en IndexedDB:', err));

    if (saved) {
      setLastKnownGood(saved);
      setImportStatus(
        `✓ Respaldo 'last_known_good' e IndexedDB actualizados exitosamente a las ${formatAutoSaveTime(
          saved.timestamp
        )}.`
      );
    } else {
      setImportStatus('❌ Error al guardar en almacenamiento.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 md:p-6 animate-in fade-in">
      <div className="bg-[#111318] rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[85vh] sm:max-h-[80dvh] shadow-2xl border border-slate-800/90 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#0a0c10] border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100 font-serif">Exportación, Importación y Respaldos</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-800 bg-[#0a0c10] px-4 sm:px-6 pt-3 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => {
              setActiveSubTab('export');
              setImportStatus(null);
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeSubTab === 'export'
                ? 'border-amber-500 text-amber-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Exportar CSV / Excel
          </button>
          <button
            onClick={() => {
              setActiveSubTab('import');
              setImportStatus(null);
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeSubTab === 'import'
                ? 'border-amber-500 text-amber-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Importar Carga / Horario
          </button>
          <button
            onClick={() => {
              setActiveSubTab('backup');
              setImportStatus(null);
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeSubTab === 'backup'
                ? 'border-amber-500 text-amber-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Copia de Seguridad / Reset
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {importStatus && (
            <div
              className={`p-3 rounded-lg text-xs font-bold flex items-center space-x-2 ${
                importStatus.startsWith('✓')
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
              }`}
            >
              {importStatus.startsWith('✓') ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{importStatus}</span>
            </div>
          )}

          {activeSubTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Descargue la información estructurada compatible con Microsoft Excel, Google Sheets o cualquier sistema escolar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {onOpenPrintModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPrintModal();
                    }}
                    className="p-4 bg-[#16181f] hover:bg-[#1a1d26] border border-amber-500/40 hover:border-amber-400 rounded-xl flex flex-col text-left transition-all group col-span-1 sm:col-span-2 shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center space-x-2">
                        <FileDown className="w-6 h-6 text-amber-400" />
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Recomendado SEP
                        </span>
                      </div>
                      <Printer className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-100">
                      Cédula Oficial en PDF / Impresión
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Genera y descarga en formato PDF oficial o manda a imprimir los horarios individuales de docentes o de grupos escolares con sellos y firmas.
                    </span>
                  </button>
                )}

                <button
                  onClick={handleExportTeacherContacts}
                  className="p-4 bg-[#16181f] hover:bg-[#1a1d26] border border-slate-800 hover:border-emerald-500/50 rounded-xl flex flex-col text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center space-x-1.5">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <WhatsAppIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  </div>
                  <span className="font-extrabold text-sm text-slate-100">
                    Directorio de Contactos Docentes (.CSV)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Plantilla completa con RFC, materia, correos institucionales y números de WhatsApp de los 40 docentes.
                  </span>
                </button>

                <button
                  onClick={handleExportMasterCSV}
                  className="p-4 bg-[#16181f] hover:bg-[#1a1d26] border border-slate-800 hover:border-amber-500/50 rounded-xl flex flex-col text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                  </div>
                  <span className="font-extrabold text-sm text-slate-100">
                    Sábana Completa de Horarios (.CSV)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Todos los docentes, días (Lunes-Viernes) y horas (1-7).
                  </span>
                </button>

                <button
                  onClick={handleBackupJSON}
                  className="p-4 bg-[#16181f] hover:bg-[#1a1d26] border border-slate-800 hover:border-amber-500/50 rounded-xl flex flex-col text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <FileJson className="w-6 h-6 text-amber-400" />
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                  </div>
                  <span className="font-extrabold text-sm text-slate-100">
                    Respaldo Integral del Sistema (.JSON)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Incluye configuración escolar, carga y asignaciones.
                  </span>
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'import' && (
            <div className="space-y-4">
              {/* Import Mode Selector */}
              <div className="bg-[#0a0c10] p-1 rounded-xl border border-slate-800 flex gap-1">
                <button
                  onClick={() => setImportMode('workload')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    importMode === 'workload'
                      ? 'bg-amber-500 text-slate-950 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Carga Académica y Contactos (Matriz/Lista/Directorio)
                </button>
                <button
                  onClick={() => setImportMode('schedule')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    importMode === 'schedule'
                      ? 'bg-amber-500 text-slate-950 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sábana de Horarios (Celdas fijas)
                </button>
              </div>

              {importMode === 'workload' ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">
                    Pegue o cargue la tabla de asignaciones académicas. Incluye soporte para las columnas opcionales <strong className="text-amber-300 font-mono">EMAIL</strong> y <strong className="text-emerald-300 font-mono">WHATSAPP</strong> para sincronizar los datos de contacto masivamente en un solo paso.
                  </p>

                  {/* Template download toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-semibold mr-1">Plantillas descargables:</span>
                    <button
                      type="button"
                      onClick={() =>
                        downloadFile(
                          generateAcademicLoadListTemplate(),
                          'Plantilla_Carga_Lista_Con_Contactos.csv',
                          'text/csv;charset=utf-8;'
                        )
                      }
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1a1d26] hover:bg-[#222633] text-amber-300 border border-slate-700 rounded-md text-[11px] font-bold transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Lista con Contactos (.CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadFile(
                          generateTeacherContactsTemplate(),
                          'Plantilla_Directorio_Contactos_Docentes.csv',
                          'text/csv;charset=utf-8;'
                        )
                      }
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1a1d26] hover:bg-[#222633] text-emerald-300 border border-slate-700 rounded-md text-[11px] font-bold transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Solo Directorio Contactos (.CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadFile(
                          generateAcademicLoadMatrixTemplate(),
                          'Plantilla_Carga_Matriz_SEP.csv',
                          'text/csv;charset=utf-8;'
                        )
                      }
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1a1d26] hover:bg-[#222633] text-slate-300 border border-slate-700 rounded-md text-[11px] font-medium transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Matriz SEP (.CSV)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Pegue texto en formato CSV con columnas: <code className="bg-[#0a0a0a] border border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px] text-amber-300">Maestro, Materia, Lunes 1, ..., Viernes 7</code>.
                </p>
              )}

              {/* Direct file selector */}
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] text-slate-400 font-bold">
                  Pegue el texto CSV o seleccione un archivo:
                </label>
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setImportCsvText(ev.target?.result as string || '');
                    };
                    reader.readAsText(file);
                  }}
                  className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-[#1f2330] file:text-amber-300 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <textarea
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder={
                  importMode === 'workload'
                    ? 'DOCENTE,MATERIA,GRUPO,HORAS_SEMANALES,ASESOR_DEL_GRUPO,EMAIL,WHATSAPP\nAna B,Español,1A,5,Ana B,ana.matematicas@secundaria129.edu.mx,+52 55 4123 0102\nMartha,Matemáticas,1A,5,Ana B,martha.matematicas@secundaria129.edu.mx,+52 55 4123 0120\nJAIME,Ciencias,1A,4,Ana B,jaime.ciencias@secundaria129.edu.mx,+52 55 4123 0115'
                    : 'Maestro,Materia,Lunes 1,Lunes 2,...'
                }
                rows={7}
                className="w-full bg-[#0a0a0a] border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />

              {importMode === 'workload' && (
                <div className="bg-[#0a0a0a] p-3 rounded-lg border border-slate-800 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-gen-import-modal"
                    checked={autoGenAfterLoad}
                    onChange={(e) => setAutoGenAfterLoad(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-700 bg-slate-900 cursor-pointer"
                  />
                  <label
                    htmlFor="auto-gen-import-modal"
                    className="text-xs font-bold text-slate-200 cursor-pointer flex items-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generar horarios automáticamente a partir de esta carga</span>
                  </label>
                </div>
              )}

              <button
                onClick={handleImportWorkloadOrSchedule}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {importMode === 'workload'
                    ? 'Importar Carga y Aplicar'
                    : 'Procesar e Importar Asignaciones'}
                </span>
              </button>
            </div>
          )}

          {activeSubTab === 'backup' && (
            <div className="space-y-4">
              {/* Secondary 'last_known_good' Auto-Save Card */}
              <div className="p-4 bg-emerald-950/25 border border-emerald-800/60 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-xs text-emerald-300">
                          Auto-Guardado Periódico ('last_known_good')
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Activo cada 60s
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-200/80 leading-relaxed mt-0.5">
                        El sistema respalda automáticamente todo el horario, cargas y datos escolares cada 60 segundos en una clave secundaria protegida para prevenir cualquier pérdida accidental.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0c10] border border-emerald-900/40 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 text-slate-300 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Último auto-guardado:</span>
                      <strong className="text-emerald-300 font-semibold">
                        {lastKnownGood?.timestamp
                          ? new Date(lastKnownGood.timestamp).toLocaleTimeString()
                          : 'Iniciando primer ciclo...'}
                      </strong>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {lastKnownGood?.entries?.length ?? 0} horarios asignados •{' '}
                      {lastKnownGood?.academicLoads?.length ?? 0} grupos respaldados
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleManualSnapshot}
                      title="Guardar una instantánea ahora mismo en 'last_known_good'"
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Guardar ahora</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreLastKnownGood}
                      title="Restaurar el estado desde la clave secundaria 'last_known_good'"
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs shadow-emerald-950/40 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar Copia</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#16181f] border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-xs text-slate-200 uppercase">
                  Restaurar desde archivo JSON
                </h4>
                <p className="text-xs text-slate-400">
                  Seleccione un archivo de copia de seguridad generado previamente.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreJSON}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0a0a0a] file:text-amber-400 hover:file:bg-slate-800 file:border file:border-slate-700 cursor-pointer"
                />
              </div>

              <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-amber-300">
                    Restablecer Datos de Fábrica
                  </h4>
                  <p className="text-[11px] text-amber-200/80">
                    Restaura los 24 grupos y horarios oficiales de la Secundaria 129.
                  </p>
                </div>
                <button
                  onClick={handleResetToDefault}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0a0a0a] text-amber-300 border border-amber-700/60 font-bold rounded-lg text-xs hover:bg-amber-950/40 transition-colors shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

