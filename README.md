# Sistem Informasi Manajemen Sidang Skripsi (SIM-SIDANG)
### Papan Penjadwalan Interaktif (Drag & Drop Heuristic Matrix)

Aplikasi web modern untuk manajemen dan penjadwalan sidang skripsi/tugas akhir dengan **Papan Penjadwalan Interaktif Drag & Drop Matrix** dan **Sistem Validasi Bentrok Real-Time (Conflict Detection Engine)**.

---

## 🚀 Fitur Unggulan

### 1. Papan Penjadwalan Interaktif (Drag & Drop Matrix)
- **Matriks Grid Harian**:
  - **Sumbu Y (Baris)**: Slot Waktu Sidang (`09.15-10.30`, `10.30-11.45`, `13.00-14.15`, `14.15-15.30`).
  - **Sumbu X (Kolom)**: Ruangan Sidang (`R6028`, `R4417`, `LAB 6`, `R5012`).
  - **Pemilih Tanggal**: Multi-gelombang pelaksanaan sidang (misal: *Sabtu, 2 Agustus 2025*).
- **Sidebar Antrean Sidang (Unassigned Queue)**:
  - Kartu pengajuan sidang yang belum terjadwal memuat: NIM, Nama Mahasiswa, Judul Skripsi, dan susunan 3 Dosen Penguji (P1, P2, P3).
  - Fitur pencarian instan (search by NIM / Nama).
  - Tombol **Auto-Schedule Assistant** untuk menjadwalkan seluruh antrean ke slot kosong secara otomatis tanpa bentrok.
- **Mekanisme Drag & Drop Fleksibel (`@dnd-kit`)**:
  - Drag dari sidebar antrean ke sel kosong pada matriks.
  - Drag antar sel pada matriks (memindahkan ruangan / jam secara langsung).
  - Drag dari sel matriks kembali ke sidebar antrean untuk membatalkan jadwal.
- **Sistem Deteksi Bentrok Real-Time (Real-Time Conflict Detection)**:
  - Saat kartu diseret di atas sel grid:
    - **Hijau (Bebas Bentrok)**: Ruangan kosong, Penguji 1, Penguji 2, Penguji 3, dan Mahasiswa tidak memiliki jadwal lain pada slot waktu tersebut.
    - **Merah (Bentrok / Terkunci)**: Menampilkan alert spesifik dosen mana yang bentrok dan di ruangan mana dia sedang menguji. Aksi drop ditolak secara otomatis (*invalid drop action*).

---

### 2. Role-Based Access Control (RBAC)

Peralihan peran dapat diakses langsung melalui **Role Switcher** di bagian atas antarmuka:

#### A. 🛡️ Admin / Panitia Sidang (Scheduler)
- Kontrol penuh pengaturan jadwal via Drag & Drop matriks.
- Form modal **Tambah Pengajuan Sidang Baru** (+ validasi 3 dosen berbeda).
- Fitur **Pilih Slot Manual** (rekomendasi slot bebas bentrok untuk kenyamanan mobile).
- **Audit Bentrok Matriks**: Tombol pemindaian menyeluruh untuk memeriksa integritas jadwal di seluruh ruangan dan tanggal.
- **Ekspor & Cetak Rekapitulasi Sidang**: Laporan resmi jadwal sidang siap cetak (Print / PDF) dan ekspor data CSV / Excel.

#### B. 👨‍🏫 Dosen Penguji (Read-Only)
- **Jadwal Per-Dosen Personal**: Filter nama dosen penguji (misal: *Dian Dharmayanti, M.Kom.*, *Andri Heryandi, M.T.*) dengan ringkasan statistik peran (Penguji 1, 2, atau 3), tanggal, jam, ruangan, dan identitas mahasiswa.
- **Daftar Jadwal Lengkap Mingguan/Harian**: Tabel master rekap sidang lengkap dengan filter tanggal dan pencarian.
- Opsi cetak jadwal tugas personal.

#### C. 🎓 Mahasiswa (Read-Only & Cetak Label)
- Tampilan detail jadwal sidang pribadi (Hari/Tanggal, Jam, Ruangan, Judul Skripsi, dan susunan 3 Penguji).
- **Cetak Label Draft Sidang**:
  - Menghasilkan **3 kartu label cetak** resmi (untuk masing-masing Penguji 1, Penguji 2, dan Penguji 3).
  - Format sesuai spesifikasi:
    - **Nama Dosen Penguji & Peran**: `Dian Dharmayanti, S.T., M.Kom. - PENGUJI 1`
    - **Tanggal & Waktu/Ruang**: `SABTU, 2-AGUSTUS-2025 | 09.15-10.30 / R6028`
    - **NIM & Nama Mahasiswa**: `10120262 - SHANIA NUR LUTHFIA`
  - Dilengkapi garis gunting (`✂️ Potong di sini`), tanda tangan penerima draft, dan format cetak presisi (*print-friendly stylesheet*).

---

### 3. Teknologi yang Digunakan
- **Frontend Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS, Lucide Icons
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/utilities`, `@dnd-kit/modifiers`
- **Interaktivitas & Efek**: Canvas Confetti, Custom Animated Notifications
- **Cetak & Ekspor**: Native Print CSS Stylesheet (`@media print`) & CSV Exporter

---

### 4. Cara Menjalankan Aplikasi

1. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan pada `http://localhost:3000`.

2. **Build untuk Produksi**:
   ```bash
   npm run build
   ```

3. **Preview Build**:
   ```bash
   npm run preview
   ```

