import type { DeductionDetail, PayrollDetail, PayrollSummary } from '@/types';

interface PlanillaInsertPayload {
  empresa_id: string;
  proyecto_id: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  total_trabajadores: number;
  total_devengado: number;
  total_deducciones: number;
  total_pagado: number;
  estado: 'cerrada';
}

interface PlanillaDetalleInsertPayload {
  planilla_id: string;
  trabajador_id: string | null;
  proyecto_id: string | null;
  trabajador_nombre: string;
  trabajador_cedula: string | null;
  trabajador_cargo: string | null;
  trabajador_salario_diario: number;
  trabajador_tipo_pago: string;
  proyecto_nombre: string | null;
  dias_trabajados: number;
  domingos_trabajados: number;
  horas_extra_total: number;
  salario_base: number;
  pago_domingos: number;
  pago_horas_extra: number;
  total_devengado: number;
  total_deducciones: number;
  total_pagado: number;
}

interface PlanillaDeduccionInsertPayload {
  planilla_detalle_id: string;
  deduccion_config_id: string | null;
  nombre: string;
  tipo: string;
  valor: number;
  monto: number;
}

function buildPayrollDeductions(detail: PayrollDetail): DeductionDetail[] {
  const deductions = [...detail.deduccionesDetalle];

  if (detail.isr && detail.isr > 0) {
    deductions.push({
      deduccionId: 'isr-retencion',
      nombre: 'Impuesto sobre la Renta',
      tipo: 'fijo',
      valor: detail.isr,
      monto: detail.isr,
    });
  }

  return deductions;
}

export function buildPlanillaInsertPayload(empresaId: string, payroll: PayrollSummary): PlanillaInsertPayload {
  return {
    empresa_id: empresaId,
    proyecto_id: payroll.proyectoId || null,
    fecha_inicio: payroll.fechaInicio,
    fecha_fin: payroll.fechaFin,
    total_trabajadores: payroll.totalTrabajadores,
    total_devengado: payroll.totalDevengado,
    total_deducciones: payroll.totalDeducciones,
    total_pagado: payroll.totalPagado,
    estado: 'cerrada',
  };
}

export function buildPlanillaDetallePayload(planillaId: string, payroll: PayrollSummary): PlanillaDetalleInsertPayload[] {
  return payroll.detalles.map((detail) => ({
    planilla_id: planillaId,
    trabajador_id: detail.trabajadorId.startsWith('historico-') ? null : detail.trabajadorId,
    proyecto_id: detail.proyectoId || null,
    trabajador_nombre: detail.trabajador.nombre,
    trabajador_cedula: detail.trabajador.cedula || null,
    trabajador_cargo: detail.trabajador.cargo || null,
    trabajador_salario_diario: detail.trabajador.salarioHora,
    trabajador_tipo_pago: detail.trabajador.tipoPago,
    proyecto_nombre: detail.proyectoNombre || null,
    dias_trabajados: detail.diasTrabajados,
    domingos_trabajados: detail.domingosTrabajados || 0,
    horas_extra_total: detail.horasExtraTotal,
    salario_base: detail.salarioBase,
    pago_domingos: detail.pagoDomingos || 0,
    pago_horas_extra: detail.pagoHorasExtra,
    total_devengado: detail.totalDevengado,
    total_deducciones: detail.deducciones,
    total_pagado: detail.totalPagado,
  }));
}

export function buildPlanillaDeduccionPayload(
  insertedDetailIds: string[],
  payroll: PayrollSummary,
): PlanillaDeduccionInsertPayload[] {
  return payroll.detalles.flatMap((detail, index) => {
    const detailId = insertedDetailIds[index];
    if (!detailId) return [];

    return buildPayrollDeductions(detail).map((deduction) => ({
      planilla_detalle_id: detailId,
      deduccion_config_id: deduction.deduccionId === 'isr-retencion' ? null : deduction.deduccionId,
      nombre: deduction.nombre,
      tipo: deduction.tipo,
      valor: deduction.valor,
      monto: deduction.monto,
    }));
  });
}
