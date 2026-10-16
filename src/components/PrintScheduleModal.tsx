import React, { useState, useEffect, useRef } from 'react';
import {
  Group,
  SchoolInfo,
  ScheduleEntry,
  AcademicLoadItem,
  TimeSlotConfig,
} from '../types';
import { DAYS_OF_WEEK, getTimeSlotsForShift } from '../data/initialData';
import {
  getTeacherStats,
  normalizeName,
} from '../utils/scheduler';
import {
  X,
  Printer,
  FileDown,
  User,
  Users,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ModalPortal } from './ModalPortal';

interface PrintScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: ScheduleEntry[];
  allTeachers: string[];
  groups: Group[];
  academicLoads: AcademicLoadItem[];
  schoolInfo: SchoolInfo;
  timeSlots?: TimeSlotConfig[];
  initialType?: 'teacher' | 'group' | 'load';
  initialTeacher?: string;
  initialGroup?: string;
}

export const PrintScheduleModal: React.FC<PrintScheduleModalProps> = ({
  isOpen,
  onClose,
  entries,
  allTeachers,
  groups,
  academicLoads,
  schoolInfo,
  timeSlots,
  initialType = 'teacher',
  initialTeacher,
  initialGroup,
}) => {
  const [printType, setPrintType] = useState<'teacher' | 'group' | 'load'>(
    initialType === 'group' ? 'group' : initialType === 'load' ? 'load' : 'teacher'
  );
  const [selectedTeacher, setSelectedTeacher] = useState(initialTeacher || allTeachers[0] || '');
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroup || groups[0]?.id || '1A');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isSuccess: boolean } | null>(null);

  const printSheetRef = useRef<HTMLDivElement>(null);

  // Sync state when modal is opened or props change
  useEffect(() => {
    if (isOpen) {
      if (initialType === 'group') {
        setPrintType('group');
      } else if (initialType === 'load') {
        setPrintType('load');
      } else {
        setPrintType('teacher');
      }

      if (initialTeacher) {
        setSelectedTeacher(initialTeacher);
      } else if (allTeachers.length > 0 && !selectedTeacher) {
        setSelectedTeacher(allTeachers[0]);
      }

      if (initialGroup) {
        setSelectedGroupId(initialGroup);
      } else if (groups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groups[0].id);
      }
      setStatusMessage(null);
    }
  }, [isOpen, initialType, initialTeacher, initialGroup, allTeachers, groups]);

  if (!isOpen) return null;

  const currentTeacherStats = getTeacherStats(selectedTeacher, entries);
  const currentGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const activeSlots =
    printType === 'group' && currentGroup
      ? getTimeSlotsForShift(schoolInfo.shift, currentGroup.grade)
      : timeSlots && timeSlots.length === 7
      ? timeSlots
      : getTimeSlotsForShift(schoolInfo.shift);

  const slot3 = activeSlots[2];
  const slot4 = activeSlots[3];
  const recessLabel =
    slot3 && slot4
      ? `Receso Escolar (${slot3.endTime} - ${slot4.startTime} hrs)`
      : schoolInfo.shift.toUpperCase().includes('VESPERTINO')
      ? 'Receso Escolar (15:00 - 16:00 hrs)'
      : 'Receso Escolar (09:30 - 09:50 hrs)';

  // Build a safe dynamic filename
  const getCleanFileName = () => {
    const ct = (schoolInfo.workCenterKey || 'Sec129').replace(/[^a-zA-Z0-9]/g, '_');
    if (printType === 'teacher') {
      const teacherName = selectedTeacher.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_');
      return `Horario_Docente_${teacherName}_${ct}.pdf`;
    }
    if (printType === 'group') {
      return `Horario_Grupo_${currentGroup?.name || selectedGroupId}_${ct}.pdf`;
    }
    return `Carga_Academica_General_${ct}.pdf`;
  };

  // Pure Vector PDF Generation using jsPDF + jspdf-autotable (Zero html2canvas, Zero OKLCH error)
  const handleSaveAsPDF = () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setStatusMessage(null);

    try {
      // Landscape Letter: 279.4 x 215.9 mm
      const isLoad = printType === 'load';
      const doc = new jsPDF({
        orientation: isLoad ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'letter',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      let y = 12;

      // 1. Official SEP Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        'SECRETARÍA DE EDUCACIÓN • SUBSECRETARÍA DE EDUCACIÓN BÁSICA',
        pageWidth / 2,
        y,
        { align: 'center' }
      );

      y += 5;
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(schoolInfo.name, pageWidth / 2, y, { align: 'center' });

      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const subheaderText = `${schoolInfo.schoolYear}  •  C.T.: ${schoolInfo.workCenterKey}  •  ${schoolInfo.zone}  •  ${schoolInfo.regionalUnit}  •  ${schoolInfo.shift}`;
      doc.text(subheaderText, pageWidth / 2, y, { align: 'center' });

      y += 3;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);

      y += 4;

      // 2. Metadata Box
      const boxWidth = pageWidth - margin * 2;
      const boxHeight = 15;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'FD');

      if (printType === 'teacher') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('CÉDULA DE HORARIO INDIVIDUAL DEL DOCENTE', margin + 3.5, y + 4.5);

        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`Prof(a). ${selectedTeacher}`, margin + 3.5, y + 9);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const subjText = `Asignaturas: ${currentTeacherStats.subjects.join(', ') || 'N/A'}  •  Grupos: ${currentTeacherStats.groups.join(', ') || 'N/A'}`;
        doc.text(subjText, margin + 3.5, y + 13);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('CARGA SEMANAL', pageWidth - margin - 3.5, y + 5, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(146, 64, 14);
        doc.text(`${currentTeacherStats.totalHours} Horas Lectivas`, pageWidth - margin - 3.5, y + 10.5, {
          align: 'right',
        });
      } else if (printType === 'group') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('HORARIO ESCOLAR OFICIAL DEL GRUPO', margin + 3.5, y + 4.5);

        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Grupo ${currentGroup.name} (${currentGroup.grade}º Grado de Secundaria)`,
          margin + 3.5,
          y + 9
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Asesor(a) de Grupo: ${currentGroup.advisor || 'Sin Asignar'}`, margin + 3.5, y + 13);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('JORNADA SEMANAL', pageWidth - margin - 3.5, y + 5, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(146, 64, 14);
        doc.text('35 Horas de Clase', pageWidth - margin - 3.5, y + 10.5, { align: 'right' });
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('PLANTILLA GENERAL DE DISTRIBUCIÓN ACADÉMICA Y CARGA DOCENTE', margin + 3.5, y + 4.5);

        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('Resumen Oficial de Asignaturas y Personal Docente', margin + 3.5, y + 9);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Total Grupos: ${groups.length}  •  Total Docentes: ${allTeachers.length}`, margin + 3.5, y + 13);

        const totalHours = academicLoads.reduce((sum, l) => sum + (l.weeklyHours || 0), 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('TOTAL HORAS', pageWidth - margin - 3.5, y + 5, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(146, 64, 14);
        doc.text(`${totalHours} Horas / Sem`, pageWidth - margin - 3.5, y + 10.5, { align: 'right' });
      }

      y += boxHeight + 3;

      // 3. Timetable Table or Academic Load Table via autoTable
      if (printType !== 'load') {
        const head = [['Hora / Módulo', ...DAYS_OF_WEEK]];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any[] = [];

        activeSlots.forEach((slot) => {
          const buildRowCells = (splitNote?: string) => {
            return DAYS_OF_WEEK.map((day) => {
              if (printType === 'teacher') {
                const found = entries.find(
                  (e) =>
                    e.day === day &&
                    e.slot === slot.id &&
                    normalizeName(e.teacherName) === normalizeName(selectedTeacher)
                );
                if (found) {
                  return splitNote
                    ? `Grupo ${found.groupId}\n${found.subject}\n(${splitNote})`
                    : `Grupo ${found.groupId}\n${found.subject}`;
                }
              } else {
                const found = entries.find(
                  (e) =>
                    e.day === day &&
                    e.slot === slot.id &&
                    e.groupId.trim().toUpperCase() === selectedGroupId.trim().toUpperCase()
                );
                if (found) {
                  return splitNote
                    ? `${found.subject}\n${found.teacherName}\n(${splitNote})`
                    : `${found.subject}\n${found.teacherName}`;
                }
              }
              return '-';
            });
          };

          if (slot.isSplit) {
            // Part 1
            body.push([
              `${slot.splitPart1?.name || `${slot.name} (P1)`}\n${slot.splitPart1?.startTime || '15:00'} - ${slot.splitPart1?.endTime || '15:20'}`,
              ...buildRowCells('20m antes'),
            ]);
            // Recess row
            body.push([
              {
                content: slot.recessLabel || '☕ Receso Escolar 2º Grado (15:20 - 15:40 hrs • 20 min)',
                colSpan: 6,
                styles: {
                  fillColor: [241, 245, 249],
                  textColor: [71, 85, 105],
                  fontStyle: 'bold',
                  halign: 'center',
                },
              },
            ]);
            // Part 2
            body.push([
              `${slot.splitPart2?.name || `${slot.name} (P2)`}\n${slot.splitPart2?.startTime || '15:40'} - ${slot.splitPart2?.endTime || '16:00'}`,
              ...buildRowCells('20m después'),
            ]);
          } else {
            body.push([
              `${slot.name}\n${slot.startTime} - ${slot.endTime}`,
              ...buildRowCells(),
            ]);

            if (slot.isRecessAfter) {
              body.push([
                {
                  content: slot.recessLabel || recessLabel,
                  colSpan: 6,
                  styles: {
                    fillColor: [241, 245, 249],
                    textColor: [71, 85, 105],
                    fontStyle: 'bold',
                    halign: 'center',
                  },
                },
              ]);
            }
          }
        });

        autoTable(doc, {
          startY: y,
          head,
          body,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 7.5,
            cellPadding: 2,
            valign: 'middle',
            halign: 'center',
            lineColor: [148, 163, 184],
            lineWidth: 0.2,
            textColor: [15, 23, 42],
          },
          headStyles: {
            fillColor: [226, 232, 240],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 8,
          },
          columnStyles: {
            0: {
              cellWidth: 32,
              fontStyle: 'bold',
              fillColor: [248, 250, 252],
            },
          },
          margin: { left: margin, right: margin },
        });
      } else {
        // Load table
        const head = [['Grupo', 'Asignatura', 'Docente Titular', 'Hrs / Sem']];
        const body = academicLoads.map((load) => [
          load.groupId,
          load.subject,
          load.teacherName,
          `${load.weeklyHours} hrs`,
        ]);

        autoTable(doc, {
          startY: y,
          head,
          body,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 7.5,
            cellPadding: 2,
            valign: 'middle',
            lineColor: [148, 163, 184],
            lineWidth: 0.2,
            textColor: [15, 23, 42],
          },
          headStyles: {
            fillColor: [226, 232, 240],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'left',
          },
          columnStyles: {
            0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
            1: { halign: 'left' },
            2: { halign: 'left' },
            3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
          },
          margin: { left: margin, right: margin },
        });
      }

      // 4. Signatures Block
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : y + 90;
      const sigY = Math.min(finalY + 12, doc.internal.pageSize.getHeight() - 22);

      const colWidth = boxWidth / 3;
      const sigLineLength = 52;

      // Col 1: Teacher / Advisor / Elaborator
      const col1X = margin + colWidth * 0.5;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.line(col1X - sigLineLength / 2, sigY, col1X + sigLineLength / 2, sigY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const signerName =
        printType === 'teacher'
          ? selectedTeacher
          : printType === 'group'
          ? currentGroup.advisor || 'Asesor de Grupo'
          : 'Responsable de Carga';
      doc.text(signerName, col1X, sigY + 4, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      const signerRole =
        printType === 'teacher'
          ? 'FIRMA DEL DOCENTE'
          : printType === 'group'
          ? 'FIRMA ASESOR(A)'
          : 'FIRMA DE ELABORACIÓN';
      doc.text(signerRole, col1X, sigY + 7.5, { align: 'center' });

      // Col 2: School Principal
      const col2X = margin + colWidth * 1.5;
      doc.line(col2X - sigLineLength / 2, sigY, col2X + sigLineLength / 2, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Dirección Escolar', col2X, sigY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('VO. BO. DIRECTOR(A)', col2X, sigY + 7.5, { align: 'center' });

      // Col 3: Zone Inspection
      const col3X = margin + colWidth * 2.5;
      doc.line(col3X - sigLineLength / 2, sigY, col3X + sigLineLength / 2, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Inspección de Zona', col3X, sigY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('SELLO Y VALIDACIÓN', col3X, sigY + 7.5, { align: 'center' });

      // Save PDF
      const fileName = getCleanFileName();
      doc.save(fileName);

      setStatusMessage({
        text: `✓ Archivo PDF generado con éxito: ${fileName}`,
        isSuccess: true,
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setStatusMessage({
        text: 'Ocurrió un error al generar el PDF. Abriendo diálogo de impresión directa...',
        isSuccess: false,
      });
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Standalone print handler bypassing iframe sandbox quirks
  const handlePrint = () => {
    if (!printSheetRef.current) {
      window.print();
      return;
    }

    try {
      const htmlContent = printSheetRef.current.innerHTML;
      const docTitle =
        printType === 'teacher'
          ? `Horario Docente - ${selectedTeacher}`
          : printType === 'group'
          ? `Horario Escolar - Grupo ${currentGroup?.name}`
          : `Carga Académica General`;

      // Create isolated printing iframe
      const printIframe = document.createElement('iframe');
      printIframe.setAttribute(
        'style',
        'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
      );
      document.body.appendChild(printIframe);

      const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="utf-8" />
              <title>${docTitle}</title>
              <style>
                @page {
                  size: letter landscape;
                  margin: 8mm;
                }
                * {
                  box-sizing: border-box;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body {
                  margin: 0;
                  padding: 12px;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #0f172a;
                  background-color: #ffffff !important;
                  font-size: 11px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  page-break-inside: auto;
                  margin-top: 8px;
                }
                th, td {
                  border: 1px solid #475569 !important;
                  padding: 6px 4px;
                  text-align: center;
                }
                th {
                  background-color: #e2e8f0 !important;
                  font-weight: 800;
                  text-transform: uppercase;
                  font-size: 10px;
                }
                tr {
                  page-break-inside: avoid;
                }
                .text-amber-800 { color: #92400e !important; }
                .text-amber-900 { color: #78350f !important; }
                .bg-slate-50 { background-color: #f8fafc !important; }
                .bg-slate-100 { background-color: #f1f5f9 !important; }
                .bg-slate-200 { background-color: #e2e8f0 !important; }
                .border-slate-400 { border-color: #94a3b8 !important; }
                .border-slate-900 { border-color: #0f172a !important; }
                .border-slate-300 { border-color: #cbd5e1 !important; }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `);
        iframeDoc.close();

        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (e) {
            console.warn('Iframe print error, falling back to window.print()', e);
            window.print();
          } finally {
            setTimeout(() => {
              if (document.body.contains(printIframe)) {
                document.body.removeChild(printIframe);
              }
            }, 3000);
          }
        }, 300);
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Print iframe could not be created, using window.print()', err);
      window.print();
    }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Impresión Oficial y Guardar en PDF"
      backdropClassName="print:p-0 print:bg-white print-modal-overlay"
    >
      <div
        className="relative z-[10000] bg-[#111318] rounded-2xl w-full max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-4xl shadow-2xl border border-slate-800/90 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header & Actions Bar (Hidden during print) */}
        <div className="p-4 bg-[#0a0c10] border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Printer className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 font-serif">
                Impresión Oficial y Guardar en PDF
              </h3>
              <p className="text-[11px] text-slate-400">
                Formato oficial SEP con cédula, sellos de dirección e inspección
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Primary: Save as PDF button */}
            <button
              id="save-pdf-btn"
              onClick={handleSaveAsPDF}
              disabled={isGeneratingPdf}
              title="Descargar cédula en formato PDF vectorial de alta calidad"
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Guardar como PDF</span>
                </>
              )}
            </button>

            {/* Print button */}
            <button
              id="send-print-btn"
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              title="Abrir vista de impresión de la cédula"
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1c202a] hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-lg text-xs transition-colors border border-slate-700 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options Toolbar (Hidden during print) */}
        <div className="p-3.5 bg-[#16181f] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          {/* View Mode Switch */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                setPrintType('teacher');
                setStatusMessage(null);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                printType === 'teacher'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'bg-[#0a0a0a] text-slate-300 border border-slate-700 hover:text-slate-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Docente Individual</span>
            </button>

            <button
              onClick={() => {
                setPrintType('group');
                setStatusMessage(null);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                printType === 'group'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'bg-[#0a0a0a] text-slate-300 border border-slate-700 hover:text-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Grupo Escolar</span>
            </button>

            <button
              onClick={() => {
                setPrintType('load');
                setStatusMessage(null);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                printType === 'load'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'bg-[#0a0a0a] text-slate-300 border border-slate-700 hover:text-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Plantilla de Carga</span>
            </button>
          </div>

          {/* Teacher Selector */}
          {printType === 'teacher' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-300">Seleccionar Docente:</span>
              <select
                value={selectedTeacher}
                onChange={(e) => {
                  setSelectedTeacher(e.target.value);
                  setStatusMessage(null);
                }}
                className="bg-[#0a0a0a] border border-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 text-slate-100 focus:ring-2 focus:ring-amber-500/30"
              >
                {allTeachers.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Group Selector */}
          {printType === 'group' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-300">Seleccionar Grupo:</span>
              <select
                value={selectedGroupId}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setStatusMessage(null);
                }}
                className="bg-[#0a0a0a] border border-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 text-slate-100 focus:ring-2 focus:ring-amber-500/30"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    Grupo {g.name} ({g.grade}º Grado)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div
            className={`p-2.5 px-4 text-xs font-bold flex items-center space-x-2 border-b print:hidden ${
              statusMessage.isSuccess
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
            }`}
          >
            {statusMessage.isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Printable Preview Sheet Container */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 bg-[#0a0a0a]/70 print:bg-white print:p-0">
          <div
            ref={printSheetRef}
            className="print-sheet-card bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-xl print:shadow-none print:rounded-none print:p-2 space-y-5 max-w-3xl mx-auto border border-slate-200"
          >
            {/* Official SEP Letterhead */}
            <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                SECRETARÍA DE EDUCACIÓN • SUBSECRETARÍA DE EDUCACIÓN BÁSICA
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 font-serif">
                {schoolInfo.name}
              </h1>
              <div className="text-[11px] font-bold text-slate-700 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <span>{schoolInfo.schoolYear}</span>
                <span>•</span>
                <span>{schoolInfo.workCenterKey}</span>
                <span>•</span>
                <span>{schoolInfo.zone}</span>
                <span>•</span>
                <span>{schoolInfo.regionalUnit}</span>
                <span>•</span>
                <span className="font-extrabold text-amber-900">{schoolInfo.shift}</span>
              </div>
            </div>

            {/* Document Title & Target Metadata Header */}
            {printType === 'teacher' && (
              <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Cédula de Horario Individual del Docente
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                    Prof(a). {selectedTeacher}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                    Asignatura: {currentTeacherStats.subjects.join(', ') || 'N/A'} • Grupos:{' '}
                    {currentTeacherStats.groups.join(', ') || 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Carga Semanal</div>
                  <div className="text-sm sm:text-base font-black text-amber-800">
                    {currentTeacherStats.totalHours} Horas Lectivas
                  </div>
                </div>
              </div>
            )}

            {printType === 'group' && (
              <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Horario Escolar Oficial del Grupo
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                    Grupo {currentGroup.name} ({currentGroup.grade}º Grado de Secundaria)
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                    Asesor(a) de Grupo: {currentGroup.advisor || 'Sin Asignar'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Jornada Semanal</div>
                  <div className="text-sm sm:text-base font-black text-amber-800">
                    35 Horas de Clase (7 diarias)
                  </div>
                </div>
              </div>
            )}

            {printType === 'load' && (
              <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Plantilla General de Distribución Académica y Carga Docente
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                    Resumen Oficial de Asignaturas y Personal Docente
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                    Total de Grupos: {groups.length} • Total de Docentes: {allTeachers.length}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Total Horas</div>
                  <div className="text-sm sm:text-base font-black text-amber-800">
                    {academicLoads.reduce((sum, l) => sum + (l.weeklyHours || 0), 0)} Horas / Sem
                  </div>
                </div>
              </div>
            )}

            {/* Timetable Print Grid (for teacher and group modes) */}
            {printType !== 'load' && (
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-400 font-black text-slate-900 uppercase text-[10px]">
                    <th className="p-2 border border-slate-400 text-center w-28">Hora / Módulo</th>
                    {DAYS_OF_WEEK.map((d) => (
                      <th key={d} className="p-2 border border-slate-400 text-center">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeSlots.map((slot) => {
                    const renderDayColumns = (partSubLabel?: string) => {
                      return DAYS_OF_WEEK.map((day) => {
                        let cellContent = '-';
                        let subContent = '';

                        if (printType === 'teacher') {
                          const found = entries.find(
                            (e) =>
                              e.day === day &&
                              e.slot === slot.id &&
                              normalizeName(e.teacherName) === normalizeName(selectedTeacher)
                          );
                          if (found) {
                            cellContent = `Grupo ${found.groupId}`;
                            subContent = found.subject;
                          }
                        } else {
                          const found = entries.find(
                            (e) =>
                              e.day === day &&
                              e.slot === slot.id &&
                              e.groupId.trim().toUpperCase() === selectedGroupId.trim().toUpperCase()
                          );
                          if (found) {
                            cellContent = found.subject;
                            subContent = found.teacherName;
                          }
                        }

                        return (
                          <td
                            key={day}
                            className="p-2 border border-slate-400 text-center align-middle font-medium"
                          >
                            <div className="font-bold text-slate-900">{cellContent}</div>
                            {subContent && (
                              <div className="text-[10px] text-slate-600 mt-0.5">{subContent}</div>
                            )}
                            {partSubLabel && cellContent !== '-' && (
                              <div className="text-[9px] text-amber-800 font-semibold mt-0.5">
                                {partSubLabel}
                              </div>
                            )}
                          </td>
                        );
                      });
                    };

                    if (slot.isSplit) {
                      return (
                        <React.Fragment key={slot.id}>
                          {/* Part 1 (20m before recess) */}
                          <tr>
                            <td className="p-2 border border-slate-400 text-center bg-slate-100 font-bold">
                              <div>{slot.splitPart1?.name || `${slot.name} (Parte 1)`}</div>
                              <div className="text-[10px] text-slate-600 font-normal">
                                {slot.splitPart1?.startTime || '15:00'} - {slot.splitPart1?.endTime || '15:20'}
                              </div>
                              <div className="text-[9px] text-slate-500 font-medium">20 min de clase</div>
                            </td>
                            {renderDayColumns('20m antes del receso')}
                          </tr>

                          {/* Recess in between */}
                          <tr className="bg-slate-100 font-bold text-center border border-slate-400">
                            <td
                              colSpan={6}
                              className="py-1 text-[11px] uppercase tracking-wider text-slate-800 bg-slate-200/70"
                            >
                              {slot.recessLabel || '☕ Receso Escolar 2º Grado (15:20 - 15:40 hrs • 20 min)'}
                            </td>
                          </tr>

                          {/* Part 2 (20m after recess) */}
                          <tr>
                            <td className="p-2 border border-slate-400 text-center bg-slate-100 font-bold">
                              <div>{slot.splitPart2?.name || `${slot.name} (Parte 2)`}</div>
                              <div className="text-[10px] text-slate-600 font-normal">
                                {slot.splitPart2?.startTime || '15:40'} - {slot.splitPart2?.endTime || '16:00'}
                              </div>
                              <div className="text-[9px] text-slate-500 font-medium">20 min de clase</div>
                            </td>
                            {renderDayColumns('20m después del receso')}
                          </tr>
                        </React.Fragment>
                      );
                    }

                    return (
                      <React.Fragment key={slot.id}>
                        <tr>
                          <td className="p-2 border border-slate-400 text-center bg-slate-100 font-bold">
                            <div>{slot.name}</div>
                            <div className="text-[10px] text-slate-600 font-normal">
                              {slot.startTime} - {slot.endTime}
                            </div>
                          </td>

                          {renderDayColumns()}
                        </tr>

                        {slot.isRecessAfter && (
                          <tr className="bg-slate-100 font-bold text-center border border-slate-400">
                            <td
                              colSpan={6}
                              className="py-1 text-[11px] uppercase tracking-wider text-slate-700"
                            >
                              {slot.recessLabel || recessLabel}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Academic Load Table (for 'load' mode) */}
            {printType === 'load' && (
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-400 font-black text-slate-900 uppercase text-[10px]">
                    <th className="p-2 border border-slate-400 text-center w-16">Grupo</th>
                    <th className="p-2 border border-slate-400 text-left">Asignatura</th>
                    <th className="p-2 border border-slate-400 text-left">Docente Titular</th>
                    <th className="p-2 border border-slate-400 text-center w-20">Hrs / Sem</th>
                  </tr>
                </thead>
                <tbody>
                  {academicLoads.map((load, idx) => (
                    <tr key={`${load.groupId}-${load.subject}-${idx}`}>
                      <td className="p-1.5 border border-slate-400 text-center font-bold bg-slate-50">
                        {load.groupId}
                      </td>
                      <td className="p-1.5 border border-slate-400 text-slate-900 font-semibold">
                        {load.subject}
                      </td>
                      <td className="p-1.5 border border-slate-400 text-slate-800">
                        {load.teacherName}
                      </td>
                      <td className="p-1.5 border border-slate-400 text-center font-bold text-amber-900">
                        {load.weeklyHours} hrs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Official Signatures Block */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
              <div className="space-y-10">
                <div className="border-b border-slate-800 w-4/5 mx-auto" />
                <div>
                  <div className="font-bold text-slate-900">
                    {printType === 'teacher'
                      ? selectedTeacher
                      : printType === 'group'
                      ? currentGroup.advisor || 'Asesor de Grupo'
                      : 'Responsable de Carga'}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    {printType === 'teacher'
                      ? 'Firma del Docente'
                      : printType === 'group'
                      ? 'Firma Asesor(a)'
                      : 'Firma de Elaboración'}
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="border-b border-slate-800 w-4/5 mx-auto" />
                <div>
                  <div className="font-bold text-slate-900">Dirección Escolar</div>
                  <div className="text-[10px] text-slate-500 uppercase">Vo. Bo. Director(a)</div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="border-b border-slate-800 w-4/5 mx-auto" />
                <div>
                  <div className="font-bold text-slate-900">Inspección de Zona</div>
                  <div className="text-[10px] text-slate-500 uppercase">Sello y Validación</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar Controls for Mobile and Ease of Access */}
        <div className="p-3.5 bg-[#0a0c10] border-t border-slate-800 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-400 hidden sm:block">
            {printType === 'teacher' && `Cédula: Prof(a). ${selectedTeacher}`}
            {printType === 'group' && `Cédula: Grupo ${currentGroup?.name}`}
            {printType === 'load' && `Cédula: Plantilla General (${academicLoads.length} asignaturas)`}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleSaveAsPDF}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Descargando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Guardar como PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#1c202a] hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-lg text-xs transition-colors border border-slate-700 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
