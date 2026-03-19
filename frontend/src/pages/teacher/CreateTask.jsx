import React from 'react'

export default function CreateTask() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Buat Tugas</h1>
      <form className="mt-4 space-y-4">
        <input type="text" placeholder="Judul Tugas" className="w-full p-2 border rounded" />
        <textarea placeholder="Deskripsi" className="w-full p-2 border rounded" rows={4} />
        <input type="date" className="w-full p-2 border rounded" />
        <button type="submit" className="bg-primary text-white p-2 rounded">Buat</button>
      </form>
    </div>
  )
}