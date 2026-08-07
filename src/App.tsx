/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCog, CalendarCheck2, Hammer, Building2, 
  ArrowLeft, LogOut, Check, Sparkles, AlertCircle, RefreshCw,
  LayoutGrid, DollarSign, Users, Layers, Package, Clock,
  FileText, Calendar, AlertOctagon, BookOpen, FileCheck, ShieldCheck, ChevronRight
} from 'lucide-react';

// Data models & Storage helpers
import { Client, Equipment, InventoryItem, Staff, WorkOrder, UserRole, PurchaseOrder } from './types';
import { 
  INITIAL_CLIENTS, INITIAL_EQUIPMENT, INITIAL_INVENTORY, 
  INITIAL_STAFF, INITIAL_WORK_ORDERS, INITIAL_PURCHASE_ORDERS, loadFromStorage, saveToStorage 
} from './mockData';

// Dashboard Components
import AdminDashboard from './components/AdminDashboard';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import ClientDashboard from './components/ClientDashboard';
import AccountingDashboard from './components/AccountingDashboard';
import PDFReportView from './components/PDFReportView';
import PWAInstallBtn from './components/PWAInstallBtn';

export default function App() {
  // --- Persistent core states ---
  const [clients, setClients] = useState<Client[]>(() => 
    loadFromStorage<Client[]>('mvl_clients', INITIAL_CLIENTS)
  );
  const [equipment, setEquipment] = useState<Equipment[]>(() => 
    loadFromStorage<Equipment[]>('mvl_equipment', INITIAL_EQUIPMENT)
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(() => 
    loadFromStorage<InventoryItem[]>('mvl_inventory', INITIAL_INVENTORY)
  );
  const [staff, setStaff] = useState<Staff[]>(() => 
    loadFromStorage<Staff[]>('mvl_staff', INITIAL_STAFF)
  );
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => 
    loadFromStorage<WorkOrder[]>('mvl_work_orders', INITIAL_WORK_ORDERS)
  );
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => 
    loadFromStorage<PurchaseOrder[]>('mvl_purchase_orders', INITIAL_PURCHASE_ORDERS)
  );

  // Sync to local storage
  useEffect(() => { saveToStorage('mvl_clients', clients); }, [clients]);
  useEffect(() => { saveToStorage('mvl_equipment', equipment); }, [equipment]);
  useEffect(() => { saveToStorage('mvl_inventory', inventory); }, [inventory]);
  useEffect(() => { saveToStorage('mvl_staff', staff); }, [staff]);
  useEffect(() => { saveToStorage('mvl_work_orders', workOrders); }, [workOrders]);
  useEffect(() => { saveToStorage('mvl_purchase_orders', purchaseOrders); }, [purchaseOrders]);

  // --- Session State ---
  const [activeRole, setActiveRole] = useState<UserRole | null>(() =>
    loadFromStorage<UserRole | null>('mvl_active_role', null)
  );

  // --- Sub-module Tab/Filter States ---
  const [adminTab, setAdminTab] = useState<'financial' | 'staff' | 'clients' | 'catalog' | 'inventory' | 'purchase_orders' | 'expense_control' | 'tutorial'>(() =>
    loadFromStorage<'financial' | 'staff' | 'clients' | 'catalog' | 'inventory' | 'purchase_orders' | 'expense_control' | 'tutorial'>('mvl_admin_tab', 'financial')
  );
  const [coordFilter, setCoordFilter] = useState<'quotes' | 'all' | 'pending' | 'in_progress' | 'review' | 'completed' | 'tutorial'>(() =>
    loadFromStorage<'quotes' | 'all' | 'pending' | 'in_progress' | 'review' | 'completed' | 'tutorial'>('mvl_coord_filter', 'quotes')
  );
  const [accountingTab, setAccountingTab] = useState<'fiscal_mvl' | 'billing' | 'clients_fiscal' | 'tutorial'>(() =>
    loadFromStorage<'fiscal_mvl' | 'billing' | 'clients_fiscal' | 'tutorial'>('mvl_accounting_tab', 'fiscal_mvl')
  );
  const [techTab, setTechTab] = useState<'agenda' | 'reporte' | 'tutorial'>(() =>
    loadFromStorage<'agenda' | 'reporte' | 'tutorial'>('mvl_tech_tab', 'agenda')
  );
  const [clientTab, setClientTab] = useState<'equipos' | 'historial' | 'falla' | 'tutorial'>(() =>
    loadFromStorage<'equipos' | 'historial' | 'falla' | 'tutorial'>('mvl_client_tab', 'equipos')
  );

  // Sync session and tab/filter states
  useEffect(() => { saveToStorage('mvl_active_role', activeRole); }, [activeRole]);
  useEffect(() => { saveToStorage('mvl_admin_tab', adminTab); }, [adminTab]);
  useEffect(() => { saveToStorage('mvl_coord_filter', coordFilter); }, [coordFilter]);
  useEffect(() => { saveToStorage('mvl_accounting_tab', accountingTab); }, [accountingTab]);
  useEffect(() => { saveToStorage('mvl_tech_tab', techTab); }, [techTab]);
  useEffect(() => { saveToStorage('mvl_client_tab', clientTab); }, [clientTab]);

  const handleSelectRole = (role: UserRole | null) => {
    setActiveRole(role);
    if (role === null) {
      setAdminTab('financial');
      setCoordFilter('quotes');
      setAccountingTab('fiscal_mvl');
      setTechTab('agenda');
      setClientTab('equipos');
    }
  };

  const [selectedPdfOt, setSelectedPdfOt] = useState<WorkOrder | null>(null);

  const handleCloseReport = () => { setSelectedPdfOt(null); };
  const handleOpenReport = (ot: WorkOrder) => { setSelectedPdfOt(ot); };

  const handleResetDemoData = () => {
    if (confirm('¿Está seguro de reiniciar los datos del sistema a los valores de fábrica?')) {
      localStorage.clear();
      setClients(INITIAL_CLIENTS);
      setEquipment(INITIAL_EQUIPMENT);
      setInventory(INITIAL_INVENTORY);
      setStaff(INITIAL_STAFF);
      setWorkOrders(INITIAL_WORK_ORDERS);
      setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
      handleSelectRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-[#282829] font-sans selection:bg-[#0196C1]/20 selection:text-[#0196C1]">
      
      {/* Dynamic PDF Report overlay rendering */}
      {selectedPdfOt && (
        <PDFReportView
          workOrder={selectedPdfOt}
          client={clients.find(c => c.id === selectedPdfOt.clientId) || clients[0]}
          equipment={equipment.find(e => e.id === selectedPdfOt.equipmentId) || equipment[0]}
          onClose={handleCloseReport}
        />
      )}

      {!activeRole ? (
        // ==================== HOME ROLE SELECTOR SCREEN ====================
        <div className="min-h-screen flex flex-col justify-center items-center p-4 md:p-8 max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center">
            <img 
              src="https://appdesignproyectos.com/mvl.png" 
              alt="MVL Logo" 
              className="h-28 md:h-36 object-contain"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#282829] tracking-tight">
              MVL Control y Mantenimiento Industrial
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Seleccione su rol de proceso para acceder al sistema con navegación lateral e inferior.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 w-full mx-auto px-1">
            {/* 1. Socios */}
            <button
              onClick={() => handleSelectRole('admin')}
              className="bg-white rounded-[20px] py-4 px-3 flex flex-col items-center justify-center text-center shadow-[0_10px_25px_rgba(0,0,0,0.04)] border border-black/5 cursor-pointer transition-all duration-300 hover:shadow-[0_15px_35px_rgba(1,150,193,0.15)] hover:-translate-y-1 hover:border-[#0196C1] active:scale-98 group"
            >
              <div className="w-12 h-12 bg-[#0196C1]/10 rounded-full flex items-center justify-center mb-3 text-[#0196C1] group-hover:bg-[#0196C1] group-hover:text-white transition-all duration-300">
                <UserCog className="w-6 h-6" />
              </div>
              <p className="font-bold text-xs uppercase tracking-tight text-[#282829] m-0">1. Socios</p>
              <span className="text-[10px] text-slate-500 mt-1 leading-tight">Dirección & Finanzas</span>
            </button>

            {/* 2. Ventas */}
            <button
              onClick={() => handleSelectRole('coordinator')}
              className="bg-white rounded-[20px] py-4 px-3 flex flex-col items-center justify-center text-center shadow-[0_10px_25px_rgba(0,0,0,0.04)] border border-black/5 cursor-pointer transition-all duration-300 hover:shadow-[0_15px_35px_rgba(1,150,193,0.15)] hover:-translate-y-1 hover:border-[#0196C1] active:scale-98 group"
            >
              <div className="w-12 h-12 bg-[#0196C1]/10 rounded-full flex items-center justify-center mb-3 text-[#0196C1] group-hover:bg-[#0196C1] group-hover:text-white transition-all duration-300">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-xs uppercase tracking-tight text-[#282829] m-0">2. Ventas</p>
              <span className="text-[10px] text-slate-500 mt-1 leading-tight">Cotizaciones & OT</span>
            </button>

            {/* 3. Contabilidad */}
            <button
              onClick={() => handleSelectRole('accounting')}
              className="bg-white rounded-[20px] py-4 px-3 flex flex-col items-center justify-center text-center shadow-[0_10px_25px_rgba(0,0,0,0.04)] border border-black/5 cursor-pointer transition-all duration-300 hover:shadow-[0_15px_35px_rgba(1,150,193,0.15)] hover:-translate-y-1 hover:border-[#0196C1] active:scale-98 group"
            >
              <div className="w-12 h-12 bg-[#0196C1]/10 rounded-full flex items-center justify-center mb-3 text-[#0196C1] group-hover:bg-[#0196C1] group-hover:text-white transition-all duration-300">
                <FileCheck className="w-6 h-6" />
              </div>
              <p className="font-bold text-xs uppercase tracking-tight text-[#282829] m-0">3. Contabilidad</p>
              <span className="text-[10px] text-slate-500 mt-1 leading-tight">Facturación & SAT</span>
            </button>

            {/* 4. Técnico */}
            <button
              onClick={() => handleSelectRole('technician')}
              className="bg-white rounded-[20px] py-4 px-3 flex flex-col items-center justify-center text-center shadow-[0_10px_25px_rgba(0,0,0,0.04)] border border-black/5 cursor-pointer transition-all duration-300 hover:shadow-[0_15px_35px_rgba(1,150,193,0.15)] hover:-translate-y-1 hover:border-[#0196C1] active:scale-98 group"
            >
              <div className="w-12 h-12 bg-[#0196C1]/10 rounded-full flex items-center justify-center mb-3 text-[#0196C1] group-hover:bg-[#0196C1] group-hover:text-white transition-all duration-300">
                <Hammer className="w-6 h-6" />
              </div>
              <p className="font-bold text-xs uppercase tracking-tight text-[#282829] m-0">4. Técnico</p>
              <span className="text-[10px] text-slate-500 mt-1 leading-tight">Agenda & Reportes</span>
            </button>

            {/* 5. Cliente */}
            <button
              onClick={() => handleSelectRole('client')}
              className="bg-white rounded-[20px] py-4 px-3 flex flex-col items-center justify-center text-center shadow-[0_10px_25px_rgba(0,0,0,0.04)] border border-black/5 cursor-pointer transition-all duration-300 hover:shadow-[0_15px_35px_rgba(1,150,193,0.15)] hover:-translate-y-1 hover:border-[#0196C1] active:scale-98 group col-span-2 sm:col-span-1"
            >
              <div className="w-12 h-12 bg-[#0196C1]/10 rounded-full flex items-center justify-center mb-3 text-[#0196C1] group-hover:bg-[#0196C1] group-hover:text-white transition-all duration-300">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-xs uppercase tracking-tight text-[#282829] m-0">5. Cliente</p>
              <span className="text-[10px] text-slate-500 mt-1 leading-tight">Equipos & Historial</span>
            </button>
          </div>

          <div className="pt-6 flex flex-col items-center gap-4 border-t border-slate-200/60 max-w-sm mx-auto">
            <PWAInstallBtn />
            <button
              onClick={handleResetDemoData}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold underline cursor-pointer"
            >
              Restaurar Datos de Demostración
            </button>
          </div>
        </div>
      ) : (
        // ==================== FULLSCREEN APP WITH LEFT SIDEBAR + BOTTOM BAR ====================
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFB]">
          
          {/* MOBILE/TABLET HEADER */}
          <header className="lg:hidden bg-[#282829] text-white px-4 py-3 shadow-md flex justify-between items-center sticky top-0 z-40 border-b-3 border-[#0196C1]">
            <div className="flex items-center gap-2.5">
              <img src="https://appdesignproyectos.com/mvl.png" alt="MVL Logo" className="h-7 object-contain bg-white/5 p-1 rounded-lg" />
              <div>
                <span className="text-[11px] text-slate-300 font-bold block leading-none">
                  {activeRole === 'admin' ? '👑 1. Socios / Dirección' :
                   activeRole === 'coordinator' ? '💼 2. Ventas / Coordinador' :
                   activeRole === 'accounting' ? '📊 3. Contabilidad & SAT' :
                   activeRole === 'technician' ? '🛠️ 4. Técnico / Campo' : '🏢 5. Cliente Industrial'}
                </span>
                <span className="text-[9px] text-[#0196C1] font-bold">Panel Activo</span>
              </div>
            </div>
            <button
              onClick={() => handleSelectRole(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-[11px] font-bold rounded-lg shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cambiar Rol</span>
            </button>
          </header>

          {/* DESKTOP FULLSCREEN LEFT SIDEBAR */}
          <aside className="hidden lg:flex w-64 bg-[#282829] text-white flex-col justify-between shrink-0 sticky top-0 h-screen overflow-y-auto border-r-3 border-[#0196C1] z-40 shadow-xl">
            <div className="p-5 space-y-6">
              
              {/* Branding Header */}
              <div className="space-y-3 pb-4 border-b border-slate-700/80">
                <div className="flex items-center justify-between">
                  <img src="https://appdesignproyectos.com/mvl.png" alt="MVL Logo" className="h-9 object-contain bg-white/5 p-1 rounded-xl" />
                  <span className="text-[9px] font-black uppercase text-[#0196C1] bg-[#0196C1]/10 px-2 py-0.5 rounded border border-[#0196C1]/30">v2.5 PRO</span>
                </div>
                <div>
                  <h1 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {activeRole === 'admin' ? '👑 Socios / Dirección' :
                     activeRole === 'coordinator' ? '💼 Ventas / Coordinador' :
                     activeRole === 'accounting' ? '📊 Contabilidad & SAT' :
                     activeRole === 'technician' ? '🛠️ Técnico / Campo' : '🏢 Cliente Industrial'}
                  </h1>
                  <p className="text-[10px] text-[#0196C1] font-semibold mt-0.5">Control de Compresores</p>
                </div>
              </div>

              {/* Navigation Menu Links */}
              <nav className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-3 mb-2">Módulos del Rol</p>

                {/* ROLE 1: ADMIN */}
                {activeRole === 'admin' && (
                  <>
                    <button
                      onClick={() => setAdminTab('financial')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        adminTab === 'financial' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 shrink-0" />
                      <span>Finanzas & Métricas</span>
                    </button>
                    <button
                      onClick={() => setAdminTab('staff')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        adminTab === 'staff' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Users className="w-4 h-4 shrink-0" />
                      <span>Gestión de Personal</span>
                    </button>
                    <button
                      onClick={() => setAdminTab('clients')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        adminTab === 'clients' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>CRM Clientes & Plantas</span>
                    </button>
                    <button
                      onClick={() => setAdminTab('catalog')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        adminTab === 'catalog' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Layers className="w-4 h-4 shrink-0" />
                      <span>Marcas & Precios</span>
                    </button>
                    <button
                      onClick={() => setAdminTab('inventory')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        adminTab === 'inventory' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Package className="w-4 h-4 shrink-0" />
                      <span>Inventario & Refacciones</span>
                    </button>
                    <button
                      onClick={() => setAdminTab('purchase_orders')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        adminTab === 'purchase_orders' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Órdenes de Compra</span>
                    </button>
                    <button
                      onClick={() => setAdminTab('expense_control')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        adminTab === 'expense_control' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 shrink-0" />
                      <span>Control de Gastos</span>
                    </button>
                    <button
                      onClick={() => setAdminTab('tutorial')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        adminTab === 'tutorial' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>Guía / Manual</span>
                    </button>
                  </>
                )}

                {/* ROLE 2: COORDINATOR / VENTAS */}
                {activeRole === 'coordinator' && (
                  <>
                    <button
                      onClick={() => setCoordFilter('quotes')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        coordFilter === 'quotes' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <FileCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Cotizaciones & Ventas</span>
                    </button>
                    <button
                      onClick={() => setCoordFilter('all')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        coordFilter === 'all' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4 shrink-0" />
                      <span>Todas las OT</span>
                    </button>
                    <button
                      onClick={() => setCoordFilter('pending')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        coordFilter === 'pending' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>OT Pendientes</span>
                    </button>
                    <button
                      onClick={() => setCoordFilter('in_progress')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        coordFilter === 'in_progress' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4 shrink-0" />
                      <span>OT Activas en Campo</span>
                    </button>
                    <button
                      onClick={() => setCoordFilter('review')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        coordFilter === 'review' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>En Revisión / Firma</span>
                    </button>
                    <button
                      onClick={() => setCoordFilter('completed')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        coordFilter === 'completed' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      <span>OT Finalizadas</span>
                    </button>
                    <button
                      onClick={() => setCoordFilter('tutorial')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        coordFilter === 'tutorial' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>Guía / Manual</span>
                    </button>
                  </>
                )}

                {/* ROLE 3: ACCOUNTING */}
                {activeRole === 'accounting' && (
                  <>
                    <button
                      onClick={() => setAccountingTab('fiscal_mvl')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        accountingTab === 'fiscal_mvl' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <FileCheck className="w-4 h-4 shrink-0" />
                      <span>Expediente Fiscal MVL</span>
                    </button>
                    <button
                      onClick={() => setAccountingTab('billing')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        accountingTab === 'billing' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Facturación & Cotizaciones</span>
                    </button>
                    <button
                      onClick={() => setAccountingTab('clients_fiscal')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        accountingTab === 'clients_fiscal' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>Clientes SAT & Crédito</span>
                    </button>
                    <button
                      onClick={() => setAccountingTab('tutorial')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        accountingTab === 'tutorial' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>Guía / Manual</span>
                    </button>
                  </>
                )}

                {/* ROLE 4: TECHNICIAN */}
                {activeRole === 'technician' && (
                  <>
                    <button
                      onClick={() => setTechTab('agenda')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        techTab === 'agenda' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Mi Agenda de Trabajo</span>
                    </button>
                    <button
                      onClick={() => setTechTab('reporte')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        techTab === 'reporte' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Hammer className="w-4 h-4 shrink-0" />
                      <span>Captura de Reporte</span>
                    </button>
                    <button
                      onClick={() => setTechTab('tutorial')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        techTab === 'tutorial' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>Guía / Manual</span>
                    </button>
                  </>
                )}

                {/* ROLE 5: CLIENT */}
                {activeRole === 'client' && (
                  <>
                    <button
                      onClick={() => setClientTab('equipos')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        clientTab === 'equipos' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4 shrink-0" />
                      <span>Mis Equipos & IoT</span>
                    </button>
                    <button
                      onClick={() => setClientTab('historial')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        clientTab === 'historial' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Historial & PDF</span>
                    </button>
                    <button
                      onClick={() => setClientTab('falla')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        clientTab === 'falla' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <AlertOctagon className="w-4 h-4 shrink-0" />
                      <span>Reportar Incidencia</span>
                    </button>
                    <button
                      onClick={() => setClientTab('tutorial')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        clientTab === 'tutorial' ? 'bg-[#0196C1] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>Guía / Manual</span>
                    </button>
                  </>
                )}

              </nav>

            </div>

            {/* Bottom Actions in Sidebar */}
            <div className="p-4 border-t border-slate-700/80 space-y-3 bg-[#1e1e1f]">
              <button
                onClick={() => handleSelectRole(null)}
                className="w-full py-2.5 px-3 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cambiar de Rol</span>
              </button>
              <div className="text-[10px] text-slate-500 text-center font-medium">
                MVL Control Industrial © {new Date().getFullYear()}
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 lg:p-8 pb-20 lg:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeRole}-${adminTab}-${coordFilter}-${accountingTab}-${techTab}-${clientTab}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="w-full max-w-7xl mx-auto"
              >
                {activeRole === 'admin' && (
                  <AdminDashboard
                    staff={staff}
                    setStaff={setStaff}
                    inventory={inventory}
                    setInventory={setInventory}
                    clients={clients}
                    setClients={setClients}
                    equipment={equipment}
                    workOrders={workOrders}
                    setWorkOrders={setWorkOrders}
                    purchaseOrders={purchaseOrders}
                    setPurchaseOrders={setPurchaseOrders}
                    activeTab={adminTab}
                    setActiveTab={setAdminTab}
                  />
                )}

                {activeRole === 'coordinator' && (
                  <CoordinatorDashboard
                    workOrders={workOrders}
                    setWorkOrders={setWorkOrders}
                    staff={staff}
                    clients={clients}
                    setClients={setClients}
                    equipment={equipment}
                    inventory={inventory}
                    setInventory={setInventory}
                    onOpenReport={handleOpenReport}
                    statusFilter={coordFilter}
                    setStatusFilter={setCoordFilter}
                  />
                )}

                {activeRole === 'accounting' && (
                  <AccountingDashboard
                    clients={clients}
                    setClients={setClients}
                    workOrders={workOrders}
                    activeTab={accountingTab}
                    setActiveTab={setAccountingTab}
                  />
                )}

                {activeRole === 'technician' && (
                  <TechnicianDashboard
                    workOrders={workOrders}
                    setWorkOrders={setWorkOrders}
                    staff={staff}
                    inventory={inventory}
                    equipment={equipment}
                    clients={clients}
                    activeTab={techTab}
                    setActiveTab={setTechTab}
                  />
                )}

                {activeRole === 'client' && (
                  <ClientDashboard
                    clients={clients}
                    equipment={equipment}
                    workOrders={workOrders}
                    setWorkOrders={setWorkOrders}
                    onOpenReport={handleOpenReport}
                    activeTab={clientTab}
                    setActiveTab={setClientTab}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* MOBILE / TABLET FIXED BOTTOM NAVIGATION BAR */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#282829] border-t-3 border-[#0196C1] shadow-[0_-8px_30px_rgb(0,0,0,0.25)] z-50 flex justify-around items-center h-16 px-1 overflow-x-auto">
            
            {activeRole === 'admin' && (
              <>
                <button
                  onClick={() => setAdminTab('financial')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    adminTab === 'financial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Finanzas</span>
                </button>
                <button
                  onClick={() => setAdminTab('staff')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    adminTab === 'staff' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Personal</span>
                </button>
                <button
                  onClick={() => setAdminTab('clients')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    adminTab === 'clients' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">CRM</span>
                </button>
                <button
                  onClick={() => setAdminTab('catalog')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    adminTab === 'catalog' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Marcas</span>
                </button>
                <button
                  onClick={() => setAdminTab('inventory')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    adminTab === 'inventory' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Package className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Stock</span>
                </button>
                <button
                  onClick={() => setAdminTab('purchase_orders')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    adminTab === 'purchase_orders' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Órdenes</span>
                </button>
                <button
                  onClick={() => setAdminTab('expense_control')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    adminTab === 'expense_control' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Gastos</span>
                </button>
                <button
                  onClick={() => setAdminTab('tutorial')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    adminTab === 'tutorial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Guía</span>
                </button>
              </>
            )}

            {activeRole === 'coordinator' && (
              <>
                <button
                  onClick={() => setCoordFilter('quotes')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    coordFilter === 'quotes' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCheck className="w-5 h-5 mb-0.5 text-emerald-400" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Ventas</span>
                </button>
                <button
                  onClick={() => setCoordFilter('all')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    coordFilter === 'all' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Todo</span>
                </button>
                <button
                  onClick={() => setCoordFilter('pending')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    coordFilter === 'pending' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Pendientes</span>
                </button>
                <button
                  onClick={() => setCoordFilter('in_progress')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    coordFilter === 'in_progress' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Activas</span>
                </button>
                <button
                  onClick={() => setCoordFilter('review')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    coordFilter === 'review' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Revisión</span>
                </button>
                <button
                  onClick={() => setCoordFilter('completed')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    coordFilter === 'completed' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Check className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Cerradas</span>
                </button>
                <button
                  onClick={() => setCoordFilter('tutorial')}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    coordFilter === 'tutorial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Guía</span>
                </button>
              </>
            )}

            {activeRole === 'accounting' && (
              <>
                <button
                  onClick={() => setAccountingTab('fiscal_mvl')}
                  className={`flex flex-col items-center justify-center min-w-[60px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    accountingTab === 'fiscal_mvl' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCheck className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Fiscal</span>
                </button>
                <button
                  onClick={() => setAccountingTab('billing')}
                  className={`flex flex-col items-center justify-center min-w-[60px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    accountingTab === 'billing' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Facturas</span>
                </button>
                <button
                  onClick={() => setAccountingTab('clients_fiscal')}
                  className={`flex flex-col items-center justify-center min-w-[60px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    accountingTab === 'clients_fiscal' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Clientes SAT</span>
                </button>
                <button
                  onClick={() => setAccountingTab('tutorial')}
                  className={`flex flex-col items-center justify-center min-w-[60px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    accountingTab === 'tutorial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Guía</span>
                </button>
              </>
            )}

            {activeRole === 'technician' && (
              <>
                <button
                  onClick={() => setTechTab('agenda')}
                  className={`flex flex-col items-center justify-center min-w-[70px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    techTab === 'agenda' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold">Agenda</span>
                </button>
                <button
                  onClick={() => setTechTab('reporte')}
                  className={`flex flex-col items-center justify-center min-w-[70px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    techTab === 'reporte' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Hammer className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold">Reportar</span>
                </button>
                <button
                  onClick={() => setTechTab('tutorial')}
                  className={`flex flex-col items-center justify-center min-w-[70px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    techTab === 'tutorial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold">Guía</span>
                </button>
              </>
            )}

            {activeRole === 'client' && (
              <>
                <button
                  onClick={() => setClientTab('equipos')}
                  className={`flex flex-col items-center justify-center min-w-[60px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    clientTab === 'equipos' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Equipos</span>
                </button>
                <button
                  onClick={() => setClientTab('historial')}
                  className={`flex flex-col items-center justify-center min-w-[60px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    clientTab === 'historial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Historial</span>
                </button>
                <button
                  onClick={() => setClientTab('falla')}
                  className={`flex flex-col items-center justify-center min-w-[60px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    clientTab === 'falla' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertOctagon className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Reportar</span>
                </button>
                <button
                  onClick={() => setClientTab('tutorial')}
                  className={`flex flex-col items-center justify-center min-w-[60px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    clientTab === 'tutorial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Guía</span>
                </button>
              </>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
