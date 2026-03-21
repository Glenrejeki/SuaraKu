// hooks/useAI.js
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useAI() {
  const { profile } = useAuthStore()

  /**
   * Fitur Tanya AI (Chat dengan Kak Bintang)
   * Menggunakan Edge Function 'ai-tutor'
   */
  const askTutor = async (question) => {
    if (!question || !question.trim()) {
      return { answer: "Halo! Ada yang bisa Kak Bintang bantu? 😊" }
    }

    try {
      console.log("Sending request to ai-tutor function...")

      const { data, error } = await supabase.functions.invoke('ai-tutor', {
        body: {
          message: question,
          kelas: profile?.grade_level || 1,
          nama: profile?.full_name || 'Teman'
        },
      })

      if (error) {
        console.error("Supabase function error:", error)
        throw error
      }

      const answer = data?.reply ?? "Maaf, Kak Bintang sedang tidak bisa menjawab. Coba tanya lagi nanti ya! 😊"

      // Simpan log ke Supabase (opsional)
      try {
        await supabase.from('ai_interactions').insert({
          student_id: profile?.id,
          question: question.substring(0, 500),
          answer: answer.substring(0, 1000),
          topic: "Umum",
          disability_context: profile?.disability_type,
          grade_context: profile?.grade_level
        })
      } catch (e) {
        console.warn("Gagal insert log:", e.message)
      }

      return { answer }

    } catch (error) {
      console.error("AI Error details:", error)
      let userMessage = "Waduh, Kak Bintang lagi istirahat sebentar. Coba lagi nanti ya! 😊"

      if (error.message?.includes("Failed to fetch") || error.message?.includes("network")) {
        userMessage = "Koneksi internet sedang bermasalah. Periksa koneksi internetmu ya! 😊"
      }

      return { answer: userMessage }
    }
  }

  /**
   * Fitur Meringkas Modul
   * Menggunakan Edge Function 'summarize'
   */
  const summarize = async (content) => {
    if (!content || !content.trim()) {
      return "Tidak ada materi yang bisa diringkas. 😊"
    }

    try {
      console.log("Sending request to summarize function...")

      const { data, error } = await supabase.functions.invoke('summarize', {
        body: {
          content: content,
          grade_level: profile?.grade_level || 1
        },
      })

      if (error) {
        console.error("Summarize function error:", error)
        throw error
      }

      return data?.summary ?? "📚 **Gagal meringkas modul.** Coba lagi nanti ya! 😊"

    } catch (error) {
      console.error("Summarize Error details:", error)
      return "Waduh, Kak Bintang kesulitan membaca modul ini. Coba lagi nanti ya! 😊"
    }
  }

  return { askTutor, summarize }
}
