import React, { useEffect, useState } from 'react';
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
      setGreeting(`${timeGreeting}, ${firstName}!`); // Display only name in UI for cleaner look

      const timer = setTimeout(() => speak(finalGreeting), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, tasks, profile, speak]);

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
      case 'LOGOUT': /* handle logout */ break;
      default: break;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-purple-100">
      {/* Navigation Sidebar (Laptop Friendly) */}
      <aside className="w-80 bg-white border-r border-slate-100 p-10 hidden lg:flex flex-col sticky top-0 h-screen overflow-hidden">
        <div className="mb-16">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl shadow-purple-100 font-black">S</div>
             <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Suara<span className="text-purple-600">Ku</span></h1>
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
              className={`flex items-center gap-4 p-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 ${item.active ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <span className="text-xl">{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-10 border-t border-slate-50">
           <button
             onClick={() => navigate('/profile')}
             className="w-full group flex items-center gap-4 p-5 bg-purple-50 rounded-3xl border border-purple-100 hover:bg-purple-600 transition-all duration-500"
           >
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-purple-600 font-black shadow-sm group-hover:scale-110 transition-transform">
                {profile?.full_name?.[0] || 'S'}
              </div>
              <div className="text-left overflow-hidden">
                 <p className="text-xs font-black text-purple-900 uppercase tracking-tighter truncate group-hover:text-white transition-colors">{profile?.full_name?.split(' ')[0]}</p>
                 <p className="text-[8px] font-bold text-purple-400 uppercase group-hover:text-purple-200 transition-colors tracking-widest">Pengaturan Akun</p>
              </div>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">
        {/* Top Header Mobile/Tablet Only */}
        <header className="flex lg:hidden justify-between items-center mb-10 bg-white/80 backdrop-blur-lg p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <h1 className="text-xl font-black text-slate-900">Suara<span className="text-purple-600">Ku</span></h1>
           <button onClick={() => navigate('/profile')} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200">
              {profile?.full_name?.[0]}
           </button>
        </header>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column: Greeting & Stats */}
          <div className="lg:col-span-2 space-y-12">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-12 rounded-[4rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-[0_40px_80px_rgba(79,70,229,0.15)] overflow-hidden"
            >
               <div className="relative z-10 max-w-lg">
                  <motion.div initial={{ x: -20 }} animate={{ x: 0 }} className="flex items-center gap-3 mb-6">
                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">🔥 {profile?.streak || 0} Hari Semangat!</span>
                  </motion.div>
                  <h2 className="text-5xl md:text-6xl font-black leading-none tracking-tighter mb-6">{greeting}</h2>
                  <p className="text-purple-100 text-lg font-bold opacity-80 max-w-md">Lanjutkan petualangan belajarmu hari ini untuk mendapatkan lebih banyak XP dan lencana baru!</p>

                  <div className="mt-10 flex gap-4">
                     <button onClick={() => navigate('/student/tasks')} className="px-8 py-4 bg-white text-purple-600 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95">Mulai Belajar</button>
                     <button onClick={() => speak(greeting)} className="w-14 h-14 bg-white/10 backdrop-blur-lg text-white rounded-3xl flex items-center justify-center hover:bg-white/20 transition-all">🔊</button>
                  </div>
               </div>

               {/* Abstract Shapes */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 opacity-20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            </motion.section>

            {/* Progress Visualization */}
            <div className="grid md:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="relative z-10">
                     <div className="flex justify-between items-center mb-8">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Level Kamu</span>
                        <span className="text-2xl">🎖️</span>
                     </div>
                     <XPBar current={profile?.xp || 0} nextLevel={1000} level={Math.floor((profile?.xp || 0) / 1000) + 1} />
                  </div>
                  <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-50 transition-opacity" />
               </div>
               <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="relative z-10">
                     <div className="flex justify-between items-center mb-8">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Streak Belajar</span>
                        <span className="text-2xl">🔥</span>
                     </div>
                     <StreakBadge days={profile?.streak || 0} />
                  </div>
               </div>
            </div>

            {/* Quick Actions Grid */}
            <section className="space-y-8">
               <div className="flex items-center gap-4 px-4">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Menu Utama</h3>
                  <div className="flex-1 h-[2px] bg-slate-100" />
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[
                   { label: 'Tugas', icon: '📝', path: '/student/tasks', color: 'bg-blue-600' },
                   { label: 'Materi', icon: '📚', path: '/student/modules', color: 'bg-emerald-600' },
                   { label: 'Diskusi', icon: '👥', path: '/student/collaboration', color: 'bg-orange-600' },
                   { label: 'AI Tutor', icon: '🤖', path: '/student/playground', color: 'bg-purple-600' },
                 ].map((item, i) => (
                   <button
                     key={i}
                     onClick={() => navigate(item.path)}
                     className="group relative p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 overflow-hidden"
                   >
                     <div className={`absolute top-0 right-0 w-2 h-full ${item.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                     <span className="text-5xl block mb-6 transform group-hover:scale-110 transition-transform">{item.icon}</span>
                     <span className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-500 group-hover:text-slate-900">{item.label}</span>
                   </button>
                 ))}
               </div>
            </section>
          </div>

          {/* Right Column: Active Tasks & Notifications */}
          <div className="space-y-12">
            <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm h-fit">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Tugas Aktif</h3>
                  <Link to="/student/tasks" className="text-[10px] font-black text-purple-600 uppercase bg-purple-50 px-4 py-2 rounded-2xl hover:bg-purple-600 hover:text-white transition-all">Lihat Semua</Link>
               </div>

               <div className="space-y-4">
                 {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-50 rounded-[2.5rem] animate-pulse" />)
                 ) : tasks.length > 0 ? (
                    tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        whileHover={{ x: 8 }}
                        onClick={() => navigate(`/student/task/${task.id}`)}
                        className="p-6 bg-slate-50/50 hover:bg-white border-2 border-transparent hover:border-purple-100 rounded-[2.5rem] transition-all cursor-pointer group"
                      >
                         <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">📋</div>
                            <div className="flex-1 min-w-0">
                               <h4 className="font-black text-slate-900 truncate">{task.title}</h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{task.modules?.title || 'Umum'}</p>
                            </div>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="px-3 py-1 bg-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase border border-red-100">🔥 Deadline Segera</span>
                            <span className="text-[10px] font-black text-slate-400">{new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                         </div>
                      </motion.div>
                    ))
                 ) : (
                    <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                       <span className="text-4xl block mb-4">🎉</span>
                       <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">Semua Beres!</p>
                    </div>
                 )}
               </div>

               {/* Learning Tip Card */}
               <div className="mt-10 p-8 bg-indigo-900 rounded-[3rem] text-white relative overflow-hidden">
                  <div className="relative z-10">
                     <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Tips Belajar AI</p>
                     <p className="text-sm font-bold leading-relaxed">"Jangan takut bertanya pada AI Tutor jika kamu bingung ya!"</p>
                  </div>
                  <div className="absolute bottom-0 right-0 text-5xl opacity-20 -mb-4 -mr-4">🤖</div>
               </div>
            </section>

            {/* Accessibility Shortcut Card */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-purple-200 transition-all cursor-pointer">
               <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🤟</div>
               <div>
                  <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Mode Bahasa Isyarat</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Aktifkan Video Bantuan AI</p>
               </div>
            </div>
          </div>
        </div>

        <footer className="mt-24 pt-12 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-4 italic">Developed for Inclusive Future</p>
          <div className="flex justify-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
             <span className="hover:text-purple-600 cursor-pointer">Panduan Pengguna</span>
             <span className="hover:text-purple-600 cursor-pointer">Kebijakan Privasi</span>
             <span className="hover:text-purple-600 cursor-pointer">Bantuan</span>
          </div>
        </footer>
      </main>

      <VoiceButton commands={dashboardCommands} onCommandMatch={handleCommand} />
    </div>
  );
};

export default StudentDashboard;
