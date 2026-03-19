import { callHuggingFace } from "../_shared/huggingface";

export default async function handler(req: Request) {
  const { question } = await req.json();
  return callHuggingFace(`Explain: ${question}`);
}