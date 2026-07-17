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
}

export default function TechnicianDashboard({
  workOrders,
  setWorkOrders,
  staff,
  inventory,
  equipment,
  clients
}: TechnicianDashboardProps) {
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
  };

  // Find active OT details
  const activeOt = workOrders.find(o => o.id === activeOtId);
  const activeEq = activeOt ? equipment.find(e => e.id === activeOt.equipmentId) : null;
  const activeClient = activeOt ? clients.find(c => c.id === activeOt.clientId) : null;

  return (
    <div className="space-y-6">
      
      {/* Technician Selector Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs gap-3">
        <div className="text-left w-full sm:w-auto">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Técnico Seleccionado</p>
          <select
            value={selectedTechId}
            onChange={(e) => {
              setSelectedTechId(e.target.value);
              setActiveOtId(null); // Reset when changing technician
            }}
            className="text-sm font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 cursor-pointer"
          >
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs bg-[#0196C1]/10 px-3 py-1.5 rounded-lg text-[#0196C1] font-bold w-full sm:w-auto justify-center">
          <Smartphone className="w-4 h-4" />
          Vista Móvil PWA Simulada
        </div>
      </div>

      <div className="flex justify-center">
        {/* --- Simulated Phone Layout --- */}
        <div className="max-w-md w-full border-8 border-slate-950 bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl h-[780px] flex flex-col relative">
          
          {/* Phone Notch/Speaker */}
          <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 z-40 flex justify-center items-center">
            <div className="w-24 h-4 bg-slate-900 rounded-b-xl" />
          </div>

          {/* Phone Screen Container */}
          <div className="flex-1 flex flex-col h-full pt-6 overflow-y-auto">
            
            {/* App Internal Nav */}
            <div className="bg-[#282829] text-white px-5 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
              <span className="font-extrabold text-sm tracking-widest text-[#0196C1]">MVL MOVIL</span>
              <span className="text-[10px] font-bold bg-[#0196C1] px-2 py-0.5 rounded-full">PWA</span>
            </div>

            {/* Viewport Content */}
            <div className="p-4 flex-1 space-y-4 pb-20">
              
              {!activeOtId ? (
                // --- Daily Services List View ---
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mi Agenda del Día</h3>
                  
                  {myOrders.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl text-center border border-slate-200/60 text-xs text-slate-400 italic">
                      No tienes servicios asignados para hoy.
                    </div>
                  ) : (
                    myOrders.map((ot) => {
                      const eq = equipment.find(e => e.id === ot.equipmentId);
                      const cl = clients.find(c => c.id === ot.clientId);
                      return (
                        <div key={ot.id} className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs space-y-3 text-left">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 text-xs">{ot.code}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase ${
                              ot.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                              ot.status === 'in_progress' ? 'bg-sky-50 text-sky-600' :
                              ot.status === 'review' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {ot.status === 'pending' ? 'Pendiente' :
                               ot.status === 'in_progress' ? 'Activo' :
                               ot.status === 'review' ? 'En Revisión' : 'Cerrada'}
                            </span>
                          </div>

                          <div className="text-xs space-y-1">
                            <p className="font-bold text-slate-800">{cl?.companyName.substring(0, 30)}...</p>
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#0196C1]" /> {cl?.plants[0]?.name}
                            </p>
                            <p className="text-[11px] text-slate-500">Equipo: <span className="font-bold text-slate-700">{eq?.brand} {eq?.model}</span></p>
                          </div>

                          {ot.status !== 'completed' && ot.status !== 'review' && (
                            <button
                              onClick={() => startService(ot)}
                              className="w-full py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg mt-2 cursor-pointer transition-all active:scale-95 text-center"
                            >
                              {ot.status === 'in_progress' ? 'Continuar Reporte' : 'Iniciar Servicio en Sitio'}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                // --- Active Onsite execution Form ---
                <form onSubmit={handleSubmitReport} className="space-y-4 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-xs text-slate-800">Llenando Reporte: {activeOt?.code}</span>
                    <button
                      type="button"
                      onClick={() => setActiveOtId(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Volver
                    </button>
                  </div>

                  {/* Compressor technical short specifications */}
                  <div className="bg-slate-800 text-white p-3 rounded-xl text-[11px] space-y-1">
                    <p className="font-bold text-[#0196C1]">{activeClient?.companyName}</p>
                    <p className="font-medium text-slate-300">{activeEq?.name} ({activeEq?.brand} {activeEq?.model})</p>
                    <p className="text-slate-400">S/N: {activeEq?.serialNumber} • Aceite: {activeEq?.oilType}</p>
                  </div>

                  {/* Engine Hours */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Horas de Motor Actuales</label>
                    <input
                      type="number"
                      required
                      value={engineHours}
                      onChange={(e) => setEngineHours(Number(e.target.value))}
                      className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* Interactive Checklist */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-2.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Lista de Verificación</label>
                    <div className="space-y-2">
                      {checklist.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => handleToggleChecklist(item.id)}
                          className="flex items-center gap-2 cursor-pointer py-1 select-none text-[11px] text-slate-700"
                        >
                          {item.checked ? (
                            <CheckSquare className="w-4 h-4 text-[#0196C1] flex-none" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 flex-none" />
                          )}
                          <span className={item.checked ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                            {item.task}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consumer parts registry */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Consumo de Refacciones</label>
                    
                    <div className="space-y-2">
                      <select
                        value={selectedPartId}
                        onChange={(e) => setSelectedPartId(e.target.value)}
                        className="w-full text-[11px] px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                      >
                        <option value="">Añadir pieza utilizada...</option>
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
                          className="w-16 text-center text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
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
                      <div className="divide-y divide-slate-100 pt-1">
                        {partsUsed.map((p) => (
                          <div key={p.itemId} className="flex justify-between items-center py-2 text-[10px]">
                            <span className="font-semibold text-slate-700">{p.name} (x{p.quantity})</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePartUsage(p.itemId)}
                              className="text-rose-500 hover:text-rose-700 font-bold"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Capture Evidence Camera (Simulated) */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Evidencia Fotográfica</label>
                    
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => handleSimulatePhoto('before')}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 text-slate-600 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#0196C1]" /> Foto Antes
                        </button>
                        {beforePhoto && (
                          <img src={beforePhoto} alt="Antes" className="w-full h-20 object-cover rounded-lg" />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => handleSimulatePhoto('after')}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 text-slate-600 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#0196C1]" /> Foto Después
                        </button>
                        {afterPhoto && (
                          <img src={afterPhoto} alt="Después" className="w-full h-20 object-cover rounded-lg" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic & Observations */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Diagnóstico y Observaciones</label>
                    <textarea
                      required
                      placeholder="Escribe el estado final de la máquina..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      rows={2}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* Client conformance digital signature */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-3">
                    <label className="block text-[10px] font-bold text-[#0196C1] uppercase">Firma del Cliente Encargado</label>
                    
                    <input
                      type="text"
                      required
                      placeholder="Nombre del cliente de conformidad"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none mb-1"
                    />

                    <SignatureCanvas
                      onSave={(dataUrl) => setSignature(dataUrl)}
                      onClear={() => setSignature('')}
                      savedSignature={signature}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Enviar Reporte a Revisión
                  </button>
                </form>
              )}

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
