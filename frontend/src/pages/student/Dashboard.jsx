import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useNavigate, Link } from 'react-router-dom';
import XPBar from '../../components/XPBar';
import StreakBadge from '../../components/StreakBadge';
import VoiceButton from '../../components/VoiceButton';
import StudentSidebar from '../../components/StudentSidebar';
import { supabase } from '../../lib/supabase';

const StudentDashboard = () => {
  const { profile } = useAuthStore();
  const { speak } = useVoice();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  const dashboardCommands = {
    'GO_TASKS': ['buka tugas', 'lihat tugas', 'cek pr', 'tugas saya', 'tugas apa'],
    'GO_MODULES': ['buka modul', 'baca materi', 'belajar', 'materi'],
    'GO_PLAYGROUND': ['buka ruang bermain', 'mau ngobrol', 'tanya ai', 'playground'],
    'GO_PROFILE': ['buka profil', 'pengaturan', 'akun saya', 'profil'],
    'LOGOUT': ['keluar', 'logout', 'ganti akun'],
  };

  useEffect(() => {
    fetchTasks();
  }, [profile]);

  useEffect(() => {
    if (!loading) {
      const hr = new Date().getHours();
      const timeGreeting = hr < 12 ? 'Selamat Pagi' : hr < 18 ? 'Selamat Siang' : 'Selamat Malam';
      const firstName = profile?.full_name?.split(' ')[0] || 'Teman';

      let taskNotification = "";
      if (tasks.length > 0) {
        taskNotification = ` Kamu memiliki ${tasks.length} tugas yang perlu dikerjakan.`;
      } else {
        taskNotification = " Kamu sudah menyelesaikan semua tugas. Hebat!";
      }

      const finalGreeting = `${timeGreeting}, ${firstName}!${taskNotification}`;
      setGreeting(`${timeGreeting}, ${firstName}!`);

      const timer = setTimeout(() => speak(finalGreeting), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, tasks, profile, speak]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('assignments')
        .select('*, modules(title)')
        .order('deadline', { ascending: true })
        .limit(3);
      if (data) setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommand = (command) => {
    switch (command) {
      case 'GO_TASKS': navigate('/student/tasks'); break;
      case 'GO_MODULES': navigate('/student/modules'); break;
      case 'GO_PLAYGROUND': navigate('/student/playground'); break;
      case 'GO_PROFILE': navigate('/profile'); break;
      case 'LOGOUT': /* handle logout */ break;
      default: break;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100">
      <StudentSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
        <header className="flex lg:hidden justify-between items-center mb-8">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Suara<span className="text-indigo-600">Ku</span></span>
          </div>
           <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
              {profile?.full_name?.[0]}
           </button>
        </header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto space-y-10"
        >
          {/* Hero Section */}
          <motion.section
            variants={itemVariants}
            className="relative p-10 rounded-3xl bg-slate-900 text-white shadow-2xl shadow-slate-200 overflow-hidden"
          >
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-6">
                🔥 {profile?.streak || 0} Hari Semangat
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{greeting}</h2>
              <p className="text-slate-400 text-lg max-w-lg mb-8">
                Siap untuk petualangan belajar hari ini? Kumpulkan lebih banyak XP dan jadilah juara!
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/student/tasks')}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                >
                  Mulai Belajar
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <button
                  onClick={() => speak(greeting)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all"
                >
                  🔊
                </button>
              </div>
            </div>
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </motion.section>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              {/* Stats Grid */}
              <div className="grid sm:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level & XP</span>
                    <span className="text-xl">🎖️</span>
                  </div>
                  <XPBar current={profile?.xp || 0} nextLevel={1000} level={Math.floor((profile?.xp || 0) / 1000) + 1} />
                </motion.div>
                <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Streak Belajar</span>
                    <span className="text-xl">🔥</span>
                  </div>
                  <StreakBadge days={profile?.streak || 0} />
                </motion.div>
              </div>

              {/* Quick Actions */}
              <motion.section variants={itemVariants} className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 px-1">Menu Utama</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Tugas', icon: '📝', path: '/student/tasks', color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Materi', icon: '📚', path: '/student/modules', color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Diskusi', icon: '👥', path: '/student/collaboration', color: 'bg-orange-50 text-orange-600' },
                    { label: 'AI Tutor', icon: '🤖', path: '/student/playground', color: 'bg-purple-50 text-purple-600' },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(item.path)}
                      className="flex flex-col items-center p-6 bg-white rounded-3xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/50 transition-all group"
                    >
                      <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                        {item.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.section>
            </div>

            {/* Right Side: Tasks */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Tugas Terbaru</h3>
                  <Link to="/student/tasks" className="text-[10px] font-bold text-indigo-600 hover:underline">Lihat Semua</Link>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    [1, 2].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)
                  ) : tasks.length > 0 ? (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/student/task/${task.id}`)}
                        className="p-4 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                      >
                        <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{task.title}</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-medium">{task.modules?.title || 'Materi'}</span>
                          <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Baru</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">Belum ada tugas</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tips Hari Ini</p>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    "Gunakan perintah suara untuk navigasi lebih cepat!"
                  </p>
                </div>
              </div>

              <button
                className="w-full p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-100 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🤟</div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Bahasa Isyarat</h4>
                  <p className="text-[10px] font-bold text-slate-400">Aktifkan Mode Video</p>
                </div>
              </button>
            </motion.div>
          </div>
        </motion.div>

        <footer className="mt-16 pt-10 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] mb-4">&copy; 2025 SuaraKu Platform</p>
        </footer>
      </main>

      <VoiceButton commands={dashboardCommands} onCommandMatch={handleCommand} />
    </div>
  );
};

export default StudentDashboard;
