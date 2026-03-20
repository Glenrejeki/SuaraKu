import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import VoiceButton from '../../components/VoiceButton';

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
    speak("Halaman Tugas. Berikut adalah daftar tugas yang harus kamu kerjakan. Ucapkan nama tugas untuk membukanya.");
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
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="bg-white border-b border-slate-100 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/student/dashboard')} className="text-slate-400 hover:text-purple-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Daftar Tugas</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-[2rem] animate-pulse" />)}
          </div>
        ) : tasks.length > 0 ? (
          <div className="grid gap-6">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/student/task/${task.id}`)}
                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer group"
              >
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center text-3xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    📝
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">{task.title}</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                      {task.modules?.title || 'Materi Umum'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {task.description?.slice(0, 50)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="px-5 py-2 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                    <p className="text-[10px] font-black uppercase tracking-tighter opacity-60">Batas Waktu</p>
                    <p className="text-sm font-black">{new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</p>
                  </div>
                  <button className="text-purple-600 font-black text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                    Mulai Kerjakan →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <span className="text-6xl mb-6 block">🎉</span>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Semua Tugas Selesai!</h3>
            <p className="text-slate-400 font-bold">Kamu sudah mengerjakan semua tugas dengan hebat.</p>
          </div>
        )}
      </main>

      <VoiceButton commands={taskCommands} onCommandMatch={handleCommand} />
    </div>
  );
};

export default StudentTasks;
