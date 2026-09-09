import { createClient } from '@supabase/supabase-js';

function sanitizeSupabaseUrl(url?: string): string {
  let cleaned = (url || '').trim();
  if (!cleaned) return 'https://vquibpskgoxtzaiphkac.supabase.co';

  // If user pasted dashboard project URL (e.g. https://supabase.com/dashboard/project/vquibpskgoxtzaiphkac)
  const projectMatch = cleaned.match(/project\/([a-z0-9]+)/i);
  if (projectMatch && projectMatch[1]) {
    return `https://${projectMatch[1]}.supabase.co`;
  }

  // Remove trailing /rest/v1 or /rest/v1/ suffix if mistakenly added
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  // Remove any trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');

  return cleaned || 'https://vquibpskgoxtzaiphkac.supabase.co';
}

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL = sanitizeSupabaseUrl(rawUrl);
const SUPABASE_ANON_KEY = (rawKey || '').trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdWlicHNrZ294dHphaXBoa2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDExNzcsImV4cCI6MjEwMDIxNzE3N30.rDZ2fprxgExOfQ0irX9lX_fP2A0ePYR_UD_efBETTfk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

