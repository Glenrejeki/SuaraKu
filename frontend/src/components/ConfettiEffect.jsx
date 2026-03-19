import React, { useEffect } from 'react'

export default function ConfettiEffect({ active }) {
  useEffect(() => {
    if (!active) return
    // Simple confetti simulation
    const interval = setInterval(() => {
      console.log('🎉 Confetti!')
    }, 100)
    return () => clearInterval(interval)
  }, [active])

  return active ? <div className="fixed inset-0 pointer-events-none">🎊</div> : null
}