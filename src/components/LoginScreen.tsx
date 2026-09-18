/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Lock, User, Mail, Eye, EyeOff, ShieldCheck, 
  AlertCircle, CheckCircle2, ArrowRight, KeyRound, Sparkles
} from 'lucide-react';
import { authenticateUser } from '../lib/authService';
import { UserAccount } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await authenticateUser(identifier, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Credenciales no válidas. Verifique su usuario o correo y contraseña.');
      }
    } catch (err: any) {
      setErrorMessage('Error al verificar credenciales: ' + (err?.message || 'Error de conexión.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#0196C1]/20">
      {/* Brand & Header without any encapsulation */}
      <div className="w-full max-w-md text-center space-y-3 mb-6">
        <div className="flex justify-center">
          <img 
            src="https://appdesignproyectos.com/mvl.png" 
            alt="MVL Control y Mantenimiento Industrial" 
            className="h-28 sm:h-32 md:h-36 object-contain"
          />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#282829] tracking-tight">
            MVL Control Industrial
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Acceso seguro a la plataforma de gestión operativa y técnica
          </p>
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistema en Producción Real</span>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.05)] p-6 sm:p-8 relative z-10 space-y-6"
      >
        {/* Error notification */}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <p className="leading-snug font-medium">{errorMessage}</p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Usuario o Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ej. haroldo90 o correo@ejemplo.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0196C1] focus:ring-2 focus:ring-[#0196C1]/20 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Contraseña de Acceso
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Sensible a mayúsculas</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0196C1] focus:ring-2 focus:ring-[#0196C1]/20 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#0196C1] hover:bg-[#017fa4] active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#0196C1]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Support */}
        <div className="text-center pt-1 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 font-medium">
            ¿Requieres dar de alta un empleado o recuperar acceso?
          </p>
          <a
            href="https://wa.me/525624222449?text=Hola%2C%20necesito%20soporte%20o%20alta%20de%20usuario%20en%20MVL%20Control%20Industrial"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#0196C1] hover:underline font-bold inline-block mt-0.5"
          >
            Contactar al Administrador vía WhatsApp: 56-2422-2449
          </a>
        </div>
      </motion.div>
    </div>
  );
}
