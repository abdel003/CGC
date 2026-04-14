import type { AttendanceRecord } from '@/types';

export function withAttendanceId(record: Omit<AttendanceRecord, 'id'> | AttendanceRecord): AttendanceRecord {
  return {
    id: (record as AttendanceRecord).id || crypto.randomUUID(),
    ...record,
  } as AttendanceRecord;
}

export function upsertAttendanceRecord(
  attendance: AttendanceRecord[],
  record: AttendanceRecord,
): AttendanceRecord[] {
  const existingIdx = attendance.findIndex(
    (item) => item.trabajadorId === record.trabajadorId && item.fecha === record.fecha,
  );

  if (existingIdx === -1) {
    return [...attendance, record];
  }

  const nextAttendance = [...attendance];
  nextAttendance[existingIdx] = record;
  return nextAttendance;
}

export function upsertAttendanceRecords(
  attendance: AttendanceRecord[],
  records: AttendanceRecord[],
): AttendanceRecord[] {
  const attendanceMap = new Map<string, number>();
  const nextAttendance = [...attendance];

  nextAttendance.forEach((record, index) => {
    attendanceMap.set(`${record.trabajadorId}_${record.fecha}`, index);
  });

  records.forEach((record) => {
    const key = `${record.trabajadorId}_${record.fecha}`;
    const existingIdx = attendanceMap.get(key);

    if (existingIdx !== undefined) {
      nextAttendance[existingIdx] = record;
      return;
    }

    nextAttendance.push(record);
    attendanceMap.set(key, nextAttendance.length - 1);
  });

  return nextAttendance;
}

export function replaceAttendanceForDate(
  attendance: AttendanceRecord[],
  date: string,
  records: AttendanceRecord[],
): AttendanceRecord[] {
  return [...attendance.filter((item) => item.fecha !== date), ...records];
}

export function replaceAttendanceForWorker(
  attendance: AttendanceRecord[],
  workerId: string,
  records: AttendanceRecord[],
): AttendanceRecord[] {
  return [...attendance.filter((item) => item.trabajadorId !== workerId), ...records];
}

export function replaceAttendanceForRange(
  attendance: AttendanceRecord[],
  start: string,
  end: string,
  records: AttendanceRecord[],
): AttendanceRecord[] {
  return [...attendance.filter((item) => item.fecha < start || item.fecha > end), ...records];
}
