export async function callHuggingFace(model: string, inputs: any) {
  const HF_TOKEN = Deno.env.get('HF_TOKEN');
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs }),
  });

  if (response.status === 503) {
    const error = await response.json();
    throw new Error(`Model is loading: ${error.estimated_time}s`);
  }
  return response.json();
}