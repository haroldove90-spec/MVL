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
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'discount_requested';
  discountRequested?: number;
  mvlDocsRequested?: boolean; // Solicitar a Contabilidad documentos fiscales de MVL
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
  plants: Plant[];
  contacts: Contact[];
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
  capacity: string;
  filtersRequired: string;
  status: 'active' | 'warning' | 'maintenance';
  lastMaintenance: string;
  nextMaintenance: string;
  engineHours: number;
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
  type: 'preventive' | 'corrective';
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
  category: 'electronic' | 'pneumatic' | 'refrigeration' | 'consumable';
  stock: number;
  minStock: number;
  price: number;
}

export interface Staff {
  id: string;
  name: string;
  role: 'admin' | 'coordinator' | 'technician';
  email: string;
  phone: string;
  active: boolean;
  avatar?: string;
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
}


