import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  disability: null,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setDisability: (disability) => set({ disability }),
}))