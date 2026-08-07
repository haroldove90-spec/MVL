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
  FileCheck, Shield, DollarSign, Wrench, ChevronRight, Eye, Printer, X, Sparkles
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
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState<Quote | null>(null);

  // Quote Category: standard | poliza | suministro_instalacion
  const [quoteCategory, setQuoteCategory] = useState<'standard' | 'poliza' | 'suministro_instalacion'>('standard');

  // New Quote Form State
  const [quoteType, setQuoteType] = useState<'vendedor' | 'cliente' | 'publico'>('vendedor');
  const [publicClientName, setPublicClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [selectedPlantName, setSelectedPlantName] = useState('Planta Principal');
  const [crmGiro, setCrmGiro] = useState('Inyección de Plástico / Manufactura');
  const [clientEmail, setClientEmail] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [concept, setConcept] = useState('');
  const [agentName, setAgentName] = useState('Ing. Leonardo Daniel Torres');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Policy Form State
  const [policyType, setPolicyType] = useState<'poliza_a' | 'poliza_b'>('poliza_a');
  const [policyVisitsPerYear, setPolicyVisitsPerYear] = useState<number>(3);
  const [policyItems, setPolicyItems] = useState<QuoteItem[]>([
    { partida: 1, description: 'Mantenimiento preventivo Minisplit 1 a 1.5 TR Alta prioridad', brand: 'Kaeser / Clima', quantity: 3, partNumber: 'POL-01', catalogPrice: 1550, total: 13950, deliveryTime: 'A programar' },
    { partida: 2, description: 'Mantenimiento preventivo Minisplit 2 a 3 TR Alta prioridad', brand: 'Kaeser / Clima', quantity: 1, partNumber: 'POL-02', catalogPrice: 1900, total: 5700, deliveryTime: 'A programar' },
    { partida: 3, description: 'Mantenimiento preventivo UPA de 4 a 10 TR Alta prioridad', brand: 'Clima Ind', quantity: 2, partNumber: 'POL-03', catalogPrice: 3262, total: 19572, deliveryTime: 'A programar' },
    { partida: 4, description: 'Mantenimiento preventivo Minisplit 1 a 1.5 TR Baja prioridad', brand: 'Kaeser / Clima', quantity: 14, partNumber: 'POL-04', catalogPrice: 1200, total: 33600, deliveryTime: 'A programar' },
    { partida: 5, description: 'Mantenimiento preventivo Minisplit 2 a 3 TR Baja prioridad', brand: 'Kaeser / Clima', quantity: 5, partNumber: 'POL-05', catalogPrice: 1680, total: 16800, deliveryTime: 'A programar' },
    { partida: 6, description: 'Mantenimiento preventivo UPA de 4 a 10 TR Baja prioridad', brand: 'Clima Ind', quantity: 5, partNumber: 'POL-06', catalogPrice: 2250, total: 22500, deliveryTime: 'A programar' }
  ]);

  // Supply & Installation State (2 tables)
  const [supplyEquipmentItems, setSupplyEquipmentItems] = useState<QuoteItem[]>([
    { partida: 1, description: 'Suministro minisplit 1 TR frío 220vac', brand: 'YORK', quantity: 1, partNumber: 'SOLO FRIO', catalogPrice: 17409.28, total: 17409.28, deliveryTime: '1 a 4 semanas' },
    { partida: 2, description: 'Suministro de bomba de dren de condensados', brand: 'COLDTEK', quantity: 1, partNumber: 'N/A', catalogPrice: 2500, total: 2500, deliveryTime: '1 a 4 semanas' },
    { partida: 3, description: 'Instalación y preparación para bomba de dren', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 1600, total: 1600, deliveryTime: 'INMEDIATO' },
    { partida: 4, description: 'Instalación de unidad evaporadora y condensadora', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 5000, total: 5000, deliveryTime: 'INMEDIATO' },
    { partida: 5, description: 'Servicio de presurización con nitrógeno', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 1200, total: 1200, deliveryTime: 'INMEDIATO' },
    { partida: 6, description: 'Revisión de estanquedad', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 500, total: 500, deliveryTime: 'INMEDIATO' },
    { partida: 7, description: 'Compensación de gas refrigerante R-32', brand: 'MVL', quantity: 2, partNumber: 'N/A', catalogPrice: 1500, total: 3000, deliveryTime: 'INMEDIATO' },
    { partida: 8, description: 'Ajuste de cálculo sobrecalentamiento y subenfriamiento', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 850, total: 850, deliveryTime: 'INMEDIATO' },
    { partida: 9, description: 'Servicio de tubería de cobre y canalización', brand: 'MIRAGE', quantity: 2, partNumber: 'N/A', catalogPrice: 1500, total: 3000, deliveryTime: 'INMEDIATO' },
    { partida: 10, description: 'Ménsula pared para condensador e instalación', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 3350, total: 3350, deliveryTime: 'INMEDIATO' }
  ]);

  const [supplyElectricalItems, setSupplyElectricalItems] = useState<QuoteItem[]>([
    { partida: 1, description: 'Tubería 3/4 pared delgada', brand: 'OMEGA', quantity: 24, partNumber: 'N/A', catalogPrice: 209.04, total: 5016.96, deliveryTime: 'INMEDIATO' },
    { partida: 2, description: 'Cable eléctrico 10 AWG 160 mts', brand: 'INDIANA', quantity: 1, partNumber: 'N/A', catalogPrice: 5270, total: 5270, deliveryTime: 'INMEDIATO' },
    { partida: 3, description: 'Cable eléctrico 12 AWG 80 mts', brand: 'INDIANA', quantity: 1, partNumber: 'N/A', catalogPrice: 2100, total: 2100, deliveryTime: 'INMEDIATO' },
    { partida: 4, description: 'Condulet OLB 13 mm pared delgada', brand: 'OMEGA', quantity: 12, partNumber: 'N/A', catalogPrice: 260, total: 3120, deliveryTime: 'INMEDIATO' },
    { partida: 5, description: 'Cople y Conector 13 mm pared delgada (24 pzas c/u)', brand: 'OMEGA', quantity: 2, partNumber: 'N/A', catalogPrice: 1020, total: 2040, deliveryTime: 'INMEDIATO' },
    { partida: 6, description: 'Interruptor 20 amp 2 polos SQD y Condulet C', brand: 'SQD/OMEGA', quantity: 1, partNumber: 'N/A', catalogPrice: 2096.56, total: 2096.56, deliveryTime: 'INMEDIATO' },
    { partida: 7, description: 'Soportería e insumos', brand: 'N/A', quantity: 1, partNumber: 'N/A', catalogPrice: 1500, total: 1500, deliveryTime: '1 a 2 días' },
    { partida: 8, description: 'Canalización y mano de obra eléctrica', brand: 'MVL', quantity: 1, partNumber: 'N/A', catalogPrice: 12086.20, total: 12086.20, deliveryTime: '1 semana' }
  ]);

  const [supplyScopeList, setSupplyScopeList] = useState<string[]>([
    '1. Suministro de equipo mini-split.',
    '2. Instalación de evaporadora.',
    '3. Instalación de condensadora.',
    '4. Instalación de bomba de condensados.',
    '5. Canalización de servicio de dren de condensados.',
    '6. Canalización de servicio de tubería cobre.',
    '7. Canalización de servicio eléctrico.',
    '8. Pruebas de hermeticidad de tubería con nitrógeno.',
    '9. Procedimiento de alto vacío en tubería para asegurar y alargar la vida útil del equipo hasta 250 Micrones.',
    '10. Compensación de gas refrigerante con cálculos de sobre calentamiento y sub enfriamiento.',
    '11. Pruebas de flujo de aire con anemómetro y termómetro.',
    '12. Recomendaciones de servicios preventivos posteriores.',
    '13. Canalización e instalación de tubería eléctrica pared delgada.',
    '14. Suministro e instalación de termomagnético 20 * 2 SQUARED.',
    '15. Canalización de cable eléctrico 10 AWG en tubería con tierra física 3 hilos.',
    '16. Conexión de uso rudo a mini Split. Condulet LB'
  ]);

  // Standard Equipment details
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

  // Table items for standard quote
  const [standardItems, setStandardItems] = useState<QuoteItem[]>([
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

    let subtotal = 0;
    let itemsToSave: QuoteItem[] = [];

    if (quoteCategory === 'standard') {
      itemsToSave = standardItems;
      subtotal = standardItems.reduce((sum, item) => sum + item.total, 0);
    } else if (quoteCategory === 'poliza') {
      itemsToSave = policyItems;
      subtotal = policyItems.reduce((sum, item) => sum + item.total, 0);
    } else if (quoteCategory === 'suministro_instalacion') {
      itemsToSave = [...supplyEquipmentItems, ...supplyElectricalItems];
      subtotal = itemsToSave.reduce((sum, item) => sum + item.total, 0);
    }

    const subtotalWithDiscount = subtotal * (1 - discountPercent / 100);
    const tax = subtotalWithDiscount * 0.16;
    const total = subtotalWithDiscount + tax;

    const folNum = quoteCategory === 'poliza' ? `${Date.now().toString().slice(-6)}GNG` :
                   quoteCategory === 'suministro_instalacion' ? `M2-${quotes.length + 1000}-GNG` :
                   `COT-2026-0${quotes.length + 1}`;

    const defaultConcept = quoteCategory === 'poliza'
      ? `Cotización de Póliza de Mantenimiento Anual Equipos de Climatización (${policyType === 'poliza_a' ? 'Póliza Tipo A - Reparaciones no incluidas' : 'Póliza Tipo B - Reparaciones incluidas'})`
      : quoteCategory === 'suministro_instalacion'
      ? `Cotización de Suministro e Instalación de Mini Split YORK y Canalización Eléctrica`
      : `Servicio ${serviceOption.replace('_', ' ')} - ${eqBrand} ${eqModel}`;

    const newQ: Quote = {
      id: 'q_' + Date.now(),
      folNum,
      clientId: selectedClientId,
      clientName: quoteType === 'publico' ? publicClientName : (selectedClient?.name || 'Cliente'),
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      concept: concept || defaultConcept,
      subtotal: subtotalWithDiscount,
      tax,
      total,
      status: discountPercent > 0 ? 'discount_requested' : 'sent',
      quoteType,
      quoteCategory,
      policyType,
      publicClientName,
      discountRequested: discountPercent > 0 ? discountPercent : undefined,
      agentName,
      plantName: selectedPlantName,
      crmGiro,
      whatsapp: clientWhatsapp,
      itemsTable: itemsToSave,
      policyDetails: quoteCategory === 'poliza' ? {
        policyType,
        visitsPerYear: policyVisitsPerYear,
        priorityHighHours: 12,
        priorityMidHours: 72,
        priorityLowDays: 20
      } : undefined,
      supplyInstallationDetails: quoteCategory === 'suministro_instalacion' ? {
        equipmentItems: supplyEquipmentItems,
        electricalItems: supplyElectricalItems,
        scopeList: supplyScopeList
      } : undefined,
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
    setSelectedQuoteForPreview(newQ); // Auto view created PDF preview!
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
          <span className="text-[10px] font-extrabold text-[#0196C1] uppercase tracking-wider bg-sky-50 px-2.5 py-1 rounded mb-1 inline-block">
            Módulo de Ventas & Generación de Cotizaciones Oficiales MVL
          </span>
          <h2 className="text-lg font-black text-slate-800">Cotizaciones, Pólizas Anuales & Suministros</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setQuoteCategory('standard');
              setActiveView('new_quote');
            }}
            className="px-3.5 py-2.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> [ Cotización Estándar ]
          </button>
          <button
            onClick={() => {
              setQuoteCategory('poliza');
              setActiveView('new_quote');
            }}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4" /> [ Cotización Póliza Anual ]
          </button>
          <button
            onClick={() => {
              setQuoteCategory('suministro_instalacion');
              setActiveView('new_quote');
            }}
            className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Wrench className="w-4 h-4" /> [ Suministro e Instalación ]
          </button>
          <button
            onClick={() => setActiveView('new_client')}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
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
                placeholder="Ej. GUALA DISPENSING MEXICO SA DE CV"
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
            <div>
              <span className="text-[10px] font-black uppercase text-[#0196C1] bg-sky-50 px-2 py-0.5 rounded">
                Categoría: {quoteCategory === 'poliza' ? 'Póliza Anual de Climatización' : quoteCategory === 'suministro_instalacion' ? 'Suministro e Instalación' : 'Estándar de Refacciones'}
              </span>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mt-1">
                <FileText className="w-5 h-5 text-[#0196C1]" /> 
                {quoteCategory === 'poliza' ? 'Cotizador de Póliza Anual de Mantenimiento' :
                 quoteCategory === 'suministro_instalacion' ? 'Cotizador de Suministro e Instalación (Equipos y Canalización)' :
                 'Generador de Cotización Industrial Estándar'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ← Volver al Listado
            </button>
          </div>

          {/* Selector de Categoría de Cotización */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setQuoteCategory('standard')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                quoteCategory === 'standard' ? 'bg-white border-[#0196C1] shadow-xs ring-1 ring-[#0196C1]' : 'bg-transparent border-transparent text-slate-600'
              }`}
            >
              <div className="text-xs font-black text-slate-800">1. Cotización Estándar</div>
              <div className="text-[10px] text-slate-500">Refacciones, repuestos y mantenimientos individuales</div>
            </button>

            <button
              type="button"
              onClick={() => setQuoteCategory('poliza')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                quoteCategory === 'poliza' ? 'bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-500' : 'bg-transparent border-transparent text-slate-600'
              }`}
            >
              <div className="text-xs font-black text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 2. Póliza Anual (Tipo A / B)
              </div>
              <div className="text-[10px] text-slate-500">Póliza anual de climatización / compresores con prioridades</div>
            </button>

            <button
              type="button"
              onClick={() => setQuoteCategory('suministro_instalacion')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                quoteCategory === 'suministro_instalacion' ? 'bg-white border-purple-500 shadow-xs ring-1 ring-purple-500' : 'bg-transparent border-transparent text-slate-600'
              }`}
            >
              <div className="text-xs font-black text-purple-800 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5" /> 3. Suministro e Instalación
              </div>
              <div className="text-[10px] text-slate-500">Suministro de equipos + Canalización Eléctrica (16 alcances)</div>
            </button>
          </div>

          {/* 1. Modalidad de Cotización */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase">Modalidad de Emisión</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setQuoteType('vendedor')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  quoteType === 'vendedor' ? 'bg-[#0196C1] text-white border-[#0196C1]' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                1. Agente (Vendedor / Ingeniero)
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quoteType === 'publico' ? (
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nombre del Comprador</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Sergio Molina"
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
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
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
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Giro Comercial / CRM</label>
              <input
                type="text"
                value={crmGiro}
                onChange={e => setCrmGiro(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Atención / Representante MVL</label>
              <input
                type="text"
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[#0196C1]"
              />
            </div>
          </div>

          {/* IF POLIZA TYPE SELECTED */}
          {quoteCategory === 'poliza' && (
            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200/80 space-y-4">
              <div className="flex justify-between items-center border-b border-emerald-200/60 pb-2">
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Configuración de Póliza Anual de Mantenimiento
                </h4>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Formato Oficial Póliza
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setPolicyType('poliza_a')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    policyType === 'poliza_a' ? 'bg-white border-emerald-600 shadow-sm ring-1 ring-emerald-500' : 'bg-emerald-50/50 border-emerald-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black text-emerald-900">PÓLIZA TIPO A</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Reparaciones NO incluidas</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    En los mantenimientos programados de periodo se realiza una revisión general de equipo realizando recomendaciones y procedimientos para evitar daños. Reparaciones y refacciones se cotizan aparte.
                  </p>
                </div>

                <div
                  onClick={() => setPolicyType('poliza_b')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    policyType === 'poliza_b' ? 'bg-white border-emerald-600 shadow-sm ring-1 ring-emerald-500' : 'bg-emerald-50/50 border-emerald-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black text-emerald-900">PÓLIZA TIPO B</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Reparaciones Incluidas (Mano de obra)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    En los mantenimientos programados de periodo se realiza revisión general y mantenimiento correctivo/reparación en mano de obra. Mantenimiento correctivo o reparación incluido en póliza (No incluye refacciones).
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Tiempos de Respuesta por Servicios Emergentes (Incluidos en Póliza)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                    <span className="font-extrabold text-red-700 block">Prioridad Alta</span>
                    <span className="text-slate-600">Respuesta: <strong>12 Horas</strong> (3 visitas por año)</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                    <span className="font-extrabold text-amber-700 block">Prioridad Media</span>
                    <span className="text-slate-600">Respuesta: <strong>72 Horas</strong> (3 visitas por año)</span>
                  </div>
                  <div className="bg-sky-50 p-2 rounded-lg border border-sky-100">
                    <span className="font-extrabold text-sky-700 block">Prioridad Baja</span>
                    <span className="text-slate-600">Respuesta: <strong>5 a 20 días</strong> o telefónica</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IF SUMINISTRO Y INSTALACION SELECTED */}
          {quoteCategory === 'suministro_instalacion' && (
            <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-200/80 space-y-4">
              <div className="flex justify-between items-center border-b border-purple-200/60 pb-2">
                <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-purple-600" /> Cotización de Suministro, Instalación y Canalización Eléctrica
                </h4>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  Formato Suministro + Canalización
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-purple-200 space-y-3">
                <h5 className="text-xs font-extrabold text-purple-900 uppercase">Lista de Alcances del Proyecto (16 Puntos Técnicos)</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700 font-medium">
                  {supplyScopeList.map((scope, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 bg-purple-50/40 p-1.5 rounded border border-purple-100/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span>{scope}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
              <Send className="w-4 h-4" /> Generar y Emitir Cotización Oficial
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
              {quotes.length} Cotizaciones Registradas
            </span>
          </div>

          <div className="space-y-3">
            {quotes.map(q => (
              <div key={q.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-sky-300 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-[#0196C1] uppercase bg-sky-100/70 px-2 py-0.5 rounded">
                      {q.folNum}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{q.clientName}</span>
                    <span className="text-[10px] text-slate-400">({q.date})</span>

                    {q.quoteCategory === 'poliza' && (
                      <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        Póliza Anual ({q.policyType === 'poliza_b' ? 'Tipo B' : 'Tipo A'})
                      </span>
                    )}

                    {q.quoteCategory === 'suministro_instalacion' && (
                      <span className="text-[9px] font-black uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                        Suministro e Instalación
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-700">{q.concept}</p>
                  <p className="text-[10px] text-slate-500">
                    Atiende: <strong>{q.agentName || 'Ing. Leonardo Daniel Torres'}</strong> | Planta: {q.plantName || 'Principal'}
                  </p>
                </div>

                <div className="flex flex-col md:items-end gap-1.5 w-full md:w-auto">
                  <span className="text-sm font-black text-slate-900">${q.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      q.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      q.status === 'discount_requested' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {q.status}
                    </span>

                    <button
                      onClick={() => setSelectedQuoteForPreview(q)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-400" /> Ver Documento PDF
                    </button>

                    <a
                      href={`https://wa.me/?text=Cotizaci%C3%B3n%20${q.folNum}%20por%20$${q.total}%20para%20${encodeURIComponent(q.clientName)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF DOCUMENT PREVIEW MODAL (Identical layout to uploaded PDFs) */}
      {selectedQuoteForPreview && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header Bar */}
            <div className="sticky top-0 bg-slate-900 text-white p-4 rounded-t-2xl flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0196C1]" />
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  Vista Previa Formato Oficial MVL PDF ({selectedQuoteForPreview.folNum})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setSelectedQuoteForPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content Box */}
            <div className="p-8 space-y-6 text-slate-800 text-xs font-sans">
              {/* PDF HEADER */}
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#0196C1] rounded-xl flex items-center justify-center text-white font-black text-lg">
                      MVL
                    </div>
                    <div>
                      <h1 className="text-base font-black text-slate-900">MVL Control y Mantenimiento</h1>
                      <p className="text-[10px] text-slate-500 font-bold">Razón social: Víctor Pedro Ramírez Barrios | RFC: RABV891002TF6</p>
                      <p className="text-[10px] text-slate-400">RÉGIMEN FISCAL: 612 Personas Físicas con Actividades Empresariales y Profesionales</p>
                      <p className="text-[10px] text-slate-400">José Pérez Marañón #118 B, San José del Consuelo II, CP 37217, León, Guanajuato</p>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-sky-50 p-3 rounded-xl border border-sky-100 min-w-[200px]">
                  <span className="text-[10px] font-extrabold text-[#0196C1] uppercase block">COTIZACIÓN</span>
                  <span className="text-sm font-black text-slate-900">{selectedQuoteForPreview.folNum}</span>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">León, Gto. A {selectedQuoteForPreview.date}</p>
                </div>
              </div>

              {/* CLIENT INFO BOX */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Cliente / Solicitante</span>
                  <span className="text-xs font-bold text-slate-800">{selectedQuoteForPreview.clientName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Empresa / Sucursal</span>
                  <span className="text-xs font-bold text-slate-800">{selectedQuoteForPreview.plantName || 'Planta Principal'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Giro de Empresa</span>
                  <span className="text-xs font-bold text-slate-800">{selectedQuoteForPreview.crmGiro || 'Manufactura e Industria'}</span>
                </div>
              </div>

              {/* OFFER TITLE */}
              <div className="bg-[#0196C1]/10 p-4 rounded-xl border border-[#0196C1]/30 text-center space-y-1">
                <p className="text-xs text-slate-700">
                  <strong>MVL Control y Mantenimiento</strong> agradece la oportunidad que nos brinda y se complace en presentarle la oferta por:
                </p>
                <h2 className="text-sm font-black text-[#0196C1] uppercase">
                  {selectedQuoteForPreview.concept}
                </h2>
              </div>

              {/* TABLE 1: Equipment / Partidas */}
              {selectedQuoteForPreview.itemsTable && selectedQuoteForPreview.itemsTable.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {selectedQuoteForPreview.quoteCategory === 'suministro_instalacion' ? 'Precio de Instalación y Suministro de Equipo' : 'Desglose de Partidas'}
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[9px] border-b border-slate-200">
                          <th className="py-2 px-2.5">Partida</th>
                          <th className="py-2 px-2.5">Descripción</th>
                          <th className="py-2 px-2.5">Marca</th>
                          <th className="py-2 px-2.5">Cantidad</th>
                          <th className="py-2 px-2.5">No. Parte</th>
                          <th className="py-2 px-2.5 text-right">Precio Unitario MXN</th>
                          <th className="py-2 px-2.5 text-right">Total MXN</th>
                          <th className="py-2 px-2.5">Tiempo Entrega</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedQuoteForPreview.itemsTable.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 font-extrabold text-slate-600">{item.partida || i + 1}</td>
                            <td className="py-2 px-2.5 font-bold text-slate-800">{item.description}</td>
                            <td className="py-2 px-2.5 font-semibold text-[#0196C1]">{item.brand || 'MVL'}</td>
                            <td className="py-2 px-2.5 font-bold">{item.quantity}</td>
                            <td className="py-2 px-2.5 font-mono text-slate-500">{item.partNumber || 'N/A'}</td>
                            <td className="py-2 px-2.5 text-right font-medium">${item.catalogPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-900">${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 px-2.5 font-bold text-[10px] text-slate-600">{item.deliveryTime || 'A programar'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TABLE 2: If Suministro / Canalización Eléctrica */}
              {selectedQuoteForPreview.supplyInstallationDetails?.electricalItems && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Precio de Canalización Eléctrica con Tubería Etiqueta Verde Pared Delgada / Condulet
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[9px] border-b border-slate-200">
                          <th className="py-2 px-2.5">Partida</th>
                          <th className="py-2 px-2.5">Descripción</th>
                          <th className="py-2 px-2.5">Marca</th>
                          <th className="py-2 px-2.5">Cantidad</th>
                          <th className="py-2 px-2.5 text-right">Precio Unitario MXN</th>
                          <th className="py-2 px-2.5 text-right">Total MXN</th>
                          <th className="py-2 px-2.5">Tiempo Entrega</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedQuoteForPreview.supplyInstallationDetails.electricalItems.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 font-extrabold text-slate-600">{item.partida || i + 1}</td>
                            <td className="py-2 px-2.5 font-bold text-slate-800">{item.description}</td>
                            <td className="py-2 px-2.5 font-semibold text-purple-600">{item.brand || 'OMEGA'}</td>
                            <td className="py-2 px-2.5 font-bold">{item.quantity}</td>
                            <td className="py-2 px-2.5 text-right font-medium">${item.catalogPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-900">${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 px-2.5 font-bold text-[10px] text-slate-600">{item.deliveryTime || 'INMEDIATO'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TOTALS SUMMARY BOX */}
              <div className="flex justify-end pt-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full sm:w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">${selectedQuoteForPreview.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA (16%):</span>
                    <span className="font-bold">${selectedQuoteForPreview.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-200">
                    <span>TOTAL MDN:</span>
                    <span className="text-[#0196C1]">${selectedQuoteForPreview.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                </div>
              </div>

              {/* SCOPE LIST IF PRESENT */}
              {selectedQuoteForPreview.supplyInstallationDetails?.scopeList && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase">Alcance del Proyecto de Instalación</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-slate-700">
                    {selectedQuoteForPreview.supplyInstallationDetails.scopeList.map((s, idx) => (
                      <div key={idx}>• {s}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* GENERAL CONDITIONS & CLAUSES */}
              <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-[10px] text-slate-600 leading-relaxed">
                <h4 className="font-black text-slate-800 uppercase border-b border-slate-200 pb-1">Condiciones Generales de Venta & Cláusulas</h4>
                <ol className="list-decimal pl-4 space-y-1">
                  <li><strong>Tiempo de entrega:</strong> DDP León, Gto, México (A considerar según disponibilidad).</li>
                  <li><strong>Lugar y Condiciones de entrega:</strong> Entrega en empresa en la fecha acordada por el cliente. Al autorizar el pedido se emitirá factura y pago a los 30 días posteriores al servicio. Para orden de pedido es necesario emitir Orden de Compra o factura del responsable legal.</li>
                  <li><strong>Vigencia de oferta:</strong> 30 días a partir de la fecha de esta cotización.</li>
                  <li><strong>Causas de fuerza mayor:</strong> El vendedor no será responsable por retrasos en entregas causadas por causas razonablemente fuera de su control.</li>
                  <li><strong>REPSE & Seguros:</strong> Los técnicos de MVL estarán debidamente asegurados y cumplirán con contrato REPSE al momento de la ejecución.</li>
                  <li><strong>Cancelación u OC:</strong> La cancelación de la OC por refacciones o servicios genera un cargo del 30% del valor total de la Orden de Compra.</li>
                </ol>
              </div>

              {/* SIGNATURE AREA */}
              <div className="pt-6 border-t border-slate-200 flex flex-col items-center justify-center text-center space-y-1">
                <div className="font-serif italic text-lg text-slate-700 font-bold border-b border-slate-300 pb-1 px-8">
                  Ing. Leonardo Daniel Torres Ojeda
                </div>
                <p className="text-xs font-bold text-slate-800">Departamento de ingeniería / soporte técnico</p>
                <p className="text-[10px] text-slate-500">MVL Control y Mantenimiento | cel. 477 4047421 | ltorres.mvl@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
