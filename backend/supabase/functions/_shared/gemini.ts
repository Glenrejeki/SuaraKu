export async function callGemini(prompt: string, config?: { temperature?: number, maxTokens?: number }) {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY tidak ditemukan di Secrets Supabase.");
  }

  const MODEL = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: config?.maxTokens || 1000,
        temperature: config?.temperature || 0.7,
      }
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "Gagal memanggil Gemini API");
  }

  return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
