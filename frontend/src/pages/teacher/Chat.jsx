import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const TeacherChat = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
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
    // Guru melihat percakapan yang ditujukan kepadanya
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Sidebar - List Pesan Masuk dari Ortu */}
      <aside className="w-96 bg-white border-r border-slate-100 flex flex-col sticky top-0 h-screen">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
           <button onClick={() => navigate('/teacher/dashboard')} className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-purple-600 transition-colors">⬅ Dashboard</button>
           <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter text-right">Pesan Ortu</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
           <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Kotak Masuk Konsultasi</p>
           {conversations.map(convo => (
             <button
               key={convo.id}
               onClick={() => setSelectedConvo(convo)}
               className={`w-full p-6 rounded-[2.5rem] text-left transition-all duration-300 flex items-center gap-4 ${selectedConvo?.id === convo.id ? 'bg-slate-900 text-white shadow-2xl' : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
             >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${selectedConvo?.id === convo.id ? 'bg-white/10' : 'bg-indigo-100 text-indigo-600'}`}>
                   {convo.parent?.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                   <p className={`font-black uppercase tracking-tight truncate ${selectedConvo?.id === convo.id ? 'text-white' : 'text-slate-800'}`}>{convo.parent?.full_name}</p>
                   <p className={`text-[9px] font-bold truncate ${selectedConvo?.id === convo.id ? 'text-white/50' : 'text-slate-400'}`}>Orang Tua dari: {convo.student?.full_name}</p>
                </div>
             </button>
           ))}
           {conversations.length === 0 && (
             <div className="py-20 text-center opacity-20 font-black text-xs uppercase tracking-[0.2em]">Belum ada pesan</div>
           )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-screen bg-slate-50/30">
        {selectedConvo ? (
          <>
            <header className="bg-white/80 backdrop-blur-md p-8 border-b border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-2xl font-black">
                     {selectedConvo.parent?.full_name[0]}
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedConvo.parent?.full_name}</h2>
                     <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest">Membahas Perkembangan: {selectedConvo.student?.full_name}</p>
                  </div>
               </div>
               <div className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100">
                  Konsultasi Aktif
               </div>
            </header>

            <div className="flex-1 overflow-y-auto p-12 space-y-6">
               <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${msg.sender_id === profile.id ? 'justify-end' : 'justify-start'}`}
                    >
                       <div className={`max-w-[60%] p-6 rounded-[2.5rem] text-sm font-bold shadow-sm ${msg.sender_id === profile.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
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
                    placeholder="Tulis balasan untuk orang tua..."
                    className="flex-1 p-6 bg-slate-50 border-none rounded-[2rem] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-100 transition-all"
                  />
                  <button type="submit" className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-xl hover:bg-indigo-600 transition-all shadow-xl">
                     🚀
                  </button>
               </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
             <div className="text-8xl mb-8 grayscale opacity-20">💬</div>
             <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Pilih pesan masuk untuk membalas</h3>
             <p className="text-slate-400 font-bold mt-2 max-w-sm italic">Berikan bimbingan terbaik untuk orang tua siswa.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherChat;
