import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useNavigate, Link } from 'react-router-dom';
import XPBar from '../../components/XPBar';
import VoiceButton from '../../components/VoiceButton';
import StudentSidebar from '../../components/StudentSidebar';
import BintangAvatar from '../../components/BintangAvatar';
import ConfettiEffect from '../../components/ConfettiEffect';
import { supabase } from '../../lib/supabase';

const StudentDashboard = () => {
  const { profile, fetchProfile } = useAuthStore();
  const { speak, isSpeaking } = useVoice();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [avatarState, setAvatarState] = useState('idle');
  const [showConfetti, setShowConfetti] = useState(false);

  const dashboardCommands = {
    'GO_TASKS': ['buka tugas', 'lihat tugas', 'cek pr', 'tugas saya', 'tugas apa'],
    'GO_MODULES': ['buka modul', 'baca materi', 'belajar', 'materi'],
    'GO_PLAYGROUND': ['buka ruang bermain', 'mau ngobrol', 'tanya ai', 'playground'],
    'GO_PROFILE': ['buka profil', 'pengaturan', 'akun saya', 'profil'],
    'LOGOUT': ['keluar', 'logout', 'ganti akun'],
  };

  useEffect(() => {
    if (profile?.id) {
        fetchProfile(profile.id);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchLeaderboard();
  }, [profile]);

  useEffect(() => {
    if (isSpeaking) setAvatarState('speaking');
    else setAvatarState('idle');
  }, [isSpeaking]);

  useEffect(() => {
    if (!loading) {
      const hr = new Date().getHours();
      const timeGreeting = hr < 12 ? 'Selamat Pagi' : hr < 18 ? 'Selamat Siang' : 'Selamat Malam';
      const firstName = profile?.full_name?.split(' ')[0] || 'Teman';

      setGreeting(timeGreeting);

      let voiceMsg = `${timeGreeting}, ${firstName}! Sudah siap untuk mengumpulkan bintang hari ini?`;

      const timer = setTimeout(() => {
        speak(voiceMsg);
        setAvatarState('happy');
        setTimeout(() => setShowConfetti(true), 500);
        setTimeout(() => setShowConfetti(false), 3000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, tasks, profile]);

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

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, xp')
      .eq('role', 'siswa')
      .order('xp', { ascending: false })
      .limit(5);
    if (data) setLeaderboard(data);
  };

  const handleCommand = (command) => {
    switch (command) {
      case 'GO_TASKS': navigate('/student/tasks'); break;
      case 'GO_MODULES': navigate('/student/modules'); break;
      case 'GO_PLAYGROUND': navigate('/student/playground'); break;
      case 'GO_PROFILE': navigate('/profile'); break;
      default: break;
    }
  };

  const currentLevel = Math.floor((profile?.xp || 0) / 1000) + 1;

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex font-sans selection:bg-indigo-100 relative overflow-hidden text-slate-900">
      <ConfettiEffect active={showConfetti} />
      <StudentSidebar />

      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
         <span className="text-9xl">⭐</span>
      </div>
      <div className="absolute bottom-0 left-64 p-10 opacity-5 pointer-events-none">
         <span className="text-8xl">⭐</span>
      </div>

      <main className="flex-1 p-6 md:p-10 lg:p-16 max-w-7xl mx-auto w-full overflow-y-auto h-screen custom-scrollbar relative z-10">

        {/* Modern Minimal Header */}
        <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-10"
          >
            <div className="relative">
               <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[80px] opacity-10 animate-pulse" />
               <BintangAvatar state={avatarState} size="xl" />
               <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4 text-4xl"
               >
                 ⭐
               </motion.div>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mb-2">{greeting}, {profile?.full_name?.split(' ')[0]} ✨</p>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-none">
                Cari Bintang<br/>
                <span className="text-indigo-600">Hari Ini?</span>
              </h1>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden md:flex flex-col items-end"
          >
             <div className="bg-white p-3 pr-10 rounded-full shadow-sm border border-slate-50 flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xl shadow-slate-200">
                  {profile?.full_name?.[0] || 'S'}
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">XP Saya</p>
                   <p className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <span className="text-amber-400">⭐</span> {profile?.xp || 0}
                   </p>
                </div>
             </div>
          </motion.div>
        </header>

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Main Actions */}
          <div className="lg:col-span-8 space-y-16">

            {/* Minimal Progres */}
            <section className="relative px-2">
               <div className="flex justify-between items-end mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🏅</span>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Level {currentLevel}</h3>
                       <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                         {1000 - (profile?.xp % 1000)} XP lagi untuk bintang baru
                       </p>
                    </div>
                  </div>
                  <span className="text-3xl font-black text-indigo-50 opacity-20">LV.{currentLevel}</span>
               </div>
               <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50 p-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(profile?.xp % 1000) / 10}%` }}
                    transition={{ duration: 2, ease: "circOut" }}
                    className="h-full bg-gradient-to-r from-amber-400 via-indigo-500 to-violet-600 rounded-full shadow-lg shadow-indigo-100"
                  />
               </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: 'Jelajah Materi', icon: '📖', path: '/student/modules', color: 'indigo' },
                { label: 'Tugas', icon: '🎯', path: '/student/tasks', color: 'rose' },
                { label: 'SuaraKu AI', icon: '🤖', path: '/student/playground', color: 'violet' },
                { label: 'Kolaborasi', icon: '🏰', path: '/student/collaboration', color: 'amber' },
              ].map((item, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -12, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(item.path)}
                  className="group p-12 bg-white rounded-[4rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/20 transition-all text-left relative overflow-hidden"
                >
                  <div className={`w-20 h-20 bg-${item.color}-50 text-${item.color}-600 rounded-[2rem] flex items-center justify-center text-4xl mb-10 group-hover:scale-110 transition-transform duration-500`}>
                    {item.icon}
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">{item.label}</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest opacity-60">Klik untuk mulai</p>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                </motion.button>
              ))}
            </div>

            {/* AI Quote Section */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-indigo-600 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl shadow-indigo-200"
            >
               <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                  <div className="w-32 h-32 shrink-0 bg-white/20 rounded-[2.5rem] backdrop-blur-md flex items-center justify-center border border-white/30">
                     <BintangAvatar state="happy" size="md" />
                  </div>
                  <div className="text-center md:text-left">
                     <p className="text-indigo-200 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Misi Inspirasi</p>
                     <p className="text-2xl font-bold leading-relaxed italic opacity-95">
                       "Hai {profile?.full_name?.split(' ')[0]}! Kamu itu bintang paling terang hari ini. Ayo pancarkan sinarmu dengan menyelesaikan satu materi lagi!"
                     </p>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
               <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
            </motion.section>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-12">

            {/* Minimalist Leaderboard Section */}
            <section className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm relative overflow-hidden">
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Bintang Teratas</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Papan Peringkat</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-xl">🏆</div>
               </div>

               <div className="space-y-2">
                  {leaderboard.length > 0 ? (
                    leaderboard.map((user, i) => (
                      <div key={i} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${user.full_name === profile?.full_name ? 'bg-indigo-50/50 border border-indigo-100' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] ${
                            i === 0 ? 'bg-amber-400 text-white shadow-sm' :
                            i === 1 ? 'bg-slate-300 text-white' :
                            i === 2 ? 'bg-orange-300 text-white' :
                            'text-slate-300'
                          }`}>
                            {i + 1}
                          </div>
                          <span className={`text-xs font-bold ${user.full_name === profile?.full_name ? 'text-indigo-600' : 'text-slate-600'}`}>
                            {user.full_name.split(' ')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                           <span className="text-xs font-black text-slate-900">{user.xp}</span>
                           <span className="text-[8px] font-bold text-slate-300 uppercase">XP</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest">Memuat Peringkat...</div>
                  )}
               </div>
            </section>

            <section className="bg-white p-12 rounded-[4rem] border border-slate-50 shadow-sm relative">
               <div className="flex justify-between items-center mb-12">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Misi Aktif</h3>
                  <div className="flex gap-1.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                     <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse delay-75" />
                  </div>
               </div>

               <div className="space-y-6">
                 {loading ? (
                    [1, 2].map(i => <div key={i} className="h-28 bg-slate-50 rounded-[2.5rem] animate-pulse" />)
                 ) : tasks.length > 0 ? (
                    tasks.map((task, i) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => navigate(`/student/task/${task.id}`)}
                        className="group p-8 bg-slate-50/50 hover:bg-white rounded-[3rem] border border-transparent hover:border-slate-100 hover:shadow-xl transition-all cursor-pointer flex items-center gap-6"
                      >
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-50 group-hover:bg-amber-400 group-hover:text-white transition-all">
                            🎯
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-800 text-[11px] truncate uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">
                               {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </p>
                         </div>
                      </motion.div>
                    ))
                 ) : (
                    <div className="py-20 text-center flex flex-col items-center gap-6">
                       <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl">🏆</div>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Misi Selesai!</p>
                    </div>
                 )}
               </div>

               <Link to="/student/tasks" className="block w-full text-center mt-12 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                  Lihat Semua
               </Link>
            </section>

            {/* Smart Access Card */}
            <div className="p-10 bg-white rounded-[4rem] border border-slate-50 shadow-sm flex items-center gap-8 group hover:border-indigo-100 transition-all">
               <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl shadow-slate-200 group-hover:rotate-12 transition-transform">
                 {profile?.disability_type === 'tunanetra' ? '🎧' : profile?.disability_type === 'tunarungu' ? '🤟' : '✨'}
               </div>
               <div>
                  <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Akses Cerdas</h4>
                  <p className="text-indigo-600 font-black text-[9px] uppercase tracking-widest mt-2 opacity-70">Mode {profile?.disability_type?.replace('_', ' ')}</p>
               </div>
            </div>

            <footer className="pt-12 px-8 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 leading-loose">
                © 2026 SuaraKu Platform<br/>
                Developed with ❤️ for Inclusivity
              </p>
            </footer>
          </div>
        </div>

      </main>

      {/* Modern Minimal Voice FAB */}
      <div className="fixed bottom-12 right-12 z-[100]">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group"
        >
           <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
           <VoiceButton
             commands={dashboardCommands}
             onCommandMatch={handleCommand}
             customText="APA PERINTAHMU?"
           />
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
