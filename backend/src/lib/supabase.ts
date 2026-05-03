import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Usamos a SERVICE_ROLE_KEY no backend para ignorar RLS quando necessário (ex: Webhooks)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
