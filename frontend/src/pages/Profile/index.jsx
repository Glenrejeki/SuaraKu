import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import XPBar from '../../components/XPBar';
import StreakBadge from '../../components/StreakBadge';

const Profile = () => {
  const { profile, logout, setProfile } = useAuthStore();
  const { speak } = useVoice();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(profile?.role === 'guru' ? 'keamanan' : profile?.role === 'ortu' ? 'link' : 'aksesibilitas');

  const [studentIdInput, setStudentIdInput] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [showId, setShowId] = useState(false);

  const handleLinkStudent = async () => {
    if (!studentIdInput || !studentPassword) return;
    setSaving(true);
    try {
      const { data: student, error: stError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', studentIdInput)
        .eq('role', 'siswa')
        .single();

      if (stError || !student) throw new Error("ID Siswa tidak ditemukan");

      const { error } = await supabase
        .from('profiles')
        .update({
          linked_student_id: student.id,
          student_password_hash: studentPassword
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, linked_student_id: student.id });
      setMessage({ type: 'success', text: 'Berhasil Dihubungkan! 🎉' });
      setTimeout(() => navigate('/parent/dashboard'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      setMessage({ type: 'success', text: 'Password berhasil diubah!' });
      setNewPassword('');
    }
    setSaving(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    speak("ID berhasil disalin ke papan klip");
    alert("ID Berhasil Disalin!");
  };

  const tabs = profile?.role === 'ortu'
    ? [{ id: 'link', label: 'Hubungkan Anak', icon: '🔗' }, { id: 'keamanan', label: 'Keamanan', icon: '🔐' }]
    : profile?.role === 'guru'
    ? [{ id: 'identitas', label: 'Profil Guru', icon: '👨‍🏫' }, { id: 'keamanan', label: 'Keamanan', icon: '🛡️' }]
    : [{ id: 'aksesibilitas', label: 'Aksesibilitas', icon: '♿' }, { id: 'progress', label: 'Kemajuan', icon: '🔥' }, { id: 'id_siswa', label: 'ID Siswa', icon: '🆔' }, { id: 'keamanan', label: 'Keamanan', icon: '🔐' }];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      <header className={`pt-20 pb-40 px-6 relative overflow-hidden transition-all duration-700 ${profile?.role === 'ortu' ? 'bg-indigo-900' : profile?.role === 'guru' ? 'bg-slate-900' : 'bg-gradient-to-br from-purple-600 to-indigo-700'}`}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="w-40 h-40 rounded-[3.5rem] bg-white p-1.5 shadow-2xl flex items-center justify-center text-6xl font-black text-slate-900">
            {profile?.full_name?.[0]}
          </div>
          <div className="text-center md:text-left text-white">
            <h1 className="text-5xl font-black tracking-tight mb-4">{profile?.full_name}</h1>
            <span className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">Peran: {profile?.role}</span>
          </div>
          <button onClick={() => navigate(-1)} className="md:ml-auto w-14 h-14 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-3xl flex items-center justify-center transition-all backdrop-blur-lg text-2xl">✕</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 -mt-20 relative z-20">
        <div className="flex bg-white/80 backdrop-blur-xl p-2 rounded-[2.5rem] shadow-2xl border border-white/20 mb-10 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-5 px-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'id_siswa' && profile?.role === 'siswa' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 text-center">
               <div className="w-20 h-20 bg-purple-600 text-white rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6">🆔</div>
               <h3 className="text-2xl font-black text-slate-900 uppercase">ID Unik Siswa</h3>
               <p className="text-slate-400 font-bold mt-2 mb-10">Berikan kode ini kepada Orang Tua Anda untuk menghubungkan akun.</p>
               <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 relative group">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Salin Kode Berikut:</p>
                  <code className="text-2xl md:text-3xl font-black text-purple-600 tracking-wider break-all px-4">
                    {showId ? profile.id : "••••••••-••••-••••-••••"}
                  </code>
                  <div className="mt-8 flex justify-center gap-4">
                     <button onClick={() => setShowId(!showId)} className="px-6 py-3 bg-white text-slate-600 rounded-xl font-black text-xs uppercase border border-slate-200 hover:bg-slate-100 transition-all">
                        {showId ? 'Sembunyikan' : 'Lihat Kode'}
                     </button>
                     <button onClick={() => copyToClipboard(profile.id)} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-purple-100 active:scale-95 transition-all">
                        Salin ID
                     </button>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'link' && profile?.role === 'ortu' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
               <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">Hubungkan ke Akun Anak</h3>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Masukkan ID Unik Siswa</label>
                    <input type="text" value={studentIdInput} onChange={e => setStudentIdInput(e.target.value)} placeholder="Contoh: xxxx-xxxx-xxxx" className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password Akun Anak</label>
                    <input type="password" value={studentPassword} onChange={e => setStudentPassword(e.target.value)} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold" placeholder="Konfirmasi password anak" />
                  </div>
                  <button onClick={handleLinkStudent} disabled={saving} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl">{saving ? 'Memproses...' : 'Hubungkan Sekarang'}</button>
                  {message && <p className={`text-center font-black uppercase text-xs ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{message.text}</p>}
               </div>
            </motion.div>
          )}

          {activeTab === 'keamanan' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
               <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">Pengaturan Akun</h3>
               <div className="space-y-6">
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Ganti Password Baru" className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold" />
                  <button onClick={handleChangePassword} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest">Update Password</button>
                  <button onClick={() => { logout(); navigate('/auth'); }} className="w-full py-6 text-rose-600 font-black uppercase tracking-widest border-2 border-rose-100 rounded-3xl mt-12 hover:bg-rose-50 transition-all">Logout Permanen</button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Profile;
