import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useAI } from '../../hooks/useAI';

const TeacherCreateTask = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { speak } = useVoice();
  const { simplify } = useAI();

  // --- State ---
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);
  const [activeTab, setActiveTab] = useState('info');

  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    moduleId: '',
    deadlineDate: '',
    deadlineTime: '',
    duration: '',
    aiGrading: true,
    showExplanation: true,
    allowLate: false,
    shuffle: false,
    maxAttempts: 1
  });

  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchModules();
    if (editId) fetchExistingTask();
  }, [editId]);

  const fetchModules = async () => {
    const { data } = await supabase.from('modules').select('id, title').eq('teacher_id', profile.id);
    if (data) setModules(data);
  };

  const fetchExistingTask = async () => {
    setLoading(true);
    try {
      const { data: task, error } = await supabase.from('assignments').select('*, assignment_questions(*, assignment_question_options(*))').eq('id', editId).single();
      if (task) {
        const d = new Date(task.deadline);
        setTaskData({
          title: task.title,
          description: task.description,
          moduleId: task.module_id || '',
          deadlineDate: d.toISOString().split('T')[0],
          deadlineTime: d.toTimeString().split(' ')[0].slice(0, 5),
          duration: task.duration_minutes || '',
          aiGrading: task.ai_grading_enabled,
          showExplanation: task.show_explanation,
          allowLate: task.allow_late_submission,
          shuffle: task.shuffle_questions,
          maxAttempts: task.max_attempts
        });

        const formattedQs = task.assignment_questions.map(q => ({
          id: q.id,
          type: q.question_type,
          text: q.question_text,
          points: q.points,
          aiExplanation: q.ai_explanation,
          aiTolerance: q.ai_grading_tolerance,
          rubric: q.rubric_text,
          options: q.assignment_question_options.map(o => ({ id: o.id, text: o.option_text, isCorrect: o.is_correct }))
        }));
        setQuestions(formattedQs);
      }
    } catch (err) {
      alert("Gagal mengambil data tugas.");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: crypto.randomUUID(),
      type: type,
      text: '',
      points: type === 'pilihan_ganda' ? 5 : 10,
      aiExplanation: '',
      options: type === 'pilihan_ganda' ? [
        { id: crypto.randomUUID(), text: '', isCorrect: false },
        { id: crypto.randomUUID(), text: '', isCorrect: false }
      ] : [],
      rubric: '',
      aiTolerance: 'sedang'
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id, updates) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleSubmit = async () => {
    if (!taskData.title || questions.length === 0) return alert("Mohon lengkapi data.");
    setLoading(true);
    try {
      const payload = {
        title: taskData.title,
        description: taskData.description,
        module_id: taskData.moduleId || null,
        deadline: `${taskData.deadlineDate}T${taskData.deadlineTime}:00`,
        duration_minutes: parseInt(taskData.duration) || null,
        ai_grading_enabled: taskData.aiGrading,
        show_explanation: taskData.showExplanation,
        allow_late_submission: taskData.allowLate,
        shuffle_questions: taskData.shuffle,
        max_attempts: taskData.maxAttempts,
        teacher_id: profile.id
      };

      let assignmentId = editId;

      if (editId) {
        await supabase.from('assignments').update(payload).eq('id', editId);
        await supabase.from('assignment_questions').delete().eq('assignment_id', editId);
      } else {
        const { data, error } = await supabase.from('assignments').insert(payload).select().single();
        if (error) throw error;
        assignmentId = data.id;
      }

      for (let q of questions) {
        const { data: insertedQ, error: qError } = await supabase.from('assignment_questions').insert({
          assignment_id: assignmentId,
          question_type: q.type,
          question_text: q.text,
          points: q.points,
          ai_explanation: q.aiExplanation,
          ai_grading_tolerance: q.aiTolerance,
          rubric_text: q.rubric,
          order_index: questions.indexOf(q)
        }).select().single();

        if (q.type === 'pilihan_ganda') {
          const opts = q.options.map((o, idx) => ({
            question_id: insertedQ.id,
            option_text: o.text,
            is_correct: o.isCorrect,
            order_index: idx
          }));
          await supabase.from('assignment_question_options').insert(opts);
        }
      }

      alert(editId ? 'Tugas Berhasil Diperbarui!' : 'Tugas Berhasil Dipublikasikan!');
      navigate('/teacher/dashboard');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/teacher/dashboard')} className="w-12 h-12 bg-white rounded-2xl border flex items-center justify-center text-slate-400">⬅</button>
             <h1 className="text-3xl font-black text-slate-900 uppercase">{editId ? 'Edit Tugas' : 'Buat Tugas Baru'}</h1>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">
            {loading ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Publikasikan')}
          </button>
        </header>

        <div className="bg-white rounded-[3rem] p-10 shadow-xl space-y-12">
           {/* Form Sederhana */}
           <section className="space-y-6">
              <input
                type="text" value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})}
                placeholder="Judul Tugas..." className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-2xl outline-none focus:ring-4 focus:ring-purple-100 transition-all"
              />
              <textarea
                value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})}
                placeholder="Instruksi..." className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold text-lg min-h-[150px] outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                 <input type="date" value={taskData.deadlineDate} onChange={e => setTaskData({...taskData, deadlineDate: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold" />
                 <input type="time" value={taskData.deadlineTime} onChange={e => setTaskData({...taskData, deadlineTime: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold" />
              </div>
           </section>

           <section className="space-y-8 border-t pt-12">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Bank Soal ({questions.length})</h2>
                 <div className="flex gap-2">
                    <button onClick={() => addQuestion('pilihan_ganda')} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase">+ PG</button>
                    <button onClick={() => addQuestion('esai')} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase">+ Esai</button>
                 </div>
              </div>

              {questions.map((q, i) => (
                <div key={q.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                   <div className="flex justify-between items-center">
                      <span className="font-black text-slate-400 uppercase">Soal {i+1} - {q.type}</span>
                      <button onClick={() => setQuestions(questions.filter(qu => qu.id !== q.id))} className="text-red-400">🗑️</button>
                   </div>
                   <input
                     value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })}
                     placeholder="Pertanyaan..." className="w-full p-4 bg-white rounded-2xl font-bold outline-none border-2 border-transparent focus:border-purple-300 transition-all"
                   />
                   {q.type === 'pilihan_ganda' && (
                     <div className="grid grid-cols-2 gap-4">
                        {q.options.map((o, oi) => (
                          <div key={o.id} className="flex items-center gap-2 bg-white p-2 rounded-xl">
                             <button onClick={() => {
                               const newOpts = q.options.map(op => ({ ...op, isCorrect: op.id === o.id }));
                               updateQuestion(q.id, { options: newOpts });
                             }} className={`w-8 h-8 rounded-lg font-black ${o.isCorrect ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                               {String.fromCharCode(65+oi)}
                             </button>
                             <input value={o.text} onChange={e => {
                               const newOpts = q.options.map(op => op.id === o.id ? { ...op, text: e.target.value } : op);
                               updateQuestion(q.id, { options: newOpts });
                             }} placeholder="Opsi..." className="flex-1 bg-transparent font-bold outline-none" />
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              ))}
           </section>
        </div>
      </div>
    </div>
  );
};

export default TeacherCreateTask;
