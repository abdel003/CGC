import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  toastError,
  insertRowsMock,
  deleteRowsMock,
  updateRowsMock,
} = vi.hoisted(() => ({
  toastError: vi.fn(),
  insertRowsMock: vi.fn(),
  deleteRowsMock: vi.fn(),
  updateRowsMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
  },
}));

vi.mock('@/lib/supabase', () => ({
  insertRows: insertRowsMock,
  deleteRows: deleteRowsMock,
  updateRows: updateRowsMock,
  isSupabaseConfigured: true,
}));

vi.mock('@/lib/appData', () => ({
  fetchAppData: vi.fn(),
  fetchPayrollDetails: vi.fn(),
  fetchAttendanceRecords: vi.fn(),
}));

import { useAppStore } from '@/store/useAppStore';
import { createDefaultSettings } from '@/store/settings.storage';
import type { AttendanceRecord, PayrollSummary, Worker } from '@/types';

const worker: Worker = {
  id: 'worker-1',
  nombre: 'Ana Perez',
  cedula: '8-123-456',
  salarioHora: 10,
  tipoPago: 'bisemanal',
  cargo: 'Operaria',
  estado: 'activo',
  fechaIngreso: '2026-01-01',
  proyectoId: 'project-1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const payroll: PayrollSummary = {
  id: 'temp-payroll',
  fechaInicio: '2026-04-01',
  fechaFin: '2026-04-15',
  proyectoId: 'project-1',
  proyectoNombre: 'Proyecto Norte',
  totalTrabajadores: 1,
  totalDevengado: 500,
  totalDeducciones: 50,
  totalISR: 25,
  totalPagado: 425,
  createdAt: '2026-04-15T00:00:00.000Z',
  detalles: [
    {
      trabajadorId: 'worker-1',
      trabajador: worker,
      proyectoId: 'project-1',
      proyectoNombre: 'Proyecto Norte',
      diasTrabajados: 5,
      domingosTrabajados: 1,
      horasExtraTotal: 2,
      salarioBase: 400,
      pagoDomingos: 50,
      pagoHorasExtra: 25,
      totalDevengado: 475,
      deduccionesDetalle: [
        {
          deduccionId: 'ded-1',
          nombre: 'Seguro Social',
          tipo: 'porcentaje',
          valor: 10,
          monto: 47.5,
        },
      ],
      deducciones: 47.5,
      isr: 25,
      isrAnual: 500,
      ingresoAnualizado: 12000,
      totalPagado: 402.5,
      registrosDiarios: [],
    },
  ],
};

function resetStore() {
  useAppStore.setState({
    empresaId: 'empresa-1',
    isConfigured: true,
    loading: false,
    initialized: true,
    error: null,
    projects: [],
    workers: [worker],
    attendance: [],
    deductions: [],
    savedPayrolls: [],
    settings: createDefaultSettings(),
    fetchedWorkerIds: new Set(),
    fetchedDates: new Set(),
  });
}

describe('useAppStore mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    resetStore();
  });

  it('rolls back attendance when syncing fails', async () => {
    const record: AttendanceRecord = {
      id: 'att-1',
      trabajadorId: 'worker-1',
      fecha: '2026-04-02',
      estado: 'asistio',
      horasTrabajadas: 8,
      horasExtra: 0,
      proyectoId: 'project-1',
    };

    insertRowsMock.mockRejectedValueOnce(new Error('fallo asistencia'));

    await expect(useAppStore.getState().setAttendance(record)).rejects.toThrow('fallo asistencia');

    expect(useAppStore.getState().attendance).toEqual([]);
    expect(toastError).toHaveBeenCalledWith('fallo asistencia');
  });

  it('saves payroll and appends the inserted payroll id locally', async () => {
    insertRowsMock
      .mockResolvedValueOnce([{ id: 'planilla-1' }])
      .mockResolvedValueOnce([{ id: 'detalle-1' }])
      .mockResolvedValueOnce([{ id: 'deduccion-1' }, { id: 'deduccion-2' }]);

    await useAppStore.getState().savePayroll(payroll);

    expect(insertRowsMock).toHaveBeenNthCalledWith(
      1,
      'planillas',
      expect.objectContaining({
        empresa_id: 'empresa-1',
        fecha_inicio: '2026-04-01',
        fecha_fin: '2026-04-15',
        estado: 'cerrada',
      }),
    );
    expect(insertRowsMock).toHaveBeenNthCalledWith(
      2,
      'planilla_detalles',
      expect.arrayContaining([
        expect.objectContaining({
          planilla_id: 'planilla-1',
          trabajador_id: 'worker-1',
          trabajador_nombre: 'Ana Perez',
        }),
      ]),
    );
    expect(insertRowsMock).toHaveBeenNthCalledWith(
      3,
      'planilla_detalle_deducciones',
      expect.arrayContaining([
        expect.objectContaining({
          planilla_detalle_id: 'detalle-1',
          nombre: 'Seguro Social',
        }),
        expect.objectContaining({
          planilla_detalle_id: 'detalle-1',
          nombre: 'Impuesto sobre la Renta',
          deduccion_config_id: null,
        }),
      ]),
    );
    expect(useAppStore.getState().savedPayrolls[0]).toMatchObject({
      id: 'planilla-1',
      fechaInicio: '2026-04-01',
    });
  });

  it('rolls back deleted payroll when backend deletion fails', async () => {
    useAppStore.setState({
      savedPayrolls: [
        { ...payroll, id: 'planilla-1' },
        { ...payroll, id: 'planilla-2' },
      ],
    });
    deleteRowsMock.mockRejectedValueOnce(new Error('fallo delete'));

    await expect(useAppStore.getState().deletePayroll('planilla-1')).rejects.toThrow('fallo delete');

    expect(useAppStore.getState().savedPayrolls.map((item) => item.id)).toEqual(['planilla-1', 'planilla-2']);
    expect(toastError).toHaveBeenCalledWith('fallo delete');
  });
});
