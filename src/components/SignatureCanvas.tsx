/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  savedSignature?: string;
}

export default function SignatureCanvas({ onSave, onClear, savedSignature }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas high-resolution scale
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#282829';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveSignature();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    if (onClear) onClear();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="w-full">
      {savedSignature ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center">
          <img src={savedSignature} alt="Firma registrada" className="max-h-24 object-contain" />
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Firma registrada con éxito
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-32 bg-slate-50 cursor-crosshair touch-none"
            />
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              <button
                type="button"
                onClick={clearCanvas}
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 shadow-sm transition-colors cursor-pointer"
                title="Limpiar firma"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                Firme aquí (dedo o cursor)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
