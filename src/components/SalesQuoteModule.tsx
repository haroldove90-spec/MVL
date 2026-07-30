/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, Equipment, InventoryItem, Quote, QuoteItem, Staff } from '../types';
import { INITIAL_QUOTES, loadFromStorage, saveToStorage } from '../mockData';
import { 
  FileText, Plus, UserPlus, Send, CheckCircle2, Clock, XCircle, 
  AlertTriangle, Phone, Mail, MessageSquare, Building2, Upload, 
  FileCheck, Shield, DollarSign, Wrench, ChevronRight, Eye
} from 'lucide-react';

interface SalesQuoteModuleProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  equipment: Equipment[];
  inventory: InventoryItem[];
  staff: Staff[];
}

export default function SalesQuoteModule({
  clients,
  setClients,
  equipment,
  inventory,
  staff
}: SalesQuoteModuleProps) {
  const [quotes, setQuotes] = useState<Quote[]>(() =>
    loadFromStorage<Quote[]>('mvl_quotes', INITIAL_QUOTES)
  );

  const [activeView, setActiveView] = useState<'list' | 'new_quote' | 'new_client'>('list');

  // New Quote Form State
  const [quoteType, setQuoteType] = useState<'vendedor' | 'cliente' | 'publico'>('vendedor');
  const [publicClientName, setPublicClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [selectedPlantName, setSelectedPlantName] = useState('Planta Principal');
  const [crmGiro, setCrmGiro] = useState('Manufactura e Industria');
  const [clientEmail, setClientEmail] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [concept, setConcept] = useState('');
  const [agentName, setAgentName] = useState('Mariana Valdez');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Equipment detail inside quote
  const [eqMode, setEqMode] = useState<'venta' | 'renta'>('venta');
  const [eqType, setEqType] = useState<'Compresor' | 'Secador' | 'Aceite' | 'Otros'>('Compresor');
  const [eqBrand, setEqBrand] = useState('Kaeser');
  const [eqModel, setEqModel] = useState('BSD 50');
  const [eqSerial, setEqSerial] = useState('');
  const [eqCapacity, setEqCapacity] = useState('50 HP');
  const [serviceOption, setServiceOption] = useState<'preventivo_2000' | 'preventivo_4000' | 'preventivo_6000' | 'correctivo' | 'otros'>('preventivo_2000');

  // Plant Access Reqs
  const [imssPayment, setImssPayment] = useState(true);
  const [imssValidity, setImssValidity] = useState(true);
  const [medicalCerts, setMedicalCerts] = useState(true);
  const [riskAssessment, setRiskAssessment] = useState(true);
  const [otherAccessReqs, setOtherAccessReqs] = useState('');

  // Missing prices list
  const [missingPrices, setMissingPrices] = useState<{ description: string; partNumber: string; requestedPrice: number }[]>([]);
  const [newMissingDesc, setNewMissingDesc] = useState('');
  const [newMissingPartNum, setNewMissingPartNum] = useState('');

  // Table items for first time quote
  const [items, setItems] = useState<QuoteItem[]>([
    { partida: 1, description: 'Filtro de Aire Kaeser 6.2012.0', brand: 'Kaeser', quantity: 1, partNumber: '6.2012.0', catalogPrice: 1250, total: 1250, deliveryTime: 'Inmediata' },
    { partida: 2, description: 'Aceite Sigma Fluid S-460 (19L)', brand: 'Kaeser', quantity: 1, partNumber: 'S-460', catalogPrice: 5400, total: 5400, deliveryTime: 'Inmediata' }
  ]);

  // New Client Modal Form
  const [newClientName, setNewClientName] = useState('');
  const [newClientRfc, setNewClientRfc] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [isParticular, setIsParticular] = useState(false);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleAddMissingPrice = () => {
    if (!newMissingDesc) return;
    setMissingPrices([...missingPrices, { description: newMissingDesc, partNumber: newMissingPartNum, requestedPrice: 0 }]);
    setNewMissingDesc('');
    setNewMissingPartNum('');
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const subtotalWithDiscount = subtotal * (1 - discountPercent / 100);
    const tax = subtotalWithDiscount * 0.16;
    const total = subtotalWithDiscount + tax;

    const folNum = `COT-2026-0${quotes.length + 1}`;
    const newQ: Quote = {
      id: 'q_' + Date.now(),
      folNum,
      clientId: selectedClientId,
      clientName: quoteType === 'publico' ? publicClientName : (selectedClient?.name || 'Cliente'),
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      concept: concept || `Servicio ${serviceOption.replace('_', ' ')} - ${eqBrand} ${eqModel}`,
      subtotal: subtotalWithDiscount,
      tax,
      total,
      status: discountPercent > 0 ? 'discount_requested' : 'sent',
      quoteType,
      publicClientName,
      discountRequested: discountPercent > 0 ? discountPercent : undefined,
      agentName,
      plantName: selectedPlantName,
      crmGiro,
      whatsapp: clientWhatsapp,
      itemsTable: items,
      plantAccessReqs: {
        imssPayment,
        imssRightsValidity: imssValidity,
        medicalCertificates: medicalCerts,
        riskAssessmentForm: riskAssessment,
        others: otherAccessReqs
      },
      equipmentDetails: {
        brand: eqBrand,
        model: eqModel,
        serialNumber: eqSerial,
        capacity: eqCapacity,
        serviceType: serviceOption,
        mode: eqMode
      },
      missingPricesList: missingPrices.length > 0 ? missingPrices : undefined
    };

    const updated = [newQ, ...quotes];
    setQuotes(updated);
    saveToStorage('mvl_quotes', updated);
    setActiveView('list');
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;
    const newC: Client = {
      id: 'c_' + Date.now(),
      name: newClientName,
      companyName: newClientName + (isParticular ? '' : ' S.A. de C.V.'),
      rfc: newClientRfc || 'XAXX010101000',
      email: newClientEmail,
      phone: newClientPhone,
      isIndependent: isParticular,
      plants: [{ id: 'p_1', name: 'Planta Principal', address: 'Dirección Registrada', city: 'Monterrey, NL' }],
      contacts: [{ name: newClientName, role: isParticular ? 'Cliente Particular' : 'Contacto Comercial', phone: newClientPhone, email: newClientEmail }]
    };
    const updated = [newC, ...clients];
    setClients(updated);
    saveToStorage('mvl_clients', updated);
    setSelectedClientId(newC.id);
    setActiveView('new_quote');
    setNewClientName('');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <span className="text-[10px] font-extrabold text-[#0196C1] uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded mb-1 inline-block">
            Módulo de Ventas / Cotización (Página 2, 3 y 4 PDF)
          </span>
          <h2 className="text-lg font-black text-slate-800">Cotizaciones, Descuentos & Acceso a Planta</h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('new_quote')}
            className="px-4 py-2.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> [ Nueva Cotización ]
          </button>
          <button
            onClick={() => setActiveView('new_client')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" /> [ Nuevo Cliente ]
          </button>
        </div>
      </div>

      {/* VIEW: New Client Modal Form */}
      {activeView === 'new_client' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 max-w-xl mx-auto">
          <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-2">
            Alta de Nuevo Cliente Comercial / Particular
          </h3>

          <form onSubmit={handleCreateClient} className="space-y-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nombre Comercial / Empresa</label>
              <input
                type="text"
                required
                placeholder="Ej. Metales del Norte S.A. o Juan Pérez"
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0196C1] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">RFC</label>
                <input
                  type="text"
                  placeholder="XAXX010101000"
                  value={newClientRfc}
                  onChange={e => setNewClientRfc(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0196C1] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="81-8123-4567"
                  value={newClientPhone}
                  onChange={e => setNewClientPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0196C1] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="contacto@cliente.com"
                value={newClientEmail}
                onChange={e => setNewClientEmail(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0196C1] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="particular_check"
                checked={isParticular}
                onChange={e => setIsParticular(e.target.checked)}
                className="rounded text-[#0196C1] focus:ring-[#0196C1]"
              />
              <label htmlFor="particular_check" className="text-xs font-bold text-slate-700">
                Marcar como "Particular Independiente" (Sin RFC / Venta directa)
              </label>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#0196C1] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Guardar Cliente e Iniciar Cotización
              </button>
              <button
                type="button"
                onClick={() => setActiveView('list')}
                className="py-2.5 px-4 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: New Quote Form */}
      {activeView === 'new_quote' && (
        <form onSubmit={handleSaveQuote} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0196C1]" /> Generador de Cotización Industrial
            </h3>
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ← Volver al Listado
            </button>
          </div>

          {/* 1. Modalidad de Cotización */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase">1. Modalidad de Generación</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setQuoteType('vendedor')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  quoteType === 'vendedor' ? 'bg-[#0196C1] text-white border-[#0196C1]' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                1. Agente (Vendedor)
              </button>
              <button
                type="button"
                onClick={() => setQuoteType('cliente')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  quoteType === 'cliente' ? 'bg-[#0196C1] text-white border-[#0196C1]' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                2. Cliente (Requiere Validación)
              </button>
              <button
                type="button"
                onClick={() => setQuoteType('publico')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  quoteType === 'publico' ? 'bg-[#0196C1] text-white border-[#0196C1]' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                3. Venta Público (Solo Nombre)
              </button>
            </div>
          </div>

          {/* 2. Datos del Cliente / CRM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quoteType === 'publico' ? (
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nombre del Comprador</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Juan Pérez"
                  value={publicClientName}
                  onChange={e => setPublicClientName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Seleccionar Cliente</label>
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.isIndependent ? '(Particular)' : ''}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Planta / Sucursal</label>
              <input
                type="text"
                value={selectedPlantName}
                onChange={e => setSelectedPlantName(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Directorio CRM (Giro de Empresa)</label>
              <input
                type="text"
                value={crmGiro}
                onChange={e => setCrmGiro(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          {/* 3. Detalle de Equipo / Refacciones */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#0196C1]" /> Detalle del Equipo para Mantenimiento / Alta
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Modalidad</label>
                <select
                  value={eqMode}
                  onChange={e => setEqMode(e.target.value as any)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                >
                  <option value="venta">Venta</option>
                  <option value="renta">Renta</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Tipo de Equipo</label>
                <select
                  value={eqType}
                  onChange={e => setEqType(e.target.value as any)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                >
                  <option value="Compresor">Compresor</option>
                  <option value="Secador">Secador</option>
                  <option value="Aceite">Aceite / Lubricante</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Marca / Modelo</label>
                <input
                  type="text"
                  value={`${eqBrand} ${eqModel}`}
                  onChange={e => {
                    const parts = e.target.value.split(' ');
                    setEqBrand(parts[0] || '');
                    setEqModel(parts.slice(1).join(' ') || '');
                  }}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">No. Serie / Placa Foto</label>
                <input
                  type="text"
                  placeholder="KAE-9921-X"
                  value={eqSerial}
                  onChange={e => setEqSerial(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Opciones de Mantenimiento / Servicio</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'preventivo_2000', label: 'Preventivo 2000 hrs' },
                  { id: 'preventivo_4000', label: 'Preventivo 4000 hrs' },
                  { id: 'preventivo_6000', label: 'Preventivo 6000 hrs' },
                  { id: 'correctivo', label: 'Correctivo / Solicitud de Precio' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setServiceOption(opt.id as any)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer whitespace-nowrap ${
                      serviceOption === opt.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Solicitud de Precios Faltantes y Descuento */}
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/70 space-y-3">
            <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Precios Faltantes & Autorización de Descuentos
            </h4>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Descripción del ítem sin precio en catálogo..."
                value={newMissingDesc}
                onChange={e => setNewMissingDesc(e.target.value)}
                className="flex-1 text-xs p-2 bg-white border border-amber-200 rounded-lg outline-none"
              />
              <input
                type="text"
                placeholder="No. Parte"
                value={newMissingPartNum}
                onChange={e => setNewMissingPartNum(e.target.value)}
                className="w-32 text-xs p-2 bg-white border border-amber-200 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={handleAddMissingPrice}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                + Solicitar Precio
              </button>
            </div>

            {missingPrices.length > 0 && (
              <div className="space-y-1">
                {missingPrices.map((mp, idx) => (
                  <div key={idx} className="text-xs bg-white p-2 rounded-lg border border-amber-200 flex justify-between">
                    <span>{mp.description} ({mp.partNumber || 'S/N'})</span>
                    <span className="font-bold text-amber-700">Pendiente Autorización Socios / Venta</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Solicitar Descuento (%):</label>
              <input
                type="number"
                min="0"
                max="30"
                value={discountPercent}
                onChange={e => setDiscountPercent(Number(e.target.value))}
                className="w-20 text-xs p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
              />
              <span className="text-[10px] text-slate-400">
                (Los descuentos mayores al 5% requieren previa autorización de Socios)
              </span>
            </div>
          </div>

          {/* 5. Requerimientos para Acceso a Planta */}
          <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-3">
            <h4 className="text-xs font-black text-[#0196C1] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Requerimientos para Acceso a Planta (Previo a Cotizar)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={imssPayment} onChange={e => setImssPayment(e.target.checked)} className="rounded text-[#0196C1]" />
                Pago IMSS
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={imssValidity} onChange={e => setImssValidity(e.target.checked)} className="rounded text-[#0196C1]" />
                Vigencia Derechos IMSS
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={medicalCerts} onChange={e => setMedicalCerts(e.target.checked)} className="rounded text-[#0196C1]" />
                Certificados Médicos
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={riskAssessment} onChange={e => setRiskAssessment(e.target.checked)} className="rounded text-[#0196C1]" />
                Evaluación Riesgos
              </label>
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-3 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Finalizar y Generar Cotización
            </button>
          </div>
        </form>
      )}

      {/* VIEW: List of Quotes */}
      {activeView === 'list' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800">Historial de Cotizaciones Emitidas</h3>
            <span className="text-xs font-bold text-[#0196C1] bg-sky-50 px-2.5 py-1 rounded-lg">
              {quotes.length} Cotizaciones
            </span>
          </div>

          <div className="space-y-3">
            {quotes.map(q => (
              <div key={q.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-sky-300 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#0196C1] uppercase bg-sky-100/70 px-2 py-0.5 rounded">
                      {q.folNum}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{q.clientName}</span>
                    <span className="text-[10px] text-slate-400">({q.date})</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700">{q.concept}</p>
                  <p className="text-[10px] text-slate-500">
                    Agente: <strong>{q.agentName || 'Mariana V.'}</strong> | Planta: {q.plantName || 'Principal'}
                  </p>
                </div>

                <div className="flex flex-col md:items-end gap-1.5 w-full md:w-auto">
                  <span className="text-sm font-black text-slate-900">${q.total.toLocaleString('es-MX')} MXN</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      q.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      q.status === 'discount_requested' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {q.status}
                    </span>

                    {/* Quick share buttons via WhatsApp / Email as required in Page 2 */}
                    <a
                      href={`https://wa.me/?text=Cotizaci%C3%B3n%20${q.folNum}%20por%20$${q.total}%20para%20${encodeURIComponent(q.clientName)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> WhatsApp
                    </a>
                    <a
                      href={`mailto:?subject=Cotizacion ${q.folNum}&body=Cotizacion por $${q.total}`}
                      className="p-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" /> Email
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
