import { callHuggingFace } from "../_shared/huggingface";

export default async function handler(req: Request) {
  const { text } = await req.json();
  return callHuggingFace(`Summarize: ${text}`);
}