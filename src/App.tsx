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
  FileText, Calendar, AlertOctagon, BookOpen
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
  useEffect(() => {
    saveToStorage('mvl_clients', clients);
  }, [clients]);

  useEffect(() => {
    saveToStorage('mvl_equipment', equipment);
  }, [equipment]);

  useEffect(() => {
    saveToStorage('mvl_inventory', inventory);
  }, [inventory]);

  useEffect(() => {
    saveToStorage('mvl_staff', staff);
  }, [staff]);

  useEffect(() => {
    saveToStorage('mvl_work_orders', workOrders);
  }, [workOrders]);

  useEffect(() => {
    saveToStorage('mvl_purchase_orders', purchaseOrders);
  }, [purchaseOrders]);

  // --- Session State ---
  const [activeRole, setActiveRole] = useState<UserRole | null>(() =>
    loadFromStorage<UserRole | null>('mvl_active_role', null)
  );

  // --- Sub-module Tab/Filter States ---
  const [adminTab, setAdminTab] = useState<'financial' | 'staff' | 'clients' | 'catalog' | 'inventory' | 'purchase_orders' | 'expense_control' | 'tutorial'>(() =>
    loadFromStorage<'financial' | 'staff' | 'clients' | 'catalog' | 'inventory' | 'purchase_orders' | 'expense_control' | 'tutorial'>('mvl_admin_tab', 'financial')
  );
  const [coordFilter, setCoordFilter] = useState<'all' | 'pending' | 'in_progress' | 'review' | 'completed' | 'tutorial'>(() =>
    loadFromStorage<'all' | 'pending' | 'in_progress' | 'review' | 'completed' | 'tutorial'>('mvl_coord_filter', 'all')
  );
  const [techTab, setTechTab] = useState<'agenda' | 'reporte' | 'tutorial'>(() =>
    loadFromStorage<'agenda' | 'reporte' | 'tutorial'>('mvl_tech_tab', 'agenda')
  );
  const [clientTab, setClientTab] = useState<'equipos' | 'historial' | 'falla' | 'tutorial'>(() =>
    loadFromStorage<'equipos' | 'historial' | 'falla' | 'tutorial'>('mvl_client_tab', 'equipos')
  );

  // Sync session and tab/filter states to storage
  useEffect(() => {
    saveToStorage('mvl_active_role', activeRole);
  }, [activeRole]);

  useEffect(() => {
    saveToStorage('mvl_admin_tab', adminTab);
  }, [adminTab]);

  useEffect(() => {
    saveToStorage('mvl_coord_filter', coordFilter);
  }, [coordFilter]);

  useEffect(() => {
    saveToStorage('mvl_tech_tab', techTab);
  }, [techTab]);

  useEffect(() => {
    saveToStorage('mvl_client_tab', clientTab);
  }, [clientTab]);

  // Unified role selector resetting tabs on logout
  const handleSelectRole = (role: UserRole | null) => {
    setActiveRole(role);
    if (role === null) {
      setAdminTab('financial');
      setCoordFilter('all');
      setTechTab('agenda');
      setClientTab('equipos');
    }
  };

  // --- PDF Viewer Overlay State ---
  const [selectedPdfOt, setSelectedPdfOt] = useState<WorkOrder | null>(null);

  // Close report helper
  const handleCloseReport = () => {
    setSelectedPdfOt(null);
  };

  // Open report helper
  const handleOpenReport = (ot: WorkOrder) => {
    setSelectedPdfOt(ot);
  };

  // Reset demo databases trigger (highly useful for reviewers)
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
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col font-sans text-[#282829] selection:bg-[#0196C1]/20 selection:text-[#0196C1] pb-16 lg:pb-0">
      
      {/* Dynamic PDF Report overlay rendering */}
      {selectedPdfOt && (
        <PDFReportView
          workOrder={selectedPdfOt}
          client={clients.find(c => c.id === selectedPdfOt.clientId) || clients[0]}
          equipment={equipment.find(e => e.id === selectedPdfOt.equipmentId) || equipment[0]}
          onClose={handleCloseReport}
        />
      )}

      {/* --- MASTER HEADER (Visible only when inside a dashboard role) --- */}
      <AnimatePresence>
        {activeRole && (
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#282829] text-white px-6 py-4 shadow-md flex justify-between items-center sticky top-0 z-40 border-b-3 border-[#0196C1]"
          >
            <div className="flex items-center gap-3">
              <img src="https://appdesignproyectos.com/mvl.png" alt="MVL Logo" className="h-8 object-contain bg-white/5 p-1 rounded-lg" />
              <div className="hidden sm:block border-l border-slate-600/50 pl-3">
                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
                  {activeRole === 'admin' ? 'Socio Administrador' :
                   activeRole === 'coordinator' ? 'Coordinador de Operaciones' :
                   activeRole === 'technician' ? 'Técnico Móvil' : 'Portal del Cliente'}
                </span>
                <span className="text-[10px] text-[#0196C1] font-bold">Panel de Control Activo</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectRole(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Cambiar Rol</span>
              </button>
              <button
                onClick={() => handleSelectRole(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* --- CORE ROUTING CONTAINER --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!activeRole ? (
            // ==================== HOME SCREEN ====================
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="max-w-2xl w-full mx-auto text-center space-y-8 py-8"
            >
              {/* Prominent MVL Logo as requested */}
              <div className="flex justify-center">
                <img 
                  src="https://appdesignproyectos.com/mvl.png" 
                  alt="MVL Logo" 
                  className="h-28 md:h-36 object-contain"
                />
              </div>

              {/* Sub-heading banner */}
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-extrabold text-[#282829] tracking-tight">
                  MVL Control y Mantenimiento
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Seleccione su perfil de acceso a la plataforma industrial.
                </p>
              </div>

              {/* Roles selectors with icons and labels - exactly as requested */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-4xl mx-auto px-2 sm:px-4">
                
                {/* 1. Administrador */}
                <button
                  id="role-btn-admin"
                  onClick={() => handleSelectRole('admin')}
                  className="bg-white rounded-[20px] py-4 px-3 sm:py-8 sm:px-5 flex flex-col items-center justify-center text-center shadow-[0_10px_25px_rgba(0,0,0,0.04)] border border-black/5 cursor-pointer transition-all duration-300 hover:shadow-[0_15px_35px_rgba(1,150,193,0.15)] hover:-translate-y-1 hover:border-[#0196C1] active:scale-98 group"
                >
                  <div className="w-12 h-12 sm:w-[70px] sm:h-[70px] bg-[#0196C1]/10 rounded-full flex items-center justify-center mb-3 sm:mb-5 text-[#0196C1] group-hover:bg-[#0196C1] group-hover:text-white transition-all duration-300">
                    <UserCog className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-[0.5px] text-[#282829] m-0">Administrador</p>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1 sm:mt-2 leading-relaxed">Control total y reportes financieros.</span>
                </button>

                {/* 2. Coordinador */}
                <button
                  id="role-btn-coordinator"
                  onClick={() => handleSelectRole('coordinator')}
                  className="bg-white rounded-[20px] py-4 px-3 sm:py-8 sm:px-5 flex flex-col items-center justify-center text-center shadow-[0_10px_25px_rgba(0,0,0,0.04)] border border-black/5 cursor-pointer transition-all duration-300 hover:shadow-[0_15px_35px_rgba(1,150,193,0.15)] hover:-translate-y-1 hover:border-[#0196C1] active:scale-98 group"
                >
                  <div className="w-12 h-12 sm:w-[70px] sm:h-[70px] bg-[#0196C1]/10 rounded-full flex items-center justify-center mb-3 sm:mb-5 text-[#0196C1] group-hover:bg-[#0196C1] group-hover:text-white transition-all duration-300">
                    <CalendarCheck2 className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-[0.5px] text-[#282829] m-0">Coordinador</p>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1 sm:mt-2 leading-relaxed">Gestión de agenda y supervisión.</span>
                </button>

                {/* 3. Técnico */}
                <button
                  id="role-btn-technician"
                  onClick={() => handleSelectRole('technician')}
                  className="bg-white rounded-[20px] py-4 px-3 sm:py-8 sm:px-5 flex flex-col items-center justify-center text-center shadow-[0_10px_25px_rgba(0,0,0,0.04)] border border-black/5 cursor-pointer transition-all duration-300 hover:shadow-[0_15px_35px_rgba(1,150,193,0.15)] hover:-translate-y-1 hover:border-[#0196C1] active:scale-98 group"
                >
                  <div className="w-12 h-12 sm:w-[70px] sm:h-[70px] bg-[#0196C1]/10 rounded-full flex items-center justify-center mb-3 sm:mb-5 text-[#0196C1] group-hover:bg-[#0196C1] group-hover:text-white transition-all duration-300">
                    <Hammer className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-[0.5px] text-[#282829] m-0">Técnico</p>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1 sm:mt-2 leading-relaxed">Ejecución y reportes de campo.</span>
                </button>

                {/* 4. Cliente */}
                <button
                  id="role-btn-client"
                  onClick={() => handleSelectRole('client')}
                  className="bg-white rounded-[20px] py-4 px-3 sm:py-8 sm:px-5 flex flex-col items-center justify-center text-center shadow-[0_10px_25px_rgba(0,0,0,0.04)] border border-black/5 cursor-pointer transition-all duration-300 hover:shadow-[0_15px_35px_rgba(1,150,193,0.15)] hover:-translate-y-1 hover:border-[#0196C1] active:scale-98 group"
                >
                  <div className="w-12 h-12 sm:w-[70px] sm:h-[70px] bg-[#0196C1]/10 rounded-full flex items-center justify-center mb-3 sm:mb-5 text-[#0196C1] group-hover:bg-[#0196C1] group-hover:text-white transition-all duration-300">
                    <Building2 className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-[0.5px] text-[#282829] m-0">Cliente</p>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1 sm:mt-2 leading-relaxed">Historial de activos y solicitudes.</span>
                </button>

              </div>

              {/* Install PWA Button as requested */}
              <div className="pt-6 flex flex-col items-center gap-4 border-t border-slate-200/60 max-w-sm mx-auto">
                <PWAInstallBtn />
                
                {/* Reset Database Trigger */}
                <button
                  onClick={handleResetDemoData}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold underline cursor-pointer"
                >
                  Restaurar Datos de Demostración
                </button>
              </div>

            </motion.div>
          ) : (
            // ==================== DASHBOARDS CONTAINER ====================
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full"
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
                  equipment={equipment}
                  inventory={inventory}
                  setInventory={setInventory}
                  onOpenReport={handleOpenReport}
                  statusFilter={coordFilter}
                  setStatusFilter={setCoordFilter}
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
          )}
        </AnimatePresence>
      </main>

      {/* --- Footer --- */}
      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200 bg-white/40 mb-16 lg:mb-0">
        MVL Control y mantenimiento • Compresores Industriales • © {new Date().getFullYear()}
      </footer>

      {/* --- MOBILE/TABLET BOTTOM NAVIGATION BAR --- */}
      {activeRole && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#282829] border-t-3 border-[#0196C1] shadow-[0_-8px_30px_rgb(0,0,0,0.25)] z-50 flex justify-around items-center h-16 px-1">
          
          {activeRole === 'admin' && (
            <>
              <button
                onClick={() => setAdminTab('financial')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  adminTab === 'financial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Finanzas</span>
              </button>
              <button
                onClick={() => setAdminTab('staff')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  adminTab === 'staff' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Personal</span>
              </button>
              <button
                onClick={() => setAdminTab('clients')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  adminTab === 'clients' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">CRM Clientes</span>
              </button>
              <button
                onClick={() => setAdminTab('catalog')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  adminTab === 'catalog' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Marcas</span>
              </button>
              <button
                onClick={() => setAdminTab('inventory')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  adminTab === 'inventory' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Inventario</span>
              </button>
              <button
                onClick={() => setAdminTab('purchase_orders')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  adminTab === 'purchase_orders' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Órdenes</span>
              </button>
              <button
                onClick={() => setAdminTab('expense_control')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  adminTab === 'expense_control' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Gastos</span>
              </button>
              <button
                onClick={() => setAdminTab('tutorial')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  adminTab === 'tutorial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Guía</span>
              </button>
            </>
          )}

          {activeRole === 'coordinator' && (
            <>
              <button
                onClick={() => setCoordFilter('all')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  coordFilter === 'all' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Todo</span>
              </button>
              <button
                onClick={() => setCoordFilter('pending')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  coordFilter === 'pending' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Pendientes</span>
              </button>
              <button
                onClick={() => setCoordFilter('in_progress')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  coordFilter === 'in_progress' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <RefreshCw className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Activas</span>
              </button>
              <button
                onClick={() => setCoordFilter('review')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  coordFilter === 'review' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlertCircle className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Revisión</span>
              </button>
              <button
                onClick={() => setCoordFilter('completed')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  coordFilter === 'completed' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Check className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Cerradas</span>
              </button>
              <button
                onClick={() => setCoordFilter('tutorial')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  coordFilter === 'tutorial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Guía</span>
              </button>
            </>
          )}

          {activeRole === 'technician' && (
            <>
              <button
                onClick={() => setTechTab('agenda')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  techTab === 'agenda' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Agenda</span>
              </button>
              <button
                onClick={() => setTechTab('reporte')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  techTab === 'reporte' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Hammer className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Reportar</span>
              </button>
              <button
                onClick={() => setTechTab('tutorial')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
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
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  clientTab === 'equipos' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Equipos</span>
              </button>
              <button
                onClick={() => setClientTab('historial')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  clientTab === 'historial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Historial</span>
              </button>
              <button
                onClick={() => setClientTab('falla')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  clientTab === 'falla' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlertOctagon className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Reportar</span>
              </button>
              <button
                onClick={() => setClientTab('tutorial')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  clientTab === 'tutorial' ? 'text-[#0196C1] font-bold scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Guía</span>
              </button>
            </>
          )}

        </div>
      )}

    </div>
  );
}
