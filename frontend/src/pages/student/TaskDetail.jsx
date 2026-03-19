import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import VoiceButton from '../../components/VoiceButton/VoiceButton'

export default function TaskDetail() {
  const { id } = useParams()
  const [answer, setAnswer] = useState('')
  const [mode, setMode] = useState('text') // 'voice', 'text', 'file'

  const handleSubmit = () => {
    // submit ke supabase
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Detail Tugas #{id}</h1>
      <div className="mt-4">
        <p>Deskripsi tugas...</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setMode('voice')} className="bg-primary text-white p-2 rounded">Suara</button>
          <button onClick={() => setMode('text')} className="bg-primary text-white p-2 rounded">Teks</button>
          <button onClick={() => setMode('file')} className="bg-primary text-white p-2 rounded">Upload</button>
        </div>
        {mode === 'text' && (
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="border p-2 w-full mt-4"
            rows={5}
          />
        )}
        {mode === 'voice' && (
          <div className="mt-4">
            <VoiceButton />
            <p className="mt-2">Hasil transkrip: {answer}</p>
          </div>
        )}
        {mode === 'file' && (
          <input type="file" className="mt-4" />
        )}
        <button onClick={handleSubmit} className="bg-success text-white p-2 rounded mt-4">
          Kirim Jawaban
        </button>
      </div>
    </div>
  )
}