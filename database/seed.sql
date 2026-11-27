-- ============================================================================
-- SISTEM INFORMASI MANAJEMEN SIDANG SKRIPSI (SIM-SIDANG)
-- DATA AWAL / SEED DATA
-- Diselaraskan dengan schema.sql, mockData.ts, dan aturan bisnis aktif
-- ============================================================================

-- 1. DATA DOSEN MASTER (8 Dosen Penguji & Pembimbing)
-- Catatan: Trigger trg_auto_provision_dosen otomatis membuatkan akun di tabel pengguna
INSERT INTO dosen (id, nidn, nama, kode, program_studi, email) VALUES
('lec-1', '0412088501', 'Dian Dharmayanti, S.T., M.Kom.', 'DD', 'Teknik Informatika', 'dian.dharmayanti@email.ac.id'),
('lec-2', '0420057802', 'Andri Heryandi, S.T., M.T.', 'AH', 'Teknik Informatika', 'andri.heryandi@email.ac.id'),
('lec-3', '0415118903', 'Chrismikha Hardyanto, M.Kom.', 'CH', 'Sistem Informasi', 'chrismikha.hardyanto@email.ac.id'),
('lec-4', '0403068201', 'Iskandar Ikbal, M.Kom.', 'II', 'Teknik Informatika', 'iskandar.ikbal@email.ac.id'),
('lec-5', '0428098004', 'Sopian Alviana, M.Kom.', 'SA', 'Teknik Informatika', 'sopian.alviana@email.ac.id'),
('lec-6', '0419018402', 'Angga Setiyadi, M.Kom., CITPM', 'AS', 'Sistem Informasi', 'angga.setiyadi@email.ac.id'),
('lec-7', '0405027501', 'Dr. Marliana Budhiningtias, M.Si.', 'MB', 'Teknik Informatika', 'marliana.b@email.ac.id'),
('lec-8', '0423078802', 'Taufiq Nurhadi, S.Kom., M.T.', 'TN', 'Sistem Komputer', 'taufiq.nurhadi@email.ac.id')
ON CONFLICT (id) DO UPDATE SET 
    nama = EXCLUDED.nama, 
    nidn = EXCLUDED.nidn, 
    kode = EXCLUDED.kode,
    program_studi = EXCLUDED.program_studi,
    email = EXCLUDED.email;

-- 2. DATA RUANGAN
INSERT INTO ruangan (id, nama, gedung, lantai, kapasitas) VALUES
('room-1', 'R6028', 'Gedung Smart Campus 6', 'Lantai 2', 25),
('room-2', 'R4417', 'Gedung Rektorat Lama', 'Lantai 4', 20),
('room-3', 'LAB 6', 'Laboratorium Terpadu', 'Lantai 3', 35),
('room-4', 'R5012', 'Gedung Smart Campus 5', 'Lantai 1', 20)
ON CONFLICT (id) DO UPDATE SET 
    nama = EXCLUDED.nama, 
    gedung = EXCLUDED.gedung, 
    lantai = EXCLUDED.lantai,
    kapasitas = EXCLUDED.kapasitas;

-- 3. DATA SLOT WAKTU
INSERT INTO slot_waktu (id, jam_mulai, jam_selesai, label, urutan) VALUES
('slot-1', '09:15:00', '10:30:00', '09.15 - 10.30', 1),
('slot-2', '10:30:00', '11:45:00', '10.30 - 11.45', 2),
('slot-3', '13:00:00', '14:15:00', '13.00 - 14.15', 3),
('slot-4', '14:15:00', '15:30:00', '14.15 - 15.30', 4)
ON CONFLICT (id) DO UPDATE SET 
    jam_mulai = EXCLUDED.jam_mulai, 
    jam_selesai = EXCLUDED.jam_selesai, 
    label = EXCLUDED.label,
    urutan = EXCLUDED.urutan;

-- 4. DATA MAHASISWA
-- Mencakup seluruh mahasiswa peserta seminar & sidang (arsip selesai, terjadwal, antrean)
-- Catatan: Trigger trg_auto_provision_mahasiswa otomatis membuatkan akun di tabel pengguna
INSERT INTO mahasiswa (nim, nama, program_studi, tahun_akademik, email) VALUES
-- Arsip Periode 2024/2025 Genap (Sudah Selesai Sidang)
('10119001', 'ACHMAD FAUZAN', 'Teknik Informatika', '2024/2025', '10119001@mahasiswa.ac.id'),
('10119045', 'CITRA LESTARI DEWI', 'Teknik Informatika', '2024/2025', '10119045@mahasiswa.ac.id'),
-- Sidang Terjadwal Periode 2025/2026 Genap
('10120262', 'SHANIA NUR LUTHFIA', 'Teknik Informatika', '2025/2026', '10120262@mahasiswa.ac.id'),
('10120101', 'BUDI SANTOSO', 'Teknik Informatika', '2025/2026', '10120101@mahasiswa.ac.id'),
('10120150', 'RENDY WIJAYA', 'Teknik Informatika', '2025/2026', '10120150@mahasiswa.ac.id'),
-- Antrean Sidang Periode 2025/2026 Genap (Lulus Seminar)
('10120188', 'MUHAMMAD FADHIL ARIFIN', 'Teknik Informatika', '2025/2026', '10120188@mahasiswa.ac.id'),
('10120204', 'ALIFAH SITI RAHMAWATI', 'Teknik Informatika', '2025/2026', '10120204@mahasiswa.ac.id'),
('10120340', 'DIMAS ARYA PRATAMA', 'Sistem Komputer', '2025/2026', '10120340@mahasiswa.ac.id'),
('10120095', 'KEVIN JONATHAN', 'Sistem Informasi', '2025/2026', '10120095@mahasiswa.ac.id'),
('10120412', 'NABILA PUTRI ANJANI', 'Sistem Informasi', '2025/2026', '10120412@mahasiswa.ac.id'),
-- Peserta Seminar Proposal/Kemajuan Periode 2025/2026 Genap
('10121001', 'FARHAN NURHIDAYAT', 'Teknik Informatika', '2025/2026', '10121001@mahasiswa.ac.id'),
('10121015', 'ZAHRA AULIA RAHMAN', 'Teknik Informatika', '2025/2026', '10121015@mahasiswa.ac.id'),
('10121088', 'GILANG RAMADHAN', 'Teknik Informatika', '2025/2026', '10121088@mahasiswa.ac.id')
ON CONFLICT (nim) DO UPDATE SET 
    nama = EXCLUDED.nama, 
    program_studi = EXCLUDED.program_studi,
    tahun_akademik = EXCLUDED.tahun_akademik;

-- 5. DATA PERIODE AKADEMIK (Pengendali Periode Sidang & Seminar)
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
-- Arsip Lulus Seminar -> Sidang Selesai (2024/2025 Genap)
('sem-reg-10119001', '10119001', 'prd-2024-genap', 'Implementasi Algoritma K-Means Dalam Pengelompokan Data Penjualan Produk UKM', 'Skripsi', 'lec-2', 'selesai', 'lulus', 1, 89.00),
('sem-reg-10119045', '10119045', 'prd-2024-genap', 'Analisis Keamanan Jaringan Menggunakan Intrusion Detection System Berbasis Snort', 'Skripsi', 'lec-5', 'selesai', 'lulus', 1, 86.50),
-- Lulus Seminar pada Periode 2025/2026 Ganjil -> Mengikuti Sidang Periode 2025/2026 Genap
('sem-reg-10120262', '10120262', 'prd-2025-ganjil', 'Implementasi Algoritma Genetika Dalam Optimasi Penjadwalan Sidang Skripsi Berbasis Matriks', 'Skripsi', 'lec-2', 'selesai', 'lulus', 1, 87.50),
('sem-reg-10120101', '10120101', 'prd-2025-ganjil', 'Rancang Bangun Sistem Presensi Mahasiswa Berbasis Pengenalan Wajah dengan CNN', 'Skripsi', 'lec-5', 'selesai', 'lulus', 1, 85.00),
('sem-reg-10120150', '10120150', 'prd-2025-ganjil', 'Analisis Sentimen Opini Publik Pada Platform X Terhadap Pemilu Menggunakan IndoBERT', 'Skripsi', 'lec-4', 'selesai', 'lulus', 1, 88.50),
('sem-reg-10120188', '10120188', 'prd-2025-ganjil', 'Pengembangan Microservices Architecture Pada E-Commerce Menggunakan Docker & Kubernetes', 'Skripsi', 'lec-5', 'selesai', 'lulus', 1, 86.00),
('sem-reg-10120204', '10120204', 'prd-2025-ganjil', 'Klasifikasi Penyakit Daun Padi Menggunakan Arsitektur MobileNetV2 dan Transfer Learning', 'Skripsi', 'lec-6', 'selesai', 'lulus', 1, 89.00),
('sem-reg-10120340', '10120340', 'prd-2025-ganjil', 'Sistem Deteksi Intrusi Jaringan Berbasis Deep Learning Menggunakan Dataset CIC-IDS2017', 'Tugas Akhir', 'lec-4', 'selesai', 'lulus', 1, 84.00),
('sem-reg-10120095', '10120095', 'prd-2025-ganjil', 'Implementasi Smart Contract Blockchain Ethereum untuk Verifikasi Ijazah Digital', 'Skripsi', 'lec-1', 'selesai', 'lulus', 1, 88.00),
('sem-reg-10120412', '10120412', 'prd-2025-ganjil', 'Desain Pengalaman Pengguna (UI/UX) Aplikasi Telemedisin Lansia Menggunakan Metode Design Thinking', 'Tugas Akhir', 'lec-7', 'selesai', 'lulus', 1, 90.00),
-- Seminar Aktif Periode 2025/2026 Genap
('sem-reg-10121001', '10121001', 'prd-2025-genap', 'Implementasi Arsitektur RAG (Retrieval-Augmented Generation) pada Sistem Tanya Jawab Akademik', 'Skripsi', 'lec-2', 'terjadwal', 'belum_seminar', 1, NULL),
('sem-reg-10121015', '10121015', 'prd-2025-genap', 'Analisis Komparasi Model YOLOv8 dan YOLOv9 dalam Deteksi Kerusakan Jalan Raya', 'Skripsi', 'lec-4', 'terdaftar', 'belum_seminar', 1, NULL),
-- Seminar Ulang (Percobaan ke-1 Belum Lulus di 2025/2026 Ganjil -> Percobaan ke-2 di 2025/2026 Genap)
('sem-reg-10121088', '10121088', 'prd-2025-ganjil', 'Implementasi Algoritma Q-Learning pada Agen Navigasi Robot Pembersih Lantai', 'Skripsi', 'lec-5', 'terdaftar', 'belum_lulus', 2, NULL)
ON CONFLICT (id) DO UPDATE SET 
    judul_penelitian = EXCLUDED.judul_penelitian,
    status = EXCLUDED.status,
    status_kelulusan = EXCLUDED.status_kelulusan,
    pelaksanaan_terakhir_ke = EXCLUDED.pelaksanaan_terakhir_ke,
    nilai_akhir = EXCLUDED.nilai_akhir;

-- 7. DATA PELAKSANAAN SEMINAR (Riwayat Percobaan & cross_period)
-- Catatan: Pada seminar, dosen_reviewer_id <> dosen_pembimbing_id dan dapat bernilai NULL jika belum dipilih admin
INSERT INTO pelaksanaan_seminar (id, pendaftaran_seminar_id, pelaksanaan_ke, periode_akademik_id, dosen_reviewer_id, dosen_pembimbing_id, tanggal, slot_waktu_id, ruangan_id, status_pelaksanaan, hasil, nilai, catatan_revisi) VALUES
-- Arsip Seminar Lulus (2024/2025 Genap)
('sem-exe-10119001-1', 'sem-reg-10119001', 1, 'prd-2024-genap', 'lec-1', 'lec-2', '2025-02-05', 'slot-1', 'room-1', 'completed', 'lulus', 89.00, 'Layak lanjut sidang skripsi'),
('sem-exe-10119045-1', 'sem-reg-10119045', 1, 'prd-2024-genap', 'lec-4', 'lec-5', '2025-02-05', 'slot-2', 'room-2', 'completed', 'lulus', 86.50, 'Layak lanjut sidang skripsi'),
-- Seminar Lulus Periode 2025/2026 Ganjil (Tanggal berada dalam rentang 2025-08-01 s.d 2026-01-31)
('sem-exe-10120262-1', 'sem-reg-10120262', 1, 'prd-2025-ganjil', 'lec-1', 'lec-2', '2026-01-15', 'slot-1', 'room-1', 'completed', 'lulus', 87.50, 'Naskah seminar proposal disetujui untuk lanjut ke sidang skripsi'),
('sem-exe-10120101-1', 'sem-reg-10120101', 1, 'prd-2025-ganjil', 'lec-4', 'lec-5', '2026-01-15', 'slot-2', 'room-2', 'completed', 'lulus', 85.00, 'Perbaiki metodologi evaluasi sebelum sidang akhir'),
('sem-exe-10120150-1', 'sem-reg-10120150', 1, 'prd-2025-ganjil', 'lec-2', 'lec-4', '2026-01-16', 'slot-1', 'room-1', 'completed', 'lulus', 88.50, 'Lulus tanpa revisi mayor'),
('sem-exe-10120188-1', 'sem-reg-10120188', 1, 'prd-2025-ganjil', 'lec-1', 'lec-5', '2026-01-16', 'slot-2', 'room-3', 'completed', 'lulus', 86.00, 'Lulus dengan perbaikan dokumentasi arsitektur'),
('sem-exe-10120204-1', 'sem-reg-10120204', 1, 'prd-2025-ganjil', 'lec-3', 'lec-6', '2026-01-17', 'slot-1', 'room-2', 'completed', 'lulus', 89.00, 'Lulus dengan predikat sangat baik'),
('sem-exe-10120340-1', 'sem-reg-10120340', 1, 'prd-2025-ganjil', 'lec-2', 'lec-4', '2026-01-17', 'slot-2', 'room-1', 'completed', 'lulus', 84.00, 'Siapkan perangkat demo pada saat sidang'),
('sem-exe-10120095-1', 'sem-reg-10120095', 1, 'prd-2025-ganjil', 'lec-6', 'lec-1', '2026-01-18', 'slot-1', 'room-3', 'completed', 'lulus', 88.00, 'Lulus, lanjutkan pengujian smart contract'),
('sem-exe-10120412-1', 'sem-reg-10120412', 1, 'prd-2025-ganjil', 'lec-5', 'lec-7', '2026-01-18', 'slot-2', 'room-2', 'completed', 'lulus', 90.00, 'Lulus dengan predikat sangat baik'),
-- Seminar Aktif Periode 2025/2026 Genap
('sem-exe-10121001-1', 'sem-reg-10121001', 1, 'prd-2025-genap', 'lec-1', 'lec-2', '2026-03-02', 'slot-3', 'room-2', 'scheduled', 'belum_dinilai', NULL, 'Naskah seminar proposal BAB 1-3 lengkap dan telah disetujui pembimbing'),
('sem-exe-10121015-1', 'sem-reg-10121015', 1, 'prd-2025-genap', NULL, 'lec-4', NULL, NULL, NULL, 'unassigned', 'belum_dinilai', NULL, 'Menunggu admin menentukan Dosen Reviewer di Papan Jadwal'),
-- Percobaan ke-1 Belum Lulus di Periode Ganjil -> Percobaan ke-2 Antrean di Periode Genap (same_schedule)
('sem-exe-10121088-1', 'sem-reg-10121088', 1, 'prd-2025-ganjil', 'lec-3', 'lec-5', '2026-01-18', 'slot-3', 'room-1', 'completed', 'belum_lulus', 58.00, 'Kajian pustaka dan formulasi reward function algoritma Q-Learning belum matang. Diwajibkan seminar ulang.'),
('sem-exe-10121088-2', 'sem-reg-10121088', 2, 'prd-2025-genap', 'lec-3', 'lec-5', NULL, NULL, NULL, 'unassigned', 'belum_dinilai', NULL, 'Penjadwalan ulang seminar (Percobaan ke-2)')
ON CONFLICT (id) DO UPDATE SET 
    dosen_reviewer_id = EXCLUDED.dosen_reviewer_id,
    tanggal = EXCLUDED.tanggal,
    slot_waktu_id = EXCLUDED.slot_waktu_id,
    ruangan_id = EXCLUDED.ruangan_id,
    status_pelaksanaan = EXCLUDED.status_pelaksanaan,
    hasil = EXCLUDED.hasil,
    nilai = EXCLUDED.nilai;

-- 8. DATA PENGAJUAN SIDANG (Hanya Mahasiswa Lulus Seminar - Aturan 2.1)
-- P1 (Ketua Penguji) terkunci dari Reviewer Seminar Lulus; P2 terkunci dari Pembimbing Seminar; P3 ditentukan Admin
INSERT INTO pengajuan_sidang (id, mahasiswa_nim, periode_akademik_id, pendaftaran_seminar_id, pelaksanaan_seminar_id, judul_skripsi, jenis, dosen_reviewer_id, dosen_pembimbing_id, dosen_penguji3_id, nilai_seminar, status, catatan) VALUES
-- Arsip Sidang Selesai (Periode 2024/2025 Genap - tampil di Rekap & Laporan Selesai Sidang)
('sch-091', '10119001', 'prd-2024-genap', 'sem-reg-10119001', 'sem-exe-10119001-1', 'Implementasi Algoritma K-Means Dalam Pengelompokan Data Penjualan Produk UKM', 'Skripsi', 'lec-1', 'lec-2', 'lec-3', 89.00, 'completed', 'Sidang selesai. Nilai kelulusan A. Naskah final telah disahkan perpustakaan.'),
('sch-092', '10119045', 'prd-2024-genap', 'sem-reg-10119045', 'sem-exe-10119045-1', 'Analisis Keamanan Jaringan Menggunakan Intrusion Detection System Berbasis Snort', 'Skripsi', 'lec-4', 'lec-5', 'lec-6', 86.50, 'completed', 'Sidang selesai. Telah menyelesaikan revisi penguji.'),
-- Sidang Terjadwal (Periode Aktif 2025/2026 Genap)
('sch-101', '10120262', 'prd-2025-genap', 'sem-reg-10120262', 'sem-exe-10120262-1', 'Implementasi Algoritma Genetika Dalam Optimasi Penjadwalan Sidang Skripsi Berbasis Matriks', 'Skripsi', 'lec-1', 'lec-2', 'lec-3', 87.50, 'scheduled', 'Draft skripsi lengkap, syarat bebas perpustakaan terverifikasi'),
('sch-102', '10120101', 'prd-2025-genap', 'sem-reg-10120101', 'sem-exe-10120101-1', 'Rancang Bangun Sistem Presensi Mahasiswa Berbasis Pengenalan Wajah dengan CNN', 'Skripsi', 'lec-4', 'lec-5', 'lec-6', 85.00, 'scheduled', 'Membutuhkan proyektor HDMI tambahan'),
('sch-103', '10120150', 'prd-2025-genap', 'sem-reg-10120150', 'sem-exe-10120150-1', 'Analisis Sentimen Opini Publik Pada Platform X Terhadap Pemilu Menggunakan IndoBERT', 'Skripsi', 'lec-2', 'lec-4', 'lec-7', 88.50, 'scheduled', 'Sudah mengumpulkan bukti uji plagiasi Turnitin 12%'),
-- Antrean Sidang (Periode Aktif 2025/2026 Genap)
('sch-201', '10120188', 'prd-2025-genap', 'sem-reg-10120188', 'sem-exe-10120188-1', 'Pengembangan Microservices Architecture Pada E-Commerce Menggunakan Docker & Kubernetes', 'Skripsi', 'lec-1', 'lec-5', 'lec-8', 86.00, 'unassigned', 'Persetujuan pembimbing lengkap'),
('sch-202', '10120204', 'prd-2025-genap', 'sem-reg-10120204', 'sem-exe-10120204-1', 'Klasifikasi Penyakit Daun Padi Menggunakan Arsitektur MobileNetV2 dan Transfer Learning', 'Skripsi', 'lec-3', 'lec-6', 'lec-7', 89.00, 'unassigned', 'Sidang online/hybrid siap'),
('sch-203', '10120340', 'prd-2025-genap', 'sem-reg-10120340', 'sem-exe-10120340-1', 'Sistem Deteksi Intrusi Jaringan Berbasis Deep Learning Menggunakan Dataset CIC-IDS2017', 'Tugas Akhir', 'lec-2', 'lec-4', NULL, 84.00, 'unassigned', 'Perangkat demo switch & router disiapkan di lab'),
('sch-204', '10120095', 'prd-2025-genap', 'sem-reg-10120095', 'sem-exe-10120095-1', 'Implementasi Smart Contract Blockchain Ethereum untuk Verifikasi Ijazah Digital', 'Skripsi', 'lec-6', 'lec-1', NULL, 88.00, 'unassigned', 'Siap uji coba transaksi testnet Sepolia'),
('sch-205', '10120412', 'prd-2025-genap', 'sem-reg-10120412', 'sem-exe-10120412-1', 'Desain Pengalaman Pengguna (UI/UX) Aplikasi Telemedisin Lansia Menggunakan Metode Design Thinking', 'Tugas Akhir', 'lec-5', 'lec-7', NULL, 90.00, 'unassigned', 'Prototype Figma & hasil usability testing lengkap')
ON CONFLICT (id) DO UPDATE SET 
    judul_skripsi = EXCLUDED.judul_skripsi, 
    dosen_penguji3_id = EXCLUDED.dosen_penguji3_id,
    status = EXCLUDED.status,
    periode_akademik_id = EXCLUDED.periode_akademik_id;

-- 9. DATA JADWAL (PENEMPATAN DI MATRIKS - Seminar dan Sidang Terintegrasi, Bebas Bentrok)
-- Catatan: Trigger trg_cek_bentrok_sebelum_simpan akan men-set status pengajuan_sidang menjadi 'scheduled',
-- sehingga untuk arsip 'sch-091' & 'sch-092' kita set ulang status 'completed' setelah insert jadwal.
INSERT INTO jadwal_sidang (id, jenis_kegiatan, pengajuan_id, pelaksanaan_seminar_id, tanggal, slot_waktu_id, ruangan_id, status) VALUES
-- Arsip Sidang Selesai (2025-02-20, dalam periode prd-2024-genap)
('jdw-091', 'sidang', 'sch-091', NULL, '2025-02-20', 'slot-1', 'room-1', 'completed'),
('jdw-092', 'sidang', 'sch-092', NULL, '2025-02-20', 'slot-2', 'room-2', 'completed'),
-- Sidang Terjadwal Periode Aktif (2026-03-02, dalam periode prd-2025-genap, bebas bentrok dosen & ruang)
('jdw-101', 'sidang', 'sch-101', NULL, '2026-03-02', 'slot-1', 'room-1', 'scheduled'),
('jdw-102', 'sidang', 'sch-102', NULL, '2026-03-02', 'slot-1', 'room-2', 'scheduled'),
('jdw-103', 'sidang', 'sch-103', NULL, '2026-03-02', 'slot-2', 'room-1', 'scheduled'),
-- Seminar Terjadwal Periode Aktif (slot-3 agar bebas bentrok lec-2 dengan jdw-103 di slot-2)
('jdw-sem-1', 'seminar', NULL, 'sem-exe-10121001-1', '2026-03-02', 'slot-3', 'room-2', 'scheduled')
ON CONFLICT (id) DO UPDATE SET 
    tanggal = EXCLUDED.tanggal, 
    slot_waktu_id = EXCLUDED.slot_waktu_id, 
    ruangan_id = EXCLUDED.ruangan_id,
    status = EXCLUDED.status;

-- Pastikan status pengajuan_sidang arsip tetap 'completed' (mengoverride efek trigger insert jadwal)
UPDATE pengajuan_sidang
SET status = 'completed', updated_at = CURRENT_TIMESTAMP
WHERE id IN ('sch-091', 'sch-092');

-- 10. DATA PENGGUNA (AKUN OTENTIKASI & RBAC)
-- Password memenuhi syarat: Min 8 karakter, kombinasi huruf besar, kecil, dan simbol
-- Akun dosen dan mahasiswa lainnya telah otomatis dibuat oleh trigger auto-provision.
INSERT INTO pengguna (id, nama, email, password_hash, roles, dosen_id, mahasiswa_nim) VALUES
('usr-lec-lec-1', 'Dian Dharmayanti, S.T., M.Kom.', 'dian.dharmayanti@email.ac.id', 'Dosen#2025', ARRAY['dosen', 'admin'], 'lec-1', NULL),
('usr-admin-1', 'Administrator Panitia Sidang', 'admin@simsidang.ac.id', 'Admin#2025', ARRAY['admin'], NULL, NULL)
ON CONFLICT (email) DO UPDATE SET 
    nama = EXCLUDED.nama, 
    password_hash = EXCLUDED.password_hash,
    roles = EXCLUDED.roles,
    dosen_id = EXCLUDED.dosen_id;
