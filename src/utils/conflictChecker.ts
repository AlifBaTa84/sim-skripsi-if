import { ScheduleItem, Lecturer, Room, ConflictCheckResult } from '../types';

/**
 * Validates whether a student's thesis session can be placed in a specific date, time slot, and room.
 * Checks for:
 * 1. Room occupancy
 * 2. Examiner 1 availability (across all rooms at this time slot)
 * 3. Examiner 2 availability (across all rooms at this time slot)
 * 4. Examiner 3 availability (across all rooms at this time slot)
 * 5. Student double booking
 */
export function checkScheduleConflict(
  item: ScheduleItem,
  targetDate: string,
  targetTimeSlotId: string,
  targetRoomId: string,
  allSchedules: ScheduleItem[],
  lecturers: Lecturer[],
  rooms: Room[]
): ConflictCheckResult {
  const reasons: string[] = [];
  const roomMap = new Map<string, Room>(rooms.map(r => [r.id, r]));
  const lecturerMap = new Map<string, Lecturer>(lecturers.map(l => [l.id, l]));

  const targetRoom = roomMap.get(targetRoomId);
  const targetRoomName = targetRoom ? targetRoom.name : 'Ruangan ini';

  // Get all other schedules occurring at the exact same date and time slot
  const concurrentSchedules = allSchedules.filter(s => 
    s.id !== item.id && // Ignore self if moving from another cell
    (s.status === 'scheduled' || s.status === 'completed') &&
    s.date === targetDate &&
    s.timeSlotId === targetTimeSlotId
  );

  // 1. Check if the target room is already occupied
  const roomOccupant = concurrentSchedules.find(s => s.roomId === targetRoomId);
  if (roomOccupant) {
    reasons.push(
      `Ruangan ${targetRoomName} sudah terisi oleh ${roomOccupant.studentName} (${roomOccupant.nim}).`
    );
  }

  // Helper to test if a lecturer ID is busy in concurrent sessions
  const checkLecturerBusy = (lecturerId: string, roleTitle: string) => {
    if (!lecturerId) return;
    const lecturer = lecturerMap.get(lecturerId);
    const lecturerName = lecturer ? lecturer.name : 'Dosen Penguji';

    for (const schedule of concurrentSchedules) {
      const isOccupiedAsP1 = schedule.examiner1Id === lecturerId;
      const isOccupiedAsP2 = schedule.examiner2Id === lecturerId;
      const isOccupiedAsP3 = schedule.examiner3Id === lecturerId;

      if (isOccupiedAsP1 || isOccupiedAsP2 || isOccupiedAsP3) {
        const occRoom = roomMap.get(schedule.roomId || '')?.name || 'Ruangan lain';
        const asRole = isOccupiedAsP1 ? 'Penguji 1' : isOccupiedAsP2 ? 'Penguji 2' : 'Penguji 3';
        reasons.push(
          `${roleTitle} (${lecturerName}) BENTROK: Sedang bertugas sebagai ${asRole} untuk ${schedule.studentName} di ruang ${occRoom}.`
        );
        break; // One conflict mention per examiner is enough
      }
    }
  };

  // 2. Check Examiner 1
  checkLecturerBusy(item.examiner1Id, 'Penguji 1');

  // 3. Check Examiner 2
  checkLecturerBusy(item.examiner2Id, 'Penguji 2');

  // 4. Check Examiner 3
  checkLecturerBusy(item.examiner3Id, 'Penguji 3');

  // 5. Check if the student is already scheduled at this slot
  const studentDoubleBooked = concurrentSchedules.find(s => s.nim === item.nim);
  if (studentDoubleBooked) {
    reasons.push(`Mahasiswa ${item.studentName} (${item.nim}) sudah terjadwal di ruangan lain pada slot waktu ini.`);
  }

  return {
    hasConflict: reasons.length > 0,
    reasons,
  };
}

/**
 * Audit all schedules to find any existing conflicts in the current dataset
 */
export function auditAllSchedules(
  schedules: ScheduleItem[],
  lecturers: Lecturer[],
  rooms: Room[]
): { scheduleId: string; reasons: string[] }[] {
  const conflicts: { scheduleId: string; reasons: string[] }[] = [];
  const scheduledList = schedules.filter(s => (s.status === 'scheduled' || s.status === 'completed') && s.timeSlotId && s.roomId);

  for (const item of scheduledList) {
    const result = checkScheduleConflict(
      item,
      item.date,
      item.timeSlotId!,
      item.roomId!,
      schedules,
      lecturers,
      rooms
    );
    if (result.hasConflict) {
      conflicts.push({
        scheduleId: item.id,
        reasons: result.reasons,
      });
    }
  }

  return conflicts;
}

/**
 * Finds all conflict-free slots for a student item on a specified date
 */
export function findAvailableSlotsForStudent(
  item: ScheduleItem,
  targetDate: string,
  rooms: Room[],
  timeSlots: { id: string; label: string }[],
  allSchedules: ScheduleItem[],
  lecturers: Lecturer[]
): { roomId: string; roomName: string; timeSlotId: string; timeSlotLabel: string }[] {
  const availableSlots: { roomId: string; roomName: string; timeSlotId: string; timeSlotLabel: string }[] = [];

  for (const slot of timeSlots) {
    for (const room of rooms) {
      const validation = checkScheduleConflict(
        item,
        targetDate,
        slot.id,
        room.id,
        allSchedules,
        lecturers,
        rooms
      );
      if (!validation.hasConflict) {
        availableSlots.push({
          roomId: room.id,
          roomName: room.name,
          timeSlotId: slot.id,
          timeSlotLabel: slot.label,
        });
      }
    }
  }

  return availableSlots;
}

