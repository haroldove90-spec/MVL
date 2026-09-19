import { supabase } from './supabase';
import { Client, Equipment, Staff, Quote, InventoryItem, CustomerKitItem } from '../types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_EQUIPMENT, 
  INITIAL_STAFF, 
  INITIAL_INVENTORY, 
  INITIAL_QUOTES, 
  INITIAL_CUSTOMER_KITS,
  saveToStorage,
  loadFromStorage
} from '../mockData';

export interface SyncStatus {
  clients: 'idle' | 'syncing' | 'synced' | 'error';
  equipment: 'idle' | 'syncing' | 'synced' | 'error';
  staff: 'idle' | 'syncing' | 'synced' | 'error';
  kits: 'idle' | 'syncing' | 'synced' | 'error';
  quotes: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime?: Date;
}

// ==========================================
// 1. CLIENTES, PLANTAS Y CONTACTOS
// ==========================================
export async function fetchClientsFromSupabase(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[dataSync] Error fetching clients from Supabase:', error.message);
      return loadFromStorage<Client[]>('mvl_clients', INITIAL_CLIENTS);
    }

    if (data && data.length > 0) {
      const mapped: Client[] = data.map(row => ({
        id: row.id,
        name: row.name || row.company_name,
        companyName: row.company_name || row.name,
        rfc: row.rfc || '',
        email: row.email || '',
        phone: row.phone || row.whatsapp || '',
        whatsapp: row.whatsapp || row.phone || '',
        address: row.address || '',
        city: row.city || '',
        giro: row.giro || 'Industrial',
        plants: Array.isArray(row.plants) ? row.plants : [],
        contacts: Array.isArray(row.contacts) ? row.contacts : []
      }));
      saveToStorage('mvl_clients', mapped);
      return mapped;
    }

    return loadFromStorage<Client[]>('mvl_clients', INITIAL_CLIENTS);
  } catch (err) {
    console.warn('[dataSync] Exception syncing clients:', err);
    return loadFromStorage<Client[]>('mvl_clients', INITIAL_CLIENTS);
  }
}

export async function persistClientToSupabase(client: Client): Promise<boolean> {
  try {
    const dbPayload = {
      id: client.id,
      name: client.name,
      company_name: client.companyName || client.name,
      rfc: client.rfc || '',
      email: client.email || '',
      phone: client.phone || '',
      whatsapp: client.whatsapp || client.phone || '',
      address: client.address || '',
      city: client.city || '',
      plants: client.plants || [],
      contacts: client.contacts || []
    };

    const { error } = await supabase
      .from('clients')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.warn('[dataSync] Failed to upsert client to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[dataSync] Exception saving client to Supabase:', err);
    return false;
  }
}

// ==========================================
// 2. EQUIPOS REGISTRADOS
// ==========================================
export async function fetchEquipmentFromSupabase(): Promise<Equipment[]> {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[dataSync] Error fetching equipment:', error.message);
      return loadFromStorage<Equipment[]>('mvl_equipment', INITIAL_EQUIPMENT);
    }

    if (data && data.length > 0) {
      const mapped: Equipment[] = data.map(row => ({
        id: row.id,
        clientId: row.client_id || '',
        plantId: row.plant_id || '',
        name: row.name,
        brand: row.brand || '',
        model: row.model || '',
        serialNumber: row.serial_number || '',
        oilType: row.oil_type || '',
        capacity: row.capacity || '',
        filtersRequired: row.filters_required || '',
        status: (row.status as any) || 'active',
        lastMaintenance: row.last_maintenance || '',
        nextMaintenance: row.next_maintenance || '',
        engineHours: Number(row.engine_hours) || 0,
        telemetry: row.telemetry || {}
      }));
      saveToStorage('mvl_equipment', mapped);
      return mapped;
    }

    return loadFromStorage<Equipment[]>('mvl_equipment', INITIAL_EQUIPMENT);
  } catch (err) {
    console.warn('[dataSync] Exception syncing equipment:', err);
    return loadFromStorage<Equipment[]>('mvl_equipment', INITIAL_EQUIPMENT);
  }
}

export async function persistEquipmentToSupabase(eq: Equipment): Promise<boolean> {
  try {
    const dbPayload = {
      id: eq.id,
      client_id: eq.clientId,
      plant_id: eq.plantId,
      name: eq.name,
      brand: eq.brand,
      model: eq.model,
      serial_number: eq.serialNumber,
      oil_type: eq.oilType,
      capacity: eq.capacity,
      filters_required: eq.filtersRequired,
      status: eq.status,
      last_maintenance: eq.lastMaintenance || null,
      next_maintenance: eq.nextMaintenance || null,
      engine_hours: eq.engineHours || 0,
      telemetry: eq.telemetry || {}
    };

    const { error } = await supabase
      .from('equipment')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.warn('[dataSync] Error saving equipment to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[dataSync] Exception saving equipment:', err);
    return false;
  }
}

// ==========================================
// 3. PERSONAL Y ASESORES COMERCIALES (STAFF)
// ==========================================
export async function fetchStaffFromSupabase(): Promise<Staff[]> {
  try {
    // Attempt staff table first
    const { data, error } = await supabase
      .from('staff')
      .select('*');

    if (!error && data && data.length > 0) {
      const mapped: Staff[] = data.map(row => ({
        id: row.id,
        name: row.name,
        role: row.role as any,
        customJobTitle: row.custom_job_title || row.role_description,
        phone: row.phone || row.whatsapp || '',
        whatsapp: row.whatsapp || row.phone || '',
        email: row.email || '',
        active: row.active !== false
      }));
      saveToStorage('mvl_staff', mapped);
      return mapped;
    }

    // Fallback or augment with user_accounts
    const { data: userData, error: userError } = await supabase
      .from('user_accounts')
      .select('*');

    if (!userError && userData && userData.length > 0) {
      const fromUsers: Staff[] = userData.map(u => ({
        id: u.id || `st_${u.username}`,
        name: u.name,
        role: u.role as any,
        customJobTitle: u.custom_job_title || '',
        phone: u.phone || u.whatsapp || '',
        whatsapp: u.whatsapp || u.phone || '',
        email: u.email || '',
        active: u.active !== false
      }));
      saveToStorage('mvl_staff', fromUsers);
      return fromUsers;
    }

    return loadFromStorage<Staff[]>('mvl_staff', INITIAL_STAFF);
  } catch (err) {
    console.warn('[dataSync] Exception syncing staff:', err);
    return loadFromStorage<Staff[]>('mvl_staff', INITIAL_STAFF);
  }
}

export async function persistStaffToSupabase(s: Staff): Promise<boolean> {
  try {
    const dbPayload = {
      id: s.id,
      name: s.name,
      role: s.role,
      custom_job_title: s.customJobTitle || null,
      phone: s.phone || s.whatsapp || '',
      whatsapp: s.whatsapp || s.phone || '',
      email: s.email || '',
      active: s.active !== false
    };

    // Upsert into staff table
    await supabase.from('staff').upsert(dbPayload, { onConflict: 'id' });

    // Also keep user_accounts in sync if matching email or username exists
    const username = (s.email.split('@')[0] || s.name.toLowerCase().replace(/\s+/g, '_')).slice(0, 30);
    await supabase.from('user_accounts').upsert({
      id: s.id,
      name: s.name,
      username: username,
      email: s.email || `${username}@mvl.com`,
      role: s.role,
      custom_job_title: s.customJobTitle || null,
      phone: s.phone || s.whatsapp || '',
      whatsapp: s.whatsapp || s.phone || '',
      active: s.active !== false
    }, { onConflict: 'id' });

    return true;
  } catch (err) {
    console.warn('[dataSync] Exception persisting staff:', err);
    return false;
  }
}

// ==========================================
// 4. KITS Y CATÁLOGO DE REFACCIONES
// ==========================================
export async function fetchCustomerKitsFromSupabase(): Promise<CustomerKitItem[]> {
  try {
    const { data, error } = await supabase
      .from('customer_kits')
      .select('*')
      .order('client_name', { ascending: true });

    if (error) {
      console.warn('[dataSync] Error fetching customer_kits:', error.message);
      return loadFromStorage<CustomerKitItem[]>('mvl_customer_kits', INITIAL_CUSTOMER_KITS);
    }

    if (data && data.length > 0) {
      const mapped: CustomerKitItem[] = data.map(row => ({
        id: row.id,
        clientId: row.client_id || '',
        clientName: row.client_name || '',
        plantName: row.plant_name || '',
        equipmentModel: row.equipment_model || '',
        serialNumber: row.serial_number || '',
        brand: row.brand || '',
        description: row.description || '',
        partNumber: row.part_number || '',
        price: Number(row.price) || 0,
        currency: (row.currency as any) || 'MXN',
        unit: row.unit || 'pza',
        leadTime: row.lead_time || 'Inmediata',
        inStock: row.in_stock !== false,
        stockQty: Number(row.stock_qty) || 0,
        kitCategory: row.kit_category || 'preventivo_2k',
        isActive: row.is_active !== false
      }));
      saveToStorage('mvl_customer_kits', mapped);
      return mapped;
    }

    return loadFromStorage<CustomerKitItem[]>('mvl_customer_kits', INITIAL_CUSTOMER_KITS);
  } catch (err) {
    console.warn('[dataSync] Exception syncing customer kits:', err);
    return loadFromStorage<CustomerKitItem[]>('mvl_customer_kits', INITIAL_CUSTOMER_KITS);
  }
}

// ==========================================
// 5. COTIZACIONES Y FORMATOS
// ==========================================
export async function fetchQuotesFromSupabase(): Promise<Quote[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[dataSync] Error fetching quotes:', error.message);
      return loadFromStorage<Quote[]>('mvl_quotes', INITIAL_QUOTES);
    }

    if (data && data.length > 0) {
      const mapped: Quote[] = data.map(row => {
        const parsedItems = Array.isArray(row.items) ? row.items : [];
        return {
          id: row.id,
          folNum: row.fol_num || row.id,
          clientId: row.client_id || '',
          clientName: row.client_name || '',
          date: row.date || new Date().toISOString().split('T')[0],
          validUntil: row.valid_until || '',
          concept: row.concept || 'Cotización de Servicio y Refacciones',
          subtotal: Number(row.subtotal) || 0,
          tax: Number(row.vat) || 0,
          total: Number(row.total) || 0,
          status: (row.status as any) || 'draft',
          itemsTable: parsedItems,
          items: parsedItems,
          agentName: row.agent_name || '',
          plantName: row.plant_name || '',
          plantAddress: row.plant_address || '',
          contactName: row.contact_name || '',
          contactRole: row.contact_role || '',
          whatsapp: row.whatsapp || '',
          issuerPartnerId: row.issuer_partner_id || 'partner_1',
          issuerPartnerBusinessName: row.issuer_partner_business_name || '',
          issuerPartnerName: row.issuer_partner_name || '',
          issuerPartnerRfc: row.issuer_partner_rfc || '',
          deliveryLeadTime: row.delivery_lead_time || 'Inmediata',
          quoteCategory: row.quote_category || 'standard'
        } as Quote;
      });
      saveToStorage('mvl_quotes', mapped);
      return mapped;
    }

    return loadFromStorage<Quote[]>('mvl_quotes', INITIAL_QUOTES);
  } catch (err) {
    console.warn('[dataSync] Exception syncing quotes:', err);
    return loadFromStorage<Quote[]>('mvl_quotes', INITIAL_QUOTES);
  }
}

export async function persistQuoteToSupabase(q: Quote): Promise<boolean> {
  try {
    const dbPayload = {
      id: q.id,
      fol_num: q.folNum,
      client_id: q.clientId || null,
      client_name: q.clientName,
      date: q.date || new Date().toISOString().split('T')[0],
      items: q.itemsTable || (q as any).items || [],
      subtotal: q.subtotal,
      vat: q.tax,
      total: q.total,
      status: q.status
    };

    const { error } = await supabase
      .from('quotes')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.warn('[dataSync] Error saving quote to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[dataSync] Exception saving quote:', err);
    return false;
  }
}

export function subscribeToAllChanges(
  callback: (entity: 'clients' | 'equipment' | 'staff' | 'quotes', payload: any) => void
): () => void {
  try {
    const channel = supabase
      .channel('mvl_public_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
        callback('clients', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, (payload) => {
        callback('equipment', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, (payload) => {
        callback('staff', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, (payload) => {
        callback('quotes', payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[dataSync] Error establishing realtime subscription:', err);
    return () => {};
  }
}
