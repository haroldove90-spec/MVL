import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, ExternalLink, Download, MapPin, User, Building, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Client } from '../types';
import { saveToStorage, loadFromStorage } from '../mockData';

export interface VisitAppointment {
  id: string;
  clientName: string;
  plantName: string;
  contactName: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  purpose: string;
  agentName: string;
  status: 'programada' | 'completada' | 'cancelada';
}

interface SalesAgendaModuleProps {
  clients: Client[];
  agentName: string;
}

export const SalesAgendaModule: React.FC<SalesAgendaModuleProps> = ({ clients, agentName }) => {
  const [visits, setVisits] = useState<VisitAppointment[]>(() =>
    loadFromStorage<VisitAppointment[]>('mvl_sales_agenda_visits', [
      {
        id: 'v_1',
        clientName: 'CDI Corte y Doblez Industrial',
        plantName: 'Planta Principal León',
        contactName: 'Ing. Carlos Mendoza',
        phone: '477-555-1234',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        purpose: 'Revisión técnica y levantamiento para compresor de tornillo',
        agentName: agentName || 'Ing. Leonardo Daniel Torres',
        status: 'programada'
      },
      {
        id: 'v_2',
        clientName: 'Flexi / Cribe S.A. de C.V.',
        plantName: 'Planta Calzado Sur',
        contactName: 'Lic. Roberto Garza',
        phone: '477-888-9911',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '12:30',
        purpose: 'Entrega y firma de cotización de póliza anual HVAC',
        agentName: agentName || 'Ing. Leonardo Daniel Torres',
        status: 'completada'
      }
    ])
  );

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New visit form state
  const [clientName, setClientName] = useState('');
  const [plantName, setPlantName] = useState('Planta Principal');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitTime, setVisitTime] = useState('09:00');
  const [purpose, setPurpose] = useState('');

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !visitDate || !visitTime) {
      alert('Por favor completa el nombre del cliente, fecha y hora.');
      return;
    }

    const newVisit: VisitAppointment = {
      id: 'v_' + Date.now(),
      clientName: clientName.trim(),
      plantName: plantName.trim() || 'Planta Principal',
      contactName: contactName.trim(),
      phone: phone.trim(),
      date: visitDate,
      time: visitTime,
      purpose: purpose.trim() || 'Visita comercial / técnica',
      agentName: agentName || 'Asesor MVL',
      status: 'programada'
    };

    const updated = [newVisit, ...visits];
    setVisits(updated);
    saveToStorage('mvl_sales_agenda_visits', updated);

    setClientName('');
    setPlantName('Planta Principal');
    setContactName('');
    setPhone('');
    setPurpose('');
    setShowAddModal(false);
  };

  const handleDeleteVisit = (id: string) => {
    if (confirm('¿Deseas eliminar esta cita de la agenda?')) {
      const updated = visits.filter(v => v.id !== id);
      setVisits(updated);
      saveToStorage('mvl_sales_agenda_visits', updated);
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = visits.map(v => {
      if (v.id === id) {
        const nextStatus = v.status === 'programada' ? 'completada' : 'programada';
        return { ...v, status: nextStatus };
      }
      return v;
    });
    setVisits(updated);
    saveToStorage('mvl_sales_agenda_visits', updated);
  };

  const getGoogleCalendarUrl = (v: VisitAppointment) => {
    const startDateTime = `${v.date.replace(/-/g, '')}T${v.time.replace(':', '')}00`;
    const [h, m] = v.time.split(':').map(Number);
    const endH = (h + 1).toString().padStart(2, '0');
    const endDateTime = `${v.date.replace(/-/g, '')}T${endH}${m.toString().padStart(2, '0')}00`;

    const title = encodeURIComponent(`Visita Cliente: ${v.clientName} (${v.plantName})`);
    const details = encodeURIComponent(`Propósito: ${v.purpose}\nContacto: ${v.contactName} (${v.phone})\nAsesor: ${v.agentName}`);
    const location = encodeURIComponent(v.plantName);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
  };

  const downloadICalFile = (v: VisitAppointment) => {
    const startDateTime = `${v.date.replace(/-/g, '')}T${v.time.replace(':', '')}00`;
    const [h, m] = v.time.split(':').map(Number);
    const endH = (h + 1).toString().padStart(2, '0');
    const endDateTime = `${v.date.replace(/-/g, '')}T${endH}${m.toString().padStart(2, '0')}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MVL Maquinaria//Agenda Comercial//ES',
      'BEGIN:VEVENT',
      `UID:mvl-visit-${v.id}@mvlmaquinaria.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:Visita Comercial: ${v.clientName}`,
      `DESCRIPTION:Propósito: ${v.purpose}\\nContacto: ${v.contactName} (${v.phone})`,
      `LOCATION:${v.plantName}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Visita_${v.clientName.replace(/\s+/g, '_')}_${v.date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVisits = visits.filter(v => v.date === selectedDate);
  const totalProgramadas = visits.filter(v => v.status === 'programada').length;
  const totalCompletadas = visits.filter(v => v.status === 'completada').length;

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="bg-gradient-to-r from-[#0196C1] to-[#007398] p-6 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-black uppercase bg-white/20 px-2.5 py-1 rounded-full tracking-wider">Gestión Comercial & Visitas</span>
          <h2 className="text-xl font-black mt-1 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-amber-300" /> Agenda Interactiva de Visitas con Clientes
          </h2>
          <p className="text-xs text-sky-100 mt-1">Programa citas, da seguimiento en tiempo real y sincroniza con Google Calendar o tu móvil.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> Agendar Nueva Cita
        </button>
      </div>

      {/* Colorful Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border-l-4 border-sky-500 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400">Nuevas / Programadas</span>
            <p className="text-2xl font-black text-sky-600 mt-0.5">{totalProgramadas}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-l-4 border-emerald-500 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400">Citas Cerradas / Concluidas</span>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{totalCompletadas}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-l-4 border-indigo-500 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400">Total de Citas en Agenda</span>
            <p className="text-2xl font-black text-indigo-600 mt-0.5">{visits.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Calendar & Date Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Date picker */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-700 uppercase flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#0196C1]" /> Seleccionar Fecha en Calendario
          </h3>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#0196C1]"
          />

          {/* Quick list of upcoming dates with appointments */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase block">Citas Agendadas en la Fecha</span>
            <div className="flex justify-between items-center bg-sky-50/70 p-3 rounded-xl border border-sky-100">
              <span className="text-xs font-bold text-slate-700">Seleccionada ({selectedDate}):</span>
              <span className="text-xs font-black text-[#0196C1] bg-white px-2.5 py-1 rounded-lg border border-sky-200">
                {filteredVisits.length} citas
              </span>
            </div>
          </div>
        </div>

        {/* Right: Visits list for selected date with vivid color badges */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <span>Citas para el {selectedDate}</span>
            </h3>
            <span className="text-xs font-bold text-[#0196C1] bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              {filteredVisits.length} {filteredVisits.length === 1 ? 'cita' : 'citas'}
            </span>
          </div>

          {filteredVisits.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3 shadow-2xs">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No hay visitas programadas para esta fecha.</p>
              <p className="text-xs text-slate-400">Haz clic en "Agendar Nueva Cita" para programar una visita con un cliente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVisits.map(visit => (
                <div 
                  key={visit.id} 
                  className={`bg-white p-4 rounded-2xl border shadow-2xs space-y-3 transition-all ${
                    visit.status === 'completada' ? 'border-emerald-300 bg-emerald-50/20' : 'border-sky-300 bg-sky-50/10 hover:border-[#0196C1]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-mono font-bold px-3 py-1 rounded-lg text-white ${
                        visit.status === 'completada' ? 'bg-emerald-600' : 'bg-[#0196C1]'
                      }`}>
                        {visit.time} hrs
                      </span>
                      <h4 className="text-sm font-black text-slate-800">{visit.clientName}</h4>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wide ${
                        visit.status === 'completada' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-sky-100 text-sky-800 border border-sky-300'
                      }`}>
                        {visit.status === 'completada' ? '✓ Cita Cerrada / Concluida' : '🔵 Nueva Cita Programada'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(visit.id)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 cursor-pointer transition-all ${
                          visit.status === 'completada' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> {visit.status === 'completada' ? 'Marcar Programada' : 'Cerrar Cita'}
                      </button>

                      <a
                        href={getGoogleCalendarUrl(visit)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-[#0196C1] border border-sky-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                        title="Sincronizar con Google Calendar"
                      >
                        <ExternalLink className="w-3 h-3" /> Google Calendar
                      </a>

                      <button
                        type="button"
                        onClick={() => downloadICalFile(visit)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                        title="Descargar archivo .ics para calendario móvil"
                      >
                        <Download className="w-3 h-3" /> Móvil (.ics)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteVisit(visit.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        title="Eliminar cita"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0196C1] shrink-0" />
                      <span className="font-semibold truncate">Planta: {visit.plantName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0196C1] shrink-0" />
                      <span className="font-semibold truncate">Contacto: {visit.contactName || 'No especificado'} ({visit.phone || 'S/N'})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#0196C1] shrink-0" />
                      <span className="font-semibold truncate">Asesor: {visit.agentName}</span>
                    </div>
                  </div>

                  {visit.purpose && (
                    <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-700 font-medium border border-slate-100">
                      <strong>Propósito / Nota:</strong> {visit.purpose}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Agendar Nueva Visita */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#0196C1]" /> Programar Cita o Visita con Cliente
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Cliente / Razón Social *</label>
                <select
                  onChange={e => {
                    const found = clients.find(c => c.id === e.target.value);
                    if (found) {
                      setClientName(found.name);
                      if (found.plants && found.plants.length > 0) setPlantName(found.plants[0].name);
                      if (found.phone) setPhone(found.phone);
                    }
                  }}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-1.5 outline-none font-bold text-slate-700"
                >
                  <option value="">-- Seleccionar de clientes registrados (Opcional) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Nombre del cliente o empresa"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Planta / Sucursal</label>
                  <input
                    type="text"
                    placeholder="Planta Principal"
                    value={plantName}
                    onChange={e => setPlantName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="477-123-4567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Fecha de Visita *</label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Hora *</label>
                  <input
                    type="time"
                    required
                    value={visitTime}
                    onChange={e => setVisitTime(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Atención / Contacto en Planta</label>
                <input
                  type="text"
                  placeholder="Ing. Encargado de Mantenimiento"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Propósito de la Visita</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Presentación de propuesta económica, levantamiento de compresor..."
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Guardar Cita en Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
