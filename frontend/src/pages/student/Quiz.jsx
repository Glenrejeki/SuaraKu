import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import VoiceButton from '../../components/VoiceButton';
import ConfettiEffect from '../../components/ConfettiEffect';

const StudentQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, updateXP } = useAuthStore();
  const { speak } = useVoice();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const quizCommands = {
    'SELECT_A': ['pilih A', 'jawaban A', 'yang A'],
    'SELECT_B': ['pilih B', 'jawaban B', 'yang B'],
    'SELECT_C': ['pilih C', 'jawaban C', 'yang C'],
    'SELECT_D': ['pilih D', 'jawaban D', 'yang D'],
    'NEXT': ['lanjut', 'berikutnya', 'selanjutnya'],
    'READ_QUESTION': ['bacakan soal', 'ulang soal', 'apa pertanyaannya'],
  };

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .eq('assignment_id', id)
      .single();

    if (data) {
      setQuiz(data);
      setQuestions(data.questions);
      speak(`Kuis dimulai! Pertanyaan pertama: ${data.questions[0].text}`);
    } else {
      speak("Kuis tidak ditemukan.");
    }
    setLoading(false);
  };

  const handleAnswer = (index) => {
    setSelectedAnswer(index);
    const isCorrect = index === questions[currentIndex].correctIndex;

    if (isCorrect) {
      setScore(prev => prev + 1);
      speak("Benar! Hebat sekali.");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    } else {
      speak("Kurang tepat. Jawaban yang benar adalah " + questions[currentIndex].options[questions[currentIndex].correctIndex]);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        speak(`Pertanyaan berikutnya: ${questions[currentIndex + 1].text}`);
      } else {
        finishQuiz();
      }
    }, 3000);
  };

  const finishQuiz = async () => {
    setFinished(true);
    const finalScore = Math.round((score / questions.length) * 100);
    const xpGained = score * 30; // 30 XP per correct answer

    await supabase.from('quiz_results').insert({
      quiz_id: quiz.id,
      student_id: profile.id,
      score: finalScore,
      answers: { results: 'calculated' }
    });

    await supabase.from('profiles').update({ xp: (profile.xp || 0) + xpGained }).eq('id', profile.id);
    updateXP(xpGained);

    speak(`Kuis selesai! Kamu benar ${score} dari ${questions.length} soal. Kamu dapat ${xpGained} poin XP!`);
  };

  const handleCommand = (command) => {
    if (command === 'SELECT_A') handleAnswer(0);
    if (command === 'SELECT_B') handleAnswer(1);
    if (command === 'SELECT_C') handleAnswer(2);
    if (command === 'SELECT_D') handleAnswer(3);
    if (command === 'READ_QUESTION') speak(questions[currentIndex].text);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-purple-600 animate-pulse">MEMULAI KUIS...</div>;

  if (finished) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <ConfettiEffect active={showConfetti} />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
          <span className="text-8xl mb-8 block">🏆</span>
          <h2 className="text-4xl font-black text-slate-900 mb-4">Kuis Selesai!</h2>
          <div className="bg-slate-50 p-8 rounded-[3rem] mb-8">
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Skor Kamu</p>
            <p className="text-6xl font-black text-purple-600">{Math.round((score / questions.length) * 100)}</p>
            <p className="mt-4 text-slate-600 font-bold">{score} Jawaban Benar</p>
          </div>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full py-5 bg-purple-600 text-white font-black text-xl rounded-[2rem] shadow-xl shadow-purple-100 active:scale-95 transition-all"
          >
            Kembali ke Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="bg-white border-b border-slate-100 px-6 py-6 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Kuis Interaktif</h1>
        </div>
        <div className="bg-purple-50 px-4 py-2 rounded-2xl border border-purple-100">
          <span className="text-xs font-black text-purple-600">SOAL {currentIndex + 1} / {questions.length}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 bg-white rounded-[3rem] shadow-sm border border-slate-100"
          >
            <h2 className="text-3xl font-black text-slate-800 leading-tight">
              {currentQ.text}
            </h2>
          </motion.div>
        </div>

        <div className="grid gap-4">
          {currentQ.options.map((opt, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswer(i)}
              className={`
                p-6 rounded-[2rem] text-left font-black text-lg flex items-center gap-5 transition-all
                ${selectedAnswer === i
                  ? (i === currentQ.correctIndex ? 'bg-green-500 text-white border-green-600' : 'bg-red-500 text-white border-red-600')
                  : 'bg-white border-2 border-slate-100 text-slate-700 hover:border-purple-300'
                }
              `}
            >
              <span className={`
                w-10 h-10 rounded-xl flex items-center justify-center text-sm
                ${selectedAnswer === i ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}
              `}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </motion.button>
          ))}
        </div>
      </main>

      <VoiceButton commands={quizCommands} onCommandMatch={handleCommand} customText="Ucapkan: Pilih A, B, C, atau D" />
      <ConfettiEffect active={showConfetti} />
    </div>
  );
};

export default StudentQuiz;
