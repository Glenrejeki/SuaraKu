-- 004_submissions.sql
-- Tabel jawaban siswa
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_text TEXT, -- hasil transkrip suara atau teks
  audio_url TEXT, -- URL rekaman suara (opsional)
  score INTEGER, -- nilai jika sudah dinilai
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Siswa dapat melihat submission miliknya
CREATE POLICY "Siswa dapat melihat submission sendiri"
  ON submissions FOR SELECT
  USING (student_id = auth.uid());

-- Guru dapat melihat semua submission untuk assignment yang dia buat
CREATE POLICY "Guru dapat melihat submission assignmentnya"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = assignment_id AND a.teacher_id = auth.uid()
    )
  );

-- Siswa dapat insert submission (dirinya sendiri)
CREATE POLICY "Siswa dapat mengumpulkan tugas"
  ON submissions FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'siswa')
  );

-- Siswa dapat update submission miliknya (misal sebelum deadline)
CREATE POLICY "Siswa dapat update submission sendiri"
  ON submissions FOR UPDATE
  USING (student_id = auth.uid());

-- Guru dapat memberikan score (update)
CREATE POLICY "Guru dapat memberikan nilai"
  ON submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = assignment_id AND a.teacher_id = auth.uid()
    )
  );