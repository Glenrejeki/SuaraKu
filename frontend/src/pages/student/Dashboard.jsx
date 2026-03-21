import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useNavigate, Link } from 'react-router-dom';
import XPBar from '../../components/XPBar';
import StreakBadge from '../../components/StreakBadge';
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

      setGreeting(`${timeGreeting}, ${firstName}!`);

      let voiceMsg = `${timeGreeting}, ${firstName}!`;
      if (tasks.length > 0) {
        voiceMsg += ` Ada ${tasks.length} tugas penting menantangmu hari ini. Ayo selesaikan!`;
      } else {
        voiceMsg += ` Wah hebat, semua tugasmu sudah selesai. Kamu mau belajar apa lagi?`;
      }

      const timer = setTimeout(() => {
        speak(voiceMsg);
        setAvatarState('happy');
        setTimeout(() => setShowConfetti(true), 500);
        setTimeout(() => setShowConfetti(false), 4000);
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
      .limit(2);
    if (data) setTasks(data);
    setLoading(false);
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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-indigo-100 relative overflow-hidden">
      <ConfettiEffect active={showConfetti} />
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full overflow-y-auto h-screen custom-scrollbar relative z-10">

        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <div className="relative">
               <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse" />
               <BintangAvatar state={avatarState} size="md" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">{greeting}</h1>
              <div className="flex items-center gap-2 mt-3">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                 <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Petualangan Belajar Dimulai! 🚀</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 bg-white p-4 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50"
          >
            <div className="flex flex-col items-end pr-4 border-r border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Poin Global</span>
              <span className="text-xl font-black text-indigo-600">{profile?.xp || 0} <span className="text-xs text-slate-300">XP</span></span>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all font-bold group"
              aria-label="Profil Saya"
            >
              <span className="group-hover:rotate-12 transition-transform">{profile?.full_name?.[0]}</span>
            </button>
          </motion.div>
        </header>

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: 'Jelajah Materi', desc: 'Buka Gerbang Pengetahuan', icon: '📚', path: '/student/modules', color: 'indigo', xp: '50' },
                { label: 'Misi Tantangan', desc: 'Selesaikan & Raih Skor', icon: '🎯', path: '/student/tasks', color: 'rose', xp: '100+' },
                { label: 'Ruang Bintang', desc: 'Diskusi dengan AI Tutor', icon: '🤖', path: '/student/playground', color: 'purple', xp: 'Chat' },
                { label: 'Markas Teman', desc: 'Belajar Bersama-sama', icon: '🏰', path: '/student/collaboration', color: 'amber', xp: 'Team' },
              ].map((item, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(item.path)}
                  className="group relative p-10 bg-white rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all text-left overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-${item.color}-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700`} />
                  <div className={`w-20 h-20 rounded-3xl bg-${item.color}-50 text-4xl flex items-center justify-center mb-8 shadow-inner`}>
                    {item.icon}
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">{item.label}</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6">{item.desc}</p>
                    <span className={`px-4 py-1.5 bg-${item.color}-100 text-${item.color}-600 rounded-full text-[9px] font-black uppercase`}>Bonus: {item.xp} XP</span>
                  </div>
                </motion.button>
              ))}
            </div>

            <section className="bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em]">Level Petualangan Kamu</h3>
                    <div className="flex gap-2">
                       <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                       <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75" />
                       <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-150" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <XPBar current={profile?.xp || 0} nextLevel={1000} level={currentLevel} />

                    <div className="grid grid-cols-2 gap-6">
                       <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
                          <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-3">Streak Api</p>
                          <div className="flex items-center gap-3">
                             <span className="text-3xl">🔥</span>
                             <span className="text-2xl font-black">{profile?.streak || 0} <span className="text-xs opacity-40">HARI</span></span>
                          </div>
                       </div>
                       <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
                          <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-3">Lencana</p>
                          <div className="flex items-center gap-3">
                             <span className="text-3xl">🎖️</span>
                             <span className="text-2xl font-black">{Math.floor((profile?.xp || 0) / 500)} <span className="text-xs opacity-40">ITEM</span></span>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl shadow-slate-200/30 relative overflow-hidden">
               <div className="flex justify-between items-center mb-10 px-2">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Misi Penting</h3>
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-1">Jangan Lewatkan!</p>
                  </div>
                  <Link to="/student/tasks" className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
               </div>

               <div className="space-y-5">
                 {loading ? (
                    <div className="h-28 bg-slate-50 rounded-[2.5rem] animate-pulse" />
                 ) : tasks.length > 0 ? (
                    tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        whileHover={{ scale: 1.03, x: 5 }}
                        onClick={() => navigate(`/student/task/${task.id}`)}
                        className="p-6 bg-slate-50 hover:bg-indigo-600 group rounded-[3rem] transition-all cursor-pointer border-2 border-transparent hover:border-indigo-100"
                      >
                         <h4 className="font-black text-slate-800 group-hover:text-white text-sm mb-2 truncate uppercase tracking-tight">{task.title}</h4>
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-indigo-600 bg-white px-3 py-1 rounded-full group-hover:bg-indigo-500 group-hover:text-white transition-colors">🔥 CEPAT</span>
                            <span className="text-[9px] font-black text-slate-400 group-hover:text-indigo-200">{new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                         </div>
                      </motion.div>
                    ))
                 ) : (
                    <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                       <span className="text-5xl block mb-4">🏆</span>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Misi Selesai!</p>
                    </div>
                 )}
               </div>
            </section>

            <div className="p-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden">
                        <BintangAvatar state="happy" size="sm" />
                     </div>
                     <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Pesan Kak Bintang</p>
                  </div>
                  <p className="text-base font-bold leading-relaxed italic pr-4">
                    "Tahukah kamu? Setiap kali kamu membaca materi, otakmu menjadi lebih kuat seperti otot pahlawan super! Ayo lanjut belajar!"
                  </p>
               </div>
               <div className="absolute -bottom-10 -right-10 text-[10rem] opacity-10 group-hover:rotate-12 transition-transform duration-700">🤖</div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-indigo-200 transition-all">
               <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform">
                 {profile?.disability_type === 'tunanetra' ? '🎧' : profile?.disability_type === 'tunarungu' ? '🤟' : '✨'}
               </div>
               <div>
                  <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Teknologi Inklusif</h4>
                  <p className="text-indigo-600 font-black text-[9px] uppercase tracking-widest mt-1 opacity-70">Optimal untuk {profile?.disability_type?.replace('_', ' ')}</p>
               </div>
            </div>
          </div>
        </div>

        <footer className="mt-24 py-10 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-80">
            @2026 BintangAi.Developed oleh Christian Johannes Hutahaean Dan Glen Rejeki Sitorus
          </p>
        </footer>
      </main>

      <div className="fixed bottom-10 right-10 z-[100]">
        <div className="relative group">
           <div className="absolute inset-0 bg-indigo-600 rounded-full blur-2xl opacity-40 animate-pulse group-hover:opacity-60 transition-opacity" />
           <VoiceButton
             commands={dashboardCommands}
             onCommandMatch={handleCommand}
             customText="APA PERINTAHMU?"
           />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
