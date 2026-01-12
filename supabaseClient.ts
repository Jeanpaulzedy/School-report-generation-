
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jnizmblhzqpkftaomtml.supabase.co';
const supabaseAnonKey = 'sb_publishable_oC6USD20cAq4zU12eiuQig_49X2AGOk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('school_settings').select('count').limit(1);
    if (error && error.message.includes('apiKey')) return { ok: false, status: 'Invalid API Key' };
    return { ok: true, status: 'Connected' };
  } catch (err: any) {
    return { ok: false, status: 'Error', message: err.message };
  }
};
