import { useState, useCallback, useRef } from 'react'

export function useVoice() {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  const speak = useCallback((text) => {
    if (!text) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'id-ID'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }, [])

  const readPage = useCallback(() => {
    const elements = document.querySelectorAll('h1, h2, h3, p, button, label, li, [role="button"]');
    let fullText = "";
    elements.forEach(el => {
      if (el.innerText) {
        fullText += el.innerText + ". ";
      }
    });
    speak(fullText);
  }, [speak]);

  const startListening = useCallback((onResult) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Browser tidak mendukung Speech Recognition')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognition()
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
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [])

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
    speak,
    readPage
  }
}
