/**
 * SISTEM INFORMASI MANAJEMEN SIDANG SKRIPSI (SIM-SIDANG)
 * Repository Relasional: Pemetaan Model UI ke Database Records
 */

import { dbEngine, STORES } from './indexedDB';
import {
  DosenRecord,
  MahasiswaRecord,
  RuanganRecord,
  SlotWaktuRecord,
  PengajuanSidangRecord,
  JadwalSidangRecord,
  PenggunaRecord,
  PeriodeAkademikRecord,
  PendaftaranSeminarRecord,
  PelaksanaanSeminarRecord,
} from './types';
import { Lecturer, Room, TimeSlot, ScheduleItem, AcademicPeriod, SeminarHistoryItem } from '../types';

export class ScheduleDatabaseRepository {
  /**
   * Mengambil semua Dosen dari database
   */
  public async getLecturers(): Promise<Lecturer[]> {
    const records = await dbEngine.getAll<DosenRecord>(STORES.DOSEN);
    return records.map((d) => ({
      id: d.id,
      name: d.nama,
      nidn: d.nidn,
      department: d.program_studi,
      email: d.email,
      code: d.kode,
      photoUrl: d.foto_url,
    }));
  }

  /**
   * Menyimpan / memperbarui Dosen
   */
  public async saveLecturer(lecturer: Lecturer): Promise<void> {
    const existing = await dbEngine.getById<DosenRecord>(STORES.DOSEN, lecturer.id);
    const now = new Date().toISOString();
    const record: DosenRecord = {
      id: lecturer.id,
      nama: lecturer.name,
      nidn: lecturer.nidn,
      program_studi: lecturer.department,
      email: lecturer.email,
      kode: lecturer.code,
      foto_url: lecturer.photoUrl,
      is_active: existing ? existing.is_active : true,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
    };
    await dbEngine.put(STORES.DOSEN, record);
  }

  /**
   * Menghapus Dosen dan akun pengguna terkait
   */
  public async deleteLecturer(id: string): Promise<void> {
    await dbEngine.delete(STORES.DOSEN, id);
    try {
      const allUsers = await dbEngine.getAll<PenggunaRecord>(STORES.PENGGUNA);
      const user = allUsers.find((u) => u.lecturer_id === id);
      if (user) {
        await dbEngine.delete(STORES.PENGGUNA, user.id);
      }
    } catch (e) {
      console.warn('Could not clean user for deleted lecturer', e);
    }
  }

  /**
   * Mengambil semua Ruangan dari database
   */
  public async getRooms(): Promise<Room[]> {
    const records = await dbEngine.getAll<RuanganRecord>(STORES.RUANGAN);
    return records.map((r) => ({
      id: r.id,
      name: r.nama,
      building: r.gedung,
      floor: r.lantai,
      capacity: r.kapasitas,
    }));
  }

  /**
   * Menyimpan / memperbarui Ruangan
   */
  public async saveRoom(room: Room): Promise<void> {
    const existing = await dbEngine.getById<RuanganRecord>(STORES.RUANGAN, room.id);
    const now = new Date().toISOString();
    const record: RuanganRecord = {
      id: room.id,
      nama: room.name,
      gedung: room.building,
      lantai: room.floor,
      kapasitas: room.capacity,
      is_active: existing ? existing.is_active : true,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
    };
    await dbEngine.put(STORES.RUANGAN, record);
  }

  /**
   * Menghapus Ruangan
   */
  public async deleteRoom(id: string): Promise<void> {
    await dbEngine.delete(STORES.RUANGAN, id);
  }

  /**
   * Mengambil semua Slot Waktu dari database
   */
  public async getTimeSlots(): Promise<TimeSlot[]> {
    const records = await dbEngine.getAll<SlotWaktuRecord>(STORES.SLOT_WAKTU);
    return records
      .sort((a, b) => a.urutan - b.urutan)
      .map((s) => ({
        id: s.id,
        startTime: s.jam_mulai,
        endTime: s.jam_selesai,
        label: s.label,
      }));
  }

  /**
   * Menyimpan / memperbarui Slot Waktu
   */
  public async saveTimeSlot(slot: TimeSlot, urutan = 1): Promise<void> {
    const existing = await dbEngine.getById<SlotWaktuRecord>(STORES.SLOT_WAKTU, slot.id);
    const now = new Date().toISOString();
    const record: SlotWaktuRecord = {
      id: slot.id,
      jam_mulai: slot.startTime,
      jam_selesai: slot.endTime,
      label: slot.label,
      urutan: existing ? existing.urutan : urutan,
      is_active: existing ? existing.is_active : true,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
    };
    await dbEngine.put(STORES.SLOT_WAKTU, record);
  }

  /**
   * Menghapus Slot Waktu
   */
  public async deleteTimeSlot(id: string): Promise<void> {
    await dbEngine.delete(STORES.SLOT_WAKTU, id);
  }

  /**
   * Mengambil seluruh Jadwal Terpadu (Join Relasional Seminar dan Sidang)
   * Mengimplementasikan Aturan Bisnis Section 3: Satu Papan Jadwal Terintegrasi
   */
  public async getScheduleItems(): Promise<ScheduleItem[]> {
    const mhs = await dbEngine.getAll<MahasiswaRecord>(STORES.MAHASISWA);
    const pengajuan = await dbEngine.getAll<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG);
    const jadwal = await dbEngine.getAll<JadwalSidangRecord>(STORES.JADWAL_SIDANG);
    const dosen = await dbEngine.getAll<DosenRecord>(STORES.DOSEN);
    const pendaftaranSem = await dbEngine.getAll<PendaftaranSeminarRecord>(STORES.PENDAFTARAN_SEMINAR);
    const pelaksanaanSem = await dbEngine.getAll<PelaksanaanSeminarRecord>(STORES.PELAKSANAAN_SEMINAR);
    const periode = await dbEngine.getAll<PeriodeAkademikRecord>(STORES.PERIODE_AKADEMIK);

    const mhsMap = new Map<string, MahasiswaRecord>(mhs.map((m) => [m.nim, m]));
    const jadwalMap = new Map<string, JadwalSidangRecord>(jadwal.map((j) => [j.pengajuan_id, j]));
    const dosenMap = new Map<string, DosenRecord>(dosen.map((d) => [d.id, d]));
    const periodeMap = new Map<string, PeriodeAkademikRecord>(periode.map((p) => [p.id, p]));

    const items: ScheduleItem[] = [];

    // 1. Petakan Sidang Skripsi
    pengajuan.forEach((p) => {
      const student = mhsMap.get(p.mahasiswa_nim);
      const jdw = jadwalMap.get(p.id);
      const rev = dosenMap.get(p.dosen_reviewer_id);
      const adv = dosenMap.get(p.dosen_pembimbing_id);
      const prd = periodeMap.get(p.periode_akademik_id);

      items.push({
        id: p.id,
        activityType: 'sidang',
        nim: p.mahasiswa_nim,
        studentName: student ? student.nama : p.mahasiswa_nim,
        studyProgram: student ? student.program_studi : 'Teknik Informatika',
        academicYear: prd ? `${prd.tahun_akademik} ${prd.semester}` : (student ? student.tahun_akademik : '2025/2026 Genap'),
        academicPeriodId: p.periode_akademik_id,
        thesisTitle: p.judul_skripsi,
        thesisType: p.jenis,
        reviewerName: rev ? rev.nama : undefined,
        advisorName: adv ? adv.nama : undefined,
        seminarScore: p.nilai_seminar,
        isSeminarPassed: true,
        examiner1Id: p.dosen_reviewer_id,
        examiner2Id: p.dosen_pembimbing_id,
        examiner3Id: p.dosen_penguji3_id || '',
        date: jdw ? jdw.tanggal : '2025-08-02',
        timeSlotId: jdw ? jdw.slot_waktu_id : null,
        roomId: jdw ? jdw.ruangan_id : null,
        status: (p.status === 'cancelled' ? 'unassigned' : p.status) as 'unassigned' | 'scheduled' | 'completed',
        notes: p.catatan,
      });
    });

    // 2. Petakan Seminar Proposal/Kemajuan (same_schedule & cross_period)
    pendaftaranSem.forEach((reg) => {
      const student = mhsMap.get(reg.mahasiswa_nim);
      const adv = dosenMap.get(reg.dosen_pembimbing_id);

      const executions = pelaksanaanSem
        .filter((e) => e.pendaftaran_seminar_id === reg.id)
        .sort((a, b) => a.pelaksanaan_ke - b.pelaksanaan_ke);

      const latestExe = executions[executions.length - 1];
      const previousExes = executions.slice(0, -1);

      const rev = latestExe?.dosen_reviewer_id ? dosenMap.get(latestExe.dosen_reviewer_id) : undefined;
      const exePrd = latestExe?.periode_akademik_id ? periodeMap.get(latestExe.periode_akademik_id) : undefined;

      const seminarHistory: SeminarHistoryItem[] = previousExes.map((pe) => {
        const peRev = pe.dosen_reviewer_id ? dosenMap.get(pe.dosen_reviewer_id) : undefined;
        const peAdv = dosenMap.get(pe.dosen_pembimbing_id);
        const pePrd = periodeMap.get(pe.periode_akademik_id);
        return {
          attemptNumber: pe.pelaksanaan_ke,
          date: pe.tanggal || '-',
          timeSlotId: pe.slot_waktu_id || null,
          roomId: pe.ruangan_id || null,
          reviewerId: pe.dosen_reviewer_id || '',
          reviewerName: peRev ? peRev.nama : 'Belum Ditentukan',
          advisorId: pe.dosen_pembimbing_id,
          advisorName: peAdv ? peAdv.nama : '-',
          score: pe.nilai,
          result: pe.hasil,
          feedback: pe.catatan_revisi,
          evaluatedAt: pe.evaluated_at,
          evaluatedBy: pe.evaluated_by,
          academicPeriodId: pe.periode_akademik_id,
          academicYear: pePrd ? `${pePrd.tahun_akademik} ${pePrd.semester}` : '-',
        };
      });

      items.push({
        id: `sem-${reg.id}`,
        activityType: 'seminar',
        seminarRegistrationId: reg.id,
        attemptNumber: latestExe ? latestExe.pelaksanaan_ke : 1,
        seminarStatus: reg.status,
        seminarResult: latestExe ? latestExe.hasil : 'belum_dinilai',
        seminarHistory,
        isSeminarPassed: reg.status_kelulusan === 'lulus',
        nim: reg.mahasiswa_nim,
        studentName: student ? student.nama : reg.mahasiswa_nim,
        studyProgram: student ? student.program_studi : 'Teknik Informatika',
        academicYear: exePrd ? `${exePrd.tahun_akademik} ${exePrd.semester}` : (student ? student.tahun_akademik : '2025/2026 Genap'),
        academicPeriodId: latestExe ? latestExe.periode_akademik_id : reg.periode_akademik_id,
        thesisTitle: reg.judul_penelitian,
        thesisType: reg.jenis,
        reviewerName: rev ? rev.nama : undefined,
        advisorName: adv ? adv.nama : undefined,
        seminarScore: latestExe ? latestExe.nilai : reg.nilai_akhir,
        examiner1Id: latestExe?.dosen_reviewer_id || '',
        examiner2Id: reg.dosen_pembimbing_id,
        examiner3Id: '',
        date: latestExe?.tanggal || '2025-08-02',
        timeSlotId: latestExe?.slot_waktu_id || null,
        roomId: latestExe?.ruangan_id || null,
        status: (latestExe?.status_pelaksanaan === 'cancelled' ? 'unassigned' : (latestExe?.status_pelaksanaan || 'unassigned')) as 'unassigned' | 'scheduled' | 'completed',
        notes: latestExe?.catatan_revisi,
      });
    });

    return items;
  }

  /**
   * Menyimpan / memperbarui Pengajuan Mahasiswa dan Mahasiswa
   */
  public async saveStudentAndProposal(
    student: {
      nim: string;
      name: string;
      studyProgram: string;
      academicYear: string;
      academicPeriodId?: string;
      thesisTitle: string;
      thesisType?: string;
      examiner1Id: string;
      examiner2Id: string;
      examiner3Id?: string;
      seminarScore?: string | number;
      notes?: string;
    },
    proposalId?: string
  ): Promise<string> {
    const now = new Date().toISOString();
    const pid = proposalId || `sch-${Date.now().toString(36)}`;

    // 1. Simpan ke tabel Mahasiswa
    const mhsRecord: MahasiswaRecord = {
      nim: student.nim,
      nama: student.name,
      program_studi: student.studyProgram,
      tahun_akademik: student.academicYear,
      created_at: now,
      updated_at: now,
    };
    await dbEngine.put(STORES.MAHASISWA, mhsRecord);

    // 2. Simpan ke tabel Pengajuan Sidang
    const pengajuanRecord: PengajuanSidangRecord = {
      id: pid,
      mahasiswa_nim: student.nim,
      periode_akademik_id: student.academicPeriodId || 'prd-2025-genap',
      judul_skripsi: student.thesisTitle,
      jenis: (student.thesisType === 'Tugas Akhir' ? 'Tugas Akhir' : 'Skripsi'),
      dosen_reviewer_id: student.examiner1Id,
      dosen_pembimbing_id: student.examiner2Id,
      dosen_penguji3_id: student.examiner3Id || undefined,
      nilai_seminar: typeof student.seminarScore === 'number' ? student.seminarScore : Number(student.seminarScore) || undefined,
      status: 'unassigned',
      catatan: student.notes,
      created_at: now,
      updated_at: now,
    };
    await dbEngine.put(STORES.PENGAJUAN_SIDANG, pengajuanRecord);

    return pid;
  }

  /**
   * Memperbarui Penguji 3 pada pengajuan sidang (Hanya jika belum selesai)
   */
  public async updateExaminer3(pengajuanId: string, examiner3Id: string): Promise<void> {
    const p = await dbEngine.getById<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG, pengajuanId);
    if (!p) return;
    if (p.status === 'completed') {
      throw new Error('Data sidang telah berstatus selesai dan terkunci permanen. Penguji 3 tidak dapat diubah kembali.');
    }
    await dbEngine.put(STORES.PENGAJUAN_SIDANG, {
      ...p,
      dosen_penguji3_id: examiner3Id,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Menjadwalkan pengajuan dengan validasi integritas basis data
   */
  public async assignSchedule(
    pengajuanId: string,
    tanggal: string,
    slotWaktuId: string,
    ruanganId: string
  ): Promise<{ success: boolean; error?: string }> {
    return await dbEngine.assignScheduleAtomic(pengajuanId, tanggal, slotWaktuId, ruanganId);
  }

  /**
   * Membatalkan jadwal
   */
  public async unassignSchedule(pengajuanId: string): Promise<void> {
    await dbEngine.unassignScheduleAtomic(pengajuanId);
  }

  /**
   * Menghapus data mahasiswa dan pengajuan sidang
   */
  public async deleteStudent(pengajuanId: string, nim?: string): Promise<void> {
    await dbEngine.deleteStudentAtomic(pengajuanId, nim);
  }

  /**
   * Menghapus sejumlah data mahasiswa secara massal
   */
  public async deleteStudentsBulk(items: Array<{ id: string; nim: string }>): Promise<void> {
    await dbEngine.deleteStudentsBulkAtomic(items);
  }

  /**
   * Menyatakan sidang selesai dan mengunci permanen Penguji 3 di database
   */
  public async completeSchedule(pengajuanId: string): Promise<{ success: boolean; error?: string }> {
    return await dbEngine.completeScheduleAtomic(pengajuanId);
  }

  /**
   * Membuka kembali status sidang (Admin Only)
   */
  public async reopenSchedule(pengajuanId: string): Promise<{ success: boolean; error?: string }> {
    return await dbEngine.reopenScheduleAtomic(pengajuanId);
  }

  /**
   * Mengambil semua akun pengguna sistem
   */
  public async getUsers(): Promise<PenggunaRecord[]> {
    return await dbEngine.getAll<PenggunaRecord>(STORES.PENGGUNA);
  }

  /**
   * Menyimpan / memperbarui akun pengguna
   */
  public async saveUser(user: PenggunaRecord): Promise<void> {
    await dbEngine.put(STORES.PENGGUNA, user);
  }

  /**
   * Menghapus akun pengguna
   */
  public async deleteUser(id: string): Promise<void> {
    await dbEngine.delete(STORES.PENGGUNA, id);
  }

  // --------------------------------------------------------------------------
  // Tata Kelola Periode Akademik (Active Academic Period Control)
  // --------------------------------------------------------------------------

  /**
   * Mengambil semua periode akademik dari database
   */
  public async getAcademicPeriods(): Promise<AcademicPeriod[]> {
    const records = await dbEngine.getAll<PeriodeAkademikRecord>(STORES.PERIODE_AKADEMIK);
    return records.map((p) => ({
      id: p.id,
      academicYear: p.tahun_akademik,
      semester: p.semester,
      startDate: p.tanggal_mulai,
      endDate: p.tanggal_selesai,
      isActive: p.is_active,
      status: p.status,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  }

  /**
   * Menyimpan / memperbarui periode akademik
   */
  public async saveAcademicPeriod(period: AcademicPeriod): Promise<void> {
    const record: PeriodeAkademikRecord = {
      id: period.id,
      tahun_akademik: period.academicYear,
      semester: period.semester,
      tanggal_mulai: period.startDate,
      tanggal_selesai: period.endDate,
      is_active: period.isActive,
      status: period.status,
      created_at: period.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await dbEngine.put(STORES.PERIODE_AKADEMIK, record);
  }

  /**
   * Menghapus periode akademik (hanya jika belum memiliki pengajuan sidang)
   */
  public async deleteAcademicPeriod(id: string): Promise<{ success: boolean; error?: string }> {
    const allPengajuan = await dbEngine.getAll<PengajuanSidangRecord>(STORES.PENGAJUAN_SIDANG);
    const hasData = allPengajuan.some((p) => p.periode_akademik_id === id);
    if (hasData) {
      return {
        success: false,
        error: 'Integritas Terjaga: Periode akademik tidak dapat dihapus karena telah memiliki data pengajuan sidang.',
      };
    }
    await dbEngine.delete(STORES.PERIODE_AKADEMIK, id);
    return { success: true };
  }

  /**
   * Mengaktifkan periode secara transaksional
   */
  public async setActiveAcademicPeriodAtomic(targetPeriodId: string): Promise<void> {
    const db = await dbEngine.getDB();
    const all = await dbEngine.getAll<PeriodeAkademikRecord>(STORES.PERIODE_AKADEMIK);
    const now = new Date().toISOString();

    const tx = db.transaction([STORES.PERIODE_AKADEMIK], 'readwrite');
    const store = tx.objectStore(STORES.PERIODE_AKADEMIK);

    for (const p of all) {
      if (p.id === targetPeriodId) {
        store.put({
          ...p,
          is_active: true,
          status: 'berjalan',
          updated_at: now,
        });
      } else if (p.is_active) {
        store.put({
          ...p,
          is_active: false,
          updated_at: now,
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --------------------------------------------------------------------------
  // Tata Kelola Seminar (Aturan Bisnis 2.1 - 2.4)
  // --------------------------------------------------------------------------

  /**
   * Validasi kelayakan mengikuti Sidang (Syarat Wajib Sidang Lulus)
   * Mengembalikan reviewer seminar dan pembimbing seminar untuk mengunci P1 dan P2
   */
  public async validateSidangEligibility(studentNim: string): Promise<{
    eligible: boolean;
    reason?: string;
    reviewerId?: string;
    reviewerName?: string;
    advisorId?: string;
    advisorName?: string;
    seminarScore?: number;
    pendaftaranId?: string;
  }> {
    const pendaftaran = await dbEngine.getAll<PendaftaranSeminarRecord>(STORES.PENDAFTARAN_SEMINAR);
    const reg = pendaftaran.find((p) => p.mahasiswa_nim === studentNim);

    if (!reg) {
      return {
        eligible: false,
        reason: `Mahasiswa dengan NIM ${studentNim} belum memiliki pendaftaran Seminar. Seminar merupakan tahapan akademik wajib sebelum Sidang Skripsi.`,
      };
    }

    if (reg.status_kelulusan !== 'lulus') {
      return {
        eligible: false,
        reason: `Mahasiswa dengan NIM ${studentNim} belum dinyatakan Lulus Seminar (Status saat ini: ${reg.status_kelulusan === 'belum_lulus' ? 'Belum Lulus' : 'Belum Seminar'}). Hanya mahasiswa yang telah Lulus Seminar yang dapat dijadwalkan untuk Sidang Skripsi.`,
      };
    }

    // Ambil detail reviewer dari pelaksanaan seminar yang lulus
    const pelaksanaan = await dbEngine.getAll<PelaksanaanSeminarRecord>(STORES.PELAKSANAAN_SEMINAR);
    const passedExe = pelaksanaan
      .filter((e) => e.pendaftaran_seminar_id === reg.id && e.hasil === 'lulus')
      .sort((a, b) => b.pelaksanaan_ke - a.pelaksanaan_ke)[0];

    const dosenList = await dbEngine.getAll<DosenRecord>(STORES.DOSEN);
    const dosenMap = new Map<string, DosenRecord>(dosenList.map((d) => [d.id, d]));

    const rev = passedExe?.dosen_reviewer_id ? dosenMap.get(passedExe.dosen_reviewer_id) : undefined;
    const adv = dosenMap.get(reg.dosen_pembimbing_id);

    return {
      eligible: true,
      reviewerId: passedExe?.dosen_reviewer_id,
      reviewerName: rev ? rev.nama : undefined,
      advisorId: reg.dosen_pembimbing_id,
      advisorName: adv ? adv.nama : undefined,
      seminarScore: reg.nilai_akhir || passedExe?.nilai,
      pendaftaranId: reg.id,
    };
  }

  /**
   * Menetapkan atau memperbarui Dosen Reviewer pada seminar
   */
  public async assignSeminarReviewer(seminarRegistrationId: string, reviewerId: string): Promise<void> {
    const pelaksanaan = await dbEngine.getAll<PelaksanaanSeminarRecord>(STORES.PELAKSANAAN_SEMINAR);
    const executions = pelaksanaan
      .filter((e) => e.pendaftaran_seminar_id === seminarRegistrationId)
      .sort((a, b) => a.pelaksanaan_ke - b.pelaksanaan_ke);

    const latest = executions[executions.length - 1];
    if (!latest) return;

    await dbEngine.put(STORES.PELAKSANAAN_SEMINAR, {
      ...latest,
      dosen_reviewer_id: reviewerId,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Mencatat hasil seminar (Lulus vs Belum Lulus)
   */
  public async recordSeminarResult(
    pendaftaranId: string,
    result: 'lulus' | 'belum_lulus',
    score?: number,
    feedback?: string
  ): Promise<{ success: boolean; error?: string }> {
    const pelaksanaan = await dbEngine.getAll<PelaksanaanSeminarRecord>(STORES.PELAKSANAAN_SEMINAR);
    const executions = pelaksanaan
      .filter((e) => e.pendaftaran_seminar_id === pendaftaranId)
      .sort((a, b) => a.pelaksanaan_ke - b.pelaksanaan_ke);

    const latest = executions[executions.length - 1];
    if (!latest) return { success: false, error: 'Pelaksanaan seminar tidak ditemukan' };

    return await dbEngine.recordSeminarResultAtomic(pendaftaranId, latest.id, result, score, feedback);
  }

  /**
   * Menjadwalkan ulang seminar yang belum lulus (same_schedule)
   */
  public async rescheduleSeminar(
    pendaftaranId: string,
    currentPeriodId: string
  ): Promise<{ success: boolean; newAttemptNumber?: number; error?: string }> {
    return await dbEngine.rescheduleSeminarAtomic(pendaftaranId, currentPeriodId);
  }
}

export const dbRepository = new ScheduleDatabaseRepository();
