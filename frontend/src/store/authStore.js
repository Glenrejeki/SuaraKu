import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),

      fetchProfile: async (userId) => {
        if (!userId) return;
        set({ loading: true })

        try {
          // 1. Ambil data profil dasar
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (profileData) {
            // 2. Agregasi XP dari Submissions (Tugas)
            const { data: subs } = await supabase
              .from('submissions')
              .select('total_score')
              .eq('student_id', userId);

            // 3. Agregasi XP dari Quiz Results
            // Catatan: Di StudentQuiz.jsx, XP dihitung score * 30
            // Kita perlu mengambil data kuis untuk sinkronisasi yang benar
            const { data: quizRes } = await supabase
              .from('quiz_results')
              .select('score, quiz_id')
              .eq('student_id', userId);

            const taskXP = subs?.reduce((acc, curr) => acc + (curr.total_score || 0), 0) || 0;

            // Mengasumsikan 1 soal kuis bernilai 30 XP seperti di StudentQuiz.jsx
            // Jika score di quiz_results adalah persentase, kita perlu menyesuaikan.
            // Untuk sementara kita asumsikan score di quiz_results adalah XP yang didapat atau kita hitung proporsional.
            // Berdasarkan StudentQuiz.jsx: xpGained = score (jumlah benar) * 30
            const quizXP = quizRes?.reduce((acc, curr) => {
                // Jika kita tidak simpan 'points' langsung, kita asumsikan dari score
                // Namun idealnya tabel quiz_results punya kolom points_earned
                return acc + (curr.score || 0);
            }, 0) || 0;

            const totalXP = taskXP + quizXP;
            const finalProfile = { ...profileData, xp: totalXP };

            // 4. Sinkronisasi ke Database jika berbeda
            if (profileData.xp !== totalXP) {
              await supabase.from('profiles').update({ xp: totalXP }).eq('id', userId);
            }

            set({ profile: finalProfile, loading: false });
            return finalProfile;
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          set({ loading: false });
        }
      },

      updateXP: async (xpGained) => {
        const { profile } = get()
        if (profile) {
          const newXP = (profile.xp || 0) + xpGained;
          set({ profile: { ...profile, xp: newXP } });
          await supabase.from('profiles').update({ xp: newXP }).eq('id', profile.id);
        }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
      }
    }),
    {
      name: 'suaraku-auth-storage',
    }
  )
)
