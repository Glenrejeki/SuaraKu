// supabase/functions/generate-quiz/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const {
      topic,
      grade_level,
      question_types,
      total_questions,
      difficulty,
      title,
      instructions,
      duration_minutes
    } = body;

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ success: false, message: "API Key missing" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const studentGrade = grade_level || 4;
    const numQuestions = Math.min(parseInt(total_questions) || 5, 10);
    const level = difficulty || "medium";
    const types = Array.isArray(question_types) ? question_types : ["multiple_choice"];

    let mcCount = 0;
    let essayCount = 0;
    if (types.includes("multiple_choice") && types.includes("essay")) {
      mcCount = Math.floor(numQuestions * 0.7);
      essayCount = numQuestions - mcCount;
    } else if (types.includes("multiple_choice")) {
      mcCount = numQuestions;
    } else {
      essayCount = numQuestions;
    }

    const systemPrompt = `Kamu adalah Kak Bintang, guru SD profesional yang sangat teliti.
Buat soal berkualitas tinggi. Bahasa ramah anak.
PENTING: Kamu harus menghitung jawaban dengan sangat teliti. Jangan sampai salah kunci jawaban!
Setiap soal multiple_choice harus punya 4 pilihan jawaban yang masuk akal tapi hanya satu yang benar.`;

    const userPrompt = `Buatkan ${numQuestions} soal ${topic} untuk kelas ${studentGrade} SD (Kesulitan: ${level}).
Komposisi: ${mcCount} Pilihan Ganda, ${essayCount} Esai.

FORMAT JSON HARUS SEPERTI INI:
{
  "quiz_title": "${title || `Latihan ${topic}`}",
  "instructions": "${instructions || 'Kerjakan dengan teliti.'}",
  "duration_minutes": ${duration_minutes || 30},
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Berapakah 10 : 2?",
      "options": ["2", "4", "5", "8"],
      "correct_answer_index": 2,
      "explanation": "Karena 5 x 2 = 10, maka 10 : 2 adalah 5.",
      "points": 10
    },
    {
      "type": "essay",
      "question": "Sebutkan 3 warna pelangi!",
      "correct_answer": "Merah, Kuning, Hijau",
      "explanation": "Warna pelangi ada 7, contohnya Merah, Kuning, dan Hijau.",
      "points": 20
    }
  ]
}

PENTING: 'correct_answer_index' adalah angka 0-3 yang menunjuk ke urutan pilihan di 'options'.`;

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1, // Sangat rendah agar konsisten dan tidak berhalusinasi
        response_format: { type: "json_object" }
      }),
    });

    const groqData = await response.json();
    const quiz = JSON.parse(groqData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, quiz }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
