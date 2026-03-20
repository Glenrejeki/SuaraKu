import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import ParentSidebar from '../../components/ParentSidebar';

const ParentChat = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversation.id}`
        }, (payload) => {
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

  const filteredTeachers = teachers.filter(t =>
    t.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100">
      <ParentSidebar />

      <aside className="w-96 bg-white border-r border-slate-100 flex flex-col sticky top-0 h-screen overflow-hidden">
        <div className="p-8 border-b border-slate-50">
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Konsultasi Guru</h1>

           <div className="relative">
             <input
               type="text"
               placeholder="Cari nama guru..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
             />
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2">
               <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
             </svg>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
           {filteredTeachers.map(t => (
             <button
               key={t.id}
               onClick={() => {
                 setSelectedTeacher(t);
                 setMessages([]);
                 setConversation(null);
               }}
               className={`w-full p-4 rounded-2xl text-left transition-all duration-200 flex items-center gap-4 ${selectedTeacher?.id === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${selectedTeacher?.id === t.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                   {t.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                   <p className={`font-bold truncate text-sm ${selectedTeacher?.id === t.id ? 'text-white' : 'text-slate-900'}`}>{t.full_name}</p>
                   <p className="text-[11px] font-bold truncate opacity-60">Guru Pengajar</p>
                </div>
             </button>
           ))}
           {filteredTeachers.length === 0 && (
             <div className="py-20 text-center">
               <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Tidak ditemukan</p>
             </div>
           )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen bg-white">
        {selectedTeacher ? (
          <>
            <header className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xl font-bold">
                     {selectedTeacher.full_name[0]}
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-slate-900 tracking-tight">{selectedTeacher.full_name}</h2>
                     <p className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                       Online
                     </p>
                  </div>
               </div>
               <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                  Private Chat
               </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-[#FAFAFA]/50">
               <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender_id === profile.id ? 'justify-end' : 'justify-start'}`}
                    >
                       <div className={`max-w-[70%] p-4 rounded-3xl text-sm font-medium shadow-sm ${msg.sender_id === profile.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                          {msg.content}
                          <p className={`text-[9px] mt-2 font-bold opacity-50 ${msg.sender_id === profile.id ? 'text-right' : 'text-left'}`}>
                             {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                       </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
               <div ref={scrollRef} />
            </div>

            <div className="p-8 bg-white border-t border-slate-100">
               <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tulis pesan untuk guru..."
                    className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                     </svg>
                  </button>
               </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
             <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center text-4xl mb-8">💬</div>
             <h3 className="text-xl font-bold text-slate-900 tracking-tight">Pilih Guru</h3>
             <p className="text-slate-400 font-medium mt-2 max-w-xs text-sm">Pilih guru pengajar dari daftar di samping untuk mulai berdiskusi mengenai perkembangan belajar anak.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentChat;
