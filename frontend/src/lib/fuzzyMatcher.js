export function match(transcript, phrases) {
  const lower = transcript.toLowerCase()
  return phrases.some(phrase => lower.includes(phrase.toLowerCase()))
}