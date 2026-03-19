import React from 'react'
import { Link } from 'react-router-dom'

export default function TeacherDashboard() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard Guru</h1>
      <div className="mt-4 flex gap-4">
        <Link to="/teacher/upload" className="bg-primary text-white p-3 rounded">Upload Modul</Link>
        <Link to="/teacher/create-task" className="bg-primary text-white p-3 rounded">Buat Tugas</Link>
      </div>
      <div className="mt-8">
        <h2 className="text-xl">Progress Siswa</h2>
        {/* chart */}
      </div>
    </div>
  )
}