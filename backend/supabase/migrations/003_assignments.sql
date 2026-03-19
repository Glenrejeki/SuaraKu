-- 003_assignments.sql
-- Tabel tugas yang dibuat guru
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Semua pengguna terautentikasi dapat melihat tugas
CREATE POLICY "Semua pengguna dapat melihat assignments"
  ON assignments FOR SELECT
  USING (auth.role() = 'authenticated');

-- Guru dapat insert
CREATE POLICY "Guru dapat insert assignments"
  ON assignments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
  );

-- Guru dapat update/miliknya
CREATE POLICY "Guru dapat update assignments miliknya"
  ON assignments FOR UPDATE
  USING (teacher_id = auth.uid());

-- Guru dapat delete miliknya
CREATE POLICY "Guru dapat delete assignments miliknya"
  ON assignments FOR DELETE
  USING (teacher_id = auth.uid());