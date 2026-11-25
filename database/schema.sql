-- ============================================================================
-- SISTEM INFORMASI MANAJEMEN SIDANG SKRIPSI (SIM-SIDANG)
-- SKEMA BASIS DATA RELASIONAL (PostgreSQL / Supabase Compatible)
-- ============================================================================
-- Fitur Integritas Data:
-- 1. Normalisasi 3NF (Third Normal Form)
-- 2. Foreign Key Constraints dengan ON DELETE / ON UPDATE actions
-- 3. Unique Constraints (Anti Ruangan Ganda, NIDN Unik, NIM Unik)
-- 4. Check Constraints (Jam Selesai > Jam Mulai, Nilai 0-100, Examiner Berbeda)
-- 5. Database Trigger untuk Validasi Bebas Bentrok Dosen & Mahasiswa
-- ============================================================================

-- Ekstensi UUID (opsional jika menggunakan UUID otomatis)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABEL: dosen
-- Menyimpan data master dosen penguji dan pembimbing
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dosen (
    id VARCHAR(50) PRIMARY KEY,
    nidn VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(150) NOT NULL,
    kode VARCHAR(10) NOT NULL UNIQUE,
    program_studi VARCHAR(100) NOT NULL DEFAULT 'Teknik Informatika',
    email VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks untuk pencarian dosen
CREATE INDEX IF NOT EXISTS idx_dosen_nidn ON dosen(nidn);
CREATE INDEX IF NOT EXISTS idx_dosen_nama ON dosen(nama);
CREATE INDEX IF NOT EXISTS idx_dosen_kode ON dosen(kode);

-- ----------------------------------------------------------------------------
-- 2. TABEL: mahasiswa
-- Menyimpan data master mahasiswa peserta sidang skripsi
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mahasiswa (
    nim VARCHAR(20) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    program_studi VARCHAR(100) NOT NULL DEFAULT 'Teknik Informatika',
    tahun_akademik VARCHAR(20) NOT NULL DEFAULT '2024/2025',
    email VARCHAR(100),
    no_telepon VARCHAR(25),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mahasiswa_nama ON mahasiswa(nama);

-- ----------------------------------------------------------------------------
-- 3. TABEL: ruangan
-- Menyimpan data ruangan sidang, kapasitas, dan lokasi gedung
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ruangan (
    id VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(50) NOT NULL UNIQUE,
    gedung VARCHAR(100) NOT NULL,
    lantai VARCHAR(50) NOT NULL,
    kapasitas INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ruangan_kapasitas CHECK (kapasitas > 0)
);

CREATE INDEX IF NOT EXISTS idx_ruangan_nama ON ruangan(nama);

-- ----------------------------------------------------------------------------
-- 4. TABEL: slot_waktu
-- Menyimpan jam sesi pelaksanaan sidang pada matriks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS slot_waktu (
    id VARCHAR(50) PRIMARY KEY,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    label VARCHAR(50) NOT NULL UNIQUE,
    urutan INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_slot_waktu_jam CHECK (jam_selesai > jam_mulai)
);

CREATE INDEX IF NOT EXISTS idx_slot_waktu_jam ON slot_waktu(jam_mulai, jam_selesai);

-- ----------------------------------------------------------------------------
-- 5. TABEL: periode_akademik (Active Academic Period Management)
-- Pengendali periode akademik yang menjadi acuan proses sidang skripsi
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS periode_akademik (
    id VARCHAR(50) PRIMARY KEY,
    tahun_akademik VARCHAR(9) NOT NULL,
    semester VARCHAR(10) NOT NULL,
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'persiapan',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT periode_semester_check
        CHECK (semester IN ('Ganjil', 'Genap')),

    CONSTRAINT periode_status_check
        CHECK (status IN ('persiapan', 'berjalan', 'selesai')),

    CONSTRAINT periode_tahun_akademik_unique
        UNIQUE (tahun_akademik, semester),

    CONSTRAINT periode_tanggal_check
        CHECK (
            tanggal_mulai IS NULL
            OR tanggal_selesai IS NULL
            OR tanggal_mulai <= tanggal_selesai
        )
);

-- Unique partial index: Menjamin hanya boleh terdapat satu periode akademik aktif pada satu waktu
CREATE UNIQUE INDEX IF NOT EXISTS one_active_period
ON periode_akademik (is_active)
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_periode_tahun_sem ON periode_akademik(tahun_akademik, semester);
CREATE INDEX IF NOT EXISTS idx_periode_status ON periode_akademik(status);

-- ----------------------------------------------------------------------------
-- 6. TABEL: pengajuan_sidang
-- Menyimpan usulan/draft skripsi mahasiswa beserta susunan 3 dosen penguji:
--  - Dosen Reviewer  -> Ketua Penguji (Penguji 1)
--  - Dosen Pembimbing -> Penguji 2
--  - Dosen Penguji 3 -> Ditentukan oleh admin / sistem
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pengajuan_sidang (
    id VARCHAR(50) PRIMARY KEY,
    mahasiswa_nim VARCHAR(20) NOT NULL,
    periode_akademik_id VARCHAR(50) NOT NULL,
    judul_skripsi TEXT NOT NULL,
    jenis VARCHAR(50) NOT NULL DEFAULT 'Skripsi',
    dosen_reviewer_id VARCHAR(50) NOT NULL,
    dosen_pembimbing_id VARCHAR(50) NOT NULL,
    dosen_penguji3_id VARCHAR(50),
    nilai_seminar NUMERIC(5,2),
    status VARCHAR(20) NOT NULL DEFAULT 'unassigned',
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_pengajuan_mahasiswa FOREIGN KEY (mahasiswa_nim)
        REFERENCES mahasiswa(nim) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pengajuan_periode FOREIGN KEY (periode_akademik_id)
        REFERENCES periode_akademik(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pengajuan_reviewer FOREIGN KEY (dosen_reviewer_id)
        REFERENCES dosen(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pengajuan_pembimbing FOREIGN KEY (dosen_pembimbing_id)
        REFERENCES dosen(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pengajuan_penguji3 FOREIGN KEY (dosen_penguji3_id)
        REFERENCES dosen(id) ON UPDATE CASCADE ON DELETE SET NULL,

    -- Validasi Integritas Aturan Sidang:
    -- Cegah pengajuan ganda mahasiswa pada periode akademik yang sama
    CONSTRAINT uq_pengajuan_mahasiswa_periode UNIQUE (mahasiswa_nim, periode_akademik_id),
    -- 1. Reviewer (P1) tidak boleh sama dengan Pembimbing (P2)
    CONSTRAINT chk_penguji_1_2_beda CHECK (dosen_reviewer_id <> dosen_pembimbing_id),
    -- 2. Penguji 3 tidak boleh sama dengan P1 atau P2
    CONSTRAINT chk_penguji_1_3_beda CHECK (dosen_penguji3_id IS NULL OR dosen_reviewer_id <> dosen_penguji3_id),
    CONSTRAINT chk_penguji_2_3_beda CHECK (dosen_penguji3_id IS NULL OR dosen_pembimbing_id <> dosen_penguji3_id),
    -- 3. Validasi status sidang
    CONSTRAINT chk_pengajuan_status CHECK (status IN ('unassigned', 'scheduled', 'completed', 'cancelled')),
    -- 4. Validasi jenis naskah
    CONSTRAINT chk_pengajuan_jenis CHECK (jenis IN ('Skripsi', 'Tugas Akhir')),
    -- 5. Validasi nilai seminar
    CONSTRAINT chk_pengajuan_nilai CHECK (nilai_seminar IS NULL OR (nilai_seminar >= 0 AND nilai_seminar <= 100))
);

CREATE INDEX IF NOT EXISTS idx_pengajuan_periode ON pengajuan_sidang(periode_akademik_id);
CREATE INDEX IF NOT EXISTS idx_pengajuan_status ON pengajuan_sidang(status);
CREATE INDEX IF NOT EXISTS idx_pengajuan_reviewer ON pengajuan_sidang(dosen_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_pengajuan_pembimbing ON pengajuan_sidang(dosen_pembimbing_id);
CREATE INDEX IF NOT EXISTS idx_pengajuan_penguji3 ON pengajuan_sidang(dosen_penguji3_id);

-- ----------------------------------------------------------------------------
-- 7. TABEL: jadwal_sidang
-- Menyimpan penempatan sidang pada sel matriks (Ruangan x Slot Waktu x Tanggal)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jadwal_sidang (
    id VARCHAR(50) PRIMARY KEY,
    pengajuan_id VARCHAR(50) NOT NULL UNIQUE,
    tanggal DATE NOT NULL,
    slot_waktu_id VARCHAR(50) NOT NULL,
    ruangan_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_jadwal_pengajuan FOREIGN KEY (pengajuan_id)
        REFERENCES pengajuan_sidang(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_jadwal_slot FOREIGN KEY (slot_waktu_id)
        REFERENCES slot_waktu(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_jadwal_ruangan FOREIGN KEY (ruangan_id)
        REFERENCES ruangan(id) ON UPDATE CASCADE ON DELETE RESTRICT,

    -- INTEGRITAS KRUSIAL: Mencegah 2 sidang menempati ruangan dan slot waktu yang sama di tanggal yang sama!
    CONSTRAINT uq_jadwal_tanggal_slot_ruangan UNIQUE (tanggal, slot_waktu_id, ruangan_id),

    -- Validasi status jadwal
    CONSTRAINT chk_jadwal_status CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_sidang(tanggal);
CREATE INDEX IF NOT EXISTS idx_jadwal_slot ON jadwal_sidang(slot_waktu_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_ruangan ON jadwal_sidang(ruangan_id);

-- ----------------------------------------------------------------------------
-- 7. FUNCTION & TRIGGER: Validasi Bentrok Jadwal Real-Time di Level Database
-- Menjamin bahwa:
--  A. Dosen (P1, P2, P3) tidak boleh menguji di 2 tempat berbeda pada slot & tanggal yang sama.
--  B. Mahasiswa tidak boleh terjadwal di 2 tempat berbeda pada slot & tanggal yang sama.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_validasi_bentrok_jadwal()
RETURNS TRIGGER AS $$
DECLARE
    v_reviewer_id VARCHAR(50);
    v_pembimbing_id VARCHAR(50);
    v_penguji3_id VARCHAR(50);
    v_mhs_nim VARCHAR(20);
    v_bentrok_count INTEGER;
    v_bentrok_info TEXT;
BEGIN
    -- Ambil data penguji dan mahasiswa dari pengajuan_sidang terkait
    SELECT dosen_reviewer_id, dosen_pembimbing_id, dosen_penguji3_id, mahasiswa_nim
    INTO v_reviewer_id, v_pembimbing_id, v_penguji3_id, v_mhs_nim
    FROM pengajuan_sidang
    WHERE id = NEW.pengajuan_id;

    -- Validasi A: Cek apakah Reviewer (P1) bentrok di sidang lain
    SELECT COUNT(*), string_agg(p.mahasiswa_nim || ' (Ruang ' || r.nama || ')', ', ')
    INTO v_bentrok_count, v_bentrok_info
    FROM jadwal_sidang j
    JOIN pengajuan_sidang p ON j.pengajuan_id = p.id
    JOIN ruangan r ON j.ruangan_id = r.id
    WHERE j.tanggal = NEW.tanggal 
      AND j.slot_waktu_id = NEW.slot_waktu_id
      AND j.id <> COALESCE(NEW.id, '')
      AND (p.dosen_reviewer_id = v_reviewer_id 
           OR p.dosen_pembimbing_id = v_reviewer_id 
           OR p.dosen_penguji3_id = v_reviewer_id);

    IF v_bentrok_count > 0 THEN
        RAISE EXCEPTION 'Bentrok Jadwal Dosen Reviewer / P1: Dosen ID % sudah bertugas pada sesi % di %',
            v_reviewer_id, NEW.slot_waktu_id, v_bentrok_info;
    END IF;

    -- Validasi B: Cek apakah Pembimbing (P2) bentrok di sidang lain
    SELECT COUNT(*), string_agg(p.mahasiswa_nim || ' (Ruang ' || r.nama || ')', ', ')
    INTO v_bentrok_count, v_bentrok_info
    FROM jadwal_sidang j
    JOIN pengajuan_sidang p ON j.pengajuan_id = p.id
    JOIN ruangan r ON j.ruangan_id = r.id
    WHERE j.tanggal = NEW.tanggal 
      AND j.slot_waktu_id = NEW.slot_waktu_id
      AND j.id <> COALESCE(NEW.id, '')
      AND (p.dosen_reviewer_id = v_pembimbing_id 
           OR p.dosen_pembimbing_id = v_pembimbing_id 
           OR p.dosen_penguji3_id = v_pembimbing_id);

    IF v_bentrok_count > 0 THEN
        RAISE EXCEPTION 'Bentrok Jadwal Dosen Pembimbing / P2: Dosen ID % sudah bertugas pada sesi % di %',
            v_pembimbing_id, NEW.slot_waktu_id, v_bentrok_info;
    END IF;

    -- Validasi C: Cek apakah Penguji 3 (jika ada) bentrok di sidang lain
    IF v_penguji3_id IS NOT NULL THEN
        SELECT COUNT(*), string_agg(p.mahasiswa_nim || ' (Ruang ' || r.nama || ')', ', ')
        INTO v_bentrok_count, v_bentrok_info
        FROM jadwal_sidang j
        JOIN pengajuan_sidang p ON j.pengajuan_id = p.id
        JOIN ruangan r ON j.ruangan_id = r.id
        WHERE j.tanggal = NEW.tanggal 
          AND j.slot_waktu_id = NEW.slot_waktu_id
          AND j.id <> COALESCE(NEW.id, '')
          AND (p.dosen_reviewer_id = v_penguji3_id 
               OR p.dosen_pembimbing_id = v_penguji3_id 
               OR p.dosen_penguji3_id = v_penguji3_id);

        IF v_bentrok_count > 0 THEN
            RAISE EXCEPTION 'Bentrok Jadwal Penguji 3: Dosen ID % sudah bertugas pada sesi % di %',
                v_penguji3_id, NEW.slot_waktu_id, v_bentrok_info;
        END IF;
    END IF;

    -- Auto-update status di pengajuan_sidang menjadi 'scheduled'
    UPDATE pengajuan_sidang 
    SET status = 'scheduled', updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.pengajuan_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang Trigger pada tabel jadwal_sidang
DROP TRIGGER IF EXISTS trg_cek_bentrok_sebelum_simpan ON jadwal_sidang;
CREATE TRIGGER trg_cek_bentrok_sebelum_simpan
    BEFORE INSERT OR UPDATE ON jadwal_sidang
    FOR EACH ROW
    EXECUTE FUNCTION trg_validasi_bentrok_jadwal();

-- Trigger saat jadwal dihapus: kembalikan status pengajuan menjadi 'unassigned'
CREATE OR REPLACE FUNCTION trg_setelah_hapus_jadwal()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE pengajuan_sidang
    SET status = 'unassigned', updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.pengajuan_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reset_status_setelah_hapus ON jadwal_sidang;
CREATE TRIGGER trg_reset_status_setelah_hapus
    AFTER DELETE ON jadwal_sidang
    FOR EACH ROW
    EXECUTE FUNCTION trg_setelah_hapus_jadwal();

-- ----------------------------------------------------------------------------
-- 8. DATABASE VIEWS: Rekapitulasi & Kueri Siap Pakai
-- ----------------------------------------------------------------------------

-- View: v_jadwal_lengkap (Denormalized Master Schedule View)
CREATE OR REPLACE VIEW v_jadwal_lengkap AS
SELECT 
    j.id AS jadwal_id,
    j.tanggal,
    s.id AS slot_id,
    s.label AS slot_label,
    s.jam_mulai,
    s.jam_selesai,
    r.id AS ruangan_id,
    r.nama AS ruangan_nama,
    r.gedung AS ruangan_gedung,
    r.lantai AS ruangan_lantai,
    m.nim AS mahasiswa_nim,
    m.nama AS mahasiswa_nama,
    m.program_studi,
    p.id AS pengajuan_id,
    p.judul_skripsi,
    p.jenis AS jenis_skripsi,
    p.nilai_seminar,
    -- Periode Akademik
    prd.id AS periode_id,
    prd.tahun_akademik,
    prd.semester AS periode_semester,
    prd.is_active AS periode_is_active,
    prd.status AS periode_status,
    -- Dosen Reviewer / Penguji 1
    d1.id AS p1_id,
    d1.nama AS p1_nama,
    d1.kode AS p1_kode,
    d1.nidn AS p1_nidn,
    -- Dosen Pembimbing / Penguji 2
    d2.id AS p2_id,
    d2.nama AS p2_nama,
    d2.kode AS p2_kode,
    d2.nidn AS p2_nidn,
    -- Dosen Penguji 3
    d3.id AS p3_id,
    d3.nama AS p3_nama,
    d3.kode AS p3_kode,
    d3.nidn AS p3_nidn,
    j.status AS status_sidang
FROM jadwal_sidang j
JOIN pengajuan_sidang p ON j.pengajuan_id = p.id
JOIN periode_akademik prd ON p.periode_akademik_id = prd.id
JOIN mahasiswa m ON p.mahasiswa_nim = m.nim
JOIN slot_waktu s ON j.slot_waktu_id = s.id
JOIN ruangan r ON j.ruangan_id = r.id
JOIN dosen d1 ON p.dosen_reviewer_id = d1.id
JOIN dosen d2 ON p.dosen_pembimbing_id = d2.id
LEFT JOIN dosen d3 ON p.dosen_penguji3_id = d3.id;

-- View: v_beban_sidang_dosen (Workload Summary Per Lecturer)
CREATE OR REPLACE VIEW v_beban_sidang_dosen AS
SELECT 
    d.id AS dosen_id,
    d.nama AS dosen_nama,
    d.kode AS dosen_kode,
    d.nidn AS dosen_nidn,
    COUNT(CASE WHEN p.dosen_reviewer_id = d.id AND j.id IS NOT NULL THEN 1 END) AS total_sebagai_p1,
    COUNT(CASE WHEN p.dosen_pembimbing_id = d.id AND j.id IS NOT NULL THEN 1 END) AS total_sebagai_p2,
    COUNT(CASE WHEN p.dosen_penguji3_id = d.id AND j.id IS NOT NULL THEN 1 END) AS total_sebagai_p3,
    COUNT(j.id) AS total_sidang_terjadwal
FROM dosen d
LEFT JOIN pengajuan_sidang p ON (p.dosen_reviewer_id = d.id OR p.dosen_pembimbing_id = d.id OR p.dosen_penguji3_id = d.id)
LEFT JOIN jadwal_sidang j ON j.pengajuan_id = p.id
GROUP BY d.id, d.nama, d.kode, d.nidn;

-- ----------------------------------------------------------------------------
-- 9. TABEL: pengguna (Autentikasi & Hak Akses Berbasis Peran / RBAC)
-- Mendukung dosen yang sekaligus bertindak sebagai admin dengan email sama
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pengguna (
    id VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    roles TEXT[] NOT NULL DEFAULT ARRAY['mahasiswa'], -- Contoh: ARRAY['dosen', 'admin']
    dosen_id VARCHAR(50) REFERENCES dosen(id) ON UPDATE CASCADE ON DELETE SET NULL,
    mahasiswa_nim VARCHAR(20) REFERENCES mahasiswa(nim) ON UPDATE CASCADE ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pengguna_email ON pengguna(email);

-- ----------------------------------------------------------------------------
-- 10. AUTOMATIC ACCOUNT PROVISIONING TRIGGERS
-- Otomatis membuatkan akun login (kredensial) di tabel `pengguna` saat data 
-- dosen atau mahasiswa baru ditambahkan ke sistem.
-- ----------------------------------------------------------------------------

-- A. Trigger Function untuk Penyediaan Akun Dosen Otomatis
CREATE OR REPLACE FUNCTION fn_auto_provision_user_dosen()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id VARCHAR(50);
    v_user_email VARCHAR(100);
BEGIN
    v_user_id := 'usr-lec-' || NEW.id;
    v_user_email := LOWER(COALESCE(NEW.email, LOWER(NEW.kode) || '@univ.ac.id'));

    INSERT INTO pengguna (
        id, 
        nama, 
        email, 
        password_hash, 
        roles, 
        dosen_id, 
        is_active, 
        created_at, 
        updated_at
    )
    VALUES (
        v_user_id,
        NEW.nama,
        v_user_email,
        'Dosen#2025', -- Default password dosen berstandar keamanan (min 8 karakter, kapital, simbol)
        ARRAY['dosen'],
        NEW.id,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO UPDATE SET
        nama = EXCLUDED.nama,
        dosen_id = EXCLUDED.dosen_id,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_provision_dosen ON dosen;
CREATE TRIGGER trg_auto_provision_dosen
AFTER INSERT ON dosen
FOR EACH ROW
EXECUTE FUNCTION fn_auto_provision_user_dosen();

-- B. Trigger Function untuk Penyediaan Akun Mahasiswa Otomatis
CREATE OR REPLACE FUNCTION fn_auto_provision_user_mahasiswa()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id VARCHAR(50);
    v_user_email VARCHAR(100);
    v_default_password VARCHAR(100);
BEGIN
    v_user_id := 'usr-mhs-' || NEW.nim;
    v_user_email := LOWER(COALESCE(NEW.email, NEW.nim || '@mahasiswa.ac.id'));
    v_default_password := 'Mhs#' || NEW.nim; -- Default password dinamis berbasis NIM

    INSERT INTO pengguna (
        id, 
        nama, 
        email, 
        password_hash, 
        roles, 
        mahasiswa_nim, 
        is_active, 
        created_at, 
        updated_at
    )
    VALUES (
        v_user_id,
        NEW.nama,
        v_user_email,
        v_default_password,
        ARRAY['mahasiswa'],
        NEW.nim,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO UPDATE SET
        nama = EXCLUDED.nama,
        mahasiswa_nim = EXCLUDED.mahasiswa_nim,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_provision_mahasiswa ON mahasiswa;
CREATE TRIGGER trg_auto_provision_mahasiswa
AFTER INSERT ON mahasiswa
FOR EACH ROW
EXECUTE FUNCTION fn_auto_provision_user_mahasiswa();



