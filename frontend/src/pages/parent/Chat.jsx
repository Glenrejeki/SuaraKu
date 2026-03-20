import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const ParentChat = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      getOrCreateConversation();
    }
  }, [selectedTeacher]);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      const subscription = supabase
        .channel(`convo-${conversation.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [conversation]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTeachers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('role', 'guru');
    if (data) setTeachers(data);
    setLoading(false);
  };

  const getOrCreateConversation = async () => {
    const { data: existing } = await supabase
      .from('direct_conversations')
      .select('*')
      .eq('teacher_id', selectedTeacher.id)
      .eq('parent_id', profile.id)
      .single();

    if (existing) {
      setConversation(existing);
    } else {
      const { data: created } = await supabase
        .from('direct_conversations')
        .insert({
          teacher_id: selectedTeacher.id,
          parent_id: profile.id,
          student_id: profile.linked_student_id
        })
        .select()
        .single();
      if (created) setConversation(created);
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    const { error } = await supabase.from('direct_messages').insert({
      conversation_id: conversation.id,
      sender_id: profile.id,
      content: newMessage
    });

    if (!error) setNewMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Sidebar - List Guru */}
      <aside className="w-96 bg-white border-r border-slate-100 flex flex-col sticky top-0 h-screen">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
           <button onClick={() => navigate('/parent/dashboard')} className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-purple-600 transition-colors">⬅ Dashboard</button>
           <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Konsultasi</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
           <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Daftar Guru Tersedia</p>
           {teachers.map(t => (
             <button
               key={t.id}
               onClick={() => setSelectedTeacher(t)}
               className={`w-full p-6 rounded-[2rem] text-left transition-all duration-300 flex items-center gap-4 ${selectedTeacher?.id === t.id ? 'bg-slate-900 text-white shadow-2xl' : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
             >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${selectedTeacher?.id === t.id ? 'bg-white/10' : 'bg-purple-100 text-purple-600'}`}>
                   {t.full_name[0]}
                </div>
                <div>
                   <p className={`font-black uppercase tracking-tight ${selectedTeacher?.id === t.id ? 'text-white' : 'text-slate-800'}`}>{t.full_name}</p>
                   <p className={`text-[9px] font-bold ${selectedTeacher?.id === t.id ? 'text-white/50' : 'text-slate-400'}`}>Guru Wali / Pengajar</p>
                </div>
             </button>
           ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col h-screen bg-slate-50/30">
        {selectedTeacher ? (
          <>
            <header className="bg-white/80 backdrop-blur-md p-8 border-b border-slate-100 flex items-center gap-6">
               <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-2xl font-black">
                  {selectedTeacher.full_name[0]}
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedTeacher.full_name}</h2>
                  <p className="text-green-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-2">🟢 Online • Chat Terenkripsi</p>
               </div>
            </header>

            <div className="flex-1 overflow-y-auto p-12 space-y-6">
               <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${msg.sender_id === profile.id ? 'justify-end' : 'justify-start'}`}
                    >
                       <div className={`max-w-[60%] p-6 rounded-[2.5rem] text-sm font-bold shadow-sm ${msg.sender_id === profile.id ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                          {msg.content}
                          <p className={`text-[8px] mt-2 opacity-50 ${msg.sender_id === profile.id ? 'text-right' : 'text-left'}`}>
                             {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                       </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
               <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-8 bg-white border-t border-slate-100">
               <div className="max-w-4xl mx-auto flex gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tulis pesan untuk guru..."
                    className="flex-1 p-6 bg-slate-50 border-none rounded-[2rem] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-100 transition-all"
                  />
                  <button type="submit" className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-xl hover:bg-purple-600 transition-all shadow-xl shadow-slate-200">
                     🚀
                  </button>
               </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
             <div className="text-8xl mb-8 grayscale opacity-20">💬</div>
             <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Pilih guru untuk memulai diskusi</h3>
             <p className="text-slate-400 font-bold mt-2 max-w-sm italic">Hanya Anda dan Guru terpilih yang dapat melihat percakapan ini.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentChat;
