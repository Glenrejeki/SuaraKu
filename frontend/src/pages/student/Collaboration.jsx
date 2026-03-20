import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import VoiceButton from '../../components/VoiceButton';
import StudentSidebar from '../../components/StudentSidebar';

const StudentCollaboration = () => {
  const { profile } = useAuthStore();
  const { speak } = useVoice();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef(null);

  const collabCommands = {
    'BACK': ['kembali', 'dashboard', 'keluar'],
    'SELECT_GROUP': ['pilih kelompok', 'buka kelompok', 'masuk kelompok'],
  };

  useEffect(() => {
    fetchGroups();
    speak("Halaman Kolaborasi. Pilih kelompok belajar kamu.");
  }, [speak]);

  useEffect(() => {
    if (selectedGroup) {
      fetchMessages(selectedGroup.id);
      const subscription = supabase
        .channel(`group-${selectedGroup.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${selectedGroup.id}` },
          payload => {
            setMessages(prev => [...prev, payload.new]);
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [selectedGroup]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('study_groups')
      .select('*, group_members!inner(student_id)')
      .eq('group_members.student_id', profile.id);
    if (data) setGroups(data);
    setLoading(false);
  };

  const fetchMessages = async (groupId) => {
    const { data } = await supabase
      .from('group_messages')
      .select('*, profiles:sender_id(full_name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;

    const { error } = await supabase.from('group_messages').insert({
      group_id: selectedGroup.id,
      sender_id: profile.id,
      content: newMessage
    });

    if (!error) setNewMessage('');
  };

  const handleCommand = (command, transcript) => {
    if (command === 'BACK') navigate('/student/dashboard');
    if (command === 'SELECT_GROUP') {
      const found = groups.find(g => transcript.toLowerCase().includes(g.name.toLowerCase()));
      if (found) setSelectedGroup(found);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-indigo-100">
      <StudentSidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="px-10 py-6 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
           <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Kolaborasi</h2>
              <p className="text-slate-500 font-medium text-xs mt-1">Belajar dan berdiskusi bersama teman sekelas.</p>
           </div>
           {selectedGroup && (
             <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                Kelompok: {selectedGroup.name}
             </div>
           )}
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Group List */}
          <div className="w-80 border-r border-slate-100 bg-white overflow-y-auto shrink-0 p-6 space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2 mb-4">Kelompok Saya</h3>
            <div className="space-y-2">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroup(group);
                    speak(`Membuka ${group.name}`);
                  }}
                  className={`w-full p-5 text-left rounded-2xl transition-all duration-300 group ${selectedGroup?.id === group.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  <p className="font-bold tracking-tight text-sm">{group.name}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selectedGroup?.id === group.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                    Klik untuk masuk
                  </p>
                </button>
              ))}
              {groups.length === 0 && !loading && (
                <div className="py-12 text-center opacity-40">
                  <p className="text-xs font-bold italic">Belum ada kelompok belajar.</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-50/30 relative overflow-hidden">
            {selectedGroup ? (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${msg.sender_id === profile.id ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                          {msg.profiles?.full_name || 'Teman'}
                        </span>
                        <div className={`max-w-[70%] p-4 rounded-3xl text-sm font-medium shadow-sm ${msg.sender_id === profile.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="p-8 bg-white border-t border-slate-100">
                   <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Tulis pesan ke kelompok..."
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
              <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-30">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center text-5xl mb-8">👥</div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Pilih Kelompok</h3>
                <p className="text-sm font-medium mt-2 max-w-xs mx-auto text-slate-500">Pilih salah satu kelompok di samping untuk mulai berdiskusi dengan teman-temanmu.</p>
              </div>
            )}
          </div>
        </div>

        <VoiceButton
          commands={collabCommands}
          onCommandMatch={handleCommand}
        />
      </main>
    </div>
  );
};

export default StudentCollaboration;
