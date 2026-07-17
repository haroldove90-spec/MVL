/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkOrder, Staff, Client, Equipment, InventoryItem } from '../types';
import { 
  Calendar, Plus, Clock, FileCheck, CheckCircle2, 
  MapPin, UserCheck, AlertCircle, FileEdit, Eye, Check 
} from 'lucide-react';

interface CoordinatorDashboardProps {
  workOrders: WorkOrder[];
  setWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  staff: Staff[];
  clients: Client[];
  equipment: Equipment[];
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  onOpenReport: (ot: WorkOrder) => void;
  statusFilter?: 'all' | 'pending' | 'in_progress' | 'review' | 'completed';
  setStatusFilter?: (val: 'all' | 'pending' | 'in_progress' | 'review' | 'completed') => void;
}

export default function CoordinatorDashboard({
  workOrders,
  setWorkOrders,
  staff,
  clients,
  equipment,
  inventory,
  setInventory,
  onOpenReport,
  statusFilter: propStatusFilter,
  setStatusFilter: propSetStatusFilter
}: CoordinatorDashboardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create form states
  const [otType, setOtType] = useState<'preventive' | 'corrective'>('preventive');
  const [selectedEqId, setSelectedEqId] = useState(equipment[0]?.id || '');
  const [selectedTechId, setSelectedTechId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [observations, setObservations] = useState('');

  // Active filter with parent-control fallback
  const [localStatusFilter, setLocalStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'review' | 'completed'>('all');
  const statusFilter = propStatusFilter !== undefined ? propStatusFilter : localStatusFilter;
  const setStatusFilter = propSetStatusFilter !== undefined ? propSetStatusFilter : setLocalStatusFilter;

  // Filtered orders
  const filteredOrders = workOrders.filter(o => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  // Handle Create Work Order
  const handleCreateOT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEqId) return;

    const selectedEq = equipment.find(eq => eq.id === selectedEqId);
    const selectedTech = staff.find(s => s.id === selectedTechId);
    if (!selectedEq) return;

    const newCode = `OT-${1000 + workOrders.length + 1}`;
    
    // Auto-generate checklists based on type
    const baseChecklist = otType === 'preventive' 
      ? [
          { id: 'c1', task: 'Revisión de niveles de refrigerante y aceite', checked: false },
          { id: 'c2', task: 'Inspección de válvulas y tuberías', checked: false },
          { id: 'c3', task: 'Lectura de controladores de presión', checked: false },
          { id: 'c4', task: 'Limpieza exterior del intercambiador', checked: false }
        ]
      : [
          { id: 'c1', task: 'Diagnóstico de falla reportada por cliente', checked: false },
          { id: 'c2', task: 'Pruebas de componentes eléctricos de control', checked: false },
          { id: 'c3', task: 'Sustitución de refacción averiada', checked: false }
        ];

    const newOT: WorkOrder = {
      id: `ot${Date.now()}`,
      code: newCode,
      equipmentId: selectedEqId,
      clientId: selectedEq.clientId,
      plantId: selectedEq.plantId,
      type: otType,
      status: 'pending',
      scheduledDate,
      engineHours: selectedEq.engineHours,
      assignedTechnicianId: selectedTechId || 's2', // Default to Roberto Sánchez
      assignedTechnicianName: selectedTech?.name || 'Técnico Externo',
      checklist: baseChecklist,
      observations: observations,
      partsUsed: []
    };

    setWorkOrders(prev => [newOT, ...prev]);
    setShowCreateModal(false);
    setObservations('');
  };

  // Approve Technical Report (and discount stock!)
  const handleApproveReport = (otId: string) => {
    const ot = workOrders.find(o => o.id === otId);
    if (!ot) return;

    // Deduct stock from global inventory based on pieces used
    setInventory(prev => prev.map(inv => {
      const usedPart = ot.partsUsed.find(p => p.itemId === inv.id);
      if (usedPart) {
        return {
          ...inv,
          stock: Math.max(0, inv.stock - usedPart.quantity)
        };
      }
      return inv;
    }));

    // Update OT state to completed & approved
    setWorkOrders(prev => prev.map(o => {
      if (o.id === otId) {
        return {
          ...o,
          status: 'completed',
          approvedByCoordinator: true
        };
      }
      return o;
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Top statistics overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`bg-white p-4 rounded-xl border border-slate-100 shadow-xs cursor-pointer hover:border-[#0196C1] transition-all ${statusFilter === 'pending' ? 'ring-2 ring-[#0196C1]/20 border-[#0196C1]' : ''}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">Asignadas</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {workOrders.filter(o => o.status === 'pending').length}
          </p>
        </div>

        <div 
          onClick={() => setStatusFilter('in_progress')}
          className={`bg-white p-4 rounded-xl border border-slate-100 shadow-xs cursor-pointer hover:border-[#0196C1] transition-all ${statusFilter === 'in_progress' ? 'ring-2 ring-[#0196C1]/20 border-[#0196C1]' : ''}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">En Campo</span>
            <MapPin className="w-4 h-4 text-sky-500 animate-bounce" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {workOrders.filter(o => o.status === 'in_progress').length}
          </p>
        </div>

        <div 
          onClick={() => setStatusFilter('review')}
          className={`bg-white p-4 rounded-xl border border-slate-100 shadow-xs cursor-pointer hover:border-[#0196C1] transition-all ${statusFilter === 'review' ? 'ring-2 ring-[#0196C1]/20 border-[#0196C1]' : ''}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">Por Aprobar</span>
            <FileCheck className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {workOrders.filter(o => o.status === 'review').length}
          </p>
        </div>

        <div 
          onClick={() => setStatusFilter('completed')}
          className={`bg-white p-4 rounded-xl border border-slate-100 shadow-xs cursor-pointer hover:border-[#0196C1] transition-all ${statusFilter === 'completed' ? 'ring-2 ring-[#0196C1]/20 border-[#0196C1]' : ''}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">Finalizadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {workOrders.filter(o => o.status === 'completed').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* --- Left / Mid Columns: Work Orders and Scheduling --- */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800">Programa de Órdenes de Trabajo</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva OT
            </button>
          </div>

          {/* Quick status tabs to filter the list */}
          <div className="hidden lg:flex gap-2 text-xs">
            <button 
              onClick={() => setStatusFilter('all')} 
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${statusFilter === 'all' ? 'bg-[#0196C1]/10 text-[#0196C1]' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
            >
              Ver Todo ({workOrders.length})
            </button>
            <button 
              onClick={() => setStatusFilter('pending')} 
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${statusFilter === 'pending' ? 'bg-[#0196C1]/10 text-[#0196C1]' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
            >
              Pendientes
            </button>
            <button 
              onClick={() => setStatusFilter('review')} 
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${statusFilter === 'review' ? 'bg-[#0196C1]/10 text-[#0196C1]' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
            >
              En Revisión
            </button>
          </div>

          {/* List of Work Orders */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-slate-100 text-slate-400 text-xs italic">
                Ninguna orden de servicio bajo esta selección.
              </div>
            ) : (
              filteredOrders.map((ot) => {
                const eq = equipment.find(e => e.id === ot.equipmentId);
                const cl = clients.find(c => c.id === ot.clientId);
                return (
                  <div key={ot.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">{ot.code}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                            ot.type === 'preventive' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {ot.type === 'preventive' ? 'Preventivo' : 'Correctivo'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold">{cl?.name} • {eq?.brand} {eq?.model}</p>
                      </div>

                      {/* Status pill */}
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase ${
                        ot.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                        ot.status === 'in_progress' ? 'bg-sky-50 text-sky-600 animate-pulse' :
                        ot.status === 'review' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {ot.status === 'pending' ? 'Pendiente' :
                         ot.status === 'in_progress' ? 'En Sitio' :
                         ot.status === 'review' ? 'Por Revisar' : 'Aprobada'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-50 text-xs">
                      <div className="text-slate-500 space-y-0.5">
                        <p>Fecha: <span className="font-semibold text-slate-700">{ot.scheduledDate}</span></p>
                        <p>Asignado: <span className="font-semibold text-slate-700">{ot.assignedTechnicianName}</span></p>
                      </div>

                      <div className="flex gap-1.5">
                        {ot.status === 'review' && (
                          <button
                            onClick={() => handleApproveReport(ot.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Aprobar Reporte
                          </button>
                        )}
                        {(ot.status === 'review' || ot.status === 'completed') && (
                          <button
                            onClick={() => onOpenReport(ot)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> Reporte Técnico
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- Right Column: Real-time Field Monitors --- */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#0196C1]" />
            Estatus de Técnicos en Campo
          </h3>
          
          <div className="space-y-3">
            {staff.filter(s => s.role === 'technician').map((tech) => {
              // Find if they have an active work order
              const activeOrder = workOrders.find(o => o.assignedTechnicianId === tech.id && o.status === 'in_progress');
              const isBusy = !!activeOrder;

              return (
                <div key={tech.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{tech.name}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${isBusy ? 'bg-sky-500 animate-ping' : 'bg-emerald-500'}`} />
                  </div>

                  <div className="text-[11px] text-slate-500">
                    {isBusy ? (
                      <div className="space-y-1">
                        <p className="text-sky-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Trabajando en {activeOrder.code}
                        </p>
                        <p className="text-[10px]">Sitio: Planta del cliente</p>
                      </div>
                    ) : (
                      <p className="text-emerald-700 font-semibold">Disponible para servicio</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- Create work order Modal --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold text-slate-900">Programar Servicio (OT)</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateOT} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Orden de Trabajo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtType('preventive')}
                    className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${otType === 'preventive' ? 'bg-sky-50 border-[#0196C1] text-[#0196C1]' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                  >
                    Preventiva
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtType('corrective')}
                    className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${otType === 'corrective' ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                  >
                    Correctiva (Falla)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Seleccionar Máquina del Cliente</label>
                <select
                  value={selectedEqId}
                  onChange={(e) => setSelectedEqId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  {equipment.map(eq => {
                    const cl = clients.find(c => c.id === eq.clientId);
                    return (
                      <option key={eq.id} value={eq.id}>
                        [{cl?.name.substring(0, 15)}] {eq.brand} {eq.model} (S/N: {eq.serialNumber})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Asignar Técnico Responsable</label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">Seleccione un técnico...</option>
                  {staff.filter(s => s.role === 'technician' && s.active).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Programada</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Instrucciones / Notas Técnicas</label>
                <textarea
                  placeholder="ej. Revisar ruidos extraños en válvula solenoide..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                Generar y Asignar Orden
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
