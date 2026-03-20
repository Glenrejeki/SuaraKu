import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('siswa');
  const [disabilityType, setDisabilityType] = useState('tidak_ada');
  const [message, setMessage] = useState(null);

  const [studentIdInput, setStudentIdInput] = useState('');

  const navigate = useNavigate();
  const { setUser, setProfile } = useAuthStore();
  const { speak } = useVoice();

  useEffect(() => {
    setMessage(null);
    speak(isLogin ? "Silakan masuk ke akun SuaraKu kamu." : "Silakan daftar akun baru di SuaraKu.");
  }, [isLogin]);

  const validateEmail = (email) => {
    return email.toLowerCase().trim().endsWith('@gmail.com');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();

    if (!validateEmail(cleanEmail)) {
      const errMsg = "Gunakan email @gmail.com";
      setMessage(errMsg);
      speak(errMsg);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) throw new Error("Email atau kata sandi salah");

        setUser(data.user);

        // Ambil Profil
        let { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        // Self-healing jika profil belum tercipta di database
        if (!profileData) {
          const metadata = data.user.user_metadata || {};
          const fallback = {
            id: data.user.id,
            full_name: metadata.full_name || cleanEmail.split('@')[0],
            role: metadata.role || 'siswa',
            disability_type: metadata.disability_type || 'tidak_ada'
          };

          try {
            const { data: newP } = await supabase.from('profiles').upsert(fallback).select().single();
            profileData = newP || fallback;
          } catch (err) {
            profileData = fallback;
          }
        }

        setProfile(profileData);
        const targetPath = profileData.role === 'guru' ? '/teacher/dashboard' :
                           profileData.role === 'ortu' ? '/parent/dashboard' :
                           '/student/dashboard';
        navigate(targetPath);

      } else {
        // --- REGISTER ---
        let linkedId = null;
        if (role === 'ortu') {
          if (!studentIdInput) throw new Error("ID Siswa tidak boleh kosong");

          const cleanId = studentIdInput.trim();

          // Verifikasi ID Siswa
          const { data: child, error: childError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', cleanId)
            .maybeSingle();

          if (childError) {
            console.error("Verification Error:", childError);
            if (childError.message.includes('recursion')) {
                throw new Error("Sistem Database Sibuk (Recursion). Harap hubungi Admin untuk reset SQL Policy.");
            }
            throw new Error(`Gagal verifikasi: ${childError.message}`);
          }

          if (!child) {
            throw new Error("ID Siswa tidak ditemukan! Pastikan ID benar.");
          }
          linkedId = child.id;
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: fullName,
              role,
              disability_type: disabilityType,
              linked_student_id: linkedId
            }
          }
        });

        if (error) throw new Error(error.message);

        if (data.user) {
          setMessage("Daftar berhasil! Mempersiapkan akun...");
          speak("Daftar berhasil. Silakan masuk.");

          // Buat profil manual segera
          await supabase.from('profiles').insert([{
            id: data.user.id,
            full_name: fullName,
            role: role,
            disability_type: disabilityType,
            linked_student_id: linkedId
          }]).select();

          setIsLogin(true);
        }
      }
    } catch (error) {
      setMessage(error.message);
      speak(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-50 blur-[150px] rounded-full opacity-70" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-50 blur-[150px] rounded-full opacity-70" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl bg-white/70 backdrop-blur-xl shadow-[0_40px_120px_rgba(100,100,255,0.1)] rounded-none md:rounded-[4rem] flex flex-col lg:flex-row overflow-hidden min-h-[100vh] md:min-h-[85vh] border border-white z-10"
      >
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 p-20 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
          <div className="relative z-10">
            <h1 className="text-7xl font-black text-white mb-8 tracking-tighter">Suara<span className="text-white/70">Ku</span></h1>
            <p className="text-4xl text-white font-bold leading-tight max-w-md drop-shadow-md">Belajar Tanpa Batas, Untuk Masa Depan Inklusif.</p>
          </div>
          <div className="relative z-10">
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2.5rem] bg-white/20 flex items-center justify-center text-4xl shadow-xl border border-white/30">🚀</div>
                <div>
                   <p className="text-white font-black text-2xl uppercase">Teknologi SLB</p>
                   <p className="text-white/80 font-medium">Platform belajar mandiri tercanggih.</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-white/40 relative">
          <div className="max-w-md mx-auto w-full">
            <header className="mb-14 text-center lg:text-left">
              <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">{isLogin ? 'Selamat Datang' : 'Buat Akun'}</h2>
              <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px]">Portal Edukasi Terpadu Indonesia</p>
            </header>

            <AnimatePresence>
              {message && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`mb-10 p-6 rounded-[2.5rem] text-sm font-black flex items-center gap-4 ${message.includes('berhasil') || message.includes('Daftar') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                  <span>{message.includes('berhasil') || message.includes('Daftar') ? '🎉' : '⚠️'}</span>{message}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-6">
              {!isLogin && (
                <input
                  type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-8 py-5 rounded-[2rem] bg-slate-100/50 border-2 border-transparent focus:border-purple-500 outline-none font-bold transition-all text-slate-800"
                  placeholder="Nama Lengkap"
                />
              )}

              <input
                type="text" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-8 py-5 rounded-[2rem] bg-slate-100/50 border-2 border-transparent focus:border-purple-500 outline-none font-bold transition-all text-slate-800"
                placeholder="Email (@gmail.com)"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-8 py-5 rounded-[2rem] bg-slate-100/50 border-2 border-transparent focus:border-purple-500 outline-none font-bold transition-all text-slate-800"
                  placeholder="Kata Sandi"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl opacity-30 hover:opacity-100 transition-all">{showPassword ? '👁️' : '🙈'}</button>
              </div>

              {!isLogin && (
                <div className="space-y-8 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 ml-4 uppercase">Peran</p>
                       <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-100/50 border-none font-bold text-slate-700 outline-none">
                          <option value="siswa">Siswa</option>
                          <option value="guru">Guru</option>
                          <option value="ortu">Orang Tua</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 ml-4 uppercase">Kebutuhan</p>
                       <select value={disabilityType} onChange={(e) => setDisabilityType(e.target.value)} className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-100/50 border-none font-bold text-slate-700 outline-none">
                          <option value="tidak_ada">Umum</option>
                          <option value="tunanetra">Tunanetra</option>
                          <option value="tunarungu">Tunarungu</option>
                          <option value="tunawicara">Tunawicara</option>
                       </select>
                    </div>
                  </div>

                  {role === 'ortu' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-8 bg-indigo-50/50 rounded-[3rem] border-2 border-indigo-100 shadow-xl">
                       <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest text-center">Hubungkan Anak</h4>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-indigo-400 ml-4 uppercase">Masukkan ID Siswa</label>
                          <input
                            required value={studentIdInput} onChange={(e) => setStudentIdInput(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-white border-none font-bold text-slate-700 outline-none shadow-sm focus:ring-4 focus:ring-indigo-100"
                            placeholder="Tempel ID Siswa..."
                          />
                       </div>
                    </motion.div>
                  )}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-6 bg-slate-900 text-white font-black text-xl rounded-[2.5rem] shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 mt-4 uppercase tracking-widest"
              >
                {loading ? 'MEMPROSES...' : isLogin ? 'MASUK SEKARANG' : 'DAFTAR SEKARANG'}
              </button>
            </form>

            <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-12 text-slate-400 font-black hover:text-indigo-600 transition-all text-xs uppercase tracking-widest group">
              {isLogin ? <>Belum punya akun? <span className="text-indigo-600 group-hover:underline">Daftar Di Sini</span></> : <>Sudah ada akun? <span className="text-indigo-600 group-hover:underline">Masuk Di Sini</span></>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
