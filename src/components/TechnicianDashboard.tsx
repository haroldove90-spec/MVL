/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkOrder, Staff, InventoryItem, Equipment, Client } from '../types';
import { 
  CheckSquare, Square, Camera, Check, Clock, Calendar, 
  MapPin, PenTool, ClipboardList, PackagePlus, ShieldAlert, Smartphone
} from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';

interface TechnicianDashboardProps {
  workOrders: WorkOrder[];
  setWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  staff: Staff[];
  inventory: InventoryItem[];
  equipment: Equipment[];
  clients: Client[];
  activeTab?: 'agenda' | 'reporte';
  setActiveTab?: (val: 'agenda' | 'reporte') => void;
}

export default function TechnicianDashboard({
  workOrders,
  setWorkOrders,
  staff,
  inventory,
  equipment,
  clients,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab
}: TechnicianDashboardProps) {
  // Navigation tabs with parent fallback
  const [localActiveTab, setLocalActiveTab] = useState<'agenda' | 'reporte'>('agenda');
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

  // Select active technician to filter
  const technicians = staff.filter(s => s.role === 'technician' && s.active);
  const [selectedTechId, setSelectedTechId] = useState(technicians[0]?.id || 's2');
  
  // Select active OT being worked on
  const [activeOtId, setActiveOtId] = useState<string | null>(null);

  // Form states for active OT filling
  const [engineHours, setEngineHours] = useState<number>(0);
  const [observations, setObservations] = useState('');
  const [checklist, setChecklist] = useState<any[]>([]);
  const [partsUsed, setPartsUsed] = useState<any[]>([]);
  const [beforePhoto, setBeforePhoto] = useState<string>('');
  const [afterPhoto, setAfterPhoto] = useState<string>('');
  const [signature, setSignature] = useState('');
  const [signatureName, setSignatureName] = useState('');

  // Dropdown states for adding part
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedPartQty, setSelectedPartQty] = useState(1);

  // Filtered orders for this technician
  const myOrders = workOrders.filter(o => o.assignedTechnicianId === selectedTechId);

  // Start executing a service
  const startService = (ot: WorkOrder) => {
    setActiveOtId(ot.id);
    setEngineHours(ot.engineHours);
    setObservations(ot.observations || '');
    setChecklist(ot.checklist.map(c => ({ ...c })));
    setPartsUsed(ot.partsUsed ? ot.partsUsed.map(p => ({ ...p })) : []);
    setBeforePhoto(ot.beforePhoto || '');
    setAfterPhoto(ot.afterPhoto || '');
    setSignature(ot.signature || '');
    setSignatureName(ot.signatureName || '');
    
    // Change OT status to in_progress
    setWorkOrders(prev => prev.map(o => o.id === ot.id ? { ...o, status: 'in_progress' } : o));
    setActiveTab('reporte'); // Automatically shift to the active report view!
  };

  // Toggle checklist item
  const handleToggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
  };

  // Add Part usage
  const handleAddPartUsage = () => {
    if (!selectedPartId) return;
    const item = inventory.find(i => i.id === selectedPartId);
    if (!item) return;

    // Check if already added
    const existingIndex = partsUsed.findIndex(p => p.itemId === selectedPartId);
    if (existingIndex >= 0) {
      setPartsUsed(prev => {
        const copy = [...prev];
        copy[existingIndex].quantity += Number(selectedPartQty);
        return copy;
      });
    } else {
      setPartsUsed(prev => [
        ...prev,
        {
          itemId: selectedPartId,
          name: item.name,
          quantity: Number(selectedPartQty),
          price: item.price
        }
      ]);
    }

    setSelectedPartId('');
    setSelectedPartQty(1);
  };

  // Remove Part usage
  const handleRemovePartUsage = (itemId: string) => {
    setPartsUsed(prev => prev.filter(p => p.itemId !== itemId));
  };

  // Simulate Photo capture
  const handleSimulatePhoto = (type: 'before' | 'after') => {
    const mockMachinePhotos = [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=300'
    ];
    // Select random image from array
    const randomUrl = mockMachinePhotos[Math.floor(Math.random() * mockMachinePhotos.length)];
    if (type === 'before') {
      setBeforePhoto(randomUrl);
    } else {
      setAfterPhoto(randomUrl);
    }
  };

  // Submit complete report to Coordinator
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOtId) return;
    if (!signature || !signatureName) {
      alert('La firma de conformidad y el nombre del cliente son obligatorios para cerrar el reporte.');
      return;
    }

    setWorkOrders(prev => prev.map(o => {
      if (o.id === activeOtId) {
        return {
          ...o,
          status: 'review', // Sends to Coordinator review queue!
          engineHours: Number(engineHours),
          checklist,
          partsUsed,
          beforePhoto,
          afterPhoto,
          signature,
          signatureName,
          observations,
          dateCompleted: new Date().toISOString().split('T')[0]
        };
      }
      return o;
    }));

    setActiveOtId(null);
    setActiveTab('agenda'); // Shift tab back to agenda upon completion!
  };

  // Find active OT details
  const activeOt = workOrders.find(o => o.id === activeOtId);
  const activeEq = activeOt ? equipment.find(e => e.id === activeOt.equipmentId) : null;
  const activeClient = activeOt ? clients.find(c => c.id === activeOt.clientId) : null;

  return (
    <div className="space-y-6">
      
      {/* Technician Selector Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-150 shadow-xs gap-3">
        <div className="text-left w-full sm:w-auto">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Técnico Seleccionado</p>
          <select
            value={selectedTechId}
            onChange={(e) => {
              setSelectedTechId(e.target.value);
              setActiveOtId(null); // Reset when changing technician
              setActiveTab('agenda');
            }}
            className="text-sm font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 cursor-pointer"
          >
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs bg-[#0196C1]/10 px-3 py-1.5 rounded-lg text-[#0196C1] font-bold w-full sm:w-auto justify-center">
          <ClipboardList className="w-4 h-4" />
          Ejecución Técnica en Campo
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-255 bg-white p-1 rounded-xl shadow-xs gap-1">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'agenda' 
              ? 'bg-[#0196C1] text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Mi Agenda ({myOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('reporte')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'reporte' 
              ? 'bg-[#0196C1] text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Reporte Activo {activeOtId ? `(${activeOt?.code})` : ''}
        </button>
      </div>

      {/* Main Container Content */}
      <div className="w-full">
        {activeTab === 'agenda' && (
          <div className="space-y-4 text-left">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Compresores Asignados para Servicio</h3>
            
            {myOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-xl text-center border border-slate-200/60 text-slate-400 italic">
                No tienes servicios asignados para hoy.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myOrders.map((ot) => {
                  const eq = equipment.find(e => e.id === ot.equipmentId);
                  const cl = clients.find(c => c.id === ot.clientId);
                  return (
                    <div key={ot.id} className="bg-white p-5 rounded-[20px] shadow-[0_10px_25px_rgba(0,0,0,0.02)] border border-black/5 hover:border-[#0196C1]/50 hover:shadow-[0_15px_35px_rgba(1,150,193,0.08)] transition-all duration-300 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-[#282829] text-sm">{ot.code}</span>
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                            ot.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                            ot.status === 'in_progress' ? 'bg-sky-50 text-sky-600' :
                            ot.status === 'review' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {ot.status === 'pending' ? 'Pendiente' :
                             ot.status === 'in_progress' ? 'Activo' :
                             ot.status === 'review' ? 'En Revisión' : 'Cerrada'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <p className="font-bold text-[#282829] text-base leading-tight">{cl?.companyName}</p>
                          <div className="space-y-1 text-xs text-slate-500 font-medium">
                            <p className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#0196C1]" /> {cl?.plants[0]?.name}
                            </p>
                            <p>
                              Equipo: <span className="font-bold text-[#282829]">{eq?.name} ({eq?.brand} {eq?.model})</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {ot.status !== 'completed' && ot.status !== 'review' && (
                        <button
                          onClick={() => startService(ot)}
                          className="w-full py-2.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center gap-2 shadow-xs"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          {ot.status === 'in_progress' ? 'Continuar Reporte' : 'Iniciar Servicio en Sitio'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reporte' && (
          <div className="w-full max-w-4xl mx-auto">
            {!activeOtId ? (
              <div className="bg-white p-12 rounded-[20px] text-center border border-black/5 shadow-xs text-slate-400 italic space-y-4">
                <p>No tienes una orden de trabajo activa seleccionada en este momento.</p>
                <button
                  onClick={() => setActiveTab('agenda')}
                  className="px-5 py-2.5 bg-[#0196C1] text-white font-bold text-xs rounded-lg hover:bg-[#017fa4] transition-all cursor-pointer"
                >
                  Ver Mi Agenda
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="bg-white p-6 rounded-[20px] border border-black/5 shadow-[0_10px_25px_rgba(0,0,0,0.03)] space-y-6 text-left">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="font-extrabold text-sm text-[#0196C1] uppercase tracking-wider">Llenando Reporte: {activeOt?.code}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveOtId(null);
                      setActiveTab('agenda');
                    }}
                    className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    Volver a Agenda
                  </button>
                </div>

                {/* Compressor specifications header card */}
                <div className="bg-[#282829] text-white p-4 rounded-xl text-xs space-y-1.5 border-b-3 border-[#0196C1]">
                  <p className="font-extrabold text-[#0196C1] text-sm uppercase tracking-wide">{activeClient?.companyName}</p>
                  <p className="font-medium text-slate-200">{activeEq?.name} ({activeEq?.brand} {activeEq?.model})</p>
                  <p className="text-slate-400">S/N: {activeEq?.serialNumber} • Lubricante: {activeEq?.oilType}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Technical Checklist & Hours */}
                  <div className="space-y-4">
                    {/* Engine Hours Input */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horas de Motor Actuales</label>
                      <input
                        type="number"
                        required
                        value={engineHours}
                        onChange={(e) => setEngineHours(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0196C1]"
                      />
                    </div>

                    {/* Checkbox tasks */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lista de Verificación</label>
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-150 max-h-[220px] overflow-y-auto">
                        {checklist.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => handleToggleChecklist(item.id)}
                            className="flex items-center gap-2 cursor-pointer py-1.5 select-none text-xs text-slate-700 hover:bg-slate-50 px-1 rounded transition-colors"
                          >
                            {item.checked ? (
                              <CheckSquare className="w-4 h-4 text-[#0196C1] flex-none" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 flex-none" />
                            )}
                            <span className={item.checked ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
                              {item.task}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Spare Parts & Photographic Evidence */}
                  <div className="space-y-4">
                    {/* Spare Parts consumed */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consumo de Refacciones</label>
                      
                      <div className="space-y-2">
                        <select
                          value={selectedPartId}
                          onChange={(e) => setSelectedPartId(e.target.value)}
                          className="w-full text-[11px] px-2 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                        >
                          <option value="">Añadir pieza de inventario...</option>
                          {inventory.map(item => (
                            <option key={item.id} value={item.id} disabled={item.stock <= 0}>
                              {item.name} ({item.stock} disp.)
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={1}
                            value={selectedPartQty}
                            onChange={(e) => setSelectedPartQty(Number(e.target.value))}
                            className="w-16 text-center text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddPartUsage}
                            className="flex-1 py-1 px-3 bg-[#0196C1] hover:bg-[#017fa4] text-white text-[11px] font-bold rounded-lg cursor-pointer text-center"
                          >
                            Registrar Consumo
                          </button>
                        </div>
                      </div>

                      {partsUsed.length > 0 && (
                        <div className="divide-y divide-slate-100 pt-1 bg-white p-2.5 rounded-lg border border-slate-150">
                          {partsUsed.map((p) => (
                            <div key={p.itemId} className="flex justify-between items-center py-1.5 text-[11px]">
                              <span className="font-semibold text-slate-700">{p.name} (x{p.quantity})</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePartUsage(p.itemId)}
                                className="text-rose-500 hover:text-rose-700 font-bold text-[10px]"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Snapped Photos evidence */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evidencia Fotográfica de Compresor</label>
                      
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => handleSimulatePhoto('before')}
                            className="w-full py-2 bg-white hover:bg-slate-100 border border-dashed border-slate-300 text-slate-600 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#0196C1]" /> Foto Antes
                          </button>
                          {beforePhoto && (
                            <img src={beforePhoto} alt="Antes" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => handleSimulatePhoto('after')}
                            className="w-full py-2 bg-white hover:bg-slate-100 border border-dashed border-slate-300 text-slate-600 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#0196C1]" /> Foto Después
                          </button>
                          {afterPhoto && (
                            <img src={afterPhoto} alt="Después" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observations & Diagnosis block */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diagnóstico Técnico y Observaciones Finales</label>
                  <textarea
                    required
                    placeholder="Escribe el estado final de las presiones, fugas solucionadas u observaciones..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={3}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0196C1]"
                  />
                </div>

                {/* Client digital Signature Canvas */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <label className="block text-[10px] font-bold text-[#0196C1] uppercase tracking-wider">Firma Digital del Cliente Encargado</label>
                  
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo de conformidad de cliente"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none mb-1 focus:border-[#0196C1]"
                  />

                  <div className="bg-white rounded-lg border border-slate-200 p-2">
                    <SignatureCanvas
                      onSave={(dataUrl) => setSignature(dataUrl)}
                      onClear={() => setSignature('')}
                      savedSignature={signature}
                    />
                  </div>
                </div>

                {/* Complete Review Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Enviar Reporte a Coordinación para Revisión
                </button>
              </form>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
