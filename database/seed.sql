-- ============================================================================
-- SISTEM INFORMASI MANAJEMEN SIDANG SKRIPSI (SIM-SIDANG)
-- DATA AWAL / SEED DATA
-- ============================================================================

-- 1. DATA DOSEN MASTER
INSERT INTO dosen (id, nidn, nama, kode, program_studi, email) VALUES
('lec-1', '0412088501', 'Dian Dharmayanti, S.T., M.Kom.', 'DD', 'Teknik Informatika', 'dian.dharmayanti@email.ac.id'),
('lec-2', '0420057802', 'Andri Heryandi, S.T., M.T.', 'AH', 'Teknik Informatika', 'andri.heryandi@email.ac.id'),
('lec-3', '0415118903', 'Chrismikha Hardyanto, M.Kom.', 'CH', 'Teknik Informatika', 'chrismikha.hardyanto@email.ac.id'),
('lec-4', '0408038204', 'Iskandar Ikbal, M.Kom.', 'II', 'Teknik Informatika', 'iskandar.ikbal@email.ac.id'),
('lec-5', '0425098605', 'Sopian Alviana, M.Kom.', 'SA', 'Teknik Informatika', 'sopian.alviana@email.ac.id'),
('lec-6', '0419048406', 'Angga Setiyadi, M.Kom., CITPM', 'AS', 'Teknik Informatika', 'angga.setiyadi@email.ac.id')
ON CONFLICT (id) DO UPDATE SET 
    nama = EXCLUDED.nama, 
    nidn = EXCLUDED.nidn, 
    kode = EXCLUDED.kode;

-- 2. DATA RUANGAN
INSERT INTO ruangan (id, nama, gedung, lantai, kapasitas) VALUES
('room-1', 'R6028', 'Gedung Kuliah 6', 'Lantai 2', 12),
('room-2', 'R4417', 'Gedung Kuliah 4', 'Lantai 4', 10),
('room-3', 'LAB 6', 'Gedung Laboratorium Terpadu', 'Lantai 3', 15)
ON CONFLICT (id) DO UPDATE SET 
    nama = EXCLUDED.nama, 
    gedung = EXCLUDED.gedung, 
    lantai = EXCLUDED.lantai;

-- 3. DATA SLOT WAKTU
INSERT INTO slot_waktu (id, jam_mulai, jam_selesai, label, urutan) VALUES
('slot-1', '09:15:00', '10:30:00', '09.15 - 10.30', 1),
('slot-2', '10:30:00', '11:45:00', '10.30 - 11.45', 2),
('slot-3', '13:00:00', '14:15:00', '13.00 - 14.15', 3)
ON CONFLICT (id) DO UPDATE SET 
    jam_mulai = EXCLUDED.jam_mulai, 
    jam_selesai = EXCLUDED.jam_selesai, 
    label = EXCLUDED.label;

-- 4. DATA MAHASISWA
INSERT INTO mahasiswa (nim, nama, program_studi, tahun_akademik, email) VALUES
('10120262', 'SHANIA NUR LUTHFIA', 'Teknik Informatika', '2024/2025', '10120262@mahasiswa.ac.id'),
('10120264', 'NURUL AMALIA', 'Teknik Informatika', '2024/2025', '10120264@mahasiswa.ac.id'),
('10120265', 'RADEN FITRI NUR AMALIA', 'Teknik Informatika', '2024/2025', '10120265@mahasiswa.ac.id'),
('10120270', 'DIMAS WAHYU PRASETYO', 'Teknik Informatika', '2024/2025', '10120270@mahasiswa.ac.id'),
('10120275', 'FAJAR KURNIAWAN', 'Teknik Informatika', '2024/2025', '10120275@mahasiswa.ac.id')
ON CONFLICT (nim) DO UPDATE SET 
    nama = EXCLUDED.nama, 
    program_studi = EXCLUDED.program_studi;

-- 5. DATA PERIODE AKADEMIK (Pengendali Periode Sidang)
INSERT INTO periode_akademik (id, tahun_akademik, semester, tanggal_mulai, tanggal_selesai, is_active, status) VALUES
('prd-2024-genap', '2024/2025', 'Genap', '2025-02-01', '2025-07-31', FALSE, 'selesai'),
('prd-2025-ganjil', '2025/2026', 'Ganjil', '2025-08-01', '2026-01-31', FALSE, 'selesai'),
('prd-2025-genap', '2025/2026', 'Genap', '2026-02-01', '2026-07-31', TRUE, 'berjalan'),
('prd-2026-ganjil', '2026/2027', 'Ganjil', '2026-08-01', '2027-01-31', FALSE, 'persiapan')
ON CONFLICT (tahun_akademik, semester) DO UPDATE SET 
    tanggal_mulai = EXCLUDED.tanggal_mulai,
    tanggal_selesai = EXCLUDED.tanggal_selesai,
    is_active = EXCLUDED.is_active,
    status = EXCLUDED.status;

-- 6. DATA PENDAFTARAN SEMINAR (Aturan 2.1 & 2.2: Prasyarat Wajib Sidang, same_schedule)
INSERT INTO pendaftaran_seminar (id, mahasiswa_nim, periode_akademik_id, judul_penelitian, jenis, dosen_pembimbing_id, status, status_kelulusan, pelaksanaan_terakhir_ke, nilai_akhir) VALUES
('sem-reg-1', '10120262', 'prd-2025-ganjil', 'Implementasi Deep Learning Pada Deteksi Retinopati Diabetik Berbasis Citra Fundus', 'Skripsi', 'lec-2', 'selesai', 'lulus', 1, 88.50),
('sem-reg-2', '10120264', 'prd-2025-ganjil', 'Sistem Rekomendasi Pemilihan Topik Skripsi Menggunakan Algoritma Content-Based Filtering', 'Skripsi', 'lec-4', 'selesai', 'lulus', 1, 85.00),
('sem-reg-3', '10120265', 'prd-2025-ganjil', 'Penerapan Algoritma Genetic Algorithm Pada Optimasi Distribusi Logistik Vaksin', 'Skripsi', 'lec-6', 'selesai', 'lulus', 1, 82.00),
('sem-reg-4', '10120270', 'prd-2025-ganjil', 'Rancang Bangun Sistem Informasi Sidang Skripsi dengan Real-Time Conflict Detection', 'Skripsi', 'lec-1', 'selesai', 'lulus', 1, 90.00),
('sem-reg-5', '10120275', 'prd-2025-ganjil', 'Analisis Sentimen Kebijakan Publik Menggunakan Algoritma RoBERTa dan IndoBERT', 'Skripsi', 'lec-3', 'selesai', 'lulus', 1, 86.50),
('sem-reg-6', '10120188', 'prd-2025-ganjil', 'Pengembangan Microservices Architecture Pada E-Commerce Menggunakan Docker & Kubernetes', 'Skripsi', 'lec-5', 'terdaftar', 'belum_lulus', 2, NULL),
('sem-reg-7', '10120204', 'prd-2025-genap', 'Klasifikasi Penyakit Daun Padi Menggunakan Arsitektur MobileNetV2 dan Transfer Learning', 'Skripsi', 'lec-6', 'terdaftar', 'belum_seminar', 1, NULL)
ON CONFLICT (id) DO UPDATE SET 
    judul_penelitian = EXCLUDED.judul_penelitian,
    status = EXCLUDED.status,
    status_kelulusan = EXCLUDED.status_kelulusan;

-- 7. DATA PELAKSANAAN SEMINAR (Riwayat Percobaan & cross_period)
INSERT INTO pelaksanaan_seminar (id, pendaftaran_seminar_id, pelaksanaan_ke, periode_akademik_id, dosen_reviewer_id, dosen_pembimbing_id, tanggal, slot_waktu_id, ruangan_id, status_pelaksanaan, hasil, nilai, catatan_revisi) VALUES
('sem-exe-1', 'sem-reg-1', 1, 'prd-2025-ganjil', 'lec-1', 'lec-2', '2025-01-15', 'slot-1', 'room-1', 'completed', 'lulus', 88.50, 'Naskah seminar proposal disetujui untuk lanjut ke sidang skripsi'),
('sem-exe-2', 'sem-reg-2', 1, 'prd-2025-ganjil', 'lec-3', 'lec-4', '2025-01-15', 'slot-2', 'room-2', 'completed', 'lulus', 85.00, 'Perbaiki metodologi evaluasi sebelum sidang akhir'),
('sem-exe-3', 'sem-reg-3', 1, 'prd-2025-ganjil', 'lec-5', 'lec-6', '2025-01-16', 'slot-1', 'room-1', 'completed', 'lulus', 82.00, 'Lulus bersyarat dengan revisi bab 3'),
('sem-exe-4', 'sem-reg-4', 1, 'prd-2025-ganjil', 'lec-2', 'lec-1', '2025-01-16', 'slot-2', 'room-3', 'completed', 'lulus', 90.00, 'Lulus dengan predikat sangat baik'),
('sem-exe-5', 'sem-reg-5', 1, 'prd-2025-ganjil', 'lec-4', 'lec-3', '2025-01-17', 'slot-1', 'room-2', 'completed', 'lulus', 86.50, 'Lulus tanpa revisi mayor'),
-- Percobaan ke-1 mahasiswa 10120188 Belum Lulus di periode Ganjil:
('sem-exe-6a', 'sem-reg-6', 1, 'prd-2025-ganjil', 'lec-1', 'lec-5', '2025-01-18', 'slot-3', 'room-1', 'completed', 'belum_lulus', 58.00, 'Kebutuhan arsitektur belum matang, diwajibkan seminar ulang'),
-- Percobaan ke-2 mahasiswa 10120188 dijadwalkan ulang pada periode Genap (same_schedule & cross_period):
('sem-exe-6b', 'sem-reg-6', 2, 'prd-2025-genap', 'lec-1', 'lec-5', '2025-08-02', 'slot-3', 'room-2', 'scheduled', 'belum_dinilai', NULL, 'Pelaksanaan seminar ulang ke-2')
ON CONFLICT (id) DO UPDATE SET 
    hasil = EXCLUDED.hasil,
    nilai = EXCLUDED.nilai;

-- 8. DATA PENGAJUAN SIDANG (Hanya Mahasiswa Lulus Seminar - Aturan 2.1)
-- P1 (Ketua Penguji) terkunci dari Reviewer Seminar Lulus; P2 terkunci dari Pembimbing Seminar
INSERT INTO pengajuan_sidang (id, mahasiswa_nim, periode_akademik_id, pendaftaran_seminar_id, pelaksanaan_seminar_id, judul_skripsi, jenis, dosen_reviewer_id, dosen_pembimbing_id, dosen_penguji3_id, nilai_seminar, status) VALUES
('sch-1', '10120262', 'prd-2025-genap', 'sem-reg-1', 'sem-exe-1', 'Implementasi Deep Learning Pada Deteksi Retinopati Diabetik Berbasis Citra Fundus', 'Skripsi', 'lec-1', 'lec-2', 'lec-3', 88.50, 'scheduled'),
('sch-2', '10120264', 'prd-2025-genap', 'sem-reg-2', 'sem-exe-2', 'Sistem Rekomendasi Pemilihan Topik Skripsi Menggunakan Algoritma Content-Based Filtering', 'Skripsi', 'lec-3', 'lec-4', 'lec-5', 85.00, 'scheduled'),
('sch-3', '10120265', 'prd-2025-genap', 'sem-reg-3', 'sem-exe-3', 'Penerapan Algoritma Genetic Algorithm Pada Optimasi Distribusi Logistik Vaksin', 'Skripsi', 'lec-5', 'lec-6', 'lec-1', 82.00, 'unassigned'),
('sch-4', '10120270', 'prd-2025-genap', 'sem-reg-4', 'sem-exe-4', 'Rancang Bangun Sistem Informasi Sidang Skripsi dengan Real-Time Conflict Detection', 'Skripsi', 'lec-2', 'lec-1', 'lec-4', 90.00, 'unassigned'),
('sch-5', '10120275', 'prd-2025-genap', 'sem-reg-5', 'sem-exe-5', 'Analisis Sentimen Kebijakan Publik Menggunakan Algoritma RoBERTa dan IndoBERT', 'Skripsi', 'lec-4', 'lec-3', 'lec-6', 86.50, 'unassigned')
ON CONFLICT (id) DO UPDATE SET 
    judul_skripsi = EXCLUDED.judul_skripsi, 
    status = EXCLUDED.status,
    periode_akademik_id = EXCLUDED.periode_akademik_id;

-- 9. DATA JADWAL (PENEMPATAN DI MATRIKS - Seminar dan Sidang Terintegrasi)
INSERT INTO jadwal_sidang (id, jenis_kegiatan, pengajuan_id, pelaksanaan_seminar_id, tanggal, slot_waktu_id, ruangan_id, status) VALUES
('jdw-1', 'sidang', 'sch-1', NULL, '2025-08-02', 'slot-1', 'room-1', 'scheduled'),
('jdw-2', 'sidang', 'sch-2', NULL, '2025-08-02', 'slot-2', 'room-2', 'scheduled'),
('jdw-3', 'seminar', NULL, 'sem-exe-6b', '2025-08-02', 'slot-3', 'room-2', 'scheduled')
ON CONFLICT (id) DO UPDATE SET 
    tanggal = EXCLUDED.tanggal, 
    slot_waktu_id = EXCLUDED.slot_waktu_id, 
    ruangan_id = EXCLUDED.ruangan_id;

-- 7. DATA PENGGUNA (AKUN OTENTIKASI & RBAC)
-- Password memenuhi syarat: Min 8 karakter, kombinasi huruf besar, kecil, dan simbol
INSERT INTO pengguna (id, nama, email, password_hash, roles, dosen_id, mahasiswa_nim) VALUES
('usr-1', 'Dian Dharmayanti, S.T., M.Kom.', 'dian.dharmayanti@email.ac.id', 'Dosen#2025', ARRAY['dosen', 'admin'], 'lec-1', NULL),
('usr-2', 'Administrator Panitia Sidang', 'admin@simsidang.ac.id', 'Admin#2025', ARRAY['admin'], NULL, NULL),
('usr-3', 'Andri Heryandi, S.T., M.T.', 'andri.heryandi@email.ac.id', 'Dosen#2025', ARRAY['dosen'], 'lec-2', NULL),
('usr-4', 'Chrismikha Hardyanto, M.Kom.', 'chrismikha.hardyanto@email.ac.id', 'Dosen#2025', ARRAY['dosen'], 'lec-3', NULL),
('usr-5', 'SHANIA NUR LUTHFIA', '10120262@mahasiswa.ac.id', 'Mhs#10120262', ARRAY['mahasiswa'], NULL, '10120262'),
('usr-6', 'NURUL AMALIA', '10120264@mahasiswa.ac.id', 'Mhs#10120264', ARRAY['mahasiswa'], NULL, '10120264')
ON CONFLICT (id) DO UPDATE SET 
    nama = EXCLUDED.nama, 
    password_hash = EXCLUDED.password_hash,
    roles = EXCLUDED.roles;


