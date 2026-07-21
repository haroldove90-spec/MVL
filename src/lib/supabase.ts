import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://vquibpskgoxtzaiphkac.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdWlicHNrZ294dHphaXBoa2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDExNzcsImV4cCI6MjEwMDIxNzE3N30.rDZ2fprxgExOfQ0irX9lX_fP2A0ePYR_UD_efBETTfk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
