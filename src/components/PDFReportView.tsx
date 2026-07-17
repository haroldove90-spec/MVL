/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorkOrder, Client, Equipment } from '../types';
import { FileDown, Printer, CheckSquare, Square, FileText, Check } from 'lucide-react';

interface PDFReportViewProps {
  workOrder: WorkOrder;
  client: Client;
  equipment: Equipment;
  onClose: () => void;
}

export default function PDFReportView({ workOrder, client, equipment, onClose }: PDFReportViewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col max-h-[90vh] shadow-2xl border border-slate-100 print:shadow-none print:border-none print:max-h-full">
        {/* Header Tools */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0196C1]" />
            <span className="font-bold text-slate-800 text-sm">Reporte Técnico Digital — {workOrder.code}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Descargar / Imprimir PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              Cerrar Vista
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
          <div className="border border-slate-200 rounded-2xl p-8 print:border-none print:p-0 space-y-6 max-w-3xl mx-auto">
            
            {/* Report Header Logo & Details */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4">
              <div className="space-y-2">
                <img src="https://appdesignproyectos.com/mvl.png" alt="MVL Logo" className="h-10 object-contain" />
                <p className="text-xs text-slate-500 font-medium">MVL CONTROL Y MANTENIMIENTO INDUSTRIAL</p>
              </div>
              <div className="text-left md:text-right space-y-1">
                <h1 className="text-lg font-extrabold text-slate-900">HOJA DE SERVICIO TÉCNICO</h1>
                <div className="inline-flex px-2.5 py-1 bg-[#0196C1]/10 text-[#0196C1] rounded-full text-xs font-bold">
                  {workOrder.code}
                </div>
                <p className="text-xs text-slate-500">Fecha: {workOrder.dateCompleted || workOrder.scheduledDate}</p>
              </div>
            </div>

            {/* Client & Equipment Summary (2 columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              {/* Client Info */}
              <div className="space-y-2">
                <h3 className="font-bold text-[#0196C1] text-xs uppercase tracking-wider">DATOS DEL CLIENTE</h3>
                <p className="font-bold text-slate-800 text-sm">{client.companyName}</p>
                <p><span className="text-slate-500">RFC:</span> {client.rfc}</p>
                <p><span className="text-slate-500">Email:</span> {client.email}</p>
                <p><span className="text-slate-500">Teléfono:</span> {client.phone}</p>
                <p><span className="text-slate-500">Contacto:</span> {client.contacts[0]?.name} ({client.contacts[0]?.role})</p>
              </div>

              {/* Equipment Info */}
              <div className="space-y-2">
                <h3 className="font-bold text-[#0196C1] text-xs uppercase tracking-wider">DATOS DEL EQUIPO</h3>
                <p className="font-bold text-slate-800 text-sm">{equipment.name}</p>
                <div className="grid grid-cols-2 gap-y-1 text-slate-600">
                  <p><span className="text-slate-500 font-medium">Marca:</span> {equipment.brand}</p>
                  <p><span className="text-slate-500 font-medium">Modelo:</span> {equipment.model}</p>
                  <p><span className="text-slate-500 font-medium">No. Serie:</span> {equipment.serialNumber}</p>
                  <p><span className="text-slate-500 font-medium">Horas Motor:</span> {workOrder.engineHours} Hrs</p>
                  <p><span className="text-slate-500 font-medium">Aceite:</span> {equipment.oilType}</p>
                  <p><span className="text-slate-500 font-medium">Filtros:</span> {equipment.filtersRequired.substring(0, 30)}...</p>
                </div>
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                LISTA DE VERIFICACIÓN (CHECKLIST)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {workOrder.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs py-1 border-b border-slate-50">
                    {item.checked ? (
                      <CheckSquare className="w-4 h-4 text-[#0196C1] flex-none" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 flex-none" />
                    )}
                    <span className={item.checked ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Consumed components */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                REFACCIONES E INSUMOS UTILIZADOS
              </h3>
              {workOrder.partsUsed.length > 0 ? (
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr>
                        <th className="p-2.5">Componente</th>
                        <th className="p-2.5 text-center">Cantidad</th>
                        <th className="p-2.5 text-right">Precio Unitario</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {workOrder.partsUsed.map((p) => (
                        <tr key={p.itemId}>
                          <td className="p-2.5 font-medium text-slate-800">{p.name}</td>
                          <td className="p-2.5 text-center text-slate-600">{p.quantity} pza(s)</td>
                          <td className="p-2.5 text-right text-slate-600">${p.price.toLocaleString('es-MX')}</td>
                          <td className="p-2.5 text-right font-semibold text-slate-800">
                            ${(p.price * p.quantity).toLocaleString('es-MX')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                  Ninguna refacción o consumible utilizado.
                </p>
              )}
            </div>

            {/* Observations / Technician logs */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider">DIAGNÓSTICO Y OBSERVACIONES TÉCNICAS</h3>
              <p className="text-slate-600 leading-relaxed italic">
                "{workOrder.observations || 'Sin observaciones adicionales registradas.'}"
              </p>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200/60 text-slate-500 text-[11px]">
                <p>Técnico Responsable: <span className="font-semibold text-slate-700">{workOrder.assignedTechnicianName}</span></p>
                <p>Estatus Reporte: <span className="font-semibold text-emerald-600">APROBADO & CONGELADO</span></p>
              </div>
            </div>

            {/* Evidences (Before & After) */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                EVIDENCIA FOTOGRÁFICA
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Antes de Intervención</p>
                  <div className="h-40 rounded-xl overflow-hidden border border-slate-100 bg-slate-100 flex items-center justify-center">
                    {workOrder.beforePhoto ? (
                      <img src={workOrder.beforePhoto} alt="Evidencia antes" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">Sin foto de evidencia</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Después de Intervención</p>
                  <div className="h-40 rounded-xl overflow-hidden border border-slate-100 bg-slate-100 flex items-center justify-center">
                    {workOrder.afterPhoto ? (
                      <img src={workOrder.afterPhoto} alt="Evidencia después" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">Sin foto de evidencia</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-around items-center gap-6">
              <div className="text-center space-y-1">
                <div className="w-40 h-16 border-b border-slate-300 flex items-center justify-center">
                  <span className="text-xs text-slate-400 italic">MVL Control Digital</span>
                </div>
                <p className="text-xs font-semibold text-slate-700">{workOrder.assignedTechnicianName}</p>
                <p className="text-[10px] text-slate-400 uppercase font-medium">Técnico de Campo</p>
              </div>

              <div className="text-center space-y-1">
                <div className="w-48 h-16 border-b border-slate-300 flex items-center justify-center bg-slate-50/50 rounded-lg p-2">
                  {workOrder.signature ? (
                    <img src={workOrder.signature} alt="Firma cliente" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-400">Sin firma del cliente</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-700">{workOrder.signatureName || 'Representante Autorizado'}</p>
                <p className="text-[10px] text-slate-400 uppercase font-medium">Firma de Conformidad (Planta)</p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
              MVL Control y Mantenimiento • Compresores y Maquinaria Industrial • {new Date().getFullYear()}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
