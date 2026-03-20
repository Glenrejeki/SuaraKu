import React from 'react';
import { motion } from 'framer-motion';

const XPBar = ({ current = 0, nextLevel = 1000, level = 1 }) => {
  const percentage = Math.min(Math.round((current / nextLevel) * 100), 100);

  return (
    <div className="w-full bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-end mb-4">
        <div>
          <span className="text-xs font-black text-purple-600 uppercase tracking-widest">Level {level}</span>
          <h3 className="text-2xl font-black text-slate-900">{current} <span className="text-slate-400 text-lg">XP</span></h3>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Berikutnya</span>
          <p className="text-sm font-bold text-slate-600">{nextLevel - current} XP lagi</p>
        </div>
      </div>

      <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.3)]"
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-[10px] font-bold text-slate-300 uppercase">Awal</span>
        <span className="text-[10px] font-bold text-slate-300 uppercase">Target</span>
      </div>
    </div>
  );
};

export default XPBar;
