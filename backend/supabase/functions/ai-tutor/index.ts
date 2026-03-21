// supabase/functions/ai-tutor/index.js
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set in Supabase Secrets");
    }

    const { message, kelas, nama } = await req.json();

    const TUTOR_PROMPT = `Kamu adalah Kak Bintang, asisten belajar yang ramah untuk anak SD.
    
Informasi siswa:
- Nama: ${nama || 'Teman'}
- Kelas: ${kelas || 1}

Tugasmu:
1. Gunakan bahasa yang sederhana, ceria, dan mudah dipahami
2. Sertakan emoji yang sesuai untuk membuat pembelajaran menyenangkan
3. Berikan contoh konkret yang relevan dengan kehidupan sehari-hari
4. Jika siswa bingung, jelaskan dengan cara yang berbeda
5. Selalu berikan semangat dan pujian

Aturan:
- Jawab dengan ramah dan sabar
- Hindari jargon yang rumit
- Maksimal 3-4 kalimat per jawaban (kecuali jika diminta penjelasan panjang)
- Gunakan nama siswa jika disebutkan`;

    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: TUTOR_PROMPT },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq API Error Response:", errText);
      throw new Error(`Groq API Error: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const reply = groqData.choices?.[0]?.message?.content ?? "Maaf, Kak Bintang sedang tidak bisa menjawab. Coba tanya lagi nanti ya! 😊";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Tutor Error:", error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      reply: "Waduh, Kak Bintang lagi istirahat sebentar. Coba lagi nanti ya! 😊" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});