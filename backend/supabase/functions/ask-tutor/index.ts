import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGemini } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { question, context, user_profile } = await req.json();

    if (!question) throw new Error('Pertanyaan tidak boleh kosong.');

    const systemRole = `Kamu adalah SuaraKu AI, tutor pendamping belajar SD yang sangat sabar dan ramah.
Siswa ini memiliki kebutuhan khusus: ${user_profile?.disability_type || 'Umum'} dan berada di kelas ${user_profile?.grade_level || 'SD'}.
Jelaskan dengan bahasa anak-anak yang sangat sederhana. Jika matematika, tunjukkan langkahnya.`;

    const fullPrompt = `${systemRole}\nKonteks materi: ${context || 'Umum'}\nPertanyaan Siswa: ${question}`;

    const answer = await callGemini(fullPrompt, {
      maxTokens: 500,
      temperature: 0.7
    });

    return new Response(JSON.stringify({
      answer: answer || "Aku belum bisa menjawab itu, coba tanya hal lain ya!",
      topic: "Umum"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({
      error: error.message,
      answer: "Ada kendala teknis di server. Pak Guru sedang memperbaikinya!"
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
