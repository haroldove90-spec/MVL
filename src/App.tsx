/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCog, CalendarCheck2, Hammer, Building2, 
  ArrowLeft, LogOut, Check, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';

// Data models & Storage helpers
import { Client, Equipment, InventoryItem, Staff, WorkOrder, UserRole } from './types';
import { 
  INITIAL_CLIENTS, INITIAL_EQUIPMENT, INITIAL_INVENTORY, 
  INITIAL_STAFF, INITIAL_WORK_ORDERS, loadFromStorage, saveToStorage 
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

  // --- Session State ---
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

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
      setActiveRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-[#0196C1]/20 selection:text-[#0196C1]">
      
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
            className="bg-[#282829] text-white px-6 py-4 shadow-md flex justify-between items-center sticky top-0 z-40"
          >
            <div className="flex items-center gap-3">
              <img src="https://appdesignproyectos.com/mvl.png" alt="MVL Logo" className="h-8 object-contain bg-white/5 p-1 rounded-lg" />
              <div className="hidden sm:block border-l border-slate-600 pl-3">
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
                onClick={() => setActiveRole(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Cambiar Rol</span>
              </button>
              <button
                onClick={() => setActiveRole(null)}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* 1. Administrador */}
                <button
                  id="role-btn-admin"
                  onClick={() => setActiveRole('admin')}
                  className="bg-white hover:border-[#0196C1] hover:shadow-md border border-slate-200/80 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 group text-center"
                >
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                    <UserCog className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 block">Administrador</span>
                </button>

                {/* 2. Coordinador */}
                <button
                  id="role-btn-coordinator"
                  onClick={() => setActiveRole('coordinator')}
                  className="bg-white hover:border-[#0196C1] hover:shadow-md border border-slate-200/80 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 group text-center"
                >
                  <div className="w-12 h-12 bg-[#0196C1]/10 text-[#0196C1] rounded-xl flex items-center justify-center group-hover:bg-[#0196C1] group-hover:text-white transition-all">
                    <CalendarCheck2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 block">Coordinador</span>
                </button>

                {/* 3. Técnico */}
                <button
                  id="role-btn-technician"
                  onClick={() => setActiveRole('technician')}
                  className="bg-white hover:border-[#0196C1] hover:shadow-md border border-slate-200/80 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 group text-center"
                >
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Hammer className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 block">Técnico Móvil</span>
                </button>

                {/* 4. Cliente */}
                <button
                  id="role-btn-client"
                  onClick={() => setActiveRole('client')}
                  className="bg-white hover:border-[#0196C1] hover:shadow-md border border-slate-200/80 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 group text-center"
                >
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 block">Cliente (Portal)</span>
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
                  equipment={equipment}
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
                />
              )}

              {activeRole === 'client' && (
                <ClientDashboard
                  clients={clients}
                  equipment={equipment}
                  workOrders={workOrders}
                  setWorkOrders={setWorkOrders}
                  onOpenReport={handleOpenReport}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- Footer --- */}
      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200 bg-white/40">
        MVL Control y mantenimiento • Compresores Industriales • © {new Date().getFullYear()}
      </footer>

    </div>
  );
}
