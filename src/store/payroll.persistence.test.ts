import { describe, expect, it } from 'vitest';
import {
  buildPlanillaDetallePayload,
  buildPlanillaDeduccionPayload,
  buildPlanillaInsertPayload,
} from '@/store/payroll.persistence';
import type { PayrollSummary } from '@/types';

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
      trabajadorId: 'historico-1',
      trabajador: {
        id: 'historico-1',
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

describe('payroll persistence helpers', () => {
  it('builds the main payroll payload for insertion', () => {
    const payload = buildPlanillaInsertPayload('empresa-1', payroll);

    expect(payload).toEqual({
      empresa_id: 'empresa-1',
      proyecto_id: 'project-1',
      fecha_inicio: '2026-04-01',
      fecha_fin: '2026-04-15',
      total_trabajadores: 1,
      total_devengado: 500,
      total_deducciones: 50,
      total_pagado: 425,
      estado: 'cerrada',
    });
  });

  it('builds detail payloads and nulls historical worker ids', () => {
    const payload = buildPlanillaDetallePayload('planilla-1', payroll);

    expect(payload).toHaveLength(1);
    expect(payload[0].planilla_id).toBe('planilla-1');
    expect(payload[0].trabajador_id).toBeNull();
    expect(payload[0].trabajador_nombre).toBe('Ana Perez');
  });

  it('includes isr as an extra deduction payload when present', () => {
    const payload = buildPlanillaDeduccionPayload(['detalle-1'], payroll);

    expect(payload).toHaveLength(2);
    expect(payload[0].deduccion_config_id).toBe('ded-1');
    expect(payload[1]).toMatchObject({
      planilla_detalle_id: 'detalle-1',
      deduccion_config_id: null,
      nombre: 'Impuesto sobre la Renta',
      monto: 25,
    });
  });
});
