/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Equipment, HistoryItem, InventoryItem, Staff, WorkOrder, PurchaseOrder } from './types';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Grupo Industrial Monterrey',
    companyName: 'Grupo Industrial Monterrey S.A. de C.V.',
    rfc: 'GIM920412H89',
    email: 'contacto@grupomonterrey.com',
    phone: '81-1234-5678',
    plants: [
      { id: 'p1', name: 'Planta Apodaca', address: 'Av. Industrial 500, Apodaca', city: 'Apodaca, NL' },
      { id: 'p2', name: 'Planta Santa Catarina', address: 'Km 12 Carr. Saltillo, Santa Catarina', city: 'Santa Catarina, NL' }
    ],
    contacts: [
      { name: 'Ing. Fernando Ortiz', role: 'Gerente de Mantenimiento', phone: '81-9876-5432', email: 'f.ortiz@grupomonterrey.com' }
    ]
  },
  {
    id: 'c2',
    name: 'Lácteos del Norte',
    companyName: 'Productora de Lácteos del Norte S.A.',
    rfc: 'PLN841102KK3',
    email: 'mantenimiento@lacteosnorte.com',
    phone: '87-1234-8899',
    plants: [
      { id: 'p3', name: 'Planta Principal Torreón', address: 'Calz. Industrial de la Laguna 300', city: 'Torreón, Coah.' }
    ],
    contacts: [
      { name: 'Lic. Laura Garza', role: 'Supervisora de Operaciones', phone: '87-1122-3344', email: 'l.garza@lacteosnorte.com' }
    ]
  }
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq1',
    clientId: 'c1',
    plantId: 'p1',
    name: 'Compresor de Tornillo Rotativo 50HP',
    brand: 'Kaeser',
    model: 'BSD 50',
    serialNumber: 'BSD-2024-0012',
    oilType: 'Sigma Fluid S-460',
    capacity: '220 CFM @ 125 PSI',
    filtersRequired: 'Filtro de Aire 6.2012.0, Filtro de Aceite 6.1981.1, Separador 6.3562.0',
    status: 'active',
    lastMaintenance: '2026-03-10',
    nextMaintenance: '2026-09-10',
    engineHours: 12450,
    telemetry: {
      psi: 112,
      temp: 84,
      vibration: 'normal',
      rpm: 1750,
      lastUpdate: 'Hace unos instantes'
    }
  },
  {
    id: 'eq2',
    clientId: 'c1',
    plantId: 'p1',
    name: 'Secador de Aire Refrigerativo',
    brand: 'Atlas Copco',
    model: 'FX12',
    serialNumber: 'AP-FX-89332',
    oilType: 'No aplica',
    capacity: '250 CFM @ 100 PSI',
    filtersRequired: 'Filtro Coalescente DD210, Filtro de Partículas PD210',
    status: 'warning',
    lastMaintenance: '2026-01-15',
    nextMaintenance: '2026-07-15',
    engineHours: 8900,
    telemetry: {
      psi: 94,
      temp: 45, // Un poco alto para secadora de aire
      vibration: 'moderate',
      rpm: 1200,
      lastUpdate: 'Hace unos instantes'
    }
  },
  {
    id: 'eq3',
    clientId: 'c2',
    plantId: 'p3',
    name: 'Compresor de Aire Lubricado 100HP',
    brand: 'Atlas Copco',
    model: 'GA 75 VSD',
    serialNumber: 'GA75-99812A',
    oilType: 'Roto Inject Fluid',
    capacity: '480 CFM @ 110 PSI',
    filtersRequired: 'Filtro Aire 1613-8720-00, Filtro Aceite 1625-7563-00, Separador 1622-3140-00',
    status: 'maintenance',
    lastMaintenance: '2025-11-20',
    nextMaintenance: '2026-05-20',
    engineHours: 24610,
    telemetry: {
      psi: 0,
      temp: 22,
      vibration: 'normal',
      rpm: 0,
      lastUpdate: 'Hace unos instantes'
    }
  }
];

export const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: 'h1',
    equipmentId: 'eq1',
    date: '2026-03-10',
    type: 'preventive',
    description: 'Servicio de mantenimiento preventivo de las 2,000 horas. Cambio de aceite, filtro de aire, filtro de aceite y cartucho separador.',
    technicianName: 'Roberto Sánchez',
    partsReplaced: [
      { name: 'Filtro de Aire Kaeser 6.2012.0', quantity: 1 },
      { name: 'Filtro de Aceite Kaeser 6.1981.1', quantity: 1 },
      { name: 'Aceite Sigma Fluid S-460 (Galón)', quantity: 4 }
    ]
  },
  {
    id: 'h2',
    equipmentId: 'eq2',
    date: '2026-01-15',
    type: 'corrective',
    description: 'Cambio de válvula de drenaje automático averiada y limpieza general de condensador.',
    technicianName: 'Alejandro Torres',
    partsReplaced: [
      { name: 'Válvula de Purga Temporizada 1/2"', quantity: 1 }
    ]
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'i1', code: 'FIL-KAE-50', name: 'Filtro de Aire Kaeser 6.2012.0', category: 'consumable', stock: 12, minStock: 3, price: 1250 },
  { id: 'i2', code: 'FIL-KAE-OIL', name: 'Filtro de Aceite Kaeser 6.1981.1', category: 'consumable', stock: 8, minStock: 3, price: 950 },
  { id: 'i3', code: 'FIL-ATL-GA', name: 'Filtro Aire Atlas Copco 1613-8720-00', category: 'consumable', stock: 2, minStock: 4, price: 1850 }, // Low Stock Alert!
  { id: 'i4', code: 'ACE-SIG-S46', name: 'Aceite Sigma Fluid S-460 (Cubeta 19L)', category: 'consumable', stock: 15, minStock: 5, price: 5400 },
  { id: 'i5', code: 'VAL-SOL-24V', name: 'Válvula Solenoide de Admisión 24V', category: 'pneumatic', stock: 3, minStock: 2, price: 3200 },
  { id: 'i6', code: 'PRE-SENS-150', name: 'Sensor de Presión 0-150 PSI 4-20mA', category: 'electronic', stock: 1, minStock: 2, price: 4100 }, // Low Stock Alert!
  { id: 'i7', code: 'VAL-PUR-TMP', name: 'Válvula de Purga Temporizada 1/2"', category: 'refrigeration', stock: 5, minStock: 2, price: 1950 }
];

export const INITIAL_STAFF: Staff[] = [
  { id: 's1', name: 'Ing. Carlos Mendoza', role: 'coordinator', email: 'carlos.mendoza@mvl.com', phone: '81-8181-9922', active: true },
  { id: 's2', name: 'Roberto Sánchez', role: 'technician', email: 'roberto.sanchez@mvl.com', phone: '81-2233-4455', active: true },
  { id: 's3', name: 'Alejandro Torres', role: 'technician', email: 'alejandro.torres@mvl.com', phone: '81-4455-6677', active: true }
];

export const DEFAULT_CHECKLIST = [
  { id: 'chk1', task: 'Revisión y registro de nivel de aceite de compresor', checked: false },
  { id: 'chk2', task: 'Verificación de temperatura de descarga (°C)', checked: false },
  { id: 'chk3', task: 'Inspección de bandas y tensión de motor', checked: false },
  { id: 'chk4', task: 'Inspección visual de fugas de aire y aceite', checked: false },
  { id: 'chk5', task: 'Prueba de funcionamiento de válvula de seguridad', checked: false },
  { id: 'chk6', task: 'Limpieza física del radiador / intercambiador', checked: false },
  { id: 'chk7', task: 'Purgado de condensados manual y automático', checked: false }
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'ot1',
    code: 'OT-1042',
    equipmentId: 'eq1',
    clientId: 'c1',
    plantId: 'p1',
    type: 'preventive',
    status: 'pending',
    scheduledDate: '2026-07-16',
    engineHours: 12450,
    assignedTechnicianId: 's2',
    assignedTechnicianName: 'Roberto Sánchez',
    checklist: DEFAULT_CHECKLIST.map(c => ({ ...c })),
    observations: 'Realizar cambio preventivo de filtros y muestreo de aceite.',
    partsUsed: []
  },
  {
    id: 'ot2',
    code: 'OT-1043',
    equipmentId: 'eq2',
    clientId: 'c1',
    plantId: 'p1',
    type: 'corrective',
    status: 'in_progress',
    scheduledDate: '2026-07-16',
    engineHours: 8900,
    assignedTechnicianId: 's3',
    assignedTechnicianName: 'Alejandro Torres',
    checklist: [
      { id: 'c_chk1', task: 'Inspección de sensor de humedad y temperatura', checked: true },
      { id: 'c_chk2', task: 'Comprobación de presiones de refrigerante de alta/baja', checked: false },
      { id: 'c_chk3', task: 'Prueba de drenado de purga automática', checked: false }
    ],
    observations: 'Cliente reporta alta temperatura y caída de presión en secador de aire.',
    partsUsed: []
  },
  {
    id: 'ot3',
    code: 'OT-1041',
    equipmentId: 'eq3',
    clientId: 'c2',
    plantId: 'p3',
    type: 'preventive',
    status: 'review',
    scheduledDate: '2026-07-15',
    engineHours: 24610,
    assignedTechnicianId: 's2',
    assignedTechnicianName: 'Roberto Sánchez',
    checklist: DEFAULT_CHECKLIST.map(c => ({ ...c, checked: true })),
    observations: 'Mantenimiento preventivo mayor completado con éxito. Se cambiaron filtros de aire, aceite y cartucho separador. Sin fallas reportadas.',
    partsUsed: [
      { itemId: 'i3', name: 'Filtro Aire Atlas Copco 1613-8720-00', quantity: 1, price: 1850 },
      { itemId: 'i4', name: 'Aceite Sigma Fluid S-460 (Cubeta 19L)', quantity: 1, price: 5400 }
    ],
    beforePhoto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=300',
    afterPhoto: 'https://images.unsplash.com/photo-1581092162613-f9a130f8c575?auto=format&fit=crop&q=80&w=300',
    signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><path d="M 10 25 Q 30 10, 50 25 T 90 25" stroke="black" fill="none"/></svg>',
    signatureName: 'Ing. Laura Garza',
    dateCompleted: '2026-07-15',
    laborHours: 5,
    laborCost: 7500
  },
  {
    id: 'ot4',
    code: 'OT-1040',
    equipmentId: 'eq1',
    clientId: 'c1',
    plantId: 'p1',
    type: 'corrective',
    status: 'completed',
    scheduledDate: '2026-07-10',
    engineHours: 12410,
    assignedTechnicianId: 's2',
    assignedTechnicianName: 'Roberto Sánchez',
    checklist: [
      { id: 'cx1', task: 'Cambio de válvula solenoide', checked: true },
      { id: 'cx2', task: 'Prueba de carga y vacío', checked: true }
    ],
    observations: 'Se reemplazó la válvula de solenoide de admisión averiada. Se realizaron pruebas de operación a plena carga y vacío, operando normalmente en el rango establecido.',
    partsUsed: [
      { itemId: 'i5', name: 'Válvula Solenoide de Admisión 24V', quantity: 1, price: 3200 }
    ],
    beforePhoto: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=300',
    afterPhoto: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=300',
    signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><path d="M 5 35 Q 25 15, 65 35 T 95 15" stroke="black" fill="none"/></svg>',
    signatureName: 'Ing. Fernando Ortiz',
    dateCompleted: '2026-07-10',
    approvedByCoordinator: true,
    laborHours: 3,
    laborCost: 4500,
    clientFeedback: {
      rating: 5,
      nps: 10,
      comments: 'Excelente servicio técnico. El compresor quedó operando perfectamente tras el cambio de la solenoide.'
    }
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po1',
    code: 'OC-2026-001',
    date: '2026-07-01',
    concept: 'Instalación de compresor y tubería principal',
    utility: 12885,
    savings: 2577,
    utilityAfterSavings: 10308,
    marcoPercent: 60,
    victorPercent: 20,
    leoPercent: 20,
    rikyPercent: 0,
    marcoAmount: 6184.80,
    victorAmount: 2061.60,
    leoAmount: 2061.60,
    rikyAmount: 0,
    marcoFinal: 2702.76,
    victorFinal: 4941.66,
    leoFinal: 2663.59
  },
  {
    id: 'po2',
    code: 'OC-2026-002',
    date: '2026-07-03',
    concept: 'Mantenimiento Mayor Kaeser BSD 60',
    utility: 31360,
    savings: 6272,
    utilityAfterSavings: 25088,
    marcoPercent: 60,
    victorPercent: 20,
    leoPercent: 20,
    rikyPercent: 0,
    marcoAmount: 15052.80,
    victorAmount: 5017.60,
    leoAmount: 5017.60,
    rikyAmount: 0,
    marcoFinal: 6578.07,
    victorFinal: 12027.19,
    leoFinal: 6482.74
  },
  {
    id: 'po3',
    code: 'OC-2026-003',
    date: '2026-07-05',
    concept: 'Reconstrucción de Unidad de Compresión Atlas Copco',
    utility: 71640.47,
    savings: 14328.09,
    utilityAfterSavings: 57312.38,
    marcoPercent: 20,
    victorPercent: 60,
    leoPercent: 20,
    rikyPercent: 0,
    marcoAmount: 11462.48,
    victorAmount: 34387.43,
    leoAmount: 11462.48,
    rikyAmount: 0,
    marcoFinal: 15027.30,
    victorFinal: 27475.55,
    leoFinal: 14809.52
  },
  {
    id: 'po4',
    code: 'OC-2026-004',
    date: '2026-07-06',
    concept: 'Servicio Correctivo Secador de Aire Frigorífico',
    utility: 37210,
    savings: 7442,
    utilityAfterSavings: 29768,
    marcoPercent: 20,
    victorPercent: 60,
    leoPercent: 20,
    rikyPercent: 0,
    marcoAmount: 5953.60,
    victorAmount: 17860.80,
    leoAmount: 5953.60,
    rikyAmount: 0,
    marcoFinal: 7805.17,
    victorFinal: 14270.78,
    leoFinal: 7692.05
  },
  {
    id: 'po5',
    code: 'OC-2026-005',
    date: '2026-07-08',
    concept: 'Auditoría de Fugas de Aire Comprimido',
    utility: 10000,
    savings: 2000,
    utilityAfterSavings: 8000,
    marcoPercent: 20,
    victorPercent: 60,
    leoPercent: 20,
    rikyPercent: 0,
    marcoAmount: 1600.00,
    victorAmount: 4800.00,
    leoAmount: 1600.00,
    rikyAmount: 0,
    marcoFinal: 2097.60,
    victorFinal: 3835.20,
    leoFinal: 2067.20
  },
  {
    id: 'po6',
    code: 'OC-2026-006',
    date: '2026-07-09',
    concept: 'Suministro de Filtros Coalescentes y Refacciones',
    utility: 10000,
    savings: 2000,
    utilityAfterSavings: 8000,
    marcoPercent: 20,
    victorPercent: 60,
    leoPercent: 20,
    rikyPercent: 0,
    marcoAmount: 1600.00,
    victorAmount: 4800.00,
    leoAmount: 1600.00,
    rikyAmount: 0,
    marcoFinal: 2097.60,
    victorFinal: 3835.20,
    leoFinal: 2067.20
  },
  {
    id: 'po7',
    code: 'OC-2026-007',
    date: '2026-07-11',
    concept: 'Renta de Compresor de Respaldo 50HP',
    utility: 68173.94,
    savings: 13634.79,
    utilityAfterSavings: 54539.15,
    marcoPercent: 18,
    victorPercent: 64,
    leoPercent: 18,
    rikyPercent: 0,
    marcoAmount: 9817.05,
    victorAmount: 34905.06,
    leoAmount: 9817.05,
    rikyAmount: 0,
    marcoFinal: 14300.17,
    victorFinal: 26146.07,
    leoFinal: 14092.92
  },
  {
    id: 'po8',
    code: 'OC-2026-012',
    date: '2026-07-12',
    concept: 'Mantenimiento Preventivo de Filtros de Aire',
    utility: 3040,
    savings: 608,
    utilityAfterSavings: 2432,
    marcoPercent: 20,
    victorPercent: 60,
    leoPercent: 20,
    rikyPercent: 0,
    marcoAmount: 486.40,
    victorAmount: 1459.20,
    leoAmount: 486.40,
    rikyAmount: 0,
    marcoFinal: 637.67,
    victorFinal: 1165.90,
    leoFinal: 628.43
  },
  {
    id: 'po9',
    code: 'OC-2026-008',
    date: '2026-07-13',
    concept: 'Servicio Integral y Calibración Sullair 3700',
    utility: 84627.94,
    savings: 16925.59,
    utilityAfterSavings: 67702.35,
    marcoPercent: 20,
    victorPercent: 60,
    leoPercent: 20,
    rikyPercent: 0,
    marcoAmount: 13540.47,
    victorAmount: 40621.41,
    leoAmount: 13540.47,
    rikyAmount: 0,
    marcoFinal: 17751.56,
    victorFinal: 32456.51,
    leoFinal: 17494.29
  },
  {
    id: 'po10',
    code: 'OC-2026-009',
    date: '2026-07-14',
    concept: 'Instalación Eléctrica y Tablero de Control',
    utility: 69153.17,
    savings: 13830.63,
    utilityAfterSavings: 55322.54,
    marcoPercent: 20,
    victorPercent: 20,
    leoPercent: 60,
    rikyPercent: 0,
    marcoAmount: 11064.51,
    victorAmount: 11064.51,
    leoAmount: 33193.52,
    rikyAmount: 0,
    marcoFinal: 14505.57,
    victorFinal: 26521.62,
    leoFinal: 14295.34
  },
  {
    id: 'po11',
    code: 'OC-2026-010',
    date: '2026-07-15',
    concept: 'Mantenimiento Kaeser CSD 75',
    utility: 22857.77,
    savings: 4571.55,
    utilityAfterSavings: 18286.21,
    marcoPercent: 20,
    victorPercent: 60,
    leoPercent: 20,
    rikyPercent: 0,
    marcoAmount: 3657.24,
    victorAmount: 10971.73,
    leoAmount: 3657.24,
    rikyAmount: 0,
    marcoFinal: 4794.65,
    victorFinal: 8766.41,
    leoFinal: 4725.16
  },
  {
    id: 'po12',
    code: 'OC-2026-011',
    date: '2026-07-16',
    concept: 'Reubicación y Puesta en Marcha de Sistema de Enfriamiento',
    utility: 29109.98,
    savings: 5822,
    utilityAfterSavings: 23287.98,
    marcoPercent: 60,
    victorPercent: 20,
    leoPercent: 20,
    rikyPercent: 0,
    marcoAmount: 13972.79,
    victorAmount: 4657.60,
    leoAmount: 4657.60,
    rikyAmount: 0,
    marcoFinal: 6106.11,
    victorFinal: 11164.26,
    leoFinal: 6017.62
  }
];

// LocalStorage helpers
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};
