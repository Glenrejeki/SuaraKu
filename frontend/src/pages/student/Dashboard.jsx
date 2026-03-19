import React from 'react'
import VoiceButton from '../../components/VoiceButton/VoiceButton'
import XPBar from '../../components/XPBar'
import StreakBadge from '../../components/StreakBadge'

export default function StudentDashboard() {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Halo, Siswa!</h1>
        <StreakBadge days={5} />
      </div>
      <XPBar current={250} max={500} />
      <div className="mt-8">
        <h2 className="text-xl">Tugas Aktif</h2>
        {/* Daftar tugas */}
      </div>
      <VoiceButton />
    </div>
  )
}