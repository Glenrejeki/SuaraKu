// supabase/functions/summarize/index.js
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

    const { content, grade_level } = await req.json();

    const SUMMARIZE_PROMPT = `Kamu adalah Kak SuaraKu, asisten belajar SD.
Tugasmu adalah meringkas materi modul menjadi poin-poin yang sangat sederhana untuk anak kelas ${grade_level || 'SD'}.
Gunakan bahasa yang ceria dan banyak emoji. Maksimal 5 poin ringkasan.
Setiap poin harus:
- Menggunakan kata-kata sederhana
- Disertai emoji yang relevan
- Mudah diingat

Format ringkasan:
📚 **RINGKASAN MATERI**
${Array.from({ length: 5 }, (_, i) => `${i+1}. [Poin dengan emoji]`).join('\n')}

✨ **Tips Belajar**: [1 tips sederhana]`;

    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SUMMARIZE_PROMPT },
          { role: "user", content: `Ringkas materi berikut dengan format yang sudah ditentukan:\n\n${content}` },
        ],
        max_tokens: 500,
        temperature: 0.5,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq API Error Response:", errText);
      throw new Error(`Groq API Error: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const summary = groqData.choices?.[0]?.message?.content ?? "📚 **Maaf, Kak SuaraKu sedang tidak bisa meringkas materi. Coba lagi nanti ya!** 😊";

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Summarize Error:", error.message);
    return new Response(JSON.stringify({
      error: error.message,
      summary: "Waduh, Kak SuaraKu kesulitan membaca modul ini. Coba lagi nanti ya! 😊"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});