import { supabase } from '../lib/supabase'

export function useAI() {
  const summarize = async (text) => {
    const { data, error } = await supabase.functions.invoke('summarize', { body: { text } })
    if (error) throw error
    return data.summary
  }

  const simplify = async (text) => {
    const { data, error } = await supabase.functions.invoke('simplify', { body: { text } })
    if (error) throw error
    return data.simplified
  }

  const askTutor = async (question, context = '') => {
    const { data, error } = await supabase.functions.invoke('ask-tutor', { body: { question, context } })
    if (error) throw error
    return data.answer
  }

  return { summarize, simplify, askTutor }
}