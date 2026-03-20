import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useVoice } from '../../hooks/useVoice';

const Landing = () => {
  const navigate = useNavigate();
  const { speak } = useVoice();

  useEffect(() => {
    const timer = setTimeout(() => {
      speak("Selamat datang di SuaraKu. Platform belajar inklusif berbasis suara. Silakan klik tombol mulai atau ucapkan masuk.");
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-indigo-100 font-sans">
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
            <span className="text-xl font-bold tracking-tight">Suara<span className="text-indigo-600">Ku</span></span>
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
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1]">
              Belajar Tanpa Batas dengan <span className="text-indigo-600">Kekuatan Suara.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              Platform edukasi modern yang didesain untuk memudahkan akses belajar bagi setiap anak, mengubah suara menjadi langkah menuju masa depan.
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
              className="px-8 py-4 bg-white text-slate-600 font-semibold rounded-full border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
            >
              Pelajari Fitur
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

      <footer className="py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-slate-900 rounded"></div>
            <span className="text-sm font-bold">SuaraKu</span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; 2025 SuaraKu. Dirancang untuk aksesibilitas tanpa batas.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
