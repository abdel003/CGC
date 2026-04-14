import { beforeEach, describe, expect, it } from 'vitest';
import {
  createDefaultSettings,
  getStoredDiasEspeciales,
  getStoredISRHabilitado,
  persistDiasEspeciales,
  persistISRHabilitado,
} from '@/store/settings.storage';

describe('settings storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns sensible defaults when storage is empty', () => {
    expect(getStoredISRHabilitado()).toBe(true);
    expect(getStoredDiasEspeciales()).toEqual([]);
    expect(createDefaultSettings()).toMatchObject({
      multiplicadorHorasExtra: 1.5,
      isrHabilitado: true,
      diasEspeciales: [],
    });
  });

  it('persists and restores isr and special days', () => {
    persistISRHabilitado(false);
    persistDiasEspeciales([{ fecha: '2026-11-03', multiplicador: 2 }]);

    expect(getStoredISRHabilitado()).toBe(false);
    expect(getStoredDiasEspeciales()).toEqual([{ fecha: '2026-11-03', multiplicador: 2 }]);
  });
});
