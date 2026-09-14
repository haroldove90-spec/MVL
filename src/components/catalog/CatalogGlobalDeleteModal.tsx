/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Check, RefreshCw, ShieldAlert, Archive } from 'lucide-react';
import { CatalogCategory } from '../../lib/catalogMasterData';

interface CatalogGlobalDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalItemsCount: number;
  selectedCount: number;
  categories: CatalogCategory[];
  onConfirmGlobalDelete: (mode: 'all' | 'selected' | 'category', selectedCategory?: string) => Promise<void>;
  onRestoreDefaultCatalog: () => void;
}

export default function CatalogGlobalDeleteModal({
  isOpen,
  onClose,
  totalItemsCount,
  selectedCount,
  categories,
  onConfirmGlobalDelete,
  onRestoreDefaultCatalog
}: CatalogGlobalDeleteModalProps) {
  const [deleteMode, setDeleteMode] = useState<'all' | 'selected' | 'category'>('all');
  const [targetCategory, setTargetCategory] = useState<string>(categories[0]?.name || '');
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const requiresKeyword = deleteMode === 'all';
  const isKeywordValid = !requiresKeyword || confirmKeyword.trim().toUpperCase() === 'BORRAR';

  const handleExecuteDelete = async () => {
    setErrorMsg('');
    if (requiresKeyword && confirmKeyword.trim().toUpperCase() !== 'BORRAR') {
      setErrorMsg('Debes escribir la palabra "BORRAR" en mayúsculas para confirmar.');
      return;
    }

    try {
      setIsProcessing(true);
      await onConfirmGlobalDelete(deleteMode, targetCategory);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al ejecutar el borrado.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-5 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                Borrado de Catálogo de Ventas
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700">
                  Acción Crítica
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Elimina productos de forma selectiva o vacía el catálogo completo.
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

        {/* Warning Banner */}
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Advertencia de sincronización:</p>
            <p className="text-[11px] text-rose-800 mt-0.5">
              Esta operación eliminará los productos de la memoria local y de la tabla <code className="bg-rose-100 px-1 py-0.2 rounded font-mono font-bold">catalog_items</code> de Supabase.
            </p>
          </div>
        </div>

        {/* Delete Mode Options */}
        <div className="space-y-2.5 text-xs">
          <span className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider">
            Selecciona el alcance del borrado:
          </span>

          {/* Option 1: Vaciar Todo */}
          <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            deleteMode === 'all' 
              ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-400/20' 
              : 'border-slate-200 hover:bg-slate-50'
          }`}>
            <input
              type="radio"
              name="deleteMode"
              checked={deleteMode === 'all'}
              onChange={() => setDeleteMode('all')}
              className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Vaciar Catálogo Completo (Borrado Global)</span>
                <span className="font-mono font-bold text-rose-600 text-xs">
                  {totalItemsCount} productos
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Elimina absolutamente todos los registros de equipos, refacciones y servicios del catálogo.
              </p>
            </div>
          </label>

          {/* Option 2: Solo Seleccionados */}
          {selectedCount > 0 && (
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              deleteMode === 'selected' 
                ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-400/20' 
                : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="radio"
                name="deleteMode"
                checked={deleteMode === 'selected'}
                onChange={() => setDeleteMode('selected')}
                className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Borrar Solo Productos Seleccionados</span>
                  <span className="font-mono font-bold text-amber-600 text-xs">
                    {selectedCount} seleccionados
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Elimina únicamente los artículos marcados con casilla de verificación en la tabla.
                </p>
              </div>
            </label>
          )}

          {/* Option 3: Borrar por Clase / Categoría */}
          <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            deleteMode === 'category' 
              ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-400/20' 
              : 'border-slate-200 hover:bg-slate-50'
          }`}>
            <input
              type="radio"
              name="deleteMode"
              checked={deleteMode === 'category'}
              onChange={() => setDeleteMode('category')}
              className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <div className="flex-1 space-y-2">
              <span className="font-bold text-slate-900 block">Borrar por Clase o Categoría Específica</span>
              <p className="text-[11px] text-slate-500">
                Elimina todos los productos pertenecientes a una clase de HVAC o Compresores.
              </p>
              {deleteMode === 'category' && (
                <select
                  value={targetCategory}
                  onChange={e => setTargetCategory(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </label>
        </div>

        {/* Confirmation Keyword Input for Global Wipe */}
        {requiresKeyword && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Para confirmar el borrado de todo el catálogo, escribe <span className="font-mono text-rose-600 font-black">BORRAR</span>:
            </label>
            <input
              type="text"
              value={confirmKeyword}
              onChange={e => setConfirmKeyword(e.target.value)}
              placeholder="Escribe BORRAR aquí..."
              className="w-full py-2 px-3 bg-white border border-rose-300 rounded-xl text-xs font-mono font-bold tracking-widest uppercase text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
        )}

        {errorMsg && (
          <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
            {errorMsg}
          </p>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              if (confirm('¿Deseas restablecer los productos demo oficiales de demostración en el catálogo?')) {
                onRestoreDefaultCatalog();
                onClose();
              }
            }}
            className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer flex items-center gap-1 order-last sm:order-first"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restaurar catálogo inicial demo</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExecuteDelete}
              disabled={isProcessing || !isKeywordValid}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>
                {isProcessing 
                  ? 'Borrando...' 
                  : deleteMode === 'all' 
                    ? 'Confirmar Vaciar Todo' 
                    : deleteMode === 'selected' 
                      ? `Eliminar (${selectedCount})` 
                      : 'Eliminar Clase'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
