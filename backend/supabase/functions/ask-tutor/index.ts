import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getCachedResponse, setCachedResponse } from '../_shared/cache.ts';
import { callHuggingFace } from '../_shared/huggingface.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { question, context } = await req.json();
    if (!question) throw new Error('Missing question');

    const fullPrompt = context
      ? `Konteks: ${context}\nPertanyaan: ${question}\nJawab dengan penjelasan sederhana:`
      : `Pertanyaan: ${question}\nJawab dengan penjelasan sederhana:`;

    const model = 'google/flan-t5-base';
    const cached = await getCachedResponse(fullPrompt, model);
    if (cached) {
      return new Response(JSON.stringify({ answer: cached, fromCache: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await callHuggingFace(model, fullPrompt);
    const answer = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;

    await setCachedResponse(fullPrompt, model, answer);

    return new Response(JSON.stringify({ answer, fromCache: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});