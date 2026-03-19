import React from 'react'

export default function AILoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4 border rounded-lg">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded w-5/6"></div>
      <p className="text-sm text-gray-500">AI sedang membaca modul kamu...</p>
    </div>
  )
}