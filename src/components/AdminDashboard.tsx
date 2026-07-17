/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Staff, InventoryItem, Client, Equipment } from '../types';
import { 
  Users, DollarSign, Package, Award, Plus, Trash2, 
  CheckCircle, XCircle, Tag, Layers, TrendingUp, TrendingDown,
  ShieldCheck, AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AdminDashboardProps {
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  clients: Client[];
  equipment: Equipment[];
  activeTab?: 'financial' | 'staff' | 'catalog' | 'inventory';
  setActiveTab?: (val: 'financial' | 'staff' | 'catalog' | 'inventory') => void;
}

export default function AdminDashboard({ 
  staff, 
  setStaff, 
  inventory, 
  setInventory,
  clients,
  equipment,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab
}: AdminDashboardProps) {
  // Navigation tabs with parent-control fallback
  const [localActiveTab, setLocalActiveTab] = useState<'financial' | 'staff' | 'catalog' | 'inventory'>('financial');
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

  // New staff form states
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'coordinator' | 'technician'>('technician');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  // New part form states
  const [newPartName, setNewPartName] = useState('');
  const [newPartCode, setNewPartCode] = useState('');
  const [newPartCategory, setNewPartCategory] = useState<'electronic' | 'pneumatic' | 'refrigeration' | 'consumable'>('consumable');
  const [newPartStock, setNewPartStock] = useState(10);
  const [newPartMinStock, setNewPartMinStock] = useState(3);
  const [newPartPrice, setNewPartPrice] = useState(1500);

  // Brands list
  const [brands, setBrands] = useState<string[]>(['Kaeser', 'Atlas Copco', 'Ingersoll Rand', 'Sullair', 'Siemens']);
  const [newBrand, setNewBrand] = useState('');

  // Profitability metrics calculation
  const totalRevenue = inventory.reduce((sum, item) => sum + (item.price * (item.minStock * 2)), 320000); // Simulated baseline
  const totalCosts = inventory.reduce((sum, item) => sum + ((item.price * 0.45) * (item.minStock * 2)), 144000); // 45% acquisition cost
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = ((netProfit / totalRevenue) * 100).toFixed(1);

  // Chart data
  const financialData = [
    { name: 'Mayo', Ingresos: 180000, Costos: 81000, Utilidad: 99000 },
    { name: 'Junio', Ingresos: 250000, Costos: 112500, Utilidad: 137500 },
    { name: 'Julio (Proy)', Ingresos: totalRevenue, Costos: totalCosts, Utilidad: netProfit }
  ];

  // Add staff handler
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;
    const item: Staff = {
      id: `s${Date.now()}`,
      name: newStaffName,
      role: newStaffRole,
      email: newStaffEmail,
      phone: newStaffPhone || 'N/A',
      active: true
    };
    setStaff(prev => [...prev, item]);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
  };

  // Toggle staff status
  const toggleStaffStatus = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  // Delete staff
  const deleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  // Add parts handler
  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName || !newPartCode) return;
    const item: InventoryItem = {
      id: `i${Date.now()}`,
      code: newPartCode.toUpperCase(),
      name: newPartName,
      category: newPartCategory,
      stock: Number(newPartStock),
      minStock: Number(newPartMinStock),
      price: Number(newPartPrice)
    };
    setInventory(prev => [...prev, item]);
    setNewPartName('');
    setNewPartCode('');
    setNewPartStock(10);
    setNewPartMinStock(3);
    setNewPartPrice(1500);
  };

  // Delete spare part
  const deletePart = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  };

  // Add Brand
  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand || brands.includes(newBrand)) return;
    setBrands(prev => [...prev, newBrand]);
    setNewBrand('');
  };

  // Delete Brand
  const handleDeleteBrand = (brandName: string) => {
    setBrands(prev => prev.filter(b => b !== brandName));
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-xs gap-1">
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'financial' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Rentabilidad y Métricas
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'staff' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Gestión de Personal
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'catalog' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Catálogos de Marcas y Precios
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'inventory' 
              ? 'bg-[#0196C1] text-white' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Inventario Global
        </button>
      </div>

      {/* --- Tab 1: Financial & Metrics --- */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Ingresos Totales</p>
                <h3 className="text-xl font-bold text-slate-800">${totalRevenue.toLocaleString('es-MX')}</h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> +14.2% este mes
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Costo de Operación</p>
                <h3 className="text-xl font-bold text-slate-800">${totalCosts.toLocaleString('es-MX')}</h3>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Incluye refacciones y viáticos</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Rentabilidad Neta</p>
                <h3 className="text-xl font-bold text-slate-800">${netProfit.toLocaleString('es-MX')}</h3>
                <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 font-bold rounded mt-1 inline-block">
                  {profitMargin}% Margen
                </span>
              </div>
            </div>
          </div>

          {/* Profitability Graph & Secondary KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Desempeño Financiero Comercial (MXN)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString('es-MX')}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Ingresos" fill="#0196C1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Costos" fill="#282829" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Utilidad" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Industry Stats */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Estatus de Activos</h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Equipos Registrados</span>
                    <span className="font-bold text-slate-800">{equipment.length}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#0196C1] h-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-700 font-medium">Equipos en Alerta (Crítico)</span>
                    <span className="font-bold text-amber-800">{equipment.filter(e => e.status === 'warning' || e.status === 'maintenance').length}</span>
                  </div>
                  <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full animate-pulse" style={{ width: '66%' }} />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] text-slate-500 uppercase font-bold mb-2">Efectividad de Técnicos</p>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <p className="text-xs font-semibold text-slate-700">94.8% SLA Cumplido</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 2: Staff Management --- */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Staff form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0196C1]" />
              Alta de Personal
            </h3>
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Ing. Mario Salinas"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Rol / Puesto</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
                >
                  <option value="technician">Técnico de Campo</option>
                  <option value="coordinator">Coordinador / Supervisor</option>
                  <option value="admin">Administrador (Socio)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="mario@mvl.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Teléfono Móvil</label>
                <input
                  type="text"
                  placeholder="81-1234-5678"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Registrar Colaborador
              </button>
            </form>
          </div>

          {/* Staff directory */}
          <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Directorio de Colaboradores</h3>
            <div className="divide-y divide-slate-100">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 text-xs uppercase">
                      {member.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{member.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${member.role === 'admin' ? 'bg-rose-500' : member.role === 'coordinator' ? 'bg-[#0196C1]' : 'bg-emerald-500'}`} />
                        {member.role === 'admin' ? 'Administrador' : member.role === 'coordinator' ? 'Coordinador' : 'Técnico de Campo'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{member.email} • {member.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStaffStatus(member.id)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                        member.active 
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700' 
                          : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {member.active ? 'Activo' : 'Baja'}
                    </button>
                    <button
                      onClick={() => deleteStaff(member.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 3: Catalogs --- */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brands list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#0196C1]" />
              Catálogo Global de Marcas
            </h3>
            <p className="text-xs text-slate-400 mb-4">Marcas industriales autorizadas en la maquinaria del cliente.</p>
            
            <form onSubmit={handleAddBrand} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="ej. Gardner Denver"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Agregar
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <div key={brand} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 text-xs font-medium rounded-full text-slate-700">
                  {brand}
                  <button
                    type="button"
                    onClick={() => handleDeleteBrand(brand)}
                    className="text-slate-400 hover:text-rose-600 font-bold ml-1 text-[11px]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Price List view */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0196C1]" />
              Tarifas de Componentes y Consumibles
            </h3>
            <p className="text-xs text-slate-400 mb-4">Precios de venta de las piezas más comunes cambiadas en sitio.</p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {inventory.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">{item.code} • {item.category}</p>
                  </div>
                  <span className="font-bold text-[#0196C1]">${item.price.toLocaleString('es-MX')} MXN</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 4: Inventory Global & Stock alerts --- */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Part to Inventory */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#0196C1]" />
              Añadir al Inventario
            </h3>
            <form onSubmit={handleAddPart} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Nombre Refacción</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Filtro de Aceite Kaeser"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0196C1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Código de Parte</label>
                  <input
                    type="text"
                    required
                    placeholder="FIL-50"
                    value={newPartCode}
                    onChange={(e) => setNewPartCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Categoría</label>
                  <select
                    value={newPartCategory}
                    onChange={(e) => setNewPartCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="consumable">Consumible</option>
                    <option value="electronic">Electrónica</option>
                    <option value="pneumatic">Neumática</option>
                    <option value="refrigeration">Refrigeración</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Stock Act</label>
                  <input
                    type="number"
                    value={newPartStock}
                    onChange={(e) => setNewPartStock(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Mín Req</label>
                  <input
                    type="number"
                    value={newPartMinStock}
                    onChange={(e) => setNewPartMinStock(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Precio MXN</label>
                  <input
                    type="number"
                    value={newPartPrice}
                    onChange={(e) => setNewPartPrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Añadir Componente
              </button>
            </form>
          </div>

          {/* Parts stock and alerts */}
          <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Catálogo de Almacén e Inventario</h3>
            
            {/* Minimal warning alerts */}
            <div className="space-y-2">
              {inventory.map((item) => {
                const isLow = item.stock <= item.minStock;
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                      isLow 
                        ? 'bg-amber-50/70 border-amber-200/60 text-amber-900' 
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isLow && <AlertTriangle className="w-4 h-4 text-amber-600 flex-none mt-0.5" />}
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{item.code} • {item.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">Stock: {item.stock} pzas</p>
                        <p className="text-[10px] text-slate-400">Min. req: {item.minStock}</p>
                      </div>
                      <button
                        onClick={() => deletePart(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Eliminar refacción"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
