import type {
  AppSettings,
  AttendanceRecord,
  DeductionConfig,
  DeductionDetail,
  PayrollDetail,
  Worker,
} from '@/types';

interface CalculatePayrollOptions {
  attendance: AttendanceRecord[];
  deductions: DeductionConfig[];
  fechaInicio: string;
  fechaFin: string;
  projectsMap: Map<string, string>;
  selectedProjectId: string;
  settings: AppSettings;
  workers: Worker[];
}

export function calculateAnnualizedIncome(totalDevengado: number, fechaInicio: string, fechaFin: string) {
  const diasPeriodo = Math.max(
    1,
    (new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24) + 1,
  );

  return {
    diasPeriodo,
    ingresoAnualizado: (totalDevengado / diasPeriodo) * 365,
  };
}

export function calculateISRAnnual(ingresoAnualizado: number) {
  if (ingresoAnualizado > 50000) {
    return 5850 + (ingresoAnualizado - 50000) * 0.25;
  }

  if (ingresoAnualizado > 11000) {
    return (ingresoAnualizado - 11000) * 0.15;
  }

  return 0;
}

export function calculatePayrollDetails({
  attendance,
  deductions,
  fechaInicio,
  fechaFin,
  projectsMap,
  selectedProjectId,
  settings,
  workers,
}: CalculatePayrollOptions): PayrollDetail[] {
  const activeWorkers = workers.filter((worker) => worker.estado === 'activo');
  const enabledDeductions = deductions.filter((deduction) => deduction.habilitado);
  const attendanceByWorker = new Map<string, AttendanceRecord[]>();

  for (const record of attendance) {
    if (record.fecha >= fechaInicio && record.fecha <= fechaFin) {
      if (!attendanceByWorker.has(record.trabajadorId)) {
        attendanceByWorker.set(record.trabajadorId, []);
      }
      attendanceByWorker.get(record.trabajadorId)!.push(record);
    }
  }

  return activeWorkers
    .map((worker): PayrollDetail => {
      const records = (attendanceByWorker.get(worker.id) || []).filter((record) => {
        if (selectedProjectId === 'todos') return true;

        return (
          record.proyectoId === selectedProjectId ||
          (!record.proyectoId && worker.proyectoId === selectedProjectId)
        );
      });

      const diasAsistidos = records.filter((record) => record.estado === 'asistio');
      const diasTrabajados = diasAsistidos.length;
      const horasTrabajadasTotal = records.reduce((sum, record) => sum + (Number(record.horasTrabajadas) || 0), 0);
      const horasExtraTotal = records.reduce((sum, record) => sum + (Number(record.horasExtra) || 0), 0);
      const salarioHora = Number(worker.salarioHora) || 0;
      const salarioBase = horasTrabajadasTotal * salarioHora;

      let pagoDomingos = 0;
      let domingosTrabajados = 0;
      const diasEspecialesMap = new Map((settings.diasEspeciales || []).map((item) => [item.fecha, item.multiplicador]));

      for (const record of records) {
        if (record.estado !== 'asistio') continue;

        const multiplicador = diasEspecialesMap.get(record.fecha);
        if (multiplicador && multiplicador > 1) {
          domingosTrabajados++;
          pagoDomingos += (multiplicador - 1) * (Number(record.horasTrabajadas) || 0) * salarioHora;
        }
      }

      const pagoHorasExtra = horasExtraTotal * salarioHora * (Number(settings.multiplicadorHorasExtra) || 1.5);
      const totalDevengado = salarioBase + pagoDomingos + pagoHorasExtra;

      const { diasPeriodo, ingresoAnualizado } = calculateAnnualizedIncome(totalDevengado, fechaInicio, fechaFin);

      const isrAnual = settings.isrHabilitado ? calculateISRAnnual(ingresoAnualizado) : 0;

      const isr = settings.isrHabilitado ? (isrAnual / 365) * diasPeriodo : 0;

      const deduccionesDetalle: DeductionDetail[] = enabledDeductions.map((deduction) => {
        const monto = deduction.tipo === 'porcentaje' ? totalDevengado * (deduction.valor / 100) : deduction.valor;

        return {
          deduccionId: deduction.id,
          nombre: deduction.nombre,
          tipo: deduction.tipo,
          valor: deduction.valor,
          monto,
        };
      });

      const totalDeducciones = deduccionesDetalle.reduce((sum, detail) => sum + detail.monto, 0);
      const totalPagado = totalDevengado - totalDeducciones - isr;
      const proyectoId =
        selectedProjectId === 'todos'
          ? records[0]?.proyectoId || worker.proyectoId || null
          : selectedProjectId;

      return {
        trabajadorId: worker.id,
        trabajador: worker,
        proyectoId,
        proyectoNombre: proyectoId ? projectsMap.get(proyectoId) || 'Proyecto no encontrado' : 'Sin proyecto',
        diasTrabajados,
        domingosTrabajados,
        horasExtraTotal,
        salarioBase,
        pagoDomingos,
        pagoHorasExtra,
        totalDevengado,
        deduccionesDetalle,
        deducciones: totalDeducciones,
        isr,
        isrAnual,
        ingresoAnualizado,
        totalPagado,
        registrosDiarios: records,
      };
    })
    .filter((detail) => detail.registrosDiarios.length > 0 || selectedProjectId === 'todos');
}

export function calculatePayrollTotals(details: PayrollDetail[]) {
  return details.reduce(
    (acc, detail) => ({
      devengado: acc.devengado + detail.totalDevengado,
      deducciones: acc.deducciones + detail.deducciones,
      isr: acc.isr + (detail.isr || 0),
      pagado: acc.pagado + detail.totalPagado,
    }),
    { devengado: 0, deducciones: 0, isr: 0, pagado: 0 },
  );
}
