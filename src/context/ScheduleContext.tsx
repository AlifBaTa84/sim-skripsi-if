import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  UserRole, 
  ScheduleItem, 
  Room, 
  TimeSlot, 
  Lecturer, 
  ConflictCheckResult,
  ImportedStudentRow,
  AcademicPeriod
} from '../types';
import { 
  INITIAL_ROOMS, 
  INITIAL_TIME_SLOTS, 
  INITIAL_LECTURERS, 
  INITIAL_SCHEDULE_ITEMS, 
  INITIAL_ACADEMIC_PERIODS,
  AVAILABLE_DATES 
} from '../data/mockData';
import { checkScheduleConflict, findAvailableSlotsForStudent } from '../utils/conflictChecker';
import { getEligibleExaminer3Candidates } from '../utils/importer';
import confetti from 'canvas-confetti';
import { dbRepository } from '../db/repository';
import { dbEngine } from '../db/indexedDB';
import { useAuth } from './AuthContext';
import { autoProvisionLecturer, autoProvisionStudent, autoProvisionBulkStudents } from '../utils/accountProvisioner';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface ScheduleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  schedules: ScheduleItem[];
  rooms: Room[];
  timeSlots: TimeSlot[];
  lecturers: Lecturer[];
  
  // Specific user context
  currentStudentNim: string;
  setCurrentStudentNim: (nim: string) => void;
  currentLecturerId: string;
  setCurrentLecturerId: (id: string) => void;
  
  // Drag and drop state tracking
  activeDragItem: ScheduleItem | null;
  setActiveDragItem: (item: ScheduleItem | null) => void;
  hoveredCell: { timeSlotId: string; roomId: string } | null;
  setHoveredCell: (cell: { timeSlotId: string; roomId: string } | null) => void;
  currentDragValidation: ConflictCheckResult | null;
  
  // Core scheduling operations
  assignSchedule: (itemId: string, targetDate: string, timeSlotId: string, roomId: string) => { success: boolean; reasons?: string[] };
  unassignSchedule: (itemId: string) => void;
  addNewStudentToQueue: (student: Omit<ScheduleItem, 'id' | 'status' | 'timeSlotId' | 'roomId'>) => void;
  importStudentsFromData: (importedRows: ImportedStudentRow[], defaultDate?: string) => { 
    successCount: number; 
    duplicateCount: number; 
    failedCount: number; 
    error?: string; 
  };
  assignExaminer3: (scheduleId: string, examiner3Id: string) => void;
  completeSchedule: (scheduleId: string) => void;
  reopenSchedule: (scheduleId: string) => void;
  autoAssignExaminer3ForQueue: () => number;
  autoScheduleQueue: () => { scheduledCount: number; unassignedRemaining: number };
  resetData: () => void;

  // Academic Period Management (Active Period Concept)
  academicPeriods: AcademicPeriod[];
  activePeriod: AcademicPeriod | null;
  selectedPeriodId: string;
  setSelectedPeriodId: (id: string) => void;
  addAcademicPeriod: (period: Omit<AcademicPeriod, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string };
  updateAcademicPeriod: (id: string, updates: Partial<AcademicPeriod>) => { success: boolean; error?: string };
  activateAcademicPeriod: (targetPeriodId: string, force?: boolean) => {
    success: boolean;
    hasUnfinishedActivities?: boolean;
    unfinishedCount?: number;
    previousPeriodName?: string;
    error?: string;
  };
  closeAcademicPeriod: (periodId: string) => { success: boolean; error?: string };
  deleteAcademicPeriod: (id: string) => { success: boolean; error?: string };

  // Room Management (CRUD)
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;

  // TimeSlot Management (CRUD)
  addTimeSlot: (slot: Omit<TimeSlot, 'id'>) => void;
  updateTimeSlot: (id: string, updates: Partial<TimeSlot>) => void;
  deleteTimeSlot: (id: string) => void;

  // Lecturer Management (CRUD)
  addLecturer: (lecturer: Omit<Lecturer, 'id'>) => void;
  updateLecturer: (id: string, updates: Partial<Lecturer>) => void;
  deleteLecturer: (id: string) => { success: boolean; message?: string };

  // Student Management (CRUD)
  deleteStudent: (id: string) => { success: boolean; message?: string };
  deleteStudentsBulk: (ids: string[]) => { success: boolean; count: number };
  
  // Dynamic Dates with Matrix Agenda
  scheduledDates: string[];
  matrixCardCountsByDate: Record<string, number>;

  // Toasts
  toasts: Toast[];
  addToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
}

export const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const STORAGE_KEY = 'sim_sidang_schedules_v2';
const ROOMS_STORAGE_KEY = 'sim_sidang_rooms_v2';
const SLOTS_STORAGE_KEY = 'sim_sidang_slots_v2';
const LECTURERS_STORAGE_KEY = 'sim_sidang_lecturers_v2';
const ACADEMIC_PERIODS_STORAGE_KEY = 'sim_sidang_academic_periods_v2';

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, switchActiveRole } = useAuth();
  const [role, setRoleState] = useState<UserRole>(() => currentUser?.activeRole || 'admin');
  const [selectedDate, setSelectedDate] = useState<string>(AVAILABLE_DATES[0].value);
  
  // Academic Periods state with persistence
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>(() => {
    try {
      const saved = localStorage.getItem(ACADEMIC_PERIODS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load academic periods from localStorage', e);
    }
    return INITIAL_ACADEMIC_PERIODS;
  });

  const activePeriod = useMemo(() => {
    return academicPeriods.find(p => p.isActive) || null;
  }, [academicPeriods]);

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const active = INITIAL_ACADEMIC_PERIODS.find(p => p.isActive);
    return active ? active.id : (INITIAL_ACADEMIC_PERIODS[0]?.id || '');
  });

  // Keep selectedPeriodId valid if deleted or changed
  useEffect(() => {
    if (activePeriod && !academicPeriods.some(p => p.id === selectedPeriodId)) {
      setSelectedPeriodId(activePeriod.id);
    }
  }, [activePeriod, academicPeriods, selectedPeriodId]);

  useEffect(() => {
    try {
      localStorage.setItem(ACADEMIC_PERIODS_STORAGE_KEY, JSON.stringify(academicPeriods));
    } catch (e) {
      console.error('Failed to save academic periods to localStorage', e);
    }
  }, [academicPeriods]);

  // Lecturers state with persistence
  const [lecturers, setLecturers] = useState<Lecturer[]>(() => {
    try {
      const saved = localStorage.getItem(LECTURERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load lecturers from localStorage', e);
    }
    return INITIAL_LECTURERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LECTURERS_STORAGE_KEY, JSON.stringify(lecturers));
    } catch (e) {
      console.error('Failed to save lecturers to localStorage', e);
    }
  }, [lecturers]);

  // Sync role and identity with currentUser session
  useEffect(() => {
    if (currentUser) {
      setRoleState(currentUser.activeRole);
      if (currentUser.lecturerId) {
        setCurrentLecturerId(currentUser.lecturerId);
      }
      if (currentUser.studentNim) {
        setCurrentStudentNim(currentUser.studentNim);
      }
    }
  }, [currentUser]);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    if (currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes(newRole)) {
      switchActiveRole(newRole);
    }
  }, [currentUser, switchActiveRole]);

  // Rooms state with persistence
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem(ROOMS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load rooms from localStorage', e);
    }
    return INITIAL_ROOMS;
  });

  // TimeSlots state with persistence
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    try {
      const saved = localStorage.getItem(SLOTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load timeSlots from localStorage', e);
    }
    return INITIAL_TIME_SLOTS;
  });
  
  // Current logged in simulation
  const [currentStudentNim, setCurrentStudentNim] = useState<string>('10120262'); // Default: Shania Nur Luthfia
  const [currentLecturerId, setCurrentLecturerId] = useState<string>('lec-1');   // Default: Dian Dharmayanti

  // Schedules state with localStorage persistence
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load schedules from localStorage', e);
    }
    return INITIAL_SCHEDULE_ITEMS;
  });

  // Drag and Drop active states
  const [activeDragItem, setActiveDragItem] = useState<ScheduleItem | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ timeSlotId: string; roomId: string } | null>(null);
  const [currentDragValidation, setCurrentDragValidation] = useState<ConflictCheckResult | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Save to localStorage & Relational Database (IndexedDB)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [schedules]);

  useEffect(() => {
    try {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
      rooms.forEach((r) => dbRepository.saveRoom(r).catch(() => {}));
    } catch (e) {
      console.error('Failed to save rooms to localStorage', e);
    }
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(timeSlots));
      timeSlots.forEach((s, idx) => dbRepository.saveTimeSlot(s, idx + 1).catch(() => {}));
    } catch (e) {
      console.error('Failed to save timeSlots to localStorage', e);
    }
  }, [timeSlots]);

  // Dynamic calculation: Jumlah card dari antrean yang masuk ke matriks jadwal per tanggal
  const matrixCardCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    schedules.forEach(s => {
      // Card berada di dalam matriks jika statusnya scheduled atau completed, dan memiliki roomId & timeSlotId
      if ((s.status === 'scheduled' || s.status === 'completed') && s.roomId && s.timeSlotId && s.date) {
        counts[s.date] = (counts[s.date] || 0) + 1;
      }
    });
    return counts;
  }, [schedules]);

  // Tanggal-tanggal unik yang memiliki minimal 1 sidang di matriks
  const scheduledDates = useMemo(() => {
    return Object.keys(matrixCardCountsByDate).sort();
  }, [matrixCardCountsByDate]);

  // Compute live validation when dragging over a cell
  useEffect(() => {
    if (activeDragItem && hoveredCell) {
      const validation = checkScheduleConflict(
        activeDragItem,
        selectedDate,
        hoveredCell.timeSlotId,
        hoveredCell.roomId,
        schedules,
        lecturers,
        rooms
      );
      setCurrentDragValidation(validation);
    } else {
      setCurrentDragValidation(null);
    }
  }, [activeDragItem, hoveredCell, selectedDate, schedules, lecturers, rooms]);

  // Academic Period Management (Active Period Concept)
  const addAcademicPeriod = useCallback((newPeriodData: Omit<AcademicPeriod, 'id' | 'createdAt' | 'updatedAt'>) => {
    const trimmedYear = newPeriodData.academicYear.trim();
    if (!/^\d{4}\/\d{4}$/.test(trimmedYear)) {
      return { success: false, error: 'Format Tahun Akademik harus YYYY/YYYY (contoh: 2026/2027).' };
    }

    const isDuplicate = academicPeriods.some(
      p => p.academicYear.toLowerCase() === trimmedYear.toLowerCase() && p.semester === newPeriodData.semester
    );
    if (isDuplicate) {
      return { success: false, error: `Periode Tahun Akademik ${trimmedYear} Semester ${newPeriodData.semester} sudah terdaftar.` };
    }

    if (newPeriodData.startDate && newPeriodData.endDate && newPeriodData.startDate > newPeriodData.endDate) {
      return { success: false, error: 'Tanggal mulai tidak boleh lebih lambat dari tanggal selesai.' };
    }

    const now = new Date().toISOString();
    const cleanId = `prd-${trimmedYear.replace('/', '-')}-${newPeriodData.semester.toLowerCase()}-${Date.now().toString(36)}`;
    const newPeriod: AcademicPeriod = {
      ...newPeriodData,
      id: cleanId,
      academicYear: trimmedYear,
      isActive: false, // Wajib diaktifkan eksplisit melalui alur aktivasi transaksional
      status: newPeriodData.status || 'persiapan',
      createdAt: now,
      updatedAt: now,
    };

    setAcademicPeriods(prev => [newPeriod, ...prev]);
    dbRepository.saveAcademicPeriod(newPeriod).catch(err => {
      console.warn('DB save academic period error', err);
    });

    addToast('success', 'Periode Akademik Ditambahkan', `Periode ${newPeriod.academicYear} ${newPeriod.semester} berhasil didaftarkan (Status: ${newPeriod.status}).`);
    return { success: true };
  }, [academicPeriods, addToast]);

  const updateAcademicPeriod = useCallback((id: string, updates: Partial<AcademicPeriod>) => {
    const existing = academicPeriods.find(p => p.id === id);
    if (!existing) {
      return { success: false, error: 'Data periode akademik tidak ditemukan.' };
    }

    // Hanya periode yang belum berjalan (status === 'persiapan') yang dapat diubah tahun akademik atau semesternya
    if (existing.status !== 'persiapan') {
      if ((updates.academicYear && updates.academicYear !== existing.academicYear) || 
          (updates.semester && updates.semester !== existing.semester)) {
        return { 
          success: false, 
          error: `Periode dengan status "${existing.status}" tidak dapat diubah tahun akademik atau semesternya. Hanya periode persiapan yang dapat diubah.` 
        };
      }
    }

    if (updates.academicYear && !/^\d{4}\/\d{4}$/.test(updates.academicYear.trim())) {
      return { success: false, error: 'Format Tahun Akademik harus YYYY/YYYY (contoh: 2026/2027).' };
    }

    const targetYear = updates.academicYear ? updates.academicYear.trim() : existing.academicYear;
    const targetSemester = updates.semester || existing.semester;

    const isDuplicate = academicPeriods.some(
      p => p.id !== id && p.academicYear.toLowerCase() === targetYear.toLowerCase() && p.semester === targetSemester
    );
    if (isDuplicate) {
      return { success: false, error: `Periode Tahun Akademik ${targetYear} Semester ${targetSemester} sudah digunakan oleh periode lain.` };
    }

    const targetStart = updates.startDate !== undefined ? updates.startDate : existing.startDate;
    const targetEnd = updates.endDate !== undefined ? updates.endDate : existing.endDate;
    if (targetStart && targetEnd && targetStart > targetEnd) {
      return { success: false, error: 'Tanggal mulai tidak boleh lebih lambat dari tanggal selesai.' };
    }

    const now = new Date().toISOString();
    const updatedPeriod: AcademicPeriod = {
      ...existing,
      ...updates,
      academicYear: targetYear,
      semester: targetSemester,
      updatedAt: now,
    };

    setAcademicPeriods(prev => prev.map(p => p.id === id ? updatedPeriod : p));
    dbRepository.saveAcademicPeriod(updatedPeriod).catch(err => {
      console.warn('DB update academic period error', err);
    });

    addToast('success', 'Periode Akademik Diperbarui', `Informasi periode ${updatedPeriod.academicYear} ${updatedPeriod.semester} berhasil disimpan.`);
    return { success: true };
  }, [academicPeriods, addToast]);

  const activateAcademicPeriod = useCallback((targetPeriodId: string, force: boolean = false) => {
    const target = academicPeriods.find(p => p.id === targetPeriodId);
    if (!target) {
      return { success: false, error: 'Periode target tidak ditemukan.' };
    }

    const prevActive = academicPeriods.find(p => p.isActive);

    if (target.isActive) {
      return { success: true };
    }

    // Periksa apakah terdapat aktivitas sidang yang belum selesai pada periode sebelumnya
    if (prevActive && prevActive.id !== targetPeriodId) {
      const unfinishedSchedules = schedules.filter(
        s => s.academicPeriodId === prevActive.id && s.status !== 'completed'
      );
      if (unfinishedSchedules.length > 0 && !force) {
        return {
          success: false,
          hasUnfinishedActivities: true,
          unfinishedCount: unfinishedSchedules.length,
          previousPeriodName: `${prevActive.academicYear} ${prevActive.semester}`,
        };
      }
    }

    const now = new Date().toISOString();

    // Transaksional: Nonaktifkan periode lama, aktifkan periode baru (otomatis status menjadi 'berjalan')
    setAcademicPeriods(prev => prev.map(p => {
      if (p.id === targetPeriodId) {
        return {
          ...p,
          isActive: true,
          status: 'berjalan',
          updatedAt: now,
        };
      }
      if (p.isActive) {
        return {
          ...p,
          isActive: false,
          updatedAt: now,
        };
      }
      return p;
    }));

    setSelectedPeriodId(targetPeriodId);

    // Atomic transaction di IndexedDB
    dbRepository.setActiveAcademicPeriodAtomic(targetPeriodId).catch(err => {
      console.warn('DB setActiveAcademicPeriodAtomic error', err);
    });

    addToast(
      'success',
      'Periode Akademik Aktif Diperbarui',
      `Periode ${target.academicYear} ${target.semester} kini aktif (Status: Berjalan). Papan jadwal dan fitur impor otomatis disesuaikan.`
    );

    return { success: true };
  }, [academicPeriods, schedules, addToast]);

  const closeAcademicPeriod = useCallback((periodId: string) => {
    const target = academicPeriods.find(p => p.id === periodId);
    if (!target) {
      return { success: false, error: 'Periode tidak ditemukan.' };
    }

    const now = new Date().toISOString();
    setAcademicPeriods(prev => prev.map(p => {
      if (p.id === periodId) {
        return {
          ...p,
          status: 'selesai',
          isActive: false,
          updatedAt: now,
        };
      }
      return p;
    }));

    const updated = { ...target, status: 'selesai' as const, isActive: false, updatedAt: now };
    dbRepository.saveAcademicPeriod(updated).catch(err => {
      console.warn('DB close academic period error', err);
    });

    addToast(
      'info',
      'Periode Akademik Ditutup',
      `Periode ${target.academicYear} ${target.semester} resmi ditutup (Status: Selesai). Penjadwalan baru dinonaktifkan.`
    );

    return { success: true };
  }, [academicPeriods, addToast]);

  const deleteAcademicPeriod = useCallback((id: string) => {
    const target = academicPeriods.find(p => p.id === id);
    if (!target) {
      return { success: false, error: 'Periode tidak ditemukan.' };
    }

    if (target.isActive) {
      return { success: false, error: 'Periode yang sedang aktif tidak dapat dihapus. Nonaktifkan atau ganti periode aktif terlebih dahulu.' };
    }

    // Integritas: Tidak boleh menghapus periode yang sudah memiliki data sidang
    const hasSchedules = schedules.some(s => s.academicPeriodId === id);
    if (hasSchedules) {
      return { 
        success: false, 
        error: `Periode tidak dapat dihapus karena sudah memiliki data pengajuan sidang skripsi mahasiswa.` 
      };
    }

    setAcademicPeriods(prev => prev.filter(p => p.id !== id));
    dbRepository.deleteAcademicPeriod(id).catch(err => {
      console.warn('DB delete academic period error', err);
    });

    addToast('success', 'Periode Dihapus', `Periode ${target.academicYear} ${target.semester} berhasil dihapus.`);
    return { success: true };
  }, [academicPeriods, schedules, addToast]);

  // Room Management CRUD
  const addRoom = useCallback((newRoom: Omit<Room, 'id'>) => {
    const id = `room-${Date.now()}`;
    const roomWithId: Room = { ...newRoom, id };
    setRooms(prev => [...prev, roomWithId]);
    addToast('success', 'Ruangan Ditambahkan', `Ruangan ${newRoom.name} berhasil ditambahkan ke matriks jadwal.`);
  }, [addToast]);

  const updateRoom = useCallback((id: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    addToast('success', 'Ruangan Diperbarui', `Informasi ruangan berhasil diperbarui.`);
  }, [addToast]);

  const deleteRoom = useCallback((id: string) => {
    const roomToDelete = rooms.find(r => r.id === id);
    if (!roomToDelete) return;

    if (rooms.length <= 1) {
      addToast('error', 'Tidak Dapat Dihapus', 'Matriks jadwal minimal harus memiliki 1 ruangan aktif.');
      return;
    }

    // Unassign any schedule currently booked in this room
    let affected = 0;
    setSchedules(prev => prev.map(s => {
      if (s.roomId === id) {
        affected++;
        return {
          ...s,
          roomId: null,
          timeSlotId: null,
          status: 'unassigned',
        };
      }
      return s;
    }));

    setRooms(prev => prev.filter(r => r.id !== id));
    addToast(
      'info',
      'Ruangan Dihapus',
      `Ruangan ${roomToDelete.name} telah dihapus.${affected > 0 ? ` (${affected} jadwal dikembalikan ke antrean).` : ''}`
    );
  }, [rooms, addToast]);

  // TimeSlot Management CRUD
  const addTimeSlot = useCallback((newSlot: Omit<TimeSlot, 'id'>) => {
    const id = `slot-${Date.now()}`;
    const slotWithId: TimeSlot = { ...newSlot, id };
    setTimeSlots(prev => [...prev, slotWithId]);
    addToast('success', 'Slot Waktu Ditambahkan', `Slot ${newSlot.label} berhasil ditambahkan ke matriks jadwal.`);
  }, [addToast]);

  const updateTimeSlot = useCallback((id: string, updates: Partial<TimeSlot>) => {
    setTimeSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    addToast('success', 'Slot Waktu Diperbarui', `Slot waktu berhasil diperbarui.`);
  }, [addToast]);

  const deleteTimeSlot = useCallback((id: string) => {
    const slotToDelete = timeSlots.find(s => s.id === id);
    if (!slotToDelete) return;

    if (timeSlots.length <= 1) {
      addToast('error', 'Tidak Dapat Dihapus', 'Matriks jadwal minimal harus memiliki 1 slot waktu aktif.');
      return;
    }

    // Unassign any schedule currently booked in this slot
    let affected = 0;
    setSchedules(prev => prev.map(s => {
      if (s.timeSlotId === id) {
        affected++;
        return {
          ...s,
          roomId: null,
          timeSlotId: null,
          status: 'unassigned',
        };
      }
      return s;
    }));

    setTimeSlots(prev => prev.filter(s => s.id !== id));
    addToast(
      'info',
      'Slot Waktu Dihapus',
      `Slot ${slotToDelete.label} telah dihapus.${affected > 0 ? ` (${affected} jadwal dikembalikan ke antrean).` : ''}`
    );
  }, [timeSlots, addToast]);

  // Lecturer Management CRUD
  const addLecturer = useCallback((newLecturer: Omit<Lecturer, 'id'>) => {
    const id = `lec-${Date.now()}`;
    const lecturerWithId: Lecturer = { ...newLecturer, id };
    setLecturers(prev => [...prev, lecturerWithId]);
    dbRepository.saveLecturer(lecturerWithId).catch(err => {
      console.warn('DB add lecturer error', err);
    });

    // Automatic Account Provisioning untuk Dosen Baru
    autoProvisionLecturer(lecturerWithId).catch(err => {
      console.warn('Auto provision lecturer error', err);
    });

    addToast('success', 'Dosen Ditambahkan', `Dosen ${newLecturer.name} (${newLecturer.code}) berhasil ditambahkan. Akun login otomatis dibuat.`);
  }, [addToast]);

  const updateLecturer = useCallback((id: string, updates: Partial<Lecturer>) => {
    setLecturers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));

    // Update reviewerName / advisorName in schedules if lecturer name updated
    if (updates.name) {
      setSchedules(prev => prev.map(s => {
        let changed = false;
        let newAdvisor = s.advisorName;
        let newReviewer = s.reviewerName;

        if (s.examiner1Id === id) {
          newReviewer = updates.name;
          changed = true;
        }
        if (s.examiner2Id === id) {
          newAdvisor = updates.name;
          changed = true;
        }

        if (changed) {
          return {
            ...s,
            advisorName: newAdvisor,
            reviewerName: newReviewer,
          };
        }
        return s;
      }));
    }

    // Persist to indexedDB
    const existing = lecturers.find(l => l.id === id);
    if (existing) {
      dbRepository.saveLecturer({ ...existing, ...updates }).catch(err => {
        console.warn('DB update lecturer error', err);
      });
    }

    addToast('success', 'Data Dosen Diperbarui', `Informasi data dosen ${updates.name || ''} berhasil disimpan.`);
  }, [lecturers, addToast]);

  const deleteLecturer = useCallback((id: string) => {
    const lecToDelete = lecturers.find(l => l.id === id);
    if (!lecToDelete) {
      addToast('error', 'Gagal Menghapus', 'Data dosen tidak ditemukan.');
      return { success: false, message: 'Data dosen tidak ditemukan' };
    }

    if (lecturers.length <= 3) {
      addToast('error', 'Tidak Dapat Dihapus', 'Sistem minimal harus memiliki setidaknya 3 dosen penguji aktif untuk pembagian majelis sidang.');
      return { success: false, message: 'Sistem minimal memerlukan 3 dosen penguji aktif.' };
    }

    // Unassign or adjust any schedules currently assigned to this lecturer
    let affected = 0;
    setSchedules(prev => prev.map(s => {
      let isAffected = false;
      let newExaminer1 = s.examiner1Id;
      let newExaminer2 = s.examiner2Id;
      let newExaminer3 = s.examiner3Id;
      let newStatus = s.status;
      let newTimeSlot = s.timeSlotId;
      let newRoom = s.roomId;

      if (s.examiner1Id === id) {
        isAffected = true;
        newExaminer1 = '';
        newStatus = 'unassigned';
        newTimeSlot = null;
        newRoom = null;
      }
      if (s.examiner2Id === id) {
        isAffected = true;
        newExaminer2 = '';
        newStatus = 'unassigned';
        newTimeSlot = null;
        newRoom = null;
      }
      if (s.examiner3Id === id) {
        isAffected = true;
        newExaminer3 = '';
      }

      if (isAffected) {
        affected++;
        return {
          ...s,
          examiner1Id: newExaminer1,
          examiner2Id: newExaminer2,
          examiner3Id: newExaminer3,
          status: newStatus,
          timeSlotId: newTimeSlot,
          roomId: newRoom,
        };
      }
      return s;
    }));

    setLecturers(prev => prev.filter(l => l.id !== id));

    dbRepository.deleteLecturer(id).catch(err => {
      console.warn('DB delete lecturer error', err);
    });

    addToast(
      'info',
      'Dosen Dihapus',
      `Dosen ${lecToDelete.name} (${lecToDelete.code}) berhasil dihapus.${affected > 0 ? ` (${affected} penugasan sidang terpengaruh dan dikembalikan ke antrean).` : ''}`
    );

    return { success: true };
  }, [lecturers, addToast]);

  // Delete Student
  const deleteStudent = useCallback((id: string) => {
    const target = schedules.find(s => s.id === id);
    if (!target) {
      addToast('error', 'Gagal Menghapus', 'Data mahasiswa tidak ditemukan.');
      return { success: false, message: 'Data mahasiswa tidak ditemukan.' };
    }

    setSchedules(prev => prev.filter(s => s.id !== id));

    dbRepository.deleteStudent(id, target.nim).catch(err => {
      console.warn('DB delete student error', err);
    });

    addToast(
      'success',
      'Data Mahasiswa Dihapus',
      `Data pengajuan sidang mahasiswa ${target.studentName} (${target.nim}) berhasil dihapus.`
    );

    return { success: true };
  }, [schedules, addToast]);

  // Bulk Delete Students
  const deleteStudentsBulk = useCallback((ids: string[]) => {
    const targets = schedules.filter(s => ids.includes(s.id));
    if (targets.length === 0) {
      return { success: false, count: 0 };
    }

    setSchedules(prev => prev.filter(s => !ids.includes(s.id)));

    dbRepository.deleteStudentsBulk(targets.map(t => ({ id: t.id, nim: t.nim }))).catch(err => {
      console.warn('DB bulk delete student error', err);
    });

    addToast(
      'success',
      'Data Mahasiswa Dihapus',
      `Berhasil menghapus ${targets.length} data pengajuan sidang mahasiswa.`
    );

    return { success: true, count: targets.length };
  }, [schedules, addToast]);

  // Assign Examiner 3
  const assignExaminer3 = useCallback((scheduleId: string, examiner3Id: string) => {
    const item = schedules.find(s => s.id === scheduleId);
    if (!item) return;

    // Integritas: Jika sidang telah selesai, data Penguji 3 terkunci permanen
    if (item.status === 'completed') {
      addToast(
        'error',
        'Data Terkunci Permanen',
        'Sidang ini telah dinyatakan selesai. Data Dosen Penguji 3 telah tersimpan permanen di database dan tidak dapat diubah kembali.'
      );
      return;
    }

    const isReplacement = !!item.examiner3Id && item.examiner3Id !== examiner3Id;
    const oldLecName = item.examiner3Id ? (lecturers.find(l => l.id === item.examiner3Id)?.name || 'Dosen Sebelumnya') : '';
    const lecName = lecturers.find(l => l.id === examiner3Id)?.name || 'Dosen';

    setSchedules(prev => prev.map(s => {
      if (s.id === scheduleId) {
        return {
          ...s,
          examiner3Id,
        };
      }
      return s;
    }));

    // Simpan ke repositori basis data
    dbRepository.updateExaminer3(scheduleId, examiner3Id).catch(err => {
      console.warn('DB updateExaminer3 error', err);
    });

    if (isReplacement) {
      addToast('warning', 'Penggantian Penguji 3 Berhasil', `${lecName} resmi menggantikan ${oldLecName} (berhalangan hadir) untuk sidang ${item.studentName}.`);
    } else {
      addToast('success', 'Penguji 3 Ditetapkan', `${lecName} ditetapkan sebagai Penguji 3 untuk ${item.studentName}.`);
    }
  }, [schedules, lecturers, addToast]);

  // Selesaikan Sidang & Kunci Permanen di Database
  // Dapat dilakukan oleh Administrator Panitia atau Dosen Ketua Penguji (P1)
  const completeSchedule = useCallback((scheduleId: string) => {
    const item = schedules.find(s => s.id === scheduleId);
    if (!item) return;

    // Integritas hak akses: Jika peran adalah dosen, pastikan yang bersangkutan adalah Ketua Penguji (P1)
    if (role === 'dosen' && currentLecturerId && item.examiner1Id !== currentLecturerId) {
      addToast(
        'error',
        'Akses Ditolak',
        'Pernyataan status sidang selesai hanya berhak dilakukan oleh Dosen Ketua Penguji (P1) atau Administrator Panitia.'
      );
      return;
    }

    if (!item.examiner3Id) {
      addToast('error', 'Gagal Selesaikan Sidang', 'Dosen Penguji 3 wajib telah ditetapkan sebelum sidang diselesaikan.');
      return;
    }

    setSchedules(prev => prev.map(s => {
      if (s.id === scheduleId) {
        return {
          ...s,
          status: 'completed',
        };
      }
      return s;
    }));

    dbRepository.completeSchedule(scheduleId).catch(err => {
      console.warn('DB complete error', err);
    });

    const isDoneByKetua = role === 'dosen' && item.examiner1Id === currentLecturerId;
    addToast(
      'success',
      'Sidang Dinyatakan Selesai!',
      `Sidang ${item.studentName} resmi berstatus Selesai${isDoneByKetua ? ' oleh Dosen Ketua Penguji' : ''}. Data Penguji 3 dan ruangan kini tersimpan permanen dan terkunci di database.`
    );
  }, [schedules, role, currentLecturerId, addToast]);

  // Buka Kembali Sidang (Khusus Administrator)
  const reopenSchedule = useCallback((scheduleId: string) => {
    const item = schedules.find(s => s.id === scheduleId);
    if (!item) return;

    setSchedules(prev => prev.map(s => {
      if (s.id === scheduleId) {
        return {
          ...s,
          status: 'scheduled',
        };
      }
      return s;
    }));

    dbRepository.reopenSchedule(scheduleId).catch(err => {
      console.warn('DB reopen error', err);
    });

    addToast('info', 'Status Sidang Dibuka Kembali', `Status sidang ${item.studentName} dikembalikan ke Terjadwal.`);
  }, [schedules, addToast]);

  // Auto assign Examiner 3 for all queue items that lack Examiner 3 (based on availability & fair workload)
  const autoAssignExaminer3ForQueue = useCallback(() => {
    let assignedCount = 0;
    setSchedules(prev => {
      return prev.map(item => {
        if (item.status === 'unassigned' && (!item.examiner3Id || item.examiner3Id === '')) {
          const candidates = getEligibleExaminer3Candidates(
            item.examiner2Id, // advisor
            item.examiner1Id, // reviewer
            lecturers,
            prev
          );
          if (candidates.length > 0) {
            assignedCount++;
            return {
              ...item,
              examiner3Id: candidates[0].lecturer.id,
            };
          }
        }
        return item;
      });
    });

    if (assignedCount > 0) {
      addToast(
        'success',
        'Penguji 3 Berhasil Dialokasikan',
        `${assignedCount} mahasiswa berhasil dipasangkan dengan Dosen Penguji 3 bebas bentrok.`
      );
    } else {
      addToast('info', 'Semua Penguji 3 Sudah Lengkap', 'Seluruh mahasiswa di antrean sudah memiliki susunan 3 penguji lengkap.');
    }

    return assignedCount;
  }, [lecturers, addToast]);

  // Assign or move a schedule to a slot
  const assignSchedule = useCallback((
    itemId: string, 
    targetDate: string, 
    timeSlotId: string, 
    roomId: string
  ): { success: boolean; reasons?: string[] } => {
    const item = schedules.find(s => s.id === itemId);
    if (!item) {
      return { success: false, reasons: ['Data pengajuan sidang tidak ditemukan.'] };
    }

    // Integritas: Sidang yang telah berstatus Selesai terkunci permanen
    if (item.status === 'completed') {
      addToast(
        'error',
        'Sidang Telah Selesai',
        'Data sidang ini telah dinyatakan selesai dan tersimpan permanen di database. Jadwal tidak dapat dipindahkan.'
      );
      return { success: false, reasons: ['Sidang berstatus selesai dan terkunci permanen.'] };
    }

    // Integritas: Periksa status periode akademik sidang
    if (item.academicPeriodId) {
      const p = academicPeriods.find(per => per.id === item.academicPeriodId);
      if (p && p.status === 'selesai') {
        addToast(
          'error',
          'Periode Akademik Selesai',
          `Sidang ini terdaftar pada periode ${p.academicYear} ${p.semester} yang telah berstatus Selesai (Arsip). Penjadwalan baru dinonaktifkan.`
        );
        return { success: false, reasons: ['Periode akademik sidang ini telah berstatus Selesai (Arsip).'] };
      }
    }

    // Check if Examiner 3 is set; if not, try to pick an available one
    let resolvedExaminer3Id = item.examiner3Id;
    if (!resolvedExaminer3Id) {
      const candidates = getEligibleExaminer3Candidates(
        item.examiner2Id,
        item.examiner1Id,
        lecturers,
        schedules,
        targetDate,
        timeSlotId,
        rooms
      );
      const available = candidates.find(c => c.isAvailable);
      if (available) {
        resolvedExaminer3Id = available.lecturer.id;
      } else {
        addToast(
          'error',
          'Penguji 3 Belum Tersedia',
          'Silakan tentukan Dosen Penguji 3 terlebih dahulu untuk mahasiswa ini.'
        );
        return { success: false, reasons: ['Dosen Penguji 3 belum ditentukan dan tidak ada kandidat kosong pada slot ini.'] };
      }
    }

    const testItem = { ...item, examiner3Id: resolvedExaminer3Id };

    // Check conflict
    const validation = checkScheduleConflict(
      testItem,
      targetDate,
      timeSlotId,
      roomId,
      schedules,
      lecturers,
      rooms
    );

    if (validation.hasConflict) {
      addToast(
        'error',
        'Jadwal Bentrok! Penempatan Ditolak',
        validation.reasons[0] || 'Terdapat bentrok dosen atau ruangan pada slot ini.'
      );
      return { success: false, reasons: validation.reasons };
    }

    // Update schedule
    setSchedules(prev => prev.map(s => {
      if (s.id === itemId) {
        return {
          ...s,
          examiner3Id: resolvedExaminer3Id,
          date: targetDate,
          timeSlotId,
          roomId,
          status: 'scheduled',
        };
      }
      return s;
    }));

    const roomName = rooms.find(r => r.id === roomId)?.name || 'Ruangan';
    const slotLabel = timeSlots.find(t => t.id === timeSlotId)?.label || 'Waktu';

    // Sync atomic to relational database
    dbRepository.assignSchedule(itemId, targetDate, timeSlotId, roomId).catch((err) => {
      console.warn('DB async assign error', err);
    });

    addToast(
      'success',
      'Jadwal Berhasil Ditetapkan!',
      `${item.studentName} ditempatkan di ${roomName} (${slotLabel}).`
    );

    // Trigger subtle celebratory confetti
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#4f46e5', '#10b981', '#3b82f6', '#f59e0b']
      });
    } catch {
      // ignore
    }

    return { success: true };
  }, [schedules, lecturers, rooms, timeSlots, addToast]);

  // Unassign from grid back to queue
  const unassignSchedule = useCallback((itemId: string) => {
    const item = schedules.find(s => s.id === itemId);
    if (!item) return;

    // Integritas: Sidang selesai tidak dapat dibatalkan
    if (item.status === 'completed') {
      addToast(
        'error',
        'Data Terkunci Permanen',
        'Sidang yang telah dinyatakan selesai tidak dapat dibatalkan atau dikembalikan ke antrean.'
      );
      return;
    }

    // Integritas: Cek status periode
    if (item.academicPeriodId) {
      const p = academicPeriods.find(per => per.id === item.academicPeriodId);
      if (p && p.status === 'selesai') {
        addToast(
          'error',
          'Periode Akademik Selesai',
          `Periode sidang ini telah berstatus Selesai (Arsip). Pembatalan jadwal dinonaktifkan.`
        );
        return;
      }
    }

    setSchedules(prev => prev.map(s => {
      if (s.id === itemId) {
        return {
          ...s,
          examiner3Id: '', // Penguji 3 hanya dialokasikan saat dijadwalkan
          timeSlotId: null,
          roomId: null,
          status: 'unassigned',
        };
      }
      return s;
    }));

    // Sync atomic to relational database
    dbRepository.unassignSchedule(itemId).catch((err) => {
      console.warn('DB async unassign error', err);
    });

    addToast(
      'info',
      'Jadwal Dibatalkan',
      `${item.studentName} dikembalikan ke antrean sidang.`
    );
  }, [schedules, academicPeriods, addToast]);

  // Add new student to queue manually
  const addNewStudentToQueue = useCallback((
    student: Omit<ScheduleItem, 'id' | 'status' | 'timeSlotId' | 'roomId'>
  ) => {
    const targetPeriodId = student.academicPeriodId || activePeriod?.id || '';
    const periodObj = academicPeriods.find(p => p.id === targetPeriodId);

    if (periodObj && periodObj.status === 'selesai') {
      addToast(
        'error',
        'Periode Selesai',
        `Periode ${periodObj.academicYear} ${periodObj.semester} telah berstatus Selesai (Arsip). Pengajuan baru tidak diizinkan.`
      );
      return;
    }

    if (targetPeriodId) {
      const isDuplicate = schedules.some(
        s => s.nim.trim() === student.nim.trim() && (s.academicPeriodId === targetPeriodId || (!s.academicPeriodId && activePeriod?.id === targetPeriodId))
      );
      if (isDuplicate) {
        addToast(
          'error',
          'Mahasiswa Sudah Terdaftar',
          `Mahasiswa dengan NIM ${student.nim} sudah terdaftar pada periode akademik ini.`
        );
        return;
      }
    }

    const newItem: ScheduleItem = {
      ...student,
      id: `sch-${Date.now()}`,
      academicPeriodId: targetPeriodId,
      academicYear: periodObj ? `${periodObj.academicYear} ${periodObj.semester}` : (student.academicYear || '2025/2026 Genap'),
      examiner3Id: '', // Ditentukan hanya saat penjadwalan
      status: 'unassigned',
      timeSlotId: null,
      roomId: null,
    };

    setSchedules(prev => [newItem, ...prev]);

    // Automatic Account Provisioning untuk Mahasiswa Baru
    if (student.nim) {
      autoProvisionStudent({
        nim: student.nim,
        name: student.studentName,
        studyProgram: student.studyProgram,
      }).catch(err => {
        console.warn('Auto provision student error', err);
      });
    }

    addToast('success', 'Mahasiswa Ditambahkan', `${student.studentName} berhasil masuk ke antrean periode ${newItem.academicYear}. Akun login otomatis dibuat.`);
  }, [activePeriod, academicPeriods, schedules, addToast]);

  // Import students from Excel/CSV parsed data
  // Aturan: Impor data mahasiswa TIDAK ADA proses penentuan penguji 3.
  const importStudentsFromData = useCallback((importedRows: ImportedStudentRow[], defaultDate?: string) => {
    if (!activePeriod) {
      addToast(
        'error',
        'Impor Ditolak: Tidak Ada Periode Aktif',
        'Tidak terdapat Periode Akademik yang aktif pada sistem. Silakan aktifkan periode akademik terlebih dahulu melalui menu Data Master > Periode Akademik.'
      );
      return { successCount: 0, duplicateCount: 0, failedCount: importedRows.length, error: 'Tidak terdapat periode akademik aktif.' };
    }

    if (activePeriod.status !== 'berjalan') {
      addToast(
        'error',
        'Impor Ditolak: Periode Tidak Berjalan',
        `Periode aktif saat ini (${activePeriod.academicYear} ${activePeriod.semester}) berstatus "${activePeriod.status}". Impor sidang baru hanya dapat dilakukan pada periode yang berstatus "Berjalan".`
      );
      return { successCount: 0, duplicateCount: 0, failedCount: importedRows.length, error: `Periode aktif berstatus ${activePeriod.status}.` };
    }

    let successCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const newItems: ScheduleItem[] = [];

    // Existing NIMs in the active period
    const existingNimsInPeriod = new Set(
      schedules
        .filter(s => s.academicPeriodId === activePeriod.id || (!s.academicPeriodId && activePeriod.isActive))
        .map(s => s.nim.trim())
    );

    const seenBatchNims = new Set<string>();

    for (const row of importedRows) {
      if (!row.isValid) {
        failedCount++;
        continue;
      }

      const cleanNim = row.nim.trim();

      if (existingNimsInPeriod.has(cleanNim) || seenBatchNims.has(cleanNim)) {
        duplicateCount++;
        continue;
      }

      seenBatchNims.add(cleanNim);

      const reviewerId = row.matchedReviewerId || lecturers[0]?.id || 'lec-1';
      const advisorId = row.matchedAdvisorId || lecturers[1]?.id || 'lec-2';

      const item: ScheduleItem = {
        id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nim: cleanNim,
        studentName: row.nama,
        thesisTitle: row.judul,
        thesisType: row.jenis || 'Skripsi',
        studyProgram: 'Teknik Informatika',
        academicYear: `${activePeriod.academicYear} ${activePeriod.semester}`,
        academicPeriodId: activePeriod.id,
        reviewerName: row.dosenReviewer,
        advisorName: row.dosenPembimbing,
        seminarScore: row.nilaiSeminar,
        examiner1Id: reviewerId,
        examiner2Id: advisorId,
        examiner3Id: '', // Tanpa penentuan Penguji 3 saat impor
        date: defaultDate || selectedDate,
        timeSlotId: null,
        roomId: null,
        status: 'unassigned',
        notes: `Impor Excel/CSV TA: ${activePeriod.academicYear} (${activePeriod.semester}). Nilai Seminar: ${row.nilaiSeminar}`,
      };

      newItems.push(item);
      successCount++;
    }

    if (newItems.length > 0) {
      setSchedules(prev => [...newItems, ...prev]);

      // Automatic Account Provisioning untuk seluruh Mahasiswa Impor
      autoProvisionBulkStudents(
        newItems.map(item => ({
          nim: item.nim,
          name: item.studentName,
          studyProgram: item.studyProgram,
        }))
      ).catch(err => {
        console.warn('Auto provision bulk students error', err);
      });

      addToast(
        'success',
        'Impor Berhasil',
        `${successCount} mahasiswa berhasil diimpor ke Periode ${activePeriod.academicYear} ${activePeriod.semester}.${duplicateCount > 0 ? ` (${duplicateCount} data duplikat dilewati)` : ''}`
      );
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 }
        });
      } catch {
        // ignore
      }
    } else if (duplicateCount > 0 && successCount === 0) {
      addToast(
        'warning',
        'Semua Data Duplikat',
        `Seluruh (${duplicateCount}) mahasiswa yang diimpor sudah terdaftar pada Periode ${activePeriod.academicYear} ${activePeriod.semester}. Tidak ada data baru ditambahkan.`
      );
    }

    return { successCount, duplicateCount, failedCount };
  }, [activePeriod, lecturers, schedules, selectedDate, addToast]);

  // Smart Auto Schedule Assistant for all unassigned queue items
  const autoScheduleQueue = useCallback(() => {
    const unassignedItems = schedules.filter(s => s.status === 'unassigned');
    if (unassignedItems.length === 0) {
      addToast('info', 'Antrean Kosong', 'Tidak ada mahasiswa di antrean yang perlu dijadwalkan.');
      return { scheduledCount: 0, unassignedRemaining: 0 };
    }

    let tempSchedules = [...schedules];
    let scheduledCount = 0;

    for (const item of unassignedItems) {
      const workingItem = { ...item };
      let scheduledThisStudent = false;

      // Cari kombinasi slot dan ruangan bebas bentrok untuk Reviewer & Pembimbing
      for (const slot of timeSlots) {
        if (scheduledThisStudent) break;

        for (const room of rooms) {
          // Cek ketersediaan ruangan & waktu untuk Reviewer & Pembimbing
          const baseCheck = checkScheduleConflict(
            { ...workingItem, examiner3Id: '' },
            selectedDate,
            slot.id,
            room.id,
            tempSchedules,
            lecturers,
            rooms
          );

          if (!baseCheck.hasConflict) {
            // Alokasikan Penguji 3 secara proporsional:
            // Dosen dengan beban Reviewer/Pembimbing paling sedikit mendapat prioritas proporsi Penguji 3 paling tinggi
            const candidates = getEligibleExaminer3Candidates(
              workingItem.examiner2Id,
              workingItem.examiner1Id,
              lecturers,
              tempSchedules,
              selectedDate,
              slot.id,
              rooms
            );

            const bestCandidate = candidates.find(c => c.isAvailable);
            if (bestCandidate) {
              tempSchedules = tempSchedules.map(s => {
                if (s.id === item.id) {
                  return {
                    ...s,
                    examiner3Id: bestCandidate.lecturer.id,
                    date: selectedDate,
                    timeSlotId: slot.id,
                    roomId: room.id,
                    status: 'scheduled',
                  };
                }
                return s;
              });

              scheduledCount++;
              scheduledThisStudent = true;
              break;
            }
          }
        }
      }
    }

    setSchedules(tempSchedules);
    const remaining = unassignedItems.length - scheduledCount;

    if (scheduledCount > 0) {
      addToast(
        'success',
        'Penjadwalan Otomatis Selesai',
        `${scheduledCount} mahasiswa berhasil dijadwalkan bebas bentrok. ${remaining > 0 ? `(${remaining} belum mendapat slot kosong)` : ''}`
      );
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    } else {
      addToast('warning', 'Tidak Ada Slot Kosong', 'Semua slot pada tanggal ini sudah penuh atau terjadi bentrok penguji.');
    }

    return { scheduledCount, unassignedRemaining: remaining };
  }, [schedules, selectedDate, rooms, timeSlots, lecturers, addToast]);

  // Reset to initial mock data
  const resetData = useCallback(() => {
    setSchedules(INITIAL_SCHEDULE_ITEMS);
    setRooms(INITIAL_ROOMS);
    setTimeSlots(INITIAL_TIME_SLOTS);
    setLecturers(INITIAL_LECTURERS);
    setAcademicPeriods(INITIAL_ACADEMIC_PERIODS);
    setSelectedPeriodId('prd-2025-genap');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ROOMS_STORAGE_KEY);
    localStorage.removeItem(SLOTS_STORAGE_KEY);
    localStorage.removeItem(LECTURERS_STORAGE_KEY);
    localStorage.removeItem(ACADEMIC_PERIODS_STORAGE_KEY);
    dbEngine.resetToSeedData().catch((err) => {
      console.warn('DB reset error', err);
    });
    addToast('info', 'Data Direset', 'Semua jadwal, antrean, ruangan, slot waktu, data dosen, dan periode akademik telah dikembalikan ke kondisi default.');
  }, [addToast]);

  return (
    <ScheduleContext.Provider
      value={{
        role,
        setRole,
        selectedDate,
        setSelectedDate,
        schedules,
        rooms,
        timeSlots,
        lecturers,
        academicPeriods,
        activePeriod,
        selectedPeriodId,
        setSelectedPeriodId,
        addAcademicPeriod,
        updateAcademicPeriod,
        activateAcademicPeriod,
        closeAcademicPeriod,
        deleteAcademicPeriod,
        currentStudentNim,
        setCurrentStudentNim,
        currentLecturerId,
        setCurrentLecturerId,
        activeDragItem,
        setActiveDragItem,
        hoveredCell,
        setHoveredCell,
        currentDragValidation,
        assignSchedule,
        unassignSchedule,
        addNewStudentToQueue,
        importStudentsFromData,
        assignExaminer3,
        completeSchedule,
        reopenSchedule,
        autoAssignExaminer3ForQueue,
        autoScheduleQueue,
        resetData,
        addRoom,
        updateRoom,
        deleteRoom,
        addTimeSlot,
        updateTimeSlot,
        deleteTimeSlot,
        addLecturer,
        updateLecturer,
        deleteLecturer,
        deleteStudent,
        deleteStudentsBulk,
        scheduledDates,
        matrixCardCountsByDate,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
