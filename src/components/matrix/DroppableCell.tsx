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
}

export const DroppableCell: React.FC<DroppableCellProps> = ({
  slot,
  room,
  item,
  lecturers,
  onClickEmpty,
  onAssignExaminer3,
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
                  <div className="w-8 h-8 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center shadow-xs">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-rose-800 tracking-tight">
                    Bentrok Jadwal!
                  </span>
                  {isOver && liveValidation?.reasons[0] && (
                    <p className="text-[10px] text-rose-700 font-medium leading-tight max-w-[170px] bg-white/90 p-1.5 rounded-md border border-rose-300 shadow-xs">
                      {liveValidation.reasons[0]}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 tracking-tight">
                    Bebas Bentrok
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {isOver ? 'Lepas di sini untuk pasang' : 'Tersedia'}
                  </span>
                </>
              )}
            </div>
          ) : (
            /* Idle empty state: Show click-to-schedule hint */
            <div className="flex flex-col items-center justify-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
              {/* Plus icon visible on hover */}
              <div className="w-9 h-9 rounded-full border-2 border-dashed border-slate-200 group-hover:border-indigo-400 flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <div className="space-y-0.5 text-center">
                <span className="text-[11px] font-bold block text-slate-400 group-hover:text-indigo-600 transition-colors">
                  Slot Tersedia
                </span>
                <span className="text-[10px] font-medium text-slate-300 group-hover:text-indigo-400 transition-colors flex items-center justify-center gap-1">
                  <MousePointerClick className="w-3 h-3" />
                  Klik atau seret ke sini
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hover conflict tooltip overlay if hovering on an occupied slot that creates a conflict */}
      {isOver && isConflict && item && (
        <div className="absolute inset-0 bg-rose-950/85 backdrop-blur-xs rounded-xl p-3 flex flex-col items-center justify-center text-center text-white z-20 animate-in fade-in duration-150">
          <AlertOctagon className="w-6 h-6 text-rose-400 mb-1" />
          <span className="text-xs font-bold text-rose-200">Slot Penuh / Bentrok</span>
          <p className="text-[10px] text-rose-100 mt-1 max-w-[190px] leading-tight">
            {liveValidation?.reasons[0] || 'Ruangan ini sudah terisi jadwal lain'}
          </p>
        </div>
      )}
    </div>
  );
};
