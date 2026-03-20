import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callHuggingFace } from '../_shared/huggingface.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { studentData } = await req.json();
    // studentData bisa berisi rangkuman aktivitas, misal: totalXP, streak, tugasTerakhir, dll
    const prompt = `Buat insight untuk orang tua tentang perkembangan belajar anak berdasarkan data: ${JSON.stringify(studentData)}. Gunakan bahasa yang hangat dan suportif.`;
    const model = 'google/flan-t5-base';
    const result = await callHuggingFace(model, prompt);
    const insight = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});