import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import TeacherSidebar from '../../components/TeacherSidebar';
import StudentSidebar from '../../components/StudentSidebar';
import ParentSidebar from '../../components/ParentSidebar';

const Profile = () => {
  const { profile, logout, setProfile } = useAuthStore();
  const { speak } = useVoice();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(profile?.role === 'guru' ? 'identitas' : profile?.role === 'ortu' ? 'link' : 'aksesibilitas');

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
    if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
        return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      setMessage({ type: 'success', text: 'Password berhasil diubah!' });
      setNewPassword('');
    } else {
      setMessage({ type: 'error', text: error.message });
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
    : [
        { id: 'aksesibilitas', label: 'Profil Siswa', icon: '♿' },
        { id: 'id_siswa', label: 'ID Siswa', icon: '🆔' },
        { id: 'keamanan', label: 'Keamanan', icon: '🔐' }
      ];

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        {(activeTab === 'identitas' || activeTab === 'aksesibilitas') && (
          <motion.div
            key="identitas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm space-y-8"
          >
             <div>
               <h3 className="text-xl font-bold text-slate-900 tracking-tight">Informasi Profil</h3>
               <p className="text-sm text-slate-500 mt-1">Data identitas Anda di platform SuaraKu.</p>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900">
                    {profile?.full_name}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ID Akun</label>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 font-mono text-xs">
                    {profile?.id}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Peran Akun</label>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-bold text-indigo-600 capitalize">
                    {profile?.role} SuaraKu
                  </div>
                </div>
                {profile?.role === 'siswa' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Total XP</label>
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl font-bold text-amber-600">
                      ✨ {profile?.xp || 0} XP
                    </div>
                  </div>
                )}
             </div>
          </motion.div>
        )}

        {activeTab === 'keamanan' && (
          <motion.div
            key="keamanan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm space-y-8"
          >
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">🛡️</div>
               <div>
                 <h3 className="text-xl font-bold text-slate-900 tracking-tight">Keamanan Akun</h3>
                 <p className="text-sm text-slate-500">Kelola kata sandi dan akses akun Anda.</p>
               </div>
             </div>

             <div className="space-y-6 max-w-md pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {saving ? 'Memproses...' : 'Perbarui Password'}
                </button>
             </div>

             {message && (
                <p className={`text-sm font-bold ${message.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {message.text}
                </p>
             )}

             <div className="pt-10 border-t border-slate-100">
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">Keluar Sesi</h4>
                    <p className="text-xs text-rose-600 font-medium">Akhiri sesi Anda di perangkat ini.</p>
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/auth'); }}
                    className="px-6 py-2.5 bg-rose-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all"
                  >
                    Logout
                  </button>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'id_siswa' && profile?.role === 'siswa' && (
          <motion.div
            key="id_siswa"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 text-center space-y-8"
          >
             <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto">🆔</div>
             <div>
               <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">ID Unik Siswa</h3>
               <p className="text-slate-400 font-medium mt-2">Berikan kode ini kepada Orang Tua untuk menghubungkan akun.</p>
             </div>

             <div className="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-6">
                <code className="text-xl md:text-2xl font-bold text-indigo-600 tracking-wider break-all block">
                  {showId ? profile.id : "••••••••-••••-••••-••••"}
                </code>
                <div className="flex justify-center gap-3">
                   <button
                    onClick={() => setShowId(!showId)}
                    className="px-6 py-2.5 bg-white text-slate-600 rounded-xl font-bold text-xs border border-slate-200 hover:bg-slate-50 transition-all"
                   >
                      {showId ? 'Sembunyikan' : 'Lihat'}
                   </button>
                   <button
                    onClick={() => copyToClipboard(profile.id)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                   >
                      Salin ID
                   </button>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'link' && profile?.role === 'ortu' && (
          <motion.div
            key="link"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm space-y-8"
          >
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">🔗</div>
               <div>
                 <h3 className="text-xl font-bold text-slate-900 tracking-tight">Hubungkan Akun Anak</h3>
                 <p className="text-sm text-slate-500">Pantau perkembangan belajar anak dengan menghubungkan akun.</p>
               </div>
             </div>

             <div className="space-y-6 max-w-md pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ID Unik Siswa</label>
                  <input
                    type="text"
                    value={studentIdInput}
                    onChange={e => setStudentIdInput(e.target.value)}
                    placeholder="Masukkan ID anak..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password Akun Anak</label>
                  <input
                    type="password"
                    value={studentPassword}
                    onChange={e => setStudentPassword(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder="Konfirmasi password anak"
                  />
                </div>
                <button
                  onClick={handleLinkStudent}
                  disabled={saving}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {saving ? 'Menghubungkan...' : 'Hubungkan Sekarang'}
                </button>
                {message && <p className={`text-center font-bold text-sm ${message.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>{message.text}</p>}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Tampilan Dashboard Layout (Guru, Siswa, Ortu)
  if (profile?.role === 'guru' || profile?.role === 'siswa' || profile?.role === 'ortu') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100">
        {profile.role === 'guru' ? <TeacherSidebar /> : profile.role === 'siswa' ? <StudentSidebar /> : <ParentSidebar />}
        <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
          <header className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Profil</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Kelola identitas dan keamanan akun Anda.</p>
          </header>

          <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl w-fit mb-10 shadow-sm overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-w-4xl">
            {renderContent()}
          </div>
        </main>
      </div>
    );
  }

  // Fallback (jika role tidak terdeteksi)
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <button onClick={() => { logout(); navigate('/auth'); }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold">
        Session Expired - Kembali Masuk
      </button>
    </div>
  );
};

export default Profile;
