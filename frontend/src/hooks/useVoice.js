import { useState, useCallback, useRef } from 'react'

export function useVoice() {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  const speak = useCallback((text) => {
    if (!text) return
    window.speechSynthesis.cancel() // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'id-ID'
    utterance.rate = 0.9 // Slightly slower for accessibility
    window.speechSynthesis.speak(utterance)
  }, [])

  const startListening = useCallback((onResult) => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Browser tidak mendukung Speech Recognition')
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new window.webkitSpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'id-ID'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setIsListening(false)
      if (onResult) onResult(transcript)
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      setError(event.error)
      if (event.error === 'no-speech') {
        speak('Maaf, tidak terdengar. Coba ucapkan lagi.')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [speak])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  return {
    isListening,
    isProcessing,
    setIsProcessing,
    error,
    startListening,
    stopListening,
    speak
  }
}
