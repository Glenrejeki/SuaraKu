import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import VoiceButton from '../../components/VoiceButton';
import { useVoice } from '../../hooks/useVoice';

const Landing = () => {
  const navigate = useNavigate();
  const { speak } = useVoice();

  useEffect(() => {
    // Welcome message for accessibility in Indonesian
    const timer = setTimeout(() => {
      speak("Selamat datang di SuaraKu. Platform belajar berbasis suara untuk teman-teman luar biasa. Ucapkan masuk untuk mulai belajar.");
    }, 1000);
    return () => clearTimeout(timer);
  }, [speak]);

  const landingCommands = {
    'LOGIN': ['masuk', 'login', 'mulai', 'mulai belajar', 'daftar'],
    'INFO': ['apa ini', 'tentang suaraku', 'fitur', 'jelaskan'],
  };

  const handleCommand = (command) => {
    if (command === 'LOGIN') {
      navigate('/auth');
    } else if (command === 'INFO') {
      speak("SuaraKu adalah platform belajar menggunakan suara. Kamu bisa mengerjakan tugas, kuis, dan ngobrol dengan AI tutor hanya dengan bicara.");
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-200 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-700 text-sm font-bold mb-6 tracking-wider uppercase">
              #1 Platform Belajar Berbasis Suara
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tight">
              Suara<span className="text-purple-600">Ku</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              "Belajar Tanpa Batas — Setiap Suara Adalah Langkah Maju"
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="p-8 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full mb-8">
              <p className="text-slate-500 mb-6 font-medium uppercase text-xs tracking-widest">Demo Interaktif</p>
              <VoiceButton
                commands={landingCommands}
                onCommandMatch={handleCommand}
                customText="Ucapkan 'Masuk' untuk Demo"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/auth')}
                className="px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 transition-all active:scale-95 text-lg"
              >
                Mulai Belajar Sekarang
              </button>
              <button
                className="px-10 py-4 bg-white border-2 border-slate-200 hover:border-purple-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-95 text-lg"
              >
                Lihat Video Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-50 py-24 px-4 border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: "🎤",
                title: "Interaksi Berbasis Suara",
                desc: "Seluruh navigasi dan interaksi dilakukan via suara. Tanpa hambatan dengan Web Speech API.",
                color: "bg-purple-100 text-purple-600"
              },
              {
                icon: "♿",
                title: "Sistem UI Adaptif",
                desc: "Antarmuka berubah otomatis berdasarkan jenis disabilitas: Tunanetra, Tunarungu, Tunawicara.",
                color: "bg-green-100 text-green-600"
              },
              {
                icon: "🤖",
                title: "Tutor AI Pintar",
                desc: "Tutor AI yang bisa meringkas materi dan menjawab pertanyaan dalam bahasa sederhana.",
                color: "bg-blue-100 text-blue-600"
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 text-center border-t border-slate-100">
        <p className="text-slate-400 font-medium">
          © 2025 SuaraKu. Developed by Christian Johannes Hutahaean & Glen Rejeki Sitorus
        </p>
      </footer>
    </div>
  );
};

export default Landing;
