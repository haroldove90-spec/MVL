/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, CompanyTaxDoc, Quote, WorkOrder } from '../types';
import { INITIAL_COMPANY_TAX_DOCS, INITIAL_QUOTES, loadFromStorage, saveToStorage } from '../mockData';
import { 
  FileCheck, ShieldAlert, Upload, CheckCircle2, AlertTriangle, 
  Building2, Plus, Send, FileText, Clock, Calendar, Check, Search, Download
} from 'lucide-react';

interface AccountingDashboardProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  workOrders: WorkOrder[];
}

export default function AccountingDashboard({
  clients,
  setClients,
  workOrders
}: AccountingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'fiscal_mvl' | 'billing' | 'clients_fiscal'>('fiscal_mvl');

  // Company Tax Documents State
  const [taxDocs, setTaxDocs] = useState<CompanyTaxDoc[]>(() => 
    loadFromStorage<CompanyTaxDoc[]>('mvl_tax_docs', INITIAL_COMPANY_TAX_DOCS)
  );

  // Quotes / OCs to Invoice State
  const [quotes, setQuotes] = useState<Quote[]>(() =>
    loadFromStorage<Quote[]>('mvl_quotes', INITIAL_QUOTES)
  );

  // Invoices sent tracking
  const [sentInvoices, setSentInvoices] = useState<{ id: string; quoteId: string; invoiceNum: string; sentDate: string; dueDate: string }[]>(() =>
    loadFromStorage('mvl_sent_invoices', [
      { id: 'inv1', quoteId: 'q1', invoiceNum: 'FAC-2026-089', sentDate: '2026-07-21', dueDate: '2026-08-20' }
    ])
  );

  // New Tax Doc Form
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCat, setNewDocCat] = useState<'CSF' | 'Opinión SAT' | 'Acta Constitutiva' | 'Comprobante Domicilio' | 'Póliza Seguro'>('Opinión SAT');
  const [newDocPeriod, setNewDocPeriod] = useState('Julio 2026 - Semana 2');

  // Form to issue invoice
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [customInvoiceNum, setCustomInvoiceNum] = useState('FAC-2026-090');

  const handleAddTaxDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle) return;
    const doc: CompanyTaxDoc = {
      id: 'ctd_' + Date.now(),
      title: newDocTitle,
      category: newDocCat,
      period: newDocPeriod,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'valid'
    };
    const updated = [doc, ...taxDocs];
    setTaxDocs(updated);
    saveToStorage('mvl_tax_docs', updated);
    setNewDocTitle('');
  };

  const handleIssueInvoice = (quote: Quote) => {
    const sentDate = new Date().toISOString().split('T')[0];
    const client = clients.find(c => c.id === quote.clientId);
    const creditDays = 30;
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + creditDays);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const newInv = {
      id: 'inv_' + Date.now(),
      quoteId: quote.id,
      invoiceNum: customInvoiceNum,
      sentDate,
      dueDate
    };
    const updatedSent = [newInv, ...sentInvoices];
    setSentInvoices(updatedSent);
    saveToStorage('mvl_sent_invoices', updatedSent);

    // Update quote status
    const updatedQuotes = quotes.map(q => q.id === quote.id ? { ...q, status: 'approved' as const } : q);
    setQuotes(updatedQuotes);
    saveToStorage('mvl_quotes', updatedQuotes);
    setSelectedQuoteId(null);
  };

  const hasMissingFiscalDocs = taxDocs.some(d => d.status === 'missing' || d.status === 'renewal_needed');

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#282829] to-slate-800 text-white p-6 rounded-2xl shadow-md border-l-4 border-[#0196C1] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 bg-[#0196C1]/20 text-[#0196C1] rounded-md text-[10px] font-extrabold uppercase tracking-wider mb-1">
            Rol 3: Contabilidad & Salud Fiscal
          </span>
          <h2 className="text-xl font-black text-white">Gestión Fiscal, Emisión de Facturas y Cumplimiento</h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Expediente fiscal actualizado de MVL, facturación directa sobre cotizaciones/OC y control de días de crédito.
          </p>
        </div>

        {hasMissingFiscalDocs ? (
          <div className="bg-amber-500/20 border border-amber-400/40 p-3 rounded-xl flex items-center gap-2 text-amber-300 text-xs font-semibold">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Alerta: Actualizar Opinión SAT / CSF de la semana</span>
          </div>
        ) : (
          <div className="bg-emerald-500/20 border border-emerald-400/40 p-3 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Expediente Fiscal 100% Al Día</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('fiscal_mvl')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'fiscal_mvl'
              ? 'bg-white border-t-2 border-x border-[#0196C1] text-[#0196C1] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Módulo 3.1: Expediente Fiscal MVL
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-white border-t-2 border-x border-[#0196C1] text-[#0196C1] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Módulo 3.2: Facturación & Cotizaciones/OC
        </button>

        <button
          onClick={() => setActiveTab('clients_fiscal')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'clients_fiscal'
              ? 'bg-white border-t-2 border-x border-[#0196C1] text-[#0196C1] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Alta Fiscal de Clientes & Crédito
        </button>
      </div>

      {/* Tab 3.1: Expediente Fiscal MVL */}
      {activeTab === 'fiscal_mvl' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* List of uploaded documents */}
          <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Expediente Fiscal Actualizado de MVL</h3>
                <p className="text-[11px] text-slate-400">Control periódico (Semanas 1 y 2 de cada mes) para acceso a cliente</p>
              </div>
              <span className="px-2.5 py-1 bg-sky-50 text-[#0196C1] font-bold text-xs rounded-lg">
                {taxDocs.length} Documentos
              </span>
            </div>

            <div className="space-y-3">
              {taxDocs.map(doc => (
                <div key={doc.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex justify-between items-center gap-3 hover:border-sky-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      doc.status === 'valid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{doc.title}</h4>
                      <p className="text-[10px] text-slate-500">Categoría: {doc.category} | Periodo: {doc.period}</p>
                      <span className="text-[9px] text-slate-400">Subido el: {doc.uploadDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      doc.status === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.status === 'valid' ? 'VIGENTE / AL DÍA' : 'REQUIERE ACTUALIZACIÓN'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form to upload / update fiscal docs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#0196C1]" /> Cargar Documento Fiscal (Semanal)
            </h3>
            
            <form onSubmit={handleAddTaxDoc} className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nombre del Documento</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Opinión 32D Positiva SAT - Semana 1"
                  value={newDocTitle}
                  onChange={e => setNewDocTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0196C1] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Tipo de Documento</label>
                <select
                  value={newDocCat}
                  onChange={e => setNewDocCat(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0196C1] outline-none"
                >
                  <option value="Opinión SAT">Opinión SAT 32D</option>
                  <option value="CSF">Constancia de Situación Fiscal (CSF)</option>
                  <option value="Acta Constitutiva">Acta Constitutiva</option>
                  <option value="Comprobante Domicilio">Comprobante Domicilio</option>
                  <option value="Póliza Seguro">Póliza Seguro Responsabilidad Civil</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Periodo / Semana</label>
                <input
                  type="text"
                  value={newDocPeriod}
                  onChange={e => setNewDocPeriod(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0196C1] outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Registrar Documento Fiscal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3.2: Facturación & Cotizaciones / OC */}
      {activeTab === 'billing' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Emisión y Registro de Facturas a Clientes</h3>
              <p className="text-[11px] text-slate-400">Enlazado directamente con Cotizaciones y Órdenes de Compra (OC)</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
              {sentInvoices.length} Facturas Emitidas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map(q => {
              const client = clients.find(c => c.id === q.clientId);
              const sentInv = sentInvoices.find(si => si.quoteId === q.id);

              return (
                <div key={q.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold text-[#0196C1] uppercase bg-sky-50 px-2 py-0.5 rounded">
                        {q.folNum}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">{q.concept}</h4>
                      <p className="text-xs text-slate-600 font-medium">Cliente: {q.clientName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-800 block">${q.total.toLocaleString('es-MX')} MXN</span>
                      <span className="text-[10px] text-slate-400">IVA Inc.</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 border-t border-slate-200/60 pt-2 flex justify-between items-center">
                    <span>RFC Cliente: <strong>{client?.rfc || 'GIM920412H89'}</strong></span>
                    <span>Estatus Cotización: <strong className="uppercase text-[#0196C1]">{q.status}</strong></span>
                  </div>

                  {sentInv ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex justify-between items-center text-xs text-emerald-900 font-bold">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Factura Emitida: {sentInv.invoiceNum}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700">Vence: {sentInv.dueDate}</span>
                    </div>
                  ) : (
                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => handleIssueInvoice(q)}
                        className="flex-1 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Generar & Enviar Factura SAT
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3.3: Alta Fiscal de Clientes & Crédito */}
      {activeTab === 'clients_fiscal' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800">Catálogo Fiscal de Clientes & Días de Crédito</h3>
            <p className="text-[11px] text-slate-400">Validación de RFC, Dirección Fiscal y límite financiero antes de emisión</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map(c => (
              <div key={c.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{c.companyName || c.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">RFC: {c.rfc}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg">
                    VERIFICADO SAT
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Días de Crédito</span>
                    <span className="font-bold text-slate-800">30 Días</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Límite Autorizado</span>
                    <span className="font-bold text-slate-800">$250,000 MXN</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0196C1]" />
                  <span>Correo Facturación: {c.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
