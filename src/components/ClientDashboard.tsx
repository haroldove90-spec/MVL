/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, Equipment, WorkOrder, HistoryItem } from '../types';
import { 
  Building, LayoutGrid, FileText, AlertOctagon, Plus, CheckCircle, 
  HelpCircle, Sparkles, Wrench, RefreshCw, Calendar, Download, X, Activity
} from 'lucide-react';

interface ClientDashboardProps {
  clients: Client[];
  equipment: Equipment[];
  workOrders: WorkOrder[];
  setWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  onOpenReport: (ot: WorkOrder) => void;
  activeTab?: 'equipos' | 'historial' | 'falla';
  setActiveTab?: (val: 'equipos' | 'historial' | 'falla') => void;
}

export default function ClientDashboard({
  clients,
  equipment,
  workOrders,
  setWorkOrders,
  onOpenReport,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab
}: ClientDashboardProps) {
  // Navigation tabs with parent fallback
  const [localActiveTab, setLocalActiveTab] = useState<'equipos' | 'historial' | 'falla'>('equipos');
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

  // Select active client to view
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || 'c1');
  const activeClient = clients.find(c => c.id === selectedClientId);

  // Filter machines for this client
  const clientMachines = equipment.filter(e => e.clientId === selectedClientId);

  // Form states for submitting a corrective request
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Service history (completed/review OTs for this client)
  const clientHistory = workOrders.filter(o => o.clientId === selectedClientId && (o.status === 'completed' || o.status === 'review'));

  // Selected equipment for Hoja de Vida and Historial Clínico modal
  const [selectedEqForModal, setSelectedEqForModal] = useState<Equipment | null>(null);

  // Retrieve clinical history for a specific machine
  const getClinicalHistory = (eqId: string) => {
    const baseHistory: any[] = [];
    if (eqId === 'eq1') {
      baseHistory.push({
        id: 'h-b1',
        date: '2026-03-10',
        type: 'preventive',
        description: 'Servicio de mantenimiento preventivo de las 2,000 horas. Cambio de aceite, filtro de aire, filtro de aceite y cartucho separador.',
        technicianName: 'Roberto Sánchez',
        partsReplaced: [
          { name: 'Filtro de Aire Kaeser 6.2012.0', quantity: 1 },
          { name: 'Filtro de Aceite Kaeser 6.1981.1', quantity: 1 },
          { name: 'Aceite Sigma Fluid S-460 (Galón)', quantity: 4 }
        ]
      });
    } else if (eqId === 'eq2') {
      baseHistory.push({
        id: 'h-b2',
        date: '2026-01-15',
        type: 'corrective',
        description: 'Cambio de válvula de drenaje automático averiada y limpieza general de condensador.',
        technicianName: 'Alejandro Torres',
        partsReplaced: [
          { name: 'Válvula de Purga Temporizada 1/2"', quantity: 1 }
        ]
      });
    } else if (eqId === 'eq3') {
      baseHistory.push({
        id: 'h-b3',
        date: '2025-11-20',
        type: 'preventive',
        description: 'Servicio preventivo anual mayor. Lavado de radiadores, cambio de lubricante mineral a sintético.',
        technicianName: 'Roberto Sánchez',
        partsReplaced: [
          { name: 'Filtro Aire Atlas Copco 1613-8720-00', quantity: 1 },
          { name: 'Aceite Sigma Fluid S-460 (Cubeta 19L)', quantity: 1 }
        ]
      });
    }

    const dynamicHistory = workOrders
      .filter(o => o.equipmentId === eqId && (o.status === 'completed' || o.status === 'review'))
      .map(o => ({
        id: o.id,
        date: o.dateCompleted || o.scheduledDate,
        type: o.type,
        description: o.observations || 'Mantenimiento y revisión general del equipo.',
        technicianName: o.assignedTechnicianName,
        partsReplaced: o.partsUsed.map(p => ({ name: p.name, quantity: p.quantity }))
      }));

    const merged = [...dynamicHistory, ...baseHistory];
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return merged;
  };

  // Submit corrective request handler
  const handleRequestCorrective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineId || !issueDescription) return;

    const selectedMachine = equipment.find(eq => eq.id === selectedMachineId);
    if (!selectedMachine) return;

    const newCode = `OT-${1000 + workOrders.length + 1}`;
    const newRequest: WorkOrder = {
      id: `ot${Date.now()}`,
      code: newCode,
      equipmentId: selectedMachineId,
      clientId: selectedClientId,
      plantId: selectedMachine.plantId,
      type: 'corrective',
      status: 'pending',
      scheduledDate: new Date().toISOString().split('T')[0],
      engineHours: selectedMachine.engineHours,
      assignedTechnicianId: 's2', // Assigned to Roberto by default for demo
      assignedTechnicianName: 'Roberto Sánchez',
      checklist: [
        { id: 'c1', task: 'Diagnóstico general de falla reportada', checked: false }
      ],
      observations: `Levantamiento de Falla Cliente: ${issueDescription}`,
      partsUsed: []
    };

    setWorkOrders(prev => [newRequest, ...prev]);
    setSuccessMessage(`Solicitud creada con éxito. Folio: ${newCode}. Un técnico será asignado en breve.`);
    setIssueDescription('');
    setSelectedMachineId('');

    // Clear alert after 5 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Client Dropdown selector */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs gap-3">
        <div className="text-left w-full sm:w-auto">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Empresa Industrial</p>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              setSuccessMessage('');
            }}
            className="text-sm font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 cursor-pointer"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Building className="w-4 h-4 text-[#0196C1]" />
          <span>RFC: {activeClient?.rfc}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="hidden lg:flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-xs gap-1">
        <button
          onClick={() => setActiveTab('equipos')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'equipos' 
              ? 'bg-[#0196C1] text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Mis Equipos ({clientMachines.length})
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'historial' 
              ? 'bg-[#0196C1] text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Historial y Reportes ({clientHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('falla')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'falla' 
              ? 'bg-[#0196C1] text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Reportar Falla
        </button>
      </div>

      {/* Conditionally rendered sections based on activeTab */}
      {activeTab === 'equipos' && (
        <div className="space-y-3 text-left">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Estatus de Equipos Industriales</h3>
          <p className="text-[10px] text-slate-400 font-semibold mb-3">💡 Haz clic sobre cualquier tarjeta de compresor para abrir su Hoja de Vida y su Historial Clínico completo.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientMachines.map((eq) => {
              const hasOpenOT = workOrders.some(o => o.equipmentId === eq.id && o.status !== 'completed');
              return (
                <div 
                  key={eq.id} 
                  onClick={() => setSelectedEqForModal(eq)}
                  className="bg-white p-4 rounded-xl border border-slate-100 hover:border-[#0196C1]/40 shadow-xs space-y-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
                >
                  {/* Status indicator bar */}
                  <div className={`absolute top-0 inset-x-0 h-1.5 ${
                    eq.status === 'active' ? 'bg-emerald-500' :
                    eq.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />

                  <div className="flex justify-between items-start pt-1.5">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{eq.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{eq.brand} • {eq.model}</p>
                    </div>

                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                      eq.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      eq.status === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {eq.status === 'active' ? 'Operando' :
                       eq.status === 'warning' ? 'Alerta' : 'Mantenimiento'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                    <p>S/N: <span className="font-semibold text-slate-700">{eq.serialNumber}</span></p>
                    <p>Horas: <span className="font-semibold text-slate-700">{eq.engineHours.toLocaleString()} Hrs</span></p>
                    <p className="col-span-2">Último Mto: <span className="font-semibold text-slate-700">{eq.lastMaintenance}</span></p>
                  </div>

                  {hasOpenOT && (
                    <div className="bg-sky-50 text-sky-700 text-[10px] p-2 rounded-lg font-semibold flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Orden de Trabajo activa en curso
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
            <FileText className="w-4 h-4 text-[#0196C1]" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Historial Clínico Digital y Reportes</h3>
          </div>

          <div className="space-y-3">
            {clientHistory.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-100 text-slate-400 text-xs italic text-center">
                Ningún mantenimiento o reporte cerrado disponible para descargar.
              </div>
            ) : (
              clientHistory.map((ot) => {
                const eq = equipment.find(e => e.id === ot.equipmentId);
                return (
                  <div key={ot.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex justify-between items-center text-xs gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{ot.code}</span>
                        <span className="text-[10px] text-slate-400">{ot.dateCompleted}</span>
                      </div>
                      <p className="font-medium text-slate-700">{eq?.name} ({eq?.brand} {eq?.model})</p>
                      <p className="text-[10px] text-slate-400">Atendió: {ot.assignedTechnicianName}</p>
                    </div>

                    <button
                      onClick={() => onOpenReport(ot)}
                      className="px-3 py-1.5 bg-[#0196C1]/10 hover:bg-[#0196C1] hover:text-white text-[#0196C1] text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer flex-none"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'falla' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs max-w-xl mx-auto space-y-4 text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-800">Levantamiento de Falla</h3>
          </div>

          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleRequestCorrective} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Seleccionar Máquina con Reporte</label>
              <select
                required
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="">-- Elija equipo --</option>
                {clientMachines.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.brand} {eq.model} (S/N: {eq.serialNumber})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción de la Falla / Síntomas</label>
              <textarea
                required
                rows={4}
                placeholder="ej. El compresor se calienta y arroja alarma de alta temperatura en panel principal..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#282829] hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
            >
              Levantar Reporte Correctivo
            </button>
          </form>
        </div>
      )}

      {/* --- Equipment Expediente Modal (Hoja de Vida & Historial Clínico) --- */}
      {selectedEqForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100 text-left">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#0196C1]" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    Expediente Técnico Digital
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">HOJA DE VIDA Y BITÁCORA CLÍNICA</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEqForModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Hoja de Vida - Ficha Técnica */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 text-[10px]">
                  📋 Ficha Técnica del Activo (Hoja de Vida)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Equipo</p>
                    <p className="font-semibold text-slate-800">{selectedEqForModal.name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Marca / Modelo</p>
                    <p className="font-semibold text-slate-800">{selectedEqForModal.brand} {selectedEqForModal.model}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Número de Serie</p>
                    <p className="font-semibold text-slate-800">{selectedEqForModal.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Capacidad</p>
                    <p className="font-semibold text-slate-800">{selectedEqForModal.capacity}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Tipo de Aceite</p>
                    <p className="font-semibold text-slate-800">{selectedEqForModal.oilType}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Horas Acumuladas</p>
                    <p className="font-semibold text-slate-800">{selectedEqForModal.engineHours.toLocaleString()} Hrs</p>
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Filtros Requeridos</p>
                    <p className="font-semibold text-slate-700">{selectedEqForModal.filtersRequired}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Último Mto.</p>
                    <p className="font-semibold text-emerald-600">{selectedEqForModal.lastMaintenance}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Próximo Mto.</p>
                    <p className="font-semibold text-[#0196C1]">{selectedEqForModal.nextMaintenance}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Estatus Operativo</p>
                    <span className={`inline-block px-2 py-0.5 mt-0.5 text-[8px] font-bold rounded-full uppercase ${
                      selectedEqForModal.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      selectedEqForModal.status === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {selectedEqForModal.status === 'active' ? 'Operando' :
                       selectedEqForModal.status === 'warning' ? 'Alerta' : 'Mantenimiento'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Historial Clínico Digital - Bitácora */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 text-[10px]">
                  🩺 Historial Clínico Digital (Bitácora de Intervenciones)
                </h4>
                
                {getClinicalHistory(selectedEqForModal.id).length === 0 ? (
                  <p className="text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-150 text-center">
                    Este activo no cuenta con intervenciones previas registradas.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {getClinicalHistory(selectedEqForModal.id).map((history) => (
                      <div 
                        key={history.id} 
                        className="p-3 bg-white border border-slate-150 rounded-xl space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                            history.type === 'preventive' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {history.type === 'preventive' ? 'Preventivo' : 'Correctivo'}
                          </span>
                          <span className="text-slate-400 font-bold">{history.date}</span>
                        </div>

                        <p className="text-slate-700 font-medium leading-relaxed">
                          {history.description}
                        </p>

                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                          <p>Atendió: <span className="font-bold text-slate-700">{history.technicianName}</span></p>
                          {history.partsReplaced && history.partsReplaced.length > 0 && (
                            <p className="font-medium text-slate-700">
                              Refacciones: {history.partsReplaced.map((pr: any) => `${pr.name} (x${pr.quantity})`).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedEqForModal(null)}
                className="px-4 py-2 bg-[#282829] hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
