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
  FileText, Calendar, AlertOctagon, BookOpen, FileCheck, ShieldCheck, ChevronRight, Wrench,
  Compass, UserCheck
} from 'lucide-react';

// Data models & Storage helpers
import { Client, Equipment, InventoryItem, Staff, WorkOrder, UserRole, PurchaseOrder, UserAccount } from './types';
import { 
  INITIAL_CLIENTS, INITIAL_EQUIPMENT, INITIAL_INVENTORY, 
  INITIAL_STAFF, INITIAL_WORK_ORDERS, INITIAL_PURCHASE_ORDERS, 
  loadFromStorage, saveToStorage, purgeDemoDataAndCleanSystem, isCleanProductionMode 
} from './mockData';
import { 
  fetchClientsFromSupabase, 
  fetchEquipmentFromSupabase, 
  fetchStaffFromSupabase,
  subscribeToAllChanges
} from './lib/dataSyncService';

// Dashboard Components
import AdminDashboard from './components/AdminDashboard';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import ClientDashboard from './components/ClientDashboard';
import AccountingDashboard from './components/AccountingDashboard';
import PDFReportView from './components/PDFReportView';
import PWAInstallBtn from './components/PWAInstallBtn';
import LoginScreen from './components/LoginScreen';

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

  // --- Authenticated User Session ---
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    loadFromStorage<UserAccount | null>('mvl_current_user', null)
  );

  const [activeRole, setActiveRole] = useState<UserRole | null>(() => {
    const savedUser = loadFromStorage<UserAccount | null>('mvl_current_user', null);
    if (savedUser?.role) return savedUser.role;
    return loadFromStorage<UserRole | null>('mvl_active_role', null);
  });

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setActiveRole(user.role);
    saveToStorage('mvl_current_user', user);
    saveToStorage('mvl_active_role', user.role);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveRole(null);
    localStorage.removeItem('mvl_current_user');
    localStorage.removeItem('mvl_active_role');
  };

  // --- Sub-module Tab/Filter States ---
  const [adminTab, setAdminTab] = useState<'financial' | 'staff' | 'clients' | 'catalog' | 'inventory' | 'purchase_orders' | 'expense_control' | 'tutorial'>(() => {
    const saved = loadFromStorage<string>('mvl_admin_tab', 'financial');
    if (saved === 'customer_kits') return 'financial';
    return (saved as any) || 'financial';
  });
  const [coordFilter, setCoordFilter] = useState<'quotes' | 'customer_kits' | 'catalog' | 'all' | 'pending' | 'in_progress' | 'review' | 'completed' | 'tutorial'>(() =>
    loadFromStorage<'quotes' | 'customer_kits' | 'catalog' | 'all' | 'pending' | 'in_progress' | 'review' | 'completed' | 'tutorial'>('mvl_coord_filter', 'quotes')
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

  // Initial cloud sync with Supabase for centralized cross-device consistency
  useEffect(() => {
    let isMounted = true;

    async function loadCloudData() {
      try {
        const [cloudClients, cloudEquipment, cloudStaff] = await Promise.all([
          fetchClientsFromSupabase(),
          fetchEquipmentFromSupabase(),
          fetchStaffFromSupabase()
        ]);

        if (isMounted) {
          if (cloudClients && cloudClients.length > 0) {
            setClients(cloudClients);
          }
          if (cloudEquipment && cloudEquipment.length > 0) {
            setEquipment(cloudEquipment);
          }
          if (cloudStaff && cloudStaff.length > 0) {
            setStaff(cloudStaff);
          }
        }
      } catch (e) {
        console.warn('Initial cloud sync notice:', e);
      }
    }

    loadCloudData();

    // Subscribe to live changes across workstations
    const unsubscribe = subscribeToAllChanges((entity, payload) => {
      if (!isMounted) return;
      if (entity === 'clients') {
        fetchClientsFromSupabase().then(res => res && setClients(res));
      } else if (entity === 'equipment') {
        fetchEquipmentFromSupabase().then(res => res && setEquipment(res));
      } else if (entity === 'staff') {
        fetchStaffFromSupabase().then(res => res && setStaff(res));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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

      {!currentUser ? (
        // ==================== REAL AUTHENTICATION / LOGIN SCREEN ====================
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        // ==================== FULLSCREEN APP WITH LEFT SIDEBAR + BOTTOM BAR ====================
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFB]">
          
          {/* MOBILE/TABLET HEADER */}
          <header className="lg:hidden bg-[#282829] text-white px-4 py-3 shadow-md flex justify-between items-center sticky top-0 z-40 border-b-3 border-[#0196C1]">
            <div className="flex items-center gap-2.5">
              <img src="https://appdesignproyectos.com/mvl.png" alt="MVL Logo" className="h-7 object-contain bg-white/5 p-1 rounded-lg" />
              <div>
                {currentUser?.role === 'admin' ? (
                  <select
                    value={activeRole || 'admin'}
                    onChange={(e) => handleSelectRole(e.target.value as UserRole)}
                    className="text-[11px] text-amber-300 font-bold bg-[#1e1e1f] border border-amber-400/50 rounded px-1.5 py-0.5 leading-none focus:outline-hidden"
                  >
                    <option value="admin">👑 Socios / Admin</option>
                    <option value="coordinator">💼 Coordinador</option>
                    <option value="accounting">📊 Contabilidad</option>
                    <option value="technician">🛠️ Técnico</option>
                    <option value="client">🏢 Cliente</option>
                  </select>
                ) : (
                  <span className="text-[11px] text-slate-300 font-bold block leading-none">
                    {activeRole === 'admin' ? '👑 1. Socios / Dirección' :
                     activeRole === 'coordinator' ? '💼 2. Ventas / Coordinador' :
                     activeRole === 'accounting' ? '📊 3. Contabilidad & SAT' :
                     activeRole === 'technician' ? '🛠️ 4. Técnico / Campo' : '🏢 5. Cliente Industrial'}
                  </span>
                )}
                <span className="text-[9px] text-[#0196C1] font-bold block mt-0.5">Panel Activo</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#0196C1] font-mono font-bold bg-[#0196C1]/10 px-2 py-1 rounded">
                @{currentUser?.username || 'admin'}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold rounded-lg shadow-sm cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
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

                {/* ADMIN ONLY ROLE SELECTOR / SWITCHER IN SIDEBAR */}
                {currentUser?.role === 'admin' && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <label className="text-[9px] font-black uppercase tracking-wider text-amber-400 block mb-1.5 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-amber-400" />
                      <span>Navegar Roles (Admin)</span>
                    </label>
                    <select
                      value={activeRole || 'admin'}
                      onChange={(e) => handleSelectRole(e.target.value as UserRole)}
                      className="w-full bg-[#1e1e1f] border border-amber-400/40 text-amber-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-amber-400 transition-all cursor-pointer shadow-inner"
                    >
                      <option value="admin">👑 1. Socios / Dirección</option>
                      <option value="coordinator">💼 2. Ventas / Coordinador</option>
                      <option value="accounting">📊 3. Contabilidad & SAT</option>
                      <option value="technician">🛠️ 4. Técnico / Campo</option>
                      <option value="client">🏢 5. Cliente Industrial</option>
                    </select>
                  </div>
                )}
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
                      onClick={() => setCoordFilter('customer_kits')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        coordFilter === 'customer_kits' ? 'bg-[#00A2E8] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Wrench className="w-4 h-4 shrink-0 text-sky-400" />
                      <span>Kit de Clientes</span>
                    </button>
                    <button
                      onClick={() => setCoordFilter('catalog')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        coordFilter === 'catalog' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Package className="w-4 h-4 shrink-0 text-indigo-400" />
                      <span>Catálogo de Ventas</span>
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
              {/* User Identity Card */}
              <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0196C1]/20 border border-[#0196C1]/40 flex items-center justify-center font-black text-[#0196C1] text-xs uppercase shrink-0">
                  {currentUser?.name ? currentUser.name.substring(0, 2) : 'US'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white truncate">{currentUser?.name || 'Usuario'}</p>
                  <p className="text-[9px] text-[#0196C1] font-mono truncate">@{currentUser?.username || 'usuario'}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
              <div className="text-[10px] text-slate-500 text-center font-medium">
                MVL Control Industrial © {new Date().getFullYear()}
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 lg:p-8 pb-20 lg:pb-8">
            
            {/* RETURN TO ADMIN BANNER - Visible only when currentUser is Admin and viewing another role */}
            {currentUser?.role === 'admin' && activeRole !== 'admin' && (
              <div className="mb-5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-amber-400/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                    <Compass className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
                        Modo Navegación de Administrador
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/25 text-amber-100 font-bold">
                        Viendo como: {
                          activeRole === 'coordinator' ? '💼 Ventas / Coordinador' :
                          activeRole === 'accounting' ? '📊 Contabilidad & SAT' :
                          activeRole === 'technician' ? '🛠️ Técnico / Campo' : '🏢 Cliente Industrial'
                        }
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-100 mt-0.5">
                      Estás explorando y operando este rol con tus privilegios de Administrador Maestro.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectRole('admin')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-98 shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                  <span>Regresar a Dashboard Admin</span>
                </button>
              </div>
            )}

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
                    setEquipment={setEquipment}
                    workOrders={workOrders}
                    setWorkOrders={setWorkOrders}
                    purchaseOrders={purchaseOrders}
                    setPurchaseOrders={setPurchaseOrders}
                    activeTab={adminTab}
                    setActiveTab={setAdminTab}
                    currentUser={currentUser}
                    onSwitchRole={handleSelectRole}
                    onCleanDemoData={() => {
                      setClients([]);
                      setEquipment([]);
                      setInventory([]);
                      setWorkOrders([]);
                      setPurchaseOrders([]);
                    }}
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
                    setEquipment={setEquipment}
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
                  className={`flex flex-col items-center justify-center min-w-[48px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    coordFilter === 'quotes' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCheck className="w-5 h-5 mb-0.5 text-emerald-400" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Ventas</span>
                </button>
                <button
                  onClick={() => setCoordFilter('customer_kits')}
                  className={`flex flex-col items-center justify-center min-w-[48px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    coordFilter === 'customer_kits' ? 'text-[#00A2E8] font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Wrench className="w-5 h-5 mb-0.5 text-sky-400" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Kits</span>
                </button>
                <button
                  onClick={() => setCoordFilter('catalog')}
                  className={`flex flex-col items-center justify-center min-w-[48px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                    coordFilter === 'catalog' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Package className="w-5 h-5 mb-0.5 text-indigo-400" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Catálogo</span>
                </button>
                <button
                  onClick={() => setCoordFilter('all')}
                  className={`flex flex-col items-center justify-center min-w-[48px] flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
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
