/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Equipment, InventoryItem, LaborRate } from '../types';
import { INITIAL_LABOR_RATES, loadFromStorage, saveToStorage } from '../mockData';
import { 
  Package, Search, Plus, Layers, Tag, ShieldAlert, CheckCircle2, 
  Wrench, AlertCircle, Grid, Filter, Edit3, Trash2
} from 'lucide-react';

interface InventoryCatalogModuleProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  equipment: Equipment[];
  setEquipment?: React.Dispatch<React.SetStateAction<Equipment[]>>;
}

export default function InventoryCatalogModule({
  inventory,
  setInventory,
  equipment,
  setEquipment
}: InventoryCatalogModuleProps) {
  const [laborRates, setLaborRates] = useState<LaborRate[]>(() =>
    loadFromStorage<LaborRate[]>('mvl_labor_rates', INITIAL_LABOR_RATES)
  );

  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'equipment' | 'labor'>('inventory');

  // Inventory Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');

  // Anti-duplicity Check & Add Refacción
  const [checkPartNum, setCheckPartNum] = useState('');
  const [existingMatch, setExistingMatch] = useState<InventoryItem | null>(null);

  // New Part Form
  const [newName, setNewName] = useState('');
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newBrand, setNewBrand] = useState('Kaeser');
  const [newCategory, setNewCategory] = useState<any>('filtros');
  const [newStock, setNewStock] = useState(10);
  const [newMinStock, setNewMinStock] = useState(3);
  const [newPrice, setNewPrice] = useState(1200);
  const [newIsConsumable, setNewIsConsumable] = useState(true);
  const [newCubiculo, setNewCubiculo] = useState('A-102');
  const [newSpecText, setNewSpecText] = useState('');
  const [newCompatible, setNewCompatible] = useState('');

  // Add category / subcategory modal
  const [customCategories, setCustomCategories] = useState<string[]>(['filtros', 'aceites', 'pneumatic', 'electronic', 'refrigeration', 'consumable']);
  const [newCustomCategoryInput, setNewCustomCategoryInput] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // New Equipment Form
  const [eqSerial, setEqSerial] = useState('');
  const [eqModel, setEqModel] = useState('');
  const [eqBrand, setEqBrand] = useState('Atlas Copco');
  const [eqCapacity, setEqCapacity] = useState('50 HP / 37 kW');
  const [eqVoltage, setEqVoltage] = useState('440V 3F');
  const [eqType, setEqType] = useState<'compresor' | 'secador' | 'otros'>('compresor');

  // New Labor Rate Form
  const [lrCategory, setLrCategory] = useState<'instalacion' | 'preventivo' | 'correctivo' | 'predictivo' | 'revision'>('preventivo');
  const [lrCapacity, setLrCapacity] = useState<'5_15kW' | '37_50kW' | '75_120kW' | 'otros'>('37_50kW');
  const [lrHours, setLrHours] = useState<'2000' | '4000' | '6000' | '8000'>('2000');
  const [lrHourlyPrice, setLrHourlyPrice] = useState(1200);
  const [lrDistanceKmPrice, setLrDistanceKmPrice] = useState(18);

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.partNumber && item.partNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesBrand = selectedBrandFilter === 'all' || item.brand === selectedBrandFilter;
    return matchesQuery && matchesCat && matchesBrand;
  });

  const handleSearchCheck = (partNum: string) => {
    setCheckPartNum(partNum);
    if (!partNum.trim()) {
      setExistingMatch(null);
      return;
    }
    const found = inventory.find(i => i.partNumber?.toLowerCase() === partNum.trim().toLowerCase());
    setExistingMatch(found || null);
  };

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingMatch) {
      alert('Error: Ya existe un registro en el inventario global con el mismo Número de Parte.');
      return;
    }

    const newItem: InventoryItem = {
      id: 'i_' + Date.now(),
      code: newPartNumber ? `PART-${newPartNumber}` : `ITEM-${Date.now()}`,
      name: newName,
      partNumber: newPartNumber,
      brand: newBrand,
      category: newCategory,
      stock: newStock,
      minStock: newMinStock,
      price: newPrice,
      isConsumable: newIsConsumable,
      cubiculo: newCubiculo,
      createdById: 'usr_actual',
      createdByName: 'Vendedor / Administrador',
      specText: newSpecText,
      compatiblePartNumbers: newCompatible ? newCompatible.split(',').map(s => s.trim()) : []
    };

    const updated = [newItem, ...inventory];
    setInventory(updated);
    saveToStorage('mvl_inventory', updated);

    // Reset form
    setNewName('');
    setNewPartNumber('');
    setCheckPartNum('');
    setExistingMatch(null);
  };

  const handleAddCategory = () => {
    if (!newCustomCategoryInput.trim()) return;
    const cat = newCustomCategoryInput.trim().toLowerCase();
    if (!customCategories.includes(cat)) {
      setCustomCategories([...customCategories, cat]);
    }
    setNewCustomCategoryInput('');
    setShowAddCategoryModal(false);
  };

  const handleAddLaborRate = (e: React.FormEvent) => {
    e.preventDefault();
    const newRate: LaborRate = {
      id: 'lr_' + Date.now(),
      serviceCategory: lrCategory,
      capacityRange: lrCapacity,
      maintenanceHours: lrHours,
      hourlyPrice: lrHourlyPrice,
      distanceKmPrice: lrDistanceKmPrice
    };
    const updated = [newRate, ...laborRates];
    setLaborRates(updated);
    saveToStorage('mvl_labor_rates', updated);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Subtab Navigation */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'inventory' ? 'bg-[#0196C1] text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          1. Inventario Global & Refacciones (Anti-duplicidad)
        </button>
        <button
          onClick={() => setActiveSubTab('equipment')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'equipment' ? 'bg-[#0196C1] text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          2. Catálogo de Equipos por Cliente
        </button>
        <button
          onClick={() => setActiveSubTab('labor')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'labor' ? 'bg-[#0196C1] text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          3. Tarifas de Mano de Obra & Servicios
        </button>
      </div>

      {/* SUBTAB 1: Inventario Global */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          {/* Search-First & Búsqueda previa */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">Búsqueda Previa & Alta en Inventario Global</h3>
                <p className="text-[10px] text-slate-400">Verifique el número de parte antes de registrar para evitar duplicados.</p>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 cursor-pointer"
              >
                + Agregar Nuevas Categorías
              </button>
            </div>

            {/* Verification Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase">
                Paso 1: Búsqueda previa de No. de Parte
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escriba No. de Parte (Ej. 6.2012.0 o 1613-8720-00)..."
                  value={checkPartNum}
                  onChange={e => handleSearchCheck(e.target.value)}
                  className="flex-1 text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-mono"
                />
              </div>

              {existingMatch && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  No. de Parte ya existe en catálogo: {existingMatch.name} (Stock: {existingMatch.stock}, Ubicación: {existingMatch.cubiculo || 'N/A'})
                </div>
              )}

              {checkPartNum.trim() !== '' && !existingMatch && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  No. de Parte disponible. Puede proceder con el alta.
                </div>
              )}
            </div>

            {/* Formulario de Alta */}
            <form onSubmit={handleAddPart} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Nombre de Refacción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Filtro de Aceite Kaeser"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">No. Parte</label>
                <input
                  type="text"
                  required
                  placeholder="6.1981.1"
                  value={newPartNumber}
                  onChange={e => {
                    setNewPartNumber(e.target.value);
                    handleSearchCheck(e.target.value);
                  }}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Marca</label>
                <select
                  value={newBrand}
                  onChange={e => setNewBrand(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="Kaeser">Kaeser</option>
                  <option value="Atlas Copco">Atlas Copco</option>
                  <option value="Ingersoll Rand">Ingersoll Rand</option>
                  <option value="Sullair">Sullair</option>
                  <option value="Genérica">Genérica / Genérica Compatible</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Categoría</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none uppercase font-bold"
                >
                  {customCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Stock Actual</label>
                <input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={e => setNewStock(Number(e.target.value))}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Precio Catálogo ($ MXN)</label>
                <input
                  type="number"
                  min="0"
                  value={newPrice}
                  onChange={e => setNewPrice(Number(e.target.value))}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Cubículo / Almacén</label>
                <input
                  type="text"
                  placeholder="Estante A-1"
                  value={newCubiculo}
                  onChange={e => setNewCubiculo(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">No. Parte Compatibles</label>
                <input
                  type="text"
                  placeholder="Ej. 6.2012.0, AP-992"
                  value={newCompatible}
                  onChange={e => setNewCompatible(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="col-span-full pt-2">
                <button
                  type="submit"
                  disabled={Boolean(existingMatch)}
                  className="w-full py-2.5 bg-[#0196C1] hover:bg-[#017fa4] disabled:bg-slate-300 text-white text-xs font-black uppercase rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Refacción en Inventario Global
                </button>
              </div>
            </form>
          </div>

          {/* Listado de Inventario Filtros */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-sm font-black text-slate-800">Tabla de Inventario & Marcas</h3>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Buscar refacción o marca..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="all">Todas las Categorías</option>
                  {customCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200 text-[10px]">
                    <th className="py-2.5 px-3">Partida / Código</th>
                    <th className="py-2.5 px-3">Descripción</th>
                    <th className="py-2.5 px-3">Marca</th>
                    <th className="py-2.5 px-3">Stock Act.</th>
                    <th className="py-2.5 px-3">Cubículo</th>
                    <th className="py-2.5 px-3">Precio Catálogo</th>
                    <th className="py-2.5 px-3">Compatibilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono text-slate-600">{item.partNumber || item.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{item.name}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#0196C1]">{item.brand || 'Kaeser'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-extrabold ${item.stock <= item.minStock ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-800'}`}>
                          {item.stock} pzas
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{item.cubiculo || 'A-101'}</td>
                      <td className="py-2.5 px-3 font-black text-slate-900">${item.price.toLocaleString('es-MX')}</td>
                      <td className="py-2.5 px-3 text-[10px] text-slate-400 font-mono">
                        {item.compatiblePartNumbers?.join(', ') || 'Varias Marcas'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Alta de Equipos */}
      {activeSubTab === 'equipment' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-800">Alta & Registro de Equipos (Compresores, Secadores, Otros)</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">No. Serie</label>
              <input
                type="text"
                placeholder="BSD-2026-9912"
                value={eqSerial}
                onChange={e => setEqSerial(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Modelo</label>
              <input
                type="text"
                placeholder="GA75 VSD"
                value={eqModel}
                onChange={e => setEqModel(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Marca</label>
              <select
                value={eqBrand}
                onChange={e => setEqBrand(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                <option value="Kaeser">Kaeser</option>
                <option value="Atlas Copco">Atlas Copco</option>
                <option value="Ingersoll Rand">Ingersoll Rand</option>
                <option value="Sullair">Sullair</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Capacidad</label>
              <input
                type="text"
                placeholder="50 HP / 37 kW"
                value={eqCapacity}
                onChange={e => setEqCapacity(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Voltaje</label>
              <input
                type="text"
                placeholder="440V 3F"
                value={eqVoltage}
                onChange={e => setEqVoltage(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Categoría de Equipo</label>
              <select
                value={eqType}
                onChange={e => setEqType(e.target.value as any)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                <option value="compresor">Compresores</option>
                <option value="secador">Secador</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Servicios Mano de obra */}
      {activeSubTab === 'labor' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-800">Servicios y Mano de Obra (Rangos de Cobro)</h3>

          <form onSubmit={handleAddLaborRate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Categoría Servicio</label>
              <select
                value={lrCategory}
                onChange={e => setLrCategory(e.target.value as any)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
                <option value="revision">Revisión / Diagnóstico</option>
                <option value="instalacion">Instalación</option>
                <option value="predictivo">Predictivo</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Rango Capacidad</label>
              <select
                value={lrCapacity}
                onChange={e => setLrCapacity(e.target.value as any)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                <option value="5_15kW">5 kW a 15 kW / 7 a 20 HP</option>
                <option value="37_50kW">37 kW a 50 kW / 50 a 70 HP</option>
                <option value="75_120kW">75 kW a 120 kW / 100 a 160 HP</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Horas Mantenimiento</label>
              <select
                value={lrHours}
                onChange={e => setLrHours(e.target.value as any)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                <option value="2000">2000 hrs</option>
                <option value="4000">4000 hrs</option>
                <option value="6000">6000 hrs</option>
                <option value="8000">8000 hrs</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Tarifa por Hora ($)</label>
              <input
                type="number"
                value={lrHourlyPrice}
                onChange={e => setLrHourlyPrice(Number(e.target.value))}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Distancia km / Sitio ($)</label>
              <input
                type="number"
                value={lrDistanceKmPrice}
                onChange={e => setLrDistanceKmPrice(Number(e.target.value))}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold"
              />
            </div>

            <div className="col-span-full pt-1">
              <button
                type="submit"
                className="w-full py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 cursor-pointer"
              >
                Guardar Parámetro de Cobro
              </button>
            </div>
          </form>

          {/* Listado de Tarifas */}
          <div className="space-y-2 pt-2">
            {laborRates.map(lr => (
              <div key={lr.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex justify-between items-center text-xs">
                <div>
                  <span className="font-extrabold text-slate-800 uppercase bg-sky-100 text-[#0196C1] px-2 py-0.5 rounded mr-2">
                    {lr.serviceCategory}
                  </span>
                  <span className="text-slate-600 font-semibold">
                    Capacidad: {lr.capacityRange.replace('_', '-')} | Horas: {lr.maintenanceHours || 'N/A'} hrs
                  </span>
                </div>
                <div className="font-bold text-slate-800">
                  ${lr.hourlyPrice}/hr | Viático: ${lr.distanceKmPrice}/km
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-5 rounded-2xl max-w-sm w-full space-y-3">
            <h4 className="text-sm font-extrabold text-slate-800">Agregar Nueva Categoría</h4>
            <input
              type="text"
              placeholder="Ej. Sensores y Transductores"
              value={newCustomCategoryInput}
              onChange={e => setNewCustomCategoryInput(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddCategory}
                className="flex-1 py-2 bg-[#0196C1] text-white text-xs font-bold rounded-xl"
              >
                Guardar Categoría
              </button>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="py-2 px-3 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
