import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import TeacherSidebar from '../../components/TeacherSidebar';

const TeacherDashboard = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalModul: 0,
    tugasPending: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [myModules, setMyModules] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const activeTab = searchParams.get('tab') || 'summary';

  useEffect(() => {
    if (profile?.id) {
      fetchStats();
      fetchMyModules();
      fetchMyAssignments();
    }
  }, [profile]);

  const fetchStats = async () => {
    setLoading(true);
    const { count: siswaCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'siswa');
    const { count: modulCount } = await supabase.from('modules').select('*', { count: 'exact', head: true }).eq('teacher_id', profile?.id);

    const { data: subs } = await supabase
      .from('submissions')
      .select('*, profiles!inner(full_name), assignments!inner(title, teacher_id)')
      .eq('assignments.teacher_id', profile.id)
      .order('submitted_at', { ascending: false })
      .limit(5);

    setStats({
      totalSiswa: siswaCount || 0,
      totalModul: modulCount || 0,
      tugasPending: subs?.filter(s => s.status !== 'graded').length || 0
    });
    setRecentSubmissions(subs || []);
    setLoading(false);
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

  const onTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100">
      <TeacherSidebar activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Halo, Pak/Bu {profile?.full_name?.split(' ')[0]}!</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">
              {activeTab === 'summary' ? 'Laporan Aktivitas Belajar Terkini' : activeTab === 'modules' ? 'Kelola Materi Pembelajaran' : 'Kelola Tugas & Bank Soal'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/teacher/upload')}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-indigo-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Modul
            </button>
            <button
              onClick={() => navigate('/teacher/create-task')}
              className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tugas Baru
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: 'Total Siswa', value: stats.totalSiswa, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-indigo-50 text-indigo-600' },
                   { label: 'Modul Saya', value: stats.totalModul, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'bg-indigo-50 text-indigo-600' },
                   { label: 'Perlu Dinilai', value: stats.tugasPending, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-orange-50 text-orange-600' },
                 ].map((s, i) => (
                   <motion.div
                    key={i}
                    variants={itemVariants}
                    className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden hover:shadow-md transition-all duration-300"
                   >
                      <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                        </svg>
                      </div>
                      <p className="text-4xl font-bold text-slate-900 mb-1 tracking-tight">{s.value}</p>
                      <p className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
                   </motion.div>
                 ))}
              </div>

              <motion.section variants={itemVariants} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                 <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Pengumpulan Terbaru</h3>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/50">
                             <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Siswa</th>
                             <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Tugas</th>
                             <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {recentSubmissions.map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors group">
                               <td className="px-8 py-5">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                                     {sub.profiles?.full_name[0]}
                                   </div>
                                   <span className="font-bold text-slate-900 text-sm">{sub.profiles?.full_name}</span>
                                 </div>
                               </td>
                               <td className="px-8 py-5 text-slate-500 font-medium text-sm">{sub.assignments?.title}</td>
                               <td className="px-8 py-5 text-right">
                                  <button className="px-4 py-2 bg-white border border-slate-100 text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm">Detail</button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
                 {recentSubmissions.length === 0 && (
                    <div className="py-20 text-center">
                       <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">Belum ada pengumpulan</p>
                    </div>
                 )}
              </motion.section>
            </motion.div>
          )}

          {activeTab === 'modules' && (
            <motion.div
              key="modules"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
               {myModules.map(m => (
                 <motion.div
                  key={m.id}
                  variants={itemVariants}
                  className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group"
                 >
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                         </svg>
                       </div>
                       <button
                        onClick={() => handleDeleteModule(m.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                         </svg>
                       </button>
                    </div>
                    <h4 className="font-bold text-slate-900 line-clamp-1 mb-1 tracking-tight">{m.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Diperbarui {new Date(m.created_at).toLocaleDateString('id-ID')}</p>
                    <a
                      href={m.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 text-center bg-slate-50 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all duration-300"
                    >
                      Buka Materi
                    </a>
                 </motion.div>
               ))}
               {myModules.length === 0 && (
                 <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Belum ada modul yang diunggah</p>
                 </div>
               )}
            </motion.div>
          )}

          {activeTab === 'assignments' && (
            <motion.div
              key="assignments"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
               {myAssignments.map(a => (
                 <motion.div
                  key={a.id}
                  variants={itemVariants}
                  className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-indigo-200 transition-all duration-300"
                 >
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                       </div>
                       <div>
                          <h4 className="text-xl font-bold text-slate-900 tracking-tight">{a.title}</h4>
                          <div className="flex flex-wrap gap-3 mt-2">
                             <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">{a.assignment_questions?.[0]?.count || 0} Pertanyaan</span>
                             <span className="px-3 py-1 bg-rose-50 text-rose-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">Deadline {new Date(a.deadline).toLocaleDateString('id-ID')}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <button
                        onClick={() => navigate(`/teacher/create-task?edit=${a.id}`)}
                        className="px-6 py-3 bg-white border border-slate-100 text-slate-900 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                       >
                        Edit
                       </button>
                       <button
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all duration-300"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                         </svg>
                       </button>
                    </div>
                 </motion.div>
               ))}
               {myAssignments.length === 0 && (
                 <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Belum ada tugas yang dibuat</p>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-20 pt-10 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">&copy; 2025 SuaraKu Platform</p>
        </footer>
      </main>
    </div>
  );
};

export default TeacherDashboard;
