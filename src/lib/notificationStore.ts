/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { playBeepSound, AppNotification } from './notificationService';
export type { AppNotification };

export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem('mvl_app_notifications');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredNotifications(notifs: AppNotification[]) {
  try {
    localStorage.setItem('mvl_app_notifications', JSON.stringify(notifs));
    window.dispatchEvent(new Event('mvl_notifications_updated'));
  } catch {
    // ignore
  }
}

export function addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
  const current = getStoredNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
    read: false
  };
  const updated = [newNotif, ...current];
  saveStoredNotifications(updated);
  playBeepSound();
  return newNotif;
}

export function markNotificationAsRead(id: string) {
  const current = getStoredNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  saveStoredNotifications(updated);
}

export function markAllNotificationsAsRead(role?: string) {
  const current = getStoredNotifications();
  const updated = current.map(n => (!role || n.targetRole === role || n.targetRole === 'all') ? { ...n, read: true } : n);
  saveStoredNotifications(updated);
}
