/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tag, Plus, Trash2, X, Check, RefreshCw, FolderTree, ChevronRight, Edit2, ShieldAlert } from 'lucide-react';
import { CatalogCategory, INITIAL_CATALOG_CATEGORIES } from '../../lib/catalogMasterData';

interface CatalogCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CatalogCategory[];
  onSaveCategories: (newCategories: CatalogCategory[]) => void;
  onRestoreDefaultCategories: () => void;
}

export default function CatalogCategoriesModal({
  isOpen,
  onClose,
  categories,
  onSaveCategories,
  onRestoreDefaultCategories
}: CatalogCategoriesModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'new_cat'>('list');
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  
  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatScope, setNewCatScope] = useState<'hvac' | 'screw_compressor' | 'general' | 'custom'>('custom');
  
  // New Subcategory Input inside selected category
  const [newSubcatName, setNewSubcatName] = useState('');

  if (!isOpen) return null;

  const selectedCategory = categories.find(c => c.id === selectedCatId) || categories[0];

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: CatalogCategory = {
      id: `cat_custom_${Date.now()}`,
      name: newCatName.trim(),
      code: newCatCode.trim() || String(categories.length + 1).padStart(2, '0'),
      scope: newCatScope,
      subcategories: []
    };

    const updated = [...categories, newCategory];
    onSaveCategories(updated);
    setSelectedCatId(newCategory.id);
    setNewCatName('');
    setNewCatCode('');
    setActiveTab('list');
  };

  const handleAddSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !newSubcatName.trim()) return;

    const subName = newSubcatName.trim();
    if (selectedCategory.subcategories.includes(subName)) return;

    const updated = categories.map(c => {
      if (c.id === selectedCategory.id) {
        return {
          ...c,
          subcategories: [...c.subcategories, subName]
        };
      }
      return c;
    });

    onSaveCategories(updated);
    setNewSubcatName('');
  };

  const handleDeleteSubcategory = (subcat: string) => {
    if (!selectedCategory) return;
    const updated = categories.map(c => {
      if (c.id === selectedCategory.id) {
        return {
          ...c,
          subcategories: c.subcategories.filter(s => s !== subcat)
        };
      }
      return c;
    });
    onSaveCategories(updated);
  };

  const handleDeleteCategory = (catId: string) => {
    if (!confirm('¿Está seguro de eliminar esta categoría y todas sus subcategorías?')) return;
    const updated = categories.filter(c => c.id !== catId);
    onSaveCategories(updated);
    if (selectedCatId === catId && updated.length > 0) {
      setSelectedCatId(updated[0].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-6 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-[#0196C1]">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Administrador de Categorías & Subcategorías
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0196C1]/10 text-[#0196C1]">
                  {categories.length} Clases
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Estructura de Clases para HVAC y Compresores de Tornillo del catálogo.
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

        {/* Tab switcher */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Explorar Clases ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('new_cat')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'new_cat' ? 'bg-white text-[#0196C1] shadow-xs' : 'text-slate-600'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nueva Clase / Categoría</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (confirm('¿Restablecer las 35 Clases y Subclases oficiales del catálogo HVAC y Compresores de Tornillo?')) {
                onRestoreDefaultCategories();
              }
            }}
            className="text-[11px] text-[#0196C1] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restaurar Clases Oficiales (35)</span>
          </button>
        </div>

        {/* Modal Body */}
        {activeTab === 'new_cat' ? (
          <form onSubmit={handleCreateCategory} className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Registrar Nueva Clase o Categoría
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Clase / Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Ej: CLASE 19 — SISTEMAS DE TRATAMIENTO DE AGUA"
                  className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0196C1]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código de Clase (Prefijo)
                </label>
                <input
                  type="text"
                  value={newCatCode}
                  onChange={e => setNewCatCode(e.target.value)}
                  placeholder="Ej: 19 o F-19"
                  className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0196C1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alcance / Tipo de Catálogo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'hvac', label: 'HVAC & Refrigeración' },
                  { id: 'screw_compressor', label: 'Compresor Tornillo' },
                  { id: 'general', label: 'Almacén General' },
                  { id: 'custom', label: 'Personalizado' }
                ].map(scope => (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => setNewCatScope(scope.id as any)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border cursor-pointer text-center transition-all ${
                      newCatScope === scope.id 
                        ? 'bg-[#0196C1] text-white border-[#0196C1]' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Categoría</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
            
            {/* Left Column: Categories List */}
            <div className="md:col-span-5 border border-slate-200 rounded-xl overflow-y-auto p-2 space-y-1 bg-slate-50/50 max-h-[50vh] md:max-h-[55vh]">
              {categories.map(cat => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected 
                        ? 'bg-white shadow-xs border border-[#0196C1] text-[#0196C1]' 
                        : 'hover:bg-white/80 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                        isSelected ? 'bg-[#0196C1] text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {cat.code}
                      </span>
                      <span className="text-xs font-bold truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 font-bold">
                        {cat.subcategories.length}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Subcategories of selected */}
            <div className="md:col-span-7 border border-slate-200 rounded-xl p-4 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[55vh]">
              {selectedCategory ? (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Clase Seleccionada
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        selectedCategory.scope === 'hvac' ? 'bg-sky-100 text-sky-800' :
                        selectedCategory.scope === 'screw_compressor' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {selectedCategory.scope || 'general'}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {selectedCategory.name}
                    </h4>
                  </div>

                  {/* Add Subcategory Form */}
                  <form onSubmit={handleAddSubcategory} className="flex gap-2">
                    <input
                      type="text"
                      value={newSubcatName}
                      onChange={e => setNewSubcatName(e.target.value)}
                      placeholder="Nueva subclase (ej. Filtros de succión, Mantenimiento preventivo...)"
                      className="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0196C1]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </form>

                  {/* Subcategories Tags */}
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Subcategorías / Subclases registradas ({selectedCategory.subcategories.length})
                    </span>

                    {selectedCategory.subcategories.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        No hay subclases en esta categoría. Escribe arriba para agregar la primera.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1">
                        {selectedCategory.subcategories.map((sub, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs hover:border-slate-200 transition-colors"
                          >
                            <span className="font-semibold text-slate-800">
                              {sub}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubcategory(sub)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Eliminar subclase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Selecciona una clase a la izquierda.
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
