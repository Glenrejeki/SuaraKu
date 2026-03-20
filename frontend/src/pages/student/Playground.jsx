import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useAI } from '../../hooks/useAI';
import VoiceButton from '../../components/VoiceButton';

const Playground = () => {
  const { profile } = useAuthStore();
  const { speak } = useVoice();
  const { askTutor } = useAI();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const playgroundCommands = {
    'CLEAR': ['hapus semua', 'bersihkan chat', 'mulai baru'],
    'BACK': ['kembali', 'keluar', 'ke dashboard'],
    'ASK': ['tanya', 'jelaskan', 'apa itu', 'bagaimana'],
  };

  useEffect(() => {
    const welcome = "Halo! Ini Ruang Bermain SuaraKu. Kamu bisa tanya apa saja padaku lewat suara. Mau ngobrol apa hari ini?";
    speak(welcome);
    setMessages([{ role: 'ai', text: welcome, id: Date.now() }]);
  }, [speak]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAskAI = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', text, id: Date.now() };
    setMessages(prev => [...prev, userMessage]);

    setIsTyping(true);
    try {
      const answer = await askTutor(text);
      const aiMessage = { role: 'ai', text: answer, id: Date.now() + 1 };
      setMessages(prev => [...prev, aiMessage]);
      speak(answer);
    } catch (err) {
      speak("Maaf, otak aku lagi loading. Bisa tanya lagi?");
    } finally {
      setIsTyping(false);
    }
  };

  const handleCommand = (command, transcript) => {
    if (command === 'BACK') window.history.back();
    if (command === 'CLEAR') setMessages([]);
    if (command === 'ASK' || !command) {
      handleAskAI(transcript);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col pb-32">
      {/* Stars Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-20 animate-pulse"
            style={{
              width: Math.random() * 4 + 'px',
              height: Math.random() * 4 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's'
            }}
          />
        ))}
      </div>

      <header className="p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">Ruang Bermain</h1>
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">AI Tutor Aktif</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-500/30">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black text-green-400 uppercase">Sistem Stabil</span>
        </div>
      </header>

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth relative z-10"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[85%] p-5 rounded-[2rem] font-bold text-lg leading-relaxed shadow-lg
                ${msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 rounded-tl-none border-b-4 border-slate-200'
                }
              `}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white/10 p-4 rounded-3xl flex gap-1">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-200" />
            </div>
          </motion.div>
        )}
      </main>

      <footer className="p-6 text-center text-white/40 text-[10px] relative z-10">
        <p>© 2025 SuaraKu. Developed by Christian Johannes Hutahaean & Glen Rejeki Sitorus</p>
      </footer>

      <VoiceButton
        commands={playgroundCommands}
        onCommandMatch={handleCommand}
        customText="Tanya apa saja padaku..."
      />
    </div>
  );
};

export default Playground;
