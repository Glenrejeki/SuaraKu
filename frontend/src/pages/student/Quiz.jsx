import React, { useState } from 'react'
import ConfettiEffect from '../../components/ConfettiEffect'

export default function Quiz() {
  const [showConfetti, setShowConfetti] = useState(false)

  const handleAnswer = (correct) => {
    if (correct) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Kuis</h1>
      <div className="mt-4">
        <p>Soal: Berapa 2+2?</p>
        <button onClick={() => handleAnswer(false)} className="bg-gray-200 p-2 m-2">3</button>
        <button onClick={() => handleAnswer(true)} className="bg-gray-200 p-2 m-2">4</button>
        <button onClick={() => handleAnswer(false)} className="bg-gray-200 p-2 m-2">5</button>
      </div>
      <ConfettiEffect active={showConfetti} />
    </div>
  )
}