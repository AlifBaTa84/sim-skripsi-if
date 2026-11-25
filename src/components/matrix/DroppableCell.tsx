import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { TimeSlot, Room, ScheduleItem, Lecturer } from '../../types';
import { ScheduledCard } from './ScheduledCard';
import { CheckCircle2, AlertOctagon, Lock, Plus, MousePointerClick } from 'lucide-react';
import { checkScheduleConflict } from '../../utils/conflictChecker';
import { useSchedule } from '../../context/ScheduleContext';

interface DroppableCellProps {
  slot: TimeSlot;
  room: Room;
  item?: ScheduleItem;
  lecturers: Lecturer[];
  /** Called when an empty cell is clicked (admin quick-schedule) */
  onClickEmpty?: (slotId: string, roomId: string) => void;
  onAssignExaminer3?: (item: ScheduleItem) => void;
  onRecordSeminarResult?: (item: ScheduleItem) => void;
  onViewSeminarHistory?: (item: ScheduleItem) => void;
}

export const DroppableCell: React.FC<DroppableCellProps> = ({
  slot,
  room,
  item,
  lecturers,
  onClickEmpty,
  onAssignExaminer3,
  onRecordSeminarResult,
  onViewSeminarHistory,
}) => {
  const { activeDragItem, selectedDate, schedules, rooms } = useSchedule();

  const droppableId = `cell-${slot.id}-${room.id}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      type: 'cell',
      slotId: slot.id,
      roomId: room.id,
    },
  });

  // Calculate live conflict specifically for this cell if an item is being dragged
  const liveValidation = activeDragItem
    ? checkScheduleConflict(
        activeDragItem,
        selectedDate,
        slot.id,
        room.id,
        schedules,
        lecturers,
        rooms
      )
    : null;

  const isDraggingActive = !!activeDragItem;
  const isConflict = liveValidation?.hasConflict;
  const isValidDrop = isDraggingActive && !isConflict;

  // Handle click on empty cell (only when not dragging and cell is empty)
  const handleEmptyCellClick = () => {
    if (!isDraggingActive && !item && onClickEmpty) {
      onClickEmpty(slot.id, room.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleEmptyCellClick}
      className={`relative min-h-[160px] p-2.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
        // If user is hovering directly over this cell (drag)
        isOver
          ? isConflict
            ? 'bg-rose-100/90 border-rose-500 ring-2 ring-rose-500/30 scale-[1.01] shadow-lg'
            : 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-500/30 scale-[1.01] shadow-lg'
          // If dragging an item anywhere on the board (hint colors)
          : isDraggingActive
          ? isConflict
            ? 'bg-rose-50/40 border-rose-200/70 border-dashed'
            : 'bg-emerald-50/40 border-emerald-300 border-dashed hover:bg-emerald-50/70'
          // Default idle state — empty cells get a hover cursor + highlight
          : item
          ? 'bg-slate-50/70 border-slate-200/90'
          : 'bg-white border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer group'
      }`}
    >
      {/* If cell is occupied by a scheduled item */}
      {item ? (
        <div className="h-full flex flex-col">
          <ScheduledCard
            item={item}
            lecturers={lecturers}
            room={room}
            onAssignExaminer3={onAssignExaminer3}
            onRecordSeminarResult={onRecordSeminarResult}
            onViewSeminarHistory={onViewSeminarHistory}
          />
        </div>
      ) : (
        /* Empty Cell State */
        <div className="h-full flex flex-col items-center justify-center p-3 text-center">
          {/* While dragging: Show interactive feedback badge */}
          {isDraggingActive ? (
            <div className="flex flex-col items-center justify-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
              {isConflict ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-rose-700 leading-tight">
                    Bentrok Terdeteksi
                  </span>
                  <span className="text-[10px] text-rose-600 max-w-[180px] line-clamp-2">
                    {liveValidation?.reasons[0]}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs animate-bounce">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800">
                    Bebas Bentrok
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    Lepaskan di sini
                  </span>
                </>
              )}
            </div>
          ) : (
            /* Idle Empty Cell: Click to schedule prompt */
            <div className="flex flex-col items-center justify-center gap-1 text-slate-400 group-hover:text-indigo-600 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center transition-all duration-150">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Slot Kosong</span>
              <span className="text-[10px] text-slate-400 group-hover:text-indigo-500 flex items-center gap-0.5">
                <MousePointerClick className="w-3 h-3" />
                Klik untuk Jadwalkan
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
