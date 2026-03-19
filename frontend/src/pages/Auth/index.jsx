import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [disability, setDisability] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Masuk ke SuaraKu</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border rounded mb-4">
          <option value="student">Siswa</option>
          <option value="teacher">Guru</option>
          <option value="parent">Orang Tua</option>
        </select>
        <select value={disability} onChange={(e) => setDisability(e.target.value)} className="w-full p-2 border rounded mb-4">
          <option value="">Pilih kebutuhan khusus (opsional)</option>
          <option value="blind">Tunanetra</option>
          <option value="deaf">Tunarungu</option>
          <option value="mute">Tunawicara</option>
        </select>
        <button type="submit" className="w-full bg-primary text-white p-2 rounded">
          Masuk
        </button>
      </form>
    </div>
  )
}