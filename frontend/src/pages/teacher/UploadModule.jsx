import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function UploadModule() {
  const [file, setFile] = useState(null)
  const [summary, setSummary] = useState('')

  const handleUpload = async () => {
    // upload ke storage
    const { data, error } = await supabase.storage.from('modules').upload(`public/${file.name}`, file)
    if (error) console.error(error)
    else {
      // panggil edge function summarize
      const { data: summaryData } = await supabase.functions.invoke('summarize', { body: { text: 'isi pdf...' } })
      setSummary(summaryData.summary)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Upload Modul</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mt-4" />
      <button onClick={handleUpload} className="bg-primary text-white p-2 rounded mt-4">Upload</button>
      {summary && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-bold">Ringkasan AI:</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  )
}