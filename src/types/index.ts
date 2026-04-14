export type PaymentType = 'diario' | 'semanal' | 'bisemanal' | 'mensual';
export type WorkerStatus = 'activo' | 'inactivo';
export type AttendanceStatus = 'asistio' | 'falta' | 'permiso' | 'incapacidad' | 'vacaciones';
export type ProjectStatus = 'activo' | 'pausado' | 'finalizado';
export type DeductionType = 'porcentaje' | 'fijo';

export interface Project {
  id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  ubicacion?: string;
  estado: ProjectStatus;
  fechaInicio?: string;
  fechaFin?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Worker {
  id: string;
  nombre: string;
  cedula: string;
  salarioHora: number;
  tipoPago: PaymentType;
  cargo: string;
  estado: WorkerStatus;
  telefono?: string;
  fechaIngreso: string;
  proyectoId?: string | null;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  trabajadorId: string;
  fecha: string; // YYYY-MM-DD
  estado: AttendanceStatus;
  horasTrabajadas: number;
  horasExtra: number;
  proyectoId?: string | null;
  observaciones?: string;
}

export interface DeductionConfig {
  id: string;
  nombre: string;
  tipo: DeductionType;
  valor: number; // percentage (e.g. 6.27) or fixed USD amount
  habilitado: boolean;
  descripcion?: string;
}

export interface DeductionDetail {
  deduccionId: string;
  nombre: string;
  tipo: DeductionType;
  valor: number;
  monto: number; // calculated amount in USD
}

export interface PayrollDetail {
  trabajadorId: string;
  trabajador: Worker;
  proyectoId?: string | null;
  proyectoNombre?: string | null;
  diasTrabajados: number;
  domingosTrabajados: number;
  horasExtraTotal: number;
  salarioBase: number;
  pagoDomingos: number;
  pagoHorasExtra: number;
  totalDevengado: number;
  deduccionesDetalle: DeductionDetail[];
  deducciones: number;
  isr?: number;              // ISR calculado proporcional al período
  isrAnual?: number;         // ISR anual teórico
  ingresoAnualizado?: number; // Ingreso anualizado para el cálculo del ISR
  totalPagado: number;
  registrosDiarios: AttendanceRecord[];
}

export interface PayrollSummary {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  proyectoId?: string | null;
  proyectoNombre?: string | null;
  totalTrabajadores: number;
  totalDevengado: number;
  totalDeducciones: number;
  totalISR?: number;
  totalPagado: number;
  detalles?: PayrollDetail[];
  createdAt: string;
}

export interface DiaEspecialConfig {
  fecha: string;          // 'YYYY-MM-DD'
  multiplicador: number;  // ej: 1.5, 2, 3
}

export interface AppSettings {
  nombreEmpresa: string;
  idEmpresa: string;
  multiplicadorHorasExtra: number;
  isrHabilitado: boolean;
  diasEspeciales: DiaEspecialConfig[];
}
