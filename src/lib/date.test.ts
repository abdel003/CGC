import { describe, expect, it } from 'vitest';
import { formatLocalDate, shiftDate } from '@/lib/date';

describe('date helpers', () => {
  it('formats dates without converting them to UTC', () => {
    const date = new Date(2026, 3, 2, 23, 30, 0);

    expect(formatLocalDate(date)).toBe('2026-04-02');
  });

  it('shifts a YYYY-MM-DD date safely across month boundaries', () => {
    expect(shiftDate('2026-03-31', 1)).toBe('2026-04-01');
    expect(shiftDate('2026-04-01', -1)).toBe('2026-03-31');
  });
});
