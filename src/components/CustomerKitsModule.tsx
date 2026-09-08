import React, { useState, useMemo, useRef } from 'react';
import { CustomerKitItem, Client, Equipment } from '../types';
import { loadFromStorage, saveToStorage } from '../mockData';
import * as XLSX from 'xlsx';
import { 
  Wrench, Plus, Upload, Download, Search, Filter, Trash2, Edit2, 
  FileSpreadsheet, Database, Check, AlertCircle, X, ChevronDown, 
  Copy, RefreshCw, Layers, ShieldCheck, ArrowUpDown, Eye, FileText, CheckCircle2
} from 'lucide-react';

interface CustomerKitsModuleProps {
  clients?: Client[];
  equipment?: Equipment[];
}

export default function CustomerKitsModule({ clients = [], equipment = [] }: CustomerKitsModuleProps) {
  // Persistence state - empty by default per user request
  const [items, setItems] = useState<CustomerKitItem[]>(() => 
    loadFromStorage<CustomerKitItem[]>('mvl_customer_kits', [])
  );

  const saveItems = (newItems: CustomerKitItem[]) => {
    setItems(newItems);
    saveToStorage('mvl_customer_kits', newItems);
  };

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof CustomerKitItem>('clientName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form modal / drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomerKitItem | null>(null);

  // Form fields
  const [formPartNumber, setFormPartNumber] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formClientName, setFormClientName] = useState('');
  const [formEquipmentModel, setFormEquipmentModel] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Mode: single item or batch kit adding
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchParts, setBatchParts] = useState<Array<{ partNumber: string; description: string; price: string }>>([
    { partNumber: '', description: '', price: '' }
  ]);

  // SQL Modal state
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Import modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<CustomerKitItem[]>([]);
  const [importStats, setImportStats] = useState<{ total: number; clients: number; models: number }>({ total: 0, clients: 0, models: 0 });
  const [importError, setImportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast / notification
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Extract unique clients and models for auto-complete and filters
  const uniqueClients = useMemo(() => {
    const fromItems = items.map(i => i.clientName).filter(Boolean);
    const fromClients = clients.map(c => c.name);
    return Array.from(new Set([...fromItems, ...fromClients])).sort();
  }, [items, clients]);

  const uniqueModels = useMemo(() => {
    const fromItems = items.map(i => i.equipmentModel).filter(Boolean);
    const fromEquipment = equipment.map(e => e.model);
    return Array.from(new Set([...fromItems, ...fromEquipment])).sort();
  }, [items, equipment]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipmentModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchClient = selectedClientFilter === 'all' || item.clientName === selectedClientFilter;
      return matchSearch && matchClient;
    }).sort((a, b) => {
      const valA = (a[sortField] || '').toString().toLowerCase();
      const valB = (b[sortField] || '').toString().toLowerCase();
      if (sortField === 'price') {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      }
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [items, searchTerm, selectedClientFilter, sortField, sortOrder]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalParts = items.length;
    const uniqueClientsCount = new Set(items.map(i => i.clientName.trim().toLowerCase())).size;
    const uniqueEquipmentsCount = new Set(items.map(i => `${i.clientName}-${i.equipmentModel}-${i.serialNumber}`.toLowerCase())).size;
    const totalCatalogValue = items.reduce((sum, it) => sum + (it.price || 0), 0);
    return { totalParts, uniqueClientsCount, uniqueEquipmentsCount, totalCatalogValue };
  }, [items]);

  // Form management
  const resetForm = () => {
    setEditingItem(null);
    setFormPartNumber('');
    setFormDescription('');
    setFormPrice('');
    setFormClientName('');
    setFormEquipmentModel('');
    setFormSerialNumber('');
    setFormNotes('');
    setIsBatchMode(false);
    setBatchParts([{ partNumber: '', description: '', price: '' }]);
  };

  const handleOpenNew = (prefillClient = '', prefillModel = '', prefillSerie = '') => {
    resetForm();
    if (prefillClient) setFormClientName(prefillClient);
    if (prefillModel) setFormEquipmentModel(prefillModel);
    if (prefillSerie) setFormSerialNumber(prefillSerie);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: CustomerKitItem) => {
    setEditingItem(item);
    setFormPartNumber(item.partNumber);
    setFormDescription(item.description);
    setFormPrice(item.price.toString());
    setFormClientName(item.clientName);
    setFormEquipmentModel(item.equipmentModel);
    setFormSerialNumber(item.serialNumber);
    setFormNotes(item.notes || '');
    setIsBatchMode(false);
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formClientName.trim()) {
      showFeedback('El nombre del cliente es obligatorio.', 'error');
      return;
    }
    if (!formEquipmentModel.trim()) {
      showFeedback('El modelo del equipo es obligatorio.', 'error');
      return;
    }

    if (isBatchMode) {
      const validParts = batchParts.filter(p => p.partNumber.trim() && p.description.trim());
      if (validParts.length === 0) {
        showFeedback('Ingresa al menos una refacción con No. de parte y descripción.', 'error');
        return;
      }

      const newItemsToAdd: CustomerKitItem[] = validParts.map((p, idx) => ({
        id: `kit_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        partNumber: p.partNumber.trim(),
        description: p.description.trim(),
        price: parseFloat(p.price) || 0,
        clientName: formClientName.trim(),
        equipmentModel: formEquipmentModel.trim(),
        serialNumber: formSerialNumber.trim() || 'S/N',
        currency: 'USD',
        notes: formNotes.trim(),
        createdAt: new Date().toISOString()
      }));

      saveItems([...items, ...newItemsToAdd]);
      showFeedback(`Se agregaron ${newItemsToAdd.length} refacciones al kit de ${formClientName}.`);
      setIsFormOpen(false);
      resetForm();
    } else {
      if (!formPartNumber.trim()) {
        showFeedback('El No. de parte es obligatorio.', 'error');
        return;
      }
      if (!formDescription.trim()) {
        showFeedback('La descripción es obligatoria.', 'error');
        return;
      }

      const priceVal = parseFloat(formPrice) || 0;

      if (editingItem) {
        const updated = items.map(it => it.id === editingItem.id ? {
          ...it,
          partNumber: formPartNumber.trim(),
          description: formDescription.trim(),
          price: priceVal,
          clientName: formClientName.trim(),
          equipmentModel: formEquipmentModel.trim(),
          serialNumber: formSerialNumber.trim() || 'S/N',
          notes: formNotes.trim(),
          updatedAt: new Date().toISOString()
        } : it);
        saveItems(updated);
        showFeedback('Refacción actualizada correctamente.');
      } else {
        const newItem: CustomerKitItem = {
          id: `kit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          partNumber: formPartNumber.trim(),
          description: formDescription.trim(),
          price: priceVal,
          clientName: formClientName.trim(),
          equipmentModel: formEquipmentModel.trim(),
          serialNumber: formSerialNumber.trim() || 'S/N',
          currency: 'USD',
          notes: formNotes.trim(),
          createdAt: new Date().toISOString()
        };
        saveItems([newItem, ...items]);
        showFeedback('Refacción registrada con éxito.');
      }
      setIsFormOpen(false);
      resetForm();
    }
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('¿Eliminar esta refacción del catálogo de clientes?')) {
      const updated = items.filter(it => it.id !== id);
      saveItems(updated);
      showFeedback('Refacción eliminada.');
    }
  };

  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que deseas eliminar TODOS los registros de kits de clientes? Esta acción no se puede deshacer.')) {
      saveItems([]);
      showFeedback('Catálogo vaciado con éxito.');
    }
  };

  // Batch parts row helpers
  const handleAddBatchRow = () => {
    setBatchParts(prev => [...prev, { partNumber: '', description: '', price: '' }]);
  };

  const handleUpdateBatchRow = (index: number, field: 'partNumber' | 'description' | 'price', value: string) => {
    setBatchParts(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveBatchRow = (index: number) => {
    if (batchParts.length <= 1) return;
    setBatchParts(prev => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // EXPORT FUNCTIONALITY (EXACT EXCEL FORMAT)
  // ==========================================
  const handleExportExcel = () => {
    if (items.length === 0) {
      showFeedback('No hay registros para exportar.', 'error');
      return;
    }

    try {
      // Build rows matching the exact spreadsheet layout:
      // Row 1: Banner / Title
      // Row 2: Headers
      // Rows 3+: Data
      const headers = ['No. De de parte', 'descripción', 'precio', 'cliente', 'modelo', 'serie'];
      
      const dataRows = filteredItems.map(item => [
        item.partNumber,
        item.description,
        item.price,
        item.clientName,
        item.equipmentModel,
        item.serialNumber
      ]);

      const wsData = [
        ['', 'Kits de clientes MVL', '', '', '', ''],
        headers,
        ...dataRows
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths to match nice Excel look
      ws['!cols'] = [
        { wch: 18 }, // No. De de parte
        { wch: 35 }, // descripción
        { wch: 14 }, // precio
        { wch: 26 }, // cliente
        { wch: 18 }, // modelo
        { wch: 18 }  // serie
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kits de Clientes');

      XLSX.writeFile(wb, `Kits_de_clientes_MVL_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showFeedback('Archivo Excel exportado exitosamente.');
    } catch (err) {
      console.error('Export error:', err);
      // Fallback: CSV export
      handleExportCsv();
    }
  };

  const handleExportCsv = () => {
    if (items.length === 0) {
      showFeedback('No hay registros para exportar.', 'error');
      return;
    }
    const headers = ['No. De de parte', 'descripción', 'precio', 'cliente', 'modelo', 'serie'];
    const rows = filteredItems.map(it => [
      `"${it.partNumber.replace(/"/g, '""')}"`,
      `"${it.description.replace(/"/g, '""')}"`,
      `"${it.price.toFixed(2)}"`,
      `"${it.clientName.replace(/"/g, '""')}"`,
      `"${it.equipmentModel.replace(/"/g, '""')}"`,
      `"${it.serialNumber.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [
      ',,Kits de clientes MVL,,,,',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Kits_de_clientes_MVL_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('Archivo CSV exportado exitosamente.');
  };

  // ==========================================
  // IMPORT FUNCTIONALITY (ROBUST PARSER)
  // ==========================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseFile(file);
    // Reset file input so user can re-select same file if needed
    e.target.value = '';
  };

  const parseFile = async (file: File) => {
    setImportError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to raw array of rows
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (rawRows.length === 0) {
        setImportError('El archivo seleccionado está vacío.');
        return;
      }

      // Find header row: look for row containing "No. De de parte" or "parte" or "descripcion"
      let headerRowIndex = -1;
      let partCol = 0;
      let descCol = 1;
      let priceCol = 2;
      let clientCol = 3;
      let modelCol = 4;
      let serieCol = 5;

      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const row = rawRows[i].map(cell => (cell || '').toString().toLowerCase().trim());
        const hasPart = row.some((c, idx) => {
          if (c.includes('parte') || c.includes('part') || c.includes('no. de')) {
            partCol = idx;
            return true;
          }
          return false;
        });
        const hasDesc = row.some((c, idx) => {
          if (c.includes('descrip') || c.includes('nombre')) {
            descCol = idx;
            return true;
          }
          return false;
        });

        if (hasPart && hasDesc) {
          headerRowIndex = i;
          // Locate other columns if available
          row.forEach((c, idx) => {
            if (c.includes('precio') || c.includes('price') || c.includes('costo')) priceCol = idx;
            if (c.includes('cliente') || c.includes('client')) clientCol = idx;
            if (c.includes('modelo') || c.includes('model')) modelCol = idx;
            if (c.includes('serie') || c.includes('serial')) serieCol = idx;
          });
          break;
        }
      }

      // If no explicit header found, default to row 1 (0-indexed) or row 0
      const startIdx = headerRowIndex >= 0 ? headerRowIndex + 1 : 1;

      // Tracking variables for Excel cell merge / inheritance (downward fill)
      let currentClient = '';
      let currentModel = '';
      let currentSerie = '';

      const parsedItems: CustomerKitItem[] = [];

      for (let i = startIdx; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const partNumRaw = (row[partCol] || '').toString().trim();
        const descRaw = (row[descCol] || '').toString().trim();
        const priceRaw = (row[priceCol] || '').toString().trim();
        const clientRaw = (row[clientCol] || '').toString().trim();
        const modelRaw = (row[modelCol] || '').toString().trim();
        const serieRaw = (row[serieCol] || '').toString().trim();

        // If whole row is empty or summary, skip
        if (!partNumRaw && !descRaw && !clientRaw) continue;

        // If this row has a new client or equipment definition
        if (clientRaw) currentClient = clientRaw;
        if (modelRaw) currentModel = modelRaw;
        if (serieRaw) currentSerie = serieRaw;

        // If this row is just a subtotal or title without part number or desc, skip
        if (!partNumRaw && !descRaw) continue;

        // Clean price
        let numericPrice = 0;
        if (priceRaw) {
          // Remove currency symbols, commas, spaces
          const cleaned = priceRaw.replace(/[^0-9.-]/g, '');
          numericPrice = parseFloat(cleaned) || 0;
        }

        parsedItems.push({
          id: `imp_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
          partNumber: partNumRaw || 'S/N',
          description: descRaw || 'Refacción sin descripción',
          price: numericPrice,
          clientName: currentClient || 'Cliente Sin Nombre',
          equipmentModel: currentModel || 'Equipo No Especificado',
          serialNumber: currentSerie || 'S/N',
          currency: 'USD',
          createdAt: new Date().toISOString()
        });
      }

      if (parsedItems.length === 0) {
        setImportError('No se pudieron extraer registros válidos del archivo. Revisa que contenga las columnas requeridas.');
        return;
      }

      // Compute statistics for preview
      const uniqueClientsInFile = new Set(parsedItems.map(p => p.clientName.toLowerCase().trim())).size;
      const uniqueModelsInFile = new Set(parsedItems.map(p => `${p.clientName}-${p.equipmentModel}`.toLowerCase().trim())).size;

      setImportPreview(parsedItems);
      setImportStats({
        total: parsedItems.length,
        clients: uniqueClientsInFile,
        models: uniqueModelsInFile
      });
      setIsImportModalOpen(true);
    } catch (err: any) {
      console.error('Import parse error:', err);
      setImportError(`Error al leer el archivo: ${err?.message || 'Formato no soportado'}`);
    }
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;

    if (importMode === 'replace') {
      saveItems(importPreview);
      showFeedback(`Se reemplazó el catálogo con ${importPreview.length} registros exitosamente.`);
    } else {
      saveItems([...items, ...importPreview]);
      showFeedback(`Se agregaron ${importPreview.length} registros exitosamente.`);
    }

    setIsImportModalOpen(false);
    setImportPreview([]);
  };

  // ==========================================
  // SQL DDL SCRIPT GENERATOR
  // ==========================================
  const sqlScript = `-- ====================================================================
-- SISTEMA MVL: TABLA PARA EL MÓDULO "KITS DE CLIENTES"
-- Compatible con PostgreSQL / Supabase / Google Cloud SQL
-- ====================================================================

-- 1. Creación de la tabla customer_kits
CREATE TABLE IF NOT EXISTS public.customer_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_number VARCHAR(100) NOT NULL,            -- "No. De de parte" (ej. 2903 7526 00)
    description VARCHAR(255) NOT NULL,            -- "descripción" (ej. filtro de aceite)
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,   -- "precio" (ej. 77.16)
    currency VARCHAR(10) DEFAULT 'USD',           -- Moneda ('USD' o 'MXN')
    client_name VARCHAR(150) NOT NULL,            -- "cliente" (ej. Isocindu, Impresos Leon)
    equipment_model VARCHAR(100) NOT NULL,        -- "modelo" (ej. GA 18 Pack, GA 45 FF)
    serial_number VARCHAR(100) NOT NULL,          -- "serie" (ej. CAI 847490, API 540370)
    notes TEXT,                                   -- Observaciones técnicas adicionales
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para búsquedas y autocompletado en milisegundos
CREATE INDEX IF NOT EXISTS idx_customer_kits_client ON public.customer_kits(client_name);
CREATE INDEX IF NOT EXISTS idx_customer_kits_model ON public.customer_kits(equipment_model);
CREATE INDEX IF NOT EXISTS idx_customer_kits_part ON public.customer_kits(part_number);
CREATE INDEX IF NOT EXISTS idx_customer_kits_serial ON public.customer_kits(serial_number);

-- 3. Trigger para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_customer_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_customer_kits_updated_at ON public.customer_kits;
CREATE TRIGGER trigger_customer_kits_updated_at
BEFORE UPDATE ON public.customer_kits
FOR EACH ROW
EXECUTE FUNCTION update_customer_kits_updated_at();

-- 4. Comentarios de documentación en el catálogo de BD
COMMENT ON TABLE public.customer_kits IS 'Matriz de refacciones y kits de mantenimiento por cliente, equipo y número de serie';
COMMENT ON COLUMN public.customer_kits.part_number IS 'Número de parte oficial o de fabricante';
COMMENT ON COLUMN public.customer_kits.client_name IS 'Nombre de la empresa cliente';
COMMENT ON COLUMN public.customer_kits.equipment_model IS 'Modelo del compresor, secador o equipo';
COMMENT ON COLUMN public.customer_kits.serial_number IS 'Número de serie físico de placa del equipo';
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
    showFeedback('Script SQL copiado al portapapeles.');
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {feedbackMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-white font-bold text-xs flex items-center gap-2 border transition-all ${
          feedbackMessage.type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'
        }`}>
          {feedbackMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* HEADER BANNER - EXACT STYLE OF CLIENT'S IMAGE */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
              <img 
                src="https://appdesignproyectos.com/mvl.png" 
                alt="MVL Logo" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  // Fallback icon if image fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Kits de clientes MVL</h1>
                <span className="bg-[#0196C1]/10 text-[#0196C1] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  Módulo Administrador
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Catálogo maestro de refacciones por cliente, modelo y número de serie (compresores, secadores y sistemas industriales).
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
              title="Ver y Copiar Script SQL"
            >
              <Database className="w-3.5 h-3.5 text-[#0196C1]" />
              <span className="hidden sm:inline">Ver Script SQL</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>

            <label className="px-3 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Excel / CSV</span>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileSelect} 
                className="hidden" 
              />
            </label>

            <button
              onClick={() => handleOpenNew()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-md active:scale-98"
            >
              <Plus className="w-4 h-4 text-[#0196C1]" />
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total de Refacciones</span>
            <span className="text-lg font-black text-slate-800">{stats.totalParts}</span>
            <span className="text-[10px] text-slate-400 block">partidas registradas</span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clientes con Kit</span>
            <span className="text-lg font-black text-[#0196C1]">{stats.uniqueClientsCount}</span>
            <span className="text-[10px] text-slate-400 block">plantas industriales</span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Equipos Registrados</span>
            <span className="text-lg font-black text-slate-800">{stats.uniqueEquipmentsCount}</span>
            <span className="text-[10px] text-slate-400 block">modelos / números de serie</span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor de Referencia</span>
            <span className="text-lg font-black text-emerald-600">
              ${stats.totalCatalogValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block">suma total en catálogo</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por No. de Parte, Descripción, Cliente, Modelo o No. de Serie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#0196C1] focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Cliente:</span>
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="all">Todos los Clientes ({uniqueClients.length})</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>

          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 cursor-pointer transition-colors"
              title="Limpiar todos los registros del catálogo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TABLE IN EXACT VISUAL STYLE OF THE SPREADSHEET */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-sky-50 text-[#0196C1] rounded-2xl flex items-center justify-center mx-auto border border-sky-100">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No hay kits de clientes registrados aún</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Puedes importar directamente el archivo Excel proporcionado por el cliente con el botón 
                <span className="font-bold text-[#0196C1]"> "Importar Excel / CSV"</span> o agregar registros manualmente con 
                <span className="font-bold text-slate-800"> "Nuevo Registro"</span>.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <label className="px-4 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Importar Archivo Excel / CSV</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />
              </label>
              <button
                onClick={() => handleOpenNew()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Primer Ítem</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              {/* EXACT CYAN/BLUE TABLE HEADER LIKE CLIENT IMAGE */}
              <thead>
                <tr className="bg-[#00A2E8] text-white font-extrabold text-xs tracking-wide">
                  <th 
                    onClick={() => { setSortField('partNumber'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-[#0092d0] transition-colors border-r border-sky-400/50 w-44"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>No. De de parte</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th 
                    onClick={() => { setSortField('description'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-[#0092d0] transition-colors border-r border-sky-400/50 min-w-[220px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>descripción</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th 
                    onClick={() => { setSortField('price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-[#0092d0] transition-colors border-r border-sky-400/50 w-32 text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>precio</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th 
                    onClick={() => { setSortField('clientName'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-[#0092d0] transition-colors border-r border-sky-400/50 w-48"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>cliente</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th 
                    onClick={() => { setSortField('equipmentModel'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-[#0092d0] transition-colors border-r border-sky-400/50 w-40"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>modelo</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th 
                    onClick={() => { setSortField('serialNumber'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-[#0092d0] transition-colors border-r border-sky-400/50 w-40"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>serie</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center w-20">Acciones</th>
                </tr>
              </thead>

              {/* TABLE BODY WITH DISTINCT CELLS */}
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-sky-50/40 transition-colors group"
                  >
                    {/* No. De de parte */}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 border-r border-slate-100 text-[11px]">
                      {item.partNumber}
                    </td>

                    {/* Descripción */}
                    <td className="py-2.5 px-3.5 text-slate-800 font-semibold border-r border-slate-100">
                      {item.description}
                      {item.notes && (
                        <span className="text-[10px] text-slate-400 block font-normal mt-0.5 italic">
                          {item.notes}
                        </span>
                      )}
                    </td>

                    {/* Precio */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 border-r border-slate-100">
                      ${item.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Cliente */}
                    <td className="py-2.5 px-3.5 font-bold text-slate-900 border-r border-slate-100">
                      <span className="hover:text-[#0196C1] cursor-pointer" onClick={() => setSelectedClientFilter(item.clientName)}>
                        {item.clientName}
                      </span>
                    </td>

                    {/* Modelo */}
                    <td className="py-2.5 px-3.5 font-semibold text-slate-700 border-r border-slate-100">
                      {item.equipmentModel}
                    </td>

                    {/* Serie */}
                    <td className="py-2.5 px-3.5 font-mono text-slate-600 border-r border-slate-100">
                      {item.serialNumber}
                    </td>

                    {/* Acciones */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-500 hover:text-[#0196C1] hover:bg-sky-50 rounded-lg cursor-pointer transition-colors"
                          title="Editar refacción"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Eliminar refacción"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER BAR */}
        {items.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Mostrando <strong className="text-slate-800">{filteredItems.length}</strong> de <strong className="text-slate-800">{items.length}</strong> refacciones registradas
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Exportar vista actual:</span>
              <button
                onClick={handleExportExcel}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
              >
                .XLSX
              </button>
              <button
                onClick={handleExportCsv}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
              >
                .CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FORM MODAL: REGISTRAR / EDITAR KIT DE CLIENTE                            */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0196C1] flex items-center justify-center text-white font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingItem ? 'Editar Refacción en Kit' : 'Registrar Refacción para Kit de Cliente'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Captura los datos marcados en el catálogo de clientes MVL
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode switch for new entries */}
            {!editingItem && (
              <div className="px-5 pt-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-700">Modalidad de captura:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsBatchMode(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isBatchMode ? 'bg-white text-[#0196C1] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Una Refacción
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBatchMode(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isBatchMode ? 'bg-white text-[#0196C1] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Kit Completo (Múltiples Partes)
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveForm} className="p-5 space-y-4">
              {/* DATOS DEL EQUIPO Y CLIENTE (COMUNES) */}
              <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-100 space-y-3">
                <span className="text-[10px] font-black text-sky-900 uppercase tracking-wider block">
                  1. Información del Cliente y Equipo
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Cliente */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Cliente <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="clients-list"
                      placeholder="Ej. Isocindu, Impresos Leon"
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800 focus:border-[#0196C1]"
                    />
                    <datalist id="clients-list">
                      {uniqueClients.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>

                  {/* Modelo */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Modelo del Equipo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="models-list"
                      placeholder="Ej. GA 18 Pack, GA 50 VSD"
                      value={formEquipmentModel}
                      onChange={(e) => setFormEquipmentModel(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800 focus:border-[#0196C1]"
                    />
                    <datalist id="models-list">
                      {uniqueModels.map(m => <option key={m} value={m} />)}
                    </datalist>
                  </div>

                  {/* Serie */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Número de Serie
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. CAI 847490, API 540370"
                      value={formSerialNumber}
                      onChange={(e) => setFormSerialNumber(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-mono font-bold text-slate-800 focus:border-[#0196C1]"
                    />
                  </div>
                </div>
              </div>

              {/* SINGLE ITEM MODE */}
              {!isBatchMode ? (
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                    2. Datos de la Refacción
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* No. De parte */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        No. De de parte <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 2903 7526 00"
                        value={formPartNumber}
                        onChange={(e) => setFormPartNumber(e.target.value)}
                        required
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-mono font-bold text-slate-900 focus:border-[#0196C1]"
                      />
                    </div>

                    {/* Descripción */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Descripción <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. filtro de aceite, separador Starbox"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        required
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800 focus:border-[#0196C1]"
                      />
                    </div>

                    {/* Precio */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Precio Unitario (USD / Ref.)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs font-mono font-bold text-slate-900 focus:border-[#0196C1]"
                        />
                      </div>
                    </div>

                    {/* Observaciones */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Notas u Observaciones (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Reemplazar cada 4,000 hrs / Original Atlas Copco"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-slate-700 focus:border-[#0196C1]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* BATCH ITEMS MODE: MULTIPLE PARTS FOR ONE MACHINE */
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                      2. Refacciones del Kit ({batchParts.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddBatchRow}
                      className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-[#0196C1] text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Agregar otra refacción
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {batchParts.map((part, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <span className="w-5 text-center text-xs font-bold text-slate-400">{idx + 1}.</span>
                        <input
                          type="text"
                          placeholder="No. De Parte (ej. 2903 7526 00)"
                          value={part.partNumber}
                          onChange={(e) => handleUpdateBatchRow(idx, 'partNumber', e.target.value)}
                          className="w-40 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded outline-none font-mono font-bold"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Descripción (ej. filtro de aceite)"
                          value={part.description}
                          onChange={(e) => handleUpdateBatchRow(idx, 'description', e.target.value)}
                          className="flex-1 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded outline-none font-semibold"
                          required
                        />
                        <div className="relative w-28">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Precio"
                            value={part.price}
                            onChange={(e) => handleUpdateBatchRow(idx, 'price', e.target.value)}
                            className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none text-xs font-mono font-bold text-right"
                          />
                        </div>
                        {batchParts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Actualizar Refacción' : 'Guardar en Catálogo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IMPORT PREVIEW MODAL                                                      */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#0196C1]" />
                <div>
                  <h3 className="text-sm font-bold">Vista Previa de Importación de Excel / CSV</h3>
                  <span className="text-[10px] text-slate-400">Verifica los datos extraídos antes de guardarlos en el sistema</span>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Extraction summary metrics */}
              <div className="grid grid-cols-3 gap-3 bg-sky-50/70 p-3.5 rounded-xl border border-sky-100 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Partidas Encontradas</span>
                  <span className="text-lg font-black text-slate-900 block">{importStats.total}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Clientes Distintos</span>
                  <span className="text-lg font-black text-[#0196C1] block">{importStats.clients}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Equipos / Modelos</span>
                  <span className="text-lg font-black text-emerald-600 block">{importStats.models}</span>
                </div>
              </div>

              {/* Mode: Append or Replace */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Acción al importar:</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                    />
                    <span>Agregar a los existentes</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <span>Reemplazar todo el catálogo</span>
                  </label>
                </div>
              </div>

              {/* Preview table (first 10 items) */}
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Muestra de registros detectados (primeros {Math.min(importPreview.length, 10)} de {importPreview.length}):
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#00A2E8] text-white font-extrabold text-[10px] uppercase sticky top-0">
                      <tr>
                        <th className="p-2">No. De parte</th>
                        <th className="p-2">Descripción</th>
                        <th className="p-2 text-right">Precio</th>
                        <th className="p-2">Cliente</th>
                        <th className="p-2">Modelo</th>
                        <th className="p-2">Serie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importPreview.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-slate-900">{item.partNumber}</td>
                          <td className="p-2 text-slate-800">{item.description}</td>
                          <td className="p-2 text-right font-mono font-bold">${item.price.toFixed(2)}</td>
                          <td className="p-2 font-bold text-slate-700">{item.clientName}</td>
                          <td className="p-2 text-slate-600">{item.equipmentModel}</td>
                          <td className="p-2 font-mono text-slate-500">{item.serialNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar e Importar {importPreview.length} Registros</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SQL SCRIPT MODAL (POSTGRESQL / CLOUD SQL / SUPABASE)                     */}
      {/* ========================================================================= */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#0196C1]" />
                <div>
                  <h3 className="text-sm font-bold">Script SQL DDL: customer_kits</h3>
                  <span className="text-[10px] text-slate-400">
                    Esquema para PostgreSQL / Google Cloud SQL / Supabase con índices optimizados
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  Copia y pega este script en tu consola de base de datos para crear la tabla de kits:
                </span>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors shadow-2xs"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? '¡Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-96 border border-slate-800 leading-relaxed selection:bg-[#0196C1]/30">
                  {sqlScript}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
