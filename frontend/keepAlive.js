// Menggunakan native fetch (tersedia di Node.js v18+)
// Tidak perlu lagi import 'node-fetch'

const SUPABASE_URL = 'https://rnahdxukfyzifvsbhndu.supabase.co'; // Diambil dari .env anda
const INTERVAL = 4 * 60 * 1000; // 4 menit

console.log('🚀 Keep-alive script started. Pinging Supabase every 4 minutes...');

function pingSupabase() {
  fetch(SUPABASE_URL)
    .then(res => {
      console.log(`[${new Date().toLocaleTimeString()}] Ping status: ${res.status}`);
    })
    .catch(err => {
      console.error(`[${new Date().toLocaleTimeString()}] Ping failed:`, err.message);
    });
}

// Ping pertama saat dijalankan
pingSupabase();

// Interval selanjutnya
setInterval(pingSupabase, INTERVAL);
