import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

export function useAdaptiveUI() {
  const { disability } = useAuthStore()

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-disability', disability || 'none')
  }, [disability])
}