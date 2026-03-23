// supabase/functions/ai-tutor/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const CUSTOM_API_KEY = Deno.env.get("CUSTOM_AI_TUTOR_KEY");
    const clientApiKey = req.headers.get("x-api-key");

    if (!CUSTOM_API_KEY || clientApiKey !== CUSTOM_API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing in Supabase Secrets");
    }

    // Gunakan try-catch kecil untuk parsing JSON agar lebih aman
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("Gagal membaca request body (JSON invalid)");
    }

    const { message, kelas, nama, weak_topics } = body;
    if (!message) throw new Error("Pesan (message) tidak boleh kosong");

    const topicsContext = weak_topics && weak_topics.length > 0
      ? `Siswa ini sedang mempelajari: ${weak_topics.join(", ")}.`
      : "";

    const TUTOR_PROMPT = `Kamu adalah Kak BintangAi, asisten belajar SD yang ceria.
    
ATURAN UTAMA:
1. Nama Siswa: ${nama || 'Teman'}, Kelas: ${kelas || 1}. ${topicsContext}
2. Jawab dengan ramah, gunakan emoji, dan bahasa yang mudah dimengerti anak SD.
3. Maksimal 3-4 kalimat.
4. Di akhir jawaban, sertakan tag topik: <!--TOPICS:topik1,topik2-->`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Menggunakan model yang lebih stabil
        messages: [
          { role: "system", content: TUTOR_PROMPT },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error("Groq API Detail Error:", errorData);
      throw new Error(`Groq API Error: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const reply = groqData.choices?.[0]?.message?.content ?? "Maaf ya, Kak BintangAi lagi bingung. 😊";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("AI Tutor Error:", error.message);
    return new Response(JSON.stringify({
      reply: "Waduh, Kak BintangAi lagi istirahat sebentar. 😊",
      debug_error: error.message // Ini akan membantu kita tahu apa yang salah
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
