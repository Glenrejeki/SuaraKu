import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import XPBar from '../../components/XPBar';
import StreakBadge from '../../components/StreakBadge';

const ParentDashboard = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [childData, setChildData] = useState(null);
  const [childSubmissions, setChildSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, history

  useEffect(() => {
    if (profile?.linked_student_id) {
      fetchChildData();
    }
  }, [profile]);

  const fetchChildData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile Anak
      const { data: student } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.linked_student_id)
        .single();

      if (student) setChildData(student);

      // 2. Fetch Riwayat Tugas Riil
      const { data: subs } = await supabase
        .from('submissions')
        .select('*, assignments(title)')
        .eq('student_id', profile.linked_student_id)
        .order('submitted_at', { ascending: false });

      if (subs) setChildSubmissions(subs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.linked_student_id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-xl text-center border border-slate-100">
           <div className="text-6xl mb-6">🔒</div>
           <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Akun Belum Terhubung</h2>
           <p className="text-slate-400 font-bold mt-4 mb-8 leading-relaxed">Silakan hubungkan akun Anda dengan profil siswa (anak) di halaman pengaturan untuk melihat laporan belajar.</p>
           <button onClick={() => navigate('/profile')} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Hubungkan Sekarang</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Sidebar Ortu - Elegant Laptop Style */}
      <aside className="w-80 bg-white border-r border-slate-100 p-10 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="mb-16">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Suara<span className="text-purple-600">Ku</span></h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Parent Intelligence Portal</p>
        </div>

        <nav className="space-y-4 flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-4 p-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            📊 Ringkasan Belajar
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-4 p-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            📝 Riwayat Tugas
          </button>
          <button
            onClick={() => navigate('/parent/chat')}
            className="w-full flex items-center gap-4 p-5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-3xl font-black text-xs uppercase tracking-widest transition-all"
          >
            💬 Konsultasi Guru
          </button>
        </nav>

        <div className="pt-8 border-t border-slate-50">
           <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-4 p-5 bg-slate-50 text-slate-600 rounded-3xl border border-slate-100 hover:border-purple-200 transition-all group">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-sm font-black">{profile?.full_name?.[0]}</div>
              <div className="text-left">
                 <p className="text-xs font-black truncate max-w-[120px]">{profile?.full_name?.split(' ')[0]}</p>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Akun Orang Tua</p>
              </div>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto">
        <header className="flex justify-between items-center mb-16">
           <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Halo, Pak/Bu {profile?.full_name?.split(' ')[0]}!</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Memantau Perkembangan {childData?.full_name}</p>
           </div>
           <div className="flex gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">🎓</div>
                 <div className="hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Anak</p>
                    <p className="text-sm font-black text-slate-800">{childData?.full_name}</p>
                 </div>
              </div>
           </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
               {/* Stats Anak */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Pencapaian XP (Level {Math.floor((childData?.xp || 0) / 1000) + 1})</h3>
                     <XPBar current={childData?.xp || 0} nextLevel={1000} level={Math.floor((childData?.xp || 0) / 1000) + 1} />
                  </div>
                  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Konsistensi Belajar</h3>
                     <StreakBadge days={childData?.streak || 0} />
                  </div>
               </div>

               {/* Insight AI Riil */}
               <section className="bg-slate-900 p-12 rounded-[4rem] text-white relative overflow-hidden group">
                  <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                     <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center text-5xl shadow-inner border border-white/5 group-hover:rotate-12 transition-transform duration-500">🤖</div>
                     <div>
                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-4">AI Intelligence Report</h4>
                        <p className="text-2xl font-bold leading-relaxed italic max-w-2xl">
                           "{childData?.full_name} saat ini memiliki total {childData?.xp || 0} XP. {childData?.streak > 0 ? `Hebat! ${childData.full_name} sudah belajar ${childData.streak} hari berturut-turut.` : 'Dorong anak Anda untuk mulai belajar hari ini!'}"
                        </p>
                     </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 opacity-10 rounded-full blur-[100px]" />
               </section>

               {/* Recent Real Tasks */}
               <section className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Hasil Tugas Terbaru</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {childSubmissions.slice(0, 3).map((sub, i) => (
                      <div key={sub.id} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-purple-200 transition-all">
                         <h4 className="font-black text-slate-800 line-clamp-1 mb-2">{sub.assignments?.title}</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
                           {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                         </p>
                         <div className="flex items-end justify-between">
                            <div>
                               <p className="text-[10px] font-black text-purple-600 uppercase mb-1">Skor Akhir</p>
                               <p className="text-4xl font-black text-slate-900">{sub.total_score || 0}</p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${sub.total_score >= 80 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                               {sub.total_score >= 80 ? 'Sangat Baik' : 'Cukup'}
                            </span>
                         </div>
                      </div>
                    ))}
                    {childSubmissions.length === 0 && (
                      <div className="col-span-full py-12 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                         <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Belum ada tugas yang dikerjakan</p>
                      </div>
                    )}
                  </div>
               </section>
            </motion.div>
          )}

          {activeTab === 'history' && (
             <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="px-12 py-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Judul Tugas</th>
                         <th className="px-12 py-6 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Skor</th>
                         <th className="px-12 py-6 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Tanggal Selesai</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {childSubmissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-12 py-8 font-black text-slate-800">{sub.assignments?.title}</td>
                           <td className="px-12 py-8 text-center">
                              <span className="text-2xl font-black text-slate-900">{sub.total_score || 0}</span>
                           </td>
                           <td className="px-12 py-8 text-right font-bold text-slate-400 text-xs">
                              {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                           </td>
                        </tr>
                      ))}
                      {childSubmissions.length === 0 && (
                        <tr><td colSpan="3" className="py-20 text-center text-slate-300 font-black uppercase tracking-[0.5em]">No Data History</td></tr>
                      )}
                   </tbody>
                </table>
             </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ParentDashboard;
