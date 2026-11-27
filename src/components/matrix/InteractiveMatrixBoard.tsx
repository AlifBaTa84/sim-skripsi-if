import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { useSchedule } from '../../context/ScheduleContext';
import { ScheduleItem, Room, TimeSlot } from '../../types';
import { DroppableCell } from './DroppableCell';
import { UnassignedQueue } from './UnassignedQueue';
import { QuickScheduleModal } from './QuickScheduleModal';
import { AssignSeminarReviewerModal } from './AssignSeminarReviewerModal';
import { RecordSeminarResultModal } from './RecordSeminarResultModal';
import { SeminarHistoryModal } from './SeminarHistoryModal';
import { CalendarDatePicker } from '../shared/CalendarDatePicker';
import { 
  Calendar, 
  Clock, 
  GripVertical,
  CalendarDays,
  Lock,
  BookOpen,
  GraduationCap,
  Layers,
  AlertCircle
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/formatters';

interface InteractiveMatrixBoardProps {
  onOpenImportModal: () => void;
  onManualAssign: (item: ScheduleItem) => void;
  onAssignExaminer3: (item: ScheduleItem) => void;
}

export const InteractiveMatrixBoard: React.FC<InteractiveMatrixBoardProps> = ({
  onOpenImportModal,
  onManualAssign,
  onAssignExaminer3,
}) => {
  const {
    selectedDate,
    setSelectedDate,
    schedules,
    rooms,
    timeSlots,
    lecturers,
    activeDragItem,
    setActiveDragItem,
    setHoveredCell,
    assignSchedule,
    unassignSchedule,
    rescheduleSeminar,
    scheduledDates,
    matrixCardCountsByDate,
    academicPeriods,
    activePeriod,
    selectedPeriodId,
    setSelectedPeriodId,
    activityTypeFilter,
    setActivityTypeFilter,
    addToast,
    assignSeminarReviewerAndSchedule,
  } = useSchedule();

  const currentViewingPeriod = useMemo(() => {
    return academicPeriods.find(p => p.id === selectedPeriodId) || activePeriod || academicPeriods[0] || null;
  }, [academicPeriods, selectedPeriodId, activePeriod]);

  const isPeriodClosed = currentViewingPeriod?.status === 'selesai';

  // ── Modals State for Seminar ────────────────────────────────────────────────
  const [selectedSeminarForReviewer, setSelectedSeminarForReviewer] = useState<ScheduleItem | null>(null);
  const [selectedSeminarForResult, setSelectedSeminarForResult] = useState<ScheduleItem | null>(null);
  const [selectedSeminarForHistory, setSelectedSeminarForHistory] = useState<ScheduleItem | null>(null);

  // Pending cell target if dragging a seminar item that hasn't had a reviewer assigned yet
  const [pendingSeminarDrop, setPendingSeminarDrop] = useState<{
    itemId: string;
    date: string;
    slotId: string;
    roomId: string;
  } | null>(null);

  // ── Quick-Schedule Click State ─────────────────────────────────────────────
  const [quickTarget, setQuickTarget] = useState<{ slotId: string; roomId: string } | null>(null);

  // ── Matrix height measurement ──────────────────────────────────────────────
  const matrixRef = useRef<HTMLDivElement>(null);
  const [matrixHeight, setMatrixHeight] = useState<number | undefined>(undefined);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleWindowResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  useEffect(() => {
    const el = matrixRef.current;
    if (!el) return;
    const updateHeight = () => {
      if (el) {
        setMatrixHeight(el.offsetHeight);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const quickTargetSlot = quickTarget ? timeSlots.find(s => s.id === quickTarget.slotId) ?? null : null;
  const quickTargetRoom = quickTarget ? rooms.find(r => r.id === quickTarget.roomId) ?? null : null;

  // Unassigned items filtered for quick schedule modal
  const unassignedItems = useMemo(() => {
    return schedules
      .filter(s => s.status === 'unassigned' && (
        activityTypeFilter === 'all' 
          ? true 
          : activityTypeFilter === 'seminar' 
          ? s.activityType === 'seminar' 
          : s.activityType !== 'seminar'
      ))
      .sort((a, b) => a.nim.localeCompare(b.nim, undefined, { numeric: true }));
  }, [schedules, activityTypeFilter]);

  const handleEmptyCellClick = (slotId: string, roomId: string) => {
    if (activeDragItem || isPeriodClosed) return;
    setQuickTarget({ slotId, roomId });
  };

  const handleQuickAssign = (itemId: string) => {
    if (!quickTarget || isPeriodClosed) return;
    const targetItem = schedules.find(s => s.id === itemId);
    if (targetItem?.activityType === 'seminar' && (!targetItem.examiner1Id || targetItem.examiner1Id === '')) {
      setPendingSeminarDrop({
        itemId,
        date: selectedDate,
        slotId: quickTarget.slotId,
        roomId: quickTarget.roomId,
      });
      setSelectedSeminarForReviewer(targetItem);
      setQuickTarget(null);
      return;
    }
    assignSchedule(itemId, selectedDate, quickTarget.slotId, quickTarget.roomId);
    setQuickTarget(null);
  };

  // Pointer sensor
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // All schedules in date & viewing period
  const allDateSchedules = useMemo(() => {
    return schedules.filter(
      s => (s.status === 'scheduled' || s.status === 'completed') && 
           s.date === selectedDate &&
           (s.academicPeriodId === currentViewingPeriod?.id || (!s.academicPeriodId && currentViewingPeriod?.isActive))
    );
  }, [schedules, selectedDate, currentViewingPeriod]);

  // Activity counts for current viewing period
  const totalAllInPeriod = schedules.filter(
    s => s.academicPeriodId === currentViewingPeriod?.id || (!s.academicPeriodId && currentViewingPeriod?.isActive)
  ).length;

  const totalSeminarInPeriod = schedules.filter(
    s => (s.academicPeriodId === currentViewingPeriod?.id || (!s.academicPeriodId && currentViewingPeriod?.isActive)) &&
         s.activityType === 'seminar'
  ).length;

  const totalSidangInPeriod = schedules.filter(
    s => (s.academicPeriodId === currentViewingPeriod?.id || (!s.academicPeriodId && currentViewingPeriod?.isActive)) &&
         s.activityType !== 'seminar'
  ).length;

  const totalSlots = rooms.length * timeSlots.length;
  const occupiedSlots = allDateSchedules.length;
  const availableSlots = totalSlots - occupiedSlots;

  const occupiedSeminar = allDateSchedules.filter(s => s.activityType === 'seminar').length;
  const occupiedSidang = allDateSchedules.filter(s => s.activityType !== 'seminar').length;

  // Handle Drag Start
  const handleDragStart = (event: DragStartEvent) => {
    if (isPeriodClosed) return;
    const item = event.active.data.current?.item as ScheduleItem;
    if (item) {
      setActiveDragItem(item);
    }
  };

  // Handle Drag Over
  const handleDragOver = (event: DragOverEvent) => {
    if (isPeriodClosed) return;
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) {
      setHoveredCell(null);
      return;
    }

    if (overId.startsWith('cell-')) {
      const cellData = event.over?.data.current as { slotId: string; roomId: string } | undefined;
      if (cellData) {
        setHoveredCell({ timeSlotId: cellData.slotId, roomId: cellData.roomId });
      }
    } else {
      setHoveredCell(null);
    }
  };

  // Handle Drag End
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    setHoveredCell(null);

    if (!over || !active || isPeriodClosed) return;

    const item = active.data.current?.item as ScheduleItem;
    if (!item) return;

    const overId = String(over.id);

    // Dropped back onto the unassigned queue zone
    if (overId === 'unassigned-zone') {
      if (item.status === 'scheduled') {
        unassignSchedule(item.id);
      }
      return;
    }

    // Dropped onto a cell
    if (overId.startsWith('cell-')) {
      const cellData = over.data.current as { slotId: string; roomId: string } | undefined;
      if (cellData) {
        // Business Rule 2.4: Seminar Reviewer must be selected before placing
        if (item.activityType === 'seminar' && (!item.examiner1Id || item.examiner1Id === '')) {
          setPendingSeminarDrop({
            itemId: item.id,
            date: selectedDate,
            slotId: cellData.slotId,
            roomId: cellData.roomId,
          });
          setSelectedSeminarForReviewer(item);
          return;
        }

        assignSchedule(item.id, selectedDate, cellData.slotId, cellData.roomId);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
    setHoveredCell(null);
  };

  const handleReviewerAssigned = (reviewerId: string) => {
    if (pendingSeminarDrop) {
      const drop = pendingSeminarDrop;
      setPendingSeminarDrop(null);
      setSelectedSeminarForReviewer(null);
      // Gunakan fungsi atomik: satu setSchedules call untuk set reviewer + schedule
      // Menghindari stale closure bug yang terjadi dengan setTimeout
      assignSeminarReviewerAndSchedule(drop.itemId, reviewerId, drop.date, drop.slotId, drop.roomId);
    } else {
      setSelectedSeminarForReviewer(null);
    }
  };

  const handleRescheduleSeminar = (item: ScheduleItem) => {
    rescheduleSeminar(item.id);
  };

  // Dynamic grid template for the matrix: 150px for Time column, and min 290px per Room
  const matrixGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `150px repeat(${rooms.length}, minmax(290px, 1fr))`,
    gap: '0.875rem',
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-5">
        {/* Academic Period Header Banner */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tahun Akademik: <span className="text-slate-900 font-extrabold">{currentViewingPeriod?.academicYear || '2025/2026'}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Semester: <span className="text-indigo-700 font-extrabold">{currentViewingPeriod?.semester || 'Genap'}</span>
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                  currentViewingPeriod?.status === 'berjalan'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : currentViewingPeriod?.status === 'persiapan'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  Status: {currentViewingPeriod?.status || 'Berjalan'}
                </span>
                {currentViewingPeriod?.isActive && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-2xs">
                    Periode Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                Papan penjadwalan terpadu untuk Seminar Proposal dan Sidang Skripsi pada periode akademik terpilih.
              </p>
            </div>
          </div>

          {/* Period Selector Dropdown */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <span className="text-xs font-semibold text-slate-500">Pilih Periode:</span>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-2xs"
            >
              {academicPeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  TA {p.academicYear} {p.semester} ({p.status}){p.isActive ? ' ★ AKTIF' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Read-Only Archive Warning Banner */}
        {isPeriodClosed && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-amber-900 shadow-xs">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold">Mode Arsip Selesai: </span>
              Periode akademik ini telah berstatus <span className="font-semibold uppercase">Selesai</span>. Penjadwalan baru dan pemindahan kartu slot dinonaktifkan. Data ini hanya dapat dilihat untuk arsip dan laporan.
            </div>
          </div>
        )}

        {/* Top Control Bar: Date Switcher, Activity Filter Pills & Matrix Stats */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          
          {/* Left: Date Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Tanggal:</span>
            </div>

            <CalendarDatePicker
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              highlightedDates={scheduledDates}
              dateCounts={matrixCardCountsByDate}
              allowAll={false}
              placeholder="Pilih Tanggal Pelaksanaan"
            />
          </div>

          {/* Middle: Integrated Activity Filter Switcher (Decision Section 3) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 self-start xl:self-auto">
            <button
              type="button"
              onClick={() => setActivityTypeFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activityTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Semua Kegiatan</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-700">
                {totalAllInPeriod}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActivityTypeFilter('seminar')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activityTypeFilter === 'seminar'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Seminar</span>
              <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                activityTypeFilter === 'seminar' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {totalSeminarInPeriod}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActivityTypeFilter('sidang')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activityTypeFilter === 'sidang'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Sidang</span>
              <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                activityTypeFilter === 'sidang' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {totalSidangInPeriod}
              </span>
            </button>
          </div>

          {/* Right: Quick Stats */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 h-9 px-3.5 rounded-full bg-emerald-50 border border-emerald-200 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 text-xs font-medium">Terisi:</span>
              <span className="font-bold text-emerald-900 font-mono text-sm">{occupiedSlots}</span>
              {activityTypeFilter === 'all' && (
                <span className="text-[10px] text-emerald-800 font-semibold">
                  (Sem: {occupiedSeminar} / Sid: {occupiedSidang})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 h-9 px-3.5 rounded-full bg-indigo-50 border border-indigo-200 text-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-indigo-700 text-xs font-medium">Tersedia:</span>
              <span className="font-bold text-indigo-900 font-mono text-sm">{availableSlots}</span>
            </div>
          </div>

        </div>

        {/* Main Workspace Layout */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          
          {/* Main Matrix Board Grid */}
          <div ref={matrixRef} className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Board Header Title */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Matriks Ruangan & Slot Waktu</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {formatIndonesianDate(selectedDate)}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-semibold text-indigo-600">Klik sel kosong</span> untuk menjadwalkan langsung · <span className="font-semibold text-indigo-600">Seret kartu</span> dari antrean ke matriks
                </p>
              </div>
            </div>

            {/* Matrix Table Responsive Scroll Area */}
            <div className="overflow-x-auto p-4">
              <div className="min-w-[1300px]">
                {/* Header Row: Rooms */}
                <div style={matrixGridStyle} className="mb-3">
                  <div className="flex items-center justify-center p-2.5 bg-slate-100/70 rounded-xl text-center border border-slate-200/50">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Waktu \ Ruang
                    </span>
                  </div>

                  {rooms.map(room => (
                    <div
                      key={room.id}
                      className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 text-center transition-colors"
                    >
                      <h4 className="text-sm font-bold text-indigo-900 tracking-tight">
                        RUANGAN {room.name}
                      </h4>
                      <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                        {room.building} ({room.floor})
                      </p>
                      <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 inline-block">
                        Kapasitas {room.capacity} Orang
                      </span>
                    </div>
                  ))}
                </div>

                {/* Rows: One row per TimeSlot */}
                <div className="space-y-3">
                  {timeSlots.map(slot => (
                    <div key={slot.id} style={matrixGridStyle} className="items-stretch">
                      
                      {/* Left Header: TimeSlot label */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col items-center justify-center text-center transition-colors">
                        <span className="text-xs font-bold text-slate-800 tracking-tight font-mono">
                          {slot.label}
                        </span>
                        <span className="text-[11px] text-slate-600 mt-1 font-semibold bg-slate-200/70 px-2.5 py-0.5 rounded-full font-mono">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>

                      {/* Room Cells for this TimeSlot */}
                      {rooms.map(room => {
                        const cellItem = allDateSchedules.find(
                          s => s.timeSlotId === slot.id && s.roomId === room.id
                        );

                        return (
                          <div key={room.id} className="min-w-0">
                            <DroppableCell
                              slot={slot}
                              room={room}
                              item={cellItem}
                              lecturers={lecturers}
                              onClickEmpty={handleEmptyCellClick}
                              onAssignExaminer3={onAssignExaminer3}
                              onRecordSeminarResult={(item) => setSelectedSeminarForResult(item)}
                              onViewSeminarHistory={(item) => setSelectedSeminarForHistory(item)}
                            />
                          </div>
                        );
                      })}

                    </div>
                  ))}
                </div>

                {/* Bottom Bar: Dimension Summary */}
                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-end text-xs text-slate-400">
                  <span>
                    Total {rooms.length} Kolom Ruangan × {timeSlots.length} Baris Slot = {rooms.length * timeSlots.length} Sel Matriks
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* Right Sidebar: Unassigned Queue */}
          <div
            className="w-full lg:w-[380px] xl:w-[400px] shrink-0"
            style={isDesktop && matrixHeight ? { height: matrixHeight } : undefined}
          >
            <UnassignedQueue
              onOpenImportModal={onOpenImportModal}
              onManualAssign={onManualAssign}
              onAssignExaminer3={onAssignExaminer3}
              onAssignReviewer={(item) => setSelectedSeminarForReviewer(item)}
              onViewSeminarHistory={(item) => setSelectedSeminarForHistory(item)}
              onRescheduleSeminar={handleRescheduleSeminar}
            />
          </div>

        </div>

      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeDragItem ? (
          <div className={`w-72 bg-white/95 rounded-xl p-3.5 border-2 shadow-2xl backdrop-blur-md rotate-2 scale-105 pointer-events-none ${
            activeDragItem.activityType === 'seminar' ? 'border-emerald-600' : 'border-indigo-600'
          }`}>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                activeDragItem.activityType === 'seminar' 
                  ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                  : 'text-indigo-700 bg-indigo-50 border-indigo-200'
              }`}>
                {activeDragItem.nim}
              </span>
              <span className={`text-[10px] font-bold flex items-center gap-1 ${
                activeDragItem.activityType === 'seminar' ? 'text-emerald-700' : 'text-indigo-600'
              }`}>
                <GripVertical className="w-3.5 h-3.5" />
                Menggeser {activeDragItem.activityType === 'seminar' ? 'Seminar' : 'Sidang'}...
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 leading-snug">
              {activeDragItem.studentName}
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {/* Quick Schedule Modal */}
      {quickTarget && (
        <QuickScheduleModal
          targetSlot={quickTargetSlot}
          targetRoom={quickTargetRoom}
          selectedDate={selectedDate}
          allSchedules={schedules}
          allRooms={rooms}
          lecturers={lecturers}
          unassignedItems={unassignedItems}
          onAssign={handleQuickAssign}
          onClose={() => setQuickTarget(null)}
        />
      )}

      {/* Assign Seminar Reviewer Modal (Section 2.4) */}
      <AssignSeminarReviewerModal
        item={selectedSeminarForReviewer}
        isOpen={!!selectedSeminarForReviewer}
        onClose={() => {
          setSelectedSeminarForReviewer(null);
          setPendingSeminarDrop(null);
        }}
        onAssigned={handleReviewerAssigned}
        skipReviewerAssign={!!pendingSeminarDrop}
      />

      {/* Record Seminar Result Modal (Section 2.1 & 2.2) */}
      <RecordSeminarResultModal
        item={selectedSeminarForResult}
        isOpen={!!selectedSeminarForResult}
        onClose={() => setSelectedSeminarForResult(null)}
      />

      {/* Seminar Execution History Modal (Section 2.2 same_schedule) */}
      <SeminarHistoryModal
        item={selectedSeminarForHistory}
        isOpen={!!selectedSeminarForHistory}
        onClose={() => setSelectedSeminarForHistory(null)}
      />

    </DndContext>
  );
};
