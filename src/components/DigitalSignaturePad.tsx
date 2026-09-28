import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Trash2, CheckCircle, Upload, Sparkles, ShieldCheck } from 'lucide-react';

interface DigitalSignaturePadProps {
  signerName: string;
  initialSignature?: string;
  onSignatureChange: (signatureUrl: string | null) => void;
  title?: string;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  signerName,
  initialSignature,
  onSignatureChange,
  title = 'Firma Digital del Asesor Emisor'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(initialSignature));
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 500;
    canvas.height = 160;

    // Clear and set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If initial signature provided, draw it
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
      };
      img.src = initialSignature;
    } else {
      // Draw a subtle baseline
      drawBaseline(ctx, canvas.width, canvas.height);
    }
  }, []);

  const drawBaseline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, height - 35);
    ctx.lineTo(width - 30, height - 35);
    ctx.stroke();
  };

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling while signing
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    setHasSignature(true);
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBaseline(ctx, canvas.width, canvas.height);

    setHasSignature(false);
    onSignatureChange(null);
  };

  // Generate cryptographic-style formal script signature
  const handleGenerateScriptSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stylized signature stroke
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic bold 28px "Brush Script MT", cursive, "Segoe Script", serif';
    ctx.textAlign = 'center';
    ctx.fillText(signerName || 'Ing. Responsable MVL', canvas.width / 2, 75);

    // Flourish stroke
    ctx.strokeStyle = '#0196C1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 88);
    ctx.bezierCurveTo(canvas.width * 0.4, 98, canvas.width * 0.6, 75, canvas.width - 80, 92);
    ctx.stroke();

    // Security watermark
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`FIRMA ELECTRÓNICA VÁLIDA • EMISIÓN OFICIAL MVL • ${new Date().toLocaleDateString('es-MX')}`, canvas.width / 2, 135);

    setHasSignature(true);
    setSignatureMode('type');
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  // Upload signature image
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Aspect ratio fit
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.85;
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        drawBaseline(ctx, canvas.width, canvas.height);

        setHasSignature(true);
        setSignatureMode('upload');
        const dataUrl = canvas.toDataURL('image/png');
        onSignatureChange(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-50 text-[#0196C1] rounded-lg">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              {title}
              {hasSignature && (
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Firmado
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Usuario Emisor: <strong className="text-slate-800 font-bold">{signerName || 'Ing. Responsable'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleGenerateScriptSignature}
            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-[#0196C1] text-[11px] font-bold rounded-lg flex items-center gap-1 border border-sky-200 transition-colors cursor-pointer"
            title="Generar firma digital electrónica con el nombre del emisor"
          >
            <Sparkles className="w-3 h-3" /> Firma Electrónica
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            title="Subir archivo PNG o JPG de tu firma"
          >
            <Upload className="w-3 h-3" /> Subir Imagen
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadImage}
            className="hidden"
          />

          {hasSignature && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1 text-red-600 hover:bg-red-50 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Borrar y volver a firmar"
            >
              <Trash2 className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Interactive Canvas Area */}
      <div className="relative border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full max-w-full h-36 bg-white cursor-crosshair touch-none"
        />

        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
            <PenTool className="w-6 h-6 mb-1 opacity-50 text-[#0196C1]" />
            <span className="text-xs font-bold text-slate-500">
              Traza tu firma aquí con el mouse o dedo
            </span>
            <span className="text-[10px] text-slate-400">
              o presiona "Firma Electrónica" para generarla automáticamente
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
        <span className="flex items-center gap-1 text-slate-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Esta firma se imprimirá directamente en el formato oficial de la cotización y en el PDF descargable.
        </span>
        <span className="font-bold text-slate-700">{signerName}</span>
      </div>
    </div>
  );
};
