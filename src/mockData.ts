/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Equipment, HistoryItem, InventoryItem, Staff, WorkOrder, PurchaseOrder, ExpenseControl, Supplier, SupplierInvoice, PersonalDoc, CriticalPendingTask, Quote, CompanyTaxDoc, FailureIndicator, LaborRate, OemCatalogItem, IssuerPartner, MonthlyClosing } from './types';

export const INITIAL_ISSUER_PARTNERS: IssuerPartner[] = [
  {
    id: 'partner_1',
    name: 'Víctor Pedro Ramírez Barrios',
    businessName: 'VÍCTOR PEDRO RAMÍREZ BARRIOS',
    rfc: 'RABV891002TF6',
    taxRegime: '612 - Personas Físicas con Actividades Empresariales y Profesionales',
    address: 'Blvd. Juan Alonso de Torres Pte. 1435, Col. Panorama, C.P. 37160, León, Gto.',
    phone: '477-390-8812',
    email: 'victor.ramirez@mvlmaquinaria.com',
    roleDescription: 'Socio Fundador & Dirección Operativa',
    digitalSignatureUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=VR'
  },
  {
    id: 'partner_2',
    name: 'Ing. Leonardo Daniel Torres',
    businessName: 'ING. LEONARDO DANIEL TORRES',
    rfc: 'TODL850415AA2',
    taxRegime: '612 - Personas Físicas con Actividades Empresariales',
    address: 'Av. Paseo del Moral 214, Jardines del Moral, C.P. 37160, León, Gto.',
    phone: '477-845-9920',
    email: 'leonardo.torres@mvlmaquinaria.com',
    roleDescription: 'Socio Director Técnico & Proyectos',
    digitalSignatureUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=LT'
  },
  {
    id: 'partner_3',
    name: 'MVL Maquinaria y Servicios Industriales S.A. de C.V.',
    businessName: 'MVL MAQUINARIA Y SERVICIOS INDUSTRIALES S.A. DE C.V.',
    rfc: 'MMS190320TK4',
    taxRegime: '601 - General de Ley Personas Morales',
    address: 'Parque Industrial Las Colinas, Calle Silao 402, C.P. 36275, Silao / León, Gto.',
    phone: '477-710-9900',
    email: 'administracion@mvlmaquinaria.com',
    roleDescription: 'Razón Social Corporativa / Dirección General',
    digitalSignatureUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MVL'
  }
];

export const INITIAL_FAILURE_INDICATORS: FailureIndicator[] = [
  {
    id: 'fi1',
    equipmentName: 'Compresor Kaeser BSD 50',
    brand: 'Kaeser',
    clientId: 'c1',
    clientName: 'Grupo Industrial Monterrey',
    plantName: 'Planta Apodaca',
    failureType: 'temperatura',
    frequency: 4,
    lastOccurrence: '2026-07-10',
    recommendation: 'Limpieza de radiador y sustitución de aceite Sigma S-460'
  },
  {
    id: 'fi2',
    equipmentName: 'Secador Atlas Copco FX12',
    brand: 'Atlas Copco',
    clientId: 'c1',
    clientName: 'Grupo Industrial Monterrey',
    plantName: 'Planta Apodaca',
    failureType: 'fuga',
    frequency: 2,
    lastOccurrence: '2026-06-28',
    recommendation: 'Reemplazo de purga electrónica temporizada'
  },
  {
    id: 'fi3',
    equipmentName: 'Compresor Sullair 3700',
    brand: 'Sullair',
    clientId: 'c2',
    clientName: 'Lácteos del Norte',
    plantName: 'Planta Principal Torreón',
    failureType: 'electrica',
    frequency: 3,
    lastOccurrence: '2026-07-04',
    recommendation: 'Revisar contactores de arranque estrella-triángulo'
  },
  {
    id: 'fi4',
    equipmentName: 'Compresor Kaiser AS 30 T',
    brand: 'Kaeser',
    clientId: 'c_andrea',
    clientName: 'ANDREA (CALZADO ANDREA)',
    plantName: 'Planta León (Calzado Andrea)',
    failureType: 'presión',
    frequency: 1,
    lastOccurrence: '2026-08-15',
    recommendation: 'Revisión y ajuste de válvula termostática y separador'
  }
];

export const INITIAL_LABOR_RATES: LaborRate[] = [
  { id: 'lr1', serviceCategory: 'preventivo', capacityRange: '5_15kW', maintenanceHours: '2000', hourlyPrice: 850, distanceKmPrice: 15 },
  { id: 'lr2', serviceCategory: 'preventivo', capacityRange: '37_50kW', maintenanceHours: '4000', hourlyPrice: 1200, distanceKmPrice: 18 },
  { id: 'lr3', serviceCategory: 'correctivo', capacityRange: '75_120kW', maintenanceHours: '8000', hourlyPrice: 1600, distanceKmPrice: 22 },
  { id: 'lr4', serviceCategory: 'instalacion', capacityRange: '37_50kW', hourlyPrice: 1400, distanceKmPrice: 20 },
  { id: 'lr5', serviceCategory: 'predictivo', capacityRange: 'otros', hourlyPrice: 1800, distanceKmPrice: 25 }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup1',
    name: 'Compressores Kaeser México S.A. de C.V.',
    rfc: 'CKM980514HP8',
    contactName: 'Ing. Carlos Mendoza',
    phone: '81-8123-9900',
    email: 'ventas@kaeser.com.mx',
    whatsapp: '81-8123-9900',
    website: 'https://www.kaeser.com.mx',
    onlineShop: 'https://tienda.kaeser.com.mx',
    orderLink: 'https://tienda.kaeser.com.mx/pedidos/mvl',
    creditDays: 30
  },
  {
    id: 'sup2',
    name: 'Atlas Copco Mexicana S.A.',
    rfc: 'ACM750219LK2',
    contactName: 'Lic. Ana Sofía Reyes',
    phone: '55-5358-6000',
    email: 'contacto.mexico@atlascopco.com',
    whatsapp: '55-5358-6001',
    website: 'https://www.atlascopco.com/es-mx',
    creditDays: 45
  },
  {
    id: 'sup3',
    name: 'Refacciones y Aceites Industriales S.A.',
    rfc: 'RAI040910AA1',
    contactName: 'Roberto Treviño',
    phone: '81-8340-2211',
    email: 'ventas@aceitesindustriales.com',
    whatsapp: '81-1900-3344',
    creditDays: 15
  }
];

export const INITIAL_SUPPLIER_INVOICES: SupplierInvoice[] = [
  {
    id: 'si1',
    supplierId: 'sup1',
    invoiceNumber: 'FAC-KAE-8841',
    date: '2026-07-05',
    dueDate: '2026-08-04',
    concept: 'Lote Filtros Separadores y Aceite Sigma S-460',
    subtotal: 45000,
    tax: 7200,
    total: 52200,
    creditDays: 30,
    status: 'pending'
  },
  {
    id: 'si2',
    supplierId: 'sup2',
    invoiceNumber: 'FAC-ATL-1092',
    date: '2026-06-15',
    dueDate: '2026-07-30',
    concept: 'Sensores de Temperatura y Válvulas de Retención GA75',
    subtotal: 28000,
    tax: 4480,
    total: 32480,
    creditDays: 45,
    status: 'pending'
  }
];

export const INITIAL_PERSONAL_DOCS: PersonalDoc[] = [
  {
    id: 'pd1',
    staffId: 'st1',
    staffName: 'Ing. Alejandro Martínez',
    docType: 'DC-3',
    fileName: 'DC3_TrabajoEnAlturas_Alejandro.pdf',
    issueDate: '2025-08-10',
    expiryDate: '2026-08-10',
    status: 'warning'
  },
  {
    id: 'pd2',
    staffId: 'st2',
    staffName: 'Tec. Javier Hernández',
    docType: 'IMSS',
    fileName: 'Alta_IMSS_Javier.pdf',
    issueDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'valid'
  },
  {
    id: 'pd3',
    staffId: 'st3',
    staffName: 'Tec. Miguel Ángel Torres',
    docType: 'Examen Médico',
    fileName: 'ExamenClinico_Miguel.pdf',
    issueDate: '2025-07-01',
    expiryDate: '2026-07-01',
    status: 'expired'
  }
];

export const INITIAL_CRITICAL_TASKS: CriticalPendingTask[] = [
  {
    id: 'cpt1',
    title: 'Autorizar pase de acceso IMSS/DC-3 para Planta Apodaca (Grupo Monterrey)',
    category: 'legal',
    priority: 'high',
    dueDate: '2026-07-30',
    status: 'pending',
    assignedTo: 'Coordinación'
  },
  {
    id: 'cpt2',
    title: 'Enviar Factura #571 aprobada a portal de cobro de Metso',
    category: 'billing',
    priority: 'high',
    dueDate: '2026-07-29',
    status: 'pending',
    assignedTo: 'Contabilidad'
  },
  {
    id: 'cpt3',
    title: 'Confirmar recepción de Cotización COT-2026-004 con Lácteos del Norte',
    category: 'administrative',
    priority: 'medium',
    dueDate: '2026-08-01',
    status: 'in_progress',
    assignedTo: 'Ventas'
  }
];

export const INITIAL_QUOTES: Quote[] = [
  {
    id: 'q1',
    folNum: 'COT-2026-001',
    clientId: 'c1',
    clientName: 'Grupo Industrial Monterrey',
    date: '2026-07-20',
    validUntil: '2026-08-20',
    concept: 'Mantenimiento Mayor 8000 hrs Compresor Kaeser BSD50',
    subtotal: 38500,
    tax: 6160,
    total: 44660,
    status: 'approved',
    mvlDocsRequested: true,
    quoteCategory: 'standard'
  },
  {
    id: 'q_poliza_sample',
    folNum: '040326GNG',
    clientId: 'c2',
    clientName: 'GUALA DISPENSING MEXICO SA DE CV',
    date: '2026-03-04',
    validUntil: '2026-04-14',
    concept: 'Cotización de Póliza de Mantenimiento Anual Equipos de Climatización (Póliza Tipo A)',
    subtotal: 112122,
    tax: 17939.52,
    total: 130061.52,
    status: 'approved',
    quoteType: 'vendedor',
    quoteCategory: 'poliza',
    policyType: 'poliza_a',
    agentName: 'Ing. Leonardo Daniel Torres',
    plantName: 'Planta Silao',
    policyDetails: {
      policyType: 'poliza_a',
      visitsPerYear: 3,
      priorityHighHours: 12,
      priorityMidHours: 72,
      priorityLowDays: 20
    },
    itemsTable: [
      { partida: 1, description: 'Mantenimiento preventivo Minisplit 1 a 1.5 TR Alta prioridad', brand: 'Kaeser / Clima', quantity: 3, partNumber: 'POL-01', catalogPrice: 1550, total: 13950, deliveryTime: 'A programar' },
      { partida: 2, description: 'Mantenimiento preventivo Minisplit 2 a 3 TR Alta prioridad', brand: 'Kaeser / Clima', quantity: 1, partNumber: 'POL-02', catalogPrice: 1900, total: 5700, deliveryTime: 'A programar' },
      { partida: 3, description: 'Mantenimiento preventivo UPA de 4 a 10 TR Alta prioridad', brand: 'Clima Ind', quantity: 2, partNumber: 'POL-03', catalogPrice: 3262, total: 19572, deliveryTime: 'A programar' },
      { partida: 4, description: 'Mantenimiento preventivo Minisplit 1 a 1.5 TR Baja prioridad', brand: 'Kaeser / Clima', quantity: 14, partNumber: 'POL-04', catalogPrice: 1200, total: 33600, deliveryTime: 'A programar' },
      { partida: 5, description: 'Mantenimiento preventivo Minisplit 2 a 3 TR Baja prioridad', brand: 'Kaeser / Clima', quantity: 5, partNumber: 'POL-05', catalogPrice: 1680, total: 16800, deliveryTime: 'A programar' },
      { partida: 6, description: 'Mantenimiento preventivo UPA de 4 a 10 TR Baja prioridad', brand: 'Clima Ind', quantity: 5, partNumber: 'POL-06', catalogPrice: 2250, total: 22500, deliveryTime: 'A programar' }
    ]
  },
  {
    id: 'q_suministro_sample',
    folNum: 'M2-1326-GNG',
    clientId: 'c2',
    clientName: 'GUALA DISPENSING / Ing. Sergio Molina',
    date: '2026-05-13',
    validUntil: '2026-06-13',
    concept: 'Cotización de Suministro e Instalación de Mini Split YORK 1 TR Frío 220VAC & Canalización Eléctrica',
    subtotal: 71639,
    tax: 11462.24,
    total: 83101.24,
    status: 'approved',
    quoteType: 'vendedor',
    quoteCategory: 'suministro_instalacion',
    agentName: 'Ing. Leonardo Daniel Torres',
    plantName: 'Planta Silao / Oficina Compras',
    supplyInstallationDetails: {
      equipmentItems: [
        { partida: 1, description: 'Suministro minisplit 1 TR frío 220vac', brand: 'YORK', quantity: 1, partNumber: 'SOLO FRIO', catalogPrice: 17409.28, total: 17409.28, deliveryTime: '1 a 4 semanas' },
        { partida: 2, description: 'Suministro de bomba de dren de condensados', brand: 'COLDTEK', quantity: 1, partNumber: 'N/A', catalogPrice: 2500, total: 2500, deliveryTime: '1 a 4 semanas' },
        { partida: 3, description: 'Instalación y preparación para bomba de dren', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 1600, total: 1600, deliveryTime: 'INMEDIATO' },
        { partida: 4, description: 'Instalación de unidad evaporadora y condensadora', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 5000, total: 5000, deliveryTime: 'INMEDIATO' },
        { partida: 5, description: 'Servicio de presurización con nitrógeno', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 1200, total: 1200, deliveryTime: 'INMEDIATO' },
        { partida: 6, description: 'Revisión de estanquedad', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 500, total: 500, deliveryTime: 'INMEDIATO' },
        { partida: 7, description: 'Compensación de gas refrigerante R-32', brand: 'MVL', quantity: 2, partNumber: 'N/A', catalogPrice: 1500, total: 3000, deliveryTime: 'INMEDIATO' },
        { partida: 8, description: 'Ajuste de cálculo sobrecalentamiento y subenfriamiento', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 850, total: 850, deliveryTime: 'INMEDIATO' },
        { partida: 9, description: 'Servicio de tubería de cobre y canalización', brand: 'MIRAGE', quantity: 2, partNumber: 'N/A', catalogPrice: 1500, total: 3000, deliveryTime: 'INMEDIATO' },
        { partida: 10, description: 'Ménsula pared para condensador e instalación', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 3350, total: 3350, deliveryTime: 'INMEDIATO' }
      ],
      electricalItems: [
        { partida: 1, description: 'Tubería 3/4 pared delgada', brand: 'OMEGA', quantity: 24, partNumber: 'N/A', catalogPrice: 209.04, total: 5016.96, deliveryTime: 'INMEDIATO' },
        { partida: 2, description: 'Cable eléctrico 10 AWG 160 mts', brand: 'INDIANA', quantity: 1, partNumber: 'N/A', catalogPrice: 5270, total: 5270, deliveryTime: 'INMEDIATO' },
        { partida: 3, description: 'Cable eléctrico 12 AWG 80 mts', brand: 'INDIANA', quantity: 1, partNumber: 'N/A', catalogPrice: 2100, total: 2100, deliveryTime: 'INMEDIATO' },
        { partida: 4, description: 'Condulet OLB 13 mm pared delgada', brand: 'OMEGA', quantity: 12, partNumber: 'N/A', catalogPrice: 260, total: 3120, deliveryTime: 'INMEDIATO' },
        { partida: 5, description: 'Cople y Conector 13 mm pared delgada (24 pzas c/u)', brand: 'OMEGA', quantity: 2, partNumber: 'N/A', catalogPrice: 1020, total: 2040, deliveryTime: 'INMEDIATO' },
        { partida: 6, description: 'Interruptor 20 amp 2 polos SQD y Condulet C', brand: 'SQD/OMEGA', quantity: 1, partNumber: 'N/A', catalogPrice: 2096.56, total: 2096.56, deliveryTime: 'INMEDIATO' },
        { partida: 7, description: 'Soportería e insumos', brand: 'N/A', quantity: 1, partNumber: 'N/A', catalogPrice: 1500, total: 1500, deliveryTime: '1 a 2 días' },
        { partida: 8, description: 'Canalización y mano de obra eléctrica', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 12086.20, total: 12086.20, deliveryTime: '1 semana' }
      ],
      scopeList: [
        '1. Suministro de equipo mini-split.',
        '2. Instalación de evaporadora.',
        '3. Instalación de condensadora.',
        '4. Instalación de bomba de condensados.',
        '5. Canalización de servicio de dren de condensados.',
        '6. Canalización de servicio de tubería cobre.',
        '7. Canalización de servicio eléctrico.',
        '8. Pruebas de hermeticidad de tubería con nitrógeno.',
        '9. Procedimiento de alto vacío en tubería para asegurar y alargar la vida útil del equipo hasta 250 Micrones.',
        '10. Compensación de gas refrigerante con cálculos de sobre calentamiento y sub enfriamiento.',
        '11. Pruebas de flujo de aire con anemómetro y termómetro.',
        '12. Recomendaciones de servicios preventivos posteriores.',
        '13. Canalización e instalación de tubería eléctrica pared delgada.',
        '14. Suministro e instalación de termomagnético 20 * 2 SQUARED.',
        '15. Canalización de cable eléctrico 10 AWG en tubería con tierra física 3 hilos.',
        '16. Conexión de uso rudo a mini Split. Condulet LB'
      ]
    }
  },
  {
    id: 'q2',
    folNum: 'COT-2026-002',
    clientId: 'c2',
    clientName: 'Lácteos del Norte',
    date: '2026-07-25',
    validUntil: '2026-08-25',
    concept: 'Reemplazo de Válvula de Admisión y Filtros de Aire Atlas Copco',
    subtotal: 19200,
    tax: 3072,
    total: 22272,
    status: 'sent',
    mvlDocsRequested: false,
    quoteCategory: 'standard'
  }
];

export const INITIAL_COMPANY_TAX_DOCS: CompanyTaxDoc[] = [
  {
    id: 'ctd1',
    title: 'Constancia de Situación Fiscal MVL 2026',
    category: 'CSF',
    period: 'Julio 2026',
    uploadDate: '2026-07-01',
    status: 'valid'
  },
  {
    id: 'ctd2',
    title: 'Opinión de Cumplimiento SAT 32D (Positiva)',
    category: 'Opinión SAT',
    period: 'Julio 2026 - Semana 2',
    uploadDate: '2026-07-14',
    status: 'valid'
  },
  {
    id: 'ctd3',
    title: 'Póliza de Responsabilidad Civil Industrial',
    category: 'Póliza Seguro',
    period: 'Año 2026',
    uploadDate: '2026-01-10',
    status: 'valid'
  }
];

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
  },
  {
    id: 'c_andrea',
    name: 'ANDREA (CALZADO ANDREA)',
    companyName: 'CALZADO ANDREA S.A. DE C.V.',
    rfc: 'CAN920101XX1',
    email: 'mantenimiento@andrea.com',
    phone: '477-710-1200',
    plants: [
      { id: 'p_andrea_1', name: 'Planta León (Calzado Andrea)', address: 'Blvd. Juan Alonso de Torres #1200', city: 'León, Gto.' }
    ],
    contacts: [
      { name: 'Ing. Andrea / Depto. Mantenimiento', role: 'Supervisión de Planta', phone: '477-710-1200', email: 'mantenimiento@andrea.com' }
    ]
  }
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq_andrea_as30t',
    clientId: 'c_andrea',
    plantId: 'p_andrea_1',
    name: 'Compresor Kaiser AS 30 T',
    brand: 'KAISER / Kaeser',
    model: 'AS 30 T',
    serialNumber: '1030',
    oilType: 'Lubricante Sintético (40L)',
    capacity: '30 HP',
    filtersRequired: 'F.Aire 6.2000.0, F.Aceite 6.1985.0, F.Separador 6.1963.0',
    status: 'active',
    lastMaintenance: '2026-06-25',
    nextMaintenance: '2026-12-25',
    engineHours: 9450,
    type: 'compresor'
  },
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
  { 
    id: 'i1', 
    code: '6.2012.0', 
    name: 'Filtro de Aire Kaeser 6.2012.0', 
    brand: 'Kaeser',
    category: 'filtros', 
    stock: 12, 
    minStock: 3, 
    price: 1250, 
    unit: 'pza',
    compatibleCodes: [
      { code: 'KC160-017', brand: 'Genérico OEM Kaeser', notes: 'Reemplazo directo' },
      { code: 'FIL-KAE-50', brand: 'MVL Interno' }
    ]
  },
  { 
    id: 'i2', 
    code: '6.1981.1', 
    name: 'Filtro de Aceite Kaeser 6.1981.1', 
    brand: 'Kaeser',
    category: 'filtros', 
    stock: 8, 
    minStock: 3, 
    price: 950, 
    unit: 'pza',
    compatibleCodes: [
      { code: '6.1985.0', brand: 'Kaeser OEM' },
      { code: 'KL320-014', brand: 'Genérico OEM' }
    ]
  },
  { 
    id: 'i3', 
    code: '1613-8720-00', 
    name: 'Filtro Aire Atlas Copco 1613-8720-00', 
    brand: 'Atlas Copco',
    category: 'filtros', 
    stock: 2, 
    minStock: 4, 
    price: 1850, 
    unit: 'pza',
    compatibleCodes: [
      { code: 'FIL-ATL-GA', brand: 'Atlas Copco Alterno' },
      { code: 'SA-18720', brand: 'Sure Filter' }
    ]
  },
  { 
    id: 'i4', 
    code: 'S-460', 
    name: 'Aceite Sigma Fluid S-460 (Cubeta 19L)', 
    brand: 'Kaeser',
    category: 'aceites', 
    stock: 15, 
    minStock: 5, 
    price: 5400, 
    unit: 'cubeta',
    compatibleCodes: [
      { code: 'KAOA467C-05', brand: 'Kaeser Sintético OEM 40L' },
      { code: 'ACE-SIG-S46', brand: 'Sigma Fluid' }
    ]
  },
  { 
    id: 'i5', 
    code: 'VAL-SOL-24V', 
    name: 'Válvula Solenoide de Admisión 24V', 
    brand: 'Kaeser / Sullair',
    category: 'pneumatic', 
    stock: 3, 
    minStock: 2, 
    price: 3200, 
    unit: 'pza',
    compatibleCodes: [
      { code: '4.7333.0', brand: 'Kaeser OEM' }
    ]
  },
  { 
    id: 'i6', 
    code: 'PRE-SENS-150', 
    name: 'Sensor de Presión 0-150 PSI 4-20mA', 
    brand: 'Danfoss / Kaeser',
    category: 'electronic', 
    stock: 1, 
    minStock: 2, 
    price: 4100, 
    unit: 'pza'
  },
  { 
    id: 'i7', 
    code: 'VAL-PUR-TMP', 
    name: 'Válvula de Purga Temporizada 1/2"', 
    brand: 'Jorc / Atlas Copco',
    category: 'refrigeration', 
    stock: 5, 
    minStock: 2, 
    price: 1950, 
    unit: 'pza'
  },
  {
    id: 'i8',
    code: '6.1963.0',
    name: 'Filtro Separador Kaeser 6.1963.0',
    brand: 'Kaeser',
    category: 'filtros',
    stock: 4,
    minStock: 2,
    price: 2668,
    unit: 'pza',
    compatibleCodes: [
      { code: 'MV110-003', brand: 'OEM Kaeser' }
    ]
  }
];

export const INITIAL_MONTHLY_CLOSINGS: MonthlyClosing[] = [
  {
    id: 'mc_2026_07',
    period: 'Julio 2026',
    year: 2026,
    month: 7,
    closedAt: '2026-07-31T18:00:00Z',
    closedBy: 'Víctor Pedro Ramírez Barrios',
    totalIncome: 485000,
    totalExpenses: 295000,
    netProfit: 190000,
    savingsAmount: 38000,
    closedProjectsCount: 8,
    pendingProjectsCount: 3,
    projects: [
      {
        quoteFolNum: 'COT-2026-001',
        clientName: 'Grupo Industrial Monterrey',
        concept: 'Mantenimiento Preventivo 4,000 Horas Compresor Kaeser BSD 50',
        income: 28500,
        expenses: 16200,
        utility: 12300,
        status: 'closed'
      },
      {
        quoteFolNum: 'COT-2026-002',
        clientName: 'Lácteos del Norte',
        concept: 'Reparación de Secador Frigorífico y Purga Temporizada',
        income: 14200,
        expenses: 8100,
        utility: 6100,
        status: 'closed'
      },
      {
        quoteFolNum: '887201GNG',
        clientName: 'CALZADO ANDREA S.A. DE C.V.',
        concept: 'Suministro de 9 Refacciones y Filtros OEM Compresor Kaiser AS 30 T',
        income: 38500,
        expenses: 24000,
        utility: 14500,
        status: 'closed'
      }
    ]
  }
];

export const INITIAL_STAFF: Staff[] = [
  { 
    id: 's1', 
    name: 'Ing. Carlos Mendoza', 
    role: 'coordinator', 
    customJobTitle: 'Coordinador General de Ventas', 
    email: 'carlos.mendoza@mvl.com', 
    phone: '81-8181-9922', 
    personalPhone: '81-9988-7766',
    age: 38,
    active: true,
    monthlyMedicalCertMonth: '2026-07',
    medicalCertFileName: 'Certificado_Medico_Carlos_Julio2026.pdf',
    quotesGenerated: 18,
    salesClosed: 14
  },
  { 
    id: 's2', 
    name: 'Roberto Sánchez', 
    role: 'technician', 
    customJobTitle: 'Técnico Especialista Kaeser', 
    email: 'roberto.sanchez@mvl.com', 
    phone: '81-2233-4455', 
    personalPhone: '81-1122-3344',
    age: 32,
    active: true,
    monthlyMedicalCertMonth: '2026-07',
    medicalCertFileName: 'Certificado_Medico_Roberto_Julio2026.pdf',
    quotesGenerated: 0,
    salesClosed: 0
  },
  { 
    id: 's3', 
    name: 'Alejandro Torres', 
    role: 'technician', 
    customJobTitle: 'Técnico Atlas Copco & Clima', 
    email: 'alejandro.torres@mvl.com', 
    phone: '81-4455-6677', 
    personalPhone: '81-5566-7788',
    age: 29,
    active: true,
    monthlyMedicalCertMonth: '2026-06',
    medicalCertFileName: 'Certificado_Medico_Alejandro_Junio2026.pdf',
    quotesGenerated: 0,
    salesClosed: 0
  },
  { 
    id: 's4', 
    name: 'Lic. Mariana Valdez', 
    role: 'sales', 
    customJobTitle: 'Ejecutiva de Ventas Senior', 
    email: 'mariana.valdez@mvl.com', 
    phone: '81-3344-5566', 
    personalPhone: '81-6677-8899',
    age: 30,
    active: true,
    monthlyMedicalCertMonth: '2026-07',
    medicalCertFileName: 'Certificado_Medico_Mariana_Julio2026.pdf',
    quotesGenerated: 24,
    salesClosed: 19
  },
  { 
    id: 's5', 
    name: 'Sofía Gutiérrez', 
    role: 'rh', 
    customJobTitle: 'Encargada de RH & Accesos a Planta', 
    email: 'sofia.rh@mvl.com', 
    phone: '81-7788-9900', 
    personalPhone: '81-2244-6688',
    age: 34,
    active: true,
    monthlyMedicalCertMonth: '2026-07',
    medicalCertFileName: 'Certificado_Medico_Sofia_Julio2026.pdf',
    quotesGenerated: 0,
    salesClosed: 0
  }
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
    orderNumber: '1',
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
    orderNumber: '2',
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
    orderNumber: '3',
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
    orderNumber: '4',
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
    orderNumber: '5',
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
    orderNumber: '6',
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
    orderNumber: '7',
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
    orderNumber: '8',
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
    orderNumber: '9',
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
    orderNumber: '10',
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
    orderNumber: '11',
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
    orderNumber: '12',
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

export const INITIAL_EXPENSE_CONTROL: ExpenseControl[] = [
  {
    id: 'exp1',
    projectDescription: 'aceite para compresor oc 417252',
    clientName: 'SENSIENT',
    agentName: 'Marco',
    invoiceDate: '2026-03-13',
    invoiceNumber: '90',
    paymentDate: '2026-06-03',
    tax: 2061.60,
    subtotal: 12885.00,
    clientPayment: 12885.00,
    expenses: 0.00,
    utility: 12885.00,
    savings: 2577.00
  },
  {
    id: 'exp2',
    projectDescription: 'reparación de secadora OC 416063',
    clientName: 'SENSIENT',
    agentName: 'Marco',
    invoiceDate: '2026-03-13',
    invoiceNumber: '91',
    paymentDate: '2026-06-03',
    tax: 5017.60,
    subtotal: 31360.00,
    clientPayment: 31360.00,
    expenses: 0.00,
    utility: 31360.00,
    savings: 6272.00
  },
  {
    id: 'exp3',
    projectDescription: 'INSTALACION DE COMPRESOR CON No. DE PEDIDO: 4500148860',
    clientName: 'relats',
    agentName: 'Victor',
    invoiceDate: '2026-04-09',
    invoiceNumber: '393',
    paymentDate: '2026-06-18',
    tax: 25105.60,
    subtotal: 156910.00,
    clientPayment: 156910.00,
    expenses: 85269.53,
    utility: 71640.47,
    savings: 14328.09
  },
  {
    id: 'exp4',
    projectDescription: 'tenería panamericana servicio a GA55 nuevo',
    clientName: 'Teneria pa',
    agentName: 'victor',
    invoiceDate: '2026-04-27',
    invoiceNumber: '397',
    paymentDate: '2026-06-04',
    tax: 9630.40,
    subtotal: 60190.00,
    clientPayment: 60190.00,
    expenses: 22980.00,
    utility: 37210.00,
    savings: 7442.00
  },
  {
    id: 'exp5',
    projectDescription: 'filtros de aceite separador y de aire',
    clientName: 'Teneria pa',
    agentName: 'victor',
    invoiceDate: '2026-05-05',
    invoiceNumber: '401',
    paymentDate: '2026-06-12',
    tax: 1896.00,
    subtotal: 11850.00,
    clientPayment: 11850.00,
    expenses: 1850.00,
    utility: 10000.00,
    savings: 2000.00
  },
  {
    id: 'exp6',
    projectDescription: 'SERVICIO DE MANTENIMIENTO PREVENTIVO A VARIADORES',
    clientName: 'Teneria pa',
    agentName: 'victor',
    invoiceDate: '2026-05-05',
    invoiceNumber: '402',
    paymentDate: '2026-06-12',
    tax: 1600.00,
    subtotal: 10000.00,
    clientPayment: 10000.00,
    expenses: 0.00,
    utility: 10000.00,
    savings: 2000.00
  },
  {
    id: 'exp7',
    projectDescription: 'relats anualidad 1 de 4',
    clientName: 'relats',
    agentName: 'victor',
    invoiceDate: '2026-05-05',
    invoiceNumber: '403',
    paymentDate: '2026-05-25',
    tax: 21931.83,
    subtotal: 137073.94,
    clientPayment: 137073.94,
    expenses: 68900.00,
    utility: 68173.94,
    savings: 13634.79
  },
  {
    id: 'exp8',
    projectDescription: 'Roto Xtend Fluid Cikautxo OC 3703312',
    clientName: 'cikautxo',
    agentName: 'victor',
    invoiceDate: '2026-05-12',
    invoiceNumber: '404',
    paymentDate: '2026-06-15',
    tax: 3470.40,
    subtotal: 21690.00,
    clientPayment: 21690.00,
    expenses: 18650.00,
    utility: 3040.00,
    savings: 608.00
  },
  {
    id: 'exp9',
    projectDescription: 'cikautxo Mtto GA75 (2) GA30 OC 3399008',
    clientName: 'cikautxo',
    agentName: 'victor',
    invoiceDate: '2026-05-22',
    invoiceNumber: '406',
    paymentDate: '2026-06-29',
    tax: 20940.80,
    subtotal: 130880.00,
    clientPayment: 130880.00,
    expenses: 46252.06,
    utility: 84627.94,
    savings: 16925.59
  },
  {
    id: 'exp10',
    projectDescription: 'insta lación de ac guala oc ZX0977',
    clientName: 'Guala',
    agentName: 'LEONARDO',
    invoiceDate: '2026-06-12',
    invoiceNumber: '412',
    paymentDate: '2026-06-12',
    tax: 22979.05,
    subtotal: 143619.05,
    clientPayment: 143619.05,
    expenses: 74465.88,
    utility: 69153.17,
    savings: 13830.63
  },
  {
    id: 'exp11',
    projectDescription: 'factura de equioo refri INVERSIÓN MAILHOT',
    clientName: 'marco',
    agentName: 'victor',
    invoiceDate: '2026-06-03',
    invoiceNumber: '415',
    paymentDate: '2026-06-03',
    tax: 1740.53,
    subtotal: 10878.31,
    clientPayment: 10878.31,
    expenses: 0.00,
    utility: 10878.31,
    savings: 2175.66
  },
  {
    id: 'exp12',
    projectDescription: 'factura de equioo refri INVERSIÓN MAILHOT',
    clientName: 'leonardo',
    agentName: 'victor',
    invoiceDate: '2026-06-03',
    invoiceNumber: '416',
    paymentDate: '2026-06-03',
    tax: 1740.53,
    subtotal: 10878.31,
    clientPayment: 10878.31,
    expenses: 0.00,
    utility: 10878.31,
    savings: 2175.66
  },
  {
    id: 'exp13',
    projectDescription: 'servico de aires metso',
    clientName: 'Metso',
    agentName: 'victor',
    invoiceDate: '2026-06-04',
    invoiceNumber: '571',
    paymentDate: '2026-06-04',
    tax: 3657.24,
    subtotal: 22857.77,
    clientPayment: 22857.77,
    expenses: 0.00,
    utility: 22857.77,
    savings: 4571.55
  },
  {
    id: 'exp14',
    projectDescription: 'factura a leo por metso',
    clientName: 'leonardo',
    agentName: 'victor',
    invoiceDate: '2026-06-25',
    invoiceNumber: '421',
    paymentDate: '2026-06-04',
    tax: 3657.24,
    subtotal: 22857.76,
    clientPayment: 22857.76,
    expenses: 0.00,
    utility: 22857.76,
    savings: 4571.55
  },
  {
    id: 'exp15',
    projectDescription: 'novatec anualidad',
    clientName: 'novatec',
    agentName: 'marco',
    invoiceDate: '2026-06-22',
    invoiceNumber: '132',
    paymentDate: '2026-06-22',
    tax: 4657.60,
    subtotal: 29109.98,
    clientPayment: 29109.98,
    expenses: 0.00,
    utility: 29109.98,
    savings: 5822.00
  }
];

export const INITIAL_OEM_PARTS_CATALOG: OemCatalogItem[] = [
  {
    id: 'oem_andrea_1',
    clientName: 'ANDREA',
    equipmentName: 'COMPRESOR',
    brand: 'KAISER',
    model: 'AS 30 T',
    serialNumber: '1030',
    partDescription: 'F.AIRE',
    partNumberOriginal: '6.2000.0',
    quantity: 1,
    oemGenericBrandPart: 'KC160-017',
    price: 84.35,
    suggestedPrice: 0,
    incrementPercent: 5,
    publicPrice: 0,
    currency: 'USD',
    date: '2026-06-25'
  },
  {
    id: 'oem_andrea_2',
    clientName: 'ANDREA',
    equipmentName: 'COMPRESOR',
    brand: 'KAISER',
    model: 'AS 30 T',
    serialNumber: '1030',
    partDescription: 'F ACEITE',
    partNumberOriginal: '6.1985.0',
    quantity: 1,
    oemGenericBrandPart: 'KL320-014',
    price: 20.25,
    suggestedPrice: 0,
    incrementPercent: 5,
    publicPrice: 0,
    currency: 'USD',
    date: '2026-06-25'
  },
  {
    id: 'oem_andrea_3',
    clientName: 'ANDREA',
    equipmentName: 'COMPRESOR',
    brand: 'KAISER',
    model: 'AS 30 T',
    serialNumber: '1030',
    partDescription: 'F. SEPARADOR',
    partNumberOriginal: '6.1963.0',
    quantity: 1,
    oemGenericBrandPart: 'MV110-003',
    price: 136.75,
    suggestedPrice: 0,
    incrementPercent: 5,
    publicPrice: 0,
    currency: 'USD',
    date: '2026-06-25'
  },
  {
    id: 'oem_andrea_4',
    clientName: 'ANDREA',
    equipmentName: 'COMPRESOR',
    brand: 'KAISER',
    model: 'AS 30 T',
    serialNumber: '1030',
    partDescription: 'V. PRES MIN',
    partNumberOriginal: '4.7333.0',
    quantity: 1,
    oemGenericBrandPart: 'Genérica KAISER',
    price: 0,
    currency: 'USD',
    date: '2026-06-25'
  },
  {
    id: 'oem_andrea_5',
    clientName: 'ANDREA',
    equipmentName: 'COMPRESOR',
    brand: 'KAISER',
    model: 'AS 30 T',
    serialNumber: '1030',
    partDescription: 'V. ANTI RETORNO',
    partNumberOriginal: '2.0701.0',
    quantity: 1,
    oemGenericBrandPart: 'Genérica KAISER',
    price: 0,
    currency: 'USD',
    date: '2026-06-25'
  },
  {
    id: 'oem_andrea_6',
    clientName: 'ANDREA',
    equipmentName: 'COMPRESOR',
    brand: 'KAISER',
    model: 'AS 30 T',
    serialNumber: '1030',
    partDescription: 'V. TERMOSTATICA',
    partNumberOriginal: '7.0399.0',
    quantity: 1,
    oemGenericBrandPart: 'Genérica KAISER',
    price: 0,
    currency: 'USD',
    date: '2026-06-25'
  },
  {
    id: 'oem_andrea_7',
    clientName: 'ANDREA',
    equipmentName: 'COMPRESOR',
    brand: 'KAISER',
    model: 'AS 30 T',
    serialNumber: '1030',
    partDescription: 'V. LINEA BARRIDO',
    partNumberOriginal: 'N/A',
    quantity: 1,
    oemGenericBrandPart: 'Genérica KAISER',
    price: 0,
    currency: 'USD',
    date: '2026-06-25'
  },
  {
    id: 'oem_andrea_8',
    clientName: 'ANDREA',
    equipmentName: 'COMPRESOR',
    brand: 'KAISER',
    model: 'AS 30 T',
    serialNumber: '1030',
    partDescription: 'V. ADMISION',
    partNumberOriginal: 'N/A',
    quantity: 1,
    oemGenericBrandPart: 'Genérica KAISER',
    price: 0,
    currency: 'USD',
    date: '2026-06-25'
  },
  {
    id: 'oem_andrea_9',
    clientName: 'ANDREA',
    equipmentName: 'COMPRESOR',
    brand: 'KAISER',
    model: 'AS 30 T',
    serialNumber: '1030',
    partDescription: 'LUBRICANTE',
    partNumberOriginal: 'KAOA467C-05',
    quantity: '40 LTS',
    oemGenericBrandPart: 'KAOA467C-05',
    price: 410.00,
    suggestedPrice: 533.00,
    incrementPercent: 0,
    publicPrice: 559.65,
    currency: 'USD',
    date: '2026-06-25'
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
