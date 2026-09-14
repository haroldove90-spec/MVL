/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Upload, FileSpreadsheet, FileText, Check, AlertTriangle, 
  X, RefreshCw, Layers, Package, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';
import { CatalogItem } from '../../types';
import { 
  parseCatalogFromPdf, 
  parseCatalogFromExcel, 
  parseCatalogText,
  ParsedCatalogRow,
  CatalogCategory,
  generateUUID
} from '../../lib/catalogMasterData';

interface CatalogImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CatalogCategory[];
  onImportItems: (newItems: CatalogItem[], mode: 'append' | 'replace') => void;
}

export default function CatalogImportModal({
  isOpen,
  onClose,
  categories,
  onImportItems
}: CatalogImportModalProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedCatalogRow[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [parseLog, setParseLog] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setErrorMsg('');
    setParseLog('');
    setIsParsing(true);
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

    try {
      const buffer = await file.arrayBuffer();
      const ext = file.name.split('.').pop()?.toLowerCase();

      let result: ParsedCatalogRow[] = [];

      if (ext === 'pdf') {
        setParseLog('Procesando PDF con motor extractor de texto y coordenadas...');
        result = await parseCatalogFromPdf(buffer);
      } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        setParseLog('Leyendo hojas de cálculo de Excel/CSV...');
        result = await parseCatalogFromExcel(buffer);
      } else {
        throw new Error('Formato no soportado. Por favor sube un archivo .pdf, .xlsx, .xls o .csv');
      }

      if (result.length === 0) {
        setErrorMsg('No se pudieron detectar filas tabulares válidas en el documento. Puedes intentar copiar y pegar el texto en la pestaña "Pegar Texto".');
      } else {
        setParsedRows(result);
        setSelectedRowIndices(new Set(result.map((_, i) => i)));
        setParseLog(`¡Análisis completado con éxito! Se detectaron ${result.length} productos y servicios.`);
      }
    } catch (err: any) {
      console.error('Error parsing catalog file:', err);
      setErrorMsg(err.message || 'Error al procesar el archivo.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseText = () => {
    setErrorMsg('');
    if (!rawText.trim()) {
      setErrorMsg('Por favor pega el texto del catálogo en el área de texto.');
      return;
    }

    try {
      setIsParsing(true);
      const result = parseCatalogText(rawText);
      if (result.length === 0) {
        setErrorMsg('No se identificaron patrones de productos con precios o códigos en el texto.');
      } else {
        setParsedRows(result);
        setSelectedRowIndices(new Set(result.map((_, i) => i)));
        setParseLog(`Se identificaron ${result.length} conceptos tabulados del texto.`);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al analizar el texto.');
    } finally {
      setIsParsing(false);
    }
  };

  const toggleSelectRow = (idx: number) => {
    setSelectedRowIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRowIndices.size === parsedRows.length) {
      setSelectedRowIndices(new Set());
    } else {
      setSelectedRowIndices(new Set(parsedRows.map((_, i) => i)));
    }
  };

  const handleConfirmImport = () => {
    const selectedRows = parsedRows.filter((_, i) => selectedRowIndices.has(i));
    if (selectedRows.length === 0) {
      setErrorMsg('Debes seleccionar al menos un producto para importar.');
      return;
    }

    const newCatalogItems: CatalogItem[] = selectedRows.map((row, idx) => ({
      id: generateUUID(),
      type: row.type || 'part',
      itemCode: row.code?.trim() || `AUTO-${String(idx + 1).padStart(3, '0')}`,
      nameOrModel: row.nameOrModel?.trim() || 'Sin modelo',
      description: row.description || (row.bulletItems && row.bulletItems.length > 0 ? row.bulletItems.join(' • ') : ''),
      brand: row.brand?.trim() || 'OEM / Universal',
      category: row.category?.trim() || 'Catálogo General',
      subcategory: row.subcategory,
      bulletItems: row.bulletItems,
      price: Number(row.price) || 0,
      currency: row.currency || 'USD',
      stock: row.stock !== undefined ? Number(row.stock) : (row.type === 'equipment' ? 1 : 5),
      minStock: row.type === 'equipment' ? 1 : 2,
      unit: row.unit || (row.type === 'equipment' ? 'equipo' : 'pza'),
      clientName: 'General / Todos',
      equipmentModel: '',
      serialNumber: '',
      location: 'Almacén Central',
      deliveryTime: row.deliveryTime || 'Inmediata (Stock)',
      isActive: true,
      notes: `Importado de ${fileName || 'archivo/texto'} el ${new Date().toLocaleDateString('es-MX')}`,
      createdAt: new Date().toISOString()
    }));

    onImportItems(newCatalogItems, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-6 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Importación Inteligente de Catálogo (PDF / Excel)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  Auto-Detección
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sube tu catálogo en PDF o Excel para extraer automáticamente Clases, Códigos, Refacciones y Precios.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('file')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Cargar Archivo (PDF / Excel)</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'text' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Pegar Texto Directo</span>
            </button>
          </div>

          {parsedRows.length > 0 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {selectedRowIndices.size} de {parsedRows.length} seleccionados
            </span>
          )}
        </div>

        {/* Upload / Input Area */}
        {parsedRows.length === 0 ? (
          <div className="flex-1 overflow-y-auto py-2">
            {activeTab === 'file' ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#0196C1] bg-slate-50/60 hover:bg-sky-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf,.xlsx,.xls,.csv" 
                  className="hidden" 
                />
                <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto text-[#0196C1]">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Haz clic para seleccionar tu catálogo en PDF o Excel
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Formatos admitidos: <strong>.pdf</strong> (Catálogo HVAC o Compresores), <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-semibold text-slate-600 shadow-2xs">
                  <span>Soporta tablas de clases, desglose de refacciones y listas de precios</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Pega el texto del catálogo aquí (con o sin encabezados de CLASE):
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Detecta automáticamente formato columnar y precios con IVA
                  </span>
                </div>
                <textarea
                  rows={10}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Ejemplo:
CLASE 01 — FILTRACIÓN
F-01-01-001  Filtro de aire para compresor de tornillo  $1,250.00 USD  • Filtro de aire • Malla • Abrazadera
F-01-01-002  Filtro deshidratador líquido              $850.00 USD
01.01        Filtro de aceite 2903 7526 00             $95.00 USD"
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0196C1]"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseText}
                    disabled={isParsing}
                    className="px-5 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Analizar Texto</span>
                  </button>
                </div>
              </div>
            )}

            {isParsing && (
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl mt-3 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-[#0196C1] animate-spin" />
                <span className="text-xs font-semibold text-[#0196C1]">
                  Analizando y estructurando datos del catálogo...
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mt-3 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        ) : (
          /* Parsed Items Preview Table */
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            
            {/* Banner with options */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                >
                  {selectedRowIndices.size === parsedRows.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  {selectedRowIndices.size} seleccionados de {parsedRows.length}
                </span>
              </div>

              {/* Mode choice */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Modo:</span>
                <select
                  value={importMode}
                  onChange={e => setImportMode(e.target.value as any)}
                  className="py-1 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="append">Añadir al catálogo actual (Conservar existentes)</option>
                  <option value="replace">Reemplazar catálogo por completo</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setFileName('');
                    setErrorMsg('');
                  }}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-bold underline cursor-pointer"
                >
                  Cambiar archivo
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 z-10 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedRowIndices.size === parsedRows.length && parsedRows.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded text-[#0196C1] cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Clase / Categoría</th>
                    <th className="py-2.5 px-4">Descripción / Refacciones</th>
                    <th className="py-2.5 px-3 text-right">Precio</th>
                    <th className="py-2.5 px-3 text-center">Moneda</th>
                    <th className="py-2.5 px-3 text-center">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {parsedRows.map((row, idx) => {
                    const isSelected = selectedRowIndices.has(idx);
                    return (
                      <tr 
                        key={idx}
                        onClick={() => toggleSelectRow(idx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-50/50 hover:bg-sky-50' : 'bg-slate-50/30 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(idx)}
                            className="rounded text-[#0196C1] cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 text-xs">
                          {row.code || 'AUTO'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800 block text-[11px]">
                            {row.category}
                          </span>
                          {row.subcategory && (
                            <span className="text-[10px] text-slate-500">
                              {row.subcategory}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 max-w-sm">
                          <div className="font-bold text-slate-900 text-xs">
                            {row.nameOrModel}
                          </div>
                          {row.bulletItems && row.bulletItems.length > 0 && (
                            <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                              {row.bulletItems.slice(0, 3).map((b, bi) => (
                                <div key={bi} className="truncate">• {b}</div>
                              ))}
                              {row.bulletItems.length > 3 && (
                                <span className="text-slate-400 text-[9px] font-bold">
                                  +{row.bulletItems.length - 3} refacciones más...
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          ${(row.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                          {row.currency || 'USD'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            row.type === 'equipment' ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {row.type === 'equipment' ? 'Equipo' : 'Refacción'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
          <div className="text-xs text-slate-500 font-semibold">
            {parsedRows.length > 0 && (
              <span>Se importarán {selectedRowIndices.size} artículos seleccionados.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={selectedRowIndices.size === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Importar al Catálogo</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
