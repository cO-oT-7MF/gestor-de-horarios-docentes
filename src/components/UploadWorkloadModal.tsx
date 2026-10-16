import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AcademicLoadItem, Group, SchoolInfo, ScheduleEntry } from '../types';
import {
  parseAcademicLoadCSV,
  generateAcademicLoadMatrixTemplate,
  generateAcademicLoadListTemplate,
  getSubjectConfig,
} from '../utils/scheduler';
import { saveBatchTeacherContacts } from '../data/teacherCatalog';
import {
  extractTextFromUploadedFile,
  parseGoogleDocWorkloadText,
  integrateNewTeacherWorkload,
  GoogleDocAnalysisResult,
} from '../utils/googleDocParser';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Sparkles,
  Layers,
  Clock,
  UserCheck,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  UserPlus,
  CalendarPlus,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ModalPortal } from './ModalPortal';

export type UploadWorkloadMode = 'new_cycle' | 'add_teacher' | 'reset_initial';

interface UploadWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: UploadWorkloadMode;
  onSaveWorkload: (loads: AcademicLoadItem[], shouldAutoGenerate: boolean) => void;
  onAddNewTeacher?: (
    teacherName: string,
    subject: string,
    groupsWithHours: { groupId: string; hours: number }[]
  ) => void;
  onResetInitial?: () => void;
  groups: Group[];
  allTeachers: string[];
  schoolInfo: SchoolInfo;
  currentLoads?: AcademicLoadItem[];
  currentEntries?: ScheduleEntry[];
}

export const UploadWorkloadModal: React.FC<UploadWorkloadModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'new_cycle',
  onSaveWorkload,
  onAddNewTeacher,
  onResetInitial,
  groups,
  allTeachers,
  schoolInfo,
  currentLoads = [],
  currentEntries = [],
}) => {
  const { isLight } = useTheme();
  const [mode, setMode] = useState<UploadWorkloadMode>(initialMode);

  // Sync mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setPreviewData(null);
      setFileName(null);
      setIsAnalyzing(false);
      setExecutionStatus(null);
    }
  }, [isOpen, initialMode]);

  // Upload state
  const [activeInputType, setActiveInputType] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);
  const [immediateExecution, setImmediateExecution] = useState(true);

  // Parsed data
  const [previewData, setPreviewData] = useState<GoogleDocAnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [autoGenerateAfter, setAutoGenerateAfter] = useState(true);
  const [previewSubTab, setPreviewSubTab] = useState<'groups' | 'teachers' | 'pedagogy'>('pedagogy');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');

  // Add new teacher state
  const [newTeacherForm, setNewTeacherForm] = useState<{
    name: string;
    subject: string;
    hoursPerGroup: number;
    selectedGroups: string[];
  }>({
    name: '',
    subject: 'Español',
    hoursPerGroup: 5,
    selectedGroups: ['1A', '1B'],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = (type: 'matrix' | 'list') => {
    const content =
      type === 'matrix'
        ? generateAcademicLoadMatrixTemplate()
        : generateAcademicLoadListTemplate();
    const name =
      type === 'matrix'
        ? 'Plantilla_Carga_Docente_Matriz_SEP.csv'
        : 'Plantilla_Carga_Docente_Lista.csv';

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Immediate process and execution handler
  const processAndExecute = async (rawText: string, name: string) => {
    setIsAnalyzing(true);
    setExecutionStatus('Analizando archivo de Google Doc e interpretando estructura...');
    setFileName(name);

    // Artificial tiny pause to give crisp visual feedback of analysis
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Try extracting teacher contact overrides if CSV format is used
    try {
      const csvParsed = parseAcademicLoadCSV(rawText);
      if (csvParsed.teacherContacts && csvParsed.teacherContacts.length > 0) {
        saveBatchTeacherContacts(
          csvParsed.teacherContacts.map((c) => ({
            nameOrAlias: c.teacherName,
            email: c.email,
            whatsapp: c.whatsapp,
          }))
        );
      }
    } catch {
      // Ignore if not a standard CSV
    }

    const analysis = parseGoogleDocWorkloadText(rawText, name, groups);
    setPreviewData(analysis);
    setIsAnalyzing(false);

    // If immediate execution is enabled, automatically integrate into the default middle school structure!
    if (immediateExecution && analysis.loads.length > 0) {
      setExecutionStatus('⚡ Integrando de inmediato en la estructura curricular de secundaria...');

      setTimeout(() => {
        if (mode === 'new_cycle') {
          onSaveWorkload(analysis.loads, true);
          onClose();
        } else if (mode === 'add_teacher') {
          // If in add_teacher mode and multiple teachers found in doc, integrate
          if (analysis.teachers.length > 0) {
            onSaveWorkload(analysis.loads, true);
          }
          onClose();
        }
      }, 700);
    } else {
      setExecutionStatus(null);
    }
  };

  // File upload handler supporting Google Doc .docx, .gdoc, .txt, .csv, .tsv
  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    setExecutionStatus(`Extrayendo contenido de ${file.name}...`);

    try {
      const extracted = await extractTextFromUploadedFile(file);
      await processAndExecute(extracted.text, file.name);
    } catch (err) {
      console.error('Error reading Google Doc file:', err);
      setIsAnalyzing(false);
      setExecutionStatus('Error al leer el archivo. Intenta pegar el texto directamente.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  // Confirm manual import if immediate execution was unchecked
  const handleConfirmImport = () => {
    if (!previewData || previewData.loads.length === 0) return;
    onSaveWorkload(previewData.loads, autoGenerateAfter);
    onClose();
  };

  // Handle Add New Teacher form submission
  const handleAddNewTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherForm.name.trim() || newTeacherForm.selectedGroups.length === 0) return;

    if (onAddNewTeacher) {
      const groupsWithHours = newTeacherForm.selectedGroups.map((gId) => ({
        groupId: gId,
        hours: newTeacherForm.hoursPerGroup,
      }));
      onAddNewTeacher(newTeacherForm.name.trim(), newTeacherForm.subject, groupsWithHours);
    } else {
      // Fallback integration using current loads
      const groupsWithHours = newTeacherForm.selectedGroups.map((gId) => ({
        groupId: gId,
        hours: newTeacherForm.hoursPerGroup,
      }));
      const res = integrateNewTeacherWorkload(
        newTeacherForm.name.trim(),
        newTeacherForm.subject,
        groupsWithHours,
        currentLoads,
        currentEntries
      );
      onSaveWorkload(res.updatedLoads, true);
    }
    onClose();
  };

  // Toggle group selection for new teacher form
  const toggleGroupSelection = (gId: string) => {
    setNewTeacherForm((prev) => {
      const exists = prev.selectedGroups.includes(gId);
      return {
        ...prev,
        selectedGroups: exists
          ? prev.selectedGroups.filter((id) => id !== gId)
          : [...prev.selectedGroups, gId],
      };
    });
  };

  // Secondary subject list for select
  const secondarySubjects = [
    { name: 'Español', hours: 5 },
    { name: 'Matemáticas', hours: 5 },
    { name: 'Ciencias', hours: 4 },
    { name: 'Inglés', hours: 3 },
    { name: 'Geografía', hours: 4 },
    { name: 'Historia', hours: 4 },
    { name: 'Formación Cívica y Ética', hours: 2 },
    { name: 'Artes', hours: 3 },
    { name: 'Tecnología', hours: 3 },
    { name: 'Educación Física', hours: 2 },
    { name: 'Tutoría', hours: 1 },
    { name: 'Integración Curricular', hours: 1 },
  ];

  if (!isOpen) return null;

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Cargar Carga Horaria y Asignaciones"
    >
      <div
        className={`relative z-[10000] rounded-2xl w-full max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-4xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
            : 'bg-[#111318] border-slate-800 text-slate-100 shadow-black/90'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
            isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-[#0a0c10] border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black font-serif">Cargar Carga Horaria y Asignaciones</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Google Doc Compatible
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Analiza e integra automáticamente la carga docente en la estructura curricular optimizada para secundaria.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Mode Switcher (Options required by user prompt) */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0d0f15] border-slate-800/90'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Operación:</span>

            <button
              id="mode-new-cycle-btn"
              onClick={() => setMode('new_cycle')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'new_cycle'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : isLight
                  ? 'bg-white text-slate-700 hover:bg-slate-200'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Iniciar Nuevo Ciclo</span>
            </button>

            <button
              id="mode-add-teacher-btn"
              onClick={() => setMode('add_teacher')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'add_teacher'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : isLight
                  ? 'bg-white text-slate-700 hover:bg-slate-200'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Agregar Nuevo Docente</span>
            </button>

            <button
              id="mode-reset-initial-btn"
              onClick={() => setMode('reset_initial')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'reset_initial'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : isLight
                  ? 'bg-white text-slate-700 hover:bg-slate-200'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer a Valores Iniciales</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadTemplate('matrix')}
              className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md text-[11px] text-amber-600 dark:text-amber-300 font-bold hover:bg-amber-500/20 transition-colors cursor-pointer"
              title="Descargar plantilla de matriz SEP (Grupo x Materias)"
            >
              <Download className="w-3 h-3" />
              <span>Plantilla SEP</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* MODE 1: START A NEW CYCLE */}
          {mode === 'new_cycle' && (
            <div className="space-y-5">
              {/* Immediate Execution Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-emerald-950/20 border-emerald-700/40 text-emerald-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">Ejecución Inmediata con Enfoque de Secundaria</p>
                    <p className={isLight ? 'text-emerald-800' : 'text-emerald-300/80'}>
                      Al subir el Google Doc, el sistema analiza el archivo, estructura las 35 horas semanales de cada grupo y
                      genera la malla curricular automáticamente optimizada para el aprendizaje de los alumnos.
                    </p>
                  </div>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer self-start sm:self-center shrink-0">
                  <input
                    type="checkbox"
                    checked={immediateExecution}
                    onChange={(e) => setImmediateExecution(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold whitespace-nowrap">Ejecutar al subir</span>
                </label>
              </div>

              {/* Status or Progress */}
              {isAnalyzing && (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center space-x-3 animate-pulse">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
                  <p className="text-xs font-bold text-amber-500">{executionStatus || 'Analizando archivo...'}</p>
                </div>
              )}

              {/* Upload Input Tabs */}
              <div className="flex items-center space-x-2 border-b border-slate-700 pb-2">
                <button
                  onClick={() => setActiveInputType('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeInputType === 'upload'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Subir Archivo Google Doc / Word / Excel / CSV
                </button>
                <button
                  onClick={() => setActiveInputType('paste')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeInputType === 'paste'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pegar Texto / Tabla Copiada de Google Doc
                </button>
              </div>

              {activeInputType === 'upload' ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                    dragActive
                      ? 'border-amber-400 bg-amber-500/10 scale-[0.99]'
                      : isLight
                      ? 'border-slate-300 hover:border-amber-500 bg-slate-50'
                      : 'border-slate-700 hover:border-amber-500/60 bg-[#141720]/60'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.gdoc,.csv,.tsv,.txt,.xlsx,.html"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">
                    Sube tu archivo Google Doc o arrástralo aquí
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Acepta exportaciones de <strong>Google Docs (.docx, .gdoc, .txt, .html)</strong>, o archivos de hoja de cálculo <strong>(.csv, .tsv, .xlsx)</strong> con la distribución de materias y profesores.
                  </p>
                  <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Seleccionar Archivo de Google Doc</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={7}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Pega aquí la tabla o el texto copiado de tu documento de Google Docs...&#10;&#10;Ejemplo 1 (Tabla):&#10;Grupo	Español	Matemáticas	Ciencias	Inglés	Asesor&#10;1A	Ana B	Martha	JAIME	KARY	Ana B&#10;&#10;Ejemplo 2 (Lista):&#10;Docente: Juan Carlos | Materia: Matemáticas | Grupos: 1A, 1B, 1C"
                    className={`w-full rounded-xl p-3 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500 border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#151821] border-slate-700 text-slate-200'
                    }`}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => processAndExecute(pastedText, 'Texto_Google_Doc_Pegado')}
                      disabled={!pastedText.trim()}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-black transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analizar e Integrar Texto</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Preview and Pedagogical Insights Section */}
              {previewData && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-200">
                        {previewData.fileName} • {previewData.loads.length} Grupos Detectados • {previewData.teachers.length} Docentes • {previewData.totalHours} Horas
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                      <button
                        onClick={() => setPreviewSubTab('pedagogy')}
                        className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                          previewSubTab === 'pedagogy'
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Enfoque Pedagógico
                      </button>
                      <button
                        onClick={() => setPreviewSubTab('groups')}
                        className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                          previewSubTab === 'groups'
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Grupos
                      </button>
                      <button
                        onClick={() => setPreviewSubTab('teachers')}
                        className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                          previewSubTab === 'teachers'
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Docentes
                      </button>
                    </div>
                  </div>

                  {previewSubTab === 'pedagogy' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {previewData.pedagogicalInsights.map((ins, idx) => (
                        <div
                          key={`pedagogy-${ins.title}-${idx}`}
                          className={`p-3 rounded-xl border space-y-1 ${
                            ins.type === 'pedagogy'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                              : ins.type === 'success'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                              : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                          }`}
                        >
                          <h5 className="text-xs font-black flex items-center space-x-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{ins.title}</span>
                          </h5>
                          <p className="text-[11px] opacity-90 leading-relaxed">{ins.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {previewSubTab === 'groups' && (
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 p-2 space-y-2 bg-[#0c0e14]">
                      {previewData.loads.map((l, idx) => (
                        <div
                          key={`load-preview-${l.groupId}-${idx}`}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                        >
                          <div className="font-bold text-amber-400">{l.groupName}</div>
                          <div className="text-slate-300">
                            {Object.keys(l.subjects).length} Materias Asignadas
                          </div>
                          <div className="text-slate-400">
                            Asesor: <span className="text-slate-200 font-medium">{l.advisor || 'Sin asignar'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {previewSubTab === 'teachers' && (
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 p-2 space-y-1.5 bg-[#0c0e14]">
                      {previewData.teachers.map((t, idx) => (
                        <div
                          key={`teacher-preview-${t}-${idx}`}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                        >
                          <div className="font-bold text-slate-200 flex items-center space-x-2">
                            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>{t}</span>
                          </div>
                          <span className="text-[11px] text-emerald-400 font-semibold">Integrado en plantilla</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE 2: ADD A NEW TEACHER */}
          {mode === 'add_teacher' && (
            <div className="space-y-5">
              <div
                className={`p-4 rounded-xl border flex items-start space-x-3 ${
                  isLight
                    ? 'bg-blue-50 border-blue-200 text-blue-950'
                    : 'bg-blue-950/20 border-blue-700/40 text-blue-200'
                }`}
              >
                <UserPlus className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Integrar Nuevo Docente al Plantel</p>
                  <p className={isLight ? 'text-blue-800' : 'text-blue-300/80'}>
                    Puedes subir el archivo Google Doc con la asignación del profesor o ingresar sus datos abajo.
                    El sistema colocará sus clases en las horas libres de los grupos correspondientes sin modificar los horarios ya fijados para otros maestros.
                  </p>
                </div>
              </div>

              {/* Subir archivo del docente */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isLight
                    ? 'border-slate-300 hover:border-blue-500 bg-slate-50'
                    : 'border-slate-700 hover:border-blue-500/60 bg-[#141720]/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.gdoc,.csv,.tsv,.txt,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center justify-center space-x-2 text-xs font-bold text-blue-400">
                  <Upload className="w-4 h-4" />
                  <span>¿Tienes un archivo o Google Doc del docente? Haz clic para cargarlo</span>
                </div>
              </div>

              {/* Formulario manual de docente */}
              <form onSubmit={handleAddNewTeacherSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nombre Completo del Docente
                    </label>
                    <input
                      type="text"
                      required
                      value={newTeacherForm.name}
                      onChange={(e) => setNewTeacherForm({ ...newTeacherForm, name: e.target.value })}
                      placeholder="Ej. Prof. Roberto Carlos Morales"
                      className={`w-full rounded-lg p-2.5 text-xs border focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#151821] border-slate-700 text-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Asignatura / Especialidad
                    </label>
                    <select
                      value={newTeacherForm.subject}
                      onChange={(e) => {
                        const sub = secondarySubjects.find((s) => s.name === e.target.value);
                        setNewTeacherForm({
                          ...newTeacherForm,
                          subject: e.target.value,
                          hoursPerGroup: sub ? sub.hours : 4,
                        });
                      }}
                      className={`w-full rounded-lg p-2.5 text-xs border focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#151821] border-slate-700 text-slate-200'
                      }`}
                    >
                      {secondarySubjects.map((sub, sIdx) => (
                        <option key={`sub-${sub.name}-${sIdx}`} value={sub.name}>
                          {sub.name} ({sub.hours} hrs sugeridas)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      Grupos Asignados en Secundaria (Selecciona los grupos que atenderá):
                    </label>
                    <span className="text-xs text-amber-400 font-bold">
                      {newTeacherForm.selectedGroups.length} grupos seleccionados ({newTeacherForm.selectedGroups.length * newTeacherForm.hoursPerGroup} hrs totales)
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                    {groups.map((g, gIdx) => {
                      const isSelected = newTeacherForm.selectedGroups.includes(g.id);
                      return (
                        <button
                          key={`group-select-${g.id}-${gIdx}`}
                          type="button"
                          onClick={() => toggleGroupSelection(g.id)}
                          className={`p-2 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                              : isLight
                              ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                              : 'bg-[#161922] border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    id="submit-add-teacher-btn"
                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Integrar Docente e Insertar en Horarios</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 3: RESET TO INITIAL VALUES */}
          {mode === 'reset_initial' && (
            <div className="space-y-5">
              <div
                className={`p-5 rounded-2xl border flex items-start space-x-4 ${
                  isLight
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-amber-950/20 border-amber-700/40 text-amber-200'
                }`}
              >
                <RotateCcw className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-sm font-black">Restablecer Sistema a Valores Iniciales de Fábrica</h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    Restaura inmediatamente todos los horarios, cargas académicas y parámetros de la escuela a la estructura oficial predeterminada de la Escuela Secundaria Nº 129 "Gral. Félix U. Gómez", eliminando empalmes y configurando los 24 grupos escolares con sus 35 horas semanales estándar.
                  </p>
                  <div className="pt-3">
                    <button
                      type="button"
                      id="modal-direct-reset-btn"
                      onClick={() => {
                        if (onResetInitial) {
                          onResetInitial();
                        }
                        onClose();
                      }}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restablecer Todo a Valores Iniciales Ahora</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0c10] border-slate-800'
          }`}
        >
          <div className="text-xs text-slate-400">
            Escuela Secundaria Nº 129 • Turno Vespertino • 35 Horas Semanales
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-600 hover:bg-slate-200'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Cerrar
            </button>

            {mode === 'new_cycle' && previewData && !immediateExecution && (
              <button
                onClick={handleConfirmImport}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow-md cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Aplicar Carga y Generar Horarios</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
