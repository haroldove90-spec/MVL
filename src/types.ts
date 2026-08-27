/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'coordinator' | 'accounting' | 'technician' | 'client' | 'socios' | 'ventas';

export interface Supplier {
  id: string;
  name: string;
  rfc: string;
  contactName: string;
  phone: string;
  email: string;
  whatsapp?: string;
  website?: string;
  onlineShop?: string;
  orderLink?: string;
  creditDays: number;
}

export interface SupplierInvoice {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  concept: string;
  subtotal: number;
  tax: number;
  total: number;
  creditDays: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface PersonalDoc {
  id: string;
  staffId: string;
  staffName: string;
  docType: 'DC-3' | 'IMSS' | 'CSF' | 'Identificación' | 'Examen Médico';
  fileName: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'warning' | 'expired';
}

export interface CriticalPendingTask {
  id: string;
  title: string;
  category: 'operational' | 'administrative' | 'billing' | 'legal';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
}

export interface PlantAccessRequirements {
  imssPayment: boolean;
  imssRightsValidity: boolean;
  medicalCertificates: boolean;
  riskAssessmentForm: boolean;
  others?: string;
  requestedByVendorDate?: string;
  approvedByRH?: boolean;
}

export interface IssuerPartner {
  id: string;
  name: string;
  businessName: string; // Razón Social oficial
  rfc: string;
  taxRegime: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  digitalSignatureUrl?: string;
  roleDescription: string;
}

export interface QuoteItem {
  partida: number;
  description: string;
  brand: string;
  quantity: number;
  unit?: string; // pza, lts, kit, servicio, tramo, cubeta, etc.
  partNumber: string;
  catalogPrice: number;
  total: number;
  deliveryTime: string;
  inStock?: boolean;
  stockQty?: number;
  compatibleCodes?: { code: string; brand: string }[];
  isCustomPriceRequest?: boolean;
}

export interface Quote {
  id: string;
  folNum: string; // COT-2026-001
  clientId: string;
  clientName: string;
  date: string;
  validUntil: string;
  concept: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'discount_requested' | 'denied';
  quoteType?: 'vendedor' | 'cliente' | 'publico';
  quoteOrigin?: 'nuevo' | 'registrado' | 'publico_general';
  quoteCategory?: 'standard' | 'poliza' | 'suministro_instalacion' | 'personalizado';
  policyType?: 'poliza_a' | 'poliza_b';
  serviceTypeCategory?: 'preventivo' | 'correctivo' | 'predictivo' | 'suministro_refacciones' | 'personalizado';
  serviceHours?: '2k' | '4k' | '6k' | '8k' | '16k' | 'otro';
  customServicePriceRequested?: boolean;
  publicClientName?: string; // Para Venta Público
  discountRequested?: number;
  discountApproved?: boolean;
  mvlDocsRequested?: boolean; // Solicitar a Contabilidad documentos fiscales de MVL
  commercialConditions?: string;
  deliveryLeadTime?: string;
  reasonDenied?: 'cambio_admin' | 'no_contesto' | 'cambio_maquina' | 'otros';
  deniedReasonDetails?: string;
  missingPricesList?: { description: string; partNumber?: string; requestedPrice?: number; approved?: boolean }[];
  plantAccessReqs?: PlantAccessRequirements;
  poPdfUrl?: string;
  clientPoNumber?: string;
  poApprovalDate?: string;
  poApprovalStatus?: 'approved' | 'rejected' | 'pending';
  agentName?: string;
  plantName?: string;
  crmGiro?: string;
  whatsapp?: string;
  clientEmail?: string;
  itemsTable?: QuoteItem[];
  supplyInstallationDetails?: {
    equipmentItems: QuoteItem[];
    electricalItems: QuoteItem[];
    scopeList: string[];
  };
  policyDetails?: {
    policyType: 'poliza_a' | 'poliza_b';
    visitsPerYear: number;
    priorityHighHours: number;
    priorityMidHours: number;
    priorityLowDays: number;
    scopeList?: string[];
  };
  equipmentDetails?: {
    equipmentType?: 'Compresor' | 'Secador' | 'Aire Acondicionado' | 'Otros';
    brand: string;
    model: string;
    serialNumber?: string;
    capacity?: string;
    voltage?: string; // 220V, 440V, 110V
    serviceType?: string;
    mode?: 'venta' | 'renta' | 'servicio';
    dataPlatePhotoUrl?: string;
    manualPdfUrl?: string;
  };
  issuerPartnerId?: string;
  issuerPartnerName?: string;
  issuerPartnerRfc?: string;
  issuerPartnerBusinessName?: string;
  issuerSignatureName?: string;
  preBillingRequest?: {
    requestedAt: string;
    status: 'pending' | 'invoiced';
    invoiceNumber?: string;
    invoiceDate?: string;
    creditDays: number;
  };
  monthClosed?: boolean;
  monthClosedPeriod?: string;
  projectExpenses?: { id: string; concept: string; amount: number; category: string; date: string }[];
}

export interface CompanyTaxDoc {
  id: string;
  title: string;
  category: 'CSF' | 'Opinión SAT' | 'Acta Constitutiva' | 'Comprobante Domicilio' | 'Póliza Seguro';
  period: string; // e.g. "Julio 2026 - Semana 1"
  uploadDate: string;
  status: 'valid' | 'renewal_needed' | 'missing';
  fileUrl?: string;
}

export interface Plant {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  rfc: string;
  email: string;
  phone: string;
  whatsapp?: string;
  plants: Plant[];
  contacts: Contact[];
  isIndependent?: boolean; // Particular Independiente
  taxDocUrl?: string; // Constancia Fiscal PDF
  industryGiro?: string;
}

export interface Equipment {
  id: string;
  clientId: string;
  plantId: string;
  name: string;
  brand: string; // Atlas Copco, Kaeser, Ingersoll Rand, Sullair
  model: string;
  serialNumber: string;
  oilType: string;
  capacity: string; // e.g. 50 HP / 37 kW
  filtersRequired: string;
  status: 'active' | 'warning' | 'maintenance';
  lastMaintenance: string;
  nextMaintenance: string;
  engineHours: number;
  voltage?: string;
  type?: 'compresor' | 'secador' | 'otros';
  mode?: 'venta' | 'renta';
  dataPlatePhotoUrl?: string;
  compatibleParts?: string[];
  telemetry?: {
    psi: number;
    temp: number;
    vibration: 'normal' | 'moderate' | 'high';
    rpm: number;
    lastUpdate: string;
  };
}

export interface HistoryItem {
  id: string;
  equipmentId: string;
  date: string;
  type: 'preventive' | 'corrective';
  description: string;
  technicianName: string;
  partsReplaced: { name: string; quantity: number }[];
}

export interface ChecklistItem {
  id: string;
  task: string;
  checked: boolean;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  code: string; // OT-1001
  equipmentId: string;
  clientId: string;
  plantId: string;
  type: 'preventive' | 'corrective' | 'instalacion' | 'predictivo';
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  scheduledDate: string;
  engineHours: number;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  checklist: ChecklistItem[];
  observations: string;
  partsUsed: { itemId: string; name: string; quantity: number; price: number }[];
  beforePhoto?: string;
  afterPhoto?: string;
  signature?: string;
  signatureName?: string;
  dateCompleted?: string;
  approvedByCoordinator?: boolean;
  partsAvailable?: boolean;
  plantAccessDocsValid?: boolean;
  toolsReady?: boolean;
  technicianAvailable?: boolean;
  clientPoNumber?: string;
  quoteFolNum?: string;
  clientFeedback?: {
    rating: number; // 1 to 5
    nps: number; // 0 to 10
    comments: string;
  };
  laborHours?: number;
  laborCost?: number;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: 'electronic' | 'pneumatic' | 'refrigeration' | 'consumable' | 'filtros' | 'aceites' | 'otros';
  brand?: string;
  partNumber?: string;
  stock: number;
  minStock: number;
  price: number;
  isConsumable?: boolean;
  cubiculo?: string;
  createdById?: string;
  createdByName?: string;
  specText?: string;
  compatiblePartNumbers?: string[];
  compatibleCodes?: { code: string; brand: string; notes?: string }[];
  unit?: string;
}

export interface LaborRate {
  id: string;
  serviceCategory: 'instalacion' | 'preventivo' | 'correctivo' | 'predictivo' | 'revision';
  capacityRange: '5_15kW' | '37_50kW' | '75_120kW' | 'otros';
  maintenanceHours?: '2000' | '4000' | '6000' | '8000';
  hourlyPrice: number;
  distanceKmPrice: number;
}

export interface Staff {
  id: string;
  name: string;
  role: 'admin' | 'coordinator' | 'technician' | 'sales' | 'rh' | 'warehouse';
  customJobTitle?: string; // Vendedor, RH, Almacenista, etc. (libre)
  email: string;
  phone: string;
  personalPhone?: string;
  age?: number;
  active: boolean;
  avatar?: string;
  monthlyMedicalCertMonth?: string;
  medicalCertFileName?: string;
  quotesGenerated?: number;
  salesClosed?: number;
}

export interface FailureIndicator {
  id: string;
  equipmentName: string;
  brand: string;
  clientId?: string;
  clientName?: string;
  plantName?: string;
  failureType: 'temperatura' | 'presión' | 'electrica' | 'fuga' | 'mecanica';
  frequency: number;
  lastOccurrence: string;
  recommendation: string;
}

export interface MonthlyClosing {
  id: string;
  period: string; // e.g. "Agosto 2026"
  year: number;
  month: number;
  closedAt: string;
  closedBy: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  savingsAmount: number;
  closedProjectsCount: number;
  pendingProjectsCount: number;
  projects: {
    quoteFolNum: string;
    clientName: string;
    concept: string;
    income: number;
    expenses: number;
    utility: number;
    status: 'closed' | 'in_progress';
  }[];
}

export interface FinancialMetric {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  servicesCompleted: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  code: string;
  date: string;
  concept: string;
  utility: number;
  savings: number;
  utilityAfterSavings: number;
  marcoPercent: number;
  victorPercent: number;
  leoPercent: number;
  rikyPercent: number;
  marcoAmount: number;
  victorAmount: number;
  leoAmount: number;
  rikyAmount: number;
  marcoFinal: number;
  victorFinal: number;
  leoFinal: number;
}

export interface ExpenseControl {
  id: string;
  projectDescription: string; // Cliente // proyecto
  clientName: string; // cliente
  agentName: string; // agente
  invoiceDate: string; // fecha fac
  invoiceNumber: string; // factura
  paymentDate: string; // Fecha de pago
  tax: number; // IVA
  subtotal: number; // Subtotal
  clientPayment: number; // Pago de cliente
  expenses: number; // Gastos
  utility: number; // Utilidad
  savings: number; // ahorro 20%
  quoteFolNum?: string;
  clientPoNumber?: string;
}

export interface OemCatalogItem {
  id: string;
  clientName: string; // e.g. ANDREA
  equipmentName: string; // e.g. COMPRESOR
  brand: string; // KAISER
  model: string; // AS 30 T
  serialNumber: string; // 1030
  partDescription: string; // F.AIRE, F ACEITE, F. SEPARADOR, etc.
  partNumberOriginal: string; // 6.2000.0, 6.1985.0, 6.1963.0, 4.7333.0
  quantity: string | number; // 1, 40 LTS
  oemGenericBrandPart: string; // KC160-017, KL320-014, MV110-003, KAOA467C-05
  price: number; // 84.35
  suggestedPrice?: number; // 533.00
  incrementPercent?: number; // 5%
  publicPrice?: number; // 559.65
  currency: 'USD' | 'MXN';
  date: string; // 25/06/2026
}



