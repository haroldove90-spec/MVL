/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserAccount, UserRole, Staff } from '../types';
import { supabase } from './supabase';
import { loadFromStorage, saveToStorage } from '../mockData';

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr_master',
    name: 'Administrador Maestro MVL',
    username: 'admin_master',
    email: 'admin@mvlmaquinaria.com',
    password: 'Chevropar#1970',
    role: 'admin',
    customJobTitle: 'Administrador Maestro',
    phone: '5624222449',
    whatsapp: '5624222449',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr_haroldo',
    name: 'Harold Anguiano Morales',
    username: 'haroldo90',
    email: 'haroldo90@hotmail.com',
    password: 'Chevropar#1970',
    role: 'admin',
    customJobTitle: 'Administrador General',
    phone: '5624222449',
    whatsapp: '5624222449',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr_coord_1',
    name: 'Ing. Carlos Mendoza',
    username: 'carlos_ventas',
    email: 'carlos.mendoza@mvl.com',
    password: 'Chevropar#1970',
    role: 'coordinator',
    customJobTitle: 'Coordinador General de Ventas',
    phone: '81-8181-9922',
    whatsapp: '8181819922',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr_tech_1',
    name: 'Roberto Sánchez',
    username: 'roberto_tec',
    email: 'roberto.sanchez@mvl.com',
    password: 'Chevropar#1970',
    role: 'technician',
    customJobTitle: 'Técnico Especialista Kaeser',
    phone: '81-2233-4455',
    whatsapp: '8122334455',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr_acc_1',
    name: 'Lic. Laura Flores',
    username: 'laura_sat',
    email: 'contabilidad@mvl.com',
    password: 'Chevropar#1970',
    role: 'accounting',
    customJobTitle: 'Contabilidad & Facturación SAT',
    phone: '477-710-9900',
    whatsapp: '4777109900',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr_client_1',
    name: 'Ing. Fernando Garza (Metso)',
    username: 'cliente_metso',
    email: 'fgarza@metso.com',
    password: 'Chevropar#1970',
    role: 'client',
    customJobTitle: 'Gerente de Mantenimiento Metso',
    phone: '81-8200-1100',
    whatsapp: '8182001100',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

const STORAGE_USERS_KEY = 'mvl_user_accounts';
const STORAGE_CURRENT_USER_KEY = 'mvl_current_user';

export function getLocalUserAccounts(): UserAccount[] {
  return loadFromStorage<UserAccount[]>(STORAGE_USERS_KEY, INITIAL_USER_ACCOUNTS);
}

export function saveLocalUserAccounts(accounts: UserAccount[]) {
  saveToStorage(STORAGE_USERS_KEY, accounts);
}

export function getCurrentUser(): UserAccount | null {
  return loadFromStorage<UserAccount | null>(STORAGE_CURRENT_USER_KEY, null);
}

export function saveCurrentUser(user: UserAccount | null) {
  saveToStorage(STORAGE_CURRENT_USER_KEY, user);
}

/**
 * Sync user accounts from Supabase table 'user_accounts' or fallback to local
 */
export async function syncUserAccountsFromSupabase(): Promise<UserAccount[]> {
  const localAccounts = getLocalUserAccounts();
  try {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('*');

    if (error) {
      console.warn('Could not query user_accounts from Supabase:', error.message);
      return localAccounts;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      const mergedMap = new Map<string, UserAccount>();
      // seed local accounts first
      localAccounts.forEach(u => mergedMap.set(u.username.toLowerCase(), u));

      // overlay Supabase accounts (allowing role changes from Supabase!)
      data.forEach((row: any) => {
        const uName = (row.username || '').toLowerCase();
        const account: UserAccount = {
          id: row.id || `usr_${Date.now()}`,
          name: row.name || row.full_name || 'Usuario',
          username: row.username || '',
          email: row.email || '',
          password: row.password || 'Chevropar#1970',
          role: (row.role as UserRole) || 'technician',
          customJobTitle: row.custom_job_title || row.customJobTitle || '',
          phone: row.phone || row.whatsapp || '',
          whatsapp: row.whatsapp || row.phone || '',
          active: row.active !== false,
          createdAt: row.created_at || row.createdAt || new Date().toISOString()
        };
        if (uName) {
          mergedMap.set(uName, account);
        }
      });

      const updated = Array.from(mergedMap.values());
      saveLocalUserAccounts(updated);
      return updated;
    }
  } catch (err: any) {
    console.warn('Supabase sync error for user_accounts:', err?.message || err);
  }

  return localAccounts;
}

/**
 * Authenticate using either Username OR Email + Password
 */
export async function authenticateUser(
  identifier: string,
  passwordAttempt: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (passwordAttempt || '').trim();

  if (!cleanId) {
    return { success: false, error: 'Por favor ingrese su usuario o correo electrónico.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Por favor ingrese su contraseña.' };
  }

  // 1. Try checking in Supabase first for real-time validation & role change
  try {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .or(`username.ilike.${cleanId},email.ilike.${cleanId}`)
      .limit(1);

    if (!error && data && data.length > 0) {
      const dbUser = data[0];
      const matchPass = dbUser.password === cleanPass;
      if (matchPass) {
        const userObj: UserAccount = {
          id: dbUser.id || `usr_${Date.now()}`,
          name: dbUser.name || dbUser.full_name || 'Usuario',
          username: dbUser.username || '',
          email: dbUser.email || '',
          password: dbUser.password,
          role: (dbUser.role as UserRole) || 'admin',
          customJobTitle: dbUser.custom_job_title || dbUser.customJobTitle || '',
          phone: dbUser.phone || dbUser.whatsapp || '',
          whatsapp: dbUser.whatsapp || dbUser.phone || '',
          active: dbUser.active !== false,
          createdAt: dbUser.created_at || new Date().toISOString()
        };

        if (!userObj.active) {
          return { success: false, error: 'Esta cuenta de usuario se encuentra desactivada. Contacte al Administrador.' };
        }

        // Update local cache
        const localList = getLocalUserAccounts();
        const existingIdx = localList.findIndex(u => u.username.toLowerCase() === userObj.username.toLowerCase());
        if (existingIdx >= 0) {
          localList[existingIdx] = userObj;
        } else {
          localList.push(userObj);
        }
        saveLocalUserAccounts(localList);
        saveCurrentUser(userObj);

        return { success: true, user: userObj };
      }
    }
  } catch (err) {
    console.warn('Supabase auth attempt offline, checking local registry:', err);
  }

  // 2. Fallback to local accounts
  const accounts = getLocalUserAccounts();
  const user = accounts.find(u => 
    (u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId)
  );

  if (!user) {
    // Check if it's the requested default credentials
    if (cleanId === 'admin_master' || cleanId === 'admin@mvlmaquinaria.com') {
      if (cleanPass === 'Chevropar#1970') {
        const master = INITIAL_USER_ACCOUNTS[0];
        saveCurrentUser(master);
        return { success: true, user: master };
      }
    }
    if (cleanId === 'haroldo90' || cleanId === 'haroldo90@hotmail.com') {
      if (cleanPass === 'Chevropar#1970') {
        const haroldo = INITIAL_USER_ACCOUNTS[1];
        saveCurrentUser(haroldo);
        return { success: true, user: haroldo };
      }
    }
    return { success: false, error: 'No se encontró ninguna cuenta con ese usuario o correo.' };
  }

  if (user.password !== cleanPass) {
    return { success: false, error: 'Contraseña incorrecta. Verifique sus credenciales.' };
  }

  if (!user.active) {
    return { success: false, error: 'Esta cuenta está dada de baja o inactiva.' };
  }

  saveCurrentUser(user);
  return { success: true, user };
}

/**
 * Register or update an employee user account in local storage and Supabase
 */
export async function saveUserAccount(account: UserAccount): Promise<{ success: boolean; error?: string }> {
  try {
    const list = getLocalUserAccounts();
    const idx = list.findIndex(u => u.id === account.id || u.username.toLowerCase() === account.username.toLowerCase());
    if (idx >= 0) {
      list[idx] = account;
    } else {
      list.push(account);
    }
    saveLocalUserAccounts(list);

    // Sync to Supabase
    const dbPayload = {
      id: account.id,
      name: account.name,
      username: account.username,
      email: account.email,
      password: account.password || 'Chevropar#1970',
      role: account.role,
      custom_job_title: account.customJobTitle || '',
      phone: account.phone || '',
      whatsapp: account.whatsapp || account.phone || '',
      active: account.active,
      created_at: account.createdAt || new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_accounts')
      .upsert([dbPayload], { onConflict: 'username' });

    if (error) {
      console.warn('Warning syncing user_accounts to Supabase:', error.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error saving user account:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate formatted WhatsApp credential sharing link
 */
export function generateWhatsAppCredentialLink(account: UserAccount, systemUrl?: string): string {
  const url = systemUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://mvlcontrol.com');
  const roleName = 
    account.role === 'admin' ? '👑 Administrador (Socio)' :
    account.role === 'coordinator' ? '💼 Coordinador / Ventas' :
    account.role === 'accounting' ? '📊 Contabilidad & SAT' :
    account.role === 'technician' ? '🛠️ Técnico de Campo' : '🏢 Cliente Industrial';

  const cleanPhone = (account.whatsapp || account.phone || '').replace(/[^0-9]/g, '');

  const message = 
`*MVL CONTROL INDUSTRIAL - CREDENCIALES DE ACCESO*
Hola *${account.name}*, se han activado tus credenciales de acceso para la plataforma de gestión MVL:

🌐 *Enlace de Acceso:* ${url}
👤 *Usuario:* ${account.username}
📧 *Correo:* ${account.email}
🔑 *Contraseña:* ${account.password || 'Chevropar#1970'}
💼 *Rol Asignado:* ${roleName} ${account.customJobTitle ? `(${account.customJobTitle})` : ''}

_Guarda este mensaje en un lugar seguro. Puedes ingresar con tu usuario o con tu correo electrónico._`;

  const encoded = encodeURIComponent(message);
  return cleanPhone 
    ? `https://wa.me/${cleanPhone.length <= 10 ? '52' + cleanPhone : cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

/**
 * Complete Supabase SQL Script to create all tables, RLS policies, and seed users
 */
export const SUPABASE_SETUP_SQL = `-- =========================================================================
-- MVL CONTROL Y MANTENIMIENTO INDUSTRIAL - ESQUEMA SUPABASE COMPLETO
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase
-- =========================================================================

-- 1. TABLA DE USUARIOS Y ROLES (Para inicio de sesión y gestión de empleados)
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT 'Chevropar#1970',
  role TEXT NOT NULL DEFAULT 'technician', -- 'admin', 'coordinator', 'accounting', 'technician', 'client'
  custom_job_title TEXT,
  phone TEXT,
  whatsapp TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS y Políticas permisivas para la app
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso a usuarios autenticados" ON public.user_accounts;
DROP POLICY IF EXISTS "Permitir lectura publica de user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Permitir insercion y actualizacion de user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Permitir todo en user_accounts" ON public.user_accounts;
CREATE POLICY "Permitir todo en user_accounts" ON public.user_accounts FOR ALL USING (true);

-- Insertar credenciales de Administrador Maestro y Harold Anguiano Morales
INSERT INTO public.user_accounts (id, name, username, email, password, role, custom_job_title, phone, whatsapp, active)
VALUES 
  ('usr_master', 'Administrador Maestro MVL', 'admin_master', 'admin@mvlmaquinaria.com', 'Chevropar#1970', 'admin', 'Administrador Maestro', '5624222449', '5624222449', true),
  ('usr_haroldo', 'Harold Anguiano Morales', 'haroldo90', 'haroldo90@hotmail.com', 'Chevropar#1970', 'admin', 'Administrador General', '5624222449', '5624222449', true)
ON CONFLICT (username) DO UPDATE 
SET 
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  whatsapp = EXCLUDED.whatsapp;

-- 2. TABLA DE CONTROL DE GASTOS
CREATE TABLE IF NOT EXISTS public.expense_control (
  id TEXT PRIMARY KEY,
  project_description TEXT NOT NULL,
  client_name TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  invoice_date DATE,
  invoice_number TEXT,
  payment_date DATE,
  tax NUMERIC(14,2) DEFAULT 0,
  subtotal NUMERIC(14,2) DEFAULT 0,
  client_payment NUMERIC(14,2) DEFAULT 0,
  expenses NUMERIC(14,2) DEFAULT 0,
  utility NUMERIC(14,2) DEFAULT 0,
  savings NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expense_control ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en expense_control" ON public.expense_control;
CREATE POLICY "Permitir todo en expense_control" ON public.expense_control FOR ALL USING (true);

-- 3. TABLA DE ÓRDENES DE COMPRA
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT,
  code TEXT NOT NULL,
  date DATE NOT NULL,
  concept TEXT NOT NULL,
  utility NUMERIC(14,2) DEFAULT 0,
  savings NUMERIC(14,2) DEFAULT 0,
  utility_after_savings NUMERIC(14,2) DEFAULT 0,
  marco_percent NUMERIC(5,2) DEFAULT 60,
  victor_percent NUMERIC(5,2) DEFAULT 20,
  leo_percent NUMERIC(5,2) DEFAULT 20,
  riky_percent NUMERIC(5,2) DEFAULT 0,
  marco_amount NUMERIC(14,2) DEFAULT 0,
  victor_amount NUMERIC(14,2) DEFAULT 0,
  leo_amount NUMERIC(14,2) DEFAULT 0,
  riky_amount NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en purchase_orders" ON public.purchase_orders;
CREATE POLICY "Permitir todo en purchase_orders" ON public.purchase_orders FOR ALL USING (true);

-- 4. TABLA DE CLIENTES Y PLANTAS
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  rfc TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  city TEXT,
  plants JSONB DEFAULT '[]'::jsonb,
  contacts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en clients" ON public.clients;
CREATE POLICY "Permitir todo en clients" ON public.clients FOR ALL USING (true);

-- 5. TABLA DE EQUIPOS
CREATE TABLE IF NOT EXISTS public.equipment (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  plant_id TEXT,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  oil_type TEXT,
  capacity TEXT,
  filters_required TEXT,
  status TEXT DEFAULT 'active',
  last_maintenance DATE,
  next_maintenance DATE,
  engine_hours NUMERIC DEFAULT 0,
  telemetry JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en equipment" ON public.equipment;
CREATE POLICY "Permitir todo en equipment" ON public.equipment FOR ALL USING (true);

-- 6. TABLA DE ÓRDENES DE TRABAJO (OT)
CREATE TABLE IF NOT EXISTS public.work_orders (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  equipment_id TEXT,
  client_id TEXT,
  plant_id TEXT,
  type TEXT DEFAULT 'preventive',
  status TEXT DEFAULT 'pending',
  scheduled_date DATE,
  engine_hours NUMERIC DEFAULT 0,
  assigned_technician_id TEXT,
  assigned_technician_name TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  observations TEXT,
  parts_used JSONB DEFAULT '[]'::jsonb,
  signature TEXT,
  date_completed TIMESTAMPTZ,
  labor_hours NUMERIC DEFAULT 0,
  labor_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en work_orders" ON public.work_orders;
CREATE POLICY "Permitir todo en work_orders" ON public.work_orders FOR ALL USING (true);

-- 7. TABLA DE INVENTARIO Y REFACCIONES
CREATE TABLE IF NOT EXISTS public.inventory (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  stock NUMERIC DEFAULT 0,
  min_stock NUMERIC DEFAULT 0,
  price NUMERIC(14,2) DEFAULT 0,
  unit TEXT DEFAULT 'pza',
  compatible_codes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en inventory" ON public.inventory;
CREATE POLICY "Permitir todo en inventory" ON public.inventory FOR ALL USING (true);

-- 8. TABLA DE COTIZACIONES
CREATE TABLE IF NOT EXISTS public.quotes (
  id TEXT PRIMARY KEY,
  fol_num TEXT UNIQUE NOT NULL,
  client_id TEXT,
  client_name TEXT,
  date DATE,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(14,2) DEFAULT 0,
  vat NUMERIC(14,2) DEFAULT 0,
  total NUMERIC(14,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en quotes" ON public.quotes;
CREATE POLICY "Permitir todo en quotes" ON public.quotes FOR ALL USING (true);

-- 9. TABLAS DE CATÁLOGO MAESTRO (Equipos, Refacciones y Categorías de Ventas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) DEFAULT 'part' NOT NULL,
  item_code VARCHAR(100) NOT NULL,
  name_or_model VARCHAR(255) NOT NULL,
  description TEXT,
  brand VARCHAR(100) DEFAULT 'Multimarca',
  category VARCHAR(255) DEFAULT 'General',
  subcategory VARCHAR(255),
  price NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
  currency VARCHAR(10) DEFAULT 'MXN' NOT NULL,
  stock INTEGER DEFAULT 0 NOT NULL,
  min_stock INTEGER DEFAULT 1 NOT NULL,
  unit VARCHAR(50) DEFAULT 'pza' NOT NULL,
  client_name VARCHAR(255) DEFAULT 'General / Todos',
  equipment_model VARCHAR(255),
  serial_number VARCHAR(100),
  capacity VARCHAR(100),
  voltage VARCHAR(100),
  location VARCHAR(255) DEFAULT 'Almacén Central',
  delivery_time VARCHAR(100) DEFAULT 'Inmediata (Stock)',
  is_active BOOLEAN DEFAULT true NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en catálogo
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- ELIMINAR CUALQUIER POLÍTICA PREVIA PARA EVITAR EL ERROR 42710 (policy already exists)
DROP POLICY IF EXISTS "Lectura catalogo_items" ON public.catalog_items;
DROP POLICY IF EXISTS "Escritura catalogo_items" ON public.catalog_items;
DROP POLICY IF EXISTS "Permitir lectura del catálogo a usuarios autenticados" ON public.catalog_items;
DROP POLICY IF EXISTS "Permitir inserción de catálogo" ON public.catalog_items;
DROP POLICY IF EXISTS "Permitir actualización de catálogo" ON public.catalog_items;
DROP POLICY IF EXISTS "Permitir borrado de catálogo" ON public.catalog_items;
DROP POLICY IF EXISTS "Permitir todo en catalog_items" ON public.catalog_items;

DROP POLICY IF EXISTS "Lectura catalogo_categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "Escritura catalogo_categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "Permitir lectura de categorías a usuarios autenticados" ON public.catalog_categories;
DROP POLICY IF EXISTS "Permitir gestión de categorías" ON public.catalog_categories;
DROP POLICY IF EXISTS "Permitir todo en catalog_categories" ON public.catalog_categories;

-- CREAR POLÍTICAS LIMPIAS
CREATE POLICY "Permitir todo en catalog_items" ON public.catalog_items FOR ALL USING (true);
CREATE POLICY "Permitir todo en catalog_categories" ON public.catalog_categories FOR ALL USING (true);

-- ¡LISTO! Tu base de datos Supabase está completamente configurada y lista para producción.
`;
