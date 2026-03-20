import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const TeacherChat = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConvo) {
      fetchMessages();
      const subscription = supabase
        .channel(`convo-${selectedConvo.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${selectedConvo.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedConvo]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('direct_conversations')
      .select('*, parent:profiles!direct_conversations_parent_id_fkey(id, full_name), student:profiles!direct_conversations_student_id_fkey(full_name)')
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) setConversations(data);
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', selectedConvo.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvo) return;

    const { error } = await supabase.from('direct_messages').insert({
      conversation_id: selectedConvo.id,
      sender_id: profile.id,
      content: newMessage
    });

    if (!error) setNewMessage('');
  };

  const filteredConversations = conversations.filter(convo =>
    convo.parent?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    convo.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100">
      {/* Sidebar */}
      <aside className="w-96 bg-white border-r border-slate-100 flex flex-col sticky top-0 h-screen overflow-hidden">
        <div className="p-8 border-b border-slate-50">
           <button
             onClick={() => navigate('/teacher/dashboard')}
             className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors mb-6"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
               <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
             </svg>
             Dashboard
           </button>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Pesan Ortu</h1>

           <div className="relative">
             <input
               type="text"
               placeholder="Cari orang tua atau siswa..."
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
           {filteredConversations.map(convo => (
             <button
               key={convo.id}
               onClick={() => setSelectedConvo(convo)}
               className={`w-full p-4 rounded-2xl text-left transition-all duration-200 flex items-center gap-4 ${selectedConvo?.id === convo.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${selectedConvo?.id === convo.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                   {convo.parent?.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                   <p className={`font-bold truncate text-sm ${selectedConvo?.id === convo.id ? 'text-white' : 'text-slate-900'}`}>{convo.parent?.full_name}</p>
                   <p className={`text-[11px] font-bold truncate opacity-60`}>Siswa: {convo.student?.full_name}</p>
                </div>
             </button>
           ))}
           {filteredConversations.length === 0 && (
             <div className="py-20 text-center">
               <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Tidak ditemukan</p>
             </div>
           )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-screen bg-white">
        {selectedConvo ? (
          <>
            <header className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xl font-bold">
                     {selectedConvo.parent?.full_name[0]}
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-slate-900 tracking-tight">{selectedConvo.parent?.full_name}</h2>
                     <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Orang Tua {selectedConvo.student?.full_name}</p>
                  </div>
               </div>
               <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                  Konsultasi
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
                    placeholder="Tulis pesan balasan..."
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
             <h3 className="text-xl font-bold text-slate-900 tracking-tight">Pilih Percakapan</h3>
             <p className="text-slate-400 font-medium mt-2 max-w-xs text-sm">Pilih orang tua dari daftar di samping untuk mulai berkonsultasi mengenai perkembangan siswa.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherChat;
