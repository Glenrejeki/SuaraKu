import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useAI } from '../../hooks/useAI';
import VoiceButton from '../../components/VoiceButton';
import StudentSidebar from '../../components/StudentSidebar';

const Playground = () => {
  const { profile } = useAuthStore();
  const { speak } = useVoice();
  const { askTutor } = useAI();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const playgroundCommands = {
    'CLEAR': ['hapus semua', 'bersihkan chat', 'mulai baru'],
    'BACK': ['kembali', 'keluar', 'ke dashboard'],
    'ASK': ['tanya', 'jelaskan', 'apa itu', 'bagaimana'],
  };

  useEffect(() => {
    const welcome = "Halo! Ini Ruang Bermain SuaraKu. Kamu bisa tanya apa saja padaku.";
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
    if (command === 'BACK') navigate('/student/dashboard');
    if (command === 'CLEAR') setMessages([]);
    if (command === 'ASK' || !command) {
      handleAskAI(transcript);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100">
      <StudentSidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="px-10 py-6 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-indigo-100">
               🤖
            </div>
            <div>
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tanya AI</h1>
               <p className="text-slate-500 font-medium text-xs mt-1">Teman belajar cerdasmu siap membantu.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">AI Tutor Aktif</span>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[75%] p-6 rounded-3xl font-medium text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }
                `}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-1 shadow-sm">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200" />
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-8 bg-white border-t border-slate-100">
           <div className="max-w-4xl mx-auto">
             <VoiceButton
               commands={playgroundCommands}
               onCommandMatch={handleCommand}
               customText="Tanya apa saja padaku lewat suara..."
             />
           </div>
        </div>
      </main>
    </div>
  );
};

export default Playground;
