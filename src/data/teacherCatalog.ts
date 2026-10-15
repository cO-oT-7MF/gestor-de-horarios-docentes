import { Teacher } from '../types';

/**
 * Standardized Teacher Catalog for Escuela Secundaria General No. 129
 * Provides canonical IDs, RFC/Payroll keys, standardized display names,
 * recognized aliases for formatting deduplication, and active workload status.
 */
export const TEACHER_CATALOG: Teacher[] = [
  {
    id: 'DOC-ADRIANA',
    payrollId: 'RFC-ADRI-7804',
    name: 'ADRIANA',
    mainSubject: 'Formación Cívica y Ética',
    subjectId: 'fce',
    contractHours: 28,
    status: 'active',
    aliases: ['ADRIANA', 'ADRI', 'Adri', 'adriana'],
    email: 'adriana.fce@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0101',
  },
  {
    id: 'DOC-ANA-B',
    payrollId: 'RFC-ANAB-8109',
    name: 'ANA B.',
    mainSubject: 'Matemáticas',
    subjectId: 'matematicas',
    contractHours: 25,
    status: 'active',
    aliases: ['ANA B.', 'ANA B', 'Ana B', 'ana b', 'ana b.'],
    email: 'ana.matematicas@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0102',
  },
  {
    id: 'DOC-BRENDA-S',
    payrollId: 'RFC-BRES-8502',
    name: 'BRENDA S.',
    mainSubject: 'Inglés',
    subjectId: 'ingles',
    contractHours: 12,
    status: 'active',
    aliases: ['BRENDA S.', 'BRENDAS', 'Brenda sinai', 'BRENDA SINAI', 'brendas', 'brenda s.'],
    email: 'brenda.ingles@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0103',
  },
  {
    id: 'DOC-CAMARILLO',
    payrollId: 'RFC-CAMA-7411',
    name: 'CAMARILLO',
    mainSubject: 'Artes',
    subjectId: 'artes',
    contractHours: 7,
    status: 'active',
    aliases: ['CAMARILLO', 'Camarillo', 'camarillo'],
    email: 'camarillo.artes@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0104',
  },
  {
    id: 'DOC-CARLA',
    payrollId: 'RFC-CARL-8903',
    name: 'CARLA',
    mainSubject: 'Educación Física',
    subjectId: 'educacion_fisica',
    contractHours: 10,
    status: 'active',
    aliases: ['CARLA', 'Carla', 'carla'],
    email: 'carla.edufisica@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0105',
  },
  {
    id: 'DOC-CAROLINA',
    payrollId: 'RFC-CARO-8205',
    name: 'CAROLINA',
    mainSubject: 'Tecnología',
    subjectId: 'tecnologia',
    contractHours: 6,
    status: 'active',
    aliases: ['CAROLINA', 'Carolina', 'carolina'],
    email: 'carolina.tecnologia@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0106',
  },
  {
    id: 'DOC-CASTANON',
    payrollId: 'RFC-CAST-7607',
    name: 'CASTAÑON',
    mainSubject: 'Tecnología',
    subjectId: 'tecnologia',
    contractHours: 21,
    status: 'active',
    aliases: ['CASTAÑON', 'Castañon', 'castañon', 'CASTANON'],
    email: 'castanon.tecnologia@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0107',
  },
  {
    id: 'DOC-CESAR',
    payrollId: 'RFC-CESA-7912',
    name: 'CESAR',
    mainSubject: 'Educación Física',
    subjectId: 'educacion_fisica',
    contractHours: 35,
    status: 'active',
    aliases: ['CESAR', 'Cesar', 'cesar'],
    email: 'cesar.edufisica@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0108',
  },
  {
    id: 'DOC-CORAL',
    payrollId: 'RFC-CORA-8308',
    name: 'CORAL',
    mainSubject: 'Inglés',
    subjectId: 'ingles',
    contractHours: 29,
    status: 'active',
    aliases: ['CORAL', 'Coral', 'coral'],
    email: 'coral.ingles@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0109',
  },
  {
    id: 'DOC-DAVID',
    payrollId: 'RFC-DAVI-7701',
    name: 'DAVID',
    mainSubject: 'Formación Cívica y Ética',
    subjectId: 'fce',
    contractHours: 19,
    status: 'active',
    aliases: ['DAVID', 'David', 'david'],
    email: 'david.fce@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0110',
  },
  {
    id: 'DOC-ERASTO',
    payrollId: 'RFC-ERAS-7106',
    name: 'ERASTO',
    mainSubject: 'Formación Cívica y Ética',
    subjectId: 'fce',
    contractHours: 17,
    status: 'active',
    aliases: ['ERASTO', 'Erasto', 'erasto'],
    email: 'erasto.fce@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0111',
  },
  {
    id: 'DOC-GERARDO',
    payrollId: 'RFC-GERA-7504',
    name: 'GERARDO',
    mainSubject: 'Inglés',
    subjectId: 'ingles',
    contractHours: 33,
    status: 'active',
    aliases: ['GERARDO', 'Gerardo', 'gerardo'],
    email: 'gerardo.ingles@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0112',
  },
  {
    id: 'DOC-GRACIELA',
    payrollId: 'RFC-GRAC-7809',
    name: 'GRACIELA',
    mainSubject: 'Ciencias',
    subjectId: 'ciencias',
    contractHours: 30,
    status: 'active',
    aliases: ['GRACIELA', 'Graciela', 'graciela'],
    email: 'graciela.ciencias@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0113',
  },
  {
    id: 'DOC-GRACIELA-J',
    payrollId: 'RFC-GRAJ-8002',
    name: 'GRACIELA J.',
    mainSubject: 'Historia',
    subjectId: 'historia',
    contractHours: 12,
    status: 'active',
    aliases: ['GRACIELA J.', 'GRACIELA J', 'Graciela Y', 'GRACIELA Y', 'graciela j.', 'graciela y'],
    email: 'graciela.historia@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0114',
  },
  {
    id: 'DOC-INDHIRA',
    payrollId: 'RFC-INDH-8406',
    name: 'INDHIRA',
    mainSubject: 'Ciencias',
    subjectId: 'ciencias',
    contractHours: 22,
    status: 'active',
    aliases: ['INDHIRA', 'Indhira', 'indhira'],
    email: 'indhira.ciencias@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0115',
  },
  {
    id: 'DOC-JAIME',
    payrollId: 'RFC-JAIM-7310',
    name: 'JAIME',
    mainSubject: 'Ciencias',
    subjectId: 'ciencias',
    contractHours: 17,
    status: 'active',
    aliases: ['JAIME', 'Jaime', 'jaime'],
    email: 'jaime.ciencias@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0116',
  },
  {
    id: 'DOC-JESUS-S',
    payrollId: 'RFC-JESS-8105',
    name: 'JESUS S.',
    mainSubject: 'Educación Física',
    subjectId: 'educacion_fisica',
    contractHours: 10,
    status: 'active',
    aliases: ['JESUS S.', 'JESUS S', 'AYRTON J', 'Ayrton J', 'jesus s.', 'ayrton j'],
    email: 'jesus.edufisica@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0117',
  },
  {
    id: 'DOC-JIOVANA',
    payrollId: 'RFC-JIOV-8603',
    name: 'JIOVANA',
    mainSubject: 'Matemáticas',
    subjectId: 'matematicas',
    contractHours: 29,
    status: 'active',
    aliases: ['JIOVANA', 'Jovana', 'JOVANA', 'jiovana', 'jovana'],
    email: 'jiovana.matematicas@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0118',
  },
  {
    id: 'DOC-JORGE',
    payrollId: 'RFC-JORG-7208',
    name: 'JORGE',
    mainSubject: 'Historia',
    subjectId: 'historia',
    contractHours: 12,
    status: 'active',
    aliases: ['JORGE', 'Jorge', 'jorge'],
    email: 'jorge.historia@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0119',
  },
  {
    id: 'DOC-KAREN-R',
    payrollId: 'RFC-KARR-8707',
    name: 'KAREN R.',
    mainSubject: 'Español',
    subjectId: 'espanol',
    contractHours: 27,
    status: 'active',
    aliases: ['KAREN R.', 'KAREN R', 'KAREN', 'Karen A', 'KAREN A', 'karen r.', 'karen a', 'karen'],
    email: 'karen.espanol@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0120',
  },
  {
    id: 'DOC-KARY',
    payrollId: 'RFC-KARY-8511',
    name: 'KARY',
    mainSubject: 'Español',
    subjectId: 'espanol',
    contractHours: 17,
    status: 'active',
    aliases: ['KARY', 'Kary', 'kary'],
    email: 'kary.espanol@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0121',
  },
  {
    id: 'DOC-LUIS-E',
    payrollId: 'RFC-LUIE-7904',
    name: 'LUIS E.',
    mainSubject: 'Educación Física',
    subjectId: 'educacion_fisica',
    contractHours: 16,
    status: 'active',
    aliases: ['LUIS E.', 'LUIS E', 'Luis E', 'luis e.', 'luis e'],
    email: 'luis.edufisica@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0122',
  },
  {
    id: 'DOC-MANUEL',
    payrollId: 'RFC-MANU-7405',
    name: 'MANUEL',
    mainSubject: 'Historia',
    subjectId: 'historia',
    contractHours: 12,
    status: 'active',
    aliases: ['MANUEL', 'Manuel A.', 'Manuel', 'MANUEL A', 'manuel', 'manuel a.'],
    email: 'manuel.historia@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0123',
  },
  {
    id: 'DOC-MARCELA',
    payrollId: 'RFC-MARC-8012',
    name: 'MARCELA',
    mainSubject: 'Tecnología',
    subjectId: 'tecnologia',
    contractHours: 27,
    status: 'active',
    aliases: ['MARCELA', 'Marcela', 'marcela'],
    email: 'marcela.tecnologia@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0124',
  },
  {
    id: 'DOC-MARTHA',
    payrollId: 'RFC-MART-7603',
    name: 'MARTHA',
    mainSubject: 'Matemáticas',
    subjectId: 'matematicas',
    contractHours: 20,
    status: 'active',
    aliases: ['MARTHA', 'Martha', 'martha'],
    email: 'martha.matematicas@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0125',
  },
  {
    id: 'DOC-MATA',
    payrollId: 'RFC-MATA-7708',
    name: 'MATA',
    mainSubject: 'Historia',
    subjectId: 'historia',
    contractHours: 19,
    status: 'active',
    aliases: ['MATA', 'Mata', 'mata'],
    email: 'mata.historia@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0126',
  },
  {
    id: 'DOC-MIRNA',
    payrollId: 'RFC-MIRN-8301',
    name: 'MIRNA',
    mainSubject: 'Historia',
    subjectId: 'historia',
    contractHours: 7,
    status: 'active',
    aliases: ['MIRNA', 'Myrna', 'MYRNA', 'mirna', 'myrna'],
    email: 'mirna.historia@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0127',
  },
  {
    id: 'DOC-NORMA-I',
    payrollId: 'RFC-NORI-7512',
    name: 'NORMA I.',
    mainSubject: 'Tecnología',
    subjectId: 'tecnologia',
    contractHours: 22,
    status: 'active',
    aliases: ['NORMA I.', 'NORMA I', 'Norma I', 'norma i.', 'norma i'],
    email: 'norma.tecnologia@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0128',
  },
  {
    id: 'DOC-OLGA',
    payrollId: 'RFC-OLGA-7204',
    name: 'OLGA',
    mainSubject: 'Matemáticas',
    subjectId: 'matematicas',
    contractHours: 35,
    status: 'active',
    aliases: ['OLGA', 'Olga', 'olga'],
    email: 'olga.matematicas@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0129',
  },
  {
    id: 'DOC-OMAR',
    payrollId: 'RFC-OMAR-7810',
    name: 'OMAR',
    mainSubject: 'Artes',
    subjectId: 'artes',
    contractHours: 35,
    status: 'active',
    aliases: ['OMAR', 'Omar', 'omar'],
    email: 'omar.artes@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0130',
  },
  {
    id: 'DOC-OMEL',
    payrollId: 'RFC-OMEL-8107',
    name: 'OMEL',
    mainSubject: 'Tutoría',
    subjectId: 'tutoria',
    contractHours: 10,
    status: 'active',
    aliases: ['OMEL', 'Omel', 'omel'],
    email: 'omel.tutoria@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0131',
  },
  {
    id: 'DOC-ROCIO',
    payrollId: 'RFC-ROCI-7609',
    name: 'ROCIO',
    mainSubject: 'Español',
    subjectId: 'espanol',
    contractHours: 30,
    status: 'active',
    aliases: ['ROCIO', 'Rocio', 'rocio'],
    email: 'rocio.espanol@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0132',
  },
  {
    id: 'DOC-ROEL',
    payrollId: 'RFC-ROEL-7901',
    name: 'ROEL',
    mainSubject: 'Matemáticas',
    subjectId: 'matematicas',
    contractHours: 31,
    status: 'active',
    aliases: ['ROEL', 'Roel', 'roel'],
    email: 'roel.matematicas@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0133',
  },
  {
    id: 'DOC-ROMERO',
    payrollId: 'RFC-ROME-7306',
    name: 'ROMERO',
    mainSubject: 'Ciencias',
    subjectId: 'ciencias',
    contractHours: 8,
    status: 'active',
    aliases: ['ROMERO', 'Romero', 'romero'],
    email: 'romero.ciencias@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0134',
  },
  {
    id: 'DOC-ROSA-M-T',
    payrollId: 'RFC-ROMT-7911',
    name: 'ROSA M. T.',
    mainSubject: 'Español',
    subjectId: 'espanol',
    contractHours: 24,
    status: 'active',
    aliases: [
      'ROSA M. T.',
      'ROSA M T',
      'ROSA M.',
      'ROSA M',
      'Rosa M T',
      'Rosa M.',
      'Rosa',
      'ROSA',
      'rosa m. t.',
      'rosa m t',
      'rosa m.',
      'rosa',
    ],
    email: 'rosa.espanol@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0135',
  },
  {
    id: 'DOC-SERGIO-E',
    payrollId: 'RFC-SERE-7702',
    name: 'SERGIO E.',
    mainSubject: 'Español',
    subjectId: 'espanol',
    contractHours: 30,
    status: 'active',
    aliases: ['SERGIO E.', 'SERGIO E', 'Sergio E.', 'sergio e.', 'sergio e'],
    email: 'sergio.espanol@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0136',
  },
  {
    id: 'DOC-SUSANA',
    payrollId: 'RFC-SUSA-8208',
    name: 'SUSANA',
    mainSubject: 'Matemáticas',
    subjectId: 'matematicas',
    contractHours: 20,
    status: 'active',
    aliases: ['SUSANA', 'Susana', 'susana'],
    email: 'susana.matematicas@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0137',
  },
  {
    id: 'DOC-TANIA',
    payrollId: 'RFC-TANI-8404',
    name: 'TANIA',
    mainSubject: 'Geografía',
    subjectId: 'geografia',
    contractHours: 32,
    status: 'active',
    aliases: ['TANIA', 'Tania', 'tania'],
    email: 'tania.geografia@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0138',
  },
  {
    id: 'DOC-VALERIA',
    payrollId: 'RFC-VALE-8806',
    name: 'VALERIA',
    mainSubject: 'Ciencias',
    subjectId: 'ciencias',
    contractHours: 18,
    status: 'active',
    aliases: ['VALERIA', 'Valeria', 'valeria'],
    email: 'valeria.ciencias@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0139',
  },
  {
    id: 'DOC-YAIR-O',
    payrollId: 'RFC-YAIO-8610',
    name: 'YAIR O.',
    mainSubject: 'Ciencias',
    subjectId: 'ciencias',
    contractHours: 26,
    status: 'active',
    aliases: ['YAIR O.', 'YAIR O', 'YAIR', 'Yair O.', 'yair o.', 'yair'],
    email: 'yair.ciencias@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0140',
  },
  // Inactive / No Workload catalog entries (for demonstration and strict validation)
  {
    id: 'DOC-INACTIVO-PERMISO',
    payrollId: 'RFC-INAC-9001',
    name: 'DOCENTE EN LICENCIA',
    mainSubject: 'Sin Asignar',
    subjectId: 'tutoria',
    contractHours: 0,
    status: 'no_workload',
    aliases: ['DOCENTE EN LICENCIA', 'DOCENTE LICENCIA', 'LICENCIA MEDICA'],
    email: 'licencia.personal@secundaria129.edu.mx',
    whatsapp: '+52 55 4123 0199',
  },
];

// Build fast lookup maps
const aliasToCanonicalName = new Map<string, string>();
const aliasToTeacherId = new Map<string, string>();
const idToTeacher = new Map<string, Teacher>();

function normalizeLookupKey(str: string): string {
  return str
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ');
}

// Populate indexes
TEACHER_CATALOG.forEach((t) => {
  idToTeacher.set(t.id, t);
  aliasToCanonicalName.set(normalizeLookupKey(t.name), t.name);
  aliasToTeacherId.set(normalizeLookupKey(t.name), t.id);

  if (t.payrollId) {
    aliasToCanonicalName.set(normalizeLookupKey(t.payrollId), t.name);
    aliasToTeacherId.set(normalizeLookupKey(t.payrollId), t.id);
  }

  if (t.aliases) {
    t.aliases.forEach((alias) => {
      aliasToCanonicalName.set(normalizeLookupKey(alias), t.name);
      aliasToTeacherId.set(normalizeLookupKey(alias), t.id);
    });
  }
});

/**
 * Standardize any free-text teacher name or alias to its canonical display name.
 * Handles variations like:
 * - "BRENDAS" / "Brenda sinai" -> "BRENDA S."
 * - "ROSA M." / "ROSA M T" / "Rosa" -> "ROSA M. T."
 * - "KAREN" / "Karen A" -> "KAREN R."
 * - "Adri" -> "ADRIANA"
 * - "Ana B" -> "ANA B."
 * - "Luis E" -> "LUIS E."
 * - "Manuel A." -> "MANUEL"
 * - etc.
 */
export function standardizeTeacherName(rawName: string): string {
  if (!rawName || !rawName.trim()) return '';
  const key = normalizeLookupKey(rawName);
  const matched = aliasToCanonicalName.get(key);
  if (matched) return matched;

  // If not found in catalog, format cleanly (trim multiple spaces)
  return rawName.trim().replace(/\s+/g, ' ');
}

/**
 * Resolve the unique identifier for a teacher from their name or alias.
 */
export function getCanonicalTeacherId(rawNameOrId: string): string {
  if (!rawNameOrId || !rawNameOrId.trim()) return '';
  const key = normalizeLookupKey(rawNameOrId);
  const matchedId = aliasToTeacherId.get(key);
  if (matchedId) return matchedId;

  // Fallback slug ID if not in catalog
  return `DOC-${key.replace(/\s+/g, '-')}`;
}

/**
 * Get the full Teacher object by unique ID.
 */
export function getTeacherById(id: string): Teacher | undefined {
  return idToTeacher.get(id);
}

/**
 * Get the full Teacher object by any name or alias.
 */
export function getTeacherByNameOrAlias(nameOrAlias: string): Teacher | undefined {
  const teacherId = getCanonicalTeacherId(nameOrAlias);
  return idToTeacher.get(teacherId);
}

/**
 * Check if a teacher is active and has assigned workload.
 * Excludes teachers with 0 hours or marked inactive.
 */
export function isTeacherActive(nameOrAlias: string, totalWorkloadHours?: number): boolean {
  if (totalWorkloadHours !== undefined && totalWorkloadHours <= 0) {
    return false;
  }
  const teacher = getTeacherByNameOrAlias(nameOrAlias);
  if (!teacher) return true; // Default to true if uncatalogued active teacher
  return teacher.status !== 'inactive' && teacher.status !== 'no_workload';
}

/**
 * Prevent free-text string pollution: Validates or adapts teacher inputs against the catalog.
 */
export function validateAndCanonicalizeTeacher(input: string): {
  isValid: boolean;
  standardizedName: string;
  teacherId: string;
  isRegistered: boolean;
  payrollId?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      standardizedName: '',
      teacherId: '',
      isRegistered: false,
    };
  }

  const standardizedName = standardizeTeacherName(trimmed);
  const teacherId = getCanonicalTeacherId(trimmed);
  const teacher = idToTeacher.get(teacherId);

  return {
    isValid: true,
    standardizedName,
    teacherId,
    isRegistered: !!teacher,
    payrollId: teacher?.payrollId,
  };
}

/**
 * Interface representing standardized contact details for an educator
 */
export interface TeacherContactDetails {
  teacherName: string;
  email: string;
  whatsapp: string;
  displayPhone: string;
  waCleanNumber: string;
  mailtoUrl: string;
  waUrl: string;
  isCustomized?: boolean;
}

export interface CustomTeacherContactEntry {
  email?: string;
  whatsapp?: string;
  updatedAt?: string;
}

const CUSTOM_CONTACTS_STORAGE_KEY = 'sec129_custom_teacher_contacts';

// Load stored contact overrides from localStorage
function loadCustomContactsFromStorage(): Record<string, CustomTeacherContactEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_CONTACTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading custom teacher contacts:', err);
  }
  return {};
}

// In-memory registry of custom overrides keyed by canonical teacher ID
const customContactsMap = new Map<string, CustomTeacherContactEntry>();

// Initialize on module load
try {
  const initialCustom = loadCustomContactsFromStorage();
  for (const [key, val] of Object.entries(initialCustom)) {
    customContactsMap.set(key, val);
  }
} catch {
  // Ignore in SSR
}

function persistCustomContacts(): void {
  if (typeof window === 'undefined') return;
  try {
    const obj: Record<string, CustomTeacherContactEntry> = {};
    customContactsMap.forEach((val, key) => {
      obj[key] = val;
    });
    localStorage.setItem(CUSTOM_CONTACTS_STORAGE_KEY, JSON.stringify(obj));
  } catch (err) {
    console.warn('Error persisting custom teacher contacts:', err);
  }
}

/**
 * Format phone string into clean display format (+52 ...) and WhatsApp-ready digits
 */
export function formatWhatsAppNumber(rawPhone: string): { displayPhone: string; waCleanNumber: string } {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) {
    return { displayPhone: '+52 55 4123 0100', waCleanNumber: '525541230100' };
  }

  let fullDigits = digits;
  // If user entered 10 digits (e.g. 5512345678), prepend Mexico country code 52
  if (digits.length === 10) {
    fullDigits = `52${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    fullDigits = `1${digits.slice(1)}`;
  }

  // Generate spaced display phone
  let displayPhone = rawPhone.trim();
  if (!displayPhone.startsWith('+')) {
    if (fullDigits.startsWith('52') && fullDigits.length === 12) {
      displayPhone = `+52 ${fullDigits.slice(2, 4)} ${fullDigits.slice(4, 8)} ${fullDigits.slice(8)}`;
    } else {
      displayPhone = `+${fullDigits}`;
    }
  }

  return {
    displayPhone,
    waCleanNumber: fullDigits,
  };
}

/**
 * Retrieve verified or deterministic contact details for any teacher name or ID,
 * prioritizing any direct user customizations or imported data.
 */
export function getTeacherContactInfo(rawNameOrAlias: string): TeacherContactDetails {
  const teacher = getTeacherByNameOrAlias(rawNameOrAlias);
  const teacherId = teacher ? teacher.id : getCanonicalTeacherId(rawNameOrAlias);
  const canonicalName = teacher ? teacher.name : (rawNameOrAlias.trim() || 'Docente');

  // Check for custom override
  const custom = customContactsMap.get(teacherId) || customContactsMap.get(normalizeLookupKey(canonicalName));

  // Format slug for fallback email
  const nameSlug = canonicalName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);

  const fallbackEmail = `${nameSlug}.docente@secundaria129.edu.mx`;
  const defaultEmail = teacher?.email || fallbackEmail;
  const email = (custom?.email && custom.email.trim()) ? custom.email.trim() : defaultEmail;

  const defaultWhatsapp = teacher?.whatsapp || '+52 55 4123 0100';
  const rawWhatsapp = (custom?.whatsapp && custom.whatsapp.trim()) ? custom.whatsapp.trim() : defaultWhatsapp;
  const { displayPhone, waCleanNumber } = formatWhatsAppNumber(rawWhatsapp);

  const isCustomized = Boolean(custom && (custom.email || custom.whatsapp));

  const subjectEnc = encodeURIComponent(`Aviso Escolar - Secundaria General 129`);
  const bodyEnc = encodeURIComponent(`Estimado(a) Prof. ${canonicalName}:\n\n`);
  const mailtoUrl = `mailto:${email}?subject=${subjectEnc}&body=${bodyEnc}`;

  const waTextEnc = encodeURIComponent(`Hola Prof. ${canonicalName}, le contacto de la Dirección / Coordinación de la Secundaria General No. 129:`);
  const waUrl = `https://wa.me/${waCleanNumber}?text=${waTextEnc}`;

  return {
    teacherName: canonicalName,
    email,
    whatsapp: rawWhatsapp,
    displayPhone,
    waCleanNumber,
    mailtoUrl,
    waUrl,
    isCustomized,
  };
}

/**
 * Direct Save / Update for a single teacher's contact details.
 * Reflects immediately across the app without requiring a page refresh.
 */
export function saveTeacherCustomContact(
  nameOrAlias: string,
  email?: string,
  whatsapp?: string
): TeacherContactDetails {
  const teacher = getTeacherByNameOrAlias(nameOrAlias);
  const teacherId = teacher ? teacher.id : getCanonicalTeacherId(nameOrAlias);
  const canonicalName = teacher ? teacher.name : standardizeTeacherName(nameOrAlias);

  const cleanEmail = email?.trim() || '';
  const cleanWhatsapp = whatsapp?.trim() || '';

  const entry: CustomTeacherContactEntry = {
    email: cleanEmail,
    whatsapp: cleanWhatsapp,
    updatedAt: new Date().toISOString(),
  };

  customContactsMap.set(teacherId, entry);
  customContactsMap.set(normalizeLookupKey(canonicalName), entry);

  // Also sync in-memory teacher catalog and map if found
  if (teacher) {
    if (cleanEmail) teacher.email = cleanEmail;
    if (cleanWhatsapp) teacher.whatsapp = cleanWhatsapp;
  }

  persistCustomContacts();

  // Notify active components via window CustomEvent
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sec129_teacher_contacts_updated', {
        detail: { teacherId, teacherName: canonicalName, email: cleanEmail, whatsapp: cleanWhatsapp },
      })
    );
  }

  return getTeacherContactInfo(canonicalName);
}

/**
 * Batch update teacher contacts from CSV / Excel sheet import.
 * Returns the count of teachers successfully updated.
 */
export function saveBatchTeacherContacts(
  contactList: Array<{ nameOrAlias: string; email?: string; whatsapp?: string }>
): number {
  if (!contactList || contactList.length === 0) return 0;

  let updatedCount = 0;

  for (const item of contactList) {
    if (!item.nameOrAlias || (!item.email && !item.whatsapp)) continue;

    const teacher = getTeacherByNameOrAlias(item.nameOrAlias);
    const teacherId = teacher ? teacher.id : getCanonicalTeacherId(item.nameOrAlias);
    const canonicalName = teacher ? teacher.name : standardizeTeacherName(item.nameOrAlias);

    const existing = customContactsMap.get(teacherId) || {};
    const newEmail = item.email?.trim() || existing.email || (teacher?.email ?? '');
    const newWhatsapp = item.whatsapp?.trim() || existing.whatsapp || (teacher?.whatsapp ?? '');

    const entry: CustomTeacherContactEntry = {
      email: newEmail,
      whatsapp: newWhatsapp,
      updatedAt: new Date().toISOString(),
    };

    customContactsMap.set(teacherId, entry);
    customContactsMap.set(normalizeLookupKey(canonicalName), entry);

    if (teacher) {
      if (item.email?.trim()) teacher.email = item.email.trim();
      if (item.whatsapp?.trim()) teacher.whatsapp = item.whatsapp.trim();
    }

    updatedCount++;
  }

  persistCustomContacts();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sec129_teacher_contacts_updated', {
        detail: { count: updatedCount },
      })
    );
  }

  return updatedCount;
}

/**
 * Reset a teacher's contact details back to official catalog defaults.
 */
export function resetTeacherContact(nameOrAlias: string): void {
  const teacher = getTeacherByNameOrAlias(nameOrAlias);
  const teacherId = teacher ? teacher.id : getCanonicalTeacherId(nameOrAlias);
  const canonicalName = teacher ? teacher.name : standardizeTeacherName(nameOrAlias);

  customContactsMap.delete(teacherId);
  customContactsMap.delete(normalizeLookupKey(canonicalName));

  persistCustomContacts();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sec129_teacher_contacts_updated', {
        detail: { teacherId, teacherName: canonicalName, reset: true },
      })
    );
  }
}

/**
 * Reset all custom contact overrides back to defaults.
 */
export function resetAllTeacherContacts(): void {
  customContactsMap.clear();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CUSTOM_CONTACTS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('sec129_teacher_contacts_updated', { detail: { resetAll: true } }));
  }
}

/**
 * Export teacher directory in CSV format with contact fields
 */
export function exportTeacherContactsCSV(teachersList?: string[]): string {
  const headers = ['DOCENTE', 'RFC_NOMINA', 'MATERIA_PRINCIPAL', 'HORAS_CONTRATO', 'EMAIL', 'WHATSAPP'];
  const rows: string[] = [headers.join(',')];

  const list = teachersList && teachersList.length > 0
    ? teachersList
    : TEACHER_CATALOG.filter((t) => t.status !== 'inactive').map((t) => t.name);

  for (const name of list) {
    const teacher = getTeacherByNameOrAlias(name);
    const contact = getTeacherContactInfo(name);
    const rfc = teacher?.payrollId || 'RFC-PENDIENTE';
    const mainSubject = teacher?.mainSubject || 'Docencia';
    const hours = teacher?.contractHours || 0;

    rows.push(
      `"${contact.teacherName}","${rfc}","${mainSubject}",${hours},"${contact.email}","${contact.whatsapp}"`
    );
  }

  return rows.join('\n');
}

/**
 * Get distinct list of emails for all provided teachers (or all active catalog teachers)
 */
export function getAllTeacherEmails(teachersList?: string[]): string[] {
  const emailSet = new Set<string>();

  if (teachersList && teachersList.length > 0) {
    for (const name of teachersList) {
      const contact = getTeacherContactInfo(name);
      if (contact.email) emailSet.add(contact.email.toLowerCase());
    }
  } else {
    for (const t of TEACHER_CATALOG) {
      if (t.status !== 'inactive' && t.status !== 'no_workload') {
        const contact = getTeacherContactInfo(t.name);
        if (contact.email) emailSet.add(contact.email.toLowerCase());
      }
    }
  }

  return Array.from(emailSet);
}

/**
 * Build mass mailto link with BCC list for all teachers
 */
export function buildMassMailtoUrl(
  emails: string[],
  subject = 'Aviso General de Plantilla - Escuela Secundaria General No. 129',
  body = 'Estimados Compañeros Docentes:\n\nSe les comunica atentamente la siguiente información institucional...\n\nAtentamente,\nDirección y Subdirección Escolar\nEscuela Secundaria General No. 129'
): string {
  const bccStr = emails.join(',');
  const subEnc = encodeURIComponent(subject);
  const bodyEnc = encodeURIComponent(body);
  // Default TO address is direction/general school mail
  return `mailto:direccion.sec129@edomex.nuevaescuelamexicana.mx?bcc=${encodeURIComponent(bccStr)}&subject=${subEnc}&body=${bodyEnc}`;
}

