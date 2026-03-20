import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useAI } from '../../hooks/useAI';

// Memuat PDF.js secara dinamis
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

      // Memanggil AI dengan request output yang lebih panjang dan detail
      let summary, simplified;
      try {
        // Summarize: Meminta ringkasan yang mencakup seluruh poin penting (lebih panjang)
        summary = await summarize(extractedText);
        // Simplify: Meminta penjelasan materi yang ramah siswa (mudah dipahami)
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <button onClick={() => navigate('/teacher/dashboard')} className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center hover:text-purple-600 shadow-sm transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Analisis Modul AI</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Output Lebih Lengkap & Mudah Dipahami</p>
          </div>
        </header>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Judul Modul</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Ekosistem Laut Lengkap" className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-purple-500 rounded-[2rem] font-bold text-lg outline-none transition-all" />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest ml-1">File Modul (PDF)</label>
                  <div className={`relative group border-4 border-dashed rounded-[3rem] p-16 text-center transition-all ${file ? 'border-purple-200 bg-purple-50' : 'border-slate-100 hover:border-purple-100 bg-slate-50'}`}>
                    <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="space-y-4">
                      <span className="text-6xl block">{file ? '📄' : '📤'}</span>
                      <p className="text-xl font-black text-slate-700">{file ? file.name : 'Klik untuk Pilih PDF'}</p>
                      <p className="text-sm font-bold text-slate-400">AI akan menganalisis seluruh isi halaman</p>
                    </div>
                  </div>
                </div>
                <button onClick={handleProcess} disabled={!file || !title} className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white font-black text-xl rounded-[2.5rem] shadow-xl shadow-purple-100 transition-all">
                   Analisis Materi Lengkap ✨
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" className="py-20 text-center space-y-8">
                <div className="w-32 h-32 border-8 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto" />
                <h2 className="text-3xl font-black text-slate-900 mb-2">Mempelajari Seluruh Isi PDF...</h2>
                <p className="text-slate-500 font-medium italic">"Tunggu sebentar, AI sedang membuat materi yang lengkap dan mudah dipahami"</p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" className="space-y-10">
                <div className="flex items-center gap-4 p-6 bg-green-50 rounded-[2.5rem] border border-green-100">
                  <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white text-xl">✅</div>
                  <div>
                    <h3 className="text-lg font-black text-green-700">Analisis Materi Selesai!</h3>
                    <p className="text-sm font-bold text-green-600/70">Materi telah diproses menjadi lebih informatif bagi siswa.</p>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Poin-Poin Penting Materi (Lengkap)</h4>
                    <div className="p-10 bg-slate-50 rounded-[3rem] font-bold text-slate-700 leading-relaxed text-lg border border-slate-100">
                       {aiData.summary}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Penjelasan Ramah Siswa</h4>
                    <div className="p-10 bg-purple-50 rounded-[3rem] font-bold text-purple-700 leading-relaxed text-lg border border-purple-100">
                       {aiData.simplified}
                    </div>
                  </div>
                </div>
                <button onClick={() => navigate('/teacher/dashboard')} className="w-full py-6 bg-slate-900 text-white font-black text-xl rounded-[2.5rem] transition-all">
                   Simpan Modul
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TeacherUploadModule;
