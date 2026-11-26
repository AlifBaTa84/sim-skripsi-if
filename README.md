# Sistem Informasi Manajemen Skripsi (SIM-SKRIPSI)
### Penjadwalan Seminar & Sidang Terintegrasi — Papan Interaktif Drag & Drop Matrix

Aplikasi web modern untuk manajemen dan penjadwalan kegiatan akademik **Seminar Proposal** dan **Sidang Skripsi/Tugas Akhir** dalam satu sistem terintegrasi, dengan **Papan Penjadwalan Interaktif Drag & Drop Matrix**, **Validasi Bentrok Real-Time**, dan **Alur Prasyarat Seminar → Sidang** yang diberlakukan baik di frontend maupun backend.

---

## 🚀 Fitur Unggulan

### 1. Papan Penjadwalan Terintegrasi (Seminar & Sidang)

Satu Papan Jadwal untuk dua jenis kegiatan, dilengkapi filter visual:
- **Semua Kegiatan** · **Seminar** · **Sidang**
- Penanda visual warna berbeda antara kartu Seminar dan Sidang.

**Komponen Papan Jadwal:**
- **Matriks Grid Harian**:
  - **Sumbu Y (Baris)**: Slot Waktu (`09.15–10.30`, `10.30–11.45`, `13.00–14.15`, `14.15–15.30`).
  - **Sumbu X (Kolom)**: Ruangan Sidang/Seminar (master ruangan yang sama).
  - **Pemilih Tanggal**: Multi-gelombang pelaksanaan.
- **Sidebar Antrean (Unassigned Queue)**:
  - Kartu mahasiswa yang belum terjadwal, menampilkan NIM, Nama, Judul, dan susunan dosen.
  - Pencarian instan (NIM / Nama).
  - Tombol **Auto-Schedule Assistant** untuk menjadwalkan seluruh antrean ke slot kosong otomatis tanpa bentrok.
- **Mekanisme Drag & Drop Fleksibel (`@dnd-kit`)**:
  - Drag dari sidebar antrean → sel kosong matriks.
  - Drag antar sel matriks (pindah ruangan / jam).
  - Drag dari sel matriks → sidebar antrean (batalkan jadwal).
- **Deteksi Bentrok Real-Time**:
  - 🟢 **Hijau (Bebas)**: Ruangan, seluruh dosen, dan mahasiswa tidak memiliki jadwal bentrok.
  - 🔴 **Merah (Bentrok)**: Menampilkan detail dosen/ruangan yang bentrok; drop ditolak otomatis.

---

### 2. Alur Seminar → Sidang (Prasyarat Terintegrasi)

Sistem menerapkan alur akademik berlapis dengan validasi backend:

#### A. Alur Seminar
1. Administrator **mengimpor data peserta Seminar** (CSV/Excel).
2. Sistem memvalidasi NIM dan menyimpan pendaftaran Seminar.
3. Peserta tampil di Papan Jadwal dengan status **Belum Terjadwal**.
4. Administrator **memilih Reviewer** secara manual dari master dosen aktif di form penjadwalan.
5. Jadwal disimpan setelah validasi konflik berhasil.
6. Setelah pelaksanaan, administrator **mencatat hasil** (Lulus / Belum Lulus).
7. **Jika Lulus**: kartu Sidang mahasiswa **aktif otomatis** di antrean Sidang dengan P1 & P2 sudah terisi.
8. **Jika Belum Lulus**: mahasiswa dapat dijadwalkan ulang menggunakan **pendaftaran yang sama** (riwayat pelaksanaan sebelumnya tetap tersimpan).

#### B. Alur Sidang
1. Mahasiswa yang telah **Lulus Seminar** tampil otomatis di antrean Sidang.
2. P1 (Ketua Penguji) dikunci dari Reviewer Seminar yang sah.
3. P2 dikunci dari Dosen Pembimbing Seminar.
4. Administrator hanya menentukan **P3** dan menetapkan jadwal.
5. Validasi konflik berlaku untuk seluruh penugasan dosen dan ruangan.

#### C. Ketentuan Riwayat & Periode
| Aspek | Ketentuan |
|---|---|
| Penjadwalan Ulang Seminar | Menggunakan pendaftaran yang sama (`same_schedule`), tidak membuat pendaftaran baru |
| Riwayat Pelaksanaan | Setiap percobaan (ke-1, ke-2, dst.) tersimpan permanen dan tidak dapat ditimpa |
| Lintas Periode | Seminar dan Sidang dapat berlangsung di periode akademik berbeda (`cross_period`) |
| Kelayakan Sidang | Ditentukan dari hasil kelulusan Seminar yang sah, bukan kesamaan periode akademik |

---

### 3. Role-Based Access Control (RBAC)

Sistem mendukung **peran ganda (multi-role)** — satu akun dosen dapat berperan sebagai Dosen Penguji sekaligus Panitia Sidang/Admin.

#### 🛡️ Admin / Panitia Sidang (Scheduler)
- Kontrol penuh Papan Penjadwalan (Seminar & Sidang) via Drag & Drop.
- Impor data peserta Seminar dari file Excel/CSV.
- Form penjadwalan Seminar: memilih Reviewer, tanggal, slot waktu, dan ruangan.
- Pencatatan hasil Seminar (Lulus / Belum Lulus) beserta nilai dan catatan.
- Penjadwalan Sidang dengan P3 tambahan; P1 & P2 diisi otomatis dari data Seminar.
- **Audit Bentrok Matriks**: Pemindaian menyeluruh integritas jadwal di semua ruangan dan tanggal.
- **Ekspor & Cetak Rekapitulasi**: Laporan resmi jadwal sidang siap cetak (PDF) dan ekspor CSV/Excel.
- **Reset Password Mahasiswa**: Administrator dapat mereset password akun mahasiswa.
- **Database Manager**: Kelola master data (Dosen, Mahasiswa, Ruangan, Slot Waktu, Periode Akademik) langsung dari antarmuka.

#### 👨‍🏫 Dosen Penguji (Read-Only)
- **Jadwal Personal Per-Dosen**: Ringkasan statistik peran (P1, P2, atau P3), tanggal, jam, ruangan, dan identitas mahasiswa.
- **Rekapitulasi Jadwal Lengkap**: Tabel master semua sidang dengan filter tanggal dan pencarian.
- Cetak jadwal tugas personal.

#### 🎓 Mahasiswa (Read-Only & Cetak Label)
- Tampilan detail jadwal sidang pribadi (Hari/Tanggal, Jam, Ruangan, Judul, dan 3 Penguji).
- **Cetak Label Draft Sidang**:
  - Menghasilkan **3 kartu label cetak** resmi untuk masing-masing P1, P2, dan P3.
  - Format: Nama Dosen & Peran · Tanggal & Waktu/Ruang · NIM & Nama Mahasiswa.
  - Dilengkapi garis gunting, kolom tanda tangan, dan format cetak presisi (`@media print`).

---

### 4. Sistem Autentikasi & Keamanan

- **Validasi Password Ketat**: Minimal 8 karakter, kombinasi huruf besar, huruf kecil, dan simbol; indikator kekuatan password ditampilkan secara *live*.
- **CAPTCHA Anti-Bot**: Canvas CAPTCHA unik dibangkitkan pada setiap sesi login.
- **Akun Demo 1-Klik**: Tombol cepat untuk mengisi kredensial demo (email, password, dan CAPTCHA diisi otomatis), tersedia untuk semua peran:
  - Admin + Dosen (Dual Role)
  - Dosen (Single Role)
  - Mahasiswa
  - Super Admin
- **Multi-Role Account**: Satu email untuk dua peran (Dosen & Admin); peralihan peran melalui Role Switcher di sidebar.
- **Ubah Password**: Tersedia di Topbar dengan validasi kebijakan password.
- **Automatic Account Provisioning**: Akun login dibuat otomatis saat data Dosen atau Mahasiswa baru dimasukkan ke database.

---

### 5. Master Data & Periode Akademik

Seluruh modul menggunakan data master bersama:

| Master Data | Keterangan |
|---|---|
| **Dosen** | NIDN, Nama, Kode, Email, Program Studi, Foto Profil |
| **Mahasiswa** | NIM, Nama, Program Studi, Tahun Akademik |
| **Ruangan** | Nama, Gedung, Lantai, Kapasitas |
| **Slot Waktu** | Jam Mulai, Jam Selesai, Label |
| **Periode Akademik** | Tahun Akademik, Semester (Ganjil/Genap), Tanggal Aktif, Status |

Periode akademik aktif digunakan sebagai referensi untuk Seminar maupun Sidang; pergantian periode tidak menghapus atau mempengaruhi riwayat data historis.

---

### 6. Teknologi yang Digunakan

| Kategori | Teknologi |
|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite 6 |
| **Styling** | Tailwind CSS 3, PostCSS, Lucide Icons |
| **Drag & Drop** | `@dnd-kit/core`, `@dnd-kit/utilities`, `@dnd-kit/modifiers` |
| **Ekspor Data** | `xlsx` (Excel/CSV Export) |
| **Efek Visual** | `canvas-confetti`, Custom Animated Notifications |
| **Autentikasi** | Custom Auth Context + CAPTCHA Canvas |
| **Cetak** | Native Print CSS Stylesheet (`@media print`) |
| **Backend / Database** | PostgreSQL (via Supabase) — skema relasional 3NF |

---

### 7. Skema Database

Lihat dokumentasi lengkap di [`database/README.md`](./database/README.md).

**Tabel Utama:**
- `dosen` — Master dosen penguji & pembimbing
- `mahasiswa` — Master mahasiswa
- `ruangan` — Master ruangan
- `slot_waktu` — Master slot waktu
- `periode_akademik` — Manajemen periode aktif
- `pendaftaran_seminar` — Pendaftaran seminar mahasiswa
- `pelaksanaan_seminar` — Riwayat setiap percobaan seminar (ke-1, ke-2, dst.)
- `pengajuan_sidang` — Pengajuan sidang (dibuat otomatis saat seminar lulus)
- `jadwal_sidang` — Jadwal pelaksanaan seminar & sidang (terpadu)
- `pengguna` — Akun pengguna sistem

**Trigger & Constraint Penting:**
- `trg_validasi_bentrok_jadwal` — Anti-bentrok jadwal dosen, mahasiswa, dan ruangan
- `trg_auto_provision_dosen` — Buat akun otomatis saat dosen baru ditambahkan
- `trg_auto_provision_mahasiswa` — Buat akun otomatis saat mahasiswa baru ditambahkan
- `UNIQUE(tanggal, slot_waktu_id, ruangan_id)` — Anti-duplikasi booking ruangan
- `CHECK` constraints — Dosen P1, P2, P3 harus selalu berbeda

---

### 8. Cara Menjalankan Aplikasi

1. **Install dependensi:**
   ```bash
   npm install
   ```

2. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Aplikasi berjalan di `http://localhost:3000`.

3. **Build untuk Produksi:**
   ```bash
   npm run build
   ```

4. **Preview Build:**
   ```bash
   npm run preview
   ```

---

### 9. Setup Database (PostgreSQL / Supabase)

1. Buka **SQL Editor** di Supabase Dashboard atau terminal `psql`.
2. Jalankan berkas skema dan data awal:
   ```bash
   psql -h <host> -U <user> -d <dbname> -f database/schema.sql
   psql -h <host> -U <user> -d <dbname> -f database/seed.sql
   ```
3. Seluruh tabel, indeks, view, trigger, dan data awal langsung aktif dan siap digunakan.

> **Kredensial Default:**
> - **Admin / Super Admin**: `Admin#2025`
> - **Dosen**: `Dosen#2025`
> - **Mahasiswa**: `Mhs#<NIM>` (contoh: `Mhs#10120262`)
