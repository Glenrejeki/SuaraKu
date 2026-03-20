import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useAI } from '../../hooks/useAI';
import VoiceButton from '../../components/VoiceButton';

const StudentTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, updateXP } = useAuthStore();
  const { speak, startListening, isListening } = useVoice();
  const { simplify } = useAI();

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
    speak(`Tugas dimulai. Ada ${questions.length} soal.`);
  };

  const handleAnswerChange = (qId, value) => {
    setAnswers({ ...answers, [qId]: { ...answers[qId], ...value } });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
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
      updateXP(totalScore);

      fetchTaskData();
      speak(`Hebat! Tugas selesai dikirim. Skor kamu ${totalScore}.`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Memuat Materi...</p>
    </div>
  );

  if (submissionRecord) {
    const totalPoints = questions.reduce((a, b) => a + b.points, 0);
    return (
      <div className="min-h-screen bg-[#FAFAFA] pb-20 font-sans selection:bg-indigo-100">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-6 sticky top-0 z-10">
           <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={() => navigate('/student/tasks')}
                className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Kembali
              </button>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Hasil Tugas</h1>
              <div className="w-10" />
           </div>
        </header>

        <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-10">
           <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">🎯</div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Skor Kamu</h2>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-bold text-slate-900">{submissionRecord.total_score}</span>
                  <span className="text-xl font-bold text-slate-300">/ {totalPoints}</span>
                </div>
                <p className="text-slate-500 font-medium mt-6">Bagus sekali! Lihat feedback di bawah untuk terus berkembang.</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           </div>

           <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Review & Feedback AI</h3>
              {questions.map((q, idx) => {
                const studentAns = submissionRecord.submission_answers?.find(a => a.question_id === q.id);
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
                  >
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Pertanyaan {idx+1}</span>
                       <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${studentAns?.is_correct ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {studentAns?.is_correct ? 'Benar' : (q.question_type === 'esai' ? 'Telah Dinilai' : 'Belum Tepat')}
                       </span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 tracking-tight leading-relaxed">{q.question_text}</p>

                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Jawaban Kamu</p>
                       <p className="font-bold text-slate-700 text-sm">
                          {q.question_type === 'pilihan_ganda'
                            ? q.assignment_question_options.find(o => o.id === studentAns?.selected_option_id)?.option_text || 'Kosong'
                            : studentAns?.answer_text || 'Kosong'}
                       </p>
                    </div>

                    {q.ai_explanation && (
                      <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl shrink-0">🤖</div>
                         <div>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Feedback AI</p>
                            <p className="text-sm font-medium text-indigo-900 leading-relaxed">{q.ai_explanation}</p>
                         </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-indigo-100 pb-20">
      <header className="bg-white border-b border-slate-100 px-6 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/student/tasks')}
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 shadow-sm"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
             </svg>
          </button>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">{task.title}</h1>
          {started && timeLeft !== null ? (
            <div className={`px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 border-2 ${timeLeft < 60 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-900 border-slate-900 text-white'}`}>
               <span className="w-2 h-2 rounded-full bg-current opacity-50" />
               {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          ) : <div className="w-10" />}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!started ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white p-10 md:p-12 rounded-3xl shadow-sm border border-slate-100">
                  <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">{task.title}</h2>
                  <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8">{task.description}</p>
                  <div className="flex flex-wrap gap-3">
                     <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-rose-100">
                        Deadline: {new Date(task.deadline).toLocaleDateString('id-ID')}
                     </div>
                     <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-indigo-100">
                        {questions.length} Pertanyaan
                     </div>
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                   <button
                    onClick={handleStart}
                    className="w-full sm:w-auto px-16 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                   >
                      Mulai Kerjakan 🚀
                   </button>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8 opacity-60">🏆 Papan Peringkat</h3>
                   <div className="space-y-4 relative z-10">
                      {leaderboard.length > 0 ? leaderboard.map((user, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                           <div className="flex items-center gap-4">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-white/10'}`}>{i + 1}</span>
                              <span className="font-bold text-sm truncate max-w-[100px]">{user.full_name.split(' ')[0]}</span>
                           </div>
                           <span className="font-bold text-indigo-400 text-sm">{user.top_score} XP</span>
                        </div>
                      )) : (
                        <p className="text-[10px] font-bold text-white/30 text-center py-4 italic uppercase tracking-widest">Belum ada skor</p>
                      )}
                   </div>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="questions"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto space-y-10"
            >
               {questions.map((q, idx) => idx + 1 === currentStep && (
                 <div key={q.id} className="space-y-10">
                    <div className="bg-white p-10 md:p-12 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                       <div className="flex justify-between items-center mb-10">
                         <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest">Soal {idx + 1} / {questions.length}</span>
                         <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{q.question_type === 'pilihan_ganda' ? 'Opsi' : 'Esai'}</span>
                       </div>

                       <h3 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight mb-10">{q.question_text}</h3>

                       {q.question_type === 'pilihan_ganda' ? (
                         <div className="grid grid-cols-1 gap-3">
                            {q.assignment_question_options.map((opt, oi) => (
                              <button
                                key={opt.id}
                                onClick={() => handleAnswerChange(q.id, { selected_option_id: opt.id })}
                                className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                                  answers[q.id]?.selected_option_id === opt.id
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                  : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-100'
                                }`}
                              >
                                 <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${answers[q.id]?.selected_option_id === opt.id ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}`}>
                                   {String.fromCharCode(65 + oi)}
                                 </span>
                                 <span className="font-bold">{opt.option_text}</span>
                              </button>
                            ))}
                         </div>
                       ) : (
                         <div className="relative group">
                           <textarea
                             value={answers[q.id]?.answer_text || ''}
                             onChange={(e) => handleAnswerChange(q.id, { answer_text: e.target.value })}
                             placeholder="Tulis jawabanmu atau gunakan suara..."
                             className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl font-bold text-lg outline-none resize-none transition-all"
                           />
                           <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">
                             Mengetik...
                           </div>
                         </div>
                       )}
                    </div>

                    <div className="flex justify-between items-center px-4">
                       <button
                        disabled={currentStep === 1}
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="font-bold text-slate-400 uppercase text-xs tracking-widest hover:text-slate-900 transition-colors disabled:opacity-30"
                       >
                         Sebelumnya
                       </button>
                       {currentStep === questions.length ? (
                         <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="px-12 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all disabled:opacity-50"
                         >
                           {submitting ? 'Mengirim...' : 'Kumpulkan 🔥'}
                         </button>
                       ) : (
                         <button
                          onClick={() => setCurrentStep(prev => prev + 1)}
                          className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
                         >
                           Lanjut ➡️
                         </button>
                       )}
                    </div>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
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
          commands={{ 'START': ['mulai', 'gas'] }}
          customText={started ? "Bicara untuk menjawab..." : "Ucapkan 'Mulai'"}
        />
      </div>
    </div>
  );
};

export default StudentTaskDetail;
