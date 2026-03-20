import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useNavigate, Link } from 'react-router-dom';
import XPBar from '../../components/XPBar';
import StreakBadge from '../../components/StreakBadge';
import VoiceButton from '../../components/VoiceButton';
import { supabase } from '../../lib/supabase';

const StudentDashboard = () => {
  const { profile } = useAuthStore();
  const { speak, readPage } = useVoice();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  // Identifikasi jenis disabilitas dengan penamaan yang konsisten dengan database
  const isDeaf = profile?.disability_type === 'tunarungu';
  const isBlind = profile?.disability_type === 'tunanetra';
  const isMute = profile?.disability_type === 'tunawicara';

  const dashboardCommands = {
    'GO_TASKS': ['buka tugas', 'lihat tugas', 'cek pr', 'tugas saya', 'tugas apa', 'halaman tugas'],
    'GO_MODULES': ['buka modul', 'baca materi', 'belajar', 'materi', 'halaman materi'],
    'GO_PLAYGROUND': ['buka ruang bermain', 'mau ngobrol', 'tanya ai', 'playground', 'tanya robot'],
    'GO_PROFILE': ['buka profil', 'pengaturan', 'akun saya', 'profil', 'halaman akun'],
    'READ_PAGE': ['baca halaman', 'bacakan layar', 'apa isi halaman ini'],
    'LOGOUT': ['keluar', 'logout', 'ganti akun'],
    'BACK': ['kembali', 'balik ke awal']
  };

  useEffect(() => {
    fetchTasks();
    // Atur atribut data-disability di elemen HTML untuk CSS
    document.documentElement.setAttribute('data-disability', profile?.disability_type || 'tidak_ada');
  }, [profile]);

  useEffect(() => {
    if (!loading) {
      const hr = new Date().getHours();
      const timeGreeting = hr < 12 ? 'Selamat Pagi' : hr < 18 ? 'Selamat Siang' : 'Selamat Malam';
      const firstName = profile?.full_name?.split(' ')[0] || 'Teman';

      let taskNotification = tasks.length > 0
        ? ` Kamu memiliki ${tasks.length} tugas yang perlu dikerjakan.`
        : " Kamu sudah menyelesaikan semua tugas. Hebat!";

      const finalGreeting = `${timeGreeting}, ${firstName}!${taskNotification} ${isBlind ? "Ucapkan 'Baca halaman' untuk mendengar semua menu." : ""}`;
      setGreeting(`${timeGreeting}, ${firstName}!`);

      if (!isDeaf) {
        const timer = setTimeout(() => speak(finalGreeting), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, tasks, profile, speak, isDeaf, isBlind]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('assignments')
      .select('*, modules(title)')
      .order('deadline', { ascending: true })
      .limit(3);
    if (data) setTasks(data);
    setLoading(false);
  };

  const handleCommand = (command) => {
    switch (command) {
      case 'GO_TASKS': navigate('/student/tasks'); break;
      case 'GO_MODULES': navigate('/student/modules'); break;
      case 'GO_PLAYGROUND': navigate('/student/playground'); break;
      case 'GO_PROFILE': navigate('/profile'); break;
      case 'READ_PAGE': readPage(); break;
      case 'LOGOUT': /* handle logout */ break;
      case 'BACK': navigate(-1); break;
      default: break;
    }
  };

  return (
    <div className={`min-h-screen flex font-sans transition-all duration-700 ${isBlind ? 'bg-black text-white' : 'bg-[#F8FAFC]'}`}>

      {/* 1. VISUAL FEEDBACK FOR DEAF (TUNARUNGU) */}
      {isDeaf && (
        <div className="fixed inset-0 pointer-events-none z-[100] border-[12px] border-purple-500/20 animate-pulse" aria-hidden="true" />
      )}

      {/* Navigation Sidebar */}
      <aside className={`w-80 border-r p-10 hidden lg:flex flex-col sticky top-0 h-screen overflow-hidden transition-all ${isBlind ? 'bg-black border-yellow-400' : 'bg-white border-slate-100'}`}>
        <div className="mb-16">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl font-black">S</div>
             <div>
                <h1 className={`text-2xl font-black tracking-tighter leading-none ${isBlind ? 'text-white' : 'text-slate-900'}`}>Suara<span className="text-purple-600">Ku</span></h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Platform Inklusif</p>
             </div>
          </div>
        </div>

        <nav className="space-y-4 flex-1">
          {[
            { label: 'Beranda', icon: '🏠', path: '/student/dashboard', active: true },
            { label: 'Tugas Saya', icon: '📝', path: '/student/tasks' },
            { label: 'Materi Modul', icon: '📚', path: '/student/modules' },
            { label: 'Ruang Kolaborasi', icon: '👥', path: '/student/collaboration' },
            { label: 'Tanya AI', icon: '🤖', path: '/student/playground' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className={`flex items-center gap-4 p-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
                item.active
                  ? (isBlind ? 'bg-yellow-400 text-black shadow-xl' : 'bg-slate-900 text-white shadow-2xl')
                  : (isBlind ? 'text-white border-2 border-yellow-400/30' : 'text-slate-400 hover:bg-slate-50')
              }`}
            >
              <span className="text-xl">{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>

        {/* Profile Button in Sidebar */}
        <div className="pt-10 border-t border-slate-50">
           <button
             onClick={() => navigate('/profile')}
             className={`w-full group flex items-center gap-4 p-5 rounded-3xl border transition-all duration-500 ${
               isBlind ? 'bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black' : 'bg-purple-50 border-purple-100 text-purple-900 hover:bg-purple-600 hover:text-white'
             }`}
           >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform ${isBlind ? 'bg-yellow-400 text-black' : 'bg-white text-purple-600'}`}>
                {profile?.full_name?.[0] || 'S'}
              </div>
              <div className="text-left overflow-hidden">
                 <p className="text-xs font-black uppercase tracking-tighter truncate">{profile?.full_name?.split(' ')[0]}</p>
                 <p className={`text-[8px] font-bold uppercase tracking-widest ${isBlind ? 'text-white/70' : 'text-purple-400'}`}>Pengaturan Akun</p>
              </div>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">
        <header className="flex lg:hidden justify-between items-center mb-10 bg-white/80 backdrop-blur-lg p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <h1 className="text-xl font-black text-slate-900">Suara<span className="text-purple-600">Ku</span></h1>
           <button onClick={() => navigate('/profile')} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200">
              {profile?.full_name?.[0]}
           </button>
        </header>

        <div className="grid lg:grid-cols-3 gap-12">

          <div className="lg:col-span-2 space-y-12">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative p-12 rounded-[4rem] shadow-2xl overflow-hidden ${isBlind ? 'bg-black border-4 border-yellow-400' : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white'}`}
            >
               <div className="relative z-10 max-w-lg">
                  <h2 className={`text-5xl md:text-6xl font-black leading-none tracking-tighter mb-6 ${isBlind ? 'text-yellow-400' : 'text-white'}`}>{greeting}</h2>

                  {/* 2. AVATAR BISINDO FOR DEAF */}
                  {isDeaf && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-6 p-4 bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 flex items-center gap-4">
                       <span className="text-4xl">🤟</span>
                       <p className="text-sm font-black uppercase tracking-widest text-white">Bahasa Isyarat Aktif</p>
                    </motion.div>
                  )}

                  <div className="mt-10 flex gap-4">
                     <button onClick={() => navigate('/student/tasks')} className={`px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl transition-all ${isBlind ? 'bg-yellow-400 text-black' : 'bg-white text-purple-600'}`}>Mulai Belajar</button>
                     <button onClick={() => readPage()} className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${isBlind ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>🔊</button>
                  </div>
               </div>
            </motion.section>

            {/* 3. AAC BOARD FOR MUTE (TUNAWICARA) */}
            {isMute && (
              <section className="bg-white p-10 rounded-[3.5rem] border-4 border-dashed border-indigo-100">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-8">Papan Komunikasi (AAC)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {[
                     { label: 'Paham', icon: '✅', color: 'bg-green-50 text-green-600' },
                     { label: 'Bantuan', icon: '🆘', color: 'bg-red-50 text-red-600' },
                     { label: 'Tanya AI', icon: '🤖', color: 'bg-purple-50 text-purple-600' },
                     { label: 'Selesai', icon: '🏁', color: 'bg-blue-50 text-blue-600' },
                   ].map((item, idx) => (
                     <button key={idx} className={`p-8 ${item.color} rounded-[2.5rem] flex flex-col items-center gap-3 font-black uppercase text-[10px] hover:scale-105 transition-all shadow-sm border border-transparent hover:border-current`}>
                        <span className="text-4xl">{item.icon}</span> {item.label}
                     </button>
                   ))}
                </div>
              </section>
            )}

            {/* Progress Visualization */}
            <div className="grid md:grid-cols-2 gap-8">
               <div className={`p-10 rounded-[3.5rem] border shadow-sm ${isBlind ? 'bg-black border-yellow-400' : 'bg-white border-slate-100'}`}>
                  <XPBar current={profile?.xp || 0} nextLevel={1000} level={Math.floor((profile?.xp || 0) / 1000) + 1} />
               </div>
               <div className={`p-10 rounded-[3.5rem] border shadow-sm ${isBlind ? 'bg-black border-yellow-400' : 'bg-white border-slate-100'}`}>
                  <StreakBadge days={profile?.streak || 0} />
               </div>
            </div>
          </div>

          {/* Right Column: Visual Alerts for Deaf */}
          <div className="space-y-12">
            {isDeaf && (
              <section className="bg-white p-10 rounded-[4rem] border-2 border-purple-100 shadow-xl overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-2 h-full bg-purple-500 animate-pulse" />
                 <h3 className="text-sm font-black text-purple-600 uppercase tracking-widest mb-6">Instruksi Visual</h3>
                 <div className="aspect-square bg-slate-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200">
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} className="text-8xl">🤟</motion.span>
                 </div>
              </section>
            )}

            <section className={`p-10 rounded-[4rem] border shadow-sm ${isBlind ? 'bg-black border-yellow-400' : 'bg-white border-slate-100'}`}>
               <h3 className={`text-xl font-black uppercase tracking-tighter mb-10 ${isBlind ? 'text-yellow-400' : 'text-slate-900'}`}>Tugas Aktif</h3>
               <div className="space-y-4">
                 {tasks.map((task) => (
                   <div key={task.id} className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer ${isBlind ? 'bg-black border-yellow-400/50 text-white' : 'bg-slate-50/50 border-transparent hover:border-purple-100'}`}>
                      <h4 className="font-black truncate">{task.title}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Hingga: {new Date(task.deadline).toLocaleDateString()}</p>
                   </div>
                 ))}
               </div>
            </section>
          </div>
        </div>
      </main>

      <VoiceButton commands={dashboardCommands} onCommandMatch={handleCommand} />
    </div>
  );
};

export default StudentDashboard;
