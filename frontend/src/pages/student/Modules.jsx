import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useAI } from '../../hooks/useAI';
import VoiceButton from '../../components/VoiceButton';
import StudentSidebar from '../../components/StudentSidebar';
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
    speak("Halaman Modul. Di sini kamu bisa membaca materi pelajaran.");
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
      setAiResult({ type: 'Ringkasan AI', text: summary });
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
      setAiResult({ type: 'Bahasa Sederhana', text: simplified });
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
        speak(`Membuka modul ${found.title}.`);
      }
    }
    if (command === 'SUMMARIZE' && selectedModule) handleSummarize(selectedModule);
    if (command === 'SIMPLIFY' && selectedModule) handleSimplify(selectedModule);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
        <header className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Materi Modul</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Pelajari berbagai materi menarik dengan bantuan AI.</p>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Module List */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2 mb-4">Daftar Modul</h3>
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)
              ) : (
                modules.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModule(m);
                      setAiResult({ type: null, text: '' });
                      speak(`Membuka ${m.title}`);
                    }}
                    className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 group ${
                      selectedModule?.id === m.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'bg-white border-slate-50 text-slate-700 hover:border-indigo-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${selectedModule?.id === m.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                        📚
                      </div>
                      <div>
                        <p className="font-bold tracking-tight">{m.title}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selectedModule?.id === m.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                          Modul Pembelajaran
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Module Content */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedModule ? (
                <motion.div
                  key={selectedModule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">{selectedModule.title}</h2>
                    <div className="prose prose-indigo max-w-none text-slate-600 font-medium leading-relaxed">
                      {selectedModule.content}
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-50 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleSummarize(selectedModule)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                      >
                        <span className="text-lg">✨</span> Ringkas AI
                      </button>
                      <button
                        onClick={() => handleSimplify(selectedModule)}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                      >
                        <span className="text-lg">🌱</span> Bahasa Sederhana
                      </button>
                    </div>
                  </div>

                  {aiLoading && (
                    <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <AILoadingSkeleton />
                    </div>
                  )}

                  {aiResult.text && !aiLoading && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-indigo-600 p-8 md:p-10 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">🤖</div>
                          <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">{aiResult.type}</h3>
                        </div>
                        <p className="text-lg font-medium leading-relaxed">{aiResult.text}</p>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm border-dashed">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">👈</div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Pilih Modul</h3>
                  <p className="text-slate-400 font-medium mt-2 max-w-xs mx-auto">Klik salah satu modul di samping untuk mulai membaca materi.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <footer className="mt-20 pt-10 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] mb-4">&copy; 2025 SuaraKu Platform</p>
        </footer>
      </main>

      <VoiceButton commands={moduleCommands} onCommandMatch={handleCommand} />
    </div>
  );
};

export default StudentModules;
