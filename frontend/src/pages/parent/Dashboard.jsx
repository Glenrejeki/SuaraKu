import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import XPBar from '../../components/XPBar';
import StreakBadge from '../../components/StreakBadge';
import ParentSidebar from '../../components/ParentSidebar';

const ParentDashboard = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [childData, setChildData] = useState(null);
  const [childSubmissions, setChildSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    if (profile?.linked_student_id) {
      fetchChildData();
    }
  }, [profile]);

  const fetchChildData = async () => {
    setLoading(true);
    try {
      const { data: student } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.linked_student_id)
        .single();

      if (student) setChildData(student);

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

  const onTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  if (!profile?.linked_student_id) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center"
        >
           <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-sm">
             🔗
           </div>
           <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Belum Terhubung</h2>
           <p className="text-slate-500 font-medium mt-4 mb-8 leading-relaxed text-sm">Silakan hubungkan akun Anda dengan ID profil siswa (anak) di halaman pengaturan.</p>
           <button
             onClick={() => navigate('/profile')}
             className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
           >
             Hubungkan Akun Anak
           </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100">
      <ParentSidebar activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto h-screen flex flex-col">
        <div className="flex-1">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
             <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Halo, Pak/Bu {profile?.full_name?.split(' ')[0]}!</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Laporan belajar {childData?.full_name} terbaru.</p>
             </div>
             <div className="flex gap-4">
                <div className="px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                   <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-sm">🎓</div>
                   <div className="hidden sm:block">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Profil Siswa</p>
                      <p className="text-xs font-bold text-slate-800">{childData?.full_name}</p>
                   </div>
                </div>
             </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                       <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Pencapaian XP (Level {Math.floor((childData?.xp || 0) / 1000) + 1})</h3>
                       <XPBar current={childData?.xp || 0} nextLevel={1000} level={Math.floor((childData?.xp || 0) / 1000) + 1} />
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                       <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Konsistensi Belajar</h3>
                       <StreakBadge days={childData?.streak || 0} />
                    </div>
                 </div>

                 <section className="bg-slate-900 p-10 rounded-3xl text-white relative overflow-hidden group shadow-xl shadow-slate-200">
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                       <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shrink-0">🤖</div>
                       <div>
                          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-3">AI Intelligence Report</h4>
                          <p className="text-lg font-medium leading-relaxed italic text-slate-200">
                             "{childData?.full_name} saat ini memiliki total {childData?.xp || 0} XP. {childData?.streak > 0 ? `${childData.full_name} sudah belajar ${childData.streak} hari berturut-turut. Ini adalah pencapaian yang sangat baik!` : 'Ajak anak Anda untuk mulai petualangan belajar hari ini.'}"
                          </p>
                       </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 opacity-10 rounded-full blur-[100px]" />
                 </section>

                 <section className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Hasil Tugas Terbaru</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {childSubmissions.slice(0, 3).map((sub) => (
                        <div key={sub.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all duration-300">
                           <h4 className="font-bold text-slate-900 line-clamp-1 mb-1 text-sm tracking-tight">{sub.assignments?.title}</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
                             Selesai {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                           </p>
                           <div className="flex items-end justify-between">
                              <div>
                                 <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Skor</p>
                                 <p className="text-3xl font-bold text-slate-900">{sub.total_score || 0}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${sub.total_score >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                 {sub.total_score >= 80 ? 'Sangat Baik' : 'Bagus'}
                              </span>
                           </div>
                        </div>
                      ))}
                      {childSubmissions.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100">
                           <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Belum ada riwayat tugas</p>
                        </div>
                      )}
                    </div>
                 </section>
            </motion.div>
          )}

          {activeTab === 'history' && (
             <motion.div
               key="history"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
             >
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50/50">
                           <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Judul Tugas</th>
                           <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 text-center">Skor Akhir</th>
                           <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 text-right">Tanggal Selesai</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {childSubmissions.map(sub => (
                          <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors group">
                             <td className="px-8 py-6 font-bold text-slate-900 text-sm tracking-tight">{sub.assignments?.title}</td>
                             <td className="px-8 py-6 text-center">
                                <span className="text-xl font-bold text-slate-900">{sub.total_score || 0}</span>
                             </td>
                             <td className="px-8 py-6 text-right font-bold text-slate-400 text-[10px] uppercase tracking-widest">
                                {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                             </td>
                          </tr>
                        ))}
                        {childSubmissions.length === 0 && (
                          <tr><td colSpan="3" className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">Belum ada riwayat tugas</td></tr>
                        )}
                     </tbody>
                  </table>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
        </div>

        <footer className="mt-24 py-10 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-80">
            @2026 Suaraku.Developed oleh Christian Johannes Hutahaean Dan Glen Rejeki Sitorus
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ParentDashboard;
