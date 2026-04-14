import type { AppSettings, DiaEspecialConfig } from '@/types';

const ISR_STORAGE_KEY = 'cgc_isr_habilitado';
const DIAS_ESPECIALES_STORAGE_KEY = 'cgc_dias_especiales';

export function getStoredISRHabilitado(): boolean {
  const stored = localStorage.getItem(ISR_STORAGE_KEY);
  return stored === null ? true : stored === 'true';
}

export function getStoredDiasEspeciales(): DiaEspecialConfig[] {
  const stored = localStorage.getItem(DIAS_ESPECIALES_STORAGE_KEY);
  if (stored === null) return [];

  try {
    return JSON.parse(stored) as DiaEspecialConfig[];
  } catch {
    return [];
  }
}

export function createDefaultSettings(): AppSettings {
  return {
    nombreEmpresa: '',
    idEmpresa: '',
    multiplicadorHorasExtra: 1.5,
    isrHabilitado: getStoredISRHabilitado(),
    diasEspeciales: getStoredDiasEspeciales(),
  };
}

export function persistISRHabilitado(value: boolean) {
  localStorage.setItem(ISR_STORAGE_KEY, String(value));
}

export function persistDiasEspeciales(value: DiaEspecialConfig[]) {
  localStorage.setItem(DIAS_ESPECIALES_STORAGE_KEY, JSON.stringify(value));
}
