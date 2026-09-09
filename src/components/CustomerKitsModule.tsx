import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CustomerKitItem, Client, Equipment } from '../types';
import { loadFromStorage, saveToStorage } from '../mockData';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Wrench, Plus, Upload, Download, Search, Filter, Trash2, Edit2, 
  FileSpreadsheet, Database, Check, AlertCircle, X, ChevronDown, 
  Copy, RefreshCw, Layers, ShieldCheck, ArrowUpDown, Eye, FileText, CheckCircle2,
  Printer, Loader2, CloudUpload, CloudOff, Cloud, ToggleLeft, ToggleRight, Package, Sparkles
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

  // Supabase synchronization states
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'syncing' | 'checking'>('checking');
  const [supabaseCount, setSupabaseCount] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);

  const saveItems = (newItems: CustomerKitItem[]) => {
    setItems(newItems);
    saveToStorage('mvl_customer_kits', newItems);
  };

  // Fetch all kits from Supabase table 'customer_kits'
  const fetchKitsFromSupabase = async () => {
    try {
      setSupabaseStatus('checking');
      const { data, error } = await supabase
        .from('customer_kits')
        .select('*')
        .order('client_name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: CustomerKitItem[] = data.map((row: any) => ({
          id: String(row.id),
          partNumber: row.part_number || '',
          description: row.description || '',
          price: Number(row.price || 0),
          currency: (row.currency as 'USD' | 'MXN') || 'USD',
          clientName: row.client_name || '',
          equipmentModel: row.equipment_model || '',
          serialNumber: row.serial_number || '',
          stock: row.stock !== undefined && row.stock !== null ? Number(row.stock) : 0,
          minStock: row.min_stock !== undefined && row.min_stock !== null ? Number(row.min_stock) : 0,
          isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
          notes: row.notes || '',
          createdAt: row.created_at || new Date().toISOString()
        }));
        setItems(mapped);
        saveToStorage('mvl_customer_kits', mapped);
        setSupabaseCount(mapped.length);
        setSupabaseStatus('connected');
      } else {
        setSupabaseCount(0);
        setSupabaseStatus('connected');
        // If Supabase has 0 rows, preserve any items currently in local storage
        const localSaved = loadFromStorage<CustomerKitItem[]>('mvl_customer_kits', []);
        if (localSaved.length > 0) {
          setItems(localSaved);
        }
      }
    } catch (err: any) {
      console.warn('Could not load customer_kits from Supabase:', err);
      setSupabaseStatus('disconnected');
    }
  };

  useEffect(() => {
    fetchKitsFromSupabase();
  }, []);

  // Sync / Upload items to Supabase customer_kits table
  const syncItemsToSupabase = async (itemsToSync: CustomerKitItem[], mode: 'replace' | 'append' = 'replace') => {
    if (itemsToSync.length === 0) {
      showFeedback('No hay registros para sincronizar con Supabase.', 'error');
      return;
    }
    setIsSyncing(true);
    setSupabaseStatus('syncing');
    setSyncProgress({ current: 0, total: itemsToSync.length });

    try {
      if (mode === 'replace') {
        // Clear existing rows in customer_kits table safely
        const { error: delErr } = await supabase
          .from('customer_kits')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (delErr) {
          console.warn('Notice clearing customer_kits:', delErr.message);
        }
      }

      // Map to PostgreSQL columns matching schema
      const rows = itemsToSync.map(item => ({
        part_number: item.partNumber || 'S/N',
        description: item.description || 'Sin descripción',
        price: Number(item.price || 0),
        currency: item.currency || 'USD',
        client_name: item.clientName || 'Cliente General',
        equipment_model: item.equipmentModel || 'Equipo General',
        serial_number: item.serialNumber || 'S/N',
        stock: Number(item.stock || 0),
        min_stock: Number(item.minStock || 0),
        is_active: item.isActive !== undefined ? Boolean(item.isActive) : true,
        notes: item.notes || null
      }));

      // Insert in chunks of 50 to avoid network payload limits
      const chunkSize = 50;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error: insErr } = await supabase.from('customer_kits').insert(chunk);
        if (insErr) {
          console.error('Insert chunk error:', insErr);
          throw insErr;
        }
        setSyncProgress({ current: Math.min(i + chunkSize, rows.length), total: rows.length });
      }

      await fetchKitsFromSupabase();
      showFeedback(`¡Éxito! ${rows.length} registros guardados en la tabla customer_kits de Supabase.`);
    } catch (err: any) {
      console.error('Error in syncItemsToSupabase:', err);
      setSupabaseStatus('disconnected');
      const errDetail = err?.message || 'Error de conexión';
      showFeedback(`Error al guardar en Supabase: ${errDetail}. Tus datos siguen seguros en el navegador.`, 'error');
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<keyof CustomerKitItem>('clientName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form modal / drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomerKitItem | null>(null);
  const [viewingKitItem, setViewingKitItem] = useState<CustomerKitItem | null>(null);

  // Form fields
  const [formPartNumber, setFormPartNumber] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formClientName, setFormClientName] = useState('');
  const [formEquipmentModel, setFormEquipmentModel] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formStock, setFormStock] = useState<string>('0');
  const [formMinStock, setFormMinStock] = useState<string>('0');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
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

  // PDF Export and Preview state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

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
      
      const isItemActive = item.isActive !== false;
      const matchStatus = selectedStatusFilter === 'all' || 
        (selectedStatusFilter === 'active' && isItemActive) || 
        (selectedStatusFilter === 'inactive' && !isItemActive);

      return matchSearch && matchClient && matchStatus;
    }).sort((a, b) => {
      const valA = (a[sortField] || '').toString().toLowerCase();
      const valB = (b[sortField] || '').toString().toLowerCase();
      if (sortField === 'price') {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      }
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [items, searchTerm, selectedClientFilter, selectedStatusFilter, sortField, sortOrder]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalParts = items.length;
    const activeCount = items.filter(i => i.isActive !== false).length;
    const inactiveCount = items.filter(i => i.isActive === false).length;
    const uniqueClientsCount = new Set(items.map(i => i.clientName.trim().toLowerCase())).size;
    const uniqueEquipmentsCount = new Set(items.map(i => `${i.clientName}-${i.equipmentModel}-${i.serialNumber}`.toLowerCase())).size;
    const totalCatalogValue = items.reduce((sum, it) => sum + (it.price || 0), 0);
    return { totalParts, activeCount, inactiveCount, uniqueClientsCount, uniqueEquipmentsCount, totalCatalogValue };
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
    setFormStock('0');
    setFormMinStock('0');
    setFormIsActive(true);
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
    setFormStock(item.stock !== undefined ? item.stock.toString() : '0');
    setFormMinStock(item.minStock !== undefined ? item.minStock.toString() : '0');
    setFormIsActive(item.isActive !== false);
    setFormNotes(item.notes || '');
    setIsBatchMode(false);
    setIsFormOpen(true);
  };

  // Toggle active status
  const handleToggleActive = async (item: CustomerKitItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextActive = item.isActive !== false ? false : true;
    const updated = items.map(it => it.id === item.id ? { ...it, isActive: nextActive } : it);
    saveItems(updated);
    showFeedback(`El registro "${item.partNumber}" ahora está ${nextActive ? 'ACTIVO' : 'DESACTIVADO'}.`);

    try {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)) {
        await supabase.from('customer_kits').update({ is_active: nextActive }).eq('id', item.id);
      }
    } catch (err) {
      console.warn('Supabase toggle active error:', err);
    }
  };

  // Synchronize with Sales Catalog
  const handleSyncToSalesCatalog = async () => {
    try {
      const existingCatalog = loadFromStorage<any[]>('mvl_sales_catalog', []);
      const existingCodes = new Set(existingCatalog.map(c => (c.itemCode || '').trim().toLowerCase()));

      const newEntries: any[] = [];
      items.forEach(k => {
        const code = (k.partNumber || '').trim().toLowerCase();
        if (code && !existingCodes.has(code)) {
          existingCodes.add(code);
          newEntries.push({
            id: `cat_sync_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            type: 'part',
            itemCode: k.partNumber,
            nameOrModel: k.description,
            description: `Refacción registrada para cliente ${k.clientName} - Equipo ${k.equipmentModel}`,
            brand: 'OEM / Multimarca',
            category: 'Filtros y Consumibles',
            price: k.price || 0,
            currency: k.currency || 'USD',
            stock: k.stock || 0,
            minStock: k.minStock || 0,
            unit: 'pza',
            clientName: k.clientName,
            equipmentModel: k.equipmentModel,
            serialNumber: k.serialNumber,
            deliveryTime: 'Inmediata (Stock)',
            isActive: k.isActive !== false,
            notes: k.notes || 'Sincronizado desde Kit de Clientes',
            createdAt: new Date().toISOString()
          });
        }
      });

      if (newEntries.length > 0) {
        const updatedCatalog = [...newEntries, ...existingCatalog];
        saveToStorage('mvl_sales_catalog', updatedCatalog);
        showFeedback(`¡Catálogo de Ventas sincronizado! Se exportaron ${newEntries.length} refacciones al Catálogo General.`);
      } else {
        showFeedback('Todas las refacciones de los kits ya están presentes en el Catálogo de Ventas.');
      }
    } catch (e: any) {
      showFeedback('Error sincronizando con catálogo: ' + e.message, 'error');
    }
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
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `kit_${Date.now()}_${idx}`,
        partNumber: p.partNumber.trim(),
        description: p.description.trim(),
        price: parseFloat(p.price) || 0,
        clientName: formClientName.trim(),
        equipmentModel: formEquipmentModel.trim(),
        serialNumber: formSerialNumber.trim() || 'S/N',
        currency: 'USD',
        stock: 0,
        minStock: 0,
        isActive: true,
        notes: formNotes.trim(),
        createdAt: new Date().toISOString()
      }));

      saveItems([...items, ...newItemsToAdd]);
      showFeedback(`Guardando ${newItemsToAdd.length} refacciones en Supabase...`);
      setIsFormOpen(false);
      resetForm();

      // Async write to Supabase
      (async () => {
        try {
          const rows = newItemsToAdd.map(p => ({
            part_number: p.partNumber,
            description: p.description,
            price: p.price,
            currency: 'USD',
            client_name: p.clientName,
            equipment_model: p.equipmentModel,
            serial_number: p.serialNumber,
            stock: 0,
            min_stock: 0,
            is_active: true,
            notes: p.notes || null
          }));
          const { error } = await supabase.from('customer_kits').insert(rows);
          if (error) throw error;
          fetchKitsFromSupabase();
          showFeedback(`Se guardaron ${newItemsToAdd.length} refacciones en Supabase con éxito.`);
        } catch (err: any) {
          console.warn('Supabase batch insert error:', err);
        }
      })();
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
      const stockVal = parseFloat(formStock) || 0;
      const minStockVal = parseFloat(formMinStock) || 0;

      if (editingItem) {
        const updated = items.map(it => it.id === editingItem.id ? {
          ...it,
          partNumber: formPartNumber.trim(),
          description: formDescription.trim(),
          price: priceVal,
          clientName: formClientName.trim(),
          equipmentModel: formEquipmentModel.trim(),
          serialNumber: formSerialNumber.trim() || 'S/N',
          stock: stockVal,
          minStock: minStockVal,
          isActive: formIsActive,
          notes: formNotes.trim(),
          updatedAt: new Date().toISOString()
        } : it);
        saveItems(updated);
        showFeedback('Refacción actualizada correctamente.');

        // Async update to Supabase if valid UUID
        (async () => {
          try {
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingItem.id)) {
              await supabase.from('customer_kits').update({
                part_number: formPartNumber.trim(),
                description: formDescription.trim(),
                price: priceVal,
                client_name: formClientName.trim(),
                equipment_model: formEquipmentModel.trim(),
                serial_number: formSerialNumber.trim() || 'S/N',
                stock: stockVal,
                min_stock: minStockVal,
                is_active: formIsActive,
                notes: formNotes.trim()
              }).eq('id', editingItem.id);
            }
          } catch (err) {
            console.warn('Supabase update error:', err);
          }
        })();
      } else {
        const newItem: CustomerKitItem = {
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `kit_${Date.now()}`,
          partNumber: formPartNumber.trim(),
          description: formDescription.trim(),
          price: priceVal,
          clientName: formClientName.trim(),
          equipmentModel: formEquipmentModel.trim(),
          serialNumber: formSerialNumber.trim() || 'S/N',
          currency: 'USD',
          stock: stockVal,
          minStock: minStockVal,
          isActive: formIsActive,
          notes: formNotes.trim(),
          createdAt: new Date().toISOString()
        };
        saveItems([newItem, ...items]);
        showFeedback('Refacción registrada con éxito.');

        // Async insert into Supabase
        (async () => {
          try {
            const { data, error } = await supabase.from('customer_kits').insert([{
              part_number: newItem.partNumber,
              description: newItem.description,
              price: newItem.price,
              currency: 'USD',
              client_name: newItem.clientName,
              equipment_model: newItem.equipmentModel,
              serial_number: newItem.serialNumber,
              stock: newItem.stock || 0,
              min_stock: newItem.minStock || 0,
              is_active: newItem.isActive !== false,
              notes: newItem.notes || null
            }]).select();

            if (!error && data && data[0]) {
              fetchKitsFromSupabase();
            }
          } catch (err) {
            console.warn('Supabase single insert error:', err);
          }
        })();
      }
      setIsFormOpen(false);
      resetForm();
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('¿Eliminar esta refacción del catálogo de clientes?')) {
      const updated = items.filter(it => it.id !== id);
      saveItems(updated);
      showFeedback('Refacción eliminada.');

      try {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('customer_kits').delete().eq('id', id);
          setSupabaseCount(prev => prev !== null ? Math.max(0, prev - 1) : null);
        }
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar TODOS los registros de kits de clientes? Esta acción no se puede deshacer.')) {
      saveItems([]);
      showFeedback('Catálogo vaciado con éxito.');

      try {
        await supabase.from('customer_kits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        setSupabaseCount(0);
      } catch (err) {
        console.warn('Supabase clear error:', err);
      }
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

  // Helper to load logo as base64 for PDF embedding
  const getLogoBase64 = async (): Promise<string | null> => {
    const candidates = ['/mvl.png', 'https://appdesignproyectos.com/mvl.png'];
    for (const url of candidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) continue;
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (base64) return base64;
      } catch {
        // continue to next candidate
      }
    }
    return null;
  };

  // PDF Export using jsPDF and jspdf-autotable with official MVL logo and exact cyan styling
  const handleExportPdf = async () => {
    if (filteredItems.length === 0) {
      showFeedback('No hay registros para exportar en PDF.', 'error');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      // Landscape A4 orientation (297mm x 210mm)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Top cyan bar accent (#00A2E8)
      doc.setFillColor(0, 162, 232);
      doc.rect(0, 0, 297, 3.5, 'F');

      // Fetch official logo and insert
      const logoData = await getLogoBase64();
      if (logoData) {
        try {
          doc.addImage(logoData, 'PNG', 14, 8, 36, 15);
        } catch (imgErr) {
          console.warn('Could not add image to PDF:', imgErr);
        }
      }

      // Title & Subtitle
      const startTextX = logoData ? 54 : 14;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('MVL CONTROL Y MANTENIMIENTO INDUSTRIAL', startTextX, 13.5);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 162, 232); // #00A2E8
      doc.text('Kits de clientes MVL — Catálogo Maestro de Refacciones', startTextX, 18.5);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('Sistemas de Aire Comprimido, Secadores y Maquinaria Industrial', startTextX, 22.5);

      // Metadata right block
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      const dateStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.text(`Fecha: ${dateStr}`, 283, 13.5, { align: 'right' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Total partidas: ${filteredItems.length} | Clientes: ${uniqueClients.length}`, 283, 18, { align: 'right' });
      if (selectedClientFilter !== 'all') {
        doc.text(`Filtro cliente: ${selectedClientFilter}`, 283, 22.5, { align: 'right' });
      }

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(14, 26, 283, 26);

      // Table data matching exactly the columns in the image:
      // No. De de parte | descripción | precio | cliente | modelo | serie
      const tableData = filteredItems.map(it => [
        it.partNumber || '-',
        it.description || '-',
        it.price > 0 ? `$ ${it.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$ 0.00',
        it.clientName || '-',
        it.equipmentModel || '-',
        it.serialNumber || '-'
      ]);

      autoTable(doc, {
        startY: 29,
        head: [['No. De de parte', 'descripción', 'precio', 'cliente', 'modelo', 'serie']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 162, 232], // Exact cyan #00A2E8
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'left',
          valign: 'middle',
          cellPadding: 2.5
        },
        styles: {
          font: 'Helvetica',
          fontSize: 8,
          cellPadding: 2.2,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 38, fontStyle: 'bold' },
          1: { cellWidth: 85 },
          2: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
          3: { cellWidth: 44, fontStyle: 'bold', textColor: [2, 132, 199] },
          4: { cellWidth: 38 },
          5: { cellWidth: 38 }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didDrawPage: (data) => {
          const pageCount = (doc as any).internal.getNumberOfPages();
          const pageNumber = data.pageNumber;
          
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.line(14, 200, 283, 200);

          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text('MVL Control y Mantenimiento Industrial • Documento Oficial del Sistema • Catálogo de Refacciones', 14, 204);
          doc.text(`Página ${pageNumber} de ${pageCount}`, 283, 204, { align: 'right' });
        }
      });

      const sanitizedClient = selectedClientFilter !== 'all' ? `_${selectedClientFilter.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `Kits_de_clientes_MVL${sanitizedClient}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      showFeedback('Archivo PDF generado y descargado exitosamente.');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showFeedback('Ocurrió un error al generar el PDF. Abriendo vista para imprimir.', 'error');
      setIsPdfPreviewOpen(true);
    } finally {
      setIsGeneratingPdf(false);
    }
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

  const handleConfirmImport = async () => {
    if (importPreview.length === 0) return;

    const count = importPreview.length;
    const mode = importMode;
    const itemsToSave = importPreview;

    setIsImportModalOpen(false);
    setImportPreview([]);

    if (mode === 'replace') {
      saveItems(itemsToSave);
      showFeedback(`Guardando ${count} registros en Supabase...`);
      await syncItemsToSupabase(itemsToSave, 'replace');
    } else {
      const combined = [...items, ...itemsToSave];
      saveItems(combined);
      showFeedback(`Guardando ${count} nuevos registros en Supabase...`);
      await syncItemsToSupabase(itemsToSave, 'append');
    }
  };

  // ==========================================
  // SQL DDL SCRIPT GENERATOR
  // ==========================================
  const sqlScript = `-- ====================================================================
-- SISTEMA MVL: TABLAS PARA "KITS DE CLIENTES" Y "CATÁLOGO DE VENTAS"
-- Compatible con PostgreSQL / Supabase / Google Cloud SQL
-- ====================================================================

-- 1. Creación o actualización de la tabla customer_kits
CREATE TABLE IF NOT EXISTS public.customer_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_number VARCHAR(100) NOT NULL,            -- "No. De de parte" (ej. 2903 7526 00)
    description VARCHAR(255) NOT NULL,            -- "descripción" (ej. filtro de aceite)
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,   -- "precio" (ej. 77.16)
    currency VARCHAR(10) DEFAULT 'USD',           -- Moneda ('USD' o 'MXN')
    client_name VARCHAR(150) NOT NULL,            -- "cliente" (ej. Isocindu, Impresos Leon)
    equipment_model VARCHAR(100) NOT NULL,        -- "modelo" (ej. GA 18 Pack, GA 45 FF)
    serial_number VARCHAR(100) NOT NULL,          -- "serie" (ej. CAI 847490, API 540370)
    stock NUMERIC(10, 2) DEFAULT 0,               -- Stock actual disponible en inventario
    min_stock NUMERIC(10, 2) DEFAULT 0,           -- Nivel de stock mínimo para alertas
    is_active BOOLEAN DEFAULT true,               -- Estado activo (true) o desactivado (false)
    notes TEXT,                                   -- Observaciones técnicas adicionales
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la tabla ya existía previamente, agregar las nuevas columnas:
ALTER TABLE public.customer_kits ADD COLUMN IF NOT EXISTS stock NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.customer_kits ADD COLUMN IF NOT EXISTS min_stock NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.customer_kits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Creación de la tabla sales_catalog (Catálogo de Ventas para Equipos y Refacciones)
CREATE TABLE IF NOT EXISTS public.sales_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL DEFAULT 'refaccion', -- 'equipo', 'refaccion', 'consumible', 'servicio'
    part_number VARCHAR(100) NOT NULL,             -- Número de parte o código
    name VARCHAR(255) NOT NULL,                    -- Nombre o descripción comercial
    description TEXT,                              -- Descripción técnica detallada
    category VARCHAR(100),                         -- Categoría (Compresores, Secadores, Filtros, etc.)
    brand VARCHAR(100),                            -- Marca (Atlas Copco, Sullair, Kaeser, etc.)
    model VARCHAR(100),                            -- Modelo de equipo compatible
    client_name VARCHAR(150),                      -- Cliente asignado o específico (opcional)
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,    -- Precio unitario de lista
    currency VARCHAR(10) DEFAULT 'USD',            -- Moneda ('USD' o 'MXN')
    stock NUMERIC(10, 2) DEFAULT 0,                -- Stock actual
    min_stock NUMERIC(10, 2) DEFAULT 0,            -- Stock mínimo
    unit VARCHAR(20) DEFAULT 'PZA',                -- Unidad de medida ('PZA', 'LT', 'JGO', etc.)
    is_active BOOLEAN DEFAULT true,                -- Activo / Inactivo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices para búsquedas ultra-rápidas en cotizaciones
CREATE INDEX IF NOT EXISTS idx_customer_kits_client ON public.customer_kits(client_name);
CREATE INDEX IF NOT EXISTS idx_customer_kits_model ON public.customer_kits(equipment_model);
CREATE INDEX IF NOT EXISTS idx_customer_kits_part ON public.customer_kits(part_number);
CREATE INDEX IF NOT EXISTS idx_customer_kits_active ON public.customer_kits(is_active);

CREATE INDEX IF NOT EXISTS idx_sales_catalog_part ON public.sales_catalog(part_number);
CREATE INDEX IF NOT EXISTS idx_sales_catalog_type ON public.sales_catalog(type);
CREATE INDEX IF NOT EXISTS idx_sales_catalog_client ON public.sales_catalog(client_name);
CREATE INDEX IF NOT EXISTS idx_sales_catalog_active ON public.sales_catalog(is_active);

-- 4. Triggers automáticos para updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
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
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_sales_catalog_updated_at ON public.sales_catalog;
CREATE TRIGGER trigger_sales_catalog_updated_at
BEFORE UPDATE ON public.sales_catalog
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
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
                  Módulo Ventas / Coordinación
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Catálogo maestro de refacciones por cliente, modelo y número de serie (compresores, secadores y sistemas industriales).
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Supabase status badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold bg-slate-50 border-slate-200">
              {supabaseStatus === 'connected' ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold" title="Conectado a la tabla customer_kits en Supabase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">Supabase:</span>
                  <span>{supabaseCount ?? 0} en BD</span>
                </span>
              ) : supabaseStatus === 'syncing' ? (
                <span className="flex items-center gap-1.5 text-sky-700 font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                  <span>Sincronizando... {syncProgress ? `${syncProgress.current}/${syncProgress.total}` : ''}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Supabase Local</span>
                </span>
              )}
              <button 
                onClick={fetchKitsFromSupabase}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Refrescar datos desde Supabase"
              >
                <RefreshCw className={`w-3 h-3 ${supabaseStatus === 'checking' ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Sync button to push items to Supabase */}
            <button
              onClick={() => syncItemsToSupabase(items, 'replace')}
              disabled={isSyncing || items.length === 0}
              className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 active:scale-98"
              title="Guardar / Sincronizar todos los registros mostrados en pantalla con la tabla customer_kits de Supabase"
            >
              {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
              <span>Guardar en Supabase</span>
            </button>

            {/* Synchronize to Sales Catalog button */}
            <button
              onClick={handleSyncToSalesCatalog}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs active:scale-98"
              title="Sincronizar automáticamente las refacciones de estos kits con el nuevo Catálogo de Ventas"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sincronizar a Catálogo</span>
            </button>

            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
              title="Ver y Copiar Script SQL"
            >
              <Database className="w-3.5 h-3.5 text-[#0196C1]" />
              <span className="hidden sm:inline">Ver Script SQL</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 active:scale-98"
              title="Descargar Catálogo de Kits en formato PDF con membrete y logotipo"
            >
              {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={() => setIsPdfPreviewOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
              title="Vista previa e impresión con logotipo oficial"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Vista Previa / Imprimir</span>
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

      {/* SYNC TO SUPABASE BANNER (Alerting user when local items exist but Supabase is empty) */}
      {items.length > 0 && (supabaseCount === 0 || (supabaseCount !== null && supabaseCount < items.length)) && (
        <div className="bg-gradient-to-r from-amber-50 to-sky-50 border-2 border-amber-300/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span>Tienes {items.length} partidas en tu pantalla listas para guardar en Supabase</span>
                <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold">Acción pendiente</span>
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                La tabla <code className="bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">customer_kits</code> en Supabase tiene {supabaseCount ?? 0} registros. Haz clic en el botón para subirlos ahora mismo.
              </p>
            </div>
          </div>
          <button
            onClick={() => syncItemsToSupabase(items, 'replace')}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-sky-600 hover:from-amber-700 hover:to-sky-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0 active:scale-98 disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            <span>{isSyncing ? `Subiendo a Supabase (${syncProgress?.current || 0}/${syncProgress?.total || items.length})...` : `⚡ Subir las ${items.length} partidas a Supabase`}</span>
          </button>
        </div>
      )}

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

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('active')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedStatusFilter === 'active' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Activos ({stats.activeCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('inactive')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedStatusFilter === 'inactive' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Desactivados ({stats.inactiveCount})
            </button>
          </div>

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
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-[#0092d0] transition-colors border-r border-sky-400/50 min-w-[200px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>descripción</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th 
                    onClick={() => { setSortField('price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-[#0092d0] transition-colors border-r border-sky-400/50 w-28 text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>precio</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th 
                    onClick={() => { setSortField('clientName'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-[#0092d0] transition-colors border-r border-sky-400/50 w-44"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>cliente</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th 
                    onClick={() => { setSortField('equipmentModel'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-[#0092d0] transition-colors border-r border-sky-400/50 w-36"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>modelo</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th 
                    onClick={() => { setSortField('serialNumber'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-[#0092d0] transition-colors border-r border-sky-400/50 w-36"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>serie</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th className="py-3 px-3.5 border-r border-sky-400/50 w-24 text-center">
                    Stock
                  </th>
                  <th className="py-3 px-3.5 border-r border-sky-400/50 w-24 text-center">
                    Estado
                  </th>
                  <th className="py-3 px-3 text-center w-28">Acciones</th>
                </tr>
              </thead>

              {/* TABLE BODY WITH DISTINCT CELLS */}
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-sky-50/40 transition-colors group ${
                      item.isActive === false ? 'opacity-60 bg-slate-50/60' : ''
                    }`}
                  >
                    {/* No. De de parte */}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 border-r border-slate-100 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span>{item.partNumber}</span>
                        {item.isActive === false && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">Desactivado</span>
                        )}
                      </div>
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

                    {/* Stock */}
                    <td className="py-2.5 px-3.5 text-center border-r border-slate-100">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                        (item.stock || 0) > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.stock ?? 0} pzas
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-2.5 px-3.5 text-center border-r border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => handleToggleActive(item, e)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          item.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title={item.isActive !== false ? 'Clic para desactivar' : 'Clic para activar'}
                      >
                        {item.isActive !== false ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100">
                        {/* Ver Ficha Detallada */}
                        <button
                          type="button"
                          onClick={() => setViewingKitItem(item)}
                          className="p-1 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer transition-colors"
                          title="Ver ficha técnica detallada"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-500 hover:text-[#0196C1] hover:bg-sky-50 rounded-lg cursor-pointer transition-colors"
                          title="Editar refacción"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {/* Desactivar / Activar */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleActive(item, e)}
                          className={`p-1 rounded-lg cursor-pointer transition-colors ${
                            item.isActive !== false 
                              ? 'text-emerald-600 hover:text-amber-600 hover:bg-amber-50' 
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={item.isActive !== false ? 'Desactivar registro' : 'Activar registro'}
                        >
                          {item.isActive !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        {/* Eliminar */}
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
                onClick={handleExportPdf}
                disabled={isGeneratingPdf}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 font-bold rounded-lg border border-slate-200 cursor-pointer shadow-2xs flex items-center gap-1"
                title="Exportar registros a PDF"
              >
                <FileText className="w-3 h-3 text-rose-600" />
                <span>.PDF</span>
              </button>
              <button
                onClick={() => setIsPdfPreviewOpen(true)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 cursor-pointer shadow-2xs flex items-center gap-1"
                title="Vista previa e impresión"
              >
                <Printer className="w-3 h-3 text-slate-600" />
                <span>Imprimir</span>
              </button>
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

                    {/* Stock disponible */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Stock Actual (piezas)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-mono font-bold text-slate-900 focus:border-[#0196C1]"
                      />
                    </div>

                    {/* Stock mínimo */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Stock Mínimo (alerta)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formMinStock}
                        onChange={(e) => setFormMinStock(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-mono font-bold text-slate-900 focus:border-[#0196C1]"
                      />
                    </div>

                    {/* Estado activo / inactivo */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Estado en Catálogo
                      </label>
                      <select
                        value={formIsActive ? 'active' : 'inactive'}
                        onChange={(e) => setFormIsActive(e.target.value === 'active')}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800 focus:border-[#0196C1]"
                      >
                        <option value="active">Activo (Disponible para cotizar)</option>
                        <option value="inactive">Desactivado (Fuera de catálogo)</option>
                      </select>
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

      {/* ========================================================================= */}
      {/* PDF PREVIEW & PRINT MODAL WITH OFFICIAL MVL BRANDING & LOGO               */}
      {/* ========================================================================= */}
      {isPdfPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-5xl w-full flex flex-col max-h-[92vh] shadow-2xl border border-slate-200 print:shadow-none print:border-none print:max-h-full print:rounded-none">
            {/* Header Tools (Hidden when printing via print:hidden) */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Vista Previa de Exportación PDF</h3>
                  <p className="text-[11px] text-slate-500">
                    Formato institucional de Kits de Clientes con logotipo oficial de MVL
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                  title="Descargar archivo PDF directamente a tu dispositivo"
                >
                  {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Descargar PDF (.pdf)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
                  title="Imprimir o guardar como PDF mediante el diálogo del sistema"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Guardar</span>
                </button>
                <button
                  onClick={() => setIsPdfPreviewOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Cerrar vista"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 print:bg-white print:p-0">
              <div id="printable-kits-area" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 space-y-6">
                
                {/* Header banner with MVL logo */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b-2 border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-20 flex items-center justify-center bg-white shrink-0">
                      <img 
                        src="/mvl.png" 
                        alt="MVL Logo" 
                        className="h-14 max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://appdesignproyectos.com/mvl.png';
                        }}
                      />
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight">KITS DE CLIENTES MVL</h1>
                      <p className="text-xs font-bold text-[#00A2E8] uppercase tracking-wide">MVL CONTROL Y MANTENIMIENTO INDUSTRIAL</p>
                      <p className="text-[11px] text-slate-500">Catálogo Maestro de Refacciones, Compresores y Maquinaria</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs space-y-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none w-full sm:w-auto border sm:border-0 border-slate-100">
                    <div className="font-semibold text-slate-800">
                      Fecha: <span className="font-normal text-slate-600">{new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      Total de Partidas: <span className="font-bold text-[#00A2E8]">{filteredItems.length}</span>
                    </div>
                    {selectedClientFilter !== 'all' && (
                      <div className="text-[11px] text-slate-600 font-medium">
                        Cliente: <strong className="text-slate-900">{selectedClientFilter}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cyan table matching user's reference image */}
                <div className="overflow-hidden border border-slate-300 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#00A2E8] text-white">
                        <th className="py-2.5 px-3 font-bold border-r border-sky-400">No. De de parte</th>
                        <th className="py-2.5 px-3 font-bold border-r border-sky-400">descripción</th>
                        <th className="py-2.5 px-3 font-bold border-r border-sky-400 text-right">precio</th>
                        <th className="py-2.5 px-3 font-bold border-r border-sky-400">cliente</th>
                        <th className="py-2.5 px-3 font-bold border-r border-sky-400">modelo</th>
                        <th className="py-2.5 px-3 font-bold">serie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-medium italic">
                            No hay registros para mostrar.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item, idx) => (
                          <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                              {item.partNumber}
                            </td>
                            <td className="py-2 px-3 text-slate-800 border-r border-slate-200">
                              {item.description}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                              {item.price > 0 ? `$ ${item.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$ 0.00'}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                              {item.clientName}
                            </td>
                            <td className="py-2 px-3 text-slate-700 border-r border-slate-200 whitespace-nowrap">
                              {item.equipmentModel}
                            </td>
                            <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                              {item.serialNumber}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Document Footer */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
                  <span>MVL CONTROL Y MANTENIMIENTO INDUSTRIAL • DOCUMENTO OFICIAL</span>
                  <span>Generado electrónicamente desde el sistema de control</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED ITEM VIEW MODAL                                                  */}
      {/* ========================================================================= */}
      {viewingKitItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0196C1] flex items-center justify-center text-white font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Ficha Técnica de Refacción</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Parte No. {viewingKitItem.partNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingKitItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    viewingKitItem.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {viewingKitItem.isActive !== false ? 'Activo en Catálogo' : 'Desactivado'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Precio Unitario</span>
                  <span className="text-xl font-mono font-black text-slate-900">
                    ${viewingKitItem.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cliente Asignado</span>
                  <span className="text-sm font-bold text-slate-900">{viewingKitItem.clientName}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Equipo / Modelo</span>
                  <span className="text-sm font-bold text-slate-900">{viewingKitItem.equipmentModel}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Número de Serie</span>
                  <span className="text-sm font-mono font-bold text-slate-700">{viewingKitItem.serialNumber || 'N/A'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock Disponible</span>
                  <span className="text-sm font-mono font-black text-emerald-600">
                    {viewingKitItem.stock ?? 0} piezas
                  </span>
                  {viewingKitItem.minStock && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Mínimo: {viewingKitItem.minStock} pzas
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block mb-1">Descripción del Ítem</span>
                <p className="text-xs text-slate-800 font-semibold">{viewingKitItem.description}</p>
                {viewingKitItem.notes && (
                  <p className="text-xs text-slate-500 mt-2 italic bg-white/70 p-2 rounded-lg border border-sky-100">
                    Notas: {viewingKitItem.notes}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const itemToEdit = viewingKitItem;
                    setViewingKitItem(null);
                    handleOpenEdit(itemToEdit);
                  }}
                  className="px-4 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Datos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingKitItem(null)}
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
