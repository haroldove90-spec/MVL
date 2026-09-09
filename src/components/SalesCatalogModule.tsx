/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Package, Plus, Search, Filter, Eye, Edit2, Trash2, 
  ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, Database, 
  RefreshCw, FileSpreadsheet, ArrowUpDown, Wrench, ShieldCheck, 
  ExternalLink, Building2, Tag, DollarSign, Check, X, Copy, ShoppingCart, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CatalogItem, Client, CustomerKitItem } from '../types';
import { INITIAL_CATALOG_ITEMS, loadFromStorage, saveToStorage } from '../mockData';
import { supabase } from '../lib/supabase';

interface SalesCatalogModuleProps {
  clients?: Client[];
  onSelectForQuote?: (item: CatalogItem) => void;
  onNavigateToKits?: () => void;
}

export default function SalesCatalogModule({ 
  clients = [], 
  onSelectForQuote,
  onNavigateToKits 
}: SalesCatalogModuleProps) {
  // --- Persistent state ---
  const [items, setItems] = useState<CatalogItem[]>(() =>
    loadFromStorage<CatalogItem[]>('mvl_sales_catalog', INITIAL_CATALOG_ITEMS)
  );

  useEffect(() => {
    saveToStorage('mvl_sales_catalog', items);
  }, [items]);

  // --- Supabase state ---
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'syncing'>('connected');
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Fetch catalog from Supabase on mount
  const fetchCatalogFromSupabase = async () => {
    try {
      setSupabaseStatus('syncing');
      const { data, error } = await supabase
        .from('catalog_items')
        .select('*')
        .order('name_or_model', { ascending: true });

      if (error) {
        // If table doesn't exist yet or offline
        console.warn('Notice from Supabase catalog_items:', error.message);
        setSupabaseStatus('disconnected');
        return;
      }

      if (data && data.length > 0) {
        const mapped: CatalogItem[] = data.map(r => ({
          id: r.id,
          type: r.type || 'part',
          itemCode: r.item_code || '',
          nameOrModel: r.name_or_model || '',
          description: r.description || '',
          brand: r.brand || '',
          category: r.category || 'General',
          price: Number(r.price) || 0,
          currency: r.currency || 'USD',
          stock: Number(r.stock) || 0,
          minStock: Number(r.min_stock) || 0,
          unit: r.unit || 'pza',
          clientName: r.client_name || 'General / Todos',
          equipmentModel: r.equipment_model || '',
          serialNumber: r.serial_number || '',
          capacity: r.capacity || '',
          voltage: r.voltage || '',
          location: r.location || '',
          deliveryTime: r.delivery_time || 'Inmediata (Stock)',
          isActive: r.is_active !== undefined ? Boolean(r.is_active) : true,
          notes: r.notes || '',
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
        setItems(mapped);
        saveToStorage('mvl_sales_catalog', mapped);
        setSupabaseStatus('connected');
      } else {
        setSupabaseStatus('connected');
      }
    } catch (err: any) {
      console.warn('Could not load catalog_items from Supabase:', err);
      setSupabaseStatus('disconnected');
    }
  };

  useEffect(() => {
    fetchCatalogFromSupabase();
  }, []);

  // Sync to Supabase
  const syncToSupabase = async () => {
    setIsSyncing(true);
    setSupabaseStatus('syncing');

    try {
      // Clean and batch upsert
      const rows = items.map(item => ({
        id: item.id.startsWith('cat_') ? undefined : item.id, // Let postgres assign UUID if mock
        type: item.type,
        item_code: item.itemCode,
        name_or_model: item.nameOrModel,
        description: item.description,
        brand: item.brand,
        category: item.category,
        price: item.price,
        currency: item.currency,
        stock: item.stock,
        min_stock: item.minStock,
        unit: item.unit,
        client_name: item.clientName || 'General / Todos',
        equipment_model: item.equipmentModel || '',
        serial_number: item.serialNumber || '',
        capacity: item.capacity || '',
        voltage: item.voltage || '',
        location: item.location || '',
        delivery_time: item.deliveryTime || 'Inmediata (Stock)',
        is_active: item.isActive,
        notes: item.notes || ''
      }));

      // Clear existing and re-insert for sync consistency
      await supabase.from('catalog_items').delete().neq('name_or_model', '___NONE___');
      const { error } = await supabase.from('catalog_items').insert(rows);

      if (error) throw error;

      setSupabaseStatus('connected');
      showFeedback(`¡Éxito! ${rows.length} registros del catálogo guardados en Supabase (tabla catalog_items).`);
      fetchCatalogFromSupabase();
    } catch (err: any) {
      console.error('Error syncing catalog to Supabase:', err);
      setSupabaseStatus('disconnected');
      showFeedback(`Error al guardar en Supabase: ${err?.message || 'Error de conexión'}. Tus datos siguen seguros en el navegador.`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Filtering and Search states ---
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'equipment' | 'part'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');

  // Unique clients and brands
  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.clientName && i.clientName !== 'General / Todos') set.add(i.clientName);
    });
    clients.forEach(c => set.add(c.name));
    return Array.from(set).sort();
  }, [items, clients]);

  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.brand) set.add(i.brand);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Status filter
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'inactive' && item.isActive) return false;

      // Stock filter
      if (stockFilter === 'in_stock' && item.stock <= 0) return false;
      if (stockFilter === 'low_stock' && (item.stock <= 0 || item.stock > item.minStock)) return false;
      if (stockFilter === 'out_of_stock' && item.stock > 0) return false;

      // Client filter
      if (clientFilter !== 'all' && item.clientName !== clientFilter) return false;

      // Brand filter
      if (brandFilter !== 'all' && item.brand !== brandFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = (item.itemCode || '').toLowerCase().includes(q);
        const matchName = (item.nameOrModel || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        const matchClient = (item.clientName || '').toLowerCase().includes(q);
        const matchSerial = (item.serialNumber || '').toLowerCase().includes(q);
        const matchEquip = (item.equipmentModel || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchDesc && !matchBrand && !matchClient && !matchSerial && !matchEquip) {
          return false;
        }
      }

      return true;
    });
  }, [items, typeFilter, statusFilter, stockFilter, clientFilter, brandFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const equipments = items.filter(i => i.type === 'equipment').length;
    const parts = items.filter(i => i.type === 'part').length;
    const active = items.filter(i => i.isActive).length;
    const inactive = items.filter(i => !i.isActive).length;
    const inStock = items.filter(i => i.stock > 0).length;
    const lowStock = items.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
    const outOfStock = items.filter(i => i.stock <= 0).length;
    return { total, equipments, parts, active, inactive, inStock, lowStock, outOfStock };
  }, [items]);

  // --- Modals state ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'equipment' | 'part'>('part');
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [viewingItem, setViewingItem] = useState<CatalogItem | null>(null);
  const [adjustingStockItem, setAdjustingStockItem] = useState<CatalogItem | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(1);
  const [stockReason, setStockReason] = useState<string>('Entrada de almacén');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [syncToKitChecked, setSyncToKitChecked] = useState(true);

  // Form states for Create / Edit
  const [formType, setFormType] = useState<'equipment' | 'part'>('part');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formBrand, setFormBrand] = useState('Kaeser');
  const [formCategory, setFormCategory] = useState('Filtros');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState<'USD' | 'MXN'>('USD');
  const [formStock, setFormStock] = useState<number>(5);
  const [formMinStock, setFormMinStock] = useState<number>(2);
  const [formUnit, setFormUnit] = useState('pza');
  const [formClient, setFormClient] = useState('General / Todos');
  const [formEquipModel, setFormEquipModel] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [formVoltage, setFormVoltage] = useState('');
  const [formLocation, setFormLocation] = useState('Almacén Central');
  const [formDelivery, setFormDelivery] = useState('Inmediata (Stock)');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formNotes, setFormNotes] = useState('');

  const openCreateModal = (type: 'equipment' | 'part' = 'part') => {
    setEditingItem(null);
    setFormType(type);
    setFormCode(type === 'equipment' ? `EQ-${Date.now().toString().slice(-4)}` : '');
    setFormName('');
    setFormDesc('');
    setFormBrand('Kaeser');
    setFormCategory(type === 'equipment' ? 'Compresores de Tornillo' : 'Filtros');
    setFormPrice(0);
    setFormCurrency('USD');
    setFormStock(type === 'equipment' ? 1 : 5);
    setFormMinStock(1);
    setFormUnit(type === 'equipment' ? 'equipo' : 'pza');
    setFormClient('General / Todos');
    setFormEquipModel('');
    setFormSerial('');
    setFormCapacity('');
    setFormVoltage('440V 3F');
    setFormLocation('Almacén Central');
    setFormDelivery('Inmediata (Stock)');
    setFormIsActive(true);
    setFormNotes('');
    setShowCreateModal(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormCode(item.itemCode || '');
    setFormName(item.nameOrModel || '');
    setFormDesc(item.description || '');
    setFormBrand(item.brand || 'Kaeser');
    setFormCategory(item.category || '');
    setFormPrice(item.price || 0);
    setFormCurrency(item.currency || 'USD');
    setFormStock(item.stock || 0);
    setFormMinStock(item.minStock || 0);
    setFormUnit(item.unit || (item.type === 'equipment' ? 'equipo' : 'pza'));
    setFormClient(item.clientName || 'General / Todos');
    setFormEquipModel(item.equipmentModel || '');
    setFormSerial(item.serialNumber || '');
    setFormCapacity(item.capacity || '');
    setFormVoltage(item.voltage || '');
    setFormLocation(item.location || '');
    setFormDelivery(item.deliveryTime || 'Inmediata (Stock)');
    setFormIsActive(item.isActive !== undefined ? item.isActive : true);
    setFormNotes(item.notes || '');
    setShowCreateModal(true);
  };

  // Handle Save (Create or Edit)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showFeedback('Por favor ingrese el nombre del modelo o refacción.', 'error');
      return;
    }

    const payload: CatalogItem = {
      id: editingItem ? editingItem.id : `cat_${Date.now()}`,
      type: formType,
      itemCode: formCode.trim() || (formType === 'part' ? 'S/N' : `EQ-${Date.now().toString().slice(-4)}`),
      nameOrModel: formName.trim(),
      description: formDesc.trim(),
      brand: formBrand.trim(),
      category: formCategory.trim(),
      price: Number(formPrice) || 0,
      currency: formCurrency,
      stock: Number(formStock) || 0,
      minStock: Number(formMinStock) || 0,
      unit: formUnit.trim(),
      clientName: formClient.trim() || 'General / Todos',
      equipmentModel: formEquipModel.trim(),
      serialNumber: formSerial.trim(),
      capacity: formCapacity.trim(),
      voltage: formVoltage.trim(),
      location: formLocation.trim(),
      deliveryTime: formDelivery.trim(),
      isActive: formIsActive,
      notes: formNotes.trim(),
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingItem) {
      setItems(prev => prev.map(i => i.id === editingItem.id ? payload : i));
      showFeedback(`Registro "${payload.nameOrModel}" actualizado correctamente.`);

      // Update in Supabase if id is UUID
      try {
        await supabase.from('catalog_items').update({
          type: payload.type,
          item_code: payload.itemCode,
          name_or_model: payload.nameOrModel,
          description: payload.description,
          brand: payload.brand,
          category: payload.category,
          price: payload.price,
          currency: payload.currency,
          stock: payload.stock,
          min_stock: payload.minStock,
          unit: payload.unit,
          client_name: payload.clientName,
          equipment_model: payload.equipmentModel,
          serial_number: payload.serialNumber,
          capacity: payload.capacity,
          voltage: payload.voltage,
          location: payload.location,
          delivery_time: payload.deliveryTime,
          is_active: payload.isActive,
          notes: payload.notes
        }).eq('id', editingItem.id);
      } catch (err) {
        console.warn('Could not update row in Supabase:', err);
      }
    } else {
      setItems(prev => [payload, ...prev]);
      showFeedback(`Nuevo registro "${payload.nameOrModel}" dado de alta con éxito.`);

      // Also if sync to customer kits is checked and has a client, synchronize into mvl_customer_kits!
      if (syncToKitChecked && formClient && formClient !== 'General / Todos') {
        try {
          const currentKits = loadFromStorage<CustomerKitItem[]>('mvl_customer_kits', []);
          const newKitPart: CustomerKitItem = {
            id: `kit_${Date.now()}`,
            partNumber: payload.itemCode,
            description: payload.nameOrModel + (payload.description ? ` (${payload.description})` : ''),
            price: payload.price,
            clientName: payload.clientName || 'General',
            equipmentModel: payload.equipmentModel || (payload.type === 'equipment' ? payload.nameOrModel : 'General'),
            serialNumber: payload.serialNumber || 'S/N',
            currency: payload.currency,
            stock: payload.stock,
            minStock: payload.minStock,
            unit: payload.unit,
            isActive: payload.isActive,
            createdAt: new Date().toISOString(),
            notes: payload.notes
          };
          const updatedKits = [newKitPart, ...currentKits];
          saveToStorage('mvl_customer_kits', updatedKits);

          // Try insert in customer_kits table
          supabase.from('customer_kits').insert([{
            part_number: newKitPart.partNumber,
            description: newKitPart.description,
            price: newKitPart.price,
            client_name: newKitPart.clientName,
            equipment_model: newKitPart.equipmentModel,
            serial_number: newKitPart.serialNumber,
            currency: newKitPart.currency,
            stock: newKitPart.stock,
            min_stock: newKitPart.minStock,
            is_active: newKitPart.isActive,
            notes: newKitPart.notes
          }]).then(() => {});
        } catch (e) {
          console.warn('Sync to customer_kits local error:', e);
        }
      }
    }

    setShowCreateModal(false);
  };

  // Toggle Active / Inactive
  const handleToggleActive = async (item: CatalogItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextActive = !item.isActive;

    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: nextActive } : i));
    showFeedback(`El registro "${item.nameOrModel}" ahora está ${nextActive ? 'ACTIVO' : 'DESACTIVADO'}.`, nextActive ? 'success' : 'info');

    try {
      await supabase
        .from('catalog_items')
        .update({ is_active: nextActive })
        .eq('id', item.id);
    } catch (err) {
      console.warn('Error updating is_active in Supabase:', err);
    }
  };

  // Delete item
  const handleDeleteItem = async (item: CatalogItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`¿Está seguro de eliminar "${item.nameOrModel}" (${item.itemCode}) del catálogo? Esta acción no se puede deshacer.`)) {
      return;
    }

    setItems(prev => prev.filter(i => i.id !== item.id));
    showFeedback(`Registro "${item.nameOrModel}" eliminado.`);

    try {
      await supabase.from('catalog_items').delete().eq('id', item.id);
    } catch (err) {
      console.warn('Error deleting item from Supabase:', err);
    }
  };

  // Stock Adjustment Submit
  const handleStockAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockItem) return;

    const newStockVal = Math.max(0, adjustingStockItem.stock + stockDelta);
    setItems(prev => prev.map(i => i.id === adjustingStockItem.id ? { ...i, stock: newStockVal } : i));

    showFeedback(`Stock de "${adjustingStockItem.nameOrModel}" actualizado a ${newStockVal} ${adjustingStockItem.unit}. (${stockReason})`);

    try {
      await supabase.from('catalog_items').update({ stock: newStockVal }).eq('id', adjustingStockItem.id);
    } catch (err) {
      console.warn('Error updating stock in Supabase:', err);
    }

    setAdjustingStockItem(null);
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredItems.map((item, idx) => ({
        '#': idx + 1,
        'Tipo': item.type === 'equipment' ? 'EQUIPO' : 'REFACCIÓN',
        'Código / Parte': item.itemCode,
        'Modelo / Nombre': item.nameOrModel,
        'Descripción': item.description,
        'Marca': item.brand,
        'Categoría': item.category,
        'Precio': item.price,
        'Moneda': item.currency,
        'Stock Actual': item.stock,
        'Stock Mínimo': item.minStock,
        'Unidad': item.unit,
        'Estado Inventario': item.stock <= 0 ? 'AGOTADO' : (item.stock <= item.minStock ? 'STOCK BAJO' : 'EN STOCK'),
        'Cliente Asignado': item.clientName,
        'Equipo Compatible': item.equipmentModel || '',
        'No. Serie': item.serialNumber || '',
        'Capacidad / Potencia': item.capacity || '',
        'Voltaje': item.voltage || '',
        'Ubicación Almacén': item.location || '',
        'Tiempo Entrega': item.deliveryTime || '',
        'Estado Registro': item.isActive ? 'ACTIVO' : 'DESACTIVADO',
        'Notas': item.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo Equipos y Refacciones');

      // Auto-width columns
      const maxCols = Object.keys(dataToExport[0] || {}).length;
      worksheet['!cols'] = Array(maxCols).fill({ wch: 20 });

      XLSX.writeFile(workbook, `Catalogo_MVL_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
      showFeedback('Archivo Excel exportado exitosamente con stock y especificaciones.');
    } catch (err: any) {
      console.error('Error exporting catalog to Excel:', err);
      showFeedback('Error al exportar Excel: ' + err.message, 'error');
    }
  };

  // Import Customer Kits into Catalog
  const handleSyncFromCustomerKits = () => {
    try {
      const kits = loadFromStorage<CustomerKitItem[]>('mvl_customer_kits', []);
      if (kits.length === 0) {
        showFeedback('No hay refacciones registradas en el módulo Kit de Clientes para importar.', 'info');
        return;
      }

      let addedCount = 0;
      const existingCodes = new Set(items.map(i => (i.itemCode || '').trim().toLowerCase()));

      const newCatalogItems: CatalogItem[] = [];

      kits.forEach(kit => {
        const codeKey = (kit.partNumber || '').trim().toLowerCase();
        if (codeKey && !existingCodes.has(codeKey)) {
          existingCodes.add(codeKey);
          newCatalogItems.push({
            id: `cat_imported_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            type: 'part',
            itemCode: kit.partNumber,
            nameOrModel: kit.description,
            description: `Refacción registrada para equipo ${kit.equipmentModel} serie ${kit.serialNumber}`,
            brand: 'OEM / Kaeser / Atlas Copco',
            category: 'Filtros y Consumibles',
            price: kit.price || 0,
            currency: kit.currency || 'USD',
            stock: kit.stock !== undefined ? kit.stock : 2,
            minStock: kit.minStock !== undefined ? kit.minStock : 1,
            unit: kit.unit || 'pza',
            clientName: kit.clientName || 'General / Todos',
            equipmentModel: kit.equipmentModel || '',
            serialNumber: kit.serialNumber || '',
            location: 'Almacén General',
            deliveryTime: 'Inmediata (Stock)',
            isActive: kit.isActive !== undefined ? kit.isActive : true,
            notes: kit.notes || 'Importado desde Kit de Clientes',
            createdAt: new Date().toISOString()
          });
          addedCount++;
        }
      });

      if (addedCount > 0) {
        setItems(prev => [...newCatalogItems, ...prev]);
        showFeedback(`¡Sincronización exitosa! Se consolidaron ${addedCount} refacciones desde Kit de Clientes al Catálogo.`);
      } else {
        showFeedback('Todas las refacciones de los Kits de Clientes ya se encuentran en el Catálogo.', 'info');
      }
    } catch (e: any) {
      showFeedback('Error sincronizando kits: ' + e.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-semibold transition-all duration-300 animate-slide-up ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
          feedback.type === 'error' ? 'bg-rose-50 text-rose-900 border-rose-300' :
          'bg-sky-50 text-sky-900 border-sky-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> :
           feedback.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-600" /> :
           <Info className="w-5 h-5 text-sky-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0196C1]/10 flex items-center justify-center text-[#0196C1]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Catálogo de Equipos & Refacciones</h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#0196C1]/10 text-[#0196C1] border border-[#0196C1]/20">
                  Rol Ventas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Alta y administración de compresores, secadores, refacciones y control de stock en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Supabase Status Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-slate-50 border-slate-200">
            <span className={`w-2 h-2 rounded-full ${
              supabaseStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
              supabaseStatus === 'syncing' ? 'bg-amber-500 animate-ping' :
              'bg-slate-400'
            }`} />
            <span className="text-slate-700">
              {supabaseStatus === 'connected' ? 'Supabase Conectado' :
               supabaseStatus === 'syncing' ? 'Sincronizando...' : 'Local / Offline'}
            </span>
          </div>

          <button
            onClick={syncToSupabase}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            title="Guardar catálogo en la tabla catalog_items de Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar Supabase</span>
          </button>

          <button
            onClick={handleSyncFromCustomerKits}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-[#0196C1] border border-[#0196C1]/30 text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            title="Copiar refacciones existentes de Kits de Clientes al Catálogo"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Consolidar desde Kits</span>
          </button>

          <button
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            title="Ver script SQL DDL para Supabase"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>SQL Supabase</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition-colors"
            title="Exportar catálogo filtrado a Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={() => openCreateModal('equipment')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Dar de Alta Equipo</span>
          </button>

          <button
            onClick={() => openCreateModal('part')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Dar de Alta Refacción</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setStockFilter('all'); }}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-[#0196C1] transition-all"
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Registros</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
          <span className="text-[10px] text-slate-500 font-medium">Catálogo completo</span>
        </div>

        <div 
          onClick={() => { setTypeFilter('equipment'); }}
          className={`bg-white p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            typeFilter === 'equipment' ? 'border-[#0196C1] ring-2 ring-[#0196C1]/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Equipos</span>
            <Layers className="w-3.5 h-3.5 text-sky-500" />
          </span>
          <p className="text-xl font-extrabold text-sky-600 mt-1">{stats.equipments}</p>
          <span className="text-[10px] text-slate-500 font-medium">Compresores y secadores</span>
        </div>

        <div 
          onClick={() => { setTypeFilter('part'); }}
          className={`bg-white p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            typeFilter === 'part' ? 'border-[#0196C1] ring-2 ring-[#0196C1]/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Refacciones</span>
            <Package className="w-3.5 h-3.5 text-indigo-500" />
          </span>
          <p className="text-xl font-extrabold text-indigo-600 mt-1">{stats.parts}</p>
          <span className="text-[10px] text-slate-500 font-medium">Filtros, aceites y válvulas</span>
        </div>

        <div 
          onClick={() => { setStockFilter('in_stock'); }}
          className={`bg-white p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            stockFilter === 'in_stock' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>En Stock</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{stats.inStock}</p>
          <span className="text-[10px] text-emerald-700 font-medium">Listos para cotizar</span>
        </div>

        <div 
          onClick={() => { setStockFilter('low_stock'); }}
          className={`bg-white p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            stockFilter === 'low_stock' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Stock Bajo</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">{stats.lowStock}</p>
          <span className="text-[10px] text-amber-700 font-medium">Por debajo de mínimo</span>
        </div>

        <div 
          onClick={() => { setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive'); }}
          className={`bg-white p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            statusFilter === 'inactive' ? 'border-slate-500 ring-2 ring-slate-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Desactivados</span>
            <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
          </span>
          <p className="text-xl font-extrabold text-slate-500 mt-1">{stats.inactive}</p>
          <span className="text-[10px] text-slate-400 font-medium">Pausados / Historial</span>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por código, modelo, parte, marca o cliente..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0196C1] focus:ring-1 focus:ring-[#0196C1]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type tabs */}
          <div className="md:col-span-3 flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setTypeFilter('equipment')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                typeFilter === 'equipment' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Equipos ({stats.equipments})
            </button>
            <button
              onClick={() => setTypeFilter('part')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                typeFilter === 'part' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Refacciones ({stats.parts})
            </button>
          </div>

          {/* Client Filter */}
          <div className="md:col-span-2">
            <select
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-[#0196C1]"
            >
              <option value="all">🏢 Todos los clientes</option>
              {uniqueClients.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter (Activo / Inactivo) */}
          <div className="md:col-span-3 flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="flex-1 py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-[#0196C1]"
            >
              <option value="all">⚡ Estado: Todos</option>
              <option value="active">🟢 Solo Activos</option>
              <option value="inactive">⚪ Solo Desactivados</option>
            </select>

            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value as any)}
              className="flex-1 py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-[#0196C1]"
            >
              <option value="all">📦 Stock: Todos</option>
              <option value="in_stock">🟢 En Stock (&gt;0)</option>
              <option value="low_stock">🟡 Stock Bajo (≤ Mín)</option>
              <option value="out_of_stock">🔴 Agotado (0)</option>
            </select>
          </div>

        </div>

        {/* Applied filters pills */}
        {(typeFilter !== 'all' || statusFilter !== 'all' || stockFilter !== 'all' || clientFilter !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Filtros activos:</span>
            {typeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Tipo: {typeFilter === 'equipment' ? 'Equipos' : 'Refacciones'}
                <button onClick={() => setTypeFilter('all')} className="cursor-pointer hover:text-black">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Estado: {statusFilter === 'active' ? 'Activos' : 'Desactivados'}
                <button onClick={() => setStatusFilter('all')} className="cursor-pointer hover:text-black">×</button>
              </span>
            )}
            {stockFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Stock: {stockFilter}
                <button onClick={() => setStockFilter('all')} className="cursor-pointer hover:text-black">×</button>
              </span>
            )}
            {clientFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Cliente: {clientFilter}
                <button onClick={() => setClientFilter('all')} className="cursor-pointer hover:text-black">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-[#0196C1] font-medium">
                Texto: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="cursor-pointer hover:text-black">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setStockFilter('all');
                setClientFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-[#0196C1] hover:underline font-bold cursor-pointer ml-auto"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </div>

      {/* MAIN CATALOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No se encontraron artículos en el catálogo</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Intente ajustar los filtros de búsqueda o registre un nuevo equipo o refacción con los botones de arriba.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => openCreateModal('part')}
                className="px-4 py-2 bg-[#0196C1] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                + Dar de Alta Refacción
              </button>
              <button
                onClick={() => openCreateModal('equipment')}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                + Dar de Alta Equipo
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">Tipo</th>
                  <th className="py-3 px-3">Código / Parte</th>
                  <th className="py-3 px-4">Modelo / Descripción</th>
                  <th className="py-3 px-3">Marca / Categoría</th>
                  <th className="py-3 px-3">Cliente / Equipo</th>
                  <th className="py-3 px-3 text-right">Precio Unit.</th>
                  <th className="py-3 px-3 text-center">Stock Físico</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-3 text-center w-36">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const isLow = item.stock > 0 && item.stock <= item.minStock;
                  const isOut = item.stock <= 0;

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-sky-50/40 transition-colors group ${
                        !item.isActive ? 'bg-slate-50/60 opacity-65' : ''
                      }`}
                    >
                      {/* Tipo Icon */}
                      <td className="py-3 px-3 text-center">
                        {item.type === 'equipment' ? (
                          <span className="inline-flex p-1.5 rounded-lg bg-sky-100 text-sky-700" title="Equipo Industrial">
                            <Layers className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex p-1.5 rounded-lg bg-indigo-100 text-indigo-700" title="Refacción / Consumible">
                            <Package className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>

                      {/* Código / Parte */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {item.itemCode || 'S/N'}
                      </td>

                      {/* Modelo / Descripción */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 group-hover:text-[#0196C1] transition-colors flex items-center gap-1.5">
                          <span>{item.nameOrModel}</span>
                          {!item.isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-bold">
                              Inactivo
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        )}
                        {item.type === 'equipment' && item.capacity && (
                          <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            ⚡ {item.capacity}
                          </span>
                        )}
                      </td>

                      {/* Marca / Categoría */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">{item.brand || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400">{item.category || 'General'}</span>
                      </td>

                      {/* Cliente / Equipo Asociado */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700 block">
                          {item.clientName || 'General / Todos'}
                        </span>
                        {item.equipmentModel && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Mod: {item.equipmentModel}
                          </span>
                        )}
                        {item.serialNumber && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            SN: {item.serialNumber}
                          </span>
                        )}
                      </td>

                      {/* Precio */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-[10px] text-slate-400 block font-normal">{item.currency}</span>
                      </td>

                      {/* Stock con botón rápido de ajuste */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${
                            isOut ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            isLow ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {item.stock} {item.unit}
                          </span>
                          <button
                            onClick={() => {
                              setAdjustingStockItem(item);
                              setStockDelta(1);
                              setStockReason('Entrada de almacén');
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                            title="Ajustar stock"
                          >
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </div>
                        {item.minStock > 0 && (
                          <span className="text-[9px] text-slate-400 block">Mín: {item.minStock}</span>
                        )}
                      </td>

                      {/* Estado: Activo / Desactivado (Switch rápido) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => handleToggleActive(item, e)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-all ${
                            item.isActive 
                              ? 'bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title={item.isActive ? 'Haga clic para Desactivar (pausar de cotizaciones)' : 'Haga clic para Activar'}
                        >
                          {item.isActive ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
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

                      {/* Acciones: Ver, Editar, Desactivar, Borrar */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Ver Ficha */}
                          <button
                            onClick={() => setViewingItem(item)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer transition-colors"
                            title="Ver Ficha Técnica Detallada"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                            title="Editar registro"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Desactivar / Activar toggle */}
                          <button
                            onClick={(e) => handleToggleActive(item, e)}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              item.isActive ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={item.isActive ? 'Desactivar registro' : 'Activar registro'}
                          >
                            {item.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                          </button>

                          {/* Borrar */}
                          <button
                            onClick={(e) => handleDeleteItem(item, e)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Eliminar del catálogo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer pagination / stats */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Mostrando <strong className="text-slate-900">{filteredItems.length}</strong> de <strong className="text-slate-900">{items.length}</strong> registros en catálogo
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> En Stock ({stats.inStock})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Stock Bajo ({stats.lowStock})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Agotado ({stats.outOfStock})
            </span>
          </div>
        </div>
      </div>

      {/* ==================== MODAL: CREATE / EDIT RECORD ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0196C1]/10 flex items-center justify-center text-[#0196C1]">
                  {formType === 'equipment' ? <Layers className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingItem 
                      ? `Editar ${editingItem.type === 'equipment' ? 'Equipo' : 'Refacción'}` 
                      : `Dar de Alta ${formType === 'equipment' ? 'Equipo Industrial' : 'Refacción o Consumible'}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registre especificaciones, precios de lista y stock inicial.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 pt-4">
              
              {/* Type Switcher (only if new) */}
              {!editingItem && (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('equipment');
                      setFormCategory('Compresores de Tornillo');
                      setFormUnit('equipo');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formType === 'equipment' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Equipo (Compresor / Secador)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('part');
                      setFormCategory('Filtros');
                      setFormUnit('pza');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formType === 'part' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Refacción / Consumible</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Código o Número de Parte */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formType === 'equipment' ? 'Código de Equipo / Modelo' : 'Número de Parte Oficial *'}
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    placeholder={formType === 'equipment' ? 'EQ-KAE-AS30T' : '6.2000.0 / 2903 7526 00'}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0196C1]"
                  />
                </div>

                {/* Modelo / Nombre */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formType === 'equipment' ? 'Modelo de Equipo *' : 'Nombre de la Refacción *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder={formType === 'equipment' ? 'Kaeser AS 30 T / BSD 50' : 'Filtro de Aire / Válvula MPV'}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0196C1]"
                  />
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marca / Fabricante</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={e => setFormBrand(e.target.value)}
                    placeholder="Kaeser, Atlas Copco, Sullair, Ingersoll Rand..."
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                  >
                    {formType === 'equipment' ? (
                      <>
                        <option value="Compresores de Tornillo">Compresores de Tornillo</option>
                        <option value="Compresores de Pistón">Compresores de Pistón</option>
                        <option value="Secadores Refrigerativos">Secadores Refrigerativos</option>
                        <option value="Secadores Desecantes">Secadores Desecantes</option>
                        <option value="Tanques de Almacenamiento">Tanques de Almacenamiento</option>
                        <option value="Chillers y Enfriadores">Chillers y Enfriadores</option>
                        <option value="Bombas de Vacío">Bombas de Vacío</option>
                        <option value="Otros Equipos">Otros Equipos</option>
                      </>
                    ) : (
                      <>
                        <option value="Filtros de Aire">Filtros de Aire</option>
                        <option value="Filtros de Aceite">Filtros de Aceite</option>
                        <option value="Separadores">Separadores Aire/Aceite</option>
                        <option value="Aceites y Lubricantes">Aceites y Lubricantes</option>
                        <option value="Válvulas">Válvulas (MPV, Termostática, Admisión)</option>
                        <option value="Kits de Mantenimiento">Kits de Mantenimiento (2K, 4K, 8K)</option>
                        <option value="Eléctrico y Control">Eléctrico y Control (Contactores, Sensores)</option>
                        <option value="Mangueras y Sellos">Mangueras, O-rings y Sellos</option>
                        <option value="Consumibles y Varios">Consumibles y Varios</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Precio Unitario y Moneda */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Precio Unitario Base</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formPrice}
                      onChange={e => setFormPrice(parseFloat(e.target.value) || 0)}
                      className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0196C1]"
                    />
                    <select
                      value={formCurrency}
                      onChange={e => setFormCurrency(e.target.value as any)}
                      className="w-24 py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="USD">USD</option>
                      <option value="MXN">MXN</option>
                    </select>
                  </div>
                </div>

                {/* Stock Actual y Stock Mínimo */}
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Stock Actual 📦</label>
                      <input
                        type="number"
                        min="0"
                        value={formStock}
                        onChange={e => setFormStock(parseInt(e.target.value) || 0)}
                        className="w-full py-2 px-3 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Stock Mínimo</label>
                      <input
                        type="number"
                        min="0"
                        value={formMinStock}
                        onChange={e => setFormMinStock(parseInt(e.target.value) || 0)}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                      />
                    </div>
                  </div>
                </div>

                {/* Unidad de Medida */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    placeholder="pza, juego, kit, cubeta 19L, equipo, servicio..."
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                  />
                </div>

                {/* Cliente Asignado */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cliente Asignado</label>
                  <input
                    type="text"
                    value={formClient}
                    onChange={e => setFormClient(e.target.value)}
                    placeholder="General / Todos, o nombre del cliente (ANDREA, Isocindu...)"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                  />
                </div>

                {/* Si es Refacción: Equipo compatible */}
                {formType === 'part' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Equipo Compatible (Modelo)</label>
                    <input
                      type="text"
                      value={formEquipModel}
                      onChange={e => setFormEquipModel(e.target.value)}
                      placeholder="Para modelo: AS 30 T, BSD 50, GA 18, Universal..."
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                    />
                  </div>
                )}

                {/* Si es Equipo: Capacidad y Voltaje */}
                {formType === 'equipment' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Capacidad / Potencia</label>
                      <input
                        type="text"
                        value={formCapacity}
                        onChange={e => setFormCapacity(e.target.value)}
                        placeholder="Ej: 50 HP / 37 kW - 215 CFM"
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Voltaje / Fase</label>
                      <input
                        type="text"
                        value={formVoltage}
                        onChange={e => setFormVoltage(e.target.value)}
                        placeholder="Ej: 440V 3F 60Hz"
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Número de Serie (Placa)</label>
                      <input
                        type="text"
                        value={formSerial}
                        onChange={e => setFormSerial(e.target.value)}
                        placeholder="Ej: 1030 / CAI 847490"
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0196C1]"
                      />
                    </div>
                  </>
                )}

                {/* Ubicación en Almacén */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación en Almacén / Anaquel</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="Almacén Central - Rack F2 / Gaveta 4"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                  />
                </div>

                {/* Tiempo de Entrega */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tiempo de Entrega Cotizado</label>
                  <input
                    type="text"
                    value={formDelivery}
                    onChange={e => setFormDelivery(e.target.value)}
                    placeholder="Inmediata (Stock) / 24 a 48 hrs / 1 a 2 semanas"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                  />
                </div>
              </div>

              {/* Descripción técnica */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción Técnica Detallada</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Detalles de retención, compatibilidad, rosca, micras o especificaciones de fábrica..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notas Internas</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Comentarios adicionales para ventas..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
                />
              </div>

              {/* Checkbox: Sincronizar automáticamente con Kit de Clientes si aplica */}
              {!editingItem && formClient && formClient !== 'General / Todos' && (
                <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="syncToKit"
                    checked={syncToKitChecked}
                    onChange={e => setSyncToKitChecked(e.target.checked)}
                    className="w-4 h-4 text-[#0196C1] rounded focus:ring-[#0196C1] cursor-pointer"
                  />
                  <label htmlFor="syncToKit" className="text-xs text-slate-700 cursor-pointer">
                    <strong>Sincronizar con Kit de Clientes:</strong> Vincular automáticamente este registro al catálogo del cliente <span className="text-[#0196C1] font-bold">"{formClient}"</span>.
                  </label>
                </div>
              )}

              {/* Switch Activo / Desactivado */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Estado del Registro</span>
                  <span className="text-[11px] text-slate-500">
                    {formIsActive 
                      ? 'Activo: visible para cotizar y seleccionar en kits.' 
                      : 'Desactivado: pausado temporalmente sin borrar el historial.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                    formIsActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {formIsActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                  <span>{formIsActive ? 'ACTIVO' : 'DESACTIVADO'}</span>
                </button>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Guardar Cambios' : 'Dar de Alta Registro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: VIEW DETAILED RECORD ==================== */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  viewingItem.type === 'equipment' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {viewingItem.type === 'equipment' ? <Layers className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {viewingItem.type === 'equipment' ? 'Equipo Industrial' : 'Refacción Oficial'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      viewingItem.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {viewingItem.isActive ? '🟢 Activo' : '⚪ Desactivado'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    {viewingItem.nameOrModel}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Technical card body */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Código / Parte:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{viewingItem.itemCode || 'S/N'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Precio de Lista:</span>
                  <span className="font-mono font-extrabold text-emerald-700 text-sm">
                    ${viewingItem.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} {viewingItem.currency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Stock Actual:</span>
                  <span className="font-extrabold text-slate-900">
                    {viewingItem.stock} {viewingItem.unit} {viewingItem.stock <= viewingItem.minStock ? '(⚠️ Bajo stock)' : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Stock Mínimo:</span>
                  <span className="font-semibold text-slate-700">{viewingItem.minStock} {viewingItem.unit}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Marca:</span>
                  <span className="font-bold text-slate-800">{viewingItem.brand}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Categoría:</span>
                  <span className="font-semibold text-slate-800">{viewingItem.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Cliente Asignado:</span>
                  <span className="font-semibold text-slate-800">{viewingItem.clientName || 'General / Todos'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tiempo de Entrega:</span>
                  <span className="font-semibold text-slate-800">{viewingItem.deliveryTime || 'Inmediata'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Ubicación Almacén:</span>
                  <span className="font-semibold text-slate-800">{viewingItem.location || 'Almacén Central'}</span>
                </div>
                {viewingItem.equipmentModel && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Equipo Compatible:</span>
                    <span className="font-mono font-semibold text-slate-800">{viewingItem.equipmentModel}</span>
                  </div>
                )}
                {viewingItem.serialNumber && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Número de Serie:</span>
                    <span className="font-mono font-semibold text-slate-800">{viewingItem.serialNumber}</span>
                  </div>
                )}
                {viewingItem.capacity && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Capacidad / Potencia:</span>
                    <span className="font-semibold text-sky-800">{viewingItem.capacity}</span>
                  </div>
                )}
              </div>

              {viewingItem.description && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold mb-1">Descripción:</span>
                  <p className="text-slate-700 leading-relaxed">{viewingItem.description}</p>
                </div>
              )}

              {viewingItem.notes && (
                <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 text-amber-900 text-[11px]">
                  <strong>Nota:</strong> {viewingItem.notes}
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const itemToEdit = viewingItem;
                  setViewingItem(null);
                  openEditModal(itemToEdit);
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar este registro</span>
              </button>

              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: QUICK STOCK ADJUSTMENT ==================== */}
      {adjustingStockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ajustar Stock Físico</h3>
                  <span className="text-[11px] text-slate-500 line-clamp-1">{adjustingStockItem.nameOrModel}</span>
                </div>
              </div>
              <button onClick={() => setAdjustingStockItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between font-medium">
                <span className="text-slate-500">Stock Actual:</span>
                <span className="text-base font-extrabold text-slate-900">
                  {adjustingStockItem.stock} {adjustingStockItem.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad a modificar (+ para sumar, - para restar):</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStockDelta(prev => prev - 1)}
                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl font-extrabold text-lg flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={stockDelta}
                    onChange={e => setStockDelta(parseInt(e.target.value) || 0)}
                    className="flex-1 py-2 px-3 text-center text-base font-bold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setStockDelta(prev => prev + 1)}
                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl font-extrabold text-lg flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo del ajuste:</label>
                <select
                  value={stockReason}
                  onChange={e => setStockReason(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Entrada de almacén (Compra / Recepción)">Entrada de almacén (Compra / Recepción)</option>
                  <option value="Salida por Cotización / Instalación">Salida por Cotización / Instalación</option>
                  <option value="Inventario Físico / Corrección">Inventario Físico / Corrección</option>
                  <option value="Devolución de cliente">Devolución de cliente</option>
                  <option value="Merma o desecho">Merma o desecho</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-emerald-800">Nuevo Stock Resultante:</span>
                <span className="font-extrabold text-base text-emerald-900">
                  {Math.max(0, adjustingStockItem.stock + stockDelta)} {adjustingStockItem.unit}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingStockItem(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Guardar Nuevo Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: SQL SUPABASE SCRIPT ==================== */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#0196C1]" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Script SQL Actualizado para Supabase</h3>
                  <p className="text-xs text-slate-500">
                    Copia y ejecuta este script en el <strong>SQL Editor</strong> de tu panel de Supabase.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowSqlModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed select-all">
              <pre>{`-- ====================================================================
-- TABLA: catalog_items (Catálogo de Equipos y Refacciones con Stock)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL DEFAULT 'part', -- 'equipment' o 'part'
    item_code VARCHAR(100),                  -- No. de parte o código de equipo
    name_or_model VARCHAR(255) NOT NULL,     -- Modelo o Nombre de la refacción
    description TEXT,                        -- Descripción técnica
    brand VARCHAR(100),                      -- Kaeser, Atlas Copco, etc.
    category VARCHAR(100),                   -- Filtros, Válvulas, Aceites, Compresores
    price NUMERIC(12,2) DEFAULT 0,           -- Precio unitario de cotización
    currency VARCHAR(10) DEFAULT 'USD',      -- 'USD' o 'MXN'
    stock NUMERIC(10,2) DEFAULT 0,           -- Cantidad física en stock
    min_stock NUMERIC(10,2) DEFAULT 0,       -- Stock mínimo recomendado
    unit VARCHAR(50) DEFAULT 'pza',          -- pza, juego, kit, cubeta 19L
    client_name VARCHAR(255) DEFAULT 'General / Todos',
    equipment_model VARCHAR(255),            -- Equipo compatible para refacciones
    serial_number VARCHAR(100),              -- Número de serie para equipos
    capacity VARCHAR(150),                   -- HP / kW / CFM
    voltage VARCHAR(100),                    -- 440V 3F / 220V 3F
    location VARCHAR(150),                   -- Ubicación en almacén
    delivery_time VARCHAR(100) DEFAULT 'Inmediata (Stock)',
    is_active BOOLEAN DEFAULT true,          -- Activo o desactivado
    notes TEXT,                              -- Observaciones internas
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de búsqueda optimizados
CREATE INDEX IF NOT EXISTS idx_catalog_items_type ON public.catalog_items(type);
CREATE INDEX IF NOT EXISTS idx_catalog_items_code ON public.catalog_items(item_code);
CREATE INDEX IF NOT EXISTS idx_catalog_items_model ON public.catalog_items(name_or_model);
CREATE INDEX IF NOT EXISTS idx_catalog_items_brand ON public.catalog_items(brand);
CREATE INDEX IF NOT EXISTS idx_catalog_items_active ON public.catalog_items(is_active);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION update_catalog_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_catalog_items_updated_at ON public.catalog_items;
CREATE TRIGGER trigger_catalog_items_updated_at
BEFORE UPDATE ON public.catalog_items
FOR EACH ROW
EXECUTE FUNCTION update_catalog_items_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso completo para la app
DROP POLICY IF EXISTS "Permitir lectura publica catalog_items" ON public.catalog_items;
CREATE POLICY "Permitir lectura publica catalog_items"
ON public.catalog_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion catalog_items" ON public.catalog_items;
CREATE POLICY "Permitir insercion catalog_items"
ON public.catalog_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion catalog_items" ON public.catalog_items;
CREATE POLICY "Permitir actualizacion catalog_items"
ON public.catalog_items FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion catalog_items" ON public.catalog_items;
CREATE POLICY "Permitir eliminacion catalog_items"
ON public.catalog_items FOR DELETE USING (true);

-- ====================================================================
-- ACTUALIZACIÓN DE TABLA: customer_kits (Agregar is_active y stock)
-- ====================================================================
ALTER TABLE IF EXISTS public.customer_kits 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE IF EXISTS public.customer_kits 
ADD COLUMN IF NOT EXISTS stock NUMERIC(10,2) DEFAULT 0;

ALTER TABLE IF EXISTS public.customer_kits 
ADD COLUMN IF NOT EXISTS min_stock NUMERIC(10,2) DEFAULT 0;
`}</pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL DEFAULT 'part',
    item_code VARCHAR(100),
    name_or_model VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    category VARCHAR(100),
    price NUMERIC(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    stock NUMERIC(10,2) DEFAULT 0,
    min_stock NUMERIC(10,2) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pza',
    client_name VARCHAR(255) DEFAULT 'General / Todos',
    equipment_model VARCHAR(255),
    serial_number VARCHAR(100),
    capacity VARCHAR(150),
    voltage VARCHAR(100),
    location VARCHAR(150),
    delivery_time VARCHAR(100) DEFAULT 'Inmediata (Stock)',
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura publica catalog_items" ON public.catalog_items;
CREATE POLICY "Permitir lectura publica catalog_items" ON public.catalog_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercion catalog_items" ON public.catalog_items;
CREATE POLICY "Permitir insercion catalog_items" ON public.catalog_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir actualizacion catalog_items" ON public.catalog_items;
CREATE POLICY "Permitir actualizacion catalog_items" ON public.catalog_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir eliminacion catalog_items" ON public.catalog_items;
CREATE POLICY "Permitir eliminacion catalog_items" ON public.catalog_items FOR DELETE USING (true);

ALTER TABLE IF EXISTS public.customer_kits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.customer_kits ADD COLUMN IF NOT EXISTS stock NUMERIC(10,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.customer_kits ADD COLUMN IF NOT EXISTS min_stock NUMERIC(10,2) DEFAULT 0;
`);
                  showFeedback('Código SQL copiado al portapapeles.');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar SQL</span>
              </button>

              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
