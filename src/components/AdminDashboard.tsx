/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Staff, InventoryItem, Client, Equipment, WorkOrder, PurchaseOrder, ExpenseControl } from '../types';
import { supabase } from '../lib/supabase';
import { INITIAL_EXPENSE_CONTROL, loadFromStorage, saveToStorage } from '../mockData';
import { 
  Users, DollarSign, Package, Award, Plus, Trash2, 
  CheckCircle, XCircle, Tag, Layers, TrendingUp, TrendingDown,
  ShieldCheck, AlertTriangle, Building, Activity, FileText, Search, Edit2, Eye, RefreshCw,
  BookOpen, HelpCircle, Lightbulb, PlayCircle, CheckCircle2, ChevronRight, Info, Building2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AdminDashboardProps {
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  equipment: Equipment[];
  workOrders?: WorkOrder[];
  setWorkOrders?: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  purchaseOrders?: PurchaseOrder[];
  setPurchaseOrders?: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  activeTab?: 'financial' | 'staff' | 'clients' | 'catalog' | 'inventory' | 'purchase_orders' | 'expense_control' | 'tutorial';
  setActiveTab?: (val: 'financial' | 'staff' | 'clients' | 'catalog' | 'inventory' | 'purchase_orders' | 'expense_control' | 'tutorial') => void;
}

export default function AdminDashboard({ 
  staff, 
  setStaff, 
  inventory, 
  setInventory,
  clients,
  setClients,
  equipment,
  workOrders = [],
  setWorkOrders,
  purchaseOrders = [],
  setPurchaseOrders,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab
}: AdminDashboardProps) {
  // Navigation tabs with parent-control fallback
  const [localActiveTab, setLocalActiveTab] = useState<'financial' | 'staff' | 'clients' | 'catalog' | 'inventory' | 'purchase_orders' | 'expense_control' | 'tutorial'>('financial');
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

  // Pro features states: tracked invoice list
  const [invoicedOrders, setInvoicedOrders] = useState<string[]>(['ot4']);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // New staff form states
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'coordinator' | 'technician'>('technician');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  // New part form states
  const [newPartName, setNewPartName] = useState('');
  const [newPartCode, setNewPartCode] = useState('');
  const [newPartCategory, setNewPartCategory] = useState<'electronic' | 'pneumatic' | 'refrigeration' | 'consumable'>('consumable');
  const [newPartStock, setNewPartStock] = useState(10);
  const [newPartMinStock, setNewPartMinStock] = useState(3);
  const [newPartPrice, setNewPartPrice] = useState(1500);

  // Brands list
  const [brands, setBrands] = useState<string[]>(['Kaeser', 'Atlas Copco', 'Ingersoll Rand', 'Sullair', 'Siemens']);
  const [newBrand, setNewBrand] = useState('');

  // CRM Form state variables
  const [crmName, setCrmName] = useState('');
  const [crmCompanyName, setCrmCompanyName] = useState('');
  const [crmRfc, setCrmRfc] = useState('');
  const [crmEmail, setCrmEmail] = useState('');
  const [crmPhone, setCrmPhone] = useState('');

  // Active CRM Client state
  const [selectedCrmClientId, setSelectedCrmClientId] = useState<string>(clients[0]?.id || '');
  const activeCrmClient = clients.find(c => c.id === selectedCrmClientId);
  const clientCrmMachines = equipment.filter(e => e.clientId === selectedCrmClientId);

  // New Plant fields
  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantAddress, setNewPlantAddress] = useState('');
  const [newPlantCity, setNewPlantCity] = useState('');

  // New Contact fields
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Purchase Order states
  const [poSearchQuery, setPoSearchQuery] = useState('');
  const [activePoModal, setActivePoModal] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [poCurrentPage, setPoCurrentPage] = useState(1);

  // Form states for Purchase Order
  const [formPoOrderNumber, setFormPoOrderNumber] = useState('');
  const [formPoCode, setFormPoCode] = useState('');
  const [formPoDate, setFormPoDate] = useState('');
  const [formPoConcept, setFormPoConcept] = useState('');
  const [formPoUtility, setFormPoUtility] = useState(0);
  const [formPoSavingsPercent, setFormPoSavingsPercent] = useState(20); // standard 20%
  const [formPoMarcoPercent, setFormPoMarcoPercent] = useState(60);
  const [formPoVictorPercent, setFormPoVictorPercent] = useState(20);
  const [formPoLeoPercent, setFormPoLeoPercent] = useState(20);
  const [formPoRikyPercent, setFormPoRikyPercent] = useState(0);

  // --- Expense Control States ---
  const [expensesList, setExpensesList] = useState<ExpenseControl[]>(() =>
    loadFromStorage<ExpenseControl[]>('mvl_expense_control', INITIAL_EXPENSE_CONTROL)
  );
  const [expSearchQuery, setExpSearchQuery] = useState('');
  const [activeExpModal, setActiveExpModal] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedExp, setSelectedExp] = useState<ExpenseControl | null>(null);
  const [expCurrentPage, setExpCurrentPage] = useState(1);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const filteredExpenses = expensesList.filter(exp => {
    const query = expSearchQuery.toLowerCase();
    return (
      exp.projectDescription.toLowerCase().includes(query) ||
      exp.clientName.toLowerCase().includes(query) ||
      exp.agentName.toLowerCase().includes(query) ||
      exp.invoiceNumber.toLowerCase().includes(query)
    );
  });

  const expItemsPerPage = 10;
  const expTotalPages = Math.ceil(filteredExpenses.length / expItemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (expCurrentPage - 1) * expItemsPerPage,
    expCurrentPage * expItemsPerPage
  );

  // Form states for Expense Control
  const [formExpDescription, setFormExpDescription] = useState('');
  const [formExpClientName, setFormExpClientName] = useState('');
  const [formExpAgentName, setFormExpAgentName] = useState('');
  const [formExpInvoiceDate, setFormExpInvoiceDate] = useState('');
  const [formExpInvoiceNumber, setFormExpInvoiceNumber] = useState('');
  const [formExpPaymentDate, setFormExpPaymentDate] = useState('');
  const [formExpTax, setFormExpTax] = useState(0);
  const [formExpSubtotal, setFormExpSubtotal] = useState(0);
  const [formExpClientPayment, setFormExpClientPayment] = useState(0);
  const [formExpExpenses, setFormExpExpenses] = useState(0);
  const [formExpUtility, setFormExpUtility] = useState(0);
  const [formExpSavings, setFormExpSavings] = useState(0);

  // Supabase sync hooks
  const fetchExpensesFromSupabase = async () => {
    try {
      setSupabaseStatus('checking');
      const { data, error } = await supabase
        .from('expense_control')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mapped: ExpenseControl[] = data.map((item: any) => ({
          id: String(item.id),
          projectDescription: item.project_description || '',
          clientName: item.client_name || '',
          agentName: item.agent_name || '',
          invoiceDate: item.invoice_date || '',
          invoiceNumber: item.invoice_number || '',
          paymentDate: item.payment_date || '',
          tax: Number(item.tax || 0),
          subtotal: Number(item.subtotal || 0),
          clientPayment: Number(item.client_payment || 0),
          expenses: Number(item.expenses || 0),
          utility: Number(item.utility || 0),
          savings: Number(item.savings || 0)
        }));
        setExpensesList(mapped);
        saveToStorage('mvl_expense_control', mapped);
      }
      setSupabaseStatus('connected');
      setSupabaseError(null);
    } catch (err: any) {
      console.warn('Could not load from Supabase, using localStorage:', err);
      setSupabaseStatus('disconnected');
      setSupabaseError(err?.message || 'Error de conexión');
    }
  };

  useEffect(() => {
    fetchExpensesFromSupabase();
  }, []);

  // Auto calculations for Expense Form
  useEffect(() => {
    // Auto IVA (16%)
    const computedTax = Number((formExpSubtotal * 0.16).toFixed(2));
    setFormExpTax(computedTax);
    
    // Auto set Client Payment to Subtotal if it's 0 or empty
    if (formExpClientPayment === 0 && formExpSubtotal > 0) {
      setFormExpClientPayment(formExpSubtotal);
    }
  }, [formExpSubtotal]);

  useEffect(() => {
    // Auto Utility = Client Payment - Expenses
    const computedUtility = Number((formExpClientPayment - formExpExpenses).toFixed(2));
    setFormExpUtility(computedUtility);
  }, [formExpClientPayment, formExpExpenses]);

  useEffect(() => {
    // Auto Savings = 20% of Utility (only if positive)
    const computedSavings = formExpUtility > 0 ? Number((formExpUtility * 0.20).toFixed(2)) : 0;
    setFormExpSavings(computedSavings);
  }, [formExpUtility]);

  const handleOpenCreateExp = () => {
    setFormExpDescription('');
    setFormExpClientName('');
    setFormExpAgentName('');
    setFormExpInvoiceDate(new Date().toISOString().split('T')[0]);
    setFormExpInvoiceNumber('');
    setFormExpPaymentDate(new Date().toISOString().split('T')[0]);
    setFormExpSubtotal(0);
    setFormExpTax(0);
    setFormExpClientPayment(0);
    setFormExpExpenses(0);
    setFormExpUtility(0);
    setFormExpSavings(0);
    setSelectedExp(null);
    setActiveExpModal('create');
  };

  const handleOpenEditExp = (exp: ExpenseControl) => {
    setSelectedExp(exp);
    setFormExpDescription(exp.projectDescription);
    setFormExpClientName(exp.clientName);
    setFormExpAgentName(exp.agentName);
    setFormExpInvoiceDate(exp.invoiceDate);
    setFormExpInvoiceNumber(exp.invoiceNumber);
    setFormExpPaymentDate(exp.paymentDate);
    setFormExpSubtotal(exp.subtotal);
    setFormExpTax(exp.tax);
    setFormExpClientPayment(exp.clientPayment);
    setFormExpExpenses(exp.expenses);
    setFormExpUtility(exp.utility);
    setFormExpSavings(exp.savings);
    setActiveExpModal('edit');
  };

  const handleOpenViewExp = (exp: ExpenseControl) => {
    setSelectedExp(exp);
    setActiveExpModal('view');
  };

  const handleCreateOrUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetId = activeExpModal === 'edit' && selectedExp ? selectedExp.id : `exp_${Date.now()}`;
    const newExp: ExpenseControl = {
      id: targetId,
      projectDescription: formExpDescription,
      clientName: formExpClientName,
      agentName: formExpAgentName,
      invoiceDate: formExpInvoiceDate,
      invoiceNumber: formExpInvoiceNumber,
      paymentDate: formExpPaymentDate,
      tax: formExpTax,
      subtotal: formExpSubtotal,
      clientPayment: formExpClientPayment,
      expenses: formExpExpenses,
      utility: formExpUtility,
      savings: formExpSavings
    };

    // Update state & local storage immediately
    let updatedList: ExpenseControl[];
    if (activeExpModal === 'create') {
      updatedList = [newExp, ...expensesList];
    } else {
      updatedList = expensesList.map(item => item.id === targetId ? newExp : item);
    }
    setExpensesList(updatedList);
    saveToStorage('mvl_expense_control', updatedList);

    // Sync with Supabase (upsert)
    try {
      const dbPayload = {
        id: targetId.startsWith('exp_') ? undefined : targetId, // let db assign if text/uuid, or keep if existing
        project_description: formExpDescription,
        client_name: formExpClientName,
        agent_name: formExpAgentName,
        invoice_date: formExpInvoiceDate || null,
        invoice_number: formExpInvoiceNumber,
        payment_date: formExpPaymentDate || null,
        tax: formExpTax,
        subtotal: formExpSubtotal,
        client_payment: formExpClientPayment,
        expenses: formExpExpenses,
        utility: formExpUtility,
        savings: formExpSavings
      };

      let result;
      if (activeExpModal === 'create') {
        result = await supabase.from('expense_control').insert([dbPayload]);
      } else {
        // Since ID might be client-side generated (e.g. 'exp1', 'exp2') or uuid, we can filter or upsert
        result = await supabase.from('expense_control').upsert([
          { id: targetId, ...dbPayload }
        ]);
      }

      if (result.error) throw result.error;
      setSupabaseStatus('connected');
      setSupabaseError(null);
    } catch (err: any) {
      console.warn('Supabase sync failed, saved locally:', err);
      setSupabaseStatus('disconnected');
      setSupabaseError('Guardado localmente. Error Supabase: ' + err.message);
    }

    setActiveExpModal(null);
    setSelectedExp(null);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro de control de gastos?')) {
      const updatedList = expensesList.filter(item => item.id !== id);
      setExpensesList(updatedList);
      saveToStorage('mvl_expense_control', updatedList);

      try {
        const { error } = await supabase
          .from('expense_control')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setSupabaseStatus('connected');
        setSupabaseError(null);
      } catch (err: any) {
        console.warn('Supabase delete failed, deleted locally:', err);
        setSupabaseStatus('disconnected');
        setSupabaseError('Eliminado localmente. Error Supabase: ' + err.message);
      }
    }
  };


  // Double horizontal scrollbar refs & state
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  const handleTopScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      if (Math.abs(bottomScrollRef.current.scrollLeft - topScrollRef.current.scrollLeft) > 1) {
        bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      }
    }
  };

  const handleBottomScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      if (Math.abs(topScrollRef.current.scrollLeft - bottomScrollRef.current.scrollLeft) > 1) {
        topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
      }
    }
  };

  // Synchronize top scrollbar helper on resize
  useEffect(() => {
    const tableEl = bottomScrollRef.current;
    if (!tableEl) return;

    const handleResize = () => {
      const firstTableElement = tableEl.querySelector('table');
      if (firstTableElement) {
        setTableScrollWidth(firstTableElement.scrollWidth);
      } else {
        setTableScrollWidth(tableEl.scrollWidth);
      }
    };

    // Run slightly delayed to allow DOM rendering to complete
    const timeoutId = setTimeout(handleResize, 100);

    const observer = new ResizeObserver(handleResize);
    observer.observe(tableEl);
    
    const firstTableElement = tableEl.querySelector('table');
    if (firstTableElement) {
      observer.observe(firstTableElement);
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [purchaseOrders, poSearchQuery, poCurrentPage, activeTab, activePoModal]);

  // Filter and paginate Purchase Orders
  const filteredPOs = purchaseOrders.filter(po => {
    const q = poSearchQuery.toLowerCase();
    return (
      po.code.toLowerCase().includes(q) || 
      po.concept.toLowerCase().includes(q) ||
      (po.orderNumber && po.orderNumber.toLowerCase().includes(q))
    );
  });
  const poTotalPages = Math.ceil(filteredPOs.length / 10) || 1;
  const currentPage = Math.max(1, Math.min(poCurrentPage, poTotalPages));
  const paginatedPOs = filteredPOs.slice((currentPage - 1) * 10, currentPage * 10);

  // Dynamic profitability metrics calculation from workOrders
  const completedOrders = workOrders.filter(o => o.status === 'completed' || o.status === 'review');
  
  // Calculate parts costs and revenue
  const actualPartsRevenue = completedOrders.reduce((sum, ot) => {
    return sum + (ot.partsUsed || []).reduce((s, p) => s + (p.price * p.quantity), 0);
  }, 0);
  
  const actualPartsCost = actualPartsRevenue * 0.45; // 45% cost of acquisition

  // Calculate labor cost and billing revenue
  const actualLaborCost = completedOrders.reduce((sum, ot) => sum + (ot.laborCost || 0), 0);
  const actualLaborRevenue = completedOrders.reduce((sum, ot) => sum + ((ot.laborHours || 0) * 1800), 0); // Billed at $1,800/hr

  const totalRevenue = 320000 + actualPartsRevenue + actualLaborRevenue;
  const totalCosts = 144000 + actualPartsCost + actualLaborCost;
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Chart data
  const financialData = [
    { name: 'Mayo', Ingresos: 180000, Costos: 81000, Utilidad: 99000 },
    { name: 'Junio', Ingresos: 250000, Costos: 112500, Utilidad: 137500 },
    { name: 'Julio (En Vivo)', Ingresos: totalRevenue, Costos: totalCosts, Utilidad: netProfit }
  ];

  // Dynamic SLA and Response Times per Technician
  const techPerformanceData = staff.filter(s => s.role === 'technician').map(tech => {
    const techOrders = workOrders.filter(o => o.assignedTechnicianId === tech.id);
    const completedCount = techOrders.filter(o => o.status === 'completed').length;
    // SLA compliance based on registered checklists completion rate
    const totalTasks = techOrders.reduce((sum, o) => sum + o.checklist.length, 0);
    const completedTasks = techOrders.reduce((sum, o) => sum + o.checklist.filter(c => c.checked).length, 0);
    const slaPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 95;
    return {
      name: tech.name.split(' ')[0], // short name
      Servicios: completedCount || 4,
      SLA: slaPercent
    };
  });

  // Dynamic failures by brand
  const brandFailureData = ['Kaeser', 'Atlas Copco', 'Ingersoll Rand', 'Sullair'].map(brandName => {
    const brandEqs = equipment.filter(e => e.brand.toLowerCase() === brandName.toLowerCase());
    const brandCorrectiveCount = workOrders.filter(o => o.type === 'corrective' && brandEqs.some(e => e.id === o.equipmentId)).length;
    return {
      name: brandName,
      Fallas: brandCorrectiveCount || 1
    };
  });

  // --- Purchase Orders CRUD Handlers ---
  const handleOpenCreatePo = () => {
    const count = purchaseOrders.length + 1;
    const nextCode = `OC-2026-${String(count).padStart(3, '0')}`;
    
    setFormPoOrderNumber(String(count));
    setFormPoCode(nextCode);
    setFormPoDate(new Date().toISOString().split('T')[0]);
    setFormPoConcept('');
    setFormPoUtility(10000);
    setFormPoSavingsPercent(20);
    setFormPoMarcoPercent(60);
    setFormPoVictorPercent(20);
    setFormPoLeoPercent(20);
    setFormPoRikyPercent(0);
    
    setSelectedPo(null);
    setActivePoModal('create');
  };

  const handleOpenEditPo = (po: PurchaseOrder) => {
    setSelectedPo(po);
    setFormPoOrderNumber(po.orderNumber || '');
    setFormPoCode(po.code);
    setFormPoDate(po.date);
    setFormPoConcept(po.concept);
    setFormPoUtility(po.utility);
    const savPercent = po.utility > 0 ? Math.round((po.savings / po.utility) * 100) : 20;
    setFormPoSavingsPercent(savPercent);
    setFormPoMarcoPercent(po.marcoPercent);
    setFormPoVictorPercent(po.victorPercent);
    setFormPoLeoPercent(po.leoPercent);
    setFormPoRikyPercent(po.rikyPercent);
    
    setActivePoModal('edit');
  };

  const handleOpenViewPo = (po: PurchaseOrder) => {
    setSelectedPo(po);
    setActivePoModal('view');
  };

  const handleSavePo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPoCode || !formPoConcept || formPoUtility <= 0) {
      alert('Por favor complete todos los campos obligatorios y con valores válidos.');
      return;
    }

    const utility = Number(formPoUtility);
    const savings = Number((utility * (formPoSavingsPercent / 100)).toFixed(2));
    const utilityAfterSavings = Number((utility - savings).toFixed(2));
    
    const mPercent = Number(formPoMarcoPercent);
    const vPercent = Number(formPoVictorPercent);
    const lPercent = Number(formPoLeoPercent);
    const rPercent = Number(formPoRikyPercent);

    const sumPercent = mPercent + vPercent + lPercent + rPercent;
    if (sumPercent !== 100 && sumPercent !== 0) {
      if (!confirm(`La suma de los porcentajes es ${sumPercent}%. ¿Desea continuar de todas formas? (Se recomienda que sume 100%)`)) {
        return;
      }
    }

    const marcoAmount = Number((utilityAfterSavings * (mPercent / 100)).toFixed(2));
    const victorAmount = Number((utilityAfterSavings * (vPercent / 100)).toFixed(2));
    const leoAmount = Number((utilityAfterSavings * (lPercent / 100)).toFixed(2));
    const rikyAmount = Number((utilityAfterSavings * (rPercent / 100)).toFixed(2));

    const marcoFinal = Number((utilityAfterSavings * 0.2622).toFixed(2));
    const victorFinal = Number((utilityAfterSavings * 0.4794).toFixed(2));
    const leoFinal = Number((utilityAfterSavings * 0.2584).toFixed(2));

    const orderNum = formPoOrderNumber.trim() || String(purchaseOrders.length + 1);

    if (activePoModal === 'create') {
      const newPo: PurchaseOrder = {
        id: `po_${Date.now()}`,
        orderNumber: orderNum,
        code: formPoCode,
        date: formPoDate,
        concept: formPoConcept,
        utility,
        savings,
        utilityAfterSavings,
        marcoPercent: mPercent,
        victorPercent: vPercent,
        leoPercent: lPercent,
        rikyPercent: rPercent,
        marcoAmount,
        victorAmount,
        leoAmount,
        rikyAmount,
        marcoFinal,
        victorFinal,
        leoFinal
      };
      
      if (setPurchaseOrders) {
        setPurchaseOrders(prev => [newPo, ...prev]);
      }
    } else if (activePoModal === 'edit' && selectedPo) {
      if (setPurchaseOrders) {
        setPurchaseOrders(prev => prev.map(item => item.id === selectedPo.id ? {
          ...item,
          orderNumber: orderNum,
          code: formPoCode,
          date: formPoDate,
          concept: formPoConcept,
          utility,
          savings,
          utilityAfterSavings,
          marcoPercent: mPercent,
          victorPercent: vPercent,
          leoPercent: lPercent,
          rikyPercent: rPercent,
          marcoAmount,
          victorAmount,
          leoAmount,
          rikyAmount,
          marcoFinal,
          victorFinal,
          leoFinal
        } : item));
      }
    }

    setActivePoModal(null);
    setSelectedPo(null);
  };

  const handleDeletePo = (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro de orden de compra?')) {
      if (setPurchaseOrders) {
        setPurchaseOrders(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  // Create Client
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crmName || !crmCompanyName || !crmRfc) return;
    const newCl: Client = {
      id: `c${Date.now()}`,
      name: crmName,
      companyName: crmCompanyName,
      rfc: crmRfc,
      email: crmEmail,
      phone: crmPhone,
      plants: [],
      contacts: []
    };
    setClients(prev => [...prev, newCl]);
    setSelectedCrmClientId(newCl.id);
    setCrmName('');
    setCrmCompanyName('');
    setCrmRfc('');
    setCrmEmail('');
    setCrmPhone('');
  };

  // Add Plant
  const handleAddPlant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrmClientId || !newPlantName || !newPlantAddress) return;
    setClients(prev => prev.map(c => {
      if (c.id === selectedCrmClientId) {
        return {
          ...c,
          plants: [
            ...c.plants,
            {
              id: `p${Date.now()}`,
              name: newPlantName,
              address: newPlantAddress,
              city: newPlantCity || 'N/A'
            }
          ]
        };
      }
      return c;
    }));
    setNewPlantName('');
    setNewPlantAddress('');
    setNewPlantCity('');
  };

  // Add Contact
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrmClientId || !newContactName || !newContactRole) return;
    setClients(prev => prev.map(c => {
      if (c.id === selectedCrmClientId) {
        return {
          ...c,
          contacts: [
            ...c.contacts,
            {
              name: newContactName,
              role: newContactRole,
              phone: newContactPhone || 'N/A',
              email: newContactEmail || 'N/A'
            }
          ]
        };
      }
      return c;
    }));
    setNewContactName('');
    setNewContactRole('');
    setNewContactPhone('');
    setNewContactEmail('');
  };

  // Add staff handler
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;
    const item: Staff = {
      id: `s${Date.now()}`,
      name: newStaffName,
      role: newStaffRole,
      email: newStaffEmail,
      phone: newStaffPhone || 'N/A',
      active: true
    };
    setStaff(prev => [...prev, item]);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
  };

  // Toggle staff status
  const toggleStaffStatus = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  // Delete staff
  const deleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  // Add parts handler
  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName || !newPartCode) return;
    const item: InventoryItem = {
      id: `i${Date.now()}`,
      code: newPartCode.toUpperCase(),
      name: newPartName,
      category: newPartCategory,
      stock: Number(newPartStock),
      minStock: Number(newPartMinStock),
      price: Number(newPartPrice)
    };
    setInventory(prev => [...prev, item]);
    setNewPartName('');
    setNewPartCode('');
    setNewPartStock(10);
    setNewPartMinStock(3);
    setNewPartPrice(1500);
  };

  // Delete spare part
  const deletePart = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  };

  // Add Brand
  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand || brands.includes(newBrand)) return;
    setBrands(prev => [...prev, newBrand]);
    setNewBrand('');
  };

  // Delete Brand
  const handleDeleteBrand = (brandName: string) => {
    setBrands(prev => prev.filter(b => b !== brandName));
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="hidden lg:flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-xs gap-1">
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'financial' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Rentabilidad y Métricas
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'staff' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Gestión de Personal
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'clients' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Clientes (CRM)
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'catalog' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Catálogos de Marcas y Precios
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'inventory' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Inventario Global
        </button>
        <button
          onClick={() => setActiveTab('purchase_orders')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'purchase_orders' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Registro de Órdenes de Compra
        </button>
        <button
          onClick={() => setActiveTab('expense_control')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'expense_control' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Control de Gastos (Proyectos)
        </button>
        <button
          onClick={() => setActiveTab('tutorial')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'tutorial' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Tutorial / Guía
        </button>
      </div>

      {/* --- Tab: Tutorial / Guía del Administrador --- */}
      {activeTab === 'tutorial' && (
        <div className="space-y-6 text-left">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#282829] to-slate-800 text-white p-6 rounded-2xl shadow-md border-l-4 border-[#0196C1] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#0196C1]/20 rounded-lg text-[#0196C1] text-xs font-extrabold uppercase tracking-wide">
                <BookOpen className="w-4 h-4" /> Manual del Rol Administrador
              </div>
              <h2 className="text-xl font-black text-white">Guía de Uso: Módulos Administrativos</h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Aprende a gestionar todas las funciones clave del sistema MVL Control: desde la rentabilidad financiera y el personal, hasta el control de inventarios, órdenes de compra y gastos.
              </p>
            </div>
            <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-xs text-right">
              <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Perfil Activo</span>
              <span className="text-sm font-bold text-sky-400">Administrador General</span>
            </div>
          </div>

          {/* Tutorial Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 1. Rentabilidad y Métricas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">1. Rentabilidad y Métricas (Finanzas)</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Monitoreo de ingresos, costos y márgenes en tiempo real</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span><strong>Tarjetas Cero Errores:</strong> Observa las cifras globales de Ingresos Acumulados, Costos Totales de Refacciones/Mano de Obra y la Utilidad Neta en vivo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span><strong>Gráficas Dinámicas:</strong> Visualiza el comportamiento mensual comparando Ingresos vs. Costos vs. Utilidad Bruta.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span><strong>Rendimiento de Técnicos y SLA:</strong> Evalúa el número de mantenimientos concluidos por cada técnico y su porcentaje de cumplimiento de normatividad.</span>
                </li>
              </ul>
            </div>

            {/* 2. Gestión de Personal */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">2. Gestión de Personal</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Administración del equipo de trabajo y permisos</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span><strong>Registrar Nuevo Integrante:</strong> Llena el formulario con Nombre Completo, Rol (Técnico, Coordinador o Administrador), Correo y Teléfono.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span><strong>Estado Activo / Inactivo:</strong> Presiona el interruptor de la lista para dar de baja temporalmente o reactivar a un empleado sin eliminar sus antecedentes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span><strong>Asignación Automática:</strong> Los técnicos activos aparecerán de inmediato para asignación de órdenes de trabajo en la coordinación.</span>
                </li>
              </ul>
            </div>

            {/* 3. Clientes (CRM) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">3. Clientes (CRM)</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Registro de empresas, plantas físicas y contactos clave</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span><strong>Alta de Clientes:</strong> Agrega empresas compradoras con su Razón Social, RFC, Correo y Teléfono directo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span><strong>Sucursales y Plantas:</strong> Selecciona un cliente registrado e ingresa sus direcciones físicas o plantas industriales.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span><strong>Directorio de Contactos:</strong> Guarda los números de WhatsApp y cargos de los gerentes de mantenimiento o supervisores de planta.</span>
                </li>
              </ul>
            </div>

            {/* 4. Catálogos de Marcas y Precios */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">4. Catálogos de Marcas y Precios</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Librería oficial de fabricantes y refacciones estándar</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span><strong>Catálogo de Marcas:</strong> Añade fabricantes de compresores (Kaeser, Atlas Copco, Ingersoll Rand, Sullair) para estandarizar registros.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span><strong>Matriz de Precios Recomendados:</strong> Revisa la lista oficial de costos sugeridos para cotizar servicios preventivos y correctivos a clientes.</span>
                </li>
              </ul>
            </div>

            {/* 5. Inventario Global */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-[#0196C1]/10 text-[#0196C1] rounded-xl flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">5. Inventario Global de Refacciones</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Control de stock de aceites, filtros y piezas de repuesto</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#0196C1]/20 text-[#0196C1] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span><strong>Agregar Repuesto:</strong> Ingresa el Código Único, Nombre de la Pieza, Categoría, Stock Inicial, Stock Mínimo y Precio.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#0196C1]/20 text-[#0196C1] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span><strong>Alertas de Reabastecimiento:</strong> El sistema resalta automáticamente en amarillo o rojo las piezas con existencia igual o inferior al stock mínimo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#0196C1]/20 text-[#0196C1] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span><strong>Descuento Automático:</strong> Cuando los técnicos agregan refacciones a sus servicios en campo y la orden se aprueba, las existencias se descuentan solas.</span>
                </li>
              </ul>
            </div>

            {/* 6. Registro de Órdenes de Compra (OC) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">6. Órdenes de Compra y Distribución de Socios</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Cálculo de ahorro de empresa y dispersión de utilidades</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span><strong>Crear Nueva OC:</strong> Haz clic en "+ Nueva Orden de Compra", asigna un folio (ej: OC-2026-001) y la Utilidad Bruta del proyecto.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span><strong>Fórmula de Ahorro MVL:</strong> Aplica el 20% de reserva para la empresa antes de distribuir ganancias.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span><strong>Sueldos de Socios (Libro Contable):</strong> Ajusta los porcentajes de Marco, Víctor, Leo y Riky para ver en tiempo real el desglose exacto en pantalla.</span>
                </li>
              </ul>
            </div>

            {/* 7. Control de Gastos (Proyectos) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 border-l-4 border-l-[#0196C1] transition-all space-y-3 md:col-span-2">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-slate-900 text-[#0196C1] rounded-xl flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">7. Control de Gastos de Proyectos (Sincronizado con Supabase Cloud)</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Registro detallado de facturas, agentes, pagos e IVA en la nube</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Paso A: Registrar Proyecto</span>
                  <p>Ingresa la Descripción del Proyecto, Cliente, Agente Responsable, Folio de Factura y Fecha de Pago.</p>
                </div>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Paso B: Cálculo Automático IVA</span>
                  <p>Escribe el Subtotal y Gastos. El sistema calcula automáticamente el IVA (16%), la Utilidad Neta y el Ahorro (20%).</p>
                </div>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Paso C: Respaldo Cloud</span>
                  <p>Los datos quedan guardados simultáneamente en la nube de Supabase y en la memoria local para consulta instantánea.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Help Card */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/60 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="block font-bold">Consejo de Uso Seguro:</strong>
              Puedes cambiar de rol en cualquier momento desde el botón "Cerrar Sesión / Cambiar Rol" ubicado en la barra superior del menú principal para probar la experiencia de la app como Coordinador, Técnico o Cliente.
            </div>
          </div>

        </div>
      )}

      {/* --- Tab 1: Financial & Metrics --- */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Ingresos Totales</p>
                <h3 className="text-xl font-bold text-slate-800">${totalRevenue.toLocaleString('es-MX')}</h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> +14.2% este mes
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Costo de Operación</p>
                <h3 className="text-xl font-bold text-slate-800">${totalCosts.toLocaleString('es-MX')}</h3>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Incluye refacciones y viáticos</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Rentabilidad Neta</p>
                <h3 className="text-xl font-bold text-slate-800">${netProfit.toLocaleString('es-MX')}</h3>
                <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 font-bold rounded mt-1 inline-block">
                  {profitMargin}% Margen
                </span>
              </div>
            </div>
          </div>

          {/* Profitability Graph & Secondary KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Desempeño Financiero Comercial (MXN)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString('es-MX')}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Ingresos" fill="#0196C1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Costos" fill="#282829" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Utilidad" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Industry Stats */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Estatus de Activos</h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Equipos Registrados</span>
                    <span className="font-bold text-slate-800">{equipment.length}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#0196C1] h-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-700 font-medium">Equipos en Alerta (Crítico)</span>
                    <span className="font-bold text-amber-800">{equipment.filter(e => e.status === 'warning' || e.status === 'maintenance').length}</span>
                  </div>
                  <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full animate-pulse" style={{ width: '66%' }} />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] text-slate-500 uppercase font-bold mb-2">Efectividad de Técnicos</p>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <p className="text-xs font-semibold text-slate-700">94.8% SLA Cumplido</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Módulo 5: Analytics and Reports Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* SLA and response times */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Métricas de Rendimiento Técnico (SLA)</h4>
              <p className="text-[10px] text-slate-400 mb-4">Servicios cerrados versus efectividad del tiempo de respuesta acordado.</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={techPerformanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar name="Servicios Cerrados" dataKey="Servicios" fill="#0196C1" radius={[4, 4, 0, 0]} />
                    <Bar name="Cumplimiento SLA (%)" dataKey="SLA" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Failure distribution by Brand */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Indicadores de Falla por Marca</h4>
              <p className="text-[10px] text-slate-400 mb-4">Frecuencia acumulada de reportes correctivos registrados en el portafolio de clientes.</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandFailureData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Bar name="Reportes Correctivos" dataKey="Fallas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bento Grid: Pro Level Modules */}
          <div className="border-t border-slate-200/80 pt-6 mt-6 space-y-6">
            <div className="flex items-center gap-2 text-left">
              <span className="px-2 py-0.5 bg-[#0196C1] text-white text-[9px] font-extrabold rounded-md uppercase tracking-wider">PRO UPDATE</span>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Centro de Operaciones Inteligente y Control Comercial</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1 & 2: Billing & NPS */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Facturación Automática de Mano de Obra y Refacciones */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Facturación Automática y Pre-Auditoría</h4>
                        <p className="text-[10px] text-slate-400">Generación inmediata de pre-facturas basadas en mano de obra registrada y refacciones utilizadas.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {completedOrders.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">No hay órdenes cerradas en revisión o completadas para facturación.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                        {completedOrders.map(ot => {
                          const client = clients.find(c => c.id === ot.clientId);
                          const isBilled = invoicedOrders.includes(ot.id);
                          const laborCostTotal = (ot.laborHours || 0) * 1800;
                          const partsCostTotal = ot.partsUsed.reduce((s, p) => s + (p.price * p.quantity), 0);
                          const subtotal = laborCostTotal + partsCostTotal;
                          const vat = subtotal * 0.16;
                          const total = subtotal + vat;

                          return (
                            <div key={ot.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-800">{ot.code}</span>
                                  <span className="text-[10px] text-slate-400 font-bold">{client?.companyName}</span>
                                  <span className={`px-2 py-0.2 text-[8px] font-extrabold rounded-sm uppercase ${
                                    isBilled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {isBilled ? 'Facturado' : 'Pendiente Factura'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  Mano de Obra: <span className="font-bold text-slate-700">{ot.laborHours || 0} Hrs Billed</span> • Refacciones: <span className="font-bold text-slate-700">{ot.partsUsed.length} ítems</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                <p className="font-mono font-bold text-slate-700 text-right sm:text-left">${total.toLocaleString('es-MX', {minimumFractionDigits: 2})} <span className="text-[9px] font-normal text-slate-400">MXN</span></p>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setSelectedInvoiceId(selectedInvoiceId === ot.id ? null : ot.id)}
                                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[10px] rounded-lg transition-colors border border-slate-200 cursor-pointer"
                                  >
                                    Ver Detalle
                                  </button>
                                  {!isBilled && (
                                    <button
                                      onClick={() => setInvoicedOrders(prev => [...prev, ot.id])}
                                      className="px-2.5 py-1.5 bg-[#0196C1] hover:bg-[#0185ab] text-white font-bold text-[10px] rounded-lg transition-colors border-none cursor-pointer"
                                    >
                                      Sellar / Facturar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Métricas NPS de Satisfacción de Clientes */}
                {(() => {
                  const ratedOrders = workOrders.filter(o => o.clientFeedback);
                  const promoters = ratedOrders.filter(o => o.clientFeedback!.nps >= 9).length;
                  const detractors = ratedOrders.filter(o => o.clientFeedback!.nps <= 6).length;
                  const totalNPSCount = ratedOrders.length;
                  const npsScore = totalNPSCount > 0 ? Math.round(((promoters - detractors) / totalNPSCount) * 100) : 100;
                  const averageStars = totalNPSCount > 0 ? (ratedOrders.reduce((sum, o) => sum + o.clientFeedback!.rating, 0) / totalNPSCount).toFixed(1) : '5.0';

                  return (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left space-y-4">
                      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                            <Award className="w-4 h-4 animate-bounce" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Evaluación NPS y Satisfacción</h4>
                            <p className="text-[10px] text-slate-400">Feedback en tiempo real ingresado por clientes al cerrar las órdenes.</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="text-center bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                            <p className="text-[8px] font-extrabold text-emerald-700 uppercase">Score NPS</p>
                            <h5 className="text-sm font-black text-emerald-800">+{npsScore}</h5>
                          </div>
                          <div className="text-center bg-amber-50 px-3 py-1 rounded-xl border border-amber-100">
                            <p className="text-[8px] font-extrabold text-amber-700 uppercase">Estrellas Avg</p>
                            <h5 className="text-sm font-black text-amber-800">{averageStars} / 5.0</h5>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {ratedOrders.length === 0 ? (
                          <p className="text-xs text-slate-400 italic text-center py-4">Ningún cliente ha calificado servicios aún.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                            {ratedOrders.map(o => {
                              const client = clients.find(c => c.id === o.clientId);
                              return (
                                <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-extrabold text-slate-700 truncate max-w-[120px]">{client?.companyName}</span>
                                    <span className="text-slate-400 font-bold">{o.dateCompleted}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-amber-500 font-bold">{"⭐".repeat(o.clientFeedback!.rating)}</span>
                                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded-sm font-bold font-mono">NPS: {o.clientFeedback!.nps}</span>
                                  </div>
                                  <p className="text-slate-500 italic text-[10.5px] leading-relaxed">"{o.clientFeedback!.comments}"</p>
                                  <div className="text-[8px] text-slate-400 font-extrabold uppercase border-t border-slate-200/60 pt-1">
                                    OT: {o.code} • Atendió: {o.assignedTechnicianName}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Column 3: IoT Real-Time Warnings Panel */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                      <Activity className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Sensores de Operación (IoT)</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Alertas de temperatura de descarga, presión y vibraciones anormales.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Filter critical / warning equipment */}
                    {(() => {
                      const warningEqs = equipment.filter(e => e.status === 'warning' || (e.telemetry && e.telemetry.temp > 95));
                      
                      if (warningEqs.length === 0) {
                        return (
                          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-center space-y-1.5">
                            <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
                            <p className="text-[11px] font-extrabold uppercase tracking-wide">Todos los Compresores OK</p>
                            <p className="text-[10px] text-emerald-600 leading-snug">Cero alarmas de vibración, temperatura o caída crítica de presión.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {warningEqs.map(eq => {
                            const client = clients.find(c => c.id === eq.clientId);
                            return (
                              <div key={eq.id} className="p-3 bg-rose-50/50 text-rose-950 border border-rose-100 rounded-xl space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-extrabold text-rose-900 text-xs">{eq.name}</h5>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{eq.brand} • S/N {eq.serialNumber}</p>
                                  </div>
                                  <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-sm font-bold uppercase text-[8px] animate-pulse">ALERTA CRÍTICA</span>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 bg-white/75 p-2 rounded-lg border border-rose-100 text-[10px]">
                                  <p className="text-slate-500 font-medium">Cliente: <span className="font-bold text-slate-700">{client?.companyName}</span></p>
                                  <p className="text-slate-500 font-medium">Temp: <span className="font-bold text-rose-600">{eq.telemetry?.temp ?? 98} °C</span></p>
                                  <p className="text-slate-500 font-medium">Presión: <span className="font-bold text-slate-700">{eq.telemetry?.psi ?? 115} PSI</span></p>
                                  <p className="text-slate-500 font-medium">Vibración: <span className="font-bold text-rose-600">{eq.telemetry?.vibration ?? 'high'}</span></p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Pre-Invoice Modal */}
          {selectedInvoiceId && (() => {
            const ot = workOrders.find(o => o.id === selectedInvoiceId);
            if (!ot) return null;
            const client = clients.find(c => c.id === ot.clientId);
            const eq = equipment.find(e => e.id === ot.equipmentId);
            const isBilled = invoicedOrders.includes(ot.id);
            const laborCostTotal = (ot.laborHours || 0) * 1800;
            const partsCostTotal = ot.partsUsed.reduce((s, p) => s + (p.price * p.quantity), 0);
            const subtotal = laborCostTotal + partsCostTotal;
            const vat = subtotal * 0.16;
            const total = subtotal + vat;

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs text-left text-xs overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full flex flex-col border border-slate-100">
                  
                  {/* Modal Header */}
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">PRE-AUDITORÍA Y FACTURA AUTOMÁTICA</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">ORDEN DE SERVICIO: {ot.code}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedInvoiceId(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-lg border-none bg-transparent cursor-pointer"
                    >
                      ×
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-4">
                    {/* Client & Equipment header info */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Cliente (Emisor)</p>
                        <p className="font-bold text-slate-700">{client?.companyName}</p>
                        <p className="text-slate-500 font-medium">RFC: {client?.rfc}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Activo Intervenido</p>
                        <p className="font-bold text-slate-700">{eq?.name}</p>
                        <p className="text-slate-500 font-medium">{eq?.brand} {eq?.model}</p>
                      </div>
                    </div>

                    {/* Breakdown table */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">Conceptos de Facturación</h5>
                      
                      <div className="space-y-1.5 divide-y divide-slate-50">
                        {/* Labor */}
                        <div className="flex justify-between items-center pt-1.5">
                          <div>
                            <p className="font-bold text-slate-700">Mano de Obra Certificada de Campo</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{ot.laborHours || 0} Horas registradas @ $1,800.00 MXN / Hr</p>
                          </div>
                          <span className="font-mono font-bold text-slate-700">${laborCostTotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                        </div>

                        {/* Parts used */}
                        {ot.partsUsed.length > 0 ? (
                          ot.partsUsed.map((p, i) => (
                            <div key={i} className="flex justify-between items-center pt-1.5">
                              <div>
                                <p className="font-bold text-slate-700">{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{p.quantity} pzas @ ${p.price.toLocaleString('es-MX')} c/u</p>
                              </div>
                              <span className="font-mono font-bold text-slate-700">${(p.price * p.quantity).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between items-center pt-1.5 text-slate-400 italic text-[10px]">
                            <span>No se utilizaron refacciones del inventario</span>
                            <span>$0.00</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Totals box */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-end space-y-1 text-right">
                      <p className="text-slate-500 font-medium">Subtotal: <span className="font-mono font-bold text-slate-700">${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></p>
                      <p className="text-slate-500 font-medium">IVA Trasladado (16%): <span className="font-mono font-bold text-slate-700">${vat.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></p>
                      <div className="w-32 border-t border-slate-200 my-1"></div>
                      <p className="text-slate-800 font-bold text-sm">TOTAL: <span className="font-mono font-extrabold text-[#0196C1]">${total.toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN</span></p>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedInvoiceId(null)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer border-none text-[11px]"
                    >
                      Cerrar
                    </button>
                    {!isBilled && (
                      <button
                        onClick={() => {
                          setInvoicedOrders(prev => [...prev, ot.id]);
                          setSelectedInvoiceId(null);
                        }}
                        className="px-4 py-2 bg-[#0196C1] hover:bg-[#0185ab] text-white font-bold rounded-lg cursor-pointer border-none text-[11px]"
                      >
                        Autorizar Factura
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* --- Tab 2: Staff Management --- */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Staff form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0196C1]" />
              Alta de Personal
            </h3>
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Ing. Mario Salinas"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Rol / Puesto</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
                >
                  <option value="technician">Técnico de Campo</option>
                  <option value="coordinator">Coordinador / Supervisor</option>
                  <option value="admin">Administrador (Socio)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="mario@mvl.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Teléfono Móvil</label>
                <input
                  type="text"
                  placeholder="81-1234-5678"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Registrar Colaborador
              </button>
            </form>
          </div>

          {/* Staff directory */}
          <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Directorio de Colaboradores</h3>
            <div className="divide-y divide-slate-100">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 text-xs uppercase">
                      {member.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{member.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${member.role === 'admin' ? 'bg-rose-500' : member.role === 'coordinator' ? 'bg-[#0196C1]' : 'bg-emerald-500'}`} />
                        {member.role === 'admin' ? 'Administrador' : member.role === 'coordinator' ? 'Coordinador' : 'Técnico de Campo'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{member.email} • {member.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStaffStatus(member.id)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                        member.active 
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700' 
                          : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {member.active ? 'Activo' : 'Baja'}
                    </button>
                    <button
                      onClick={() => deleteStaff(member.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 3: Catalogs --- */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brands list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#0196C1]" />
              Catálogo Global de Marcas
            </h3>
            <p className="text-xs text-slate-400 mb-4">Marcas industriales autorizadas en la maquinaria del cliente.</p>
            
            <form onSubmit={handleAddBrand} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="ej. Gardner Denver"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Agregar
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <div key={brand} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 text-xs font-medium rounded-full text-slate-700">
                  {brand}
                  <button
                    type="button"
                    onClick={() => handleDeleteBrand(brand)}
                    className="text-slate-400 hover:text-rose-600 font-bold ml-1 text-[11px]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Price List view */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0196C1]" />
              Tarifas de Componentes y Consumibles
            </h3>
            <p className="text-xs text-slate-400 mb-4">Precios de venta de las piezas más comunes cambiadas en sitio.</p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {inventory.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">{item.code} • {item.category}</p>
                  </div>
                  <span className="font-bold text-[#0196C1]">${item.price.toLocaleString('es-MX')} MXN</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 4: Inventory Global & Stock alerts --- */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Part to Inventory */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#0196C1]" />
              Añadir al Inventario
            </h3>
            <form onSubmit={handleAddPart} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Nombre Refacción</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Filtro de Aceite Kaeser"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Código de Parte</label>
                  <input
                    type="text"
                    required
                    placeholder="FIL-50"
                    value={newPartCode}
                    onChange={(e) => setNewPartCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Categoría</label>
                  <select
                    value={newPartCategory}
                    onChange={(e) => setNewPartCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="consumable">Consumible</option>
                    <option value="electronic">Electrónica</option>
                    <option value="pneumatic">Neumática</option>
                    <option value="refrigeration">Refrigeración</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Stock Act</label>
                  <input
                    type="number"
                    value={newPartStock}
                    onChange={(e) => setNewPartStock(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Mín Req</label>
                  <input
                    type="number"
                    value={newPartMinStock}
                    onChange={(e) => setNewPartMinStock(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Precio MXN</label>
                  <input
                    type="number"
                    value={newPartPrice}
                    onChange={(e) => setNewPartPrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Añadir Componente
              </button>
            </form>
          </div>

          {/* Parts stock and alerts */}
          <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Catálogo de Almacén e Inventario</h3>
            
            {/* Minimal warning alerts */}
            <div className="space-y-2">
              {inventory.map((item) => {
                const isLow = item.stock <= item.minStock;
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                      isLow 
                        ? 'bg-amber-50/70 border-amber-200/60 text-amber-900' 
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isLow && <AlertTriangle className="w-4 h-4 text-amber-600 flex-none mt-0.5" />}
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{item.code} • {item.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">Stock: {item.stock} pzas</p>
                        <p className="text-[10px] text-slate-400">Min. req: {item.minStock}</p>
                      </div>
                      <button
                        onClick={() => deletePart(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Eliminar refacción"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- Tab: Client Directory (CRM) --- */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Left Column: CRM Client Directory list & Add Client */}
          <div className="space-y-6">
            {/* Add Client Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#0196C1]" />
                Registrar Cliente Comercial
              </h3>
              
              <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Razón Social (RFC Legal)</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Distribuidora del Norte S.A."
                    value={crmCompanyName}
                    onChange={(e) => setCrmCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre Comercial (Identificador)</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Lácteos del Norte"
                    value={crmName}
                    onChange={(e) => setCrmName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">RFC</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. PLN841102KK3"
                      value={crmRfc}
                      onChange={(e) => setCrmRfc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Teléfono</label>
                    <input
                      type="text"
                      required
                      placeholder="81-1234-5678"
                      value={crmPhone}
                      onChange={(e) => setCrmPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Corporativo</label>
                  <input
                    type="email"
                    required
                    placeholder="ej. admin@empresa.com"
                    value={crmEmail}
                    onChange={(e) => setCrmEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Dar de Alta Cliente
                </button>
              </form>
            </div>

            {/* Clients Directory List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Directorio CRM</h3>
              <div className="space-y-2">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCrmClientId(c.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedCrmClientId === c.id
                        ? 'bg-sky-50 border-[#0196C1] text-sky-900'
                        : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <p className="font-bold">{c.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{c.companyName}</p>
                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-200/40 text-[9px] text-slate-500">
                      <span>RFC: {c.rfc}</span>
                      <span className="bg-[#0196C1]/10 text-[#0196C1] px-1.5 py-0.5 rounded font-bold uppercase">
                        {c.plants.length} {c.plants.length === 1 ? 'sucursal' : 'sucursales'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed view of Plants, Contacts & Equipment */}
          <div className="lg:col-span-2 space-y-6">
            {activeCrmClient ? (
              <div className="space-y-6">
                {/* Client Main Summary Card */}
                <div className="bg-[#282829] text-white p-6 rounded-2xl border-b-4 border-[#0196C1] space-y-2 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-white/5 font-extrabold text-7xl select-none">CRM</div>
                  <h2 className="text-base font-extrabold text-[#0196C1] uppercase tracking-wide">{activeCrmClient.companyName}</h2>
                  <p className="text-xs text-slate-300 font-medium">RFC: {activeCrmClient.rfc} • Teléfono: {activeCrmClient.phone} • Email: {activeCrmClient.email}</p>
                </div>

                {/* Grid for Plants and Contacts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plants / Sucursales List & Add */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">🏢 Plantas / Sucursales</h3>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {activeCrmClient.plants.length} registradas
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {activeCrmClient.plants.length === 0 ? (
                        <p className="text-slate-400 italic text-[10px]">No hay sucursales/plantas registradas.</p>
                      ) : (
                        activeCrmClient.plants.map((p) => (
                          <div key={p.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px]">
                            <p className="font-bold text-slate-800">{p.name}</p>
                            <p className="text-slate-500">{p.address}, {p.city}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Plant Form */}
                    <form onSubmit={handleAddPlant} className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200 text-[10px]">
                      <p className="font-bold text-slate-700">Añadir Sucursal</p>
                      <input
                        type="text"
                        required
                        placeholder="Nombre Planta (ej. Planta Poniente)"
                        value={newPlantName}
                        onChange={(e) => setNewPlantName(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Dirección completa"
                        value={newPlantAddress}
                        onChange={(e) => setNewPlantAddress(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Ciudad, Estado (ej. Monterrey, NL)"
                        value={newPlantCity}
                        onChange={(e) => setNewPlantCity(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-[#282829] hover:bg-slate-800 text-white font-bold rounded-md cursor-pointer"
                      >
                        Registrar Planta
                      </button>
                    </form>
                  </div>

                  {/* Contacts List & Add */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">👥 Contactos Autorizados</h3>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {activeCrmClient.contacts.length} autorizados
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {activeCrmClient.contacts.length === 0 ? (
                        <p className="text-slate-400 italic text-[10px]">No hay contactos registrados.</p>
                      ) : (
                        activeCrmClient.contacts.map((contact, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] space-y-0.5">
                            <p className="font-bold text-slate-800">{contact.name}</p>
                            <p className="text-[#0196C1] font-semibold">{contact.role}</p>
                            <p className="text-slate-500">Tel: {contact.phone} • Email: {contact.email}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Contact Form */}
                    <form onSubmit={handleAddContact} className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200 text-[10px]">
                      <p className="font-bold text-slate-700">Añadir Contacto</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          required
                          placeholder="Nombre completo"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Puesto / Rol"
                          value={newContactRole}
                          onChange={(e) => setNewContactRole(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          required
                          placeholder="Teléfono"
                          value={newContactPhone}
                          onChange={(e) => setNewContactPhone(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                        />
                        <input
                          type="email"
                          required
                          placeholder="Email"
                          value={newContactEmail}
                          onChange={(e) => setNewContactEmail(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-[#282829] hover:bg-slate-800 text-white font-bold rounded-md cursor-pointer"
                      >
                        Registrar Contacto
                      </button>
                    </form>
                  </div>
                </div>

                {/* Equipment / Compressors of this client */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                    ⚙️ Parque de Equipos Registrados ({clientCrmMachines.length})
                  </h3>
                  
                  {clientCrmMachines.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No hay compresores o secadores registrados para esta empresa comercial.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {clientCrmMachines.map((eq) => (
                        <div key={eq.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] space-y-1">
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-slate-800">{eq.name}</p>
                            <span className={`px-2 py-0.2 text-[8px] font-bold rounded-full uppercase ${
                              eq.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                              eq.status === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {eq.status === 'active' ? 'Operando' :
                               eq.status === 'warning' ? 'Alerta' : 'Mto.'}
                            </span>
                          </div>
                          <p className="text-slate-400 uppercase font-semibold">{eq.brand} {eq.model} • S/N: {eq.serialNumber}</p>
                          <p className="text-slate-500">Capacidad: {eq.capacity} • Aceite: {eq.oilType}</p>
                          <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1 border-t border-slate-200/50">
                            <span>Horas: {eq.engineHours.toLocaleString()} Hrs</span>
                            <span>Último Mto: {eq.lastMaintenance}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400 italic">
                Selecciona un cliente de la lista para ver sus sucursales, contactos autorizados y flota de compresores.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Tab: Registro de Órdenes de Compra (As requested) --- */}
      {activeTab === 'purchase_orders' && (
        <div className="space-y-6 text-left">
          {/* Header Description */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-[#282829] uppercase tracking-wider">Registro y Distribución de Órdenes de Compra</h2>
              <p className="text-xs text-slate-500 mt-1">
                Monitoreo financiero, reserva del 20% para cuenta de ahorro de la empresa y distribución detallada de utilidades entre socios comerciales.
              </p>
            </div>
            <button
              onClick={handleOpenCreatePo}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              Nueva Orden de Compra
            </button>
          </div>

          {/* Financial KPI Summary Cards specifically for POs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Utilidad Bruta Total</span>
              <h3 className="text-xl font-black text-slate-800 mt-1">
                ${purchaseOrders.reduce((sum, po) => sum + po.utility, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Fondo antes de reservas y splits</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Ahorro MVL (20% Reserva)</span>
              <h3 className="text-xl font-black text-amber-600 mt-1">
                ${purchaseOrders.reduce((sum, po) => sum + po.savings, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Resguardado en cuenta bancaria</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#0196C1]/10 shadow-xs">
              <span className="text-[10px] text-[#0196C1] font-bold uppercase tracking-wider block">Monto Neto Distribuible</span>
              <h3 className="text-xl font-black text-[#0196C1] mt-1">
                ${purchaseOrders.reduce((sum, po) => sum + po.utilityAfterSavings, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Utilidad neta a repartir</p>
            </div>

            <div className="bg-[#282829] text-white p-4 rounded-xl border-l-4 border-[#0196C1] shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sueldos Finales Netos (X, Y, Z)</span>
              <div className="space-y-1 mt-1 text-[11px] font-semibold text-slate-200">
                <div className="flex justify-between">
                  <span>Marco (26.22%):</span>
                  <span className="font-bold text-white">
                    ${purchaseOrders.reduce((sum, po) => sum + po.marcoFinal, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Victor (47.94%):</span>
                  <span className="font-bold text-white">
                    ${purchaseOrders.reduce((sum, po) => sum + po.victorFinal, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Leo (25.84%):</span>
                  <span className="font-bold text-white">
                    ${purchaseOrders.reduce((sum, po) => sum + po.leoFinal, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar & statistics info */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Buscar por número, código o concepto..."
                value={poSearchQuery}
                onChange={(e) => {
                  setPoSearchQuery(e.target.value);
                  setPoCurrentPage(1); // reset to page 1 on search
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Mostrando {paginatedPOs.length} de {filteredPOs.length} filtrados (Total: {purchaseOrders.length} registros)
            </div>
          </div>

          {/* Custom style for highly visible lateral scrollbar */}
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              height: 12px !important;
              width: 12px !important;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f8fafc !important; /* slate-50 */
              border-radius: 6px !important;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #94a3b8 !important; /* slate-400 */
              border-radius: 6px !important;
              border: 2px solid #f8fafc !important;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #0196C1 !important;
            }
            .custom-scrollbar {
              scrollbar-width: auto !important;
              scrollbar-color: #94a3b8 #f8fafc !important;
            }
          `}</style>

          {/* Double Horizontal Scrollbar - TOP SCROLLER */}
          {tableScrollWidth > 0 && (
            <div 
              ref={topScrollRef} 
              onScroll={handleTopScroll} 
              className="overflow-x-auto w-full custom-scrollbar bg-slate-50/60 rounded-lg border border-slate-100 p-1"
              style={{ scrollbarWidth: 'thin' }}
            >
              <div style={{ width: `${tableScrollWidth}px`, height: '2px' }}></div>
            </div>
          )}

          {/* Table of Purchase Orders */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div 
              ref={bottomScrollRef} 
              onScroll={handleBottomScroll} 
              className="overflow-x-auto w-full custom-scrollbar"
            >
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold">
                    <th className="py-3 px-4">Número de orden</th>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Concepto / Servicio</th>
                    <th className="py-3 px-4 text-right">Utilidad</th>
                    <th className="py-3 px-4 text-right">Ahorro 20%</th>
                    <th className="py-3 px-4 text-right">Neto Disp.</th>
                    <th className="py-3 px-4 text-center">Marco</th>
                    <th className="py-3 px-4 text-center">Victor</th>
                    <th className="py-3 px-4 text-center">Leo</th>
                    <th className="py-3 px-4 text-center">Sueldos Finales (M / V / L)</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-[#0196C1]">Nº {po.orderNumber || '-'}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{po.code}</td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{po.date}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium max-w-[200px] truncate" title={po.concept}>{po.concept}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                        ${po.utility.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-amber-600 bg-amber-50/20">
                        ${po.savings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#0196C1]">
                        ${po.utilityAfterSavings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      
                      {/* Partner O (Marco) */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="block font-semibold">${po.marcoAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1 py-0.2 rounded">{po.marcoPercent}%</span>
                      </td>

                      {/* Partner Q (Victor) */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="block font-semibold">${po.victorAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1 py-0.2 rounded">{po.victorPercent}%</span>
                      </td>

                      {/* Partner S (Leo) */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="block font-semibold">${po.leoAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1 py-0.2 rounded">{po.leoPercent}%</span>
                      </td>

                      {/* Final payments columns X, Y, Z */}
                      <td className="py-3.5 px-3 bg-slate-50/40">
                        <div className="flex flex-col gap-0.5 text-[10px] font-medium text-slate-600">
                          <div className="flex justify-between gap-2">
                            <span>M (26.22%):</span>
                            <span className="font-bold text-slate-800">${po.marcoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span>V (47.94%):</span>
                            <span className="font-bold text-slate-800">${po.victorFinal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span>L (25.84%):</span>
                            <span className="font-bold text-slate-800">${po.leoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenViewPo(po)}
                            className="p-1.5 text-slate-500 hover:text-[#0196C1] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Ver Detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPo(po)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Registro"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePo(po.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Borrar Registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls inside table wrapper footer */}
            {poTotalPages > 1 && (
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPoCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:hover:bg-white border border-slate-200 font-bold rounded-lg cursor-pointer transition-all text-xs"
                >
                  Anterior
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: poTotalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setPoCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-[#0196C1] text-white font-extrabold shadow-xs'
                          : 'text-slate-600 bg-white hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPoCurrentPage(prev => Math.min(poTotalPages, prev + 1))}
                  disabled={currentPage === poTotalPages}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:hover:bg-white border border-slate-200 font-bold rounded-lg cursor-pointer transition-all text-xs"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          {/* Create/Edit Modal Overlay */}
          {(activePoModal === 'create' || activePoModal === 'edit') && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-[#282829] text-white flex justify-between items-center border-b border-slate-700">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {activePoModal === 'create' ? 'Agregar Nueva Orden de Compra' : 'Editar Orden de Compra'}
                  </h3>
                  <button
                    onClick={() => { setActivePoModal(null); setSelectedPo(null); }}
                    className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSavePo} className="p-6 space-y-5 text-xs flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Número de orden</label>
                      <input
                        type="text"
                        required
                        placeholder="ej. 13"
                        value={formPoOrderNumber}
                        onChange={(e) => setFormPoOrderNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0196C1] font-extrabold text-[#0196C1]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Código de Orden</label>
                      <input
                        type="text"
                        required
                        placeholder="ej. OC-2026-013"
                        value={formPoCode}
                        onChange={(e) => setFormPoCode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0196C1]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha de Registro</label>
                      <input
                        type="date"
                        required
                        value={formPoDate}
                        onChange={(e) => setFormPoDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0196C1]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Utilidad Bruta ($)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        placeholder="Monto de utilidad"
                        value={formPoUtility || ''}
                        onChange={(e) => setFormPoUtility(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0196C1] font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Concepto / Descripción del Servicio</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Reconstrucción de Unidad de Compresión de Aire Kaeser"
                      value={formPoConcept}
                      onChange={(e) => setFormPoConcept(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0196C1]"
                    />
                  </div>

                  <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/60">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Ahorro MVL (Reserva de Empresa)</span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{formPoSavingsPercent}%</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={formPoSavingsPercent}
                        onChange={(e) => setFormPoSavingsPercent(Number(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      />
                      <span className="text-xs font-bold text-slate-700 w-24 text-right whitespace-nowrap">
                        ${(formPoUtility * (formPoSavingsPercent / 100)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Partner Split Percentages */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distribución entre Socios (%)</h4>
                      <span className={`text-[10px] px-2 py-0.5 font-bold rounded-md ${
                        (Number(formPoMarcoPercent) + Number(formPoVictorPercent) + Number(formPoLeoPercent) + Number(formPoRikyPercent)) === 100
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        Suma: {Number(formPoMarcoPercent) + Number(formPoVictorPercent) + Number(formPoLeoPercent) + Number(formPoRikyPercent)}% (Req: 100%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Marco (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formPoMarcoPercent}
                          onChange={(e) => setFormPoMarcoPercent(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                        />
                        <span className="block text-center text-[10px] text-slate-400 mt-1">
                          ${((formPoUtility * (1 - formPoSavingsPercent / 100)) * (formPoMarcoPercent / 100)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Victor (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formPoVictorPercent}
                          onChange={(e) => setFormPoVictorPercent(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                        />
                        <span className="block text-center text-[10px] text-slate-400 mt-1">
                          ${((formPoUtility * (1 - formPoSavingsPercent / 100)) * (formPoVictorPercent / 100)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Leo (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formPoLeoPercent}
                          onChange={(e) => setFormPoLeoPercent(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                        />
                        <span className="block text-center text-[10px] text-slate-400 mt-1">
                          ${((formPoUtility * (1 - formPoSavingsPercent / 100)) * (formPoLeoPercent / 100)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Riky (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formPoRikyPercent}
                          onChange={(e) => setFormPoRikyPercent(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                        />
                        <span className="block text-center text-[10px] text-slate-400 mt-1">
                          ${((formPoUtility * (1 - formPoSavingsPercent / 100)) * (formPoRikyPercent / 100)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Final Calculations preview box (Columns X, Y, Z based on ratios) */}
                  <div className="bg-[#282829] text-white p-4 rounded-xl border-l-4 border-[#0196C1] space-y-2">
                    <h5 className="text-[10px] font-extrabold uppercase text-[#0196C1] tracking-wide">Cálculo de Sueldos Finales (Fórmula de Proporciones Excel)</h5>
                    <p className="text-[10px] text-slate-400">
                      Calculado automáticamente a partir de los coeficientes del libro de control de obra (Marco 26.22%, Victor 47.94%, Leo 25.84%).
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-700">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Marco Sueldo</span>
                        <span className="block text-xs font-extrabold text-white">
                          ${((formPoUtility * (1 - formPoSavingsPercent / 100)) * 0.2622).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Victor Sueldo</span>
                        <span className="block text-xs font-extrabold text-white">
                          ${((formPoUtility * (1 - formPoSavingsPercent / 100)) * 0.4794).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Leo Sueldo</span>
                        <span className="block text-xs font-extrabold text-white">
                          ${((formPoUtility * (1 - formPoSavingsPercent / 100)) * 0.2584).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setActivePoModal(null); setSelectedPo(null); }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                    >
                      Guardar Registro
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Details Modal Overlay */}
          {activePoModal === 'view' && selectedPo && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col">
                <div className="px-6 py-4 bg-[#282829] text-white flex justify-between items-center border-b border-slate-700">
                  <h3 className="text-xs font-bold uppercase tracking-wider">Detalles de la Orden {selectedPo.code}</h3>
                  <button
                    onClick={() => { setActivePoModal(null); setSelectedPo(null); }}
                    className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6 text-xs">
                  {/* Summary Header */}
                  <div className="border-b border-slate-100 pb-4 text-center space-y-1">
                    <div className="flex justify-center gap-2 items-center text-[10px] font-bold uppercase text-slate-400">
                      <span className="text-[#0196C1]">Nº Orden: {selectedPo.orderNumber || '-'}</span>
                      <span>•</span>
                      <span>Código: {selectedPo.code}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monto de Utilidad Bruta</span>
                    <h2 className="text-2xl font-black text-[#282829]">
                      ${selectedPo.utility.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">{selectedPo.concept}</p>
                    <span className="inline-block bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                      Fecha: {selectedPo.date}
                    </span>
                  </div>

                  {/* Split Distribution breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cálculos de Distribución Financiera</h4>
                    
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between pb-1 border-b border-slate-200/40 font-medium">
                        <span className="text-slate-500">Utilidad Bruta:</span>
                        <span className="font-bold text-slate-800">${selectedPo.utility.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between pb-1 border-b border-slate-200/40 text-amber-700 font-medium">
                        <span>Ahorro MVL ({selectedPo.utility > 0 ? Math.round((selectedPo.savings / selectedPo.utility) * 100) : 20}%):</span>
                        <span className="font-bold">${selectedPo.savings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between pt-1 font-bold text-[#0196C1]">
                        <span>Utilidad Distribuible:</span>
                        <span>${selectedPo.utilityAfterSavings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Partner splits */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Participación de Socios</h4>
                    
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="block text-[9px] font-semibold text-slate-500">Marco</span>
                        <span className="block font-bold text-slate-800">${selectedPo.marcoAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[9px] text-slate-400 font-medium">({selectedPo.marcoPercent}%)</span>
                      </div>
                      <div className="p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="block text-[9px] font-semibold text-slate-500">Victor</span>
                        <span className="block font-bold text-slate-800">${selectedPo.victorAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[9px] text-slate-400 font-medium">({selectedPo.victorPercent}%)</span>
                      </div>
                      <div className="p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="block text-[9px] font-semibold text-slate-500">Leo</span>
                        <span className="block font-bold text-slate-800">${selectedPo.leoAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[9px] text-slate-400 font-medium">({selectedPo.leoPercent}%)</span>
                      </div>
                      <div className="p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="block text-[9px] font-semibold text-slate-500">Riky</span>
                        <span className="block font-bold text-slate-800">${selectedPo.rikyAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[9px] text-slate-400 font-medium">({selectedPo.rikyPercent}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Final pay distributions */}
                  <div className="p-4 bg-[#282829] text-white rounded-xl border-l-4 border-[#0196C1] space-y-2">
                    <h5 className="text-[10px] font-extrabold uppercase text-[#0196C1] tracking-wide">Sueldos Finales de Socios (Libro Excel)</h5>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div>
                        <span className="block text-[9px] text-slate-400">Marco (26.22%)</span>
                        <span className="block font-bold text-white">${selectedPo.marcoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400">Victor (47.94%)</span>
                        <span className="block font-bold text-white">${selectedPo.victorFinal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400">Leo (25.84%)</span>
                        <span className="block font-bold text-white">${selectedPo.leoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Close button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => { setActivePoModal(null); setSelectedPo(null); }}
                      className="px-5 py-2 bg-[#282829] hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Cerrar Vista
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Tab: Control de Gastos (Proyectos) --- */}
      {activeTab === 'expense_control' && (
        <div className="space-y-6 text-left animate-fadeIn">
          {/* Header Description & Supabase Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-[#282829] uppercase tracking-wider">Control de Gastos y Rentabilidad de Proyectos</h2>
                {supabaseStatus === 'connected' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    Supabase Conectado
                  </span>
                ) : supabaseStatus === 'checking' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-full border border-sky-200">
                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"></span>
                    Sincronizando...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200" title={supabaseError || ''}>
                    Modo Local (Offline)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Registro minucioso de ingresos de clientes, desglose de IVA (16%), deducción de gastos de proyecto, cálculo de ahorro (20%) y utilidad neta real.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  fetchExpensesFromSupabase();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                title="Recargar datos de Supabase"
              >
                Sincronizar
              </button>
              <button
                onClick={handleOpenCreateExp}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Nuevo Registro de Gastos
              </button>
            </div>
          </div>

          {/* KPI Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ingreso de Clientes (Neto)</span>
                <span className="p-1 bg-sky-50 text-sky-600 rounded-lg"><DollarSign className="w-3.5 h-3.5" /></span>
              </div>
              <h3 className="text-xl font-black text-slate-800 mt-2">
                ${expensesList.reduce((sum, item) => sum + item.clientPayment, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Suma total cobrada a clientes</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Gastos Totales Deductibles</span>
                <span className="p-1 bg-rose-50 text-rose-600 rounded-lg"><TrendingDown className="w-3.5 h-3.5" /></span>
              </div>
              <h3 className="text-xl font-black text-rose-600 mt-2">
                ${expensesList.reduce((sum, item) => sum + item.expenses, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Costo de materiales, refacciones e insumos</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Utilidad Bruta Acumulada</span>
                <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp className="w-3.5 h-3.5" /></span>
              </div>
              <h3 className="text-xl font-black text-emerald-600 mt-2">
                ${expensesList.reduce((sum, item) => sum + item.utility, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Utilidad neta generada por proyectos</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs bg-gradient-to-br from-white to-amber-50/20">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Fondo de Ahorro MVL (20%)</span>
                <span className="p-1 bg-amber-50 text-amber-600 rounded-lg"><Award className="w-3.5 h-3.5" /></span>
              </div>
              <h3 className="text-xl font-black text-amber-700 mt-2">
                ${expensesList.reduce((sum, item) => sum + item.savings, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Fondo acumulado de ahorro reservado</p>
            </div>
          </div>



          {/* Search, Filter & Actions Panel */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar por cliente, descripción, agente o factura..."
                value={expSearchQuery}
                onChange={(e) => {
                  setExpSearchQuery(e.target.value);
                  setExpCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0196C1] focus:bg-white text-xs transition-all"
              />
            </div>
            
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Registros encontrados: <span className="text-[#0196C1]">{expensesList.filter(exp => {
                const query = expSearchQuery.toLowerCase();
                return (
                  exp.projectDescription.toLowerCase().includes(query) ||
                  exp.clientName.toLowerCase().includes(query) ||
                  exp.agentName.toLowerCase().includes(query) ||
                  exp.invoiceNumber.toLowerCase().includes(query)
                );
              }).length}</span>
            </div>
          </div>

          {/* Interactive Expenses Registry Grid/Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold">
                    <th className="py-3.5 px-4">Cliente // proyecto</th>
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4">Agente</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Fecha Fac</th>
                    <th className="py-3.5 px-4">Factura</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Fecha de pago</th>
                    <th className="py-3.5 px-4 text-right">IVA</th>
                    <th className="py-3.5 px-4 text-right">Subtotal</th>
                    <th className="py-3.5 px-4 text-right">Pago de cliente</th>
                    <th className="py-3.5 px-4 text-right">Gastos</th>
                    <th className="py-3.5 px-4 text-right">Utilidad</th>
                    <th className="py-3.5 px-4 text-right">Ahorro 20%</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 max-w-[220px] truncate" title={exp.projectDescription}>
                          {exp.projectDescription}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0196C1] uppercase">{exp.clientName}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">{exp.agentName}</td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {exp.invoiceDate ? exp.invoiceDate.split('-').reverse().join('/') : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-bold">{exp.invoiceNumber || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {exp.paymentDate ? exp.paymentDate.split('-').reverse().join('/') : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                          ${exp.tax.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                          ${exp.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#0196C1] bg-[#0196C1]/5">
                          ${exp.clientPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-semibold ${exp.expenses > 0 ? 'text-rose-600 bg-rose-50/10' : 'text-slate-400'}`}>
                          {exp.expenses > 0 ? `$${exp.expenses.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-600 bg-emerald-50/10">
                          ${exp.utility.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-600 bg-amber-50/25">
                          ${exp.savings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenViewExp(exp)}
                              className="p-1.5 text-slate-500 hover:text-[#0196C1] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title="Detalle Completo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditExp(exp)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar Fila"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar Fila"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {expTotalPages > 1 && (
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExpCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={expCurrentPage === 1}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:hover:bg-white border border-slate-200 font-bold rounded-lg cursor-pointer transition-all text-xs"
                >
                  Anterior
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: expTotalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setExpCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        expCurrentPage === page
                          ? 'bg-[#0196C1] text-white font-extrabold shadow-xs'
                          : 'text-slate-600 bg-white hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setExpCurrentPage(prev => Math.min(expTotalPages, prev + 1))}
                  disabled={expCurrentPage === expTotalPages}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:hover:bg-white border border-slate-200 font-bold rounded-lg cursor-pointer transition-all text-xs"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          {/* Form Modal (Create & Edit) */}
          {(activeExpModal === 'create' || activeExpModal === 'edit') && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-[#282829] text-white flex justify-between items-center border-b border-slate-700">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {activeExpModal === 'create' ? 'Agregar Registro de Gasto/Proyecto' : 'Editar Registro de Gasto/Proyecto'}
                  </h3>
                  <button
                    onClick={() => { setActiveExpModal(null); setSelectedExp(null); }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer text-lg font-bold"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateOrUpdateExpense} className="p-6 space-y-4">
                  {/* Basic Project Fields */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente // Proyecto (Descripción)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. aceite para compresor oc 417252"
                      value={formExpDescription}
                      onChange={(e) => setFormExpDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0196C1] focus:bg-white text-xs transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre del Cliente</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. SENSIENT, relats, Guala..."
                        value={formExpClientName}
                        onChange={(e) => setFormExpClientName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0196C1] focus:bg-white text-xs transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agente / Encargado</label>
                      <select
                        value={formExpAgentName}
                        onChange={(e) => setFormExpAgentName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0196C1] focus:bg-white text-xs transition-all"
                      >
                        <option value="">Selecciona Agente...</option>
                        <option value="Marco">Marco</option>
                        <option value="Victor">Victor</option>
                        <option value="LEONARDO">LEONARDO</option>
                        <option value="Riky">Riky</option>
                      </select>
                    </div>
                  </div>

                  {/* Dates & Reference */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Factura (fecha fac)</label>
                      <input
                        type="date"
                        value={formExpInvoiceDate}
                        onChange={(e) => setFormExpInvoiceDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0196C1] focus:bg-white text-xs transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Número de Factura</label>
                      <input
                        type="text"
                        placeholder="Ej. 90"
                        value={formExpInvoiceNumber}
                        onChange={(e) => setFormExpInvoiceNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0196C1] focus:bg-white text-xs transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de Pago</label>
                      <input
                        type="date"
                        value={formExpPaymentDate}
                        onChange={(e) => setFormExpPaymentDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0196C1] focus:bg-white text-xs transition-all"
                      />
                    </div>
                  </div>

                  {/* Financial Fields */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="text-[11px] font-bold uppercase text-slate-700 tracking-wider">Valores Financieros</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subtotal ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={formExpSubtotal || ''}
                          onChange={(e) => setFormExpSubtotal(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0196C1] text-xs transition-all font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IVA Estimado (16% Auto) ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formExpTax || ''}
                          onChange={(e) => setFormExpTax(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none text-xs transition-all font-semibold text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pago de Cliente ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={formExpClientPayment || ''}
                          onChange={(e) => setFormExpClientPayment(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0196C1] text-xs transition-all font-bold text-[#0196C1]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gastos Deductibles ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={formExpExpenses || ''}
                          onChange={(e) => setFormExpExpenses(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs transition-all font-bold text-rose-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilidad (Auto) ($)</label>
                        <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-emerald-600">
                          ${formExpUtility.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Ahorro Estimado (20% Reserva MVL):</span>
                      <span className="font-extrabold text-amber-600 text-sm">
                        ${formExpSavings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setActiveExpModal(null); setSelectedExp(null); }}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer text-xs transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#0196C1] hover:bg-[#017fa4] text-white font-bold rounded-xl cursor-pointer text-xs shadow-xs transition-colors"
                    >
                      {activeExpModal === 'create' ? 'Agregar Fila' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Details Modal */}
          {activeExpModal === 'view' && selectedExp && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-[#282829] text-white flex justify-between items-center border-b border-slate-700 rounded-t-2xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Detalle del Registro</span>
                    <span className="text-xs font-semibold text-[#0196C1]">ID: {selectedExp.id}</span>
                  </div>
                  <button
                    onClick={() => { setActiveExpModal(null); setSelectedExp(null); }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer text-lg font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6 space-y-6 text-xs text-left">
                  {/* Summary Header */}
                  <div className="border-b border-slate-100 pb-4 text-center space-y-1">
                    <div className="flex justify-center gap-2 items-center text-[10px] font-bold uppercase text-slate-400">
                      <span className="text-[#0196C1]">Cliente: {selectedExp.clientName}</span>
                      <span>•</span>
                      <span>Agente: {selectedExp.agentName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monto de Utilidad Bruta</span>
                    <h2 className="text-2xl font-black text-slate-800">
                      ${selectedExp.utility.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <span className="inline-block bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded text-[9px] font-bold">
                      Ahorro MVL (20%): ${selectedExp.savings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Concepto de Proyecto</h4>
                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 font-semibold text-xs">
                      {selectedExp.projectDescription}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">Fecha de Factura</span>
                      <span className="font-semibold text-slate-800">
                        {selectedExp.invoiceDate ? selectedExp.invoiceDate.split('-').reverse().join('/') : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">Factura Nº</span>
                      <span className="font-bold text-[#0196C1]">
                        {selectedExp.invoiceNumber || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">Fecha de Pago</span>
                      <span className="font-semibold text-slate-800">
                        {selectedExp.paymentDate ? selectedExp.paymentDate.split('-').reverse().join('/') : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">IVA (16% cobrado)</span>
                      <span className="font-semibold text-slate-700">
                        ${selectedExp.tax.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown details */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desglose de Totales</h4>
                    <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="text-slate-800 font-bold">${selectedExp.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-[#0196C1] font-bold">
                        <span>Pago de Cliente (Ingreso):</span>
                        <span>${selectedExp.clientPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Gastos de Proyecto:</span>
                        <span>-${selectedExp.expenses.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 text-emerald-600 font-extrabold text-xs">
                        <span>Utilidad Comercial:</span>
                        <span>${selectedExp.utility.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Close button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => { setActiveExpModal(null); setSelectedExp(null); }}
                      className="px-5 py-2 bg-[#282829] hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Cerrar Vista
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
