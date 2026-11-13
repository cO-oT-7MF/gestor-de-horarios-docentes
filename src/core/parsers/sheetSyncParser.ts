import type { DayOfWeek, AcademicLoadItem } from '../../types';
import type { MomentoHorario, RegimenLaboral, SheetSyncRow } from '../models/teacher.types';

const VALID_DAYS: Record<string, DayOfWeek> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  MIÉRCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
};

function normalizeHeader(h: string): string {
  return h
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function detectDelimiter(headerLine: string): string {
  const counts = {
    ',': (headerLine.match(/,/g) || []).length,
    ';': (headerLine.match(/;/g) || []).length,
    '\t': (headerLine.match(/\t/g) || []).length,
  };
  if (counts['\t'] >= counts[','] && counts['\t'] >= counts[';']) return '\t';
  if (counts[';'] > counts[',']) return ';';
  return ',';
}

function normalizeRegimen(val: string): RegimenLaboral {
  const up = val.toUpperCase();
  if (up.includes('CONTRATO') || up.includes('HONORARIOS')) return 'CONTRATO';
  if (up.includes('INTERIN')) return 'INTERINATO';
  return 'BASE';
}

function normalizeMomento(val: string): MomentoHorario {
  const up = val.toUpperCase();
  if (up.includes('RECESO')) return 'RECESO';
  if (up.includes('ANTES')) return 'ANTES';
  if (up.includes('DESPUES') || up.includes('DESPUÉS')) return 'DESPUES';
  return 'COMPLETO';
}

function normalizeDiaLibre(val: string): DayOfWeek | 'NINGUNO' {
  const clean = val
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
  return VALID_DAYS[clean] || 'NINGUNO';
}

/**
 * Transforma una matriz de celdas (filas x columnas) en registros tipados de Sábana Base.
 */
export function parseMatrixToSheetSyncRows(rows: string[][]): SheetSyncRow[] {
  if (rows.length < 2) return [];

  // Detectar fila de encabezados (primera fila con >= 2 columnas no vacías)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const nonEmpty = rows[i].filter((c) => c.trim().length > 0).length;
    if (nonEmpty >= 2) {
      headerIdx = i;
      break;
    }
  }

  const headers = rows[headerIdx].map(normalizeHeader);
  const findCol = (candidates: string[]): number =>
    headers.findIndex((h) => candidates.some((c) => h === c || h.includes(c)));

  const colRfc = findCol(['RFC']);
  const colCurp = findCol(['CURP']);
  const colNombre = findCol(['NOMBRE', 'DOCENTE', 'PROFESOR', 'MAESTRO']);
  const colClave = findCol(['CLAVE_PRESUPUESTAL', 'CLAVE', 'PLAZA']);
  const colAsignatura = findCol(['ASIGNATURA', 'MATERIA', 'ESPECIALIDAD']);
  const colHorasBase = findCol(['HORAS_BASE', 'BASE', 'HRS_BASE']);
  const colHorasContrato = findCol(['HORAS_CONTRATO', 'CONTRATO', 'HRS_CONTRATO', 'HORAS']);
  const colRegimen = findCol(['REGIMEN_LABORAL', 'REGIMEN', 'TIPO_PLAZA']);
  const colDiaLibre = findCol(['DIA_LIBRE_SUGERIDO', 'DIA_LIBRE', 'LIBRE']);
  const colMomento = findCol(['MOMENTO_HORARIO', 'MOMENTO', 'DISPONIBILIDAD']);
  const colGrupos = findCol(['GRUPOS', 'GRUPOS_SUGERIDOS', 'GRUPO']);
  const colEmail = findCol(['EMAIL', 'CORREO']);
  const colWhatsapp = findCol(['WHATSAPP', 'TELEFONO', 'CELULAR']);

  const parsed: SheetSyncRow[] = [];

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => !c.trim())) continue;

    const nombre = colNombre >= 0 ? row[colNombre]?.trim() : '';
    const rfc = colRfc >= 0 ? row[colRfc]?.trim().toUpperCase() : '';
    if (!nombre && !rfc) continue;

    const horasBase = colHorasBase >= 0 ? parseInt(row[colHorasBase] || '0', 10) || 0 : 0;
    const horasContrato =
      colHorasContrato >= 0 ? parseInt(row[colHorasContrato] || '0', 10) || 0 : 0;

    const gruposRaw = colGrupos >= 0 ? row[colGrupos] || '' : '';
    const gruposSugeridos = gruposRaw
      .split(/[,;/\s]+/)
      .map((g) => g.trim().toUpperCase())
      .filter(Boolean);

    parsed.push({
      rfc: rfc || `RFC-GEN-${r}`,
      curp: colCurp >= 0 ? row[colCurp]?.trim().toUpperCase() : undefined,
      nombre: nombre || rfc,
      clavePresupuestal: colClave >= 0 ? row[colClave]?.trim() : undefined,
      asignatura: (colAsignatura >= 0 ? row[colAsignatura]?.trim() : '') || 'General',
      horasBase,
      horasContrato,
      regimenLaboral: colRegimen >= 0 ? normalizeRegimen(row[colRegimen] || '') : 'BASE',
      diaLibreSugerido: colDiaLibre >= 0 ? normalizeDiaLibre(row[colDiaLibre] || '') : 'NINGUNO',
      momentoHorario: colMomento >= 0 ? normalizeMomento(row[colMomento] || '') : 'COMPLETO',
      gruposSugeridos: gruposSugeridos.length > 0 ? gruposSugeridos : undefined,
      email: colEmail >= 0 ? row[colEmail]?.trim() : undefined,
      whatsapp: colWhatsapp >= 0 ? row[colWhatsapp]?.trim() : undefined,
    });
  }

  return parsed;
}

/**
 * Parsea texto CSV/TSV con autodetección de delimitador.
 */
export function parseCsvToSheetSyncRows(csvText: string): SheetSyncRow[] {
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const delimiter = detectDelimiter(lines[0]);
  const matrix = lines.map((line) => parseCsvLine(line, delimiter));
  return parseMatrixToSheetSyncRows(matrix);
}

/**
 * Extractor ligero de archivos .xlsx (ZIP + XML) usando DecompressionStream nativo del navegador.
 */
async function extractZipEntries(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const entries = new Map<string, Uint8Array>();

  let offset = 0;
  while (offset + 30 <= bytes.length) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break; // Local file header signature

    const compression = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);

    const nameStart = offset + 30;
    const fileName = new TextDecoder().decode(bytes.slice(nameStart, nameStart + fileNameLen));
    const dataStart = nameStart + fileNameLen + extraLen;
    const compressedData = bytes.slice(dataStart, dataStart + compressedSize);

    if (compression === 0) {
      entries.set(fileName, compressedData);
    } else if (compression === 8 && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(compressedData);
      writer.close();
      const decompressed = await new Response(ds.readable).arrayBuffer();
      entries.set(fileName, new Uint8Array(decompressed));
    }

    offset = dataStart + compressedSize;
  }

  return entries;
}

function parseXlsxXmlSheet(sheetXml: string, sharedStrings: string[]): string[][] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(sheetXml, 'application/xml');
  const rowNodes = Array.from(doc.getElementsByTagName('row'));
  const matrix: string[][] = [];

  for (const rowNode of rowNodes) {
    const rowValues: string[] = [];
    const cells = Array.from(rowNode.getElementsByTagName('c'));
    for (const cell of cells) {
      const ref = cell.getAttribute('r') || '';
      const colLetters = ref.replace(/[0-9]/g, '');
      let colIdx = 0;
      for (let i = 0; i < colLetters.length; i++) {
        colIdx = colIdx * 26 + (colLetters.charCodeAt(i) - 64);
      }
      colIdx = Math.max(0, colIdx - 1);

      const type = cell.getAttribute('t');
      const vNode = cell.getElementsByTagName('v')[0];
      const isNode = cell.getElementsByTagName('is')[0];
      let val = '';

      if (type === 's' && vNode?.textContent) {
        val = sharedStrings[parseInt(vNode.textContent, 10)] || '';
      } else if (type === 'inlineStr' && isNode) {
        val = isNode.textContent || '';
      } else if (vNode?.textContent) {
        val = vNode.textContent;
      }

      while (rowValues.length <= colIdx) rowValues.push('');
      rowValues[colIdx] = val.trim();
    }
    matrix.push(rowValues);
  }

  return matrix;
}

/**
 * Parseador unificado para archivos CSV, TSV o Excel (.xlsx).
 */
export async function parseSheetFile(file: File): Promise<SheetSyncRow[]> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.xlsx')) {
    const buffer = await file.arrayBuffer();
    const zipEntries = await extractZipEntries(buffer);
    const sharedBytes = zipEntries.get('xl/sharedStrings.xml');
    const sharedStrings: string[] = [];
    if (sharedBytes) {
      const xml = new TextDecoder().decode(sharedBytes);
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const siNodes = Array.from(doc.getElementsByTagName('si'));
      for (const si of siNodes) {
        sharedStrings.push(si.textContent || '');
      }
    }

    const sheetBytes =
      zipEntries.get('xl/worksheets/sheet1.xml') ||
      Array.from(zipEntries.entries()).find(([k]) => k.startsWith('xl/worksheets/sheet'))?.[1];

    if (!sheetBytes) {
      throw new Error('No se encontró ninguna hoja de cálculo válida dentro del archivo XLSX.');
    }

    const sheetXml = new TextDecoder().decode(sheetBytes);
    const matrix = parseXlsxXmlSheet(sheetXml, sharedStrings);
    return parseMatrixToSheetSyncRows(matrix);
  }

  const text = await file.text();
  return parseCsvToSheetSyncRows(text);
}

/**
 * Convierte filas de Sábana Base en AcademicLoadItem[] agrupados por grupo.
 */
export function convertSheetRowsToAcademicLoads(rows: SheetSyncRow[]): AcademicLoadItem[] {
  const byGroup = new Map<string, AcademicLoadItem>();

  for (const row of rows) {
    const totalHours = row.horasBase + row.horasContrato;
    const groups = row.gruposSugeridos && row.gruposSugeridos.length > 0 ? row.gruposSugeridos : ['1A'];
    const perGroup = Math.max(1, Math.floor(totalHours / groups.length));
    let remainder = Math.max(0, totalHours - perGroup * groups.length);

    for (const groupId of groups) {
      const assigned = perGroup + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      const gradeNum = parseInt(groupId.charAt(0), 10);
      const grade: 1 | 2 | 3 = gradeNum === 2 ? 2 : gradeNum === 3 ? 3 : 1;

      const existing = byGroup.get(groupId) || {
        groupId,
        groupName: `${grade}º${groupId.slice(1) || 'A'}`,
        grade,
        advisor: row.nombre,
        advisorTeacherId: row.rfc,
        subjects: {},
      };

      existing.subjects[row.asignatura] = {
        teacherName: row.nombre,
        teacherId: row.rfc,
        hours: assigned,
      };
      byGroup.set(groupId, existing);
    }
  }

  return Array.from(byGroup.values());
}

/**
 * Exporta filas normalizadas a CSV con BOM UTF-8 compatible con Excel.
 */
export function exportSheetRowsToCsv(rows: SheetSyncRow[]): string {
  const headers = [
    'RFC',
    'CURP',
    'Nombre',
    'Clave Presupuestal',
    'Asignatura',
    'Horas Base',
    'Horas Contrato',
    'Régimen Laboral',
    'Día Libre Sugerido',
    'Momento Horario',
    'Grupos Sugeridos',
    'Email',
    'WhatsApp',
  ];

  const escape = (v: string | number | undefined) => {
    const str = String(v ?? '');
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.rfc,
        r.curp,
        r.nombre,
        r.clavePresupuestal,
        r.asignatura,
        r.horasBase,
        r.horasContrato,
        r.regimenLaboral,
        r.diaLibreSugerido,
        r.momentoHorario,
        (r.gruposSugeridos || []).join(' '),
        r.email,
        r.whatsapp,
      ]
        .map(escape)
        .join(',')
    ),
  ];

  return '\uFEFF' + lines.join('\r\n');
}
