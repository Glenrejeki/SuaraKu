import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import VoiceButton from '../../components/VoiceButton';

const StudentCollaboration = () => {
  const { profile } = useAuthStore();
  const { speak } = useVoice();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const collabCommands = {
    'BACK': ['kembali', 'dashboard', 'keluar'],
    'SELECT_GROUP': ['pilih kelompok', 'buka kelompok', 'masuk kelompok'],
    'VOICE_CHAT': ['kirim suara', 'pesan suara'],
  };

  useEffect(() => {
    fetchGroups();
    speak("Halaman Kolaborasi. Pilih kelompok belajar kamu untuk berdiskusi dengan teman.");
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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

  const handleCommand = (command, transcript) => {
    if (command === 'BACK') navigate('/student/dashboard');
    if (command === 'SELECT_GROUP') {
      const found = groups.find(g => transcript.toLowerCase().includes(g.name.toLowerCase()));
      if (found) setSelectedGroup(found);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex h-screen overflow-hidden">
      {/* Sidebar List Kelompok */}
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-50">
          <button onClick={() => navigate('/student/dashboard')} className="text-slate-400 hover:text-purple-600 font-bold text-xs uppercase tracking-widest mb-4">
            ← Dashboard
          </button>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Kelompok Belajar</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className={`w-full p-6 text-left border-b border-slate-50 transition-all ${selectedGroup?.id === group.id ? 'bg-purple-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
            >
              <p className="font-black">{group.name}</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selectedGroup?.id === group.id ? 'text-purple-200' : 'text-slate-400'}`}>Klik untuk masuk</p>
            </button>
          ))}
          {groups.length === 0 && !loading && (
            <div className="p-10 text-center opacity-40">
              <p className="text-sm font-bold italic">Belum ada kelompok belajar.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Area Chat Kelompok */}
      <main className="flex-1 flex flex-col bg-white relative">
        {selectedGroup ? (
          <>
            <header className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">{selectedGroup.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Diskusi Teman Seperjuangan</p>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />)}
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender_id === profile.id ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 ml-1">
                    {msg.profiles?.full_name}
                  </span>
                  <div className={`max-w-[70%] p-5 rounded-[2rem] font-bold shadow-sm ${msg.sender_id === profile.id ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-8 text-center text-[10px] text-slate-300 font-medium">
              © 2025 SuaraKu. Developed by Christian Johannes Hutahaean & Glen Rejeki Sitorus
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
            <span className="text-9xl mb-8">👥</span>
            <p className="text-2xl font-black uppercase tracking-widest">Pilih kelompok belajarmu</p>
          </div>
        )}

        <VoiceButton
          commands={collabCommands}
          onCommandMatch={handleCommand}
          customText={selectedGroup ? `Bicara di ${selectedGroup.name}...` : 'Pilih Kelompok...'}
        />
      </main>
    </div>
  );
};

export default StudentCollaboration;
