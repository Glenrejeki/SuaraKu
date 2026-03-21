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
  const { summarize } = useAI();
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  const moduleCommands = {
    'READ_ALL': ['baca semua', 'bacakan daftar', 'ada modul apa'],
    'SELECT_MODULE': ['buka modul', 'pilih modul', 'baca modul'],
    'BACK': ['kembali', 'balik', 'ke dashboard'],
    'SUMMARIZE': ['ringkas', 'ringkaskan', 'intinya apa'],
  };

  useEffect(() => {
    fetchModules();
    speak("Halaman Modul. Pilih materi yang ingin kamu pelajari.");
  }, [speak]);

  const fetchModules = async () => {
    setLoading(true);
    const { data } = await supabase.from('modules').select('*').order('created_at', { ascending: false });
    if (data) setModules(data);
    setLoading(false);
  };

  const handleSummarize = async () => {
    if (!selectedModule) return;

    if (selectedModule.summary) {
      setAiResult(selectedModule.summary);
      speak("Ini adalah ringkasan materinya.");
      return;
    }

    setAiLoading(true);
    setAiResult('');
    try {
      const summaryResult = await summarize(selectedModule.content);
      setAiResult(summaryResult);

      await supabase
        .from('modules')
        .update({ summary: summaryResult })
        .eq('id', selectedModule.id);

      setSelectedModule({ ...selectedModule, summary: summaryResult });

      speak("Kak SuaraKu sudah merangkum materinya untukmu.");
    } catch (err) {
      speak("Maaf, Kak SuaraKu sedang lelah. Coba lagi nanti ya.");
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
        setAiResult(found.summary || '');
        speak(`Membuka modul ${found.title}.`);
      }
    }
    if (command === 'SUMMARIZE' && selectedModule) handleSummarize();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100 pb-12">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto custom-scrollbar h-screen">
        <header className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Materi Pelajaran</h2>
          <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-[0.2em]">Pilih modul untuk mulai membaca dan gunakan AI untuk merangkum.</p>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-4">Daftar Modul</h3>
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-3xl border border-slate-100 animate-pulse" />)
              ) : (
                modules.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModule(m);
                      setAiResult(m.summary || '');
                      speak(`Membuka ${m.title}`);
                    }}
                    className={`w-full text-left p-6 rounded-[2.5rem] border-2 transition-all duration-300 group ${
                      selectedModule?.id === m.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'bg-white border-slate-50 text-slate-700 hover:border-indigo-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-colors ${selectedModule?.id === m.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black tracking-tight truncate text-sm">{m.title}</p>
                        <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${selectedModule?.id === m.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                           {m.content?.length || 0} Karakter
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

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
                  <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight flex-1 uppercase">{selectedModule.title}</h2>
                      <button
                        onClick={handleSummarize}
                        disabled={aiLoading}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                      >
                        {aiLoading ? '🔄 Meringkas...' : '✨ Ringkas AI'}
                      </button>
                    </div>

                    <div className="prose prose-indigo max-w-none text-slate-600 font-bold leading-relaxed whitespace-pre-wrap h-[400px] overflow-y-auto pr-4 custom-scrollbar text-sm">
                      {selectedModule.content}
                    </div>

                    {selectedModule.pdf_url && (
                      <div className="mt-8 pt-8 border-t border-slate-50">
                        <a
                          href={selectedModule.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-black text-indigo-600 hover:underline flex items-center gap-2 uppercase tracking-widest"
                        >
                          📥 Lihat Dokumen Asli
                        </a>
                      </div>
                    )}
                  </div>

                  {(aiLoading || aiResult) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">🤖</div>
                          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Ringkasan Kak SuaraKu</h3>
                        </div>

                        {aiLoading ? (
                          <AILoadingSkeleton />
                        ) : (
                          <div className="text-base font-bold leading-relaxed whitespace-pre-wrap italic">
                            {aiResult}
                          </div>
                        )}
                      </div>
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[4rem] border border-slate-100 shadow-sm border-dashed">
                  <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8">📖</div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pilih Modul</h3>
                  <p className="text-slate-400 font-bold mt-2 max-w-xs mx-auto text-xs uppercase tracking-widest">Klik salah satu judul di samping untuk mulai belajar.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <footer className="mt-24 py-10 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-80">
            @2026 SuaraKu.Developed oleh Christian Johannes Hutahaean Dan Glen Rejeki Sitorus
          </p>
        </footer>
      </main>

      <div className="fixed bottom-8 right-8 z-50">
        <VoiceButton commands={moduleCommands} onCommandMatch={handleCommand} />
      </div>
    </div>
  );
};

export default StudentModules;
