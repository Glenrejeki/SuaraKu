import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Mengambil laporan terbaru dari database (untuk Orang Tua)
   */
  const getParentReport = async (studentId) => {
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('student_reports')
        .select('content, created_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbError) throw dbError;
      return data?.content || null;
    } catch (err) {
      console.error("Gagal mengambil laporan:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Menjalankan AI untuk generate laporan dan menyimpannya ke database (untuk Guru)
   * MENGGUNAKAN FUNGSI BARU: generate-parent-report-ai
   */
  const generateAndSaveReport = async (studentId, teacherId) => {
    setLoading(true);
    setError(null);
    try {
      // MENGGUNAKAN FUNGSI BARU DENGAN VERIFY_JWT = FALSE
      const { data, error: invokeError } = await supabase.functions.invoke('generate-parent-report-ai', {
        body: { student_id: studentId }
      });

      if (invokeError) {
        console.error("Invoke Error Details:", invokeError);
        throw new Error(`Gagal menghubungi BintangAi: ${invokeError.message}`);
      }

      if (!data || !data.report) {
        throw new Error("BintangAi tidak memberikan respon laporan.");
      }

      const aiReportContent = data.report;

      // Simpan hasil narasi ke tabel student_reports agar bisa dibaca Orang Tua
      const { error: saveError } = await supabase
        .from('student_reports')
        .insert({
          student_id: studentId,
          teacher_id: teacherId,
          content: aiReportContent,
          report_type: 'mingguan'
        });

      if (saveError) throw saveError;

      return { success: true, report: aiReportContent };
    } catch (err) {
      console.error("Generate Report Error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const generateAIQuiz = async (params) => {
    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-quiz', {
        body: params
      });
      if (invokeError) throw invokeError;
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    getParentReport,
    generateAndSaveReport,
    generateAIQuiz,
    loading,
    error
  };
};