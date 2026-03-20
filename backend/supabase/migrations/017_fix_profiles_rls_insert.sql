-- 017_fix_profiles_rls_insert.sql
-- Memastikan user bisa mengelola profilnya sendiri tanpa hambatan

DROP POLICY IF EXISTS "User dapat memasukkan profil sendiri" ON profiles;
DROP POLICY IF EXISTS "User dapat mengupdate profilnya sendiri" ON profiles;
DROP POLICY IF EXISTS "User dapat melihat profil sendiri" ON profiles;

-- 1. Izin Insert (Untuk cadangan jika trigger gagal)
CREATE POLICY "User dapat memasukkan profil sendiri"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. Izin Update (Untuk memperbarui data sendiri)
CREATE POLICY "User dapat mengupdate profilnya sendiri"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Izin Select (PENTING: User harus bisa membaca datanya sendiri agar upsert lancar)
CREATE POLICY "User dapat melihat profil sendiri"
ON profiles FOR SELECT
USING (auth.uid() = id);
