import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useAI } from '../../hooks/useAI';
import VoiceButton from '../../components/VoiceButton';
import StudentSidebar from '../../components/StudentSidebar';
import BintangAvatar from '../../components/BintangAvatar';

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const VolumeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);

const Playground = () => {
  const { profile } = useAuthStore();
  const { speak, isSpeaking } = useVoice();
  const { askTutor } = useAI();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const [speechRate, setSpeechRate] = useState(0.9);
  const [avatarState, setAvatarState] = useState('idle');
  const scrollRef = useRef(null);

  const isTunanetra = profile?.disability_type === 'tunanetra';
  const isTunarungu = profile?.disability_type === 'tunarungu';
  const isTunawicara = profile?.disability_type === 'tunawicara';

  useEffect(() => {
    if (isSpeaking) setAvatarState('speaking');
    else if (isTyping) setAvatarState('thinking');
    else setAvatarState('idle');
  }, [isSpeaking, isTyping]);

  const playgroundCommands = {
    'CLEAR': ['hapus semua', 'bersihkan chat', 'mulai baru'],
    'BACK': ['kembali', 'keluar', 'ke dashboard'],
    'ASK': ['tanya', 'jelaskan', 'apa itu', 'bagaimana'],
    'REPEAT': ['ulangi jawaban', 'baca lagi', 'ulang'],
    'SLOWER': ['lebih pelan', 'perlambat', 'jangan cepat-cepat'],
  };

  useEffect(() => {
    const welcome = isTunanetra
      ? "Halo! Ini Ruang Bermain SuaraKu. Sebutkan pertanyaanmu sekarang, aku siap membantu."
      : isTunarungu
      ? "Halo! Selamat datang di Tanya AI. Silakan ketik pertanyaanmu di sini."
      : "Halo! Pilih simbol di papan untuk bertanya padaku.";

    if (!isTunarungu) speak(welcome);
    setMessages([{ role: 'ai', text: welcome, id: Date.now(), type: 'text' }]);
  }, [speak, isTunanetra, isTunarungu]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAskAI = async (text) => {
    const query = typeof text === 'string' ? text : input;
    if (!query || !query.trim()) return;

    const userMessage = { role: 'user', text: query, id: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setIsTyping(true);
    try {
      const response = await askTutor(query);
      const answer = response.answer;

      setMessages(prev => [...prev, { role: 'ai', text: answer, id: Date.now() + 1 }]);

      if (!isTunarungu) {
        speak(answer, speechRate);
      }
      setAvatarState('happy');
      setTimeout(() => setAvatarState('idle'), 2000);

    } catch (err) {
      console.error("AI Error:", err);
      let errMsg = "Maaf, otak aku lagi loading. Bisa tanya lagi sebentar lagi?";
      setMessages(prev => [...prev, { role: 'ai', text: errMsg, id: Date.now() + 2 }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCommand = (command, transcript) => {
    if (command === 'BACK') navigate('/student/dashboard');
    if (command === 'CLEAR') setMessages([]);
    if (command === 'REPEAT') {
        const lastAI = [...messages].reverse().find(m => m.role === 'ai');
        if (lastAI) speak(lastAI.text, speechRate);
    }
    if (command === 'SLOWER') {
        setSpeechRate(prev => Math.max(0.5, prev - 0.2));
        speak("Baik, aku akan bicara lebih pelan.", speechRate - 0.2);
    }
    if (command === 'ASK' || !command) {
      handleAskAI(transcript);
    }
  };

  const aacSymbols = [
    { label: 'Apa ini?', icon: '❓', q: 'Bisa jelaskan apa ini?' },
    { label: 'Bantu aku', icon: '🆘', q: 'Aku butuh bantuan belajar' },
    { label: 'Matematika', icon: '🔢', q: 'Ajarkan aku matematika' },
    { label: 'Cerita', icon: '📖', q: 'Ceritakan sebuah dongeng edukasi' },
    { label: 'Senang', icon: '😊', q: 'Aku sedang senang hari ini' },
    { label: 'Bingung', icon: '😕', q: 'Aku bingung, tolong jelaskan pelan-pelan' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      <StudentSidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - Fixed to remove card around avatar */}
        <header className="px-8 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
             <BintangAvatar state={avatarState} size="sm" />
            <div>
               <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Tanya Kak SuaraKu</h1>
               <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full animate-pulse ${avatarState === 'thinking' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   {avatarState === 'thinking' ? 'Sedang Berpikir...' : avatarState === 'speaking' ? 'Sedang Berbicara...' : 'Online'}
                 </span>
               </div>
            </div>
          </div>

          <div className="flex gap-2">
             <button
               onClick={() => setMessages([])}
               className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
               aria-label="Hapus Percakapan"
             >
               <TrashIcon />
             </button>
             <div className="h-8 w-[1px] bg-slate-200 mx-1" />
             <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Mode {profile?.disability_type?.replace('_', ' ')}</span>
             </div>
          </div>
        </header>

        {/* AAC Symbols for Tunawicara */}
        {isTunawicara && (
           <div className="bg-white border-b border-slate-100 p-4 flex gap-3 overflow-x-auto no-scrollbar shadow-sm">
              {aacSymbols.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleAskAI(s.q)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-indigo-600 hover:bg-white transition-all w-24 group"
                >
                   <span className="text-2xl group-hover:scale-110 transition-transform">{s.icon}</span>
                   <span className="text-[9px] font-black text-slate-500 uppercase text-center leading-tight">{s.label}</span>
                </button>
              ))}
           </div>
        )}

        {/* Chat Area with Avatar in Background */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC] custom-scrollbar relative">
          {/* Large Interactive Avatar in Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
             <BintangAvatar state={avatarState} size="xl" />
          </div>

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3 relative z-10`}
              >
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shrink-0 mb-1 shadow-md border border-white/20">
                    <span className="text-xs font-black text-white tracking-tighter">S</span>
                  </div>
                )}

                <div className={`
                  max-w-[75%] space-y-2
                  ${msg.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}
                `}>
                   <div className={`
                      px-6 py-4 rounded-[2rem] font-bold leading-relaxed shadow-sm text-sm
                      ${msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                      }
                   `}>
                      {msg.text}
                   </div>

                   {msg.role === 'ai' && !isTunarungu && (
                     <button
                       onClick={() => speak(msg.text, speechRate)}
                       className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-sm"
                       aria-label="Baca Pesan"
                     >
                       <VolumeIcon size={16} />
                     </button>
                   )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-end gap-3 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shrink-0 mb-1 shadow-md border border-white/20">
                <span className="text-[10px] font-black text-white animate-pulse">...</span>
              </div>
              <div className="bg-white px-6 py-4 rounded-[2rem] rounded-bl-none border border-slate-100 flex gap-1.5 shadow-sm">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300" />
              </div>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] relative z-20">
           <div className="max-w-4xl mx-auto flex items-center gap-3">
             <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanyakan sesuatu pada Kak SuaraKu..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAskAI();
                    }
                  }}
                  className="w-full pl-6 pr-14 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
                  aria-label="Ketik pertanyaan untuk AI"
                />
                <button
                  onClick={() => handleAskAI()}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-3 p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                  aria-label="Kirim Pesan"
                >
                  <SendIcon />
                </button>
             </div>

             <div className="h-10 w-[1px] bg-slate-200 mx-1" />

             <VoiceButton
               commands={playgroundCommands}
               onCommandMatch={handleCommand}
               customText={isTunanetra ? "Sebutkan pertanyaanmu..." : ""}
             />
           </div>
           <p className="text-center text-[9px] font-black text-slate-400 mt-4 uppercase tracking-[0.2em] opacity-60">
              Kak SuaraKu adalah asisten AI. Mohon dampingi anak saat belajar.
           </p>
        </div>
      </main>
    </div>
  );
};

export default Playground;
