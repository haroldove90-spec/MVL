/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, Equipment, WorkOrder, HistoryItem } from '../types';
import { 
  Building, LayoutGrid, FileText, AlertOctagon, Plus, CheckCircle, 
  HelpCircle, Sparkles, Wrench, RefreshCw, Calendar, Download, X, Activity,
  BookOpen, Lightbulb, PlayCircle, CheckCircle2, ChevronRight, Info
} from 'lucide-react';

interface ClientDashboardProps {
  clients: Client[];
  equipment: Equipment[];
  workOrders: WorkOrder[];
  setWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  onOpenReport: (ot: WorkOrder) => void;
  activeTab?: 'equipos' | 'historial' | 'falla' | 'tutorial';
  setActiveTab?: (val: 'equipos' | 'historial' | 'falla' | 'tutorial') => void;
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
  const [localActiveTab, setLocalActiveTab] = useState<'equipos' | 'historial' | 'falla' | 'tutorial'>('equipos');
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

  // Select active client to view
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || 'c1');
  const activeClient = clients.find(c => c.id === selectedClientId);

  // Filter machines for this client
  const clientMachines = equipment.filter(e => e.clientId === selectedClientId);

  // Live IoT telemetry simulator
  const [telemetryState, setTelemetryState] = useState<Record<string, { psi: number; temp: number; vibration: 'normal' | 'moderate' | 'high'; rpm: number }>>(() => {
    const initial: Record<string, any> = {};
    equipment.forEach(eq => {
      initial[eq.id] = eq.telemetry || {
        psi: 100,
        temp: 75,
        vibration: 'normal',
        rpm: 1500
      };
    });
    return initial;
  });

  const [isSimulating, setIsSimulating] = useState(true);

  React.useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setTelemetryState(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          const item = next[id];
          if (item.rpm === 0) return; // Machine is stopped
          const psiDiff = (Math.random() - 0.5) * 4;
          const tempDiff = (Math.random() - 0.5) * 2;
          const rpmDiff = (Math.random() - 0.5) * 30;
          
          next[id] = {
            psi: Math.max(80, Math.min(140, Math.round((item.psi + psiDiff) * 10) / 10)),
            temp: Math.max(40, Math.min(115, Math.round((item.temp + tempDiff) * 10) / 10)),
            rpm: Math.max(1000, Math.min(2200, Math.round(item.rpm + rpmDiff))),
            vibration: item.temp > 105 ? 'high' : item.temp > 92 ? 'moderate' : 'normal'
          };
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Form states for rating work orders
  const [ratingOtId, setRatingOtId] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingNps, setRatingNps] = useState<number>(10);
  const [ratingComments, setRatingComments] = useState<string>('');
  const [ratingSuccess, setRatingSuccess] = useState<string | null>(null);

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
        <button
          onClick={() => setActiveTab('tutorial')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'tutorial' 
              ? 'bg-[#0196C1] text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Tutorial / Guía
        </button>
      </div>

      {/* Conditionally rendered sections based on activeTab */}

      {/* --- Tab: Tutorial / Guía para el Cliente --- */}
      {activeTab === 'tutorial' && (
        <div className="space-y-6 text-left">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#282829] to-slate-800 text-white p-6 rounded-2xl shadow-md border-l-4 border-[#0196C1] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#0196C1]/20 rounded-lg text-[#0196C1] text-xs font-extrabold uppercase tracking-wide">
                <BookOpen className="w-4 h-4" /> Manual del Cliente Industrial
              </div>
              <h2 className="text-xl font-black text-white">Guía de Uso: Portal de Cliente MVL</h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Aprende a monitorear la salud operacional de tus compresores en tiempo real, consultar hojas de vida técnicas, descargar reportes en PDF y solicitar atención inmediata de fallas.
              </p>
            </div>
            <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-xs text-right">
              <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Perfil Activo</span>
              <span className="text-sm font-bold text-sky-400">Cliente Industrial</span>
            </div>
          </div>

          {/* Tutorial Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* 1. Monitoreo IoT Telemetría */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">1. Monitoreo IoT de Compresores (En Vivo)</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Lectura en tiempo real de presiones y temperaturas</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>En la pestaña <strong>"Mis Equipos"</strong> verás las tarjetas de tus compresores industriales instalados en tu planta.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Revisa los valores en tiempo real de <strong>Presión (PSI)</strong>, <strong>Temperatura (°C)</strong>, <strong>RPM</strong> y <strong>Nivel de Vibración</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Si un parámetro supera los límites normales, la tarjeta cambiará de color advirtiéndote preventivamente sobre anomalías.</span>
                </li>
              </ul>
            </div>

            {/* 2. Hoja de Vida e Historial Clínico */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">2. Hoja de Vida e Historial Clínico</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Expediente completo de mantenimientos por máquina</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Haz clic sobre cualquier equipo para abrir su <strong>Hoja de Vida Oficial</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Consulta el número de serie, modelo, potencia en HP, fecha del último mantenimiento y días faltantes para la próxima revisión.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Revisa la lista cronológica de intervenciones técnicas pasadas y refacciones cambiadas.</span>
                </li>
              </ul>
            </div>

            {/* 3. Descargar PDF y Calificar Servicio */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">3. Reportes PDF y Calificación de Atención</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Descarga de informes firmados y evaluación de satisfacción</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Ve a la pestaña <strong>"Historial y Reportes"</strong> para ver los servicios concluidos en tus plantas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Presiona <strong>"Ver Reporte PDF"</strong> para guardar o imprimir la hoja oficial firmada con las fotografías de evidencia.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span><strong>Califica al Técnico:</strong> Asigna estrellas de 1 a 5 y comparte comentarios para ayudarnos a mantener la máxima calidad de atención.</span>
                </li>
              </ul>
            </div>

            {/* 4. Reportar Falla Urgente */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">4. Reportar Falla Urgente (Ticket de Atención)</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Solicitud inmediata de visita técnica correctiva</p>
                </div>
              </div>
              <ol className="space-y-2 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
                <li>Dirígete a la pestaña <strong>"Reportar Falla"</strong>.</li>
                <li>Selecciona el <strong>Compresor Averiado</strong> de tu lista de equipos.</li>
                <li>Describe los síntomas (ejemplo: <em>"Aviso de sobretemperatura en display"</em> o <em>"Ruido inusual en unidad de compresión"</em>).</li>
                <li>Haz clic en <strong>"Enviar Reporte de Falla"</strong>.</li>
                <li>La solicitud llegará de inmediato a la Coordinación para enviarte a un especialista de urgencia.</li>
              </ol>
            </div>

          </div>

          {/* Support Banner */}
          <div className="bg-[#0196C1]/10 p-4 rounded-2xl border border-[#0196C1]/20 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[#0196C1] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="block font-bold text-slate-800">Soporte Técnico Especializado:</strong>
              Si requieres orientación inmediata sobre una emergencia en tu planta o cotización de refacciones adicionales, nuestro equipo de coordinación está disponible 24/7.
            </div>
          </div>

        </div>
      )}
      {activeTab === 'equipos' && (
        <div className="space-y-4 text-left">
          {/* IoT Controller Banner */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-4 opacity-5 pointer-events-none">
              <Activity className="w-48 h-48" />
            </div>
            
            <div className="space-y-1 z-10">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulating ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSimulating ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                </span>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0196C1]">Sistema de Telemetría IoT Activo</h4>
              </div>
              <p className="text-[11px] text-slate-300">
                Monitoreo continuo de vibración, temperatura de descarga y presiones de compresor.
              </p>
            </div>

            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer z-10 ${
                isSimulating 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
              {isSimulating ? 'Simulación Activa (Detener)' : 'Simulación Detenida (Iniciar)'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Estatus de Equipos Industriales</h3>
              <p className="text-[10px] text-slate-400 font-semibold">💡 Haz clic sobre cualquier tarjeta de compresor para abrir su Hoja de Vida y su Historial Clínico completo.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientMachines.map((eq) => {
              const hasOpenOT = workOrders.some(o => o.equipmentId === eq.id && o.status !== 'completed');
              const eqTelemetry = telemetryState[eq.id];
              const isHighTemp = eqTelemetry && eqTelemetry.temp > 95;
              
              return (
                <div 
                  key={eq.id} 
                  onClick={() => setSelectedEqForModal(eq)}
                  className="bg-white p-4 rounded-xl border border-slate-100 hover:border-[#0196C1]/40 shadow-sm space-y-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
                >
                  {/* Status indicator bar */}
                  <div className={`absolute top-0 inset-x-0 h-1.5 ${
                    isHighTemp ? 'bg-rose-500' :
                    eq.status === 'active' ? 'bg-emerald-500' :
                    eq.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />

                  <div className="flex justify-between items-start pt-1.5">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{eq.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{eq.brand} • {eq.model}</p>
                    </div>

                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                      isHighTemp ? 'bg-rose-50 text-rose-700' :
                      eq.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      eq.status === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {isHighTemp ? 'Crítico (Temp)' :
                       eq.status === 'active' ? 'Operando' :
                       eq.status === 'warning' ? 'Alerta' : 'Mantenimiento'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                    <p>S/N: <span className="font-semibold text-slate-700">{eq.serialNumber}</span></p>
                    <p>Horas: <span className="font-semibold text-slate-700">{eq.engineHours.toLocaleString()} Hrs</span></p>
                  </div>

                  {/* Telemetría IoT sub-panel */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-1 text-[9px] font-bold text-slate-400 uppercase">
                      <span className="flex items-center gap-1 text-[#0196C1]">
                        <Activity className="w-3 h-3" />
                        Sensores IoT (En Vivo)
                      </span>
                      <span className="text-[8px]">{isSimulating ? 'Actualizando' : 'Pausado'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[10px] text-slate-600">
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[8px]">Presión</p>
                        <p className="font-mono font-bold text-slate-700">
                          {eqTelemetry?.psi ?? 100} <span className="text-[9px] font-normal text-slate-400">PSI</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[8px]">Temperatura</p>
                        <p className={`font-mono font-bold ${isHighTemp ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
                          {eqTelemetry?.temp ?? 75} <span className="text-[9px] font-normal text-slate-400">°C</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[8px]">Frecuencia</p>
                        <p className="font-mono font-bold text-slate-700">
                          {eqTelemetry?.rpm ?? 1500} <span className="text-[9px] font-normal text-slate-400">RPM</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[8px]">Vibración</p>
                        <span className={`inline-block px-1 py-0.2 rounded-sm font-bold uppercase text-[8px] ${
                          (eqTelemetry?.vibration ?? 'normal') === 'high' ? 'bg-rose-50 text-rose-700' :
                          (eqTelemetry?.vibration ?? 'normal') === 'moderate' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {eqTelemetry?.vibration ?? 'normal'}
                        </span>
                      </div>
                    </div>
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

          {ratingSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl mb-3 flex items-center gap-1.5 animate-pulse">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {ratingSuccess}
            </div>
          )}

          <div className="space-y-3">
            {clientHistory.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-100 text-slate-400 text-xs italic text-center">
                Ningún mantenimiento o reporte cerrado disponible para descargar.
              </div>
            ) : (
              clientHistory.map((ot) => {
                const eq = equipment.find(e => e.id === ot.equipmentId);
                const hasFeedback = !!ot.clientFeedback;
                const isRatingThis = ratingOtId === ot.id;

                return (
                  <div key={ot.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3 text-xs text-left">
                    <div className="flex justify-between items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-800">{ot.code}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{ot.dateCompleted}</span>
                          <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded-full uppercase ${
                            ot.type === 'preventive' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {ot.type === 'preventive' ? 'Preventivo' : 'Correctivo'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-700">{eq?.name} ({eq?.brand} {eq?.model})</p>
                        <p className="text-[10px] text-slate-400">Atendió: <span className="font-semibold text-slate-600">{ot.assignedTechnicianName}</span></p>
                      </div>

                      <div className="flex items-center gap-2 flex-none">
                        {!hasFeedback && !isRatingThis && (
                          <button
                            onClick={() => {
                              setRatingOtId(ot.id);
                              setRatingStars(5);
                              setRatingNps(10);
                              setRatingComments('');
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-extrabold uppercase tracking-wide rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            ⭐ Calificar
                          </button>
                        )}
                        <button
                          onClick={() => onOpenReport(ot)}
                          className="px-3 py-1.5 bg-[#0196C1]/10 hover:bg-[#0196C1] hover:text-white text-[#0196C1] font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer text-xs"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    </div>

                    {/* Feedback displays or forms */}
                    {hasFeedback && (
                      <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-100/50 space-y-1 text-[11px] text-slate-600">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-amber-800 flex items-center gap-1">
                            {"⭐".repeat(ot.clientFeedback!.rating)} ({ot.clientFeedback!.rating}/5 Estrellas)
                          </span>
                          <span className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-sm">
                            NPS: {ot.clientFeedback!.nps}
                          </span>
                        </div>
                        {ot.clientFeedback!.comments && (
                          <p className="italic text-slate-500 font-medium">"{ot.clientFeedback!.comments}"</p>
                        )}
                      </div>
                    )}

                    {isRatingThis && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                          <h4 className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Encuesta de Calidad de Servicio</h4>
                          <button 
                            type="button"
                            onClick={() => setRatingOtId(null)}
                            className="text-slate-400 hover:text-slate-600 font-bold border-none bg-transparent cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>

                        {/* Stars picker */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Calificación de Servicio</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingStars(star)}
                                className="text-lg focus:outline-none transition-transform hover:scale-125 cursor-pointer border-none bg-transparent"
                              >
                                {star <= ratingStars ? '⭐' : '☆'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* NPS picker */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">
                            ¿Qué tan probable es que nos recomiende? (NPS 0-10)
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setRatingNps(n)}
                                className={`w-6 h-6 rounded-md font-bold text-[10px] flex items-center justify-center border transition-all cursor-pointer ${
                                  ratingNps === n 
                                    ? 'bg-[#0196C1] text-white border-[#0196C1] scale-110' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-400 font-bold px-1 uppercase pt-0.5">
                            <span>0 - Muy Improbable</span>
                            <span>10 - Muy Probable</span>
                          </div>
                        </div>

                        {/* Comments */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Comentarios / Sugerencias de mejora</label>
                          <textarea
                            rows={2}
                            placeholder="Tu opinión nos ayuda a mantener tus compresores en óptima operación..."
                            value={ratingComments}
                            onChange={(e) => setRatingComments(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (ot.id) {
                              setWorkOrders(prev => prev.map(o => {
                                if (o.id === ot.id) {
                                  return {
                                    ...o,
                                    clientFeedback: {
                                      rating: ratingStars,
                                      nps: ratingNps,
                                      comments: ratingComments
                                    }
                                  };
                                }
                                return o;
                              }));
                              setRatingOtId(null);
                              setRatingSuccess("¡Calificación registrada exitosamente! Gracias por tu valioso feedback.");
                              setTimeout(() => setRatingSuccess(null), 4000);
                            }
                          }}
                          className="w-full py-1.5 bg-[#0196C1] hover:bg-[#0185ab] text-white font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border-none"
                        >
                          Enviar Calificación
                        </button>
                      </div>
                    )}
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
