import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useAI } from '../../hooks/useAI';

const TeacherCreateTask = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { simplify } = useAI();

  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);
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
      options: type === 'pilihan_ganda' ? [
        { id: crypto.randomUUID(), text: '', isCorrect: false },
        { id: crypto.randomUUID(), text: '', isCorrect: false },
        { id: crypto.randomUUID(), text: '', isCorrect: false },
        { id: crypto.randomUUID(), text: '', isCorrect: false }
      ] : []
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

      navigate('/teacher/dashboard');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-indigo-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
             <button
              onClick={() => navigate('/teacher/dashboard')}
              className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
               </svg>
             </button>
             <div>
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{editId ? 'Edit Tugas' : 'Buat Tugas Baru'}</h1>
               <p className="text-slate-500 font-medium text-sm mt-1">Tentukan instruksi dan bank soal untuk siswa.</p>
             </div>
          </div>
          <div className="flex gap-3">
             <button
               onClick={() => navigate('/teacher/dashboard')}
               className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all"
             >
               Batal
             </button>
             <button
               onClick={handleSubmit}
               disabled={loading}
               className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
             >
               {loading ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Terbitkan Tugas')}
             </button>
          </div>
        </header>

        <div className="space-y-8">
           {/* Section: Info Dasar */}
           <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Judul Tugas</label>
                <input
                  type="text"
                  value={taskData.title}
                  onChange={e => setTaskData({...taskData, title: e.target.value})}
                  placeholder="Masukkan judul tugas..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Instruksi Pengerjaan</label>
                <textarea
                  value={taskData.description}
                  onChange={e => setTaskData({...taskData, description: e.target.value})}
                  placeholder="Berikan instruksi yang jelas untuk siswa..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-700 min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Batas Tanggal</label>
                  <input type="date" value={taskData.deadlineDate} onChange={e => setTaskData({...taskData, deadlineDate: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Batas Waktu</label>
                  <input type="time" value={taskData.deadlineTime} onChange={e => setTaskData({...taskData, deadlineTime: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Durasi (Menit)</label>
                  <input type="number" value={taskData.duration} onChange={e => setTaskData({...taskData, duration: e.target.value})} placeholder="Opsional" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none" />
                </div>
              </div>
           </section>

           {/* Section: Bank Soal */}
           <section className="space-y-6">
              <div className="flex justify-between items-center px-2">
                 <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bank Soal</h2>
                    <p className="text-xs text-slate-400 font-medium">{questions.length} Pertanyaan ditambahkan</p>
                 </div>
                 <div className="flex gap-2">
                    <button
                      onClick={() => addQuestion('pilihan_ganda')}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all"
                    >
                      + Pilihan Ganda
                    </button>
                    <button
                      onClick={() => addQuestion('esai')}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                    >
                      + Esai
                    </button>
                 </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {questions.map((q, i) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6 relative group"
                    >
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-bold">{i+1}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{q.type === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Esai'}</span>
                          </div>
                          <button
                            onClick={() => setQuestions(questions.filter(qu => qu.id !== q.id))}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pertanyaan</label>
                          <input
                            value={q.text}
                            onChange={e => updateQuestion(q.id, { text: e.target.value })}
                            placeholder="Tulis pertanyaan di sini..."
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                          />
                       </div>

                       {q.type === 'pilihan_ganda' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {q.options.map((o, oi) => (
                              <div key={o.id} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-2xl group/opt focus-within:border-indigo-500 transition-all">
                                 <button
                                   onClick={() => {
                                     const newOpts = q.options.map(op => ({ ...op, isCorrect: op.id === o.id }));
                                     updateQuestion(q.id, { options: newOpts });
                                   }}
                                   className={`w-10 h-10 rounded-xl font-bold transition-all shrink-0 ${o.isCorrect ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-200'}`}
                                 >
                                   {String.fromCharCode(65+oi)}
                                 </button>
                                 <input
                                   value={o.text}
                                   onChange={e => {
                                     const newOpts = q.options.map(op => op.id === o.id ? { ...op, text: e.target.value } : op);
                                     updateQuestion(q.id, { options: newOpts });
                                   }}
                                   placeholder={`Opsi ${String.fromCharCode(65+oi)}...`}
                                   className="flex-1 bg-transparent font-bold text-slate-700 outline-none py-2"
                                 />
                              </div>
                            ))}
                         </div>
                       )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {questions.length === 0 && (
                   <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">✍️</div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Belum ada pertanyaan. Klik tombol di atas untuk menambah.</p>
                   </div>
                )}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default TeacherCreateTask;
