import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useAI } from '../../hooks/useAI';
import VoiceButton from '../../components/VoiceButton';
import BintangAvatar from '../../components/BintangAvatar';
import ConfettiEffect from '../../components/ConfettiEffect';

const StudentTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, updateXP, fetchProfile } = useAuthStore();
  const { speak, startListening, isListening, isSpeaking } = useVoice();
  const { askTutor } = useAI();

  const [task, setTask] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionRecord, setSubmissionRecord] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [avatarState, setAvatarState] = useState('idle');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchTaskData();
  }, [id]);

  useEffect(() => {
    let timer;
    if (started && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && started) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  useEffect(() => {
    if (isSpeaking) setAvatarState('speaking');
    else if (submitting) setAvatarState('thinking');
    else setAvatarState('idle');
  }, [isSpeaking, submitting]);

  const fetchTaskData = async () => {
    setLoading(true);
    try {
      const { data: taskData } = await supabase.from('assignments').select('*').eq('id', id).single();
      if (taskData) {
        setTask(taskData);
        if (taskData.duration_minutes) setTimeLeft(taskData.duration_minutes * 60);
      }

      const { data: qs } = await supabase.from('assignment_questions').select('*, assignment_question_options(*)').eq('assignment_id', id).order('order_index', { ascending: true });
      setQuestions(qs || []);

      const { data: existingSub } = await supabase.from('submissions').select('*, submission_answers(*)').eq('assignment_id', id).eq('student_id', profile.id).single();
      if (existingSub) setSubmissionRecord(existingSub);

      const { data: lb } = await supabase.from('assignment_leaderboard').select('*').eq('assignment_id', id).order('top_score', { ascending: false }).limit(5);
      setLeaderboard(lb || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    setStarted(true);
    setCurrentStep(1);
    setAvatarState('happy');
    const msg = `Semangat ya! Ada ${questions.length} tantangan yang harus kamu selesaikan. Kak SuaraKu yakin kamu bisa!`;
    speak(msg);
    setTimeout(() => setAvatarState('idle'), 3000);
  };

  const handleAnswerChange = (qId, value) => {
    setAnswers({ ...answers, [qId]: { ...answers[qId], ...value } });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setAvatarState('thinking');
    try {
      const { data: sub, error: subErr } = await supabase.from('submissions').insert({
        assignment_id: id,
        student_id: profile.id,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }).select().single();

      if (subErr) throw subErr;

      let totalScore = 0;
      for (let q of questions) {
        const ans = answers[q.id] || {};
        let isCorrect = null;
        let points = 0;

        if (q.question_type === 'pilihan_ganda') {
          const correctOpt = q.assignment_question_options.find(o => o.is_correct);
          isCorrect = ans.selected_option_id === correctOpt?.id;
          points = isCorrect ? q.points : 0;
          totalScore += points;
        }

        await supabase.from('submission_answers').insert({
          submission_id: sub.id,
          question_id: q.id,
          answer_text: ans.answer_text,
          selected_option_id: ans.selected_option_id,
          is_correct: isCorrect,
          points_earned: points
        });
      }

      await supabase.from('submissions').update({ total_score: totalScore }).eq('id', sub.id);

      await updateXP(totalScore);
      await fetchProfile(profile.id);

      setShowConfetti(true);
      setAvatarState('happy');
      fetchTaskData();
      speak(`Horeee! Kamu berhasil menyelesaikan tugas! Skor kamu adalah ${totalScore}. Kamu hebat sekali!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans">
      <BintangAvatar state="thinking" size="md" />
      <div className="w-12 h-1 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin my-4" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menyiapkan Tantangan...</p>
    </div>
  );

  const isPastDeadline = task?.deadline ? new Date() > new Date(task.deadline) : false;

  // If already submitted, show report
  if (submissionRecord) {
    const totalPoints = questions.reduce((a, b) => a + b.points, 0);
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 flex flex-col relative overflow-hidden">
        <ConfettiEffect active={showConfetti} />

        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-6 sticky top-0 z-10">
           <div className="max-w-6xl mx-auto flex items-center justify-between">
              <button
                onClick={() => navigate('/student/tasks')}
                className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-all group"
                aria-label="Kembali ke Daftar Tugas"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </div>
                Kembali
              </button>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-widest">Laporan Petualangan</h1>
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-600 uppercase">Berhasil</span>
              </div>
           </div>
        </header>

        <main className="max-w-6xl mx-auto w-full p-6 md:p-12 flex-1 relative z-10">
           <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1 space-y-8">
                 <motion.div
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="bg-slate-900 p-12 rounded-[3.5rem] text-white text-center relative overflow-hidden shadow-2xl"
                 >
                    <div className="relative z-10">
                      <div className="mb-8 flex justify-center">
                        <BintangAvatar state="happy" size="md" />
                      </div>
                      <h2 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-4">Skor Petualangan</h2>
                      <div className="flex items-baseline justify-center gap-3">
                        <span className="text-7xl font-black text-white">{submissionRecord.total_score}</span>
                        <span className="text-2xl font-bold opacity-30">/ {totalPoints}</span>
                      </div>
                      <p className="text-indigo-200/70 font-bold text-xs mt-8 uppercase tracking-widest leading-relaxed">
                        {submissionRecord.total_score === totalPoints ? 'Sempurna! Kamu Jenius!' : 'Hebat! Kamu naik level!'}
                      </p>
                    </div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                 </motion.div>

                 <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Detil Misi</h3>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center py-3 border-b border-slate-50">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Misi</span>
                          <span className="text-xs font-black text-slate-800 uppercase text-right truncate max-w-[150px]">{task.title}</span>
                       </div>
                       <div className="flex justify-between items-center py-3 border-b border-slate-50">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Poin XP</span>
                          <span className="text-xs font-black text-indigo-600">+{submissionRecord.total_score} XP</span>
                       </div>
                       <div className="flex justify-between items-center py-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                          <span className="text-xs font-black text-slate-800 uppercase">{new Date(submissionRecord.submitted_at).toLocaleDateString('id-ID')}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                 <div className="flex items-center gap-4 px-4">
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase tracking-widest">Ulasan Kak SuaraKu 🤖</h3>
                    <div className="flex-1 h-[2px] bg-slate-100" />
                 </div>

                 <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar max-h-[800px]">
                    {questions.map((q, idx) => {
                      const studentAns = submissionRecord.submission_answers?.find(a => a.question_id === q.id);
                      return (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 relative group hover:border-indigo-100 transition-all"
                        >
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-4">
                                <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black ${studentAns?.is_correct ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                  {idx+1}
                                </span>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pertanyaan</span>
                             </div>
                             <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${studentAns?.is_correct ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                <span className="text-[9px] font-black uppercase tracking-widest">
                                   {studentAns?.is_correct ? 'Jawaban Tepat!' : 'Coba Lagi Nanti'}
                                </span>
                             </div>
                          </div>

                          <p className="text-xl font-bold text-slate-900 tracking-tight leading-relaxed">{q.question_text}</p>

                          <div className="grid md:grid-cols-2 gap-6 pt-4">
                             <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Jawaban Kamu</p>
                                <p className="font-bold text-slate-700 text-sm leading-relaxed uppercase">
                                   {q.question_type === 'pilihan_ganda'
                                     ? q.assignment_question_options.find(o => o.id === studentAns?.selected_option_id)?.option_text || 'Kosong'
                                     : studentAns?.answer_text || 'Kosong'}
                                </p>
                             </div>

                             <div className="p-6 bg-indigo-600 rounded-[2.5rem] text-white flex gap-4 shadow-xl shadow-indigo-100 relative overflow-hidden group">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0 z-10 overflow-hidden">
                                   <BintangAvatar state={studentAns?.is_correct ? 'happy' : 'speaking'} size="sm" />
                                </div>
                                <div className="z-10">
                                   <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-2">Penjelasan Kak SuaraKu</p>
                                   <p className="text-[13px] font-bold leading-relaxed italic opacity-95">
                                     {q.ai_explanation || "Wah, bagian ini seru ya! Terus pelajari agar makin paham!"}
                                   </p>
                                </div>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                             </div>
                          </div>
                        </motion.div>
                      );
                    })}
                 </div>
              </div>
           </div>
        </main>

        <footer className="py-12 border-t border-slate-100 text-center relative z-10 bg-white/50 backdrop-blur-sm mt-auto">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-80">
            @2026 SuaraKu.Developed oleh Christian Johannes Hutahaean Dan Glen Rejeki Sitorus
          </p>
        </footer>
      </div>
    );
  }

  // If not submitted and deadline passed, show "Closed" card
  if (isPastDeadline) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="mb-8 flex justify-center">
              <div className="p-6 bg-rose-50 rounded-[2.5rem] border-2 border-rose-100">
                <BintangAvatar state="idle" size="md" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight mb-4">Waktu Misi Habis! ⏰</h2>
            <p className="text-slate-500 font-bold text-lg leading-relaxed mb-10 uppercase">
              Maaf ya, akses ke misi <span className="text-indigo-600">"{task?.title}"</span> sudah ditutup karena melewati batas waktu.
            </p>
            <button
              onClick={() => navigate('/student/tasks')}
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest"
            >
              Cari Misi Lain 🚀
            </button>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 pb-20">
      <header className="bg-white border-b border-slate-100 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/student/tasks')}
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 shadow-sm"
            aria-label="Kembali"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
             </svg>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-xs font-black text-slate-900 tracking-[0.2em] uppercase">{task?.title}</h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Misi Pembelajaran</p>
          </div>
          {started && timeLeft !== null ? (
            <div className={`px-5 py-2 rounded-2xl font-black text-xs flex items-center gap-3 border-2 transition-all ${timeLeft < 60 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-900 border-slate-900 text-white'}`}>
               <span className="w-2 h-2 rounded-full bg-current" />
               {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          ) : <div className="w-10" />}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!started ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="flex items-center gap-6 mb-10">
                    <BintangAvatar state="happy" size="md" />
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">{task.title}</h2>
                      <p className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mt-2">Misi Level {profile?.grade_level || 1}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-10">
                    <p className="text-lg text-slate-600 font-bold leading-relaxed">{task.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                     <div className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100 shadow-sm">
                        Sampai: {new Date(task.deadline).toLocaleDateString('id-ID')}
                     </div>
                     <div className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-100 shadow-sm">
                        {questions.length} Tantangan Suara
                     </div>
                  </div>
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="flex justify-center pt-8">
                   <button
                    onClick={handleStart}
                    className="group w-full sm:w-auto px-20 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest flex items-center gap-4"
                   >
                      Mulai Petualangan 🚀
                      <span className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <BintangAvatar state="happy" size="sm" />
                      </span>
                   </button>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden h-full">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-10 opacity-40">🏆 Pahlawan Belajar</h3>
                   <div className="space-y-5 relative z-10">
                      {leaderboard.length > 0 ? leaderboard.map((user, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group">
                           <div className="flex items-center gap-5">
                              <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-500 text-slate-900' : 'bg-white/10'}`}>{i + 1}</span>
                              <span className="font-black text-sm uppercase tracking-tight truncate max-w-[120px]">{user.full_name.split(' ')[0]}</span>
                           </div>
                           <span className="font-black text-indigo-400 text-sm">{user.top_score} XP</span>
                        </div>
                      )) : (
                        <div className="text-center py-10">
                          <span className="text-4xl block mb-4">🌟</span>
                          <p className="text-[10px] font-black text-white/30 italic uppercase tracking-widest">Jadilah yang pertama!</p>
                        </div>
                      )}
                   </div>
                   <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="questions"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto space-y-12"
            >
               {questions.map((q, idx) => idx + 1 === currentStep && (
                 <div key={q.id} className="space-y-12">
                    <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-sm border border-slate-100 relative overflow-hidden">
                       <div className="flex justify-between items-center mb-12">
                         <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Tantangan {idx + 1} / {questions.length}</span>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{q.question_type === 'esai' ? 'Gunakan Suara' : 'Pilih Jawaban'}</span>
                            <div className="w-10 h-10 overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                               <BintangAvatar state={avatarState} size="sm" />
                            </div>
                         </div>
                       </div>

                       <h3 className="text-3xl font-black text-slate-900 leading-[1.3] tracking-tight mb-12 uppercase">{q.question_text}</h3>

                       {q.question_type === 'pilihan_ganda' ? (
                         <div className="grid grid-cols-1 gap-4">
                            {q.assignment_question_options.map((opt, oi) => (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  handleAnswerChange(q.id, { selected_option_id: opt.id });
                                  setAvatarState('happy');
                                  setTimeout(() => setAvatarState('idle'), 1000);
                                }}
                                className={`p-6 rounded-[2.5rem] border-2 text-left transition-all duration-300 flex items-center gap-6 group/opt ${
                                  answers[q.id]?.selected_option_id === opt.id
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-200'
                                  : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-100 hover:bg-slate-50'
                                }`}
                                aria-label={`Pilihan ${String.fromCharCode(65 + oi)}: ${opt.option_text}`}
                              >
                                 <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${answers[q.id]?.selected_option_id === opt.id ? 'bg-white/20' : 'bg-slate-50 text-slate-400 group-hover/opt:scale-110'}`}>
                                   {String.fromCharCode(65 + oi)}
                                 </span>
                                 <span className="font-black text-lg tracking-tight uppercase">{opt.option_text}</span>
                              </button>
                            ))}
                         </div>
                       ) : (
                         <div className="relative group">
                           <textarea
                             value={answers[q.id]?.answer_text || ''}
                             onChange={(e) => handleAnswerChange(q.id, { answer_text: e.target.value })}
                             placeholder="Tulis atau ucapkan jawabanmu..."
                             className="w-full h-64 p-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-[3rem] font-black text-xl outline-none resize-none transition-all uppercase tracking-tight"
                             aria-label="Area Jawaban Esai"
                           />
                           <div className="absolute bottom-6 right-8 text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">
                             {isListening ? 'Mendengarkan Suaramu...' : 'Sedang Mengetik...'}
                           </div>
                         </div>
                       )}
                    </div>

                    <div className="flex justify-between items-center px-8">
                       <button
                        disabled={currentStep === 1}
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] hover:text-slate-900 transition-colors disabled:opacity-30 flex items-center gap-2"
                       >
                         ← Sebelumnya
                       </button>
                       {currentStep === questions.length ? (
                         <button
                          onClick={handleSubmit}
                          disabled={submitting || !Object.keys(answers).length}
                          className="px-16 py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-sm shadow-2xl shadow-emerald-100 hover:bg-emerald-600 transition-all disabled:opacity-50 uppercase tracking-widest"
                         >
                           {submitting ? 'Menilai...' : 'Selesaikan Misi 🔥'}
                         </button>
                       ) : (
                         <button
                          onClick={() => setCurrentStep(prev => prev + 1)}
                          disabled={!answers[questions[currentStep-1]?.id]}
                          className="px-16 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all uppercase tracking-widest flex items-center gap-3 disabled:opacity-50"
                         >
                           Lanjut Misi <span className="text-indigo-400">→</span>
                         </button>
                       )}
                    </div>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <VoiceButton
          onCommandMatch={(cmd, transcript) => {
             if (cmd === 'START' && !started) handleStart();
             if (!cmd && isListening) {
                const currentQ = questions[currentStep - 1];
                if (currentQ?.question_type === 'esai') {
                   handleAnswerChange(currentQ.id, { answer_text: (answers[currentQ.id]?.answer_text || '') + ' ' + transcript });
                }
             }
          }}
          commands={{ 'START': ['mulai', 'gas', 'lanjut'] }}
          customText={started ? "Bicara untuk menjawab..." : "Ucapkan 'Mulai'"}
        />
      </div>
    </div>
  );
};

export default StudentTaskDetail;
