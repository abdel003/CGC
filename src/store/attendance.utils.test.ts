import { describe, expect, it } from 'vitest';
import type { AttendanceRecord } from '@/types';
import {
  replaceAttendanceForDate,
  replaceAttendanceForRange,
  replaceAttendanceForWorker,
  upsertAttendanceRecord,
  upsertAttendanceRecords,
} from '@/store/attendance.utils';

const baseRecord = (overrides: Partial<AttendanceRecord>): AttendanceRecord => ({
  id: 'record-1',
  trabajadorId: 'worker-1',
  fecha: '2026-04-01',
  estado: 'asistio',
  horasTrabajadas: 8,
  horasExtra: 0,
  ...overrides,
});

describe('attendance utils', () => {
  it('upserts a single record by worker and date', () => {
    const attendance = [baseRecord({ horasTrabajadas: 8 })];
    const next = upsertAttendanceRecord(attendance, baseRecord({ id: 'record-2', horasTrabajadas: 6 }));

    expect(next).toHaveLength(1);
    expect(next[0].id).toBe('record-2');
    expect(next[0].horasTrabajadas).toBe(6);
  });

  it('upserts multiple records without duplicating keys', () => {
    const attendance = [baseRecord({ id: 'original' })];
    const next = upsertAttendanceRecords(attendance, [
      baseRecord({ id: 'updated', horasExtra: 2 }),
      baseRecord({ id: 'new', trabajadorId: 'worker-2', fecha: '2026-04-02' }),
    ]);

    expect(next).toHaveLength(2);
    expect(next.find((item) => item.trabajadorId === 'worker-1')?.id).toBe('updated');
    expect(next.find((item) => item.trabajadorId === 'worker-2')).toBeTruthy();
  });

  it('replaces slices cleanly by date, worker, and range', () => {
    const attendance = [
      baseRecord({ id: 'a', fecha: '2026-04-01', trabajadorId: 'worker-1' }),
      baseRecord({ id: 'b', fecha: '2026-04-02', trabajadorId: 'worker-1' }),
      baseRecord({ id: 'c', fecha: '2026-04-03', trabajadorId: 'worker-2' }),
    ];

    expect(replaceAttendanceForDate(attendance, '2026-04-01', [baseRecord({ id: 'd', fecha: '2026-04-01' })])).toHaveLength(3);
    expect(replaceAttendanceForWorker(attendance, 'worker-1', [baseRecord({ id: 'e', trabajadorId: 'worker-1', fecha: '2026-04-05' })])).toHaveLength(2);
    expect(replaceAttendanceForRange(attendance, '2026-04-01', '2026-04-02', [baseRecord({ id: 'f', fecha: '2026-04-02' })])).toHaveLength(2);
  });
});
