# BintangAi - Platform Belajar Berbasis Suara untuk Siswa Berkebutuhan Khusus

## Tech Stack
- Frontend: React + Vite (deploy ke Vercel)
- Backend Logic: Supabase Edge Functions (Deno)
- Database/Auth/Storage: Supabase
- AI: Groq Cloud API & Google Gemini via Edge Functions

## Cara Deploy
1. Clone repositori ini
2. Setup Supabase project dan ambil URL & anon key
3. Isi .env file
4. Deploy Edge Functions: `supabase functions deploy`
5. Deploy frontend ke Vercel
