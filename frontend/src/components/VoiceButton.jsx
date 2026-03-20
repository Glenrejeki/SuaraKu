import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '../hooks/useVoice';
import { useVoiceCommand } from '../hooks/useVoiceCommand';
import { useAuthStore } from '../store/authStore';

const VoiceButton = ({ commands, onCommandMatch, customText }) => {
  const { isListening, isProcessing, startListening, stopListening, speak, error } = useVoice();
  const { processCommand } = useVoiceCommand(commands);
  const { profile } = useAuthStore();

  // Signature: pulsating animation for listening
  const pulseVariants = {
    listening: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const handleStart = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        const command = processCommand(transcript);
        if (command && onCommandMatch) {
          onCommandMatch(command, transcript);
        } else if (!command && profile?.disability_type === 'tunanetra') {
          speak(`Maaf, saya tidak mengerti perintah ${transcript}. Bisa ulangi?`);
        }
      });
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-purple-100"
          >
            <p className="text-purple-600 font-medium flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
              Mendengarkan...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {isListening && (
          <motion.div
            variants={pulseVariants}
            animate="listening"
            className="absolute inset-0 bg-purple-500 rounded-full -z-10"
          />
        )}

        <button
          onClick={handleStart}
          disabled={isProcessing}
          className={`
            w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300
            ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
          `}
          aria-label="Tombol Suara"
        >
          {isProcessing ? (
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1H9a1 1 0 01-1-1V7z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      <p className="mt-3 text-sm font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
        {customText || (isListening ? 'Ucapkan sekarang' : 'Tekan untuk bicara')}
      </p>
    </div>
  );
};

export default VoiceButton;
