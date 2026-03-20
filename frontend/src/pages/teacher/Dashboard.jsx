import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const TeacherDashboard = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalModul: 0,
    tugasPending: 0,
    avgScore: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [myModules, setMyModules] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // summary, modules, assignments

  useEffect(() => {
    if (profile?.id) {
      fetchStats();
      fetchMyModules();
      fetchMyAssignments();
    }
  }, [profile]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { count: siswaCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'siswa');
      const { count: modulCount } = await supabase.from('modules').select('*', { count: 'exact', head: true }).eq('teacher_id', profile?.id);

      const { data: subs, error: subsError } = await supabase
        .from('submissions')
        .select('*, profiles!inner(full_name, xp), assignments!inner(title, teacher_id)')
        .eq('assignments.teacher_id', profile.id)
        .order('submitted_at', { ascending: false });

      if (subsError) throw subsError;

      // Hitung rata-rata skor riil
      const totalScore = subs?.reduce((acc, curr) => acc + (curr.total_score || 0), 0) || 0;
      const avg = subs?.length > 0 ? (totalScore / subs.length).toFixed(1) : 0;

      setStats({
        totalSiswa: siswaCount || 0,
        totalModul: modulCount || 0,
        tugasPending: subs?.filter(s => s.status !== 'graded').length || 0,
        avgScore: avg
      });

      setRecentSubmissions(subs?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyModules = async () => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false });

    if (!error) setMyModules(data);
  };

  const fetchMyAssignments = async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, assignment_questions(count)')
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false });

    if (!error) setMyAssignments(data);
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus modul ini?')) return;
    setDeleteLoading(moduleId);
    try {
      const { error: dbError } = await supabase.from('modules').delete().eq('id', moduleId);
      if (dbError) throw dbError;
      setMyModules(prev => prev.filter(m => m.id !== moduleId));
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Hapus tugas ini? Semua data jawaban siswa juga akan terhapus.')) return;
    setDeleteLoading(id);
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
      setMyAssignments(prev => prev.filter(a => a.id !== id));
      fetchStats();
    } catch (error) {
      alert('Gagal menghapus tugas: ' + error.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 p-8 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="mb-12">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Suara<span className="text-purple-600">Ku</span></h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Panel Guru SLB</p>
        </div>

        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('summary')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'summary' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'text-slate-400 hover:bg-purple-50'}`}>
            📊 Ringkasan
          </button>
          <button onClick={() => setActiveTab('modules')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'modules' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'text-slate-400 hover:bg-purple-50'}`}>
            📚 Materi Modul
          </button>
          <button onClick={() => setActiveTab('assignments')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'assignments' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'text-slate-400 hover:bg-purple-50'}`}>
            📝 Kelola Tugas
          </button>
          <Link to="/teacher/chat" className="flex items-center gap-4 p-4 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
            💬 Pesan Ortu
          </Link>
        </nav>

        <div className="pt-8 border-t border-slate-50">
          <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-4 p-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-100 hover:border-purple-200 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-black group-hover:bg-purple-600 transition-colors">{profile?.full_name?.[0]}</div>
            <div className="text-left overflow-hidden">
               <p className="truncate group-hover:text-purple-600 transition-colors">{profile?.full_name?.split(' ')[0]}</p>
               <p className="text-[8px] text-slate-400 uppercase tracking-tighter">Lihat Profil</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/profile')} className="lg:hidden w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-xl">👤</button>
             <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Halo, Pak/Bu {profile?.full_name?.split(' ')[0]}!</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Laporan Aktivitas Belajar Terkini</p>
             </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/teacher/upload')} className="px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all">+ Modul</button>
            <button onClick={() => navigate('/teacher/create-task')} className="px-6 py-3 bg-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-purple-100 hover:scale-105 transition-all">+ Tugas Baru</button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'summary' && (
            <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

              {/* Insight AI Riil (Baru ditambahkan untuk Guru) */}
              <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden mb-12 group">
                  <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                     <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-white/5 group-hover:rotate-12 transition-transform duration-500">🤖</div>
                     <div>
                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-3">AI Intelligence Report</h4>
                        <p className="text-xl font-bold leading-relaxed italic max-w-2xl">
                           {recentSubmissions.length > 0
                             ? `Siswa Anda baru saja menyelesaikan "${recentSubmissions[0].assignments?.title}" dengan skor ${recentSubmissions[0].total_score}. Rata-rata nilai kelas saat ini adalah ${stats.avgScore}.`
                             : "Belum ada aktivitas terbaru dari siswa Anda. Dorong mereka untuk mulai mengerjakan tugas hari ini!"
                           }
                        </p>
                     </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 opacity-10 rounded-full blur-[100px]" />
              </section>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                 {[
                   { label: 'Total Siswa', value: stats.totalSiswa, icon: '👥', color: 'from-blue-500 to-indigo-600' },
                   { label: 'Rata-rata Kelas', value: stats.avgScore, icon: '📈', color: 'from-emerald-500 to-teal-600' },
                   { label: 'Perlu Dinilai', value: stats.tugasPending, icon: '⏳', color: 'from-orange-500 to-amber-600' },
                 ].map((s, i) => (
                   <div key={i} className="p-8 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm relative group overflow-hidden">
                      <span className="text-3xl block mb-6">{s.icon}</span>
                      <p className="text-4xl font-black text-slate-900 mb-1">{s.value}</p>
                      <p className="font-black text-xs uppercase tracking-widest text-slate-400">{s.label}</p>
                   </div>
                 ))}
              </div>

              <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                 <div className="p-10 border-b border-slate-50">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Pengumpulan Terbaru</h3>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/50">
                             <th className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Siswa</th>
                             <th className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Tugas</th>
                             <th className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Skor</th>
                             <th className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Tanggal</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {recentSubmissions.map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                               <td className="px-10 py-6 font-bold text-slate-700">{sub.profiles?.full_name}</td>
                               <td className="px-10 py-6 text-slate-500 font-medium">{sub.assignments?.title}</td>
                               <td className="px-10 py-6 text-center">
                                  <span className={`px-4 py-1 rounded-full font-black text-xs ${sub.total_score >= 80 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {sub.total_score || 0}
                                  </span>
                               </td>
                               <td className="px-10 py-6 text-right text-slate-400 font-bold text-[10px]">
                                  {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'modules' && (
            <motion.div key="modules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {myModules.map(m => (
                 <div key={m.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-2xl">📄</span>
                       <button onClick={() => handleDeleteModule(m.id)} className="text-red-400 hover:text-red-600 transition-colors">🗑️</button>
                    </div>
                    <h4 className="font-black text-slate-800 line-clamp-1">{m.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{new Date(m.created_at).toLocaleDateString('id-ID')}</p>
                    <a href={m.pdf_url} target="_blank" rel="noreferrer" className="block w-full py-3 text-center bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100">Buka PDF</a>
                 </div>
               ))}
            </motion.div>
          )}

          {activeTab === 'assignments' && (
            <motion.div key="assignments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
               {myAssignments.map(a => (
                 <div key={a.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl font-black">📝</div>
                       <div>
                          <h4 className="text-xl font-black text-slate-800">{a.title}</h4>
                          <div className="flex gap-3 mt-2">
                             <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{a.assignment_questions?.[0]?.count || 0} Soal</span>
                             <span className="px-3 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest">Deadline: {new Date(a.deadline).toLocaleDateString('id-ID')}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => navigate(`/teacher/create-task?edit=${a.id}`)} className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all">Edit Tugas</button>
                       <button onClick={() => handleDeleteAssignment(a.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">🗑️</button>
                    </div>
                 </div>
               ))}
            </motion.div>
          )}
        </ AnimatePresence>
      </main>
    </div>
  );
};

export default TeacherDashboard;
