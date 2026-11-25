# Arsitektur & Skema Basis Data Relasional SIM-SIDANG

Dokumen ini menjelaskan struktur basis data relasional untuk **Sistem Informasi Manajemen Sidang Skripsi (SIM-SIDANG)**. Rancangan skema dirancang sesuai standar **3NF (Third Normal Form)** dengan penegakan integritas data ketat (*strict referential and domain integrity*).

---

## 1. Diagram Relasi Entitas (Entity-Relationship Diagram / ERD)

```text
  +------------------+             +--------------------+
  |      DOSEN       |             |     MAHASISWA      |
  +------------------+             +--------------------+
  | PK  id           |<---+        | PK  nim            |<-------+
  | UQ  nidn         |    |        |     nama           |        |
  |     nama         |    |        |     program_studi  |        |
  | UQ  kode         |    |        |     tahun_akademik |        |
  | UQ  email        |    |        |     email          |        |
  +------------------+    |        +--------------------+        |
       ^   ^    ^         |                                      |
       |   |    |         | 1                                    | 1
       |   |    +---------|--------------------+                 |
       |   |              |                    |                 |
       |   | (P1/Reviewer)| (P2/Pembimbing)    | (P3)            |
       |   |              |                    |                 |
       |   |      +-------------------------------+              |
       |   +------|       PENGAJUAN_SIDANG        |              |
       |          +-------------------------------+              |
       +----------| PK  id                        |              |
                  | FK  mahasiswa_nim             |--------------+
                  | FK  periode_akademik_id       |-------+
                  |     judul_skripsi             |       |
                  |     jenis ('Skripsi'|'TA')    |       |
                  | FK  dosen_reviewer_id (P1)    |       |
                  | FK  dosen_pembimbing_id (P2)  |       |
                  | FK  dosen_penguji3_id (P3)    |       |
                  |     nilai_seminar             |       |
                  |     status ('unassigned'|'..')|       |
                  +-------------------------------+       |
                                  ^                       |
                                  | 1                     |
                                  |                       |
                                  | 1 (UQ)                |
                  +-------------------------------+       |
                  |         JADWAL_SIDANG         |       |
                  +-------------------------------+       |
                  | PK  id                        |       |
                  | FK  pengajuan_id (UQ)         |       |
                  |     tanggal (DATE)            |       |
                  | FK  slot_waktu_id             |----+  |
                  | FK  ruangan_id                |--+ |  |
                  |     status                    |  | |  |
                  +-------------------------------+  | |  |
                    * UNIQUE(tanggal, slot, ruang)   | |  |
                                                     | |  |
       +--------------------+                        | |  |
       |      RUANGAN       |                        | |  |
       +--------------------+                        | |  |
       | PK  id             |<-----------------------+ |  |
       | UQ  nama           |                          |  |
       |     gedung, lantai |                          |  |
       |     kapasitas (>0) |                          |  |
       +--------------------+                          |  |
                                                       |  |
       +--------------------+                          |  |
       |     SLOT_WAKTU     |                          |  |
       +--------------------+                          |  |
       | PK  id             |<-------------------------+  |
       |     jam_mulai      |                             |
       |     jam_selesai    |                             |
       | UQ  label          |                             |
       | * selesai > mulai  |                             |
       +--------------------+                             |
                                                          |
       +-----------------------------+                    |
       |      PERIODE_AKADEMIK       |                    |
       +-----------------------------+                    |
       | PK  id                      |<-------------------+
       |     tahun_akademik (e.g 26) |
       |     semester (Ganjil/Genap) |
       |     tanggal_mulai / selesai |
       |     is_active (BOOLEAN)     |
       |     status (persiapan/..)   |
       | * UNIQUE(tahun, semester)   |
       | * UNIQUE WHERE is_active    |
       +-----------------------------+
```

---

## 2. Fitur Integritas Data (Data Integrity Guarantees)

### A. Integritas Relasional & Kunci Asing (Foreign Key Integrity)
| Hubungan | Tabel Asal | Kolom FK | Tabel Referensi | Aksi ON DELETE | Aksi ON UPDATE |
|---|---|---|---|---|---|
| Periode Akademik ke Pengajuan | `pengajuan_sidang` | `periode_akademik_id` | `periode_akademik(id)` | `RESTRICT` | `CASCADE` |
| Mahasiswa ke Pengajuan | `pengajuan_sidang` | `mahasiswa_nim` | `mahasiswa(nim)` | `RESTRICT` | `CASCADE` |
| Reviewer ke Dosen (P1) | `pengajuan_sidang` | `dosen_reviewer_id` | `dosen(id)` | `RESTRICT` | `CASCADE` |
| Pembimbing ke Dosen (P2) | `pengajuan_sidang` | `dosen_pembimbing_id` | `dosen(id)` | `RESTRICT` | `CASCADE` |
| Penguji 3 ke Dosen (P3) | `pengajuan_sidang` | `dosen_penguji3_id` | `dosen(id)` | `SET NULL` | `CASCADE` |
| Pengajuan ke Jadwal | `jadwal_sidang` | `pengajuan_id` | `pengajuan_sidang(id)` | `CASCADE` | `CASCADE` |
| Slot Waktu ke Jadwal | `jadwal_sidang` | `slot_waktu_id` | `slot_waktu(id)` | `RESTRICT` | `CASCADE` |
| Ruangan ke Jadwal | `jadwal_sidang` | `ruangan_id` | `ruangan(id)` | `RESTRICT` | `CASCADE` |

### B. Anti-Bentrok Ruangan (Unique Constraint)
```sql
CONSTRAINT uq_jadwal_tanggal_slot_ruangan UNIQUE (tanggal, slot_waktu_id, ruangan_id)
```
*Menjamin 1 ruangan tidak pernah bisa dipesan oleh lebih dari 1 sesi sidang pada jam dan tanggal yang sama.*

### C. Anti-Duplikasi Dosen Penguji dalam Satu Sidang (Check Constraints)
```sql
CONSTRAINT chk_penguji_1_2_beda CHECK (dosen_reviewer_id <> dosen_pembimbing_id)
CONSTRAINT chk_penguji_1_3_beda CHECK (dosen_penguji3_id IS NULL OR dosen_reviewer_id <> dosen_penguji3_id)
CONSTRAINT chk_penguji_2_3_beda CHECK (dosen_penguji3_id IS NULL OR dosen_pembimbing_id <> dosen_penguji3_id)
```
*Menjamin Reviewer, Pembimbing, dan Penguji 3 selalu merupakan 3 orang dosen yang berbeda.*

### D. Anti-Bentrok Jadwal Dosen & Mahasiswa (Database Trigger)
Fungsi trigger `trg_validasi_bentrok_jadwal()` dipicu otomatis sebelum setiap `INSERT` atau `UPDATE` pada tabel `jadwal_sidang`:
1. Memeriksa apakah **Dosen Reviewer (P1)** sudah memiliki jadwal sidang lain pada tanggal & slot waktu yang sama.
2. Memeriksa apakah **Dosen Pembimbing (P2)** sudah memiliki jadwal sidang lain pada tanggal & slot waktu yang sama.
3. Memeriksa apakah **Dosen Penguji 3 (P3)** sudah memiliki jadwal sidang lain pada tanggal & slot waktu yang sama.
4. Jika bentrok ditemukan, transaksi dibatalkan dengan pesan galat spesifik (`RAISE EXCEPTION`), sehingga data tidak konsisten tidak pernah tersimpan ke database.

### E. Integrasi Seminar sebagai Prasyarat Wajib Sidang (Business Rules 2.1 - 2.4)
Sistem menerapkan integrasi berantai antara **Seminar Skripsi/Proposal** dan **Sidang Akhir**:
1. **Prasyarat Mutlak (`pendaftaran_seminar` & `pelaksanaan_seminar`)**:
   - Mahasiswa wajib terdaftar seminar, melaksanakan seminar, dan memiliki status kelulusan `lulus`.
   - Backend memvalidasi status kelulusan sebelum mahasiswa dapat dijadwalkan pada sidang skripsi.
2. **Aturan Penjadwalan Ulang Seminar (`same_schedule`)**:
   - Mahasiswa yang belum lulus seminar dapat dijadwalkan ulang menggunakan nomor pendaftaran seminar yang sama (tanpa membuat pendaftaran baru).
   - Seluruh riwayat percobaan (`pelaksanaan_ke` 1, 2, dst.) tersimpan permanen dan tidak boleh ditimpa atau dihapus.
3. **Pemisahan Periode Akademik (`cross_period`)**:
   - Pelaksanaan seminar dan sidang dapat berlangsung pada periode akademik yang berbeda (misalnya: Seminar Lulus di 2025/2026 Genap, Sidang dilaksanakan di 2026/2027 Ganjil). Kelulusan seminar tetap sah tanpa perlu mengulang seminar saat periode aktif berganti.
4. **Penetapan Penguji Berantai**:
   - **Seminar**: Memerlukan 2 dosen (Dosen Pembimbing dari pendaftaran & Dosen Reviewer yang dipilih Administrator di Papan Jadwal).
   - **Sidang**: Memerlukan 3 dosen:
     - **P1 (Ketua Penguji)**: Terkunci otomatis dari Reviewer Seminar yang telah dinyatakan sah/lulus.
     - **P2 (Penguji 2)**: Terkunci otomatis ke Dosen Pembimbing Seminar.
     - **P3 (Penguji 3)**: Ditentukan oleh Administrator pada Papan Jadwal.

### F. Automatic Account Provisioning (Penyediaan Akun Otomatis)
Sistem menerapkan **Full Automatic Account Provisioning** baik pada level aplikasi frontend/klien maupun pada level basis data relasional PostgreSQL:
1. **Trigger Dosen (`trg_auto_provision_dosen`)**:
   - Setiap kali data dosen baru dimasukkan ke tabel `dosen`, sistem secara otomatis membuatkan entitas akun pengguna di tabel `pengguna`.
   - **Peran**: `ARRAY['dosen']`.
   - **Kredensial Default**: Email dosen atau `<kode>@univ.ac.id`, dengan kata sandi bawaan `Dosen#2025`.
2. **Trigger Mahasiswa (`trg_auto_provision_mahasiswa`)**:
   - Setiap kali data mahasiswa baru dimasukkan ke tabel `mahasiswa` (baik manual maupun impor massal), akun login langsung di-*provision* di tabel `pengguna`.
   - **Peran**: `ARRAY['mahasiswa']`.
   - **Kredensial Default**: `<nim>@mahasiswa.ac.id` (bisa login menggunakan NIM langsung), dengan kata sandi dinamis `Mhs#<NIM>`.

---

## 3. Eksekusi Skema di PostgreSQL / Supabase

1. Buka SQL Editor di **Supabase Dashboard** atau terminal `psql`.
2. Jalankan berkas:
   ```bash
   psql -h <host> -U <user> -d <dbname> -f database/schema.sql
   psql -h <host> -U <user> -d <dbname> -f database/seed.sql
   ```
3. Seluruh tabel, indeks, view, dan trigger langsung aktif dan siap digunakan.

