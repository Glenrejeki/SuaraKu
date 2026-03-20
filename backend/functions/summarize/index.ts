import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getCachedResponse, setCachedResponse } from '../_shared/cache.ts';
import { callHuggingFace } from '../_shared/huggingface.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) throw new Error('Missing text');

    const model = 'facebook/bart-large-cnn';
    const cached = await getCachedResponse(text, model);
    if (cached) {
      return new Response(JSON.stringify({ summary: cached, fromCache: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await callHuggingFace(model, text);
    const summary = Array.isArray(result) ? result[0]?.summary_text : result.summary_text;

    await setCachedResponse(text, model, summary);

    return new Response(JSON.stringify({ summary, fromCache: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});