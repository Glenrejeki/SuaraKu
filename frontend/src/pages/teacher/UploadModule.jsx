import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useAI } from '../../hooks/useAI';

const loadPdfJs = () => {
  return new Promise((resolve) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    document.head.appendChild(script);
  });
};

const TeacherUploadModule = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const { summarize, simplify } = useAI();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [aiData, setAiData] = useState({ summary: '', simplified: '' });

  const extractTextFromPdf = async (file) => {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleProcess = async () => {
    if (!file || !title) return;
    setLoading(true);
    setStep(2);

    try {
      const extractedText = await extractTextFromPdf(file);
      if (!extractedText.trim()) throw new Error("PDF tidak terbaca.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('modules')
        .upload(`public/${fileName}`, file);

      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('modules').getPublicUrl(`public/${fileName}`);

      let summary, simplified;
      try {
        summary = await summarize(extractedText);
        simplified = await simplify(extractedText);
      } catch (aiError) {
        summary = extractedText.substring(0, 500) + "...";
        simplified = extractedText.substring(0, 400) + "...";
      }

      setAiData({ summary, simplified });

      const { error: dbError } = await supabase.from('modules').insert({
        title,
        pdf_url: publicUrl,
        content: extractedText,
        summary,
        simplified,
        teacher_id: profile.id
      });

      if (dbError) throw dbError;
      setStep(3);
    } catch (error) {
      alert('Kesalahan: ' + error.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-indigo-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-6 mb-12">
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:text-indigo-600 shadow-sm transition-all"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
             </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tambah Modul Baru</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Gunakan AI untuk menganalisis dan merangkum materi secara otomatis.</p>
          </div>
        </header>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Judul Modul</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Mengenal Ekosistem Laut"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl font-bold text-slate-900 outline-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">File Modul (PDF)</label>
                  <div className={`relative group border-2 border-dashed rounded-3xl p-12 text-center transition-all ${file ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-100 bg-slate-50/50'}`}>
                    <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm group-hover:scale-110 transition-transform">
                        {file ? '📄' : '📤'}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">{file ? file.name : 'Pilih atau Seret PDF'}</p>
                        <p className="text-sm font-medium text-slate-400 mt-1">Format PDF, maksimal 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleProcess}
                  disabled={!file || !title}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                   Mulai Analisis AI ✨
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-20 text-center space-y-8"
              >
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Menganalisis Materi...</h2>
                  <p className="text-slate-400 font-medium mt-2 max-w-xs mx-auto">AI sedang membaca PDF dan menyusun ringkasan yang mudah dipahami.</p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">Analisis Berhasil!</h3>
                    <p className="text-[11px] font-bold text-emerald-600/70 uppercase tracking-wider">Materi siap dipublikasikan ke siswa.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Ringkasan Materi</h4>
                    <div className="p-8 bg-slate-50 rounded-3xl font-medium text-slate-600 leading-relaxed text-sm border border-slate-100">
                       {aiData.summary}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] ml-1">Bahasa Ramah Siswa</h4>
                    <div className="p-8 bg-indigo-50/50 rounded-3xl font-medium text-indigo-900 leading-relaxed text-sm border border-indigo-100">
                       {aiData.simplified}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    onClick={() => navigate('/teacher/dashboard')}
                    className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
                  >
                    Simpan & Selesai
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    Ulangi
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TeacherUploadModule;
