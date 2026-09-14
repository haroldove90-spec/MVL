/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Package, Plus, Search, Filter, Eye, Edit2, Trash2, 
  ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, Database, 
  RefreshCw, FileSpreadsheet, ArrowUpDown, Wrench, ShieldCheck, 
  ExternalLink, Building2, Tag, DollarSign, Check, X, Copy, ShoppingCart, 
  Info, Upload, FolderTree, Sparkles, CheckSquare, Square
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CatalogItem, Client, CustomerKitItem } from '../types';
import { INITIAL_CATALOG_ITEMS, loadFromStorage, saveToStorage } from '../mockData';
import { supabase } from '../lib/supabase';
import { 
  CatalogCategory, 
  loadCatalogCategories, 
  saveCatalogCategories, 
  INITIAL_CATALOG_CATEGORIES, 
  generateCatalogSupabaseSql 
} from '../lib/catalogMasterData';

// Modular Catalog Modals
import CatalogGlobalDeleteModal from './catalog/CatalogGlobalDeleteModal';
import CatalogCategoriesModal from './catalog/CatalogCategoriesModal';
import CatalogImportModal from './catalog/CatalogImportModal';
import CatalogCreateEditModal from './catalog/CatalogCreateEditModal';

interface SalesCatalogModuleProps {
  clients?: Client[];
  onSelectForQuote?: (item: CatalogItem) => void;
  onNavigateToKits?: () => void;
  isAdmin?: boolean;
}

export default function SalesCatalogModule({ 
  clients = [], 
  onSelectForQuote,
  onNavigateToKits,
  isAdmin = true
}: SalesCatalogModuleProps) {
  // --- Persistent items state ---
  const [items, setItems] = useState<CatalogItem[]>(() =>
    loadFromStorage<CatalogItem[]>('mvl_sales_catalog', INITIAL_CATALOG_ITEMS)
  );

  useEffect(() => {
    saveToStorage('mvl_sales_catalog', items);
  }, [items]);

  // --- Categories & Classes state ---
  const [categories, setCategories] = useState<CatalogCategory[]>(() => loadCatalogCategories());

  // --- Multi-selection state for batch actions & selective deletion ---
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // --- Supabase connection state ---
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
          category: r.category || 'CLASE 01 — FILTRACIÓN',
          subcategory: r.subcategory || undefined,
          bulletItems: Array.isArray(r.bullet_items) ? r.bullet_items : undefined,
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

  // Sync current catalog to Supabase
  const syncToSupabase = async () => {
    setIsSyncing(true);
    setSupabaseStatus('syncing');

    try {
      const rows = items.map(item => ({
        id: item.id.startsWith('cat_') ? undefined : item.id,
        type: item.type,
        item_code: item.itemCode,
        name_or_model: item.nameOrModel,
        description: item.description,
        brand: item.brand,
        category: item.category,
        subcategory: item.subcategory || null,
        bullet_items: item.bulletItems || null,
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

      await supabase.from('catalog_items').delete().neq('name_or_model', '___NONE___');
      const { error } = await supabase.from('catalog_items').insert(rows);

      if (error) throw error;

      setSupabaseStatus('connected');
      showFeedback(`¡Éxito! ${rows.length} registros del catálogo guardados en Supabase (tabla catalog_items).`);
      fetchCatalogFromSupabase();
    } catch (err: any) {
      console.error('Error syncing catalog to Supabase:', err);
      setSupabaseStatus('disconnected');
      showFeedback(`Error al guardar en Supabase: ${err?.message || 'Error de conexión'}. Tus datos siguen seguros localmente.`, 'error');
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'inactive' && item.isActive) return false;
      if (stockFilter === 'in_stock' && item.stock <= 0) return false;
      if (stockFilter === 'low_stock' && (item.stock <= 0 || item.stock > item.minStock)) return false;
      if (stockFilter === 'out_of_stock' && item.stock > 0) return false;
      if (clientFilter !== 'all' && item.clientName !== clientFilter) return false;
      if (brandFilter !== 'all' && item.brand !== brandFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = (item.itemCode || '').toLowerCase().includes(q);
        const matchName = (item.nameOrModel || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        const matchSubcat = (item.subcategory || '').toLowerCase().includes(q);
        const matchClient = (item.clientName || '').toLowerCase().includes(q);
        const matchSerial = (item.serialNumber || '').toLowerCase().includes(q);
        const matchEquip = (item.equipmentModel || '').toLowerCase().includes(q);
        const matchBullets = item.bulletItems?.some(b => b.toLowerCase().includes(q));

        if (!matchCode && !matchName && !matchDesc && !matchBrand && !matchCat && !matchSubcat && !matchClient && !matchSerial && !matchEquip && !matchBullets) {
          return false;
        }
      }

      return true;
    });
  }, [items, typeFilter, statusFilter, stockFilter, clientFilter, brandFilter, categoryFilter, searchQuery]);

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

  // --- Modal Open States ---
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [createModalType, setCreateModalType] = useState<'equipment' | 'part' | 'service'>('part');
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  const [showGlobalDeleteModal, setShowGlobalDeleteModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // View item detail & Stock adjustment modals
  const [viewingItem, setViewingItem] = useState<CatalogItem | null>(null);
  const [adjustingStockItem, setAdjustingStockItem] = useState<CatalogItem | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(1);
  const [stockReason, setStockReason] = useState<string>('Entrada de almacén');

  // --- Handlers: Creation & Edition ---
  const openCreateModal = (type: 'equipment' | 'part' | 'service' = 'part') => {
    setEditingItem(null);
    setCreateModalType(type);
    setShowCreateEditModal(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setCreateModalType((item.type as any) || 'part');
    setShowCreateEditModal(true);
  };

  const handleSaveItem = async (payload: CatalogItem) => {
    if (editingItem) {
      setItems(prev => prev.map(i => i.id === payload.id ? payload : i));
      showFeedback(`Registro "${payload.nameOrModel}" actualizado correctamente.`);

      try {
        await supabase.from('catalog_items').update({
          type: payload.type,
          item_code: payload.itemCode,
          name_or_model: payload.nameOrModel,
          description: payload.description,
          brand: payload.brand,
          category: payload.category,
          subcategory: payload.subcategory || null,
          bullet_items: payload.bulletItems || null,
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
        }).eq('id', payload.id);
      } catch (err) {
        console.warn('Could not update row in Supabase:', err);
      }
    } else {
      setItems(prev => [payload, ...prev]);
      showFeedback(`Nuevo registro "${payload.nameOrModel}" dado de alta con éxito en el catálogo de ventas.`);

      try {
        await supabase.from('catalog_items').insert([{
          type: payload.type,
          item_code: payload.itemCode,
          name_or_model: payload.nameOrModel,
          description: payload.description,
          brand: payload.brand,
          category: payload.category,
          subcategory: payload.subcategory || null,
          bullet_items: payload.bulletItems || null,
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
        }]);
      } catch (err) {
        console.warn('Could not insert row in Supabase:', err);
      }
    }
  };

  // --- Handlers: Global Deletion & Restore ---
  const handleConfirmGlobalDelete = async (
    mode: 'all' | 'selected' | 'category',
    categoryToDelete?: string
  ) => {
    if (mode === 'all') {
      setItems([]);
      setSelectedItemIds(new Set());
      saveToStorage('mvl_sales_catalog', []);

      try {
        await supabase.from('catalog_items').delete().neq('name_or_model', '___NONE___');
      } catch (e) {
        console.warn('Could not empty Supabase table:', e);
      }

      showFeedback('Catálogo vaciado por completo. Ya no quedan registros.');
    } else if (mode === 'selected') {
      const idsArray = Array.from(selectedItemIds);
      setItems(prev => prev.filter(i => !selectedItemIds.has(i.id)));
      setSelectedItemIds(new Set());

      try {
        await supabase.from('catalog_items').delete().in('id', idsArray);
      } catch (e) {
        console.warn('Could not delete selected from Supabase:', e);
      }

      showFeedback(`${idsArray.length} registros seleccionados fueron eliminados.`);
    } else if (mode === 'category' && categoryToDelete) {
      setItems(prev => prev.filter(i => i.category !== categoryToDelete));
      setSelectedItemIds(prev => {
        const next = new Set(prev);
        items.forEach(i => {
          if (i.category === categoryToDelete) next.delete(i.id);
        });
        return next;
      });

      try {
        await supabase.from('catalog_items').delete().eq('category', categoryToDelete);
      } catch (e) {
        console.warn('Could not delete category from Supabase:', e);
      }

      showFeedback(`Se eliminaron todos los artículos de la clase "${categoryToDelete}".`);
    }
  };

  const handleRestoreDefaultCatalog = () => {
    setItems(INITIAL_CATALOG_ITEMS);
    saveToStorage('mvl_sales_catalog', INITIAL_CATALOG_ITEMS);
    setSelectedItemIds(new Set());
    showFeedback('Catálogo restaurado a los 10 productos base iniciales de fábrica.');
  };

  // --- Handlers: Categories Management ---
  const handleSaveCategories = (updatedCats: CatalogCategory[]) => {
    setCategories(updatedCats);
    saveCatalogCategories(updatedCats);
    showFeedback(`Estructura de ${updatedCats.length} categorías y clases guardada.`);
  };

  const handleRestoreDefaultCategories = () => {
    setCategories(INITIAL_CATALOG_CATEGORIES);
    saveCatalogCategories(INITIAL_CATALOG_CATEGORIES);
    showFeedback('Categorías y clases restauradas a las 35 clases estándar HVAC.');
  };

  // --- Handlers: Intelligent Import (PDF / Excel) ---
  const handleImportItems = async (
    importedRows: CatalogItem[],
    importMode: 'append' | 'replace'
  ) => {
    let newFullList: CatalogItem[] = [];

    if (importMode === 'replace') {
      newFullList = importedRows;
    } else {
      // Append without duplicating identical item codes
      const existingCodes = new Set(items.map(i => (i.itemCode || '').trim().toLowerCase()));
      const uniqueImported = importedRows.filter(
        i => !existingCodes.has((i.itemCode || '').trim().toLowerCase())
      );
      newFullList = [...uniqueImported, ...items];
    }

    setItems(newFullList);
    saveToStorage('mvl_sales_catalog', newFullList);
    showFeedback(
      `¡Importación exitosa! ${importedRows.length} registros procesados e integrados al catálogo.`
    );

    // Sync to Supabase in background
    try {
      const dbRows = newFullList.map(item => ({
        type: item.type,
        item_code: item.itemCode,
        name_or_model: item.nameOrModel,
        description: item.description,
        brand: item.brand,
        category: item.category,
        subcategory: item.subcategory || null,
        bullet_items: item.bulletItems || null,
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

      await supabase.from('catalog_items').delete().neq('name_or_model', '___NONE___');
      await supabase.from('catalog_items').insert(dbRows);
      setSupabaseStatus('connected');
    } catch (e) {
      console.warn('Background sync after import notice:', e);
    }
  };

  // --- Handlers: Selection & Batch Operations ---
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAllVisible = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleBatchActivate = () => {
    setItems(prev => prev.map(i => selectedItemIds.has(i.id) ? { ...i, isActive: true } : i));
    showFeedback(`${selectedItemIds.size} registros marcados como ACTIVOS.`);
  };

  const handleBatchDeactivate = () => {
    setItems(prev => prev.map(i => selectedItemIds.has(i.id) ? { ...i, isActive: false } : i));
    showFeedback(`${selectedItemIds.size} registros marcados como DESACTIVADOS.`);
  };

  // Single item toggle active
  const handleToggleActive = async (item: CatalogItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextActive = !item.isActive;

    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: nextActive } : i));
    showFeedback(
      `El registro "${item.nameOrModel}" ahora está ${nextActive ? 'ACTIVO' : 'DESACTIVADO'}.`,
      nextActive ? 'success' : 'info'
    );

    try {
      await supabase.from('catalog_items').update({ is_active: nextActive }).eq('id', item.id);
    } catch (err) {
      console.warn('Could not update active in Supabase:', err);
    }
  };

  // Single item delete
  const handleDeleteItem = async (item: CatalogItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`¿Está seguro de eliminar "${item.nameOrModel}" del catálogo?`)) return;

    setItems(prev => prev.filter(i => i.id !== item.id));
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    showFeedback(`Registro "${item.nameOrModel}" eliminado.`);

    try {
      await supabase.from('catalog_items').delete().eq('id', item.id);
    } catch (err) {
      console.warn('Could not delete from Supabase:', err);
    }
  };

  // Quick stock adjustment handler
  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockItem) return;

    const newStock = Math.max(0, adjustingStockItem.stock + Number(stockDelta));
    setItems(prev => prev.map(i => i.id === adjustingStockItem.id ? { ...i, stock: newStock } : i));
    showFeedback(`Stock actualizado para "${adjustingStockItem.nameOrModel}": ${newStock} ${adjustingStockItem.unit}. Motivo: ${stockReason}`);

    try {
      await supabase.from('catalog_items').update({ stock: newStock }).eq('id', adjustingStockItem.id);
    } catch (err) {
      console.warn('Could not update stock in Supabase:', err);
    }

    setAdjustingStockItem(null);
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredItems.map(item => ({
        'Tipo': item.type === 'equipment' ? 'EQUIPO' : 'REFACCION',
        'Código / Parte': item.itemCode || '',
        'Nombre / Modelo': item.nameOrModel || '',
        'Descripción Técnica': item.description || '',
        'Marca': item.brand || '',
        'Clase / Categoría': item.category || '',
        'Subcategoría': item.subcategory || '',
        'Desglose Bullets': item.bulletItems?.join(' • ') || '',
        'Precio Unitario': item.price || 0,
        'Moneda': item.currency || 'USD',
        'Stock Físico': item.stock || 0,
        'Stock Mínimo': item.minStock || 0,
        'Unidad': item.unit || 'pza',
        'Cliente Asignado': item.clientName || 'General / Todos',
        'Equipo Compatible': item.equipmentModel || '',
        'No. Serie': item.serialNumber || '',
        'Capacidad / HP': item.capacity || '',
        'Voltaje': item.voltage || '',
        'Ubicación Almacén': item.location || '',
        'Tiempo Entrega': item.deliveryTime || '',
        'Estado Registro': item.isActive ? 'ACTIVO' : 'DESACTIVADO',
        'Notas': item.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo Equipos y Refacciones');

      const maxCols = Object.keys(dataToExport[0] || {}).length;
      worksheet['!cols'] = Array(maxCols).fill({ wch: 20 });

      XLSX.writeFile(workbook, `Catalogo_MVL_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
      showFeedback('Archivo Excel exportado exitosamente con stock y especificaciones.');
    } catch (err: any) {
      console.error('Error exporting catalog to Excel:', err);
      showFeedback('Error al exportar Excel: ' + err.message, 'error');
    }
  };

  // Consolidate customer kits into catalog
  const handleSyncFromCustomerKits = () => {
    try {
      const kits = loadFromStorage<CustomerKitItem[]>('mvl_customer_kits', []);
      if (kits.length === 0) {
        showFeedback('No hay refacciones registradas en el módulo Kit de Clientes para consolidar.', 'info');
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
            brand: 'OEM / Kaeser / Carrier',
            category: 'CLASE 01 — FILTRACIÓN',
            subcategory: 'Filtros y Consumibles',
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
        showFeedback(`¡Consolidación exitosa! Se incorporaron ${addedCount} refacciones de Kits de Clientes al Catálogo.`);
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
                  Rol Ventas & Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestión integral de 35 clases HVAC y compresores, importación inteligente de PDF/Excel, borrado global y stock en tiempo real.
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

          {/* 1. Borrado Global / Vaciar */}
          <button
            onClick={() => setShowGlobalDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            title="Borrar de forma global o selectiva productos del catálogo"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Borrado Global</span>
          </button>

          {/* 2. Importar PDF o Excel Inteligente */}
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            title="Importar catálogo automáticamente desde PDF o Excel"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Importar PDF / Excel</span>
          </button>

          {/* 3. Categorías & Subcategorías */}
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-[#0196C1] border border-[#0196C1]/30 text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            title="Administrar las 35 clases y subcategorías del catálogo"
          >
            <FolderTree className="w-3.5 h-3.5 text-[#0196C1]" />
            <span>Categorías ({categories.length})</span>
          </button>

          {/* Sincronizar Supabase */}
          <button
            onClick={syncToSupabase}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            title="Guardar catálogo completo en Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar Supabase</span>
          </button>

          {/* Consolidar Kits */}
          <button
            onClick={handleSyncFromCustomerKits}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition-colors"
            title="Copiar refacciones existentes de Kits de Clientes al Catálogo"
          >
            <Wrench className="w-3.5 h-3.5 text-[#0196C1]" />
            <span>Consolidar Kits</span>
          </button>

          {/* SQL Modal */}
          <button
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            title="Ver script SQL DDL para Supabase"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>SQL Supabase</span>
          </button>

          {/* Exportar Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition-colors"
            title="Exportar catálogo filtrado a Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          {/* Dar de alta Equipo */}
          <button
            onClick={() => openCreateModal('equipment')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Equipo</span>
          </button>

          {/* Dar de alta Refacción / Producto */}
          <button
            onClick={() => openCreateModal('part')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Refacción / Producto</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setStockFilter('all'); setCategoryFilter('all'); }}
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
          <span className="text-[10px] text-slate-500 font-medium">Filtros, aceites y kits</span>
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
              placeholder="Buscar por código, modelo, parte, marca, clase o viñeta..."
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

          {/* Class / Category Filter */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#0196C1]"
            >
              <option value="all">📂 Todas las Clases ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status & Stock Filters */}
          <div className="md:col-span-2 flex gap-1.5">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="flex-1 py-2 px-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 font-semibold focus:outline-none focus:border-[#0196C1]"
            >
              <option value="all">⚡ Estado</option>
              <option value="active">🟢 Activos</option>
              <option value="inactive">⚪ Desact.</option>
            </select>

            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value as any)}
              className="flex-1 py-2 px-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 font-semibold focus:outline-none focus:border-[#0196C1]"
            >
              <option value="all">📦 Stock</option>
              <option value="in_stock">🟢 &gt;0</option>
              <option value="low_stock">🟡 Bajo</option>
              <option value="out_of_stock">🔴 0</option>
            </select>
          </div>
        </div>

        {/* Applied filters pills */}
        {(typeFilter !== 'all' || statusFilter !== 'all' || stockFilter !== 'all' || categoryFilter !== 'all' || clientFilter !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Filtros activos:</span>
            {categoryFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-[#0196C1] font-bold">
                Clase: {categoryFilter}
                <button onClick={() => setCategoryFilter('all')} className="cursor-pointer hover:text-black font-bold">×</button>
              </span>
            )}
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
                setCategoryFilter('all');
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

      {/* FLOATING BATCH ACTION BAR (When items are selected via checkbox) */}
      {selectedItemIds.size > 0 && (
        <div className="bg-slate-900 text-white p-3 sm:px-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0196C1] animate-pulse" />
            <span>
              <strong className="text-white text-sm font-extrabold">{selectedItemIds.size}</strong> registros seleccionados
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleBatchActivate}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1"
            >
              <ToggleRight className="w-3.5 h-3.5" />
              <span>Activar</span>
            </button>

            <button
              onClick={handleBatchDeactivate}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1"
            >
              <ToggleLeft className="w-3.5 h-3.5" />
              <span>Desactivar</span>
            </button>

            <button
              onClick={() => setShowGlobalDeleteModal(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar ({selectedItemIds.size})</span>
            </button>

            <button
              onClick={() => setSelectedItemIds(new Set())}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white font-bold rounded-xl cursor-pointer"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* MAIN CATALOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No se encontraron artículos en el catálogo</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Intente ajustar los filtros de búsqueda, importe su catálogo en PDF/Excel o dé de alta un nuevo producto o refacción.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Importar PDF / Excel</span>
              </button>
              <button
                onClick={() => openCreateModal('part')}
                className="px-4 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                + Dar de Alta Producto
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  {/* Select all checkbox */}
                  <th className="py-3 px-3 w-8 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAllVisible}
                      className="cursor-pointer text-slate-400 hover:text-slate-700 p-0.5"
                      title="Seleccionar / deseleccionar todos los visibles"
                    >
                      {selectedItemIds.size > 0 && selectedItemIds.size === filteredItems.length ? (
                        <CheckSquare className="w-4 h-4 text-[#0196C1]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-10 text-center">Tipo</th>
                  <th className="py-3 px-3">Código / Parte</th>
                  <th className="py-3 px-4">Modelo / Descripción</th>
                  <th className="py-3 px-3">Clase / Subcategoría</th>
                  <th className="py-3 px-3">Marca</th>
                  <th className="py-3 px-3 text-right">Precio Unit. Base</th>
                  <th className="py-3 px-3 text-center">Stock Físico</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-3 text-center w-36">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const isLow = item.stock > 0 && item.stock <= item.minStock;
                  const isOut = item.stock <= 0;
                  const isSelected = selectedItemIds.has(item.id);

                  return (
                    <tr 
                      key={item.id}
                      className={`transition-colors group ${
                        isSelected 
                          ? 'bg-sky-50/70' 
                          : !item.isActive 
                            ? 'bg-slate-50/60 opacity-70 hover:bg-slate-100/60' 
                            : 'hover:bg-sky-50/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectItem(item.id)}
                          className="cursor-pointer text-slate-400 hover:text-slate-700 p-0.5"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#0196C1]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

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

                      {/* Modelo / Descripción & Viñetas */}
                      <td className="py-3 px-4 max-w-sm">
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
                        {/* Viñetas / Bullets preview */}
                        {item.bulletItems && item.bulletItems.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded">
                              • {item.bulletItems[0]}
                            </span>
                            {item.bulletItems.length > 1 && (
                              <span className="text-[9px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">
                                +{item.bulletItems.length - 1} refacciones
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Clase / Categoría */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 text-[11px] block line-clamp-1">
                          {item.category || 'General'}
                        </span>
                        {item.subcategory && (
                          <span className="text-[10px] text-slate-400 block line-clamp-1">
                            {item.subcategory}
                          </span>
                        )}
                      </td>

                      {/* Marca */}
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {item.brand || 'Kaeser / OEM'}
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

                      {/* Acciones */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* Cotizar */}
                          {onSelectForQuote && (
                            <button
                              onClick={() => onSelectForQuote(item)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                              title="Agregar directamente a Cotización"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          )}

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

                          {/* Toggle */}
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

      {/* ==================== MODAL: CREATE / EDIT PRODUCT ==================== */}
      <CatalogCreateEditModal
        isOpen={showCreateEditModal}
        onClose={() => {
          setShowCreateEditModal(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        initialType={createModalType}
        categories={categories}
        onSaveItem={handleSaveItem}
      />

      {/* ==================== MODAL: GLOBAL DELETION ==================== */}
      <CatalogGlobalDeleteModal
        isOpen={showGlobalDeleteModal}
        onClose={() => setShowGlobalDeleteModal(false)}
        totalItemsCount={items.length}
        selectedCount={selectedItemIds.size}
        categories={categories}
        onConfirmGlobalDelete={handleConfirmGlobalDelete}
        onRestoreDefaultCatalog={handleRestoreDefaultCatalog}
      />

      {/* ==================== MODAL: CATEGORIES & SUBCATEGORIES ==================== */}
      <CatalogCategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        categories={categories}
        onSaveCategories={handleSaveCategories}
        onRestoreDefaultCategories={handleRestoreDefaultCategories}
      />

      {/* ==================== MODAL: INTELLIGENT IMPORT (PDF / EXCEL) ==================== */}
      <CatalogImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        categories={categories}
        onImportItems={handleImportItems}
      />

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

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Código / Parte</span>
                <span className="font-mono font-bold text-slate-800">{viewingItem.itemCode || 'S/N'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Marca</span>
                <span className="font-bold text-slate-800">{viewingItem.brand || 'Kaeser / OEM'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Clase / Categoría</span>
                <span className="font-semibold text-slate-800">{viewingItem.category}</span>
                {viewingItem.subcategory && (
                  <span className="text-[10px] text-slate-500 block">Sub: {viewingItem.subcategory}</span>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Precio Unitario</span>
                <span className="font-mono font-bold text-[#0196C1] text-sm">
                  ${viewingItem.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} {viewingItem.currency}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Stock Físico</span>
                <span className="font-bold text-slate-800">{viewingItem.stock} {viewingItem.unit} (Mín: {viewingItem.minStock})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Ubicación / Entrega</span>
                <span className="font-semibold text-slate-700">{viewingItem.location || 'Almacén'} • {viewingItem.deliveryTime || 'Inmediata'}</span>
              </div>
            </div>

            {/* Bullets Breakdown */}
            {viewingItem.bulletItems && viewingItem.bulletItems.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                  Desglose de Refacciones y Tareas Incluidas
                </span>
                <ul className="space-y-1 text-xs text-slate-700 font-mono">
                  {viewingItem.bulletItems.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#0196C1] font-bold">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {viewingItem.description && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Descripción Técnica</span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{viewingItem.description}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const toEdit = viewingItem;
                  setViewingItem(null);
                  openEditModal(toEdit);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: STOCK ADJUSTMENT ==================== */}
      {adjustingStockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0196C1]/10 flex items-center justify-center text-[#0196C1]">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ajuste Manual de Stock</h3>
                  <p className="text-xs text-slate-500">{adjustingStockItem.nameOrModel}</p>
                </div>
              </div>
              <button onClick={() => setAdjustingStockItem(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-600">Stock Actual Físico:</span>
                <span className="text-sm font-extrabold text-slate-900 font-mono">
                  {adjustingStockItem.stock} {adjustingStockItem.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cantidad a Ajustar (+ Entrada / - Salida)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStockDelta(-1)}
                    className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    step="1"
                    required
                    value={stockDelta}
                    onChange={e => setStockDelta(parseFloat(e.target.value) || 0)}
                    className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-[#0196C1]"
                  />
                  <button
                    type="button"
                    onClick={() => setStockDelta(1)}
                    className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    +1
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo del Movimiento</label>
                <select
                  value={stockReason}
                  onChange={e => setStockReason(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="Entrada de almacén">Entrada de almacén (compra a proveedor)</option>
                  <option value="Salida por orden de servicio">Salida por orden de servicio en campo</option>
                  <option value="Ajuste por inventario físico">Ajuste por inventario físico / auditoría</option>
                  <option value="Devolución de cliente">Devolución de cliente / garantía</option>
                  <option value="Merma o daño">Merma o daño en almacén</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Stock Resultante:</span>
                <span className="text-base font-extrabold text-emerald-950 font-mono">
                  {Math.max(0, adjustingStockItem.stock + Number(stockDelta))} {adjustingStockItem.unit}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingStockItem(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: SQL SUPABASE ==================== */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Script SQL DDL para Supabase</h3>
                  <p className="text-xs text-slate-500">
                    Crea las tablas <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">catalog_categories</code> y <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">catalog_items</code> con índices y RLS.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowSqlModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed select-all">
              <pre>{generateCatalogSupabaseSql()}</pre>
            </div>

            <div className="flex justify-end gap-2 pt-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateCatalogSupabaseSql());
                  showFeedback('Script SQL completo copiado al portapapeles.');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar SQL Completo</span>
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
