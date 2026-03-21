import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import TeacherSidebar from '../../components/TeacherSidebar';

const TeacherDashboard = () => {
  const { profile, fetchProfile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalModul: 0,
    tugasPending: 0,
    avgScore: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [myModules, setMyModules] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [xpModal, setXpModal] = useState({ show: false, student: null, amount: 10 });

  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'summary';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = queryParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

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

  const fetchAssignmentDetails = async (assignment) => {
    setSelectedAssignment(assignment);
    setSubLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, profiles(id, full_name, xp), submission_answers(id, is_correct, points_earned)')
        .eq('assignment_id', assignment.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setAssignmentSubmissions(data || []);
      setActiveTab('assignment_detail');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubLoading(false);
    }
  };

  const handleManualXP = async () => {
    if (!xpModal.student) return;
    try {
      const newXP = (xpModal.student.xp || 0) + parseInt(xpModal.amount);
      const { error } = await supabase
        .from('profiles')
        .update({ xp: newXP })
        .eq('id', xpModal.student.id);

      if (error) throw error;

      // Update local state
      setAssignmentSubmissions(prev => prev.map(s =>
        s.profiles.id === xpModal.student.id
        ? { ...s, profiles: { ...s.profiles, xp: newXP } }
        : s
      ));

      alert(`Berhasil menambah ${xpModal.amount} XP untuk ${xpModal.student.full_name}`);
      setXpModal({ show: false, student: null, amount: 10 });
    } catch (err) {
      alert(err.message);
    }
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
      <TeacherSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto h-screen flex flex-col">
        <div className="flex-1">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/profile')} className="lg:hidden w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-xl">👤</button>
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Halo, Pak/Bu {profile?.full_name?.split(' ')[0]}!</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">{profile?.subject || 'Umum'}</span>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Laporan Aktivitas Belajar Terkini</p>
                  </div>
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
                {/* AI Intelligence Report Section */}
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

            {activeTab === 'assignments' && (
              <motion.div key="assignments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                 {myAssignments.map(a => (
                   <div key={a.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl font-black">📝</div>
                       <div>
                          <div className="flex items-center gap-2">
                             <h4 className="text-xl font-black text-slate-800">{a.title}</h4>
                             {a.is_public === false && <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black uppercase rounded">Private</span>}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2">
                             <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{a.assignment_questions?.[0]?.count || 0} Soal</span>
                             <span className="px-3 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest">Deadline: {new Date(a.deadline).toLocaleDateString('id-ID')}</span>
                             {a.short_id && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-200">ID: {a.short_id}</span>}
                             {a.enroll_key && <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">Key: {a.enroll_key}</span>}
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => fetchAssignmentDetails(a)} className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Lihat Hasil</button>
                       <button onClick={() => navigate(`/teacher/create-task?edit=${a.id}`)} className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all">Edit</button>
                       <button onClick={() => handleDeleteAssignment(a.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">🗑️</button>
                    </div>
                 </div>
               ))}
            </motion.div>
            )}

            {activeTab === 'assignment_detail' && selectedAssignment && (
              <motion.div key="assign_detail" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <header className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <button onClick={() => setActiveTab('assignments')} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">←</button>
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedAssignment.title}</h3>
                         <div className="flex gap-2 mt-1">
                            {selectedAssignment.short_id && <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">ID Kursus: {selectedAssignment.short_id}</span>}
                            {selectedAssignment.enroll_key && <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Enroll Key: {selectedAssignment.enroll_key}</span>}
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pengerjaan</p>
                         <p className="text-xl font-black text-slate-900">{assignmentSubmissions.length} Siswa</p>
                      </div>
                   </div>
                </header>

                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-slate-50/50">
                            <th className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Siswa</th>
                            <th className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                            <th className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Benar / Salah</th>
                            <th className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Skor Akhir</th>
                            <th className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Total XP</th>
                            <th className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {assignmentSubmissions.map(sub => {
                           const correct = sub.submission_answers?.filter(a => a.is_correct).length || 0;
                           const wrong = (sub.submission_answers?.length || 0) - correct;
                           return (
                             <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-10 py-6">
                                   <p className="font-bold text-slate-800">{sub.profiles?.full_name}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(sub.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                                </td>
                                <td className="px-10 py-6 text-center">
                                   <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">Selesai</span>
                                </td>
                                <td className="px-10 py-6 text-center">
                                   <div className="flex items-center justify-center gap-3">
                                      <span className="text-emerald-500 font-black">{correct} ✅</span>
                                      <span className="text-rose-500 font-black">{wrong} ❌</span>
                                   </div>
                                </td>
                                <td className="px-10 py-6 text-center">
                                   <span className="text-xl font-black text-slate-900">{sub.total_score}</span>
                                </td>
                                <td className="px-10 py-6 text-center">
                                   <span className="font-black text-indigo-600">{sub.profiles?.xp} XP</span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                   <button
                                     onClick={() => setXpModal({ show: true, student: sub.profiles, amount: 10 })}
                                     className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all"
                                   >
                                     + Bonus XP
                                   </button>
                                </td>
                             </tr>
                           );
                         })}
                      </tbody>
                   </table>
                   {assignmentSubmissions.length === 0 && (
                      <div className="py-20 text-center">
                         <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada siswa yang mengerjakan tugas ini.</p>
                      </div>
                   )}
                </div>
              </motion.div>
            )}

            {activeTab === 'modules' && (
              <motion.div key="modules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {myModules.map(m => (
                   <div key={m.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-4">
                         <span className="text-2xl">📄</span>
                         <div className="flex gap-2">
                           {m.is_public === false && <span className="px-2 py-1 bg-rose-50 text-rose-500 text-[8px] font-black uppercase rounded">Private</span>}
                           <button onClick={() => handleDeleteModule(m.id)} className="text-red-400 hover:text-red-600 transition-colors">🗑️</button>
                         </div>
                      </div>
                      <h4 className="font-black text-slate-800 line-clamp-1">{m.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{new Date(m.created_at).toLocaleDateString('id-ID')}</p>
                      {m.short_id && <p className="text-[9px] text-amber-600 font-black mb-1 uppercase">ID Kursus: {m.short_id}</p>}
                      {m.enroll_key && <p className="text-[9px] text-blue-600 font-black mb-4 uppercase">Enroll Key: {m.enroll_key}</p>}
                      <a href={m.pdf_url} target="_blank" rel="noreferrer" className="block w-full py-3 text-center bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Buka PDF</a>
                   </div>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Manual XP Modal */}
        <AnimatePresence>
          {xpModal.show && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setXpModal({ show: false, student: null, amount: 10 })} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full space-y-8">
                  <div className="text-center">
                     <span className="text-4xl block mb-4">✨</span>
                     <h3 className="text-xl font-black text-slate-900 uppercase">Tambah Bonus XP</h3>
                     <p className="text-slate-500 font-bold text-xs mt-2 uppercase">Untuk {xpModal.student?.full_name}</p>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah XP</label>
                     <input
                       type="number"
                       value={xpModal.amount}
                       onChange={e => setXpModal({...xpModal, amount: e.target.value})}
                       className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-2xl text-center text-indigo-600 outline-none focus:border-indigo-500 transition-all"
                     />
                  </div>
                  <button
                    onClick={handleManualXP}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Kirim Bonus Sekarang
                  </button>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="mt-12 py-10 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-80">
            @2026 Suaraku.Developed oleh Christian Johannes Hutahaean Dan Glen Rejeki Sitorus
          </p>
        </footer>
      </main>
    </div>
  );
};

export default TeacherDashboard;
