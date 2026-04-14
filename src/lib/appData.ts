import { insertRows, selectRows } from '@/lib/supabase';
import type { Filter } from '@/lib/supabase';
import type {
  AppSettings,
  AttendanceRecord,
  AttendanceStatus,
  DeductionConfig,
  DeductionDetail,
  PayrollDetail,
  PayrollSummary,
  Project,
  Worker,
} from '@/types';

type EmpresaRow = {
  id: string;
  nombre: string;
  ruc: string | null;
  multiplicador_horas_extra: number;
  created_at: string;
  updated_at: string;
};

type ProyectoRow = {
  id: string;
  empresa_id: string;
  nombre: string;
  codigo: string | null;
  descripcion: string | null;
  ubicacion: string | null;
  estado: Project['estado'];
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
  updated_at: string;
};

type TrabajadorRow = {
  id: string;
  empresa_id: string;
  proyecto_id: string | null;
  nombre_completo: string;
  cedula: string;
  telefono: string | null;
  cargo: string;
  salario_diario: number;
  tipo_pago: Worker['tipoPago'];
  estado: Worker['estado'];
  fecha_ingreso: string;
  fecha_salida: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export type AsistenciaRow = {
  id: string;
  empresa_id: string;
  trabajador_id: string;
  proyecto_id: string | null;
  fecha: string;
  estado: AttendanceRecord['estado'];
  horas_trabajadas: number;
  horas_extra: number;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
};

type DeduccionConfigRow = {
  id: string;
  empresa_id: string;
  nombre: string;
  tipo: DeductionConfig['tipo'];
  valor: number;
  habilitado: boolean;
  descripcion: string | null;
  orden: number;
  created_at: string;
  updated_at: string;
};

type PlanillaRow = {
  id: string;
  empresa_id: string;
  proyecto_id: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  total_trabajadores: number;
  total_devengado: number;
  total_deducciones: number;
  total_pagado: number;
  created_at: string;
};

type PlanillaDetalleRow = {
  id: string;
  planilla_id: string;
  trabajador_id: string | null;
  proyecto_id: string | null;
  trabajador_nombre: string;
  trabajador_cedula: string | null;
  trabajador_cargo: string | null;
  trabajador_salario_diario: number;
  trabajador_tipo_pago: Worker['tipoPago'] | null;
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
  created_at: string;
  total_isr?: number; // Added for future-proofing or if it exists
};

type PlanillaDetalleDeduccionRow = {
  id: string;
  planilla_detalle_id: string;
  deduccion_config_id: string | null;
  nombre: string;
  tipo: DeductionConfig['tipo'];
  valor: number;
  monto: number;
  created_at: string;
};

const DEFAULT_COMPANY = {
  nombre: 'CGC Enterprise',
  ruc: '',
  multiplicador_horas_extra: 1.5,
};

const DEFAULT_DEDUCTIONS: Array<Omit<DeduccionConfigRow, 'id' | 'empresa_id' | 'created_at' | 'updated_at'>> = [
  {
    nombre: 'Seguro Social (Empleado)',
    tipo: 'porcentaje',
    valor: 6.27,
    habilitado: true,
    descripcion: 'Aporte del empleado al seguro social',
    orden: 1,
  },
  {
    nombre: 'Seguro de Salud',
    tipo: 'porcentaje',
    valor: 5.5,
    habilitado: true,
    descripcion: 'Aporte al seguro de salud',
    orden: 2,
  },
  {
    nombre: 'Impuesto sobre la Renta',
    tipo: 'porcentaje',
    valor: 0,
    habilitado: false,
    descripcion: 'Retención ISR',
    orden: 3,
  },
];

export async function ensureEmpresaBase() {
  const empresas = await selectRows<EmpresaRow>('empresas', {
    select: '*',
    order: 'created_at.asc',
    limit: 1,
  });

  let empresa = empresas[0];

  if (!empresa) {
    const inserted = await insertRows<EmpresaRow>('empresas', DEFAULT_COMPANY);
    empresa = inserted[0];
  }

  const deducciones = await selectRows<DeduccionConfigRow>('deducciones_config', {
    select: '*',
    filters: [{ column: 'empresa_id', value: empresa.id }],
    limit: 1,
  });

  if (deducciones.length === 0) {
    await insertRows<DeduccionConfigRow>(
      'deducciones_config',
      DEFAULT_DEDUCTIONS.map((item) => ({
        ...item,
        empresa_id: empresa.id,
      }))
    );
  }

  return empresa;
}

function mapProject(row: ProyectoRow): Project {
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo || undefined,
    descripcion: row.descripcion || undefined,
    ubicacion: row.ubicacion || undefined,
    estado: row.estado,
    fechaInicio: row.fecha_inicio || undefined,
    fechaFin: row.fecha_fin || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

function mapWorker(row: TrabajadorRow): Worker {
  return {
    id: row.id,
    nombre: row.nombre_completo,
    cedula: row.cedula,
    salarioHora: Number(row.salario_diario || 0),
    tipoPago: row.tipo_pago,
    cargo: row.cargo,
    estado: row.estado,
    telefono: row.telefono || undefined,
    fechaIngreso: row.fecha_ingreso,
    proyectoId: row.proyecto_id,
    createdAt: row.created_at,
  };
}

function normalizeAttendanceStatus(status: string): AttendanceStatus {
  const s = String(status || '').toLowerCase().trim();
  
  if (s.includes('asistio') || s.includes('asistió') || s.includes('presente')) return 'asistio';
  if (s.includes('falta') || s.includes('ausente')) return 'falta';
  if (s.includes('permiso')) return 'permiso';
  if (s.includes('incap') || s.includes('enfermo') || s.includes('accidente')) return 'incapacidad';
  if (s.includes('vaca')) return 'vacaciones';
  
  return 'falta'; // Default to falta if unknown
}

export function mapAttendance(row: AsistenciaRow): AttendanceRecord {
  return {
    id: row.id,
    trabajadorId: row.trabajador_id,
    fecha: row.fecha,
    estado: normalizeAttendanceStatus(row.estado),
    horasTrabajadas: Number(row.horas_trabajadas || 0),
    horasExtra: Number(row.horas_extra || 0),
    proyectoId: row.proyecto_id,
    observaciones: row.observaciones || undefined,
  };
}

function mapDeduction(row: DeduccionConfigRow): DeductionConfig {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    valor: Number(row.valor || 0),
    habilitado: row.habilitado,
    descripcion: row.descripcion || undefined,
  };
}

function mapSettings(row: EmpresaRow): AppSettings {
  const stored = localStorage.getItem('cgc_isr_habilitado');
  const storedDias = localStorage.getItem('cgc_dias_especiales');
  let diasEspeciales: { fecha: string; multiplicador: number }[] = [];
  try { if (storedDias) diasEspeciales = JSON.parse(storedDias); } catch { /* keep default */ }
  return {
    nombreEmpresa: row.nombre,
    idEmpresa: row.ruc || '',
    multiplicadorHorasExtra: Number(row.multiplicador_horas_extra || 1.5),
    isrHabilitado: stored === null ? true : stored === 'true',
    diasEspeciales,
  };
}

function mapPayrollDetailDeduction(row: PlanillaDetalleDeduccionRow): DeductionDetail {
  return {
    deduccionId: row.deduccion_config_id || row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    valor: Number(row.valor || 0),
    monto: Number(row.monto || 0),
  };
}

function buildHistoricalWorker(detail: PlanillaDetalleRow, fallbackDate: string): Worker {
  return {
    id: detail.trabajador_id || `historico-${detail.id}`,
    nombre: detail.trabajador_nombre,
    cedula: detail.trabajador_cedula || '',
    salarioHora: Number(detail.trabajador_salario_diario || 0),
    tipoPago: detail.trabajador_tipo_pago || 'bisemanal',
    cargo: detail.trabajador_cargo || '',
    estado: 'inactivo',
    fechaIngreso: fallbackDate,
    proyectoId: detail.proyecto_id,
    createdAt: detail.created_at,
  };
}

export async function fetchAppData() {
  const empresa = await ensureEmpresaBase();
  const empresaId = empresa.id;

  const [projectsRows, workersRows, deductionRows, payrollRows] = await Promise.all([
    selectRows<ProyectoRow>('proyectos', {
      select: '*',
      filters: [{ column: 'empresa_id', value: empresaId }],
      order: 'created_at.desc',
    }),
    selectRows<TrabajadorRow>('trabajadores', {
      select: '*',
      filters: [{ column: 'empresa_id', value: empresaId }],
      order: 'created_at.desc',
    }),
    selectRows<DeduccionConfigRow>('deducciones_config', {
      select: '*',
      filters: [{ column: 'empresa_id', value: empresaId }],
      order: 'orden.asc',
    }),
    selectRows<PlanillaRow>('planillas', {
      select: '*',
      filters: [{ column: 'empresa_id', value: empresaId }],
      order: 'created_at.desc',
    }),
  ]);

  const projects = projectsRows.map(mapProject);
  const workers = workersRows.map(mapWorker);
  const deductions = deductionRows.map(mapDeduction);

  const projectsMap = new Map(projects.map((project) => [project.id, project.nombre]));
  const savedPayrolls: PayrollSummary[] = payrollRows.map((row) => ({
    id: row.id,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    proyectoId: row.proyecto_id,
    proyectoNombre: row.proyecto_id ? projectsMap.get(row.proyecto_id) || null : null,
    totalTrabajadores: Number(row.total_trabajadores || 0),
    totalDevengado: Number(row.total_devengado || 0),
    totalDeducciones: Number(row.total_deducciones || 0),
    totalISR: 0,
    totalPagado: Number(row.total_pagado || 0),
    createdAt: row.created_at,
  }));

  return {
    empresaId,
    settings: mapSettings(empresa),
    projects,
    workers,
    attendance: [], // Initial state is empty, will load on demand
    deductions,
    savedPayrolls,
  };
}

export async function fetchAttendanceRecords(
  empresaId: string,
  filters: { date?: string; startDate?: string; endDate?: string; workerId?: string }
): Promise<AttendanceRecord[]> {
  const supabaseFilters: Filter[] = [{ column: 'empresa_id', value: empresaId }];
  
  if (filters.date) {
    supabaseFilters.push({ column: 'fecha', value: filters.date });
  }
  if (filters.startDate) {
    supabaseFilters.push({ column: 'fecha', op: 'gte', value: filters.startDate });
  }
  if (filters.endDate) {
    supabaseFilters.push({ column: 'fecha', op: 'lte', value: filters.endDate });
  }
  if (filters.workerId) {
    supabaseFilters.push({ column: 'trabajador_id', value: filters.workerId });
  }

  const rows = await selectRows<AsistenciaRow>('asistencias', {
    select: '*',
    filters: supabaseFilters,
  });

  return rows.map(mapAttendance);
}

export async function fetchPayrollDetails(
  payrollId: string, 
  workers: Worker[], 
  payrollRow: { fecha_inicio: string; fecha_fin: string; id: string }
): Promise<PayrollDetail[]> {
  const [detailRows, deductions] = await Promise.all([
    selectRows<PlanillaDetalleRow>('planilla_detalles', {
      select: '*',
      filters: [{ column: 'planilla_id', value: payrollId }],
    }),
    // Fetch only deductions related to this payroll's details
    (async () => {
      // First get the detail IDs to filter deductions
      const tempDetails = await selectRows<{ id: string }>('planilla_detalles', {
        select: 'id',
        filters: [{ column: 'planilla_id', value: payrollId }],
      });
      const detailIds = tempDetails.map(d => d.id);
      if (detailIds.length === 0) return [];
      
      return selectRows<PlanillaDetalleDeduccionRow>('planilla_detalle_deducciones', {
        select: '*',
        filters: [{ column: 'planilla_detalle_id', op: 'in', value: detailIds }],
      });
    })()
  ]);

  const workersMap = new Map(workers.map((worker) => [worker.id, worker]));
  const deductionsByDetailId = new Map<string, DeductionDetail[]>();

  deductions.forEach((row) => {
    const current = deductionsByDetailId.get(row.planilla_detalle_id) || [];
    current.push(mapPayrollDetailDeduction(row));
    deductionsByDetailId.set(row.planilla_detalle_id, current);
  });

  const start = new Date(payrollRow.fecha_inicio + 'T12:00:00');
  const end = new Date(payrollRow.fecha_fin + 'T12:00:00');
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

  return detailRows.map((detail) => {
    const worker = detail.trabajador_id ? workersMap.get(detail.trabajador_id) : undefined;
    const allDeductions = deductionsByDetailId.get(detail.id) || [];
    
    const isrDeduction = allDeductions.find(d => d.nombre === 'Impuesto sobre la Renta');
    const regularDeductions = allDeductions.filter(d => d !== isrDeduction);
    const isrValue = isrDeduction ? isrDeduction.monto : 0;
    
    return {
      trabajadorId: detail.trabajador_id || `historico-${detail.id}`,
      trabajador: worker || buildHistoricalWorker(detail, payrollRow.fecha_inicio),
      proyectoId: detail.proyecto_id,
      proyectoNombre: detail.proyecto_nombre || null,
      diasTrabajados: Number(detail.dias_trabajados || 0),
      domingosTrabajados: Number(detail.domingos_trabajados || 0),
      horasExtraTotal: Number(detail.horas_extra_total || 0),
      salarioBase: Number(detail.salario_base || 0),
      pagoDomingos: Number(detail.pago_domingos || 0),
      pagoHorasExtra: Number(detail.pago_horas_extra || 0),
      totalDevengado: Number(detail.total_devengado || 0),
      deduccionesDetalle: regularDeductions,
      deducciones: Number(detail.total_deducciones || 0) - isrValue,
      isr: isrValue,
      ingresoAnualizado: isrValue > 0 ? (Number(detail.total_devengado || 0) / days) * 365 : 0,
      totalPagado: Number(detail.total_pagado || 0),
      registrosDiarios: [],
    };
  });
}
