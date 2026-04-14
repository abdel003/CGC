import { describe, expect, it } from 'vitest';
import {
  calculateAnnualizedIncome,
  calculateISRAnnual,
  calculatePayrollDetails,
  calculatePayrollTotals,
} from '@/lib/payroll';
import type { AppSettings, AttendanceRecord, DeductionConfig, Worker } from '@/types';

const workers: Worker[] = [
  {
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
  },
];

const attendance: AttendanceRecord[] = [
  {
    id: 'att-1',
    trabajadorId: 'worker-1',
    fecha: '2026-04-01',
    estado: 'asistio',
    horasTrabajadas: 8,
    horasExtra: 2,
    proyectoId: 'project-1',
  },
  {
    id: 'att-2',
    trabajadorId: 'worker-1',
    fecha: '2026-04-02',
    estado: 'asistio',
    horasTrabajadas: 8,
    horasExtra: 0,
    proyectoId: 'project-1',
  },
];

const deductions: DeductionConfig[] = [
  {
    id: 'ded-1',
    nombre: 'Seguro Social',
    tipo: 'porcentaje',
    valor: 10,
    habilitado: true,
  },
];

const settings: AppSettings = {
  nombreEmpresa: 'CGC',
  idEmpresa: '123',
  multiplicadorHorasExtra: 1.5,
  isrHabilitado: true,
  diasEspeciales: [{ fecha: '2026-04-02', multiplicador: 2 }],
};

describe('payroll calculations', () => {
  it('calculates payroll details including overtime, special days, deductions, and isr', () => {
    const details = calculatePayrollDetails({
      attendance,
      deductions,
      fechaInicio: '2026-04-01',
      fechaFin: '2026-04-02',
      projectsMap: new Map([['project-1', 'Proyecto Norte']]),
      selectedProjectId: 'todos',
      settings,
      workers,
    });

    expect(details).toHaveLength(1);
    expect(details[0].salarioBase).toBe(160);
    expect(details[0].pagoHorasExtra).toBe(30);
    expect(details[0].pagoDomingos).toBe(80);
    expect(details[0].deducciones).toBe(27);
    expect(details[0].isr).toBeGreaterThan(0);
    expect(details[0].totalPagado).toBeLessThan(details[0].totalDevengado);
  });

  it('aggregates totals from calculated details', () => {
    const details = calculatePayrollDetails({
      attendance,
      deductions,
      fechaInicio: '2026-04-01',
      fechaFin: '2026-04-02',
      projectsMap: new Map([['project-1', 'Proyecto Norte']]),
      selectedProjectId: 'todos',
      settings,
      workers,
    });

    const totals = calculatePayrollTotals(details);

    expect(totals.devengado).toBe(details[0].totalDevengado);
    expect(totals.deducciones).toBe(details[0].deducciones);
    expect(totals.isr).toBe(details[0].isr);
    expect(totals.pagado).toBe(details[0].totalPagado);
  });

  it('filters payroll by selected project and excludes unmatched records', () => {
    const details = calculatePayrollDetails({
      attendance: [
        ...attendance,
        {
          id: 'att-3',
          trabajadorId: 'worker-1',
          fecha: '2026-04-03',
          estado: 'asistio',
          horasTrabajadas: 8,
          horasExtra: 0,
          proyectoId: 'project-2',
        },
      ],
      deductions,
      fechaInicio: '2026-04-01',
      fechaFin: '2026-04-03',
      projectsMap: new Map([
        ['project-1', 'Proyecto Norte'],
        ['project-2', 'Proyecto Sur'],
      ]),
      selectedProjectId: 'project-2',
      settings,
      workers,
    });

    expect(details).toHaveLength(1);
    expect(details[0].proyectoId).toBe('project-2');
    expect(details[0].diasTrabajados).toBe(1);
    expect(details[0].salarioBase).toBe(80);
  });

  it('returns zero isr when the setting is disabled', () => {
    const details = calculatePayrollDetails({
      attendance,
      deductions,
      fechaInicio: '2026-04-01',
      fechaFin: '2026-04-02',
      projectsMap: new Map([['project-1', 'Proyecto Norte']]),
      selectedProjectId: 'todos',
      settings: { ...settings, isrHabilitado: false },
      workers,
    });

    expect(details[0].isr).toBe(0);
    expect(details[0].isrAnual).toBe(0);
  });
});

describe('payroll helper calculations', () => {
  it('calculates annualized income from a date range', () => {
    const result = calculateAnnualizedIncome(200, '2026-04-01', '2026-04-05');

    expect(result.diasPeriodo).toBe(5);
    expect(result.ingresoAnualizado).toBe(14600);
  });

  it('applies the exempt, 15%, and 25% isr brackets correctly', () => {
    expect(calculateISRAnnual(11000)).toBe(0);
    expect(calculateISRAnnual(12000)).toBe(150);
    expect(calculateISRAnnual(60000)).toBe(8350);
  });
});
