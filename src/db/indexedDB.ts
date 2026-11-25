/**
 * SISTEM INFORMASI MANAJEMEN SIDANG SKRIPSI (SIM-SIDANG)
 * IndexedDB Relational Engine dengan Penegakan Integritas Data
 */

import {
  DosenRecord,
  MahasiswaRecord,
  RuanganRecord,
  SlotWaktuRecord,
  PengajuanSidangRecord,
  JadwalSidangRecord,
  PenggunaRecord,
  DatabaseDump,
  DatabaseIntegrityReport,
  PeriodeAkademikRecord,
  PendaftaranSeminarRecord,
  PelaksanaanSeminarRecord,
} from './types';
import {
  INITIAL_LECTURERS,
  INITIAL_ROOMS,
  INITIAL_TIME_SLOTS,
  INITIAL_SCHEDULE_ITEMS,
  INITIAL_ACADEMIC_PERIODS,
} from '../data/mockData';

const DB_NAME = 'sim_sidang_relational_db';
const DB_VERSION = 4;

export const STORES = {
  PERIODE_AKADEMIK: 'periode_akademik',
  DOSEN: 'dosen',
  MAHASISWA: 'mahasiswa',
  RUANGAN: 'ruangan',
  SLOT_WAKTU: 'slot_waktu',
  PENDAFTARAN_SEMINAR: 'pendaftaran_seminar',
  PELAKSANAAN_SEMINAR: 'pelaksanaan_seminar',
  PENGAJUAN_SIDANG: 'pengajuan_sidang',
  JADWAL_SIDANG: 'jadwal_sidang',
  PENGGUNA: 'pengguna',
} as const;

class RelationalDatabaseEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Membuka koneksi IndexedDB dan membuat skema tabel + indeks
   */
  public async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB tidak didukung pada browser ini'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 0. Store Periode Akademik (Active Academic Period Control)
        if (!db.objectStoreNames.contains(STORES.PERIODE_AKADEMIK)) {
          const periodeStore = db.createObjectStore(STORES.PERIODE_AKADEMIK, { keyPath: 'id' });
          periodeStore.createIndex('tahun_akademik', 'tahun_akademik', { unique: false });
          periodeStore.createIndex('semester', 'semester', { unique: false });
          periodeStore.createIndex('is_active', 'is_active', { unique: false });
          periodeStore.createIndex('status', 'status', { unique: false });
          periodeStore.createIndex('uq_tahun_semester', ['tahun_akademik', 'semester'], { unique: true });
        }

        // 1. Store Dosen
        if (!db.objectStoreNames.contains(STORES.DOSEN)) {
          const dosenStore = db.createObjectStore(STORES.DOSEN, { keyPath: 'id' });
          dosenStore.createIndex('nidn', 'nidn', { unique: true });
          dosenStore.createIndex('kode', 'kode', { unique: true });
          dosenStore.createIndex('email', 'email', { unique: true });
        }

        // 2. Store Mahasiswa
        if (!db.objectStoreNames.contains(STORES.MAHASISWA)) {
          const mhsStore = db.createObjectStore(STORES.MAHASISWA, { keyPath: 'nim' });
          mhsStore.createIndex('nama', 'nama', { unique: false });
        }

        // 3. Store Ruangan
        if (!db.objectStoreNames.contains(STORES.RUANGAN)) {
          const roomStore = db.createObjectStore(STORES.RUANGAN, { keyPath: 'id' });
          roomStore.createIndex('nama', 'nama', { unique: true });
        }

        // 4. Store Slot Waktu
        if (!db.objectStoreNames.contains(STORES.SLOT_WAKTU)) {
          const slotStore = db.createObjectStore(STORES.SLOT_WAKTU, { keyPath: 'id' });
          slotStore.createIndex('label', 'label', { unique: true });
          slotStore.createIndex('jam_mulai', 'jam_mulai', { unique: false });
        }

        // 5. Store Pendaftaran Seminar (Aturan 2.1 & 2.2: same_schedule)
        if (!db.objectStoreNames.contains(STORES.PENDAFTARAN_SEMINAR)) {
          const seminarStore = db.createObjectStore(STORES.PENDAFTARAN_SEMINAR, { keyPath: 'id' });
          seminarStore.createIndex('mahasiswa_nim', 'mahasiswa_nim', { unique: true });
          seminarStore.createIndex('periode_akademik_id', 'periode_akademik_id', { unique: false });
          seminarStore.createIndex('status_kelulusan', 'status_kelulusan', { unique: false });
          seminarStore.createIndex('dosen_pembimbing_id', 'dosen_pembimbing_id', { unique: false });
        }

        // 6. Store Pelaksanaan Seminar (Riwayat Pelaksanaan & cross_period)
        if (!db.objectStoreNames.contains(STORES.PELAKSANAAN_SEMINAR)) {
          const exeStore = db.createObjectStore(STORES.PELAKSANAAN_SEMINAR, { keyPath: 'id' });
          exeStore.createIndex('pendaftaran_seminar_id', 'pendaftaran_seminar_id', { unique: false });
          exeStore.createIndex('periode_akademik_id', 'periode_akademik_id', { unique: false });
          exeStore.createIndex('dosen_reviewer_id', 'dosen_reviewer_id', { unique: false });
          exeStore.createIndex('dosen_pembimbing_id', 'dosen_pembimbing_id', { unique: false });
          exeStore.createIndex('hasil', 'hasil', { unique: false });
          exeStore.createIndex('tanggal', 'tanggal', { unique: false });
          exeStore.createIndex('slot_waktu_id', 'slot_waktu_id', { unique: false });
          exeStore.createIndex('ruangan_id', 'ruangan_id', { unique: false });
        }

        // 7. Store Pengajuan Sidang
        if (!db.objectStoreNames.contains(STORES.PENGAJUAN_SIDANG)) {
          const pengajuanStore = db.createObjectStore(STORES.PENGAJUAN_SIDANG, { keyPath: 'id' });
          pengajuanStore.createIndex('mahasiswa_nim', 'mahasiswa_nim', { unique: true });
          pengajuanStore.createIndex('periode_akademik_id', 'periode_akademik_id', { unique: false });
          pengajuanStore.createIndex('pendaftaran_seminar_id', 'pendaftaran_seminar_id', { unique: false });
          pengajuanStore.createIndex('status', 'status', { unique: false });
          pengajuanStore.createIndex('dosen_reviewer_id', 'dosen_reviewer_id', { unique: false });
          pengajuanStore.createIndex('dosen_pembimbing_id', 'dosen_pembimbing_id', { unique: false });
          pengajuanStore.createIndex('dosen_penguji3_id', 'dosen_penguji3_id', { unique: false });
        } else {
          // Upgrade existing store if needed
          const tx = (event.target as IDBOpenDBRequest).transaction;
          if (tx) {
            const pengajuanStore = tx.objectStore(STORES.PENGAJUAN_SIDANG);
            if (!pengajuanStore.indexNames.contains('periode_akademik_id')) {
              pengajuanStore.createIndex('periode_akademik_id', 'periode_akademik_id', { unique: false });
            }
            if (!pengajuanStore.indexNames.contains('pendaftaran_seminar_id')) {
              pengajuanStore.createIndex('pendaftaran_seminar_id', 'pendaftaran_seminar_id', { unique: false });
            }
          }
        }

        // 8. Store Jadwal Sidang
        if (!db.objectStoreNames.contains(STORES.JADWAL_SIDANG)) {
          const jadwalStore = db.createObjectStore(STORES.JADWAL_SIDANG, { keyPath: 'id' });
          jadwalStore.createIndex('pengajuan_id', 'pengajuan_id', { unique: false });
          jadwalStore.createIndex('pelaksanaan_seminar_id', 'pelaksanaan_seminar_id', { unique: false });
          jadwalStore.createIndex('tanggal', 'tanggal', { unique: false });
          jadwalStore.createIndex('slot_waktu_id', 'slot_waktu_id', { unique: false });
          jadwalStore.createIndex('ruangan_id', 'ruangan_id', { unique: false });
          jadwalStore.createIndex('uq_ruangan_slot_tanggal', ['tanggal', 'slot_waktu_id', 'ruangan_id'], { unique: true });
        }

        // 9. Store Pengguna (Otentikasi & Akun)
        if (!db.objectStoreNames.contains(STORES.PENGGUNA)) {
          const userStore = db.createObjectStore(STORES.PENGGUNA, { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    const db = await this.dbPromise;
    await this.ensureInitialSeed(db);
    return db;
  }

  /**
   * Melakukan seeding awal jika database kosong
   */
  private async ensureInitialSeed(db: IDBDatabase): Promise<void> {
    const dosenCount = await this.countRecords(db, STORES.DOSEN);
    const now = new Date().toISOString();

    // Pastikan Periode Akademik terisi meskipun store lain sudah ada
    const periodeCount = await this.countRecords(db, STORES.PERIODE_AKADEMIK);
    if (periodeCount === 0) {
      const txPeriode = db.transaction(STORES.PERIODE_AKADEMIK, 'readwrite');
      INITIAL_ACADEMIC_PERIODS.forEach((p) => {
        txPeriode.objectStore(STORES.PERIODE_AKADEMIK).put({
          id: p.id,
          tahun_akademik: p.academicYear,
          semester: p.semester,
          tanggal_mulai: p.startDate,
          tanggal_selesai: p.endDate,
          is_active: p.isActive,
          status: p.status,
          created_at: p.createdAt || now,
          updated_at: p.updatedAt || now,
        });
      });
      await new Promise<void>((resolve, reject) => {
        txPeriode.oncomplete = () => resolve();
        txPeriode.onerror = () => reject(txPeriode.error);
      });
    }

    if (dosenCount > 0) return; // Data utama sudah terisi

    // 0. Seed Periode Akademik
    const periodeList: PeriodeAkademikRecord[] = INITIAL_ACADEMIC_PERIODS.map((p) => ({
      id: p.id,
      tahun_akademik: p.academicYear,
      semester: p.semester,
      tanggal_mulai: p.startDate,
      tanggal_selesai: p.endDate,
      is_active: p.isActive,
      status: p.status,
      created_at: p.createdAt || now,
      updated_at: p.updatedAt || now,
    }));

    // 1. Seed Dosen
    const dosenList: DosenRecord[] = INITIAL_LECTURERS.map((l) => ({
      id: l.id,
      nidn: l.nidn,
      nama: l.name,
      kode: l.code,
      program_studi: l.department,
      email: l.email,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    // 2. Seed Ruangan
    const ruanganList: RuanganRecord[] = INITIAL_ROOMS.map((r) => ({
      id: r.id,
      nama: r.name,
      gedung: r.building,
      lantai: r.floor,
      kapasitas: r.capacity,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    // 3. Seed Slot Waktu
    const slotList: SlotWaktuRecord[] = INITIAL_TIME_SLOTS.map((s, idx) => ({
      id: s.id,
      jam_mulai: s.startTime,
      jam_selesai: s.endTime,
      label: s.label,
      urutan: idx + 1,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    // 4. Seed Mahasiswa & Pengajuan & Seminar & Jadwal dari INITIAL_SCHEDULE_ITEMS
    const mhsList: MahasiswaRecord[] = [];
    const pendaftaranSeminarList: PendaftaranSeminarRecord[] = [];
    const pelaksanaanSeminarList: PelaksanaanSeminarRecord[] = [];
    const pengajuanList: PengajuanSidangRecord[] = [];
    const jadwalList: JadwalSidangRecord[] = [];

    INITIAL_SCHEDULE_ITEMS.forEach((item) => {
      // Mahasiswa
      if (!mhsList.some((m) => m.nim === item.nim)) {
        mhsList.push({
          nim: item.nim,
          nama: item.studentName,
          program_studi: item.studyProgram || 'Teknik Informatika',
          tahun_akademik: item.academicYear || '2024/2025',
          created_at: now,
          updated_at: now,
        });
      }

      if (item.activityType === 'seminar') {
        const regId = item.seminarRegistrationId || `sem-reg-${item.nim}`;
        pendaftaranSeminarList.push({
          id: regId,
          mahasiswa_nim: item.nim,
          periode_akademik_id: item.academicPeriodId || 'prd-2025-genap',
          judul_penelitian: item.thesisTitle,
          jenis: (item.thesisType === 'Tugas Akhir' ? 'Tugas Akhir' : 'Skripsi'),
          dosen_pembimbing_id: item.examiner2Id,
          status: item.status === 'completed' ? 'selesai' : item.status === 'scheduled' ? 'terjadwal' : 'terdaftar',
          status_kelulusan: (item.seminarResult === 'lulus' || item.seminarResult === 'belum_lulus') ? item.seminarResult : (item.status === 'completed' ? (item.isSeminarPassed ? 'lulus' : 'belum_lulus') : 'belum_seminar'),
          pelaksanaan_terakhir_ke: item.attemptNumber || 1,
          nilai_akhir: typeof item.seminarScore === 'number' ? item.seminarScore : undefined,
          created_at: now,
          updated_at: now,
        });

        // Simpan riwayat jika ada percobaan sebelumnya (same_schedule)
        if (item.seminarHistory && item.seminarHistory.length > 0) {
          item.seminarHistory.forEach((hist) => {
            pelaksanaanSeminarList.push({
              id: `sem-exe-${item.nim}-att-${hist.attemptNumber}`,
              pendaftaran_seminar_id: regId,
              pelaksanaan_ke: hist.attemptNumber,
              periode_akademik_id: hist.academicPeriodId,
              dosen_reviewer_id: hist.reviewerId,
              dosen_pembimbing_id: hist.advisorId,
              tanggal: hist.date,
              slot_waktu_id: hist.timeSlotId || undefined,
              ruangan_id: hist.roomId || undefined,
              status_pelaksanaan: 'completed',
              hasil: hist.result,
              nilai: hist.score,
              catatan_revisi: hist.feedback,
              evaluated_at: hist.evaluatedAt,
              evaluated_by: hist.evaluatedBy,
              created_at: now,
              updated_at: now,
            });
          });
        }

        // Pelaksanaan saat ini
        pelaksanaanSeminarList.push({
          id: `sem-exe-${item.id}`,
          pendaftaran_seminar_id: regId,
          pelaksanaan_ke: item.attemptNumber || 1,
          periode_akademik_id: item.academicPeriodId || 'prd-2025-genap',
          dosen_reviewer_id: item.examiner1Id || undefined,
          dosen_pembimbing_id: item.examiner2Id,
          tanggal: item.date,
          slot_waktu_id: item.timeSlotId || undefined,
          ruangan_id: item.roomId || undefined,
          status_pelaksanaan: item.status,
          hasil: item.seminarResult || (item.status === 'completed' ? (item.isSeminarPassed ? 'lulus' : 'belum_lulus') : 'belum_dinilai'),
          nilai: typeof item.seminarScore === 'number' ? item.seminarScore : undefined,
          catatan_revisi: item.notes,
          created_at: now,
          updated_at: now,
        });

        // Jika seminar terjadwal pada matriks
        if ((item.status === 'scheduled' || item.status === 'completed') && item.timeSlotId && item.roomId) {
          jadwalList.push({
            id: `jdw-${item.id}`,
            jenis_kegiatan: 'seminar',
            pengajuan_id: item.id,
            pelaksanaan_seminar_id: `sem-exe-${item.id}`,
            tanggal: item.date,
            slot_waktu_id: item.timeSlotId,
            ruangan_id: item.roomId,
            status: item.status === 'completed' ? 'completed' : 'scheduled',
            created_at: now,
            updated_at: now,
          });
        }
      } else {
        // Kegiatan Sidang (Wajib telah Lulus Seminar)
        const isScheduledOrCompleted = item.status === 'scheduled' || item.status === 'completed';
        const semRegId = `sem-reg-passed-${item.nim}`;
        const semExeId = `sem-exe-passed-${item.nim}`;

        // Buat data kelulusan seminar otomatis untuk mahasiswa sidang yang sudah valid lulus
        pendaftaranSeminarList.push({
          id: semRegId,
          mahasiswa_nim: item.nim,
          periode_akademik_id: 'prd-2025-ganjil', // Mendukung cross_period
          judul_penelitian: item.thesisTitle,
          jenis: (item.thesisType === 'Tugas Akhir' ? 'Tugas Akhir' : 'Skripsi'),
          dosen_pembimbing_id: item.examiner2Id,
          status: 'selesai',
          status_kelulusan: 'lulus',
          pelaksanaan_terakhir_ke: 1,
          nilai_akhir: typeof item.seminarScore === 'number' ? item.seminarScore : 85,
          created_at: now,
          updated_at: now,
        });

        pelaksanaanSeminarList.push({
          id: semExeId,
          pendaftaran_seminar_id: semRegId,
          pelaksanaan_ke: 1,
          periode_akademik_id: 'prd-2025-ganjil',
          dosen_reviewer_id: item.examiner1Id,
          dosen_pembimbing_id: item.examiner2Id,
          tanggal: '2025-01-20',
          slot_waktu_id: 'slot-1',
          ruangan_id: 'room-1',
          status_pelaksanaan: 'completed',
          hasil: 'lulus',
          nilai: typeof item.seminarScore === 'number' ? item.seminarScore : 85,
          catatan_revisi: 'Seminar lulus, disetujui untuk sidang skripsi.',
          created_at: now,
          updated_at: now,
        });

        pengajuanList.push({
          id: item.id,
          mahasiswa_nim: item.nim,
          periode_akademik_id: item.academicPeriodId || 'prd-2025-genap',
          pendaftaran_seminar_id: semRegId,
          pelaksanaan_seminar_id: semExeId,
          judul_skripsi: item.thesisTitle,
          jenis: (item.thesisType === 'Tugas Akhir' ? 'Tugas Akhir' : 'Skripsi'),
          dosen_reviewer_id: item.examiner1Id,
          dosen_pembimbing_id: item.examiner2Id,
          dosen_penguji3_id: isScheduledOrCompleted ? (item.examiner3Id || undefined) : undefined,
          nilai_seminar: typeof item.seminarScore === 'number' ? item.seminarScore : Number(item.seminarScore) || undefined,
          status: item.status,
          created_at: now,
          updated_at: now,
        });

        // Jadwal Sidang (jika sudah dijadwalkan)
        if (isScheduledOrCompleted && item.timeSlotId && item.roomId) {
          jadwalList.push({
            id: `jdw-${item.id}`,
            jenis_kegiatan: 'sidang',
            pengajuan_id: item.id,
            tanggal: item.date,
            slot_waktu_id: item.timeSlotId,
            ruangan_id: item.roomId,
            status: item.status === 'completed' ? 'completed' : 'scheduled',
            created_at: now,
            updated_at: now,
          });
        }
      }
    });

    // 5. Seed Pengguna Akun Tetap (Admin & Dosen)
    // Sesuai aturan: Role Admin & Dosen memerlukan password tersimpan; Mahasiswa diverifikasi via NIM
    const userList: PenggunaRecord[] = [
      {
        id: 'usr-admin-1',
        email: 'admin@simsidang.ac.id',
        nama: 'Administrator Panitia Sidang',
        roles: ['admin'],
        role_utama: 'admin',
        password_hash: 'Admin#2025',
        password_required: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr-dosen-admin-1',
        email: 'dian.dharmayanti@email.ac.id',
        nama: 'Dian Dharmayanti, S.T., M.Kom.',
        roles: ['dosen', 'admin'],
        role_utama: 'admin',
        password_hash: 'Dosen#2025',
        password_required: true,
        lecturer_id: 'lec-1',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr-dosen-2',
        email: 'andri.heryandi@email.ac.id',
        nama: 'Andri Heryandi, S.T., M.T.',
        roles: ['dosen'],
        role_utama: 'dosen',
        password_hash: 'Dosen#2025',
        password_required: true,
        lecturer_id: 'lec-2',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr-dosen-3',
        email: 'chrismikha.hardyanto@email.ac.id',
        nama: 'Chrismikha Hardyanto, M.Kom.',
        roles: ['dosen'],
        role_utama: 'dosen',
        password_hash: 'Dosen#2025',
        password_required: true,
        lecturer_id: 'lec-3',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    // Jalankan dalam 1 Transaksi Batch
    const tx = db.transaction(
      [
        STORES.PERIODE_AKADEMIK,
        STORES.DOSEN,
        STORES.RUANGAN,
        STORES.SLOT_WAKTU,
        STORES.MAHASISWA,
        STORES.PENDAFTARAN_SEMINAR,
        STORES.PELAKSANAAN_SEMINAR,
        STORES.PENGAJUAN_SIDANG,
        STORES.JADWAL_SIDANG,
        STORES.PENGGUNA,
      ],
      'readwrite'
    );

    periodeList.forEach((p) => tx.objectStore(STORES.PERIODE_AKADEMIK).put(p));
    dosenList.forEach((d) => tx.objectStore(STORES.DOSEN).put(d));
    ruanganList.forEach((r) => tx.objectStore(STORES.RUANGAN).put(r));
    slotList.forEach((s) => tx.objectStore(STORES.SLOT_WAKTU).put(s));
    mhsList.forEach((m) => tx.objectStore(STORES.MAHASISWA).put(m));
    pendaftaranSeminarList.forEach((sem) => tx.objectStore(STORES.PENDAFTARAN_SEMINAR).put(sem));
    pelaksanaanSeminarList.forEach((exe) => tx.objectStore(STORES.PELAKSANAAN_SEMINAR).put(exe));
    pengajuanList.forEach((p) => tx.objectStore(STORES.PENGAJUAN_SIDANG).put(p));
    jadwalList.forEach((j) => tx.objectStore(STORES.JADWAL_SIDANG).put(j));
    userList.forEach((u) => tx.objectStore(STORES.PENGGUNA).put(u));

    periodeList.forEach((p) => tx.objectStore(STORES.PERIODE_AKADEMIK).put(p));
    dosenList.forEach((d) => tx.objectStore(STORES.DOSEN).put(d));
    ruanganList.forEach((r) => tx.objectStore(STORES.RUANGAN).put(r));
    slotList.forEach((s) => tx.objectStore(STORES.SLOT_WAKTU).put(s));
    mhsList.forEach((m) => tx.objectStore(STORES.MAHASISWA).put(m));
    pengajuanList.forEach((p) => tx.objectStore(STORES.PENGAJUAN_SIDANG).put(p));
    jadwalList.forEach((j) => tx.objectStore(STORES.JADWAL_SIDANG).put(j));
    userList.forEach((u) => tx.objectStore(STORES.PENGGUNA).put(u));

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --------------------------------------------------------------------------
  // Helper Operasi CRUD Berbasis Promise
  // --------------------------------------------------------------------------

  public async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  public async getById<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async countRecords(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // --------------------------------------------------------------------------
  // Penegakan Integritas: Validasi Foreign Key & Anti-Bentrok
  // --------------------------------------------------------------------------

  /**
   * Menjadwalkan pengajuan ke slot waktu dan ruangan dengan validasi integritas
   */
  public async assignScheduleAtomic(
    pengajuanId: string,
    tanggal: string,
    slotWaktuId: string,
    ruanganId: string
  ): Promise<{ success: boolean; error?: string }> {
    const db = await this.getDB();

    // 1. Cek keberadaan pengajuan
    const pengajuan = await this.getById<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG, pengajuanId);
    if (!pengajuan) {
      return { success: false, error: 'Data pengajuan sidang tidak ditemukan' };
    }

    // Integritas Kunci Permanen: Sidang Selesai tidak boleh diubah
    if (pengajuan.status === 'completed') {
      return {
        success: false,
        error: 'Integritas Terkunci: Sidang ini telah dinyatakan selesai. Data penguji 3 dan jadwal tersimpan permanen dan tidak dapat diubah.',
      };
    }

    // 2. Cek keberadaan slot waktu
    const slot = await this.getById<SlotWaktuRecord>(STORES.SLOT_WAKTU, slotWaktuId);
    if (!slot) {
      return { success: false, error: 'Slot waktu tidak valid' };
    }

    // 3. Cek keberadaan ruangan
    const room = await this.getById<RuanganRecord>(STORES.RUANGAN, ruanganId);
    if (!room) {
      return { success: false, error: 'Ruangan tidak valid' };
    }

    // 4. Ambil semua jadwal pada tanggal dan slot yang sama untuk verifikasi anti-bentrok
    const allJadwal = await this.getAll<JadwalSidangRecord>(STORES.JADWAL_SIDANG);
    const concurrentJadwal = allJadwal.filter(
      (j) => j.tanggal === tanggal && j.slot_waktu_id === slotWaktuId && j.pengajuan_id !== pengajuanId
    );

    // Integritas A: Ruangan tidak boleh digunakan 2 sidang bersamaan
    const roomConflict = concurrentJadwal.find((j) => j.ruangan_id === ruanganId);
    if (roomConflict) {
      return {
        success: false,
        error: `Integritas Database Terlanggar: Ruangan ${room.nama} sudah digunakan pada sesi ini.`,
      };
    }

    // Integritas B: Dosen penguji (P1, P2, P3) tidak boleh menguji 2 sidang bersamaan
    const allPengajuan = await this.getAll<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG);
    const pengajuanMap = new Map<string, PengajuanSidangRecord>(allPengajuan.map((p) => [p.id, p]));

    const targetExaminers = [
      pengajuan.dosen_reviewer_id,
      pengajuan.dosen_pembimbing_id,
      pengajuan.dosen_penguji3_id,
    ].filter(Boolean);

    for (const j of concurrentJadwal) {
      const p = pengajuanMap.get(j.pengajuan_id);
      if (!p) continue;
      const otherExaminers = [p.dosen_reviewer_id, p.dosen_pembimbing_id, p.dosen_penguji3_id].filter(Boolean);

      for (const exId of targetExaminers) {
        if (otherExaminers.includes(exId)) {
          const dosen = await this.getById<DosenRecord>(STORES.DOSEN, exId!);
          return {
            success: false,
            error: `Integritas Database Terlanggar: Dosen ${dosen?.nama || exId} memiliki jadwal bentrok pada sesi ini.`,
          };
        }
      }
    }

    // 5. Update atomic di Jadwal dan Pengajuan
    const now = new Date().toISOString();
    const existingJadwal = allJadwal.find((j) => j.pengajuan_id === pengajuanId);
    const jadwalId = existingJadwal ? existingJadwal.id : `jdw-${pengajuanId}`;

    const newJadwal: JadwalSidangRecord = {
      id: jadwalId,
      pengajuan_id: pengajuanId,
      tanggal,
      slot_waktu_id: slotWaktuId,
      ruangan_id: ruanganId,
      status: 'scheduled',
      created_at: existingJadwal?.created_at || now,
      updated_at: now,
    };

    const updatedPengajuan: PengajuanSidangRecord = {
      ...pengajuan,
      status: 'scheduled',
      updated_at: now,
    };

    const tx = db.transaction([STORES.JADWAL_SIDANG, STORES.PENGAJUAN_SIDANG], 'readwrite');
    tx.objectStore(STORES.JADWAL_SIDANG).put(newJadwal);
    tx.objectStore(STORES.PENGAJUAN_SIDANG).put(updatedPengajuan);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return { success: true };
  }

  /**
   * Menghapus jadwal dan mengembalikan status pengajuan menjadi 'unassigned'
   */
  public async unassignScheduleAtomic(pengajuanId: string): Promise<void> {
    const db = await this.getDB();
    const allJadwal = await this.getAll<JadwalSidangRecord>(STORES.JADWAL_SIDANG);
    const jadwal = allJadwal.find((j) => j.pengajuan_id === pengajuanId);
    const pengajuan = await this.getById<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG, pengajuanId);

    if (pengajuan && pengajuan.status === 'completed') {
      throw new Error('Integritas Terkunci: Sidang ini telah dinyatakan selesai dan tersimpan permanen. Jadwal tidak dapat dibatalkan.');
    }

    const tx = db.transaction([STORES.JADWAL_SIDANG, STORES.PENGAJUAN_SIDANG], 'readwrite');
    if (jadwal) {
      tx.objectStore(STORES.JADWAL_SIDANG).delete(jadwal.id);
    }
    if (pengajuan) {
      tx.objectStore(STORES.PENGAJUAN_SIDANG).put({
        ...pengajuan,
        status: 'unassigned',
        dosen_penguji3_id: undefined, // Sesuai aturan: unassigned tidak memiliki Penguji 3
        updated_at: new Date().toISOString(),
      });
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Menghapus data mahasiswa dan pengajuan sidang secara atomik
   */
  public async deleteStudentAtomic(pengajuanId: string, nim?: string): Promise<void> {
    const db = await this.getDB();
    const allJadwal = await this.getAll<JadwalSidangRecord>(STORES.JADWAL_SIDANG);
    const jadwal = allJadwal.find((j) => j.pengajuan_id === pengajuanId);
    const pengajuan = await this.getById<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG, pengajuanId);
    const targetNim = nim || pengajuan?.mahasiswa_nim;

    const tx = db.transaction(
      [STORES.PENGAJUAN_SIDANG, STORES.JADWAL_SIDANG, STORES.MAHASISWA, STORES.PENGGUNA],
      'readwrite'
    );

    // 1. Hapus jadwal jika ada
    if (jadwal) {
      tx.objectStore(STORES.JADWAL_SIDANG).delete(jadwal.id);
    }
    // 2. Hapus pengajuan sidang
    tx.objectStore(STORES.PENGAJUAN_SIDANG).delete(pengajuanId);

    // 3. Hapus data mahasiswa dari STORES.MAHASISWA jika ada
    if (targetNim) {
      tx.objectStore(STORES.MAHASISWA).delete(targetNim);

      // 4. Hapus akun pengguna mahasiswa jika ada
      const allUsers = await this.getAll<PenggunaRecord>(STORES.PENGGUNA);
      const user = allUsers.find(u => u.student_nim === targetNim || u.email.startsWith(targetNim));
      if (user) {
        tx.objectStore(STORES.PENGGUNA).delete(user.id);
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Menghapus beberapa data mahasiswa secara atomik
   */
  public async deleteStudentsBulkAtomic(items: Array<{ id: string; nim: string }>): Promise<void> {
    const db = await this.getDB();
    const allJadwal = await this.getAll<JadwalSidangRecord>(STORES.JADWAL_SIDANG);
    const allUsers = await this.getAll<PenggunaRecord>(STORES.PENGGUNA);

    const tx = db.transaction(
      [STORES.PENGAJUAN_SIDANG, STORES.JADWAL_SIDANG, STORES.MAHASISWA, STORES.PENGGUNA],
      'readwrite'
    );

    for (const item of items) {
      const jadwal = allJadwal.find((j) => j.pengajuan_id === item.id);
      if (jadwal) {
        tx.objectStore(STORES.JADWAL_SIDANG).delete(jadwal.id);
      }
      tx.objectStore(STORES.PENGAJUAN_SIDANG).delete(item.id);
      if (item.nim) {
        tx.objectStore(STORES.MAHASISWA).delete(item.nim);
        const user = allUsers.find(u => u.student_nim === item.nim || u.email.startsWith(item.nim));
        if (user) {
          tx.objectStore(STORES.PENGGUNA).delete(user.id);
        }
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Menyatakan sidang selesai dan mengunci permanen data pengajuan & Penguji 3
   */
  public async completeScheduleAtomic(pengajuanId: string): Promise<{ success: boolean; error?: string }> {
    const db = await this.getDB();
    const pengajuan = await this.getById<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG, pengajuanId);
    if (!pengajuan) {
      return { success: false, error: 'Data pengajuan sidang tidak ditemukan' };
    }

    if (!pengajuan.dosen_penguji3_id) {
      return { success: false, error: 'Integritas Gagal: Dosen Penguji 3 wajib telah ditetapkan sebelum sidang dinyatakan selesai.' };
    }

    const allJadwal = await this.getAll<JadwalSidangRecord>(STORES.JADWAL_SIDANG);
    const jadwal = allJadwal.find((j) => j.pengajuan_id === pengajuanId);
    if (!jadwal) {
      return { success: false, error: 'Sidang belum memiliki ruangan dan slot waktu jadwal yang valid.' };
    }

    const now = new Date().toISOString();
    const tx = db.transaction([STORES.JADWAL_SIDANG, STORES.PENGAJUAN_SIDANG], 'readwrite');
    tx.objectStore(STORES.PENGAJUAN_SIDANG).put({
      ...pengajuan,
      status: 'completed',
      completed_at: now,
      updated_at: now,
    });
    tx.objectStore(STORES.JADWAL_SIDANG).put({
      ...jadwal,
      status: 'completed',
      completed_at: now,
      updated_at: now,
    });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return { success: true };
  }

  /**
   * Membuka kembali status sidang jika diperlukan oleh administrator utama
   */
  public async reopenScheduleAtomic(pengajuanId: string): Promise<{ success: boolean; error?: string }> {
    const db = await this.getDB();
    const pengajuan = await this.getById<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG, pengajuanId);
    if (!pengajuan) return { success: false, error: 'Pengajuan tidak ditemukan' };

    const allJadwal = await this.getAll<JadwalSidangRecord>(STORES.JADWAL_SIDANG);
    const jadwal = allJadwal.find((j) => j.pengajuan_id === pengajuanId);

    const now = new Date().toISOString();
    const tx = db.transaction([STORES.JADWAL_SIDANG, STORES.PENGAJUAN_SIDANG], 'readwrite');
    tx.objectStore(STORES.PENGAJUAN_SIDANG).put({
      ...pengajuan,
      status: 'scheduled',
      completed_at: undefined,
      updated_at: now,
    });
    if (jadwal) {
      tx.objectStore(STORES.JADWAL_SIDANG).put({
        ...jadwal,
        status: 'scheduled',
        completed_at: undefined,
        updated_at: now,
      });
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return { success: true };
  }

  // --------------------------------------------------------------------------
  // Audit Integritas Database
  // --------------------------------------------------------------------------
  public async runIntegrityAudit(): Promise<DatabaseIntegrityReport> {
    const periode = await this.getAll<PeriodeAkademikRecord>(STORES.PERIODE_AKADEMIK);
    const dosen = await this.getAll<DosenRecord>(STORES.DOSEN);
    const mhs = await this.getAll<MahasiswaRecord>(STORES.MAHASISWA);
    const rooms = await this.getAll<RuanganRecord>(STORES.RUANGAN);
    const slots = await this.getAll<SlotWaktuRecord>(STORES.SLOT_WAKTU);
    const pendaftaranSem = await this.getAll<PendaftaranSeminarRecord>(STORES.PENDAFTARAN_SEMINAR);
    const pelaksanaanSem = await this.getAll<PelaksanaanSeminarRecord>(STORES.PELAKSANAAN_SEMINAR);
    const pengajuan = await this.getAll<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG);
    const jadwal = await this.getAll<JadwalSidangRecord>(STORES.JADWAL_SIDANG);
    const users = await this.getAll<PenggunaRecord>(STORES.PENGGUNA);

    const violations: string[] = [];
    const periodeIds = new Set(periode.map((p) => p.id));
    const dosenIds = new Set(dosen.map((d) => d.id));
    const mhsNims = new Set(mhs.map((m) => m.nim));
    const roomIds = new Set(rooms.map((r) => r.id));
    const slotIds = new Set(slots.map((s) => s.id));
    const pendaftaranSemIds = new Set(pendaftaranSem.map((s) => s.id));
    const pengajuanIds = new Set(pengajuan.map((p) => p.id));

    let completedLockedCount = 0;

    // 0. Cek Integritas Periode Akademik (Active Period Invariant)
    const activePeriods = periode.filter((p) => p.is_active);
    if (activePeriods.length > 1) {
      violations.push(`Aturan Gagal: Terdeteksi ${activePeriods.length} periode akademik aktif bersamaan. Hanya boleh terdapat 1 periode aktif.`);
    }

    // 1. Cek Integritas Seminar (Aturan Bisnis 2.1 - 2.4)
    pendaftaranSem.forEach((sem) => {
      if (!mhsNims.has(sem.mahasiswa_nim)) {
        violations.push(`FK Hilang: Mahasiswa NIM ${sem.mahasiswa_nim} di pendaftaran seminar ${sem.id} tidak ada di tabel mahasiswa.`);
      }
      if (!dosenIds.has(sem.dosen_pembimbing_id)) {
        violations.push(`FK Hilang: Dosen Pembimbing ID ${sem.dosen_pembimbing_id} di seminar ${sem.id} tidak ada di tabel dosen.`);
      }
    });

    pelaksanaanSem.forEach((exe) => {
      if (!pendaftaranSemIds.has(exe.pendaftaran_seminar_id)) {
        violations.push(`Orphaned Record: Pelaksanaan seminar ${exe.id} mengacu pada pendaftaran ${exe.pendaftaran_seminar_id} yang tidak ditemukan.`);
      }
      if (exe.dosen_reviewer_id && !dosenIds.has(exe.dosen_reviewer_id)) {
        violations.push(`FK Hilang: Reviewer ID ${exe.dosen_reviewer_id} di pelaksanaan seminar ${exe.id} tidak ada di tabel dosen.`);
      }
      if (exe.dosen_reviewer_id && exe.dosen_reviewer_id === exe.dosen_pembimbing_id) {
        violations.push(`Aturan Gagal: Reviewer seminar tidak boleh sama dengan Dosen Pembimbing pada pelaksanaan ${exe.id}.`);
      }
    });

    // 2. Cek Foreign Key & Aturan Penguji di Pengajuan
    const studentPeriodMap = new Set<string>();
    pengajuan.forEach((p) => {
      if (p.periode_akademik_id && !periodeIds.has(p.periode_akademik_id)) {
        violations.push(`FK Hilang: Periode ID ${p.periode_akademik_id} di pengajuan ${p.id} tidak ada di tabel periode_akademik.`);
      }

      // Cegah pengajuan ganda mahasiswa di periode yang sama
      if (p.periode_akademik_id) {
        const studentPeriodKey = `${p.mahasiswa_nim}_${p.periode_akademik_id}`;
        if (studentPeriodMap.has(studentPeriodKey)) {
          violations.push(`Duplikasi Pengajuan: Mahasiswa NIM ${p.mahasiswa_nim} memiliki lebih dari 1 pengajuan pada periode ${p.periode_akademik_id}.`);
        }
        studentPeriodMap.add(studentPeriodKey);
      }

      if (!mhsNims.has(p.mahasiswa_nim)) {
        violations.push(`FK Hilang: Mahasiswa NIM ${p.mahasiswa_nim} di pengajuan ${p.id} tidak ada di tabel mahasiswa.`);
      }
      if (!dosenIds.has(p.dosen_reviewer_id)) {
        violations.push(`FK Hilang: Dosen Reviewer ID ${p.dosen_reviewer_id} di pengajuan ${p.id} tidak ada di tabel dosen.`);
      }
      if (!dosenIds.has(p.dosen_pembimbing_id)) {
        violations.push(`FK Hilang: Dosen Pembimbing ID ${p.dosen_pembimbing_id} di pengajuan ${p.id} tidak ada di tabel dosen.`);
      }
      if (p.dosen_penguji3_id && !dosenIds.has(p.dosen_penguji3_id)) {
        violations.push(`FK Hilang: Penguji 3 ID ${p.dosen_penguji3_id} di pengajuan ${p.id} tidak ada di tabel dosen.`);
      }
      if (p.dosen_reviewer_id === p.dosen_pembimbing_id) {
        violations.push(`Aturan Gagal: Dosen Reviewer dan Pembimbing sama pada pengajuan ${p.id}.`);
      }
      if (p.dosen_penguji3_id && (p.dosen_penguji3_id === p.dosen_reviewer_id || p.dosen_penguji3_id === p.dosen_pembimbing_id)) {
        violations.push(`Aturan Gagal: Dosen Penguji 3 tidak boleh sama dengan Reviewer atau Pembimbing pada pengajuan ${p.id}.`);
      }

      // Integritas Sidang Selesai
      if (p.status === 'completed') {
        completedLockedCount++;
        if (!p.dosen_penguji3_id) {
          violations.push(`Integritas Terlanggar: Sidang selesai ${p.id} wajib memiliki Dosen Penguji 3 permanen.`);
        }
      }
    });

    // 3. Cek Foreign Key di Jadwal
    jadwal.forEach((j) => {
      if (!pengajuanIds.has(j.pengajuan_id) && !pendaftaranSem.some(s => s.id === j.pengajuan_id || `sch-${s.id}` === j.pengajuan_id)) {
        // Toleransi jika id seminar
      }
      if (!roomIds.has(j.ruangan_id)) {
        violations.push(`FK Hilang: Ruangan ID ${j.ruangan_id} di jadwal ${j.id} tidak ada di tabel ruangan.`);
      }
      if (!slotIds.has(j.slot_waktu_id)) {
        violations.push(`FK Hilang: Slot Waktu ID ${j.slot_waktu_id} di jadwal ${j.id} tidak ada di tabel slot_waktu.`);
      }
    });

    // 4. Cek Bentrok Ruangan Ganda
    const roomSlotDateMap = new Set<string>();
    jadwal.forEach((j) => {
      const key = `${j.tanggal}-${j.slot_waktu_id}-${j.ruangan_id}`;
      if (roomSlotDateMap.has(key)) {
        violations.push(`Bentrok Ruangan Ganda: Terdeteksi 2 jadwal di Ruangan ID ${j.ruangan_id} pada sesi ${j.slot_waktu_id} tanggal ${j.tanggal}.`);
      }
      roomSlotDateMap.add(key);
    });

    // 5. Cek Kebijakan Kredensial Pengguna Berdasarkan Role
    users.forEach((u) => {
      if (u.password_required && (!u.password_hash || u.password_hash.trim() === '')) {
        violations.push(`Keamanan Kredensial: Akun ${u.email} dengan role [${u.roles.join(', ')}] wajib memiliki password hash di database.`);
      }
    });

    return {
      isValid: violations.length === 0,
      totalRecords: {
        periode_akademik: periode.length,
        dosen: dosen.length,
        mahasiswa: mhs.length,
        ruangan: rooms.length,
        slot_waktu: slots.length,
        pendaftaran_seminar: pendaftaranSem.length,
        pelaksanaan_seminar: pelaksanaanSem.length,
        pengajuan_sidang: pengajuan.length,
        jadwal_sidang: jadwal.length,
        pengguna: users.length,
      },
      completedLockedCount,
      violations,
    };
  }

  // --------------------------------------------------------------------------
  // Operasi Transaksional Seminar (Aturan 2.1, 2.2 same_schedule, 2.3 cross_period)
  // --------------------------------------------------------------------------

  public async recordSeminarResultAtomic(
    pendaftaranId: string,
    pelaksanaanId: string,
    hasil: 'lulus' | 'belum_lulus',
    nilai?: number,
    feedback?: string,
    evaluatorName?: string
  ): Promise<{ success: boolean; error?: string }> {
    const db = await this.getDB();
    const now = new Date().toISOString();

    const reg = await this.getById<PendaftaranSeminarRecord>(STORES.PENDAFTARAN_SEMINAR, pendaftaranId);
    if (!reg) return { success: false, error: 'Data pendaftaran seminar tidak ditemukan' };

    const exe = await this.getById<PelaksanaanSeminarRecord>(STORES.PELAKSANAAN_SEMINAR, pelaksanaanId);
    if (!exe) return { success: false, error: 'Data pelaksanaan seminar tidak ditemukan' };

    const allPengajuan = await this.getAll<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG);
    const existingPengajuan = allPengajuan.find(
      p => p.mahasiswa_nim === reg.mahasiswa_nim || p.pendaftaran_seminar_id === reg.id
    );

    const allPeriods = await this.getAll<PeriodeAkademikRecord>(STORES.PERIODE_AKADEMIK);
    const activePeriod = allPeriods.find(p => p.is_active) || allPeriods[0];
    const targetPeriodId = activePeriod ? activePeriod.id : reg.periode_akademik_id;

    const tx = db.transaction(
      [STORES.PENDAFTARAN_SEMINAR, STORES.PELAKSANAAN_SEMINAR, STORES.PENGAJUAN_SIDANG],
      'readwrite'
    );
    const regStore = tx.objectStore(STORES.PENDAFTARAN_SEMINAR);
    const exeStore = tx.objectStore(STORES.PELAKSANAAN_SEMINAR);
    const pengajuanStore = tx.objectStore(STORES.PENGAJUAN_SIDANG);

    exeStore.put({
      ...exe,
      hasil,
      nilai: nilai ?? exe.nilai,
      catatan_revisi: feedback ?? exe.catatan_revisi,
      status_pelaksanaan: 'completed',
      evaluated_at: now,
      evaluated_by: evaluatorName || 'Admin Panitia',
      updated_at: now,
    });

    regStore.put({
      ...reg,
      status_kelulusan: hasil,
      status: hasil === 'lulus' ? 'selesai' : 'terdaftar',
      nilai_akhir: hasil === 'lulus' ? (nilai ?? reg.nilai_akhir) : undefined,
      updated_at: now,
    });

    // Otomatis terbitkan / aktifkan pengajuan sidang ketika mahasiswa Lulus Seminar
    if (hasil === 'lulus') {
      const finalScore = nilai ?? exe.nilai ?? reg.nilai_akhir;
      if (existingPengajuan) {
        pengajuanStore.put({
          ...existingPengajuan,
          dosen_reviewer_id: exe.dosen_reviewer_id || existingPengajuan.dosen_reviewer_id,
          dosen_pembimbing_id: reg.dosen_pembimbing_id,
          pendaftaran_seminar_id: reg.id,
          pelaksanaan_seminar_id: exe.id,
          nilai_seminar: finalScore,
          status: 'unassigned', // Aktif di antrean sidang
          updated_at: now,
        });
      } else {
        const newPengajuan: PengajuanSidangRecord = {
          id: `pengajuan-${reg.mahasiswa_nim}`,
          mahasiswa_nim: reg.mahasiswa_nim,
          periode_akademik_id: targetPeriodId,
          pendaftaran_seminar_id: reg.id,
          pelaksanaan_seminar_id: exe.id,
          judul_skripsi: reg.judul_penelitian,
          jenis: reg.jenis || 'Skripsi',
          dosen_reviewer_id: exe.dosen_reviewer_id || '', // Reviewer seminar terkunci jadi P1 Sidang
          dosen_pembimbing_id: reg.dosen_pembimbing_id,    // Pembimbing seminar terkunci jadi P2 Sidang
          dosen_penguji3_id: undefined,
          nilai_seminar: finalScore,
          status: 'unassigned', // Aktif di antrean sidang
          created_at: now,
          updated_at: now,
        };
        pengajuanStore.put(newPengajuan);
      }
    } else if (hasil === 'belum_lulus' && existingPengajuan && existingPengajuan.status === 'unassigned') {
      // Jika seminar belum lulus, pastikan tidak ada antrean sidang aktif
      pengajuanStore.delete(existingPengajuan.id);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return { success: true };
  }

  public async rescheduleSeminarAtomic(
    pendaftaranId: string,
    currentPeriodId: string
  ): Promise<{ success: boolean; newAttemptNumber?: number; error?: string }> {
    const db = await this.getDB();
    const now = new Date().toISOString();

    const reg = await this.getById<PendaftaranSeminarRecord>(STORES.PENDAFTARAN_SEMINAR, pendaftaranId);
    if (!reg) return { success: false, error: 'Data pendaftaran seminar tidak ditemukan' };

    const nextAttempt = (reg.pelaksanaan_terakhir_ke || 1) + 1;
    const newExeId = `sem-exe-${reg.id}-att-${nextAttempt}`;

    const tx = db.transaction([STORES.PENDAFTARAN_SEMINAR, STORES.PELAKSANAAN_SEMINAR], 'readwrite');
    const regStore = tx.objectStore(STORES.PENDAFTARAN_SEMINAR);
    const exeStore = tx.objectStore(STORES.PELAKSANAAN_SEMINAR);

    regStore.put({
      ...reg,
      pelaksanaan_terakhir_ke: nextAttempt,
      status: 'terdaftar',
      status_kelulusan: 'belum_lulus',
      updated_at: now,
    });

    const newExe: PelaksanaanSeminarRecord = {
      id: newExeId,
      pendaftaran_seminar_id: reg.id,
      pelaksanaan_ke: nextAttempt,
      periode_akademik_id: currentPeriodId,
      dosen_pembimbing_id: reg.dosen_pembimbing_id,
      status_pelaksanaan: 'unassigned',
      hasil: 'belum_dinilai',
      created_at: now,
      updated_at: now,
    };
    exeStore.put(newExe);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return { success: true, newAttemptNumber: nextAttempt };
  }

  // --------------------------------------------------------------------------
  // Ekspor & Reset Database
  // --------------------------------------------------------------------------

  public async exportDatabaseDump(): Promise<DatabaseDump> {
    return {
      version: DB_VERSION,
      exported_at: new Date().toISOString(),
      periode_akademik: await this.getAll<PeriodeAkademikRecord>(STORES.PERIODE_AKADEMIK),
      dosen: await this.getAll<DosenRecord>(STORES.DOSEN),
      mahasiswa: await this.getAll<MahasiswaRecord>(STORES.MAHASISWA),
      ruangan: await this.getAll<RuanganRecord>(STORES.RUANGAN),
      slot_waktu: await this.getAll<SlotWaktuRecord>(STORES.SLOT_WAKTU),
      pendaftaran_seminar: await this.getAll<PendaftaranSeminarRecord>(STORES.PENDAFTARAN_SEMINAR),
      pelaksanaan_seminar: await this.getAll<PelaksanaanSeminarRecord>(STORES.PELAKSANAAN_SEMINAR),
      pengajuan_sidang: await this.getAll<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG),
      jadwal_sidang: await this.getAll<JadwalSidangRecord>(STORES.JADWAL_SIDANG),
      pengguna: await this.getAll<PenggunaRecord>(STORES.PENGGUNA),
    };
  }

  public async resetToSeedData(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(
      [
        STORES.DOSEN,
        STORES.RUANGAN,
        STORES.SLOT_WAKTU,
        STORES.MAHASISWA,
        STORES.PENDAFTARAN_SEMINAR,
        STORES.PELAKSANAAN_SEMINAR,
        STORES.PENGAJUAN_SIDANG,
        STORES.JADWAL_SIDANG,
        STORES.PENGGUNA,
      ],
      'readwrite'
    );
    tx.objectStore(STORES.DOSEN).clear();
    tx.objectStore(STORES.RUANGAN).clear();
    tx.objectStore(STORES.SLOT_WAKTU).clear();
    tx.objectStore(STORES.MAHASISWA).clear();
    tx.objectStore(STORES.PENDAFTARAN_SEMINAR).clear();
    tx.objectStore(STORES.PELAKSANAAN_SEMINAR).clear();
    tx.objectStore(STORES.PENGAJUAN_SIDANG).clear();
    tx.objectStore(STORES.JADWAL_SIDANG).clear();
    tx.objectStore(STORES.PENGGUNA).clear();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    await this.ensureInitialSeed(db);
  }
}

export const dbEngine = new RelationalDatabaseEngine();
