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
  const { profile } = useAuthStore();
  const { speak } = useVoice();
  const navigate = useNavigate();

  const taskCommands = {
    'BACK': ['kembali', 'ke dashboard', 'balik'],
    'OPEN_TASK': ['buka tugas', 'kerjakan tugas', 'pilih tugas'],
    'CHECK_DEADLINE': ['kapan deadline', 'batas waktu'],
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
      .order('deadline', { ascending: true });

    if (data) setTasks(data);
    setLoading(false);
  };

  const handleCommand = (command, transcript) => {
    if (command === 'BACK') navigate('/student/dashboard');
    if (command === 'OPEN_TASK') {
      const found = tasks.find(t => transcript.toLowerCase().includes(t.title.toLowerCase()));
      if (found) navigate(`/student/task/${found.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Tugas Saya</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Selesaikan tugas tepat waktu untuk mendapatkan XP!</p>
          </div>
          <div className="px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tasks.length} Tugas Tersedia</span>
          </div>
        </header>

        <div className="max-w-5xl">
          {loading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 animate-pulse" />)}
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
                    onClick={() => navigate(`/student/task/${task.id}`)}
                    className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer group hover:border-indigo-200 transition-all duration-300"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                        📝
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">{task.title}</h3>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {task.modules?.title || 'Materi Umum'}
                          </span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                            {task.duration_minutes || '30'} Menit
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Batas Waktu</p>
                        <p className="text-sm font-bold text-rose-500">
                          {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm border-dashed">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Semua Tugas Selesai!</h3>
              <p className="text-slate-400 font-medium">Kamu sudah mengerjakan semua tugas dengan luar biasa.</p>
            </div>
          )}
        </div>

        <footer className="mt-20 pt-10 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] mb-4">&copy; 2025 SuaraKu Platform</p>
        </footer>
      </main>

      <VoiceButton commands={taskCommands} onCommandMatch={handleCommand} />
    </div>
  );
};

export default StudentTasks;
