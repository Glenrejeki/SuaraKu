import React from 'react'

export default function XPBar({ current, max }) {
  const percent = (current / max) * 100
  return (
    <div className="w-full bg-gray-200 rounded-full h-4">
      <div
        className="bg-primary h-4 rounded-full transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}