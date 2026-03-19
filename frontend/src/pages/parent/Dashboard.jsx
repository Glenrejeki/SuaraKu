import React from 'react'

export default function ParentDashboard() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard Orang Tua</h1>
      <div className="mt-4">
        <h2>Progress Ananda</h2>
        {/* chart progress */}
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p className="font-bold">AI Insight:</p>
          <p>Ananda sudah belajar 3 hari berturut-turut. Semangat!</p>
        </div>
      </div>
    </div>
  )
}