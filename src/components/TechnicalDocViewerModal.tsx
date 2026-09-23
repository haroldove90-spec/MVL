import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, FileText, Camera, ExternalLink, ShieldCheck, Printer, Wrench } from 'lucide-react';

export interface TechnicalDocViewerModalProps {
  type: 'plate' | 'manual';
  title?: string;
  equipmentName?: string;
  equipmentBrand?: string;
  equipmentModel?: string;
  equipmentSerial?: string;
  imageUrl?: string | null;
  manualUrl?: string | null;
  onClose: () => void;
}

export const TechnicalDocViewerModal: React.FC<TechnicalDocViewerModalProps> = ({
  type,
  title,
  equipmentName,
  equipmentBrand,
  equipmentModel,
  equipmentSerial,
  imageUrl,
  manualUrl,
  onClose
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const fallbackPlateImg = imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            {type === 'plate' ? (
              <div className="w-8 h-8 rounded-lg bg-[#0196C1]/20 border border-[#0196C1]/40 flex items-center justify-center text-[#0196C1]">
                <Camera className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <FileText className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                {title || (type === 'plate' ? 'Foto de Placa de Datos Técnicos del Activo' : 'Manual Técnico & Guía de Despiece')}
              </h3>
              <p className="text-[10px] text-slate-300">
                {equipmentName ? `${equipmentName} • ` : ''}
                {equipmentBrand ? `${equipmentBrand} ` : ''}
                {equipmentModel ? `(${equipmentModel}) ` : ''}
                {equipmentSerial ? `• Serie: ${equipmentSerial}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {type === 'plate' && (
              <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Alejar"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-slate-300 px-2">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Acercar"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title="Girar 90°"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded cursor-pointer border-l border-slate-700 ml-0.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  title="Restablecer vista"
                  className="text-[10px] px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto bg-slate-950/90 relative flex items-center justify-center p-4 min-h-[360px]">
          {type === 'plate' ? (
            <div className="overflow-hidden flex items-center justify-center w-full h-full">
              <img
                src={fallbackPlateImg}
                alt="Placa de datos del equipo"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl p-6 text-slate-800 max-h-[70vh] overflow-y-auto">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mb-1">
                Expediente de Manual Técnico y Catálogo de Partes
              </h4>
              <p className="text-xs text-slate-500 text-center max-w-md mb-6">
                Manual de operación oficial, diagramas neumáticos, despiece de filtros y calibración técnica para el equipo{' '}
                <strong className="text-slate-800">{equipmentName || equipmentModel || 'compresor industrial'}</strong>.
              </p>

              {/* Technical Specifications Summary Box */}
              <div className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Marca / Fabricante:</span>
                  <span className="font-extrabold text-slate-800">{equipmentBrand || 'Fabricante Industrial'}</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Modelo / Serie:</span>
                  <span className="font-extrabold text-slate-800 font-mono">{equipmentModel || 'Standard'} • {equipmentSerial || 'S/N'}</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Protocolo de Mantenimiento:</span>
                  <span className="font-bold text-emerald-600">Servicio Preventivo 2000h / 4000h / 8000h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Verificación MVL:</span>
                  <span className="font-bold text-[#0196C1] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Manual Validador MVL 2026
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {manualUrl && (
                  <a
                    href={manualUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all"
                  >
                    <ExternalLink className="w-4 h-4" /> Abrir Manual en Nueva Pestaña
                  </a>
                )}
                <a
                  href={manualUrl || '#'}
                  download={`Manual_${equipmentBrand || 'Equipo'}_${equipmentModel || 'Industrial'}.pdf`}
                  onClick={(e) => {
                    if (!manualUrl) {
                      e.preventDefault();
                      window.print();
                    }
                  }}
                  className="px-4 py-2.5 bg-[#0196C1] hover:bg-[#017fa4] text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Descargar Manual PDF
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 text-xs shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#0196C1]" />
            <span>Documentación técnica verificada por Dirección de Operaciones MVL Maquinaria</span>
          </div>

          <div className="flex items-center gap-2">
            {type === 'plate' && (
              <a
                href={fallbackPlateImg}
                download={`Placa_${equipmentBrand || 'Equipo'}_${equipmentSerial || 'Datos'}.jpg`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#0196C1]" /> Descargar Foto
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              Cerrar Visor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
