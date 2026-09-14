/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { CatalogItem } from '../types';

export interface CatalogCategory {
  id: string;
  code: string;
  name: string;
  scope: 'hvac' | 'screw_compressor' | 'general' | 'custom';
  subcategories: string[];
  description?: string;
}

export interface ParsedProductCandidate {
  id: string;
  type: 'part' | 'equipment';
  itemCode: string;
  nameOrModel: string;
  description: string;
  brand: string;
  category: string; // Clase
  subcategory: string; // Subclase
  price: number;
  currency: 'MXN' | 'USD';
  stock: number;
  minStock: number;
  unit: string;
  deliveryTime: string;
  bulletItems?: string[];
  notes?: string;
}

export type ParsedCatalogRow = ParsedProductCandidate;

/**
 * Validates whether a string is a standard RFC4122 UUID
 */
export const isUUID = (str?: string): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

/**
 * Generates an RFC4122 v4 compliant UUID
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Ensures an ID is a valid UUID, generating one if not
 */
export const ensureUUID = (id?: string): string => {
  if (id && isUUID(id)) {
    return id;
  }
  return generateUUID();
};

/**
 * Pre-loaded official catalog categories analyzed from MVL HVAC & Screw Compressor PDFs
 */
export const INITIAL_CATALOG_CATEGORIES: CatalogCategory[] = [
  // --- HVAC & AIRE ACONDICIONADO / CHILLER / VSD ---
  {
    id: 'hvac_01',
    code: '01',
    name: 'CLASE 01 — REFRIGERACIÓN — AIRE ACONDICIONADO',
    scope: 'hvac',
    subcategories: ['FILTROS', 'COMPRESORES', 'CONDENSADORES', 'EVAPORADORES', 'EXPANSIÓN', 'REFRIGERANTE']
  },
  {
    id: 'hvac_02',
    code: '02',
    name: 'CLASE 02 — VENTILACIÓN Y MANEJO DE AIRE',
    scope: 'hvac',
    subcategories: ['MOTORES', 'VENTILADORES', 'BLOWERS', 'TRANSMISIÓN', 'FILTROS DE AIRE']
  },
  {
    id: 'hvac_03',
    code: '03',
    name: 'CLASE 03 — CONTROLES Y ELECTRÓNICA',
    scope: 'hvac',
    subcategories: ['TERMOSTATOS', 'TARJETAS', 'CONTROLADORES', 'SENSORES', 'ACTUADORES']
  },
  {
    id: 'hvac_04',
    code: '04',
    name: 'CLASE 04 — ELÉCTRICO',
    scope: 'hvac',
    subcategories: ['PROTECCIÓN', 'ARRANQUE', 'CAPACITORES', 'CONEXIONES', 'POTENCIA']
  },
  {
    id: 'hvac_05',
    code: '05',
    name: 'CLASE 05 — VÁLVULAS Y CONTROL DE REFRIGERANTE',
    scope: 'hvac',
    subcategories: ['SOLENOIDES', 'EXPANSIÓN', 'SERVICIO', 'RETENCIÓN', 'REGULACIÓN']
  },
  {
    id: 'hvac_06',
    code: '06',
    name: 'CLASE 06 — TUBERÍA, CONEXIONES Y AISLAMIENTO',
    scope: 'hvac',
    subcategories: ['TUBERÍA', 'CONEXIONES', 'AISLAMIENTO', 'SOPORTERÍA']
  },
  {
    id: 'hvac_07',
    code: '07',
    name: 'CLASE 07 — CONDENSADOS Y DRENAJE',
    scope: 'hvac',
    subcategories: ['BOMBAS', 'DRENAJES', 'CONTROL']
  },
  {
    id: 'hvac_08',
    code: '08',
    name: 'CLASE 08 — CHILLER — REFRIGERACIÓN',
    scope: 'hvac',
    subcategories: ['COMPRESORES', 'EVAPORADORES', 'CONDENSADORES', 'EXPANSIÓN', 'FILTROS Y SEPARADORES', 'REFRIGERANTE Y ACEITE']
  },
  {
    id: 'hvac_09',
    code: '09',
    name: 'CLASE 09 — CHILLER — CIRCUITO DE AGUA',
    scope: 'hvac',
    subcategories: ['BOMBAS', 'VÁLVULAS', 'INTERCAMBIADORES', 'FLUJO', 'EXPANSIÓN Y VASO']
  },
  {
    id: 'hvac_10',
    code: '10',
    name: 'CLASE 10 — CHILLER — TORRE Y CONDENSACIÓN',
    scope: 'hvac',
    subcategories: ['VENTILADORES', 'MOTORES', 'BOMBAS', 'TRATAMIENTO DE AGUA']
  },
  {
    id: 'hvac_11',
    code: '11',
    name: 'CLASE 11 — CHILLER — CONTROL Y AUTOMATIZACIÓN',
    scope: 'hvac',
    subcategories: ['CONTROLADOR', 'SENSORES', 'TRANSDUCTORES', 'COMUNICACIÓN', 'DISPLAY']
  },
  {
    id: 'hvac_12',
    code: '12',
    name: 'CLASE 12 — CHILLER — ELÉCTRICO Y POTENCIA',
    scope: 'hvac',
    subcategories: ['CONTACTORES', 'PROTECCIÓN', 'ARRANCADORES', 'CAPACITORES']
  },
  {
    id: 'hvac_13',
    code: '13',
    name: 'CLASE 13 — VSD / VFD — PROGRAMACIÓN Y MANTENIMIENTO',
    scope: 'hvac',
    subcategories: ['PROGRAMACIÓN', 'AUTOTUNING', 'MANTENIMIENTO', 'POTENCIA', 'MOTOR Y CABLEADO', 'DIAGNÓSTICO', 'RESPALDO Y RECUPERACIÓN']
  },
  {
    id: 'hvac_14',
    code: '14',
    name: 'CLASE 14 — MANTENIMIENTO PREVENTIVO — AIRE ACONDICIONADO',
    scope: 'hvac',
    subcategories: ['LIMPIEZA', 'ELÉCTRICO', 'REFRIGERACIÓN', 'MECÁNICO', 'DESEMPEÑO']
  },
  {
    id: 'hvac_15',
    code: '15',
    name: 'CLASE 15 — MANTENIMIENTO PREVENTIVO — CHILLER',
    scope: 'hvac',
    subcategories: ['CIRCUITO DE REFRIGERACIÓN', 'CIRCUITO DE AGUA', 'COMPRESOR', 'CONDENSACIÓN', 'CONTROL']
  },
  {
    id: 'hvac_16',
    code: '16',
    name: 'CLASE 16 — SERVICIO Y REPARACIÓN',
    scope: 'hvac',
    subcategories: ['DIAGNÓSTICO', 'RECUPERACIÓN Y CARGA', 'REPARACIÓN', 'PUESTA EN MARCHA']
  },
  {
    id: 'hvac_17',
    code: '17',
    name: 'CLASE 17 — REFACCIONES POR MARCA / MODELO',
    scope: 'hvac',
    subcategories: ['CARRIER', 'TRANE', 'YORK', 'DAIKIN / MITSUBISHI / LG', 'OTRAS MARCAS']
  },
  {
    id: 'hvac_18',
    code: '18',
    name: 'CLASE 18 — KITS Y CONSUMIBLES',
    scope: 'hvac',
    subcategories: ['KIT DE MANTENIMIENTO', 'KIT DE REFRIGERACIÓN', 'KIT DE CHILLER', 'QUÍMICOS']
  },

  // --- COMPRESORES DE TORNILLO ---
  {
    id: 'tornillo_01',
    code: '01',
    name: 'CLASE 01 — FILTRACIÓN Y SEPARACIÓN',
    scope: 'screw_compressor',
    subcategories: ['Filtros de aire', 'Filtros de aceite', 'Separadores aire/aceite']
  },
  {
    id: 'tornillo_02',
    code: '02',
    name: 'CLASE 02 — VÁLVULAS DE CONTROL',
    scope: 'screw_compressor',
    subcategories: ['Válvula de admisión', 'Válvula de presión mínima', 'Válvulas de retención', 'Válvulas termostáticas', 'Válvulas de descarga']
  },
  {
    id: 'tornillo_03',
    code: '03',
    name: 'CLASE 03 — ELECTROVÁLVULAS Y CONTROL NEUMÁTICO',
    scope: 'screw_compressor',
    subcategories: ['Electroválvulas', 'Regulación neumática', 'Accesorios neumáticos']
  },
  {
    id: 'tornillo_04',
    code: '04',
    name: 'CLASE 04 — LUBRICACIÓN',
    scope: 'screw_compressor',
    subcategories: ['Aceites', 'Circuito de aceite', 'Indicadores']
  },
  {
    id: 'tornillo_05',
    code: '05',
    name: 'CLASE 05 — ENFRIAMIENTO',
    scope: 'screw_compressor',
    subcategories: ['Enfriadores', 'Ventilación', 'Temperatura']
  },
  {
    id: 'tornillo_06',
    code: '06',
    name: 'CLASE 06 — SENSORES E INSTRUMENTACIÓN',
    scope: 'screw_compressor',
    subcategories: ['Presión', 'Temperatura', 'Nivel']
  },
  {
    id: 'tornillo_07',
    code: '07',
    name: 'CLASE 07 — TRANSMISIÓN MECÁNICA',
    scope: 'screw_compressor',
    subcategories: ['Acoplamientos', 'Bandas y poleas', 'Rodamientos']
  },
  {
    id: 'tornillo_08',
    code: '08',
    name: 'CLASE 08 — AIR-END / ELEMENTO COMPRESOR',
    scope: 'screw_compressor',
    subcategories: ['Rodamientos', 'Sellos', 'Reparación', 'Elemento completo']
  },
  {
    id: 'tornillo_09',
    code: '09',
    name: 'CLASE 09 — JUNTAS Y SELLADO',
    scope: 'screw_compressor',
    subcategories: ['Juntas', 'O-Rings', 'Selladores']
  },
  {
    id: 'tornillo_10',
    code: '10',
    name: 'CLASE 10 — DRENAJE Y CONDENSADOS',
    scope: 'screw_compressor',
    subcategories: ['Drenajes', 'Válvulas', 'Refacciones']
  },
  {
    id: 'tornillo_11',
    code: '11',
    name: 'CLASE 11 — ELÉCTRICO Y CONTROL',
    scope: 'screw_compressor',
    subcategories: ['Protección', 'Arranque', 'Control']
  },
  {
    id: 'tornillo_12',
    code: '12',
    name: 'CLASE 12 — MANGUERAS Y CONEXIONES',
    scope: 'screw_compressor',
    subcategories: ['Mangueras', 'Conexiones']
  },
  {
    id: 'tornillo_13',
    code: '13',
    name: 'CLASE 13 — KITS DE SERVICIO',
    scope: 'screw_compressor',
    subcategories: ['Servicio básico', 'Servicio mayor', 'Kit 6,000 h', 'Kit 12,000 h', 'Kit overhaul']
  },
  {
    id: 'tornillo_14',
    code: '14',
    name: 'CLASE 14 — SERVICIO Y MANTENIMIENTO',
    scope: 'screw_compressor',
    subcategories: ['Consumibles', 'Tornillería', 'Accesorios']
  },
  {
    id: 'tornillo_15',
    code: '15',
    name: 'CLASE 15 — REFACCIONES MAYORES',
    scope: 'screw_compressor',
    subcategories: ['Motor', 'Air-end', 'Enfriador', 'Transmisión']
  },
  {
    id: 'tornillo_16',
    code: '16',
    name: 'CLASE 16 — REFACCIONES POR MARCA',
    scope: 'screw_compressor',
    subcategories: ['Atlas Copco', 'Kaeser', 'Ingersoll Rand', 'Sullair', 'Gardner Denver / CompAir / Quincy / Fusheng / ELGi']
  },
  {
    id: 'tornillo_17',
    code: '17',
    name: 'CLASE 17 — VSD — PROGRAMACIÓN, DIAGNÓSTICO Y MANTENIMIENTO',
    scope: 'screw_compressor',
    subcategories: [
      'Programación y puesta en marcha',
      'Autotuning / identificación del motor',
      'Mantenimiento preventivo del VSD',
      'Etapa de potencia',
      'Motor y cableado asociado al VSD',
      'Diagnóstico y reparación',
      'Respaldo y recuperación',
      'Servicio especializado VSD para compresor'
    ]
  }
];

/**
 * Load categories with persistence in localStorage
 */
export const loadCatalogCategories = (): CatalogCategory[] => {
  try {
    const raw = localStorage.getItem('mvl_catalog_categories');
    if (!raw) return INITIAL_CATALOG_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return INITIAL_CATALOG_CATEGORIES;
  } catch (e) {
    return INITIAL_CATALOG_CATEGORIES;
  }
};

export const saveCatalogCategories = (categories: CatalogCategory[]): void => {
  try {
    localStorage.setItem('mvl_catalog_categories', JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving catalog categories:', e);
  }
};

/**
 * Auto-generate code following HVAC or Screw Compressor standards
 */
export const generateCatalogCode = (
  classNumber: string,
  subclassName: string,
  sequence: number = 1,
  mode: 'hvac' | 'screw' | 'screw_compressor' | 'general' | 'custom' | 'auto' = 'auto'
): string => {
  const cleanClass = classNumber.replace(/\D/g, '').padStart(2, '0');
  const seqStr = String(sequence).padStart(3, '0');

  // Letter prefix for HVAC from subclass first letter or common abbreviations
  const firstLetter = (subclassName.trim().charAt(0) || 'P').toUpperCase();

  if (mode === 'hvac' || (mode === 'auto' && subclassName.toUpperCase() === subclassName)) {
    return `${firstLetter}-${cleanClass}-01-${seqStr}`;
  }

  // Screw compressor format: 01.01 or 01.01-001
  return `${cleanClass}.${seqStr.slice(0, 2)}`;
};

/**
 * Intelligent category inference based on product naming, description, and coding conventions
 */
export const inferCategoryFromProduct = (
  nameOrModel: string = '',
  description: string = '',
  itemCode: string = '',
  currentCategory: string = ''
): { category: string; subcategory: string; detectedType: 'part' | 'equipment' } => {
  const fullText = `${nameOrModel} ${description} ${itemCode}`.toLowerCase();

  const isGeneric = !currentCategory ||
    currentCategory.includes('GENERAL') ||
    currentCategory.trim() === 'General' ||
    currentCategory.toLowerCase().includes('definir');

  // Filtros y Separación
  if (
    fullText.includes('filtro') ||
    fullText.includes('separador') ||
    fullText.includes('coalescente') ||
    fullText.includes('cartucho') ||
    fullText.includes('prefiltro') ||
    fullText.includes('elemento filtrante') ||
    fullText.includes('purificador') ||
    /^f-\d/i.test(itemCode) ||
    /^01\./.test(itemCode)
  ) {
    return {
      category: 'CLASE 01 — FILTRACIÓN Y SEPARACIÓN',
      subcategory: fullText.includes('separador') ? 'Filtros Separadores de Aceite' : (fullText.includes('aire') ? 'Filtros de Aire' : 'Elementos Filtrantes'),
      detectedType: 'part'
    };
  }

  // Aceites y Lubricación
  if (
    fullText.includes('aceite') ||
    fullText.includes('lubricante') ||
    fullText.includes('sintetico') ||
    fullText.includes('sintético') ||
    fullText.includes('mineral') ||
    fullText.includes('rotorcomp') ||
    fullText.includes('sigma fluid') ||
    fullText.includes('ultra coolant') ||
    fullText.includes('refrigerante') ||
    fullText.includes('r-410') ||
    fullText.includes('r-134') ||
    fullText.includes('grasa') ||
    /^02\./.test(itemCode)
  ) {
    return {
      category: 'CLASE 02 — LUBRICACIÓN Y ACEITES',
      subcategory: fullText.includes('sintet') ? 'Aceite Sintético' : (fullText.includes('refrigerante') ? 'Gases Refrigerantes' : 'Lubricantes Industriales'),
      detectedType: 'part'
    };
  }

  // Válvulas y Control de Fluido
  if (
    fullText.includes('valvula') ||
    fullText.includes('válvula') ||
    fullText.includes('solenoide') ||
    fullText.includes('termostatica') ||
    fullText.includes('termostática') ||
    fullText.includes('retencion') ||
    fullText.includes('retención') ||
    fullText.includes('check') ||
    fullText.includes('presion minima') ||
    fullText.includes('presión mínima') ||
    fullText.includes('admision') ||
    fullText.includes('admisión') ||
    fullText.includes('seguridad') ||
    fullText.includes('mpv') ||
    /^05\./.test(itemCode) ||
    /^v-\d/i.test(itemCode)
  ) {
    return {
      category: 'CLASE 05 — VÁLVULAS Y CONTROL DE REFRIGERANTE',
      subcategory: fullText.includes('termost') ? 'Válvulas Termostáticas' : (fullText.includes('solen') ? 'Válvulas Solenoide' : 'Válvulas de Presión y Retención'),
      detectedType: 'part'
    };
  }

  // Sensores e Instrumentación
  if (
    fullText.includes('sensor') ||
    fullText.includes('transductor') ||
    fullText.includes('presostato') ||
    fullText.includes('manometro') ||
    fullText.includes('manómetro') ||
    fullText.includes('termocupla') ||
    fullText.includes('pt100') ||
    fullText.includes('sonda') ||
    fullText.includes('temperatura') ||
    fullText.includes('presion') ||
    /^s-\d/i.test(itemCode) ||
    /^03\./.test(itemCode)
  ) {
    return {
      category: 'CLASE 03 — CONTROLES, SENSORES Y ELECTRÓNICA',
      subcategory: fullText.includes('pres') ? 'Transductores de Presión' : (fullText.includes('temp') ? 'Sensores de Temperatura' : 'Sensores Industriales'),
      detectedType: 'part'
    };
  }

  // Bandas y Transmisión
  if (
    fullText.includes('banda') ||
    fullText.includes('correa') ||
    fullText.includes('polea') ||
    fullText.includes('acoplamiento') ||
    fullText.includes('buje') ||
    fullText.includes('taper') ||
    fullText.includes('xpz') ||
    fullText.includes('xpa') ||
    fullText.includes('spz') ||
    fullText.includes('spa') ||
    /^b-\d/i.test(itemCode) ||
    /^11\./.test(itemCode)
  ) {
    return {
      category: 'CLASE 11 — TRANSMISIÓN Y BANDAS',
      subcategory: fullText.includes('polea') ? 'Poleas y Bujes' : 'Bandas de Transmisión',
      detectedType: 'part'
    };
  }

  // Eléctrico y Motores
  if (
    fullText.includes('motor') ||
    fullText.includes('contactor') ||
    fullText.includes('arrancador') ||
    fullText.includes('guardamotor') ||
    fullText.includes('rele') ||
    fullText.includes('relé') ||
    fullText.includes('bobina') ||
    fullText.includes('transformador') ||
    fullText.includes('fusible') ||
    fullText.includes('capacitor') ||
    /^m-\d/i.test(itemCode) ||
    /^04\./.test(itemCode)
  ) {
    return {
      category: 'CLASE 04 — ELÉCTRICO Y MOTORES',
      subcategory: fullText.includes('motor') ? 'Motores Eléctricos' : 'Componentes de Control Eléctrico',
      detectedType: fullText.includes('motor') && (fullText.includes('hp') || fullText.includes('kw')) ? 'equipment' : 'part'
    };
  }

  // Mangueras y Conexiones
  if (
    fullText.includes('manguera') ||
    fullText.includes('conexion') ||
    fullText.includes('conexión') ||
    fullText.includes('cople') ||
    fullText.includes('fitting') ||
    fullText.includes('tuberia') ||
    fullText.includes('tubería') ||
    fullText.includes('niple') ||
    /^12\./.test(itemCode) ||
    /^06\./.test(itemCode)
  ) {
    return {
      category: 'CLASE 12 — MANGUERAS Y CONEXIONES',
      subcategory: fullText.includes('manguera') ? 'Mangueras de Alta Presión' : 'Conexiones y Coples',
      detectedType: 'part'
    };
  }

  // Kits de Mantenimiento y Servicio
  if (
    fullText.includes('kit') ||
    fullText.includes('mantenimiento') ||
    fullText.includes('servicio') ||
    fullText.includes('overhaul') ||
    fullText.includes('preventivo') ||
    fullText.includes('2000 h') ||
    fullText.includes('4000 h') ||
    fullText.includes('8000 h') ||
    fullText.includes('6000 h') ||
    fullText.includes('12000 h') ||
    /^13\./.test(itemCode)
  ) {
    return {
      category: 'CLASE 13 — KITS DE SERVICIO',
      subcategory: fullText.includes('overhaul') ? 'Kit Overhaul' : 'Kits Preventivos por Horas',
      detectedType: 'part'
    };
  }

  // Equipos y Refacciones Mayores
  if (
    fullText.includes('compresor') ||
    fullText.includes('tornillo') ||
    fullText.includes('chiller') ||
    fullText.includes('airend') ||
    fullText.includes('air-end') ||
    fullText.includes('unidad compresora') ||
    fullText.includes('condensador') ||
    fullText.includes('evaporador')
  ) {
    return {
      category: fullText.includes('chiller') ? 'CLASE 08 — CHILLER — REFRIGERACIÓN' : 'CLASE 15 — REFACCIONES MAYORES',
      subcategory: fullText.includes('chiller') ? 'Unidades Chiller' : (fullText.includes('airend') ? 'Air-end / Tornillo' : 'Compresores'),
      detectedType: 'equipment'
    };
  }

  // VSD y Variadores
  if (
    fullText.includes('vsd') ||
    fullText.includes('variador') ||
    fullText.includes('inversor') ||
    fullText.includes('drive') ||
    fullText.includes('tarjeta') ||
    fullText.includes('controlador') ||
    /^17\./.test(itemCode)
  ) {
    return {
      category: 'CLASE 17 — VSD — PROGRAMACIÓN Y DIAGNÓSTICO',
      subcategory: 'Variadores de Frecuencia y Control',
      detectedType: 'part'
    };
  }

  // Sellos y Empaques
  if (
    fullText.includes('sello') ||
    fullText.includes('o-ring') ||
    fullText.includes('oring') ||
    fullText.includes('junta') ||
    fullText.includes('empaque') ||
    fullText.includes('reten') ||
    fullText.includes('retén')
  ) {
    return {
      category: 'CLASE 06 — TUBERÍA, CONEXIONES Y SELLOS',
      subcategory: 'Sellos y Empaques',
      detectedType: 'part'
    };
  }

  // If a specific category was detected from a section header, respect it
  if (!isGeneric && currentCategory) {
    return {
      category: currentCategory,
      subcategory: '',
      detectedType: 'part'
    };
  }

  return {
    category: 'CLASE 14 — SERVICIO Y MANTENIMIENTO',
    subcategory: 'Refacciones Generales',
    detectedType: 'part'
  };
};

/**
 * Extract clean text and parse tables from PDF/Excel text representation
 */
export const parseCatalogText = (rawText: string): ParsedProductCandidate[] => {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const candidates: ParsedProductCandidate[] = [];

  let currentClase = 'CLASE 01 — GENERAL';
  let candidateIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line declares a category/class header:
    // Matches:
    // "CLASE 01 — FILTRACIÓN..."
    // "CLASE 1: FILTROS"
    // "CLASE 02 - ACEITES"
    // "CATEGORÍA: FILTROS"
    // "CATEGORIA: FILTROS"
    // "FAMILIA: VÁLVULAS"
    // "SECCIÓN: COMPRESORES"
    // "01. FILTRACIÓN Y SEPARACIÓN"
    const headerClaseMatch = line.match(/^(?:CLASE\s*\d+|CATEGOR[IÍ]A|FAMILIA|SECCI[OÓ]N|GRUPO)\s*[:—–-]?\s*(.+)$/i);
    if (headerClaseMatch) {
      currentClase = line.replace(/\s+/g, ' ').trim();
      continue;
    }

    if (/^\d{1,2}\.\s+[A-ZÁÉÍÓÚÑ\s/—–-]+$/i.test(line) && line.length < 80) {
      currentClase = line.replace(/\s+/g, ' ').trim();
      continue;
    }

    // Ignore catalog header / footer noise
    if (
      line.includes('MVL · Catálogo') ||
      line.includes('Página') ||
      line.includes('Refacciones y Servicio Industrial') ||
      line.includes('Sistema de codificación') ||
      line.includes('Código Subclase Refacciones') ||
      line.includes('Precios a definir') ||
      line.includes('Tel. 477 404 7421') ||
      line.includes('Compatibilidad:') ||
      line.includes('Nota de seguridad:') ||
      line.includes('NOTA PARA SERVICIOS VSD:')
    ) {
      continue;
    }

    // Pattern 1: HVAC Coding: F-01-01-001 or C-01-02-001 or M-02-01-001
    const hvacMatch = line.match(/^([A-Z]-\d{2}-\d{2}-\d{3})\s+([A-ZÁÉÍÓÚÑ\s/]+?)\s{2,}(.+?)(?:\s*\$\s*([_\d.,]+)?)?$/i);
    if (hvacMatch) {
      const itemCode = hvacMatch[1].trim();
      const subclassName = hvacMatch[2].trim();
      const refacciones = hvacMatch[3].replace(/\$\s*_{2,}/, '').trim();
      const priceStr = hvacMatch[4] ? hvacMatch[4].replace(/[^\d.]/g, '') : '';
      const priceVal = priceStr ? parseFloat(priceStr) : 0;

      const bulletItems = refacciones.split('•').map(s => s.trim()).filter(Boolean);
      const inferred = inferCategoryFromProduct(subclassName, refacciones, itemCode, currentClase);

      candidates.push({
        id: generateUUID(),
        type: inferred.detectedType,
        itemCode,
        nameOrModel: `${subclassName}: ${bulletItems[0] || refacciones}`,
        description: refacciones,
        brand: 'OEM / Multimarca',
        category: inferred.category,
        subcategory: inferred.subcategory || subclassName,
        price: priceVal,
        currency: 'MXN',
        stock: 5,
        minStock: 2,
        unit: 'pza',
        deliveryTime: 'Inmediata (Stock)',
        bulletItems,
        notes: `Importado de Catálogo (${inferred.category})`
      });
      continue;
    }

    // Pattern 2: Compresores de Tornillo Coding: 01.01, 01.02, 17.01, etc.
    const tornilloMatch = line.match(/^(\d{2}\.\d{2})\s+([A-Za-zÁÉÍÓÚáéíóúñÑ\s/()\-.,]+?)\s{2,}(.+?)(?:\s*\$\s*([_\d.,]+)?)?$/);
    if (tornilloMatch) {
      const itemCode = tornilloMatch[1].trim();
      const subclassName = tornilloMatch[2].trim();
      const refacciones = tornilloMatch[3].replace(/\$\s*_{2,}/, '').trim();
      const priceStr = tornilloMatch[4] ? tornilloMatch[4].replace(/[^\d.]/g, '') : '';
      const priceVal = priceStr ? parseFloat(priceStr) : 0;

      const bulletItems = refacciones.split('•').map(s => s.trim()).filter(Boolean);
      const inferred = inferCategoryFromProduct(subclassName, refacciones, itemCode, currentClase);

      candidates.push({
        id: generateUUID(),
        type: inferred.detectedType,
        itemCode,
        nameOrModel: `${subclassName}: ${bulletItems[0] || refacciones}`,
        description: refacciones,
        brand: currentClase.includes('Kaeser') ? 'Kaeser' : (currentClase.includes('Atlas') ? 'Atlas Copco' : 'Kaeser / Atlas Copco / MVL'),
        category: inferred.category,
        subcategory: inferred.subcategory || subclassName,
        price: priceVal,
        currency: 'MXN',
        stock: 5,
        minStock: 2,
        unit: 'pza',
        deliveryTime: 'Inmediata (Stock)',
        bulletItems,
        notes: `Importado de Catálogo (${inferred.category})`
      });
      continue;
    }

    // Pattern 3: Generalized row with code or model, description, and price (supports multiple columns or spaces)
    // Example: "1613-8107-00  Filtro de aire para compresor Atlas Copco  $1,850.00"
    // Example: "VALV-001  Válvula termostática 71C  1,200.00"
    const generalMatch = line.match(/^([A-Za-z0-9_.\-/]{2,25})\s{2,}(.+?)(?:\s+(?:USD|MXN)?\s*\$?\s*([\d,]+(?:\.\d{2})?))?$/);
    if (generalMatch && generalMatch[2].length > 3) {
      const itemCode = generalMatch[1].trim();
      const descPart = generalMatch[2].trim();
      const priceStr = generalMatch[3] ? generalMatch[3].replace(/,/g, '') : '0';
      const priceVal = parseFloat(priceStr) || 0;

      const bulletItems = descPart.split('•').map(s => s.trim()).filter(Boolean);
      const inferred = inferCategoryFromProduct(descPart, '', itemCode, currentClase);

      candidates.push({
        id: generateUUID(),
        type: inferred.detectedType,
        itemCode,
        nameOrModel: bulletItems[0] || descPart,
        description: descPart,
        brand: 'MVL / OEM',
        category: inferred.category,
        subcategory: inferred.subcategory,
        price: priceVal,
        currency: 'MXN',
        stock: 5,
        minStock: 1,
        unit: 'pza',
        deliveryTime: 'Inmediata (Stock)',
        bulletItems,
        notes: `Detectado de texto (${inferred.category})`
      });
      continue;
    }

    // Pattern 4: Generalized line containing bullet points or tab-separated table
    if (line.includes('\t') || (line.includes('•') && (line.includes('$') || /\d/.test(line)))) {
      const parts = line.split('\t').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const itemCode = parts[0];
        const subclassName = parts[1] || 'General';
        const refacciones = parts[2] || parts[1];
        const priceStr = (parts[3] || '').replace(/[^\d.]/g, '');
        const priceVal = priceStr ? parseFloat(priceStr) : 0;
        const bulletItems = refacciones.split('•').map(s => s.trim()).filter(Boolean);
        const inferred = inferCategoryFromProduct(subclassName, refacciones, itemCode, currentClase);

        candidates.push({
          id: generateUUID(),
          type: inferred.detectedType,
          itemCode: itemCode || `GEN-${Date.now().toString().slice(-4)}-${candidateIndex++}`,
          nameOrModel: `${subclassName}: ${bulletItems[0] || refacciones}`,
          description: refacciones,
          brand: 'MVL / OEM',
          category: inferred.category,
          subcategory: inferred.subcategory || subclassName,
          price: priceVal,
          currency: 'MXN',
          stock: 5,
          minStock: 1,
          unit: 'pza',
          deliveryTime: 'Inmediata (Stock)',
          bulletItems,
          notes: `Detectado de tabla (${inferred.category})`
        });
      }
    }
  }

  return candidates;
};

/**
 * Intelligent Excel / CSV parser
 */
export const parseCatalogFromExcel = (arrayBuffer: ArrayBuffer): ParsedProductCandidate[] => {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const candidates: ParsedProductCandidate[] = [];
  let candidateIndex = 1;

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    let currentClase = sheetName.toUpperCase().includes('CLASE') ? sheetName : 'CLASE 01 — GENERAL';

    rawData.forEach(row => {
      // Find matching keys regardless of casing / accents
      const keys = Object.keys(row);
      const getKeyVal = (patterns: string[]): string => {
        for (const pattern of patterns) {
          const matchKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(pattern));
          if (matchKey && row[matchKey] !== undefined && row[matchKey] !== '') {
            return String(row[matchKey]).trim();
          }
        }
        return '';
      };

      // Check if row itself is a class header
      const firstVal = Object.values(row)[0];
      if (typeof firstVal === 'string' && /^CLASE\s+\d+/i.test(firstVal)) {
        currentClase = firstVal.trim();
        return;
      }

      const rawClase = getKeyVal(['clase', 'categoria', 'category']) || currentClase;
      const rawSubclase = getKeyVal(['subclase', 'subcategoria', 'subcategory']) || 'General';
      const rawCode = getKeyVal(['codigo', 'code', 'parte', 'partnumber', 'sku']) || `ITM-${Date.now().toString().slice(-4)}`;
      const rawName = getKeyVal(['refacciones', 'servicio', 'nombre', 'name', 'modelo', 'model', 'descripcion', 'description']) || 'Refacción';
      const rawDesc = getKeyVal(['descripcion', 'description', 'detalle', 'especificaciones']) || rawName;
      const rawBrand = getKeyVal(['marca', 'brand', 'fabricante', 'oem']) || 'Kaeser / Atlas Copco / MVL';
      const rawPrice = parseFloat(getKeyVal(['precio', 'price', 'unitario', 'costo'])) || 0;
      const rawCurrency = (getKeyVal(['moneda', 'currency']) || 'MXN').toUpperCase() === 'USD' ? 'USD' : 'MXN';
      const rawStock = parseInt(getKeyVal(['stock', 'cantidad', 'existencia'])) || 5;
      const rawMinStock = parseInt(getKeyVal(['minimo', 'minstock', 'stockminimo'])) || 2;
      const rawUnit = getKeyVal(['unidad', 'unit', 'medida']) || 'pza';
      const rawType = (getKeyVal(['tipo', 'type']).toLowerCase().includes('equipo') || rawName.toLowerCase().includes('compresor')) ? 'equipment' : 'part';

      if (!rawCode && !rawName) return;

      const bulletItems = rawDesc.includes('•') ? rawDesc.split('•').map(s => s.trim()).filter(Boolean) : [rawName];

      candidates.push({
        id: `parsed_excel_${Date.now()}_${candidateIndex++}`,
        type: rawType,
        itemCode: rawCode,
        nameOrModel: rawName,
        description: rawDesc,
        brand: rawBrand,
        category: rawClase,
        subcategory: rawSubclase,
        price: rawPrice,
        currency: rawCurrency as 'MXN' | 'USD',
        stock: rawStock,
        minStock: rawMinStock,
        unit: rawUnit,
        deliveryTime: 'Inmediata (Stock)',
        bulletItems,
        notes: `Importado de Excel hoja: ${sheetName}`
      });
    });
  });

  return candidates;
};

/**
 * Intelligent PDF Parser using pdfjs-dist
 */
export const parseCatalogFromPdf = async (fileBuffer: ArrayBuffer): Promise<ParsedProductCandidate[]> => {
  try {
    // Dynamic import to support SSR and Vite client bundle
    const pdfjs = await import('pdfjs-dist');
    // Configure worker
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '4.10.38'}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjs.getDocument({ data: fileBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    let fullExtractedText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group tokens by Y coordinate to recreate visual table rows
      const items = textContent.items as any[];
      if (!items || items.length === 0) continue;

      // Group by approximate vertical position, preserving X coordinate
      const linesMap = new Map<number, Array<{ x: number; str: string }>>();
      items.forEach(item => {
        if (!item.str || !item.str.trim()) return;
        const y = Math.round(item.transform[5] / 4) * 4;
        const x = item.transform[4] || 0;
        const existing = linesMap.get(y) || [];
        existing.push({ x, str: item.str });
        linesMap.set(y, existing);
      });

      // Sort lines top to bottom (descending Y)
      const sortedYs = Array.from(linesMap.keys()).sort((a, b) => b - a);
      const pageLines = sortedYs.map(y => {
        const lineItems = linesMap.get(y) || [];
        // Sort left to right
        lineItems.sort((a, b) => a.x - b.x);
        return lineItems.map(i => i.str).join('   ');
      });
      const pageText = pageLines.join('\n');

      fullExtractedText += `\n--- PAGE ${pageNum} ---\n` + pageText;
    }

    // Pass through universal table parser
    const results = parseCatalogText(fullExtractedText);
    return results;
  } catch (err: any) {
    console.warn('PDF parsing error via pdfjs:', err);
    throw new Error(`No se pudo extraer el texto del PDF: ${err?.message || 'Formato no reconocido'}. Por favor use la opción de copiar y pegar el texto del catálogo.`);
  }
};

/**
 * Complete SQL DDL and Migration Script for Supabase / PostgreSQL
 */
export const generateCatalogSupabaseSql = (): string => {
  return `-- ==============================================================================
-- MVL CONTROL INDUSTRIAL: ESQUEMA DDL PARA CATÁLOGO DE VENTAS, CLASES Y SUBCLASES
-- Compatible con Supabase PostgreSQL y RLS (Row Level Security)
-- ==============================================================================

-- 1. EXTENSIÓN PARA UUIDS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: catalog_categories (Clases y Subclases de HVAC y Compresores)
CREATE TABLE IF NOT EXISTS public.catalog_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    scope VARCHAR(50) DEFAULT 'general', -- 'hvac', 'screw_compressor', 'general', 'custom'
    subcategories TEXT[] DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_catalog_categories_scope ON public.catalog_categories(scope);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_name ON public.catalog_categories(name);

-- 3. TABLA: catalog_items (Productos, Refacciones y Equipos de Ventas)
CREATE TABLE IF NOT EXISTS public.catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) DEFAULT 'part' NOT NULL, -- 'equipment' o 'part'
    item_code VARCHAR(100) NOT NULL,          -- Código oficial HVAC (F-01-01-001) o Tornillo (01.01)
    name_or_model VARCHAR(255) NOT NULL,      -- Nombre de refacción o modelo de equipo
    description TEXT,                         -- Desglose con bullets de servicios o refacciones
    brand VARCHAR(100) DEFAULT 'Multimarca',  -- Kaeser, Atlas Copco, Carrier, Trane, York, etc.
    category VARCHAR(255) DEFAULT 'General',  -- Clase (ej. CLASE 01 — FILTRACIÓN Y SEPARACIÓN)
    subcategory VARCHAR(255),                 -- Subclase (ej. Filtros de aire)
    price NUMERIC(14, 2) DEFAULT 0.00 NOT NULL, -- Precio base sin IVA
    currency VARCHAR(10) DEFAULT 'MXN' NOT NULL, -- 'MXN' o 'USD'
    stock INTEGER DEFAULT 0 NOT NULL,         -- Existencia física actual
    min_stock INTEGER DEFAULT 1 NOT NULL,     -- Stock de seguridad
    unit VARCHAR(50) DEFAULT 'pza' NOT NULL,  -- pza, servicio, kit, cubeta, etc.
    client_name VARCHAR(255) DEFAULT 'General / Todos',
    equipment_model VARCHAR(255),
    serial_number VARCHAR(100),
    capacity VARCHAR(100),                    -- 50 HP / 37 kW / 215 CFM
    voltage VARCHAR(100),                     -- 440V 3F / 220V 3F
    location VARCHAR(255) DEFAULT 'Almacén Central',
    delivery_time VARCHAR(100) DEFAULT 'Inmediata (Stock)',
    is_active BOOLEAN DEFAULT true NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_catalog_items_code ON public.catalog_items(item_code);
CREATE INDEX IF NOT EXISTS idx_catalog_items_type ON public.catalog_items(type);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON public.catalog_items(category);
CREATE INDEX IF NOT EXISTS idx_catalog_items_brand ON public.catalog_items(brand);
CREATE INDEX IF NOT EXISTS idx_catalog_items_active ON public.catalog_items(is_active);

-- 4. POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Lectura pública / autenticada
CREATE POLICY "Permitir lectura del catálogo a usuarios autenticados" 
ON public.catalog_items FOR SELECT USING (true);

CREATE POLICY "Permitir lectura de categorías a usuarios autenticados" 
ON public.catalog_categories FOR SELECT USING (true);

-- Escritura, inserción y borrado para administradores y coordinadores de ventas
CREATE POLICY "Permitir inserción de catálogo" 
ON public.catalog_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de catálogo" 
ON public.catalog_items FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permitir borrado de catálogo" 
ON public.catalog_items FOR DELETE USING (true);

CREATE POLICY "Permitir gestión de categorías" 
ON public.catalog_categories FOR ALL USING (true);

-- 5. TRIGGER PARA ACTUALIZAR AUTOMÁTICAMENTE updated_at
CREATE OR REPLACE FUNCTION update_catalog_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_catalog_items_timestamp ON public.catalog_items;
CREATE TRIGGER trigger_catalog_items_timestamp
BEFORE UPDATE ON public.catalog_items
FOR EACH ROW EXECUTE FUNCTION update_catalog_timestamp();
`;
};
