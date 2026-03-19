import React, { useState } from 'react'
import VoiceButton from '../../components/VoiceButton/VoiceButton'
import { useAI } from '../../hooks/useAI'

export default function Playground() {
  const { askTutor } = useAI()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const handleSend = async () => {
    const answer = await askTutor(input)
    setMessages([...messages, { user: input, ai: answer }])
    setInput('')
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Ruang Bermain</h1>
      <div className="mt-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i}>
            <p className="bg-blue-100 p-2 rounded">Kamu: {msg.user}</p>
            <p className="bg-green-100 p-2 rounded mt-1">AI: {msg.ai}</p>
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border p-2 w-full mt-4"
        placeholder="Tanya sesuatu..."
      />
      <button onClick={handleSend} className="bg-primary text-white p-2 rounded mt-2">
        Kirim
      </button>
      <VoiceButton />
    </div>
  )
}