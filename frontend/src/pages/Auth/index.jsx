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
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState(null);
  const [studentIdInput, setStudentIdInput] = useState('');

  const navigate = useNavigate();
  const { setUser, setProfile, fetchProfile } = useAuthStore();
  const { speak } = useVoice();

  useEffect(() => {
    setMessage(null);
    speak(isLogin ? "Silakan masuk ke akun SuaraKu kamu." : "Silakan daftar akun baru di SuaraKu.");
  }, [isLogin]);

  // Reset disability type if role is not student
  useEffect(() => {
    if (role !== 'siswa') {
      setDisabilityType('tidak_ada');
    }
    if (role !== 'guru') {
      setSubject('');
    }
  }, [role]);

  const validateEmail = (email) => email.toLowerCase().trim().endsWith('@gmail.com');

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
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) throw new Error("Email atau kata sandi salah");

        setUser(data.user);
        const profileData = await fetchProfile(data.user.id);

        if (!profileData) {
            const metadata = data.user.user_metadata || {};
            const fallbackProfile = {
                id: data.user.id,
                full_name: metadata.full_name || cleanEmail.split('@')[0],
                role: metadata.role || 'siswa',
                disability_type: metadata.disability_type || 'tidak_ada',
                subject: metadata.subject || '',
                xp: 0
            };
            setProfile(fallbackProfile);
            navigate(fallbackProfile.role === 'guru' ? '/teacher/dashboard' : fallbackProfile.role === 'ortu' ? '/parent/dashboard' : '/student/dashboard');
        } else {
            const targetPath = profileData.role === 'guru' ? '/teacher/dashboard' :
                               profileData.role === 'ortu' ? '/parent/dashboard' :
                               '/student/dashboard';
            navigate(targetPath);
        }

      } else {
        let linkedId = null;
        if (role === 'ortu') {
          if (!studentIdInput) throw new Error("ID Siswa tidak boleh kosong");
          const { data: child, error: childError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', studentIdInput.trim())
            .maybeSingle();

          if (childError || !child) throw new Error("ID Siswa tidak ditemukan!");
          linkedId = child.id;
        }

        if (role === 'guru' && !subject) {
          throw new Error("Mata Pelajaran harus dipilih!");
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: fullName,
              role,
              disability_type: disabilityType,
              subject: subject,
              linked_student_id: linkedId
            }
          }
        });

        if (error) throw new Error(error.message);

        if (data.user) {
          setMessage("Daftar berhasil! Silakan masuk.");
          speak("Daftar berhasil. Silakan masuk.");
          await supabase.from('profiles').insert([{
            id: data.user.id,
            full_name: fullName,
            role: role,
            disability_type: disabilityType,
            subject: subject,
            linked_student_id: linkedId,
            xp: 0
          }]);
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

  const subjects = [
    "Matematika", "Bahasa Indonesia", "Bahasa Inggris", "IPA", "IPS", "Seni Budaya", "PJOK", "Lainnya"
  ];

  return (
    <div className="min-h-screen flex font-sans bg-[#FAFAFA]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("https://images.pexels.com/photos/1586981/pexels-photo-1586981.jpeg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-white/40 z-10" />

        <div className="relative z-20 w-full flex flex-col justify-between p-16">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group w-fit"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Suara<span className="text-indigo-600">Ku</span></span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl"
          >
            <h2 className="text-5xl font-bold mb-8 leading-[1.2] text-slate-900">
              Platform course berbasis AI yang dirancang untuk membantu anak tunanetra, tunarungu, dan tunawicara belajar dengan lebih mudah.
            </h2>
            <p className="text-xl text-slate-700 leading-relaxed font-semibold">
              Melalui dukungan suara, visual, dan interaksi cerdas yang menyesuaikan kebutuhan mereka menuju masa depan.
            </p>
          </motion.div>

          <div className="text-sm text-slate-600 font-bold">
            @2026 SuaraKu.Developed oleh Christian Johannes Hutahaean Dan Glen Rejeki Sitorus
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#FAFAFA]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">Suara<span className="text-indigo-600">Ku</span></span>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              {isLogin ? 'Selamat Datang' : 'Bergabung Sekarang'}
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              {isLogin ? 'Masuk untuk melanjutkan belajar.' : 'Mulai perjalanan belajarmu di SuaraKu.'}
            </p>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mb-6 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${
                    message.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${message.includes('berhasil') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-4">Nama Lengkap</label>
                  <input
                    type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-indigo-600 focus:bg-white outline-none font-semibold transition-all text-slate-800"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase ml-4">Email</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-indigo-600 focus:bg-white outline-none font-semibold transition-all text-slate-800"
                  placeholder="name@gmail.com"
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-400 uppercase ml-4">Kata Sandi</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-indigo-600 focus:bg-white outline-none font-semibold transition-all text-slate-800"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523(0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <>
                  <div className={`grid ${role === 'siswa' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-4">Peran</label>
                      <select
                        value={role} onChange={(e) => setRole(e.target.value)}
                        className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                      >
                        <option value="siswa">Siswa</option>
                        <option value="guru">Guru</option>
                        <option value="ortu">Orang Tua</option>
                      </select>
                    </div>
                    {role === 'siswa' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-4">Kebutuhan</label>
                        <select
                          value={disabilityType} onChange={(e) => setDisabilityType(e.target.value)}
                          className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                        >
                          <option value="tidak_ada">Umum</option>
                          <option value="tunanetra">Tunanetra</option>
                          <option value="tunarungu">Tunarungu</option>
                          <option value="tunawicara">Tunawicara</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {role === 'guru' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-4">Mata Pelajaran</label>
                      <select
                        value={subject} onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Pilih Mata Pelajaran</option>
                        {subjects.map((s, idx) => (
                          <option key={idx} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {role === 'ortu' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-4">ID Siswa (Anak)</label>
                      <input
                        type="text" required value={studentIdInput} onChange={(e) => setStudentIdInput(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-indigo-600 focus:bg-white outline-none font-semibold transition-all text-slate-800"
                        placeholder="Masukkan ID unik anak"
                      />
                    </div>
                  )}
                </>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 tracking-tight"
              >
                {loading ? 'MEMPROSES...' : (isLogin ? 'MASUK' : 'DAFTAR SEKARANG')}
              </button>
            </form>

            <div className="mt-10 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-slate-500 font-bold hover:text-indigo-600 transition-colors"
              >
                {isLogin ? (
                  <>Belum punya akun? <span className="text-indigo-600 border-b-2 border-indigo-100 pb-1">Daftar sekarang</span></>
                ) : (
                  <>Sudah punya akun? <span className="text-indigo-600 border-b-2 border-indigo-100 pb-1">Masuk di sini</span></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
