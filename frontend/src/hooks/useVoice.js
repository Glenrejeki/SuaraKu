export function useVoice() {
  const startListening = () => {
    const recognition = new window.webkitSpeechRecognition()
    recognition.lang = 'id-ID'
    recognition.start()
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      console.log('Transcript:', transcript)
    }
  }

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'id-ID'
    window.speechSynthesis.speak(utterance)
  }

  return { startListening, speak }
}