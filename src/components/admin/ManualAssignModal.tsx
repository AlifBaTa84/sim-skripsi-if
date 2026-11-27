import React, { useState } from 'react';
import { ScheduleItem } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';
import { X, Calendar, CheckCircle2, Lock, AlertTriangle, ArrowRight, UserPlus } from 'lucide-react';
import { checkScheduleConflict } from '../../utils/conflictChecker';
import { getEligibleExaminer3Candidates } from '../../utils/importer';
import { CalendarDatePicker } from '../shared/CalendarDatePicker';

interface ManualAssignModalProps {
  item: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ManualAssignModal: React.FC<ManualAssignModalProps> = ({ item, isOpen, onClose }) => {
  const { 
    schedules, 
    rooms, 
    timeSlots, 
    lecturers, 
    assignSchedule,
    assignExaminer3,
    selectedDate,
    scheduledDates,
    matrixCardCountsByDate
  } = useSchedule();

  const [targetDate, setTargetDate] = useState(selectedDate);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedExaminer3, setSelectedExaminer3] = useState('');

  if (!isOpen || !item) return null;

  const isSeminar = item.activityType === 'seminar';
  const lecturerMap = new Map(lecturers.map(l => [l.id, l.name]));

  // Eligible Examiner 3 candidates (excluding advisor and reviewer) — hanya untuk Sidang
  const candidatesP3 = !isSeminar ? getEligibleExaminer3Candidates(
    item.examiner2Id,
    item.examiner1Id,
    lecturers,
    schedules,
    targetDate,
    selectedSlotId || undefined,
    rooms
  ) : [];

  const activeP3 = !isSeminar ? (selectedExaminer3 || item.examiner3Id || candidatesP3[0]?.lecturer.id || '') : '';

  const handleConfirm = () => {
    if (!selectedSlotId || !selectedRoomId) return;

    // Untuk Sidang: alokasikan P3 jika belum ada
    if (!isSeminar && !item.examiner3Id && activeP3) {
      assignExaminer3(item.id, activeP3);
    }

    const res = assignSchedule(item.id, targetDate, selectedSlotId, selectedRoomId);
    if (res.success) {
      onClose();
    }
  };

  const effectiveItem = {
    ...item,
    examiner3Id: isSeminar ? '' : activeP3,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isSeminar ? 'Pilih Slot Seminar Manual' : 'Pilih Slot Sidang Manual'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tentukan tanggal, jam, dan ruangan bebas bentrok untuk mahasiswa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Info Card */}
        <div className="p-5 border-b border-slate-100 bg-indigo-50/40">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-sm font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200">
              {item.nim}
            </span>
            <span className="text-sm font-bold text-slate-900 uppercase">{item.studentName}</span>
            {item.thesisType && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                {item.thesisType}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 line-clamp-1 italic">"{item.thesisTitle}"</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-indigo-100/60">
            <div>
              <span className="text-xs font-semibold text-indigo-700">
                {isSeminar ? 'Reviewer:' : 'Ketua (Reviewer):'}
              </span>
              <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                {lecturerMap.get(item.examiner1Id) || (isSeminar ? item.reviewerName : null) || '-'}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-sky-700">
                {isSeminar ? 'Pembimbing:' : 'Penguji 2 (Pembimbing):'}
              </span>
              <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">{lecturerMap.get(item.examiner2Id) || '-'}</p>
            </div>
            {!isSeminar && (
              <div>
                <span className="text-xs font-semibold text-teal-700">Penguji 3:</span>
                <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">{lecturerMap.get(activeP3) || 'Pilih di bawah'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Penguji 3 Selector — hanya untuk Sidang, bukan Seminar */}
        {!isSeminar && (!item.examiner3Id || item.examiner3Id === '') && (
          <div className="px-5 py-3.5 bg-teal-50/70 border-b border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-sm font-bold text-teal-950">Alokasikan Dosen Penguji 3:</span>
              </div>
              <span className="text-[11px] text-teal-700 block mt-0.5">
                Prioritas proporsional: semakin sedikit menjadi Reviewer/Pembimbing, semakin tinggi proporsinya.
              </span>
            </div>
            <select
              value={activeP3}
              onChange={(e) => setSelectedExaminer3(e.target.value)}
              className="text-xs sm:text-sm font-semibold bg-white border border-teal-300 rounded-xl px-3 h-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400/30 shrink-0"
            >
              {candidatesP3.map(c => (
                <option key={c.lecturer.id} value={c.lecturer.id}>
                  {c.lecturer.name} (P1/P2: {c.primaryLoad} • P3: {c.examiner3Count} • Proporsi: {c.proportionLabel})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Selector via Calendar Picker */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Tanggal Pelaksanaan:</label>
            <p className="text-xs text-slate-400 mt-0.5">Pilih tanggal untuk melihat ketersediaan slot ruangan</p>
          </div>
          <CalendarDatePicker
            value={targetDate}
            onChange={(newDate) => setTargetDate(newDate)}
            highlightedDates={scheduledDates}
            dateCounts={matrixCardCountsByDate}
            allowAll={false}
            align="right"
          />
        </div>

        {/* Matrix of Slots with Conflict Detection */}
        <div className="p-5 max-h-[340px] overflow-y-auto">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Pilih Kombinasi Slot Waktu & Ruangan Bebas Bentrok:
          </label>

          <div className="space-y-3">
            {timeSlots.map(slot => (
              <div key={slot.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-800 mb-2 font-mono flex items-center justify-between">
                  <span>Slot Waktu: {slot.label}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {rooms.map(room => {
                    const validation = checkScheduleConflict(
                      effectiveItem,
                      targetDate,
                      slot.id,
                      room.id,
                      schedules,
                      lecturers,
                      rooms
                    );

                    const isSelected = selectedSlotId === slot.id && selectedRoomId === room.id;
                    const isConflict = validation.hasConflict;

                    return (
                      <button
                        key={room.id}
                        type="button"
                        disabled={isConflict}
                        onClick={() => {
                          setSelectedSlotId(slot.id);
                          setSelectedRoomId(room.id);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all relative ${
                          isConflict
                            ? 'bg-rose-50/60 border-rose-200 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/40'
                            : 'bg-white hover:bg-emerald-50/60 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {room.name}
                          </span>
                          {isConflict ? (
                            <Lock className="w-3 h-3 text-rose-500" />
                          ) : (
                            <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                          )}
                        </div>

                        <p className={`text-[10px] leading-tight line-clamp-2 ${
                          isSelected ? 'text-indigo-100' : isConflict ? 'text-rose-700' : 'text-emerald-700 font-medium'
                        }`}>
                          {isConflict ? validation.reasons[0] : 'Tersedia (Bebas)'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <span className="text-sm text-slate-500">
            {selectedSlotId && selectedRoomId ? (
              <span className="text-indigo-700 font-semibold">
                ✓ Slot terpilih: {timeSlots.find(t => t.id === selectedSlotId)?.label} — Ruang {rooms.find(r => r.id === selectedRoomId)?.name}
              </span>
            ) : (
              'Klik salah satu slot hijau di atas untuk memilih'
            )}
          </span>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onClose}
              className="h-10 px-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedSlotId || !selectedRoomId}
              className="m3-btn-primary"
            >
              <span>Tetapkan Jadwal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
