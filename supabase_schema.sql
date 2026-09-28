-- ============================================================
-- SCRIPT SQL DE ESTRUCTURA Y COMPATIBILIDAD (SUPABASE / POSTGRESQL)
-- MVL INDUSTRIAL - SISTEMA DE COTIZACIONES, EQUIPOS Y CATÁLOGO
-- ============================================================
-- Este script es completamente idempotente: puede ejecutarse
-- varias veces sin causar errores ni borrar datos existentes.
-- ============================================================

-- Habilitar extensión pgcrypto para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TABLA: equipment (Equipos de Clientes y Catálogo General)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.equipment (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    plant_id TEXT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT,
    oil_type TEXT DEFAULT 'Sintético S-460',
    capacity TEXT DEFAULT '',
    filters_required TEXT DEFAULT 'Kit estándar',
    status TEXT DEFAULT 'active',
    last_maintenance TEXT,
    next_maintenance TEXT,
    engine_hours NUMERIC DEFAULT 0,
    voltage TEXT DEFAULT '220V 3F',
    type TEXT DEFAULT 'compresor',
    mode TEXT DEFAULT 'venta',
    data_plate_photo_url TEXT,
    manual_pdf_url TEXT,
    telemetry JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS plant_id TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS oil_type TEXT DEFAULT 'Sintético S-460';
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS capacity TEXT DEFAULT '';
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS filters_required TEXT DEFAULT 'Kit estándar';
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS last_maintenance TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS next_maintenance TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS engine_hours NUMERIC DEFAULT 0;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS voltage TEXT DEFAULT '220V 3F';
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'compresor';
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'venta';
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS data_plate_photo_url TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS manual_pdf_url TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS telemetry JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índices recomendados para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_equipment_brand ON public.equipment(brand);
CREATE INDEX IF NOT EXISTS idx_equipment_client_id ON public.equipment(client_id);
CREATE INDEX IF NOT EXISTS idx_equipment_model ON public.equipment(model);

-- ============================================================
-- 2. TABLA: catalog_items (Catálogo Maestro de Productos y Equipos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.catalog_items (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'equipment',
    item_code TEXT,
    name_or_model TEXT NOT NULL,
    description TEXT,
    brand TEXT,
    category TEXT,
    subcategory TEXT,
    bullet_items JSONB,
    price NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    stock NUMERIC DEFAULT 0,
    min_stock NUMERIC DEFAULT 1,
    unit TEXT DEFAULT 'pza',
    client_name TEXT DEFAULT 'General / Todos',
    equipment_model TEXT,
    serial_number TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'equipment';
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS item_code TEXT;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS name_or_model TEXT;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS bullet_items JSONB;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS stock NUMERIC DEFAULT 0;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS min_stock NUMERIC DEFAULT 1;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pza';
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT 'General / Todos';
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS equipment_model TEXT;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_catalog_items_brand ON public.catalog_items(brand);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON public.catalog_items(category);
CREATE INDEX IF NOT EXISTS idx_catalog_items_item_code ON public.catalog_items(item_code);

-- ============================================================
-- 3. TABLA: catalog_categories (Categorías del Catálogo)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.catalog_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TABLA: quotes (Cotizaciones y Folios)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotes (
    id TEXT PRIMARY KEY,
    fol_num TEXT NOT NULL,
    client_id TEXT,
    client_name TEXT,
    date TEXT,
    valid_until TEXT,
    concept TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC DEFAULT 0,
    vat NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft',
    agent_name TEXT,
    plant_name TEXT,
    plant_address TEXT,
    contact_name TEXT,
    contact_role TEXT,
    whatsapp TEXT,
    issuer_partner_id TEXT,
    issuer_partner_business_name TEXT,
    issuer_partner_name TEXT,
    issuer_partner_rfc TEXT,
    delivery_lead_time TEXT,
    quote_category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS fol_num TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS vat NUMERIC DEFAULT 0;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS idx_quotes_fol_num ON public.quotes(fol_num);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON public.quotes(client_id);

-- ============================================================
-- 5. TABLA: clients (Clientes, Plantas y Contactos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT,
    rfc TEXT,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    city TEXT,
    giro TEXT DEFAULT 'Industrial',
    plants JSONB DEFAULT '[]'::jsonb,
    contacts JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TABLA: customer_kits (Kits de Mantenimiento por Equipo/Cliente)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customer_kits (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    client_name TEXT,
    plant_name TEXT,
    equipment_model TEXT,
    serial_number TEXT,
    brand TEXT,
    description TEXT,
    part_number TEXT,
    price NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'MXN',
    unit TEXT DEFAULT 'pza',
    lead_time TEXT DEFAULT 'Inmediata',
    in_stock BOOLEAN DEFAULT true,
    stock_qty NUMERIC DEFAULT 0,
    kit_category TEXT DEFAULT 'preventivo_2k',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. TABLAS: staff Y user_accounts (Personal y Usuarios)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'technician',
    custom_job_title TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT,
    email TEXT,
    role TEXT DEFAULT 'technician',
    custom_job_title TEXT,
    phone TEXT,
    whatsapp TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. POLÍTICAS DE ACCESO (Row Level Security / RLS)
-- Permite lectura, inserción, actualización y eliminación
-- para la aplicación con la clave anónima (anon / public)
-- ============================================================

-- Habilitar RLS en cada tabla
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para anon y authenticated
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY['equipment', 'catalog_items', 'catalog_categories', 'quotes', 'clients', 'customer_kits', 'staff', 'user_accounts'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- ============================================================
-- 9. HABILITAR TIEMPO REAL (Supabase Realtime)
-- ============================================================
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.catalog_items;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
