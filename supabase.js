// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = "https://pamuhftcixcyinvajsej.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_njAPpdJQozdbRHvYC8dsIQ_eRq2fX28";

const KUOTA_PAX = 100;

// Inisialisasi Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
