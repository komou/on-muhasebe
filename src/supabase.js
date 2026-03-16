import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hdubgibayjxjnrvubabb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WoxvGlhPTyjIZFa_4-Up5A_v2nfXIif';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);