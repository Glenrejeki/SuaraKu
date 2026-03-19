import React from 'react'
import { Link } from 'react-router-dom'
import VoiceButton from '../../components/VoiceButton/VoiceButton'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-center text-primary">SuaraKu</h1>
        <p className="text-xl text-center mt-4">Belajar Tanpa Batas — Setiap Suara Adalah Langkah Maju</p>
        <div className="flex justify-center mt-8">
          <VoiceButton />
        </div>
        <div className="text-center mt-8">
          <Link to="/auth" className="bg-primary text-white px-6 py-3 rounded-lg text-lg">
            Mulai Sekarang
          </Link>
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">🎤 Voice-First Learning</div>
          <div className="text-center">♿ Adaptive UI</div>
          <div className="text-center">🤖 AI Tutor</div>
        </div>
      </div>
    </div>
  )
}