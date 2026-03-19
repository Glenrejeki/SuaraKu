import React from 'react'

export default function StreakBadge({ days }) {
  return (
    <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
      <span>🔥</span>
      <span className="font-bold">{days} hari</span>
    </div>
  )
}