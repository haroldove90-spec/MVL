/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, Monitor, Check, ArrowUpFromLine } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallBtn() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // No native prompt available, show manual walkthrough
      setShowManualInstructions(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
        <Check className="w-3.5 h-3.5" />
        Aplicación Instalada
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        id="pwa-install-button"
        onClick={handleInstallClick}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-sm font-medium rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        Instalar Aplicación MVL
      </button>

      {showManualInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-left border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Instalar MVL Control</h3>
            <p className="text-sm text-slate-500 mb-4">
              Lleva el sistema de gestión en tu pantalla de inicio como una aplicación nativa.
            </p>

            {platform === 'ios' ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-xs text-slate-600 mb-6">
                <p className="font-semibold text-slate-800">Instrucciones para iPhone / iPad:</p>
                <div className="flex items-start gap-2">
                  <span className="flex-none bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center font-bold">1</span>
                  <p>Pulsa el botón de <strong>Compartir</strong> <ArrowUpFromLine className="w-3.5 h-3.5 inline mx-1 text-[#0196C1]" /> en la barra inferior de Safari.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-none bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center font-bold">2</span>
                  <p>Selecciona la opción <strong>Añadir a pantalla de inicio</strong>.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-xs text-slate-600 mb-6">
                <p className="font-semibold text-slate-800">Instrucciones para Navegador:</p>
                <div className="flex items-start gap-2">
                  <span className="flex-none bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center font-bold">1</span>
                  <p>Presiona los <strong>tres puntos</strong> <Monitor className="w-3.5 h-3.5 inline mx-1 text-[#0196C1]" /> en la esquina superior derecha.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-none bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center font-bold">2</span>
                  <p>Haz clic en <strong>Instalar o Guardar aplicación</strong> en tu dispositivo.</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowManualInstructions(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer text-center"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
