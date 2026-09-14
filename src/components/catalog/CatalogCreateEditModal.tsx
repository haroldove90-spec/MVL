/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Check, Plus, Layers, Package, Wrench, Sparkles, 
  HelpCircle, DollarSign, Calculator, Tag, FolderTree, ToggleLeft, ToggleRight
} from 'lucide-react';
import { CatalogItem } from '../../types';
import { CatalogCategory, generateCatalogCode, ensureUUID } from '../../lib/catalogMasterData';

interface CatalogCreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: CatalogItem | null;
  initialType?: 'equipment' | 'part' | 'service';
  categories: CatalogCategory[];
  onSaveItem: (item: CatalogItem) => void;
  onQuickAddCategory?: (catName: string) => void;
}

export default function CatalogCreateEditModal({
  isOpen,
  onClose,
  editingItem,
  initialType = 'part',
  categories,
  onSaveItem,
  onQuickAddCategory
}: CatalogCreateEditModalProps) {
  const [itemType, setItemType] = useState<'equipment' | 'part' | 'service'>(
    editingItem ? (editingItem.type as any) : initialType
  );
  
  // Basic info
  const [itemCode, setItemCode] = useState('');
  const [nameOrModel, setNameOrModel] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('Kaeser');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [bulletsText, setBulletsText] = useState<string>('');

  // Commercial
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<'USD' | 'MXN'>('USD');
  const [stock, setStock] = useState<number>(5);
  const [minStock, setMinStock] = useState<number>(2);
  const [unit, setUnit] = useState('pza');

  // Operational
  const [clientName, setClientName] = useState('General / Todos');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [voltage, setVoltage] = useState('');
  const [location, setLocation] = useState('Almacén Central');
  const [deliveryTime, setDeliveryTime] = useState('Inmediata (Stock)');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  // Quick add category inline toggle
  const [showAddCatInline, setShowAddCatInline] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');
  const [showAddSubcatInline, setShowAddSubcatInline] = useState(false);
  const [inlineSubcatName, setInlineSubcatName] = useState('');

  // Initialize or reset form
  useEffect(() => {
    if (editingItem) {
      setItemType(editingItem.type as any);
      setItemCode(editingItem.itemCode || '');
      setNameOrModel(editingItem.nameOrModel || '');
      setDescription(editingItem.description || '');
      setBrand(editingItem.brand || 'Kaeser');
      setCategory(editingItem.category || categories[0]?.name || '');
      setSubcategory(editingItem.subcategory || '');
      setBulletsText(
        editingItem.bulletItems && editingItem.bulletItems.length > 0
          ? editingItem.bulletItems.join('\n')
          : ''
      );
      setPrice(editingItem.price || 0);
      setCurrency(editingItem.currency || 'USD');
      setStock(editingItem.stock !== undefined ? editingItem.stock : 5);
      setMinStock(editingItem.minStock !== undefined ? editingItem.minStock : 2);
      setUnit(editingItem.unit || (editingItem.type === 'equipment' ? 'equipo' : 'pza'));
      setClientName(editingItem.clientName || 'General / Todos');
      setEquipmentModel(editingItem.equipmentModel || '');
      setSerialNumber(editingItem.serialNumber || '');
      setCapacity(editingItem.capacity || '');
      setVoltage(editingItem.voltage || '');
      setLocation(editingItem.location || 'Almacén Central');
      setDeliveryTime(editingItem.deliveryTime || 'Inmediata (Stock)');
      setIsActive(editingItem.isActive !== undefined ? editingItem.isActive : true);
      setNotes(editingItem.notes || '');
    } else {
      setItemType(initialType);
      const defaultCat = categories[0]?.name || 'CLASE 01 — FILTRACIÓN';
      setCategory(defaultCat);
      setSubcategory(categories[0]?.subcategories?.[0] || '');
      setItemCode('');
      setNameOrModel('');
      setDescription('');
      setBrand(initialType === 'equipment' ? 'Kaeser' : 'Kaeser / OEM');
      setBulletsText('');
      setPrice(0);
      setCurrency('USD');
      setStock(initialType === 'equipment' ? 1 : 5);
      setMinStock(initialType === 'equipment' ? 1 : 2);
      setUnit(initialType === 'equipment' ? 'equipo' : initialType === 'service' ? 'servicio' : 'pza');
      setClientName('General / Todos');
      setEquipmentModel('');
      setSerialNumber('');
      setCapacity('');
      setVoltage('');
      setLocation('Almacén Central');
      setDeliveryTime('Inmediata (Stock)');
      setIsActive(true);
      setNotes('');
    }
  }, [editingItem, initialType, categories, isOpen]);

  if (!isOpen) return null;

  // Selected category object
  const currentCategoryObj = categories.find(c => c.name === category);

  // Auto-generate Code handler
  const handleAutoGenerateCode = () => {
    if (!currentCategoryObj) return;
    const generated = generateCatalogCode(
      currentCategoryObj.code || '01',
      subcategory,
      Date.now() % 900 + 100,
      currentCategoryObj.scope || 'general'
    );
    setItemCode(generated);
  };

  // IVA Calculations
  const ivaRate = 0.16;
  const ivaAmount = price * ivaRate;
  const totalWithIva = price + ivaAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameOrModel.trim()) return;

    const bulletItems = bulletsText
      .split('\n')
      .map(line => line.trim().replace(/^[•\-\*]\s*/, ''))
      .filter(line => line.length > 0);

    const itemPayload: CatalogItem = {
      id: ensureUUID(editingItem?.id),
      type: itemType === 'service' ? 'part' : itemType,
      itemCode: itemCode.trim() || `AUTO-${Date.now().toString().slice(-4)}`,
      nameOrModel: nameOrModel.trim(),
      description: description.trim(),
      brand: brand.trim(),
      category: category.trim(),
      subcategory: subcategory.trim() || undefined,
      bulletItems: bulletItems.length > 0 ? bulletItems : undefined,
      price: Number(price) || 0,
      currency,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      unit: unit.trim() || 'pza',
      clientName: clientName.trim() || 'General / Todos',
      equipmentModel: equipmentModel.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      capacity: capacity.trim() || undefined,
      voltage: voltage.trim() || undefined,
      location: location.trim() || undefined,
      deliveryTime: deliveryTime.trim() || 'Inmediata (Stock)',
      isActive,
      notes: notes.trim() || undefined,
      createdAt: editingItem?.createdAt || new Date().toISOString()
    };

    onSaveItem(itemPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0196C1]/10 flex items-center justify-center text-[#0196C1]">
              {itemType === 'equipment' ? <Layers className="w-5 h-5" /> : 
               itemType === 'service' ? <Wrench className="w-5 h-5" /> : 
               <Package className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? 'Editar Registro de Catálogo' : 'Dar de Alta en Catálogo de Ventas'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800">
                  {itemType === 'equipment' ? 'Equipo' : itemType === 'service' ? 'Servicio' : 'Refacción'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Especifique clase, código oficial, desglose de refacciones y precios para cotizaciones.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Type Selector (Equipo, Refacción, Servicio) */}
          {!editingItem && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setItemType('part');
                  setUnit('pza');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  itemType === 'part' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Refacción / Consumible</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setItemType('service');
                  setUnit('servicio');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  itemType === 'service' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Servicio / Mantenimiento</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setItemType('equipment');
                  setUnit('equipo');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  itemType === 'equipment' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Equipo Industrial</span>
              </button>
            </div>
          )}

          {/* Section 1: Clase & Subclase */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-[#0196C1]" />
                <span>Estructura de Clases & Categorías</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Norma HVAC & Compresores de Tornillo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Categoría / Clase */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clase / Categoría Principal *
                </label>
                <select
                  value={category}
                  onChange={e => {
                    const selectedCatName = e.target.value;
                    setCategory(selectedCatName);
                    const found = categories.find(c => c.name === selectedCatName);
                    if (found && found.subcategories.length > 0) {
                      setSubcategory(found.subcategories[0]);
                    } else {
                      setSubcategory('');
                    }
                  }}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0196C1]"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subclase / Subcategoría */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subcategoría / Subclase
                </label>
                {currentCategoryObj && currentCategoryObj.subcategories.length > 0 ? (
                  <select
                    value={subcategory}
                    onChange={e => setSubcategory(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0196C1]"
                  >
                    <option value="">-- Sin subclase específica --</option>
                    {currentCategoryObj.subcategories.map((sub, i) => (
                      <option key={i} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={subcategory}
                    onChange={e => setSubcategory(e.target.value)}
                    placeholder="Escriba la subcategoría..."
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0196C1]"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Código, Nombre y Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Código / Parte */}
            <div className="sm:col-span-5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Código / No. Parte *
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateCode}
                  className="text-[10px] text-[#0196C1] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  title="Generar código automático según clase"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-generar</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={itemCode}
                onChange={e => setItemCode(e.target.value)}
                placeholder="F-01-01-001 o 01.01 o 6.2000.0"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0196C1]"
              />
            </div>

            {/* Marca */}
            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Marca / Fabricante OEM
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="Kaeser, Atlas Copco, Carrier, Trane, York, Daikin..."
                  className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0196C1]"
                />
                <select
                  onChange={e => {
                    if (e.target.value) setBrand(e.target.value);
                  }}
                  className="w-28 py-2 px-2 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700"
                >
                  <option value="">Marcas...</option>
                  <option value="Kaeser">Kaeser</option>
                  <option value="Atlas Copco">Atlas Copco</option>
                  <option value="Ingersoll Rand">Ingersoll Rand</option>
                  <option value="Sullair">Sullair</option>
                  <option value="Carrier">Carrier</option>
                  <option value="Trane">Trane</option>
                  <option value="York">York</option>
                  <option value="Daikin">Daikin</option>
                  <option value="Mitsubishi">Mitsubishi</option>
                  <option value="LG">LG Industrial</option>
                  <option value="Universal OEM">Universal OEM</option>
                </select>
              </div>
            </div>

            {/* Nombre o Modelo */}
            <div className="sm:col-span-12">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {itemType === 'equipment' ? 'Modelo de Equipo *' : 
                 itemType === 'service' ? 'Nombre del Servicio Especializado *' : 
                 'Nombre de la Refacción o Consumible *'}
              </label>
              <input
                type="text"
                required
                value={nameOrModel}
                onChange={e => setNameOrModel(e.target.value)}
                placeholder={
                  itemType === 'equipment' 
                    ? 'Kaeser AS 30 T / Secador KES 030' 
                    : itemType === 'service'
                      ? 'Mantenimiento Preventivo a Enfriador de Líquido (Chiller)'
                      : 'Filtro de aire para compresor de tornillo 50 HP'
                }
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0196C1]"
              />
            </div>
          </div>

          {/* Section 3: Desglose de Refacciones y Servicios (Bullets • como en el PDF) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Desglose de Refacciones y Servicios (Formato Viñetas •)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                1 refacción o tarea por renglón
              </span>
            </div>
            <textarea
              rows={3}
              value={bulletsText}
              onChange={e => setBulletsText(e.target.value)}
              placeholder="• Filtro de aire de alta retención
• Filtro deshidratador líquido
• Malla coladora de succión
• Limpieza y ajuste de contactores"
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#0196C1]"
            />
          </div>

          {/* Section 4: Precios y Desglose Financiero (con IVA en tiempo real) */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Precio Unitario y Desglose de IVA</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700">
                Tasa IVA 16% calculada en tiempo real
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Precio Base */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Precio Base (Antes de IVA) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                    className="flex-1 py-2 px-3 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as any)}
                    className="w-24 py-2 px-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="USD">USD</option>
                    <option value="MXN">MXN</option>
                  </select>
                </div>
              </div>

              {/* Cálculo en vivo: IVA + Total */}
              <div className="sm:col-span-7 flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">IVA (16%)</span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    +${ivaAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">Total con IVA</span>
                  <span className="text-sm font-mono font-extrabold text-emerald-700">
                    ${totalWithIva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Stock y Unidades */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Actual 📦</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(parseInt(e.target.value) || 0)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0196C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Mínimo</label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={e => setMinStock(parseInt(e.target.value) || 0)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unidad de Medida</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="pza, servicio, kit, cubeta 19L, equipo..."
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
              />
            </div>
          </div>

          {/* Section 6: Ubicación, Compatibilidad y Tiempos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Equipo Compatible / Modelo</label>
              <input
                type="text"
                value={equipmentModel}
                onChange={e => setEquipmentModel(e.target.value)}
                placeholder="Para modelos: BSD 50, AS 30 T, GA 18, Chiller Carrier..."
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tiempo de Entrega</label>
              <input
                type="text"
                value={deliveryTime}
                onChange={e => setDeliveryTime(e.target.value)}
                placeholder="Inmediata (Stock) / 24 a 48 hrs / 1 a 2 semanas"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0196C1]"
              />
            </div>
          </div>

          {/* State Switch */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Estado en Catálogo</span>
              <span className="text-[11px] text-slate-500">
                {isActive 
                  ? 'Activo: disponible inmediatamente para cotizar en el módulo de ventas.' 
                  : 'Desactivado: pausado temporalmente.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
              <span>{isActive ? 'ACTIVO' : 'DESACTIVADO'}</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingItem ? 'Guardar Cambios' : 'Dar de Alta Registro'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
