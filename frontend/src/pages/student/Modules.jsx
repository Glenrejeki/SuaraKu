import React from 'react'
import { useAI } from '../../hooks/useAI'
import AILoadingSkeleton from '../../components/AILoadingSkeleton'

export default function Modules() {
  const { summarize } = useAI()
  const [summary, setSummary] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSummarize = async () => {
    setLoading(true)
    const result = await summarize('Teks modul contoh...')
    setSummary(result)
    setLoading(false)
  }

  return (
    <div>
      <h1>Modul Pembelajaran</h1>
      <button onClick={handleSummarize} className="bg-primary text-white p-2 rounded">
        Ringkas Modul
      </button>
      {loading && <AILoadingSkeleton />}
      {summary && <p>{summary}</p>}
    </div>
  )
}