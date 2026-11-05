/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, FileText, ShieldAlert, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { AppNotification, getStoredNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../lib/notificationStore';
import { playBeepSound } from '../lib/notificationService';

interface NotificationBellModalProps {
  role: 'admin' | 'coordinator' | 'all';
}

export function NotificationBellModal({ role }: NotificationBellModalProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [floatingAlert, setFloatingAlert] = useState<AppNotification | null>(null);

  const loadNotifs = () => {
    const all = getStoredNotifications();
    const filtered = all.filter(n => n.targetRole === role || n.targetRole === 'all' || !n.targetRole);
    setNotifications(filtered);
  };

  useEffect(() => {
    loadNotifs();
    const handleUpdate = () => {
      const all = getStoredNotifications();
      const filtered = all.filter(n => n.targetRole === role || n.targetRole === 'all' || !n.targetRole);
      setNotifications(filtered);
      const latestUnread = filtered.find(n => !n.read);
      if (latestUnread) {
        setFloatingAlert(latestUnread);
        playBeepSound();
        const timer = setTimeout(() => setFloatingAlert(null), 6000);
        return () => clearTimeout(timer);
      }
    };
    window.addEventListener('mvl_notifications_updated', handleUpdate);
    return () => window.removeEventListener('mvl_notifications_updated', handleUpdate);
  }, [role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleMarkRead = (id: string) => {
    markNotificationAsRead(id);
    loadNotifs();
  };

  const handleMarkAll = () => {
    markAllNotificationsAsRead(role);
    loadNotifs();
  };

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          type="button"
          onClick={handleOpen}
          className="relative p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/15 transition-all cursor-pointer flex items-center justify-center shadow-sm"
          title="Notificaciones del Sistema"
        >
          <Bell className="w-5 h-5 text-amber-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#282829] shadow-md animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Floating Alert Banner (Toast) */}
      {floatingAlert && !isOpen && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-slate-900 border-2 border-amber-400 text-white p-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-3 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 uppercase">{floatingAlert.title}</span>
              <button 
                onClick={() => setFloatingAlert(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-snug">{floatingAlert.message}</p>
            <span className="text-[9px] text-slate-400 block">{floatingAlert.timestamp}</span>
          </div>
        </div>
      )}

      {/* Notifications Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-left border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#0196C1]" />
                <h3 className="text-base font-black text-slate-900">Centro de Notificaciones ({unreadCount} sin leer)</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Historial de alertas y avisos operativos</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="text-[#0196C1] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  No hay notificaciones registradas en este momento.
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      n.read ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-sky-50/70 border-sky-200 shadow-xs'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      n.type === 'quote_authorized' ? 'bg-emerald-100 text-emerald-700' :
                      n.type === 'quote_pending' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-[#0196C1]'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800">{n.title}</span>
                        <span className="text-[9px] text-slate-400">{n.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    </div>

                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        className="p-1.5 text-[#0196C1] hover:bg-sky-100 rounded-lg cursor-pointer transition-colors shrink-0"
                        title="Marcar como leída"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-black uppercase rounded-xl cursor-pointer shadow-sm transition-all"
              >
                Cerrar Centro
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
