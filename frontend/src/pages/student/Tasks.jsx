import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import VoiceButton from '../../components/VoiceButton';
import StudentSidebar from '../../components/StudentSidebar';

const StudentTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollKey, setEnrollKey] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [error, setError] = useState('');
  const { profile } = useAuthStore();
  const { speak } = useVoice();
  const navigate = useNavigate();

  const taskCommands = {
    'BACK': ['kembali', 'ke dashboard', 'balik'],
    'OPEN_TASK': ['buka tugas', 'kerjakan tugas', 'pilih tugas'],
    'SEARCH': ['cari tugas', 'masukkan id', 'temukan'],
  };

  useEffect(() => {
    fetchTasks();
    speak("Halaman Tugas. Berikut adalah daftar tugas yang harus kamu kerjakan.");
  }, [speak]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assignments')
      .select('*, modules(title)')
      .or(`is_public.eq.true,exists(select 1 from submissions where assignment_id=assignments.id and student_id=${profile.id})`)
      .order('deadline', { ascending: true });

    if (data) setTasks(data);
    setLoading(false);
  };

  const handleSearchTask = async () => {
    if (!searchId || searchId.length < 6) return;
    setSearching(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, modules(title)')
        .eq('short_id', searchId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // If task found, check if it's already in the list
        if (!tasks.find(t => t.id === data.id)) {
           setTasks(prev => [data, ...prev]);
        }
        speak(`Misi ditemukan: ${data.title}. Silakan buka untuk memulai.`);
        setSearchId('');
      } else {
        setError('ID Kursus tidak ditemukan.');
        speak('ID Kursus tidak ditemukan.');
      }
    } catch (err) {
      setError('Gagal mencari tugas.');
    } finally {
      setSearching(false);
    }
  };

  const handleTaskClick = async (task) => {
    if (task.is_public === false) {
      const { data: sub } = await supabase
        .from('submissions')
        .select('id')
        .eq('assignment_id', task.id)
        .eq('student_id', profile.id)
        .maybeSingle();

      if (sub) {
        navigate(`/student/task/${task.id}`);
      } else {
        setSelectedTaskId(task.id);
        setShowEnrollModal(true);
      }
    } else {
      navigate(`/student/task/${task.id}`);
    }
  };

  const handleEnroll = async () => {
    setError('');
    const { data: task, error: fetchErr } = await supabase
      .from('assignments')
      .select('enroll_key')
      .eq('id', selectedTaskId)
      .single();

    if (task && task.enroll_key === enrollKey) {
      navigate(`/student/task/${selectedTaskId}`);
    } else {
      setError('Kunci Enroll salah!');
      speak('Kunci masuk salah.');
    }
  };

  const handleCommand = (command, transcript) => {
    if (command === 'BACK') navigate('/student/dashboard');
    if (command === 'OPEN_TASK') {
      const found = tasks.find(t => transcript.toLowerCase().includes(t.title.toLowerCase()));
      if (found) handleTaskClick(found);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100 pb-12">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto custom-scrollbar h-screen flex flex-col">
        <div className="flex-1">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Tugas Saya</h2>
              <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-[0.2em]">Selesaikan tugas tepat waktu untuk mendapatkan XP!</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
               <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    value={searchId}
                    onChange={e => setSearchId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Masukkan 6 Digit ID Kursus..."
                    className="w-full pl-6 pr-14 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  />
                  <button
                    onClick={handleSearchTask}
                    disabled={searching || searchId.length < 6}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </button>
               </div>
               <div className="px-5 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3 whitespace-nowrap">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tasks.length} Tugas Tersedia</span>
               </div>
            </div>
          </header>

          {error && <p className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-rose-100">{error}</p>}

          <div className="max-w-5xl space-y-6">
            {loading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse" />)}
              </div>
            ) : tasks.length > 0 ? (
              <div className="grid gap-6">
                <AnimatePresence>
                  {tasks.map((task, idx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -4 }}
                      onClick={() => handleTaskClick(task)}
                      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer group hover:border-indigo-200 transition-all duration-300"
                    >
                      <div className="flex items-center gap-8">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl group-hover:rotate-6 transition-transform duration-300">
                          📝
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{task.title}</h3>
                            {task.is_public === false && <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black uppercase rounded">Private</span>}
                          </div>
                          <div className="flex flex-wrap gap-4 items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                              {task.modules?.title || 'Materi Umum'}
                            </span>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                              ⏱️ {task.duration_minutes || '30'} Menit
                            </span>
                            {task.short_id && (
                              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full">
                                ID: {task.short_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mb-1">Batas Waktu</p>
                          <p className="text-sm font-black text-rose-500 uppercase">
                            {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-105 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[4rem] border border-slate-100 shadow-sm border-dashed">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8">🎉</div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Cari Misi</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Masukkan ID Kursus dari gurumu untuk memulai petualangan baru.</p>
              </div>
            )}
          </div>
        </div>

        {/* Enroll Key Modal */}
        <AnimatePresence>
          {showEnrollModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEnrollModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full space-y-8">
                  <div className="text-center">
                     <span className="text-4xl block mb-4">🔐</span>
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Misi Terkunci</h3>
                     <p className="text-slate-500 font-bold text-xs mt-2 uppercase">Masukkan Enroll Key untuk memulai misi ini.</p>
                  </div>
                  <div className="space-y-4">
                     {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase">{error}</p>}
                     <input
                       type="text"
                       value={enrollKey}
                       onChange={e => setEnrollKey(e.target.value)}
                       placeholder="Kunci Masuk..."
                       className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-center text-slate-900 outline-none focus:border-indigo-500 transition-all"
                     />
                  </div>
                  <button
                    onClick={handleEnroll}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Buka Misi Sekarang
                  </button>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="mt-24 py-10 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-80">
            @2026 Suaraku.Developed oleh Christian Johannes Hutahaean Dan Glen Rejeki Sitorus
          </p>
        </footer>
      </main>

      <div className="fixed bottom-8 right-8 z-50">
        <VoiceButton commands={taskCommands} onCommandMatch={handleCommand} />
      </div>
    </div>
  );
};

export default StudentTasks;
