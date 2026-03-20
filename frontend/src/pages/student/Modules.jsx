import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useAI } from '../../hooks/useAI';
import VoiceButton from '../../components/VoiceButton';
import AILoadingSkeleton from '../../components/AILoadingSkeleton';

const StudentModules = () => {
  const { profile } = useAuthStore();
  const { speak } = useVoice();
  const { summarize, simplify } = useAI();
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState({ type: null, text: '' });

  const moduleCommands = {
    'READ_ALL': ['baca semua', 'bacakan daftar', 'ada modul apa'],
    'SELECT_MODULE': ['buka modul', 'pilih modul', 'baca modul'],
    'BACK': ['kembali', 'balik', 'ke dashboard'],
    'SUMMARIZE': ['ringkas', 'ringkaskan', 'intinya apa'],
    'SIMPLIFY': ['jelaskan lebih mudah', 'sederhanakan', 'bahasa gampang'],
  };

  useEffect(() => {
    fetchModules();
    speak("Halaman Modul. Di sini kamu bisa membaca materi pelajaran. Ucapkan nama modul untuk membukanya.");
  }, [speak]);

  const fetchModules = async () => {
    setLoading(true);
    const { data } = await supabase.from('modules').select('*');
    if (data) setModules(data);
    setLoading(false);
  };

  const handleSummarize = async (module) => {
    setAiLoading(true);
    try {
      const summary = await summarize(module.content);
      setAiResult({ type: 'Ringkasan', text: summary });
      speak("Ini adalah ringkasan materinya: " + summary);
    } catch (err) {
      speak("Maaf, AI sedang sibuk. Coba lagi nanti.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSimplify = async (module) => {
    setAiLoading(true);
    try {
      const simplified = await simplify(module.content);
      setAiResult({ type: 'Penjelasan Sederhana', text: simplified });
      speak("Ini penjelasan yang lebih mudah: " + simplified);
    } catch (err) {
      speak("Gagal menyederhanakan teks.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCommand = (command, transcript) => {
    if (command === 'BACK') window.history.back();
    if (command === 'SELECT_MODULE') {
      const found = modules.find(m => transcript.toLowerCase().includes(m.title.toLowerCase()));
      if (found) {
        setSelectedModule(found);
        speak(`Membuka modul ${found.title}. Kamu mau aku ringkaskan atau jelaskan lebih mudah?`);
      }
    }
    if (command === 'SUMMARIZE' && selectedModule) handleSummarize(selectedModule);
    if (command === 'SIMPLIFY' && selectedModule) handleSimplify(selectedModule);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="bg-white border-b border-slate-100 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => window.history.back()} className="text-slate-400 hover:text-purple-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Materi Pelajaran</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Module List */}
          <div className="md:col-span-1 space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Daftar Modul</h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-3xl animate-pulse" />)}
              </div>
            ) : (
              modules.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedModule(m);
                    setAiResult({ type: null, text: '' });
                    speak(`Membuka ${m.title}`);
                  }}
                  className={`w-full text-left p-5 rounded-3xl border-2 transition-all ${selectedModule?.id === m.id ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-700 hover:border-purple-200 shadow-sm'}`}
                >
                  <p className="font-bold">{m.title}</p>
                  <p className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${selectedModule?.id === m.id ? 'text-purple-200' : 'text-slate-400'}`}>Tersedia via AI</p>
                </button>
              ))
            )}
          </div>

          {/* Module Content */}
          <div className="md:col-span-2">
            <AnimatePresence mode="wait">
              {selectedModule ? (
                <motion.div
                  key={selectedModule.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <span className="text-4xl opacity-10 grayscale">📚</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-6">{selectedModule.title}</h2>
                    <div className="prose prose-purple max-w-none text-slate-600 font-medium leading-relaxed">
                      {selectedModule.content}
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-50 flex flex-wrap gap-4">
                      <button
                        onClick={() => handleSummarize(selectedModule)}
                        className="px-6 py-3 bg-purple-50 text-purple-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-100 transition-colors"
                      >
                        ✨ Ringkas dengan AI
                      </button>
                      <button
                        onClick={() => handleSimplify(selectedModule)}
                        className="px-6 py-3 bg-green-50 text-green-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-100 transition-colors"
                      >
                        🌱 Jelaskan Lebih Mudah
                      </button>
                    </div>
                  </div>

                  {aiLoading && <AILoadingSkeleton />}

                  {aiResult.text && !aiLoading && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-[2.5rem] border border-purple-100 shadow-inner"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xl">🤖</div>
                        <h3 className="text-sm font-black text-purple-700 uppercase tracking-widest">{aiResult.type}</h3>
                      </div>
                      <p className="text-lg text-slate-700 font-bold leading-relaxed">{aiResult.text}</p>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 opacity-50">
                  <span className="text-6xl mb-6">👈</span>
                  <p className="text-xl font-bold text-slate-400 italic">Pilih modul di sebelah kiri untuk mulai belajar</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-400 text-sm">
        <p>© 2025 SuaraKu. Developed by Christian Johannes Hutahaean & Glen Rejeki Sitorus</p>
      </footer>

      <VoiceButton commands={moduleCommands} onCommandMatch={handleCommand} />
    </div>
  );
};

export default StudentModules;
