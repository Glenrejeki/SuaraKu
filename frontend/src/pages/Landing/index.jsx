import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '../../hooks/useVoice';

const Landing = () => {
  const navigate = useNavigate();
  const { speak } = useVoice();
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      speak("Selamat datang di BintangAi. Platform course berbasis AI. Silakan klik tombol mulai atau ucapkan masuk.");
    }, 1000);
    return () => clearTimeout(timer);
  }, [speak]);

  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      ),
      title: "Voice First",
      desc: "Navigasi dan belajar sepenuhnya menggunakan perintah suara yang natural."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
      title: "AI Adaptive",
      desc: "Sistem cerdas yang menyesuaikan materi dengan kebutuhan belajar unikmu."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      title: "Inklusif",
      desc: "Didesain khusus untuk teman-teman dengan berbagai kemampuan aksesibilitas."
    }
  ];

  const philosophy = [
    {
      title: "⭐ “Bintang” = Setiap Anak Istimewa",
      desc: "Setiap anak SLB (tunanetra, tunarungu, tunawicara) adalah bintang. Mereka punya potensi unik, hanya butuh cara belajar yang tepat.",
      highlight: "Tidak ada anak yang kurang, semua bisa bersinar."
    },
    {
      title: "🌌 Tetap Bersinar di Kegelapan",
      desc: "Relevan untuk Tunanetra & hambatan komunikasi. Walaupun ada keterbatasan, mereka tetap bisa “bersinar”.",
      highlight: "Keterbatasan bukan penghalang untuk cahaya."
    },
    {
      title: "🤖 AI = Pendamping Cerdas",
      desc: "AI membantu melalui suara (text-to-speech), visual (tunarungu), dan komunikasi (tunawicara).",
      highlight: "AI adalah alat bantu setiap bintang untuk bercahaya."
    },
    {
      title: "🎓 BintangAI sebagai Course",
      desc: "Bukan sekadar materi, tapi “jalan” agar anak berkembang, percaya diri, dan merasa mampu.",
      highlight: "Setiap pembelajaran adalah langkah menuju masa depan."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-indigo-100 font-sans">
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Bintang<span className="text-indigo-600">Ai</span></span>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="text-sm font-semibold hover:text-indigo-600 transition-colors"
          >
            Masuk
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-8 uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Platform Belajar Inklusif
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 max-w-5xl mx-auto leading-[1.2]">
              Platform course berbasis AI yang dirancang untuk membantu anak tunanetra, tunarungu, dan tunawicara belajar dengan lebih mudah.
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed">
              Melalui dukungan suara, visual, dan interaksi cerdas yang menyesuaikan kebutuhan mereka menuju masa depan.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/auth')}
              className="group px-8 py-4 bg-slate-900 text-white font-semibold rounded-full hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
            >
              Mulai Sekarang
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <button
              onClick={() => {
                setShowAbout(true);
                speak("Membuka informasi lengkap tentang BintangAi. Filosofi, Alur, dan Peran User.");
              }}
              className="px-8 py-4 bg-white text-slate-600 font-semibold rounded-full border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
            >
              Tentang
            </button>
          </motion.div>
        </div>

        <div className="absolute top-1/4 left-10 w-64 h-64 bg-indigo-200/20 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-purple-200/20 rounded-full blur-[100px] -z-10"></div>
      </main>

      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-8 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAbout(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <header className="mb-12 text-center">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Tentang Bintang<span className="text-indigo-600">Ai</span></h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Filosofi, Alur, dan Peran Pengguna</p>
                </header>

                <div className="space-y-16">
                  {/* Philosophy Section */}
                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">⭐</div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Makna BintangAi untuk SLB</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {philosophy.map((item, idx) => (
                        <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                          <p className="font-bold text-slate-800 mb-2">{item.title}</p>
                          <p className="text-xs text-slate-500 font-medium mb-3 leading-relaxed">{item.desc}</p>
                          <p className="text-[10px] font-bold text-indigo-600 italic">👉 {item.highlight}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Workflow Section */}
                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">🚀</div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Alur Platform</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { step: 'Upload', desc: 'Guru mengunggah modul pelajaran (PDF).' },
                        { step: 'Analisis', desc: 'Siswa menggunakan AI untuk memahami materi.' },
                        { step: 'Belajar', desc: 'Tantangan tugas dengan panduan suara & AI Tutor.' },
                        { step: 'Pantau', desc: 'Laporan perkembangan untuk Guru & Orang Tua.' }
                      ].map((s, i) => (
                        <div key={i} className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                          <p className="text-indigo-600 font-black text-[10px] uppercase mb-2">Tahap {i+1}</p>
                          <p className="font-bold text-slate-800 text-sm mb-1">{s.step}</p>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Roles Section */}
                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">👥</div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Peran Pengguna</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <h4 className="font-black text-slate-900 uppercase text-xs flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-xs">🎓</span> Siswa
                        </h4>
                        <ul className="space-y-2">
                          {['Voice Command', 'AI Summary', 'AI Kak Bintang', 'XP System'].map((f, i) => (
                            <li key={i} className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                              <span className="text-rose-500 text-[10px]">✔</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-black text-slate-900 uppercase text-xs flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-xs">👨‍🏫</span> Guru
                        </h4>
                        <ul className="space-y-2">
                          {['Upload Modul', 'Auto Grading', 'Monitoring Dashboard', 'Statistik'].map((f, i) => (
                            <li key={i} className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                              <span className="text-indigo-500 text-[10px]">✔</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-black text-slate-900 uppercase text-xs flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-xs">👨‍👩‍👧</span> Orang Tua
                        </h4>
                        <ul className="space-y-2">
                          {['Pantau Progres XP', 'Intelligence Report', 'Konsultasi Guru', 'Cek Tugas'].map((f, i) => (
                            <li key={i} className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                              <span className="text-amber-500 text-[10px]">✔</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="mt-16 text-center">
                  <button
                    onClick={() => setShowAbout(false)}
                    className="px-12 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Tutup & Mulai Belajar ✨
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-12 px-6 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-80">
          @2026 BintangAi.Developed oleh Christian Johannes Hutahaean Dan Glen Rejeki Sitorus
        </p>
      </footer>
    </div>
  );
};

export default Landing;
