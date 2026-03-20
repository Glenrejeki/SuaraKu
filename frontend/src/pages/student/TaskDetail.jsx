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

  // --- State ---
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
      // 1. Fetch Task
      const { data: taskData } = await supabase.from('assignments').select('*').eq('id', id).single();
      if (taskData) {
        setTask(taskData);
        if (taskData.duration_minutes) setTimeLeft(taskData.duration_minutes * 60);
      }

      // 2. Fetch Questions
      const { data: qs } = await supabase.from('assignment_questions').select('*, assignment_question_options(*)').eq('assignment_id', id).order('order_index', { ascending: true });
      setQuestions(qs || []);

      // 3. Check for existing submission
      const { data: existingSub } = await supabase.from('submissions').select('*, submission_answers(*)').eq('assignment_id', id).eq('student_id', profile.id).single();
      if (existingSub) setSubmissionRecord(existingSub);

      // 4. Fetch Leaderboard
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

      // Re-fetch to show results
      fetchTaskData();
      speak(`Hebat! Tugas selesai dikirim. Skor kamu ${totalScore}.`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-purple-600 animate-pulse">MEMUAT...</div>;

  // --- VIEW: REVIEW RESULTS ---
  if (submissionRecord) {
    const totalPoints = questions.reduce((a, b) => a + b.points, 0);
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <header className="bg-white p-6 border-b sticky top-0 z-10">
           <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button onClick={() => navigate('/student/tasks')} className="font-black text-slate-400">⬅ KEMBALI</button>
              <h1 className="font-black text-slate-900 uppercase">Hasil Tugas</h1>
              <div className="w-10" />
           </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 space-y-8">
           <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center border-4 border-purple-100">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-2xl font-black text-slate-900">SKOR KAMU</h2>
              <div className="text-7xl font-black text-purple-600 my-4">{submissionRecord.total_score} <span className="text-2xl text-purple-300">/ {totalPoints}</span></div>
              <p className="text-slate-400 font-bold">Bagus sekali! Lihat feedback AI di bawah untuk belajar lebih lanjut.</p>
           </div>

           <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest ml-4">Review Jawaban & Feedback AI</h3>
              {questions.map((q, idx) => {
                const studentAns = submissionRecord.submission_answers?.find(a => a.question_id === q.id);
                return (
                  <div key={q.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between">
                       <span className="font-black text-slate-300">SOAL {idx+1}</span>
                       <span className={`font-black uppercase text-[10px] px-3 py-1 rounded-full ${studentAns?.is_correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {studentAns?.is_correct ? 'BENAR' : (q.question_type === 'esai' ? 'TELAH DINILAI' : 'SALAH')}
                       </span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{q.question_text}</p>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Jawaban Kamu:</p>
                       <p className="font-bold text-slate-700">
                          {q.question_type === 'pilihan_ganda'
                            ? q.assignment_question_options.find(o => o.id === studentAns?.selected_option_id)?.option_text || 'Tidak dijawab'
                            : studentAns?.answer_text || 'Tidak dijawab'}
                       </p>
                    </div>

                    {q.ai_explanation && (
                      <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4">
                         <div className="text-2xl">🤖</div>
                         <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase">Feedback AI & Penjelasan:</p>
                            <p className="text-sm font-bold text-indigo-700 leading-relaxed">{q.ai_explanation}</p>
                         </div>
                      </div>
                    )}
                  </div>
                );
              })}
           </div>
        </main>
      </div>
    );
  }

  // --- VIEW: INTRODUCTION & WORKING ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-40">
      <header className="bg-white border-b border-slate-100 px-6 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/student/tasks')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-purple-600 transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">{task.title}</h1>
          {started && timeLeft !== null && (
            <div className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 border-2 ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-900 border-slate-900 text-white'}`}>
               ⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {!started ? (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                <h2 className="text-4xl font-black text-slate-900 mb-6">{task.title}</h2>
                <p className="text-xl text-slate-600 font-bold leading-relaxed mb-8">{task.description}</p>
                <div className="flex flex-wrap gap-4">
                   <div className="px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-black">📅 Deadline: {new Date(task.deadline).toLocaleDateString('id-ID')}</div>
                   <div className="px-6 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black">📝 {questions.length} Soal</div>
                </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[3rem] text-white">
                 <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">🏆 Papan Peringkat</h3>
                 <div className="space-y-4">
                    {leaderboard.map((user, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                         <div className="flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black">{i + 1}</span>
                            <span className="font-bold">{user.full_name}</span>
                         </div>
                         <span className="text-xl font-black text-purple-400">{user.top_score} XP</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="flex justify-center">
                 <button onClick={handleStart} className="px-20 py-6 bg-green-500 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl hover:scale-105 transition-all">
                    🚀 MULAI TUGAS
                 </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="questions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
               {questions.map((q, idx) => idx + 1 === currentStep && (
                 <div key={q.id} className="space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
                       <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase mb-6 inline-block">Soal {idx + 1} / {questions.length}</span>
                       <h3 className="text-2xl font-black text-slate-800 leading-tight mb-8">{q.question_text}</h3>

                       {q.question_type === 'pilihan_ganda' ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.assignment_question_options.map((opt, oi) => (
                              <button
                                key={opt.id}
                                onClick={() => handleAnswerChange(q.id, { selected_option_id: opt.id })}
                                className={`p-6 rounded-3xl border-4 text-left transition-all flex items-center gap-4 ${answers[q.id]?.selected_option_id === opt.id ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-50 text-slate-600 hover:border-purple-200'}`}
                              >
                                 <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">{String.fromCharCode(65 + oi)}</span>
                                 <span className="text-lg font-bold">{opt.option_text}</span>
                              </button>
                            ))}
                         </div>
                       ) : (
                         <textarea
                           value={answers[q.id]?.answer_text || ''}
                           onChange={(e) => handleAnswerChange(q.id, { answer_text: e.target.value })}
                           placeholder="Jawab dengan mengetik atau klik tombol mikrofon di pojok kiri bawah..."
                           className="w-full h-48 p-8 bg-slate-50 border-4 border-slate-100 focus:border-purple-400 rounded-[2rem] font-bold text-xl outline-none resize-none"
                         />
                       )}
                    </div>

                    <div className="flex justify-between items-center">
                       <button disabled={currentStep === 1} onClick={() => setCurrentStep(prev => prev - 1)} className="font-black text-slate-300 uppercase">⬅ Kembali</button>
                       {currentStep === questions.length ? (
                         <button onClick={handleSubmit} className="px-12 py-5 bg-green-500 text-white rounded-[2rem] font-black text-xl shadow-xl">KUMPULKAN 🚀</button>
                       ) : (
                         <button onClick={() => setCurrentStep(prev => prev + 1)} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl">LANJUT ➡️</button>
                       )}
                    </div>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
      />
    </div>
  );
};

export default StudentTaskDetail;
