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
        set({ loading: true })
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (data) {
          set({ profile: data, loading: false })
        } else {
          set({ loading: false })
        }
      },

      updateXP: (xpGained) => {
        const { profile } = get()
        if (profile) {
          set({
            profile: {
              ...profile,
              xp: (profile.xp || 0) + xpGained
            }
          })
        }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
      }
    }),
    {
      name: 'suaraku-auth-storage',
      getStorage: () => localStorage,
    }
  )
)
