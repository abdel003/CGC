import { create } from 'zustand';
import { toast } from 'sonner';
import { fetchAppData, fetchPayrollDetails, fetchAttendanceRecords, mapAttendance } from '@/lib/appData';
import type { AsistenciaRow } from '@/lib/appData';
import { deleteRows, insertRows, isSupabaseConfigured, supabase, updateRows } from '@/lib/supabase';
import type {
  Worker,
  AttendanceRecord,
  DeductionConfig,
  PayrollSummary,
  AppSettings,
  DiaEspecialConfig,
  Project,
} from '@/types';
import {
  replaceAttendanceForDate,
  replaceAttendanceForRange,
  replaceAttendanceForWorker,
  upsertAttendanceRecord,
  upsertAttendanceRecords,
  withAttendanceId,
} from '@/store/attendance.utils';
import {
  buildPlanillaDetallePayload,
  buildPlanillaDeduccionPayload,
  buildPlanillaInsertPayload,
} from '@/store/payroll.persistence';
import {
  createDefaultSettings,
  persistDiasEspeciales,
  persistISRHabilitado,
} from '@/store/settings.storage';

const defaultSettings: AppSettings = createDefaultSettings();

interface AppState {
  empresaId: string | null;
  isConfigured: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  projects: Project[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  deductions: DeductionConfig[];
  savedPayrolls: PayrollSummary[];
  settings: AppSettings;
  // Tracking para evitar bucles infinitos de carga (incluso para registros vacíos)
  fetchedWorkerIds: Set<string>;
  fetchedDates: Set<string>;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;

  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addWorker: (worker: Omit<Worker, 'id' | 'createdAt'>) => Promise<void>;
  updateWorker: (id: string, data: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;

  setAttendance: (record: Omit<AttendanceRecord, 'id'> | AttendanceRecord) => Promise<void>;
  bulkSetAttendance: (records: Array<Omit<AttendanceRecord, 'id'> | AttendanceRecord>) => Promise<void>;
  getAttendanceByDate: (fecha: string) => AttendanceRecord[];
  getAttendanceByWorker: (trabajadorId: string) => AttendanceRecord[];
  getAttendanceByRange: (start: string, end: string) => AttendanceRecord[];

  addDeduction: (deduction: Omit<DeductionConfig, 'id'>) => Promise<void>;
  updateDeduction: (id: string, data: Partial<DeductionConfig>) => Promise<void>;
  deleteDeduction: (id: string) => Promise<void>;
  toggleDeduction: (id: string) => Promise<void>;

  savePayroll: (payroll: PayrollSummary) => Promise<void>;
  deletePayroll: (id: string) => Promise<void>;

  updateSettings: (data: Partial<AppSettings>) => Promise<void>;
  toggleISR: () => void;
  addDiaEspecial: (fecha: string, multiplicador: number) => void;
  removeDiaEspecial: (fecha: string) => void;
  getPayrollDetails: (id: string) => Promise<void>;
  loadAttendanceByDate: (date: string, force?: boolean) => Promise<void>;
  loadAttendanceByRange: (start: string, end: string) => Promise<void>;
  loadAttendanceByWorker: (workerId: string) => Promise<void>;
  subscribeToAttendance: () => () => void;
}


export const useAppStore = create<AppState>()((set, get) => {
  // Helper internal functions to avoid circular dependency and TDZ issues
  const getEmpresaIdInternal = () => {
    const empresaId = get().empresaId;
    if (!empresaId) {
      throw new Error('No se encontró la empresa base en Supabase.');
    }
    return empresaId;
  };

  const refreshStoreDataInternal = async () => {
    const payload = await fetchAppData();
    set({
      empresaId: payload.empresaId,
      settings: payload.settings,
      projects: payload.projects,
      workers: payload.workers,
      deductions: payload.deductions,
      savedPayrolls: payload.savedPayrolls,
      initialized: true,
      loading: false,
      error: null,
    });
  };

  const runMutationInternal = async (callback: () => Promise<void>) => {
    set({ loading: true, error: null });
    try {
      await callback();
      await refreshStoreDataInternal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      set({ loading: false, error: message });
      throw error;
    }
  };

  return {
    empresaId: null,
    isConfigured: isSupabaseConfigured,
    loading: false,
    initialized: false,
    error: null,

    projects: [],
    workers: [],
    attendance: [],
    deductions: [],
    savedPayrolls: [],
    settings: defaultSettings,
    fetchedWorkerIds: new Set(),
    fetchedDates: new Set(),

    initialize: async () => {
      if (!isSupabaseConfigured) {
        set({
          initialized: true,
          loading: false,
          error: 'Falta configurar Supabase. Crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
        });
        return;
      }

      if (get().loading) return;
      set({ loading: true, error: null });

      try {
        await refreshStoreDataInternal();
      } catch (err) {
        set({
          loading: false,
          error: err instanceof Error ? err.message : 'Error al conectar con Supabase',
        });
      }
    },

    getPayrollDetails: async (id: string) => {
      const { savedPayrolls, workers } = get();
      const payroll = savedPayrolls.find(p => p.id === id);
      if (!payroll || payroll.detalles) return;

      set({ loading: true });
      try {
        const details = await fetchPayrollDetails(id, workers, {
          id: payroll.id,
          fecha_inicio: payroll.fechaInicio,
          fecha_fin: payroll.fechaFin
        });
        
        set(state => ({
          loading: false,
          savedPayrolls: state.savedPayrolls.map(p => 
            p.id === id ? { ...p, detalles: details } : p
          )
        }));
      } catch (error) {
        console.error('Error fetching payroll details:', error);
        set({ loading: false });
        toast.error('No se pudieron cargar los detalles de la planilla');
      }
    },

    loadAttendanceByDate: async (date, force = false) => {
      const empresaId = get().empresaId;
      if (!empresaId) return;

      if (!force && get().fetchedDates.has(date)) return;

      set({ loading: true });
      try {
        const records = await fetchAttendanceRecords(empresaId, { date });
        set(state => {
          const newDates = new Set(state.fetchedDates);
          newDates.add(date);
          
          return {
            loading: false,
            fetchedDates: newDates,
            attendance: replaceAttendanceForDate(state.attendance, date, records),
          };
        });
      } catch (error) {
        set({ loading: false, error: (error as Error).message });
        console.error('Error loading attendance by date:', error);
      }
    },

    loadAttendanceByRange: async (start, end) => {
      const empresaId = get().empresaId;
      if (!empresaId) return;

      set({ loading: true });
      try {
        const records = await fetchAttendanceRecords(empresaId, { startDate: start, endDate: end });
        set(state => {
          return {
            loading: false,
            attendance: replaceAttendanceForRange(state.attendance, start, end, records),
          };
        });
      } catch (error) {
        set({ loading: false });
        console.error('Error loading attendance by range:', error);
      }
    },

    loadAttendanceByWorker: async (workerId) => {
      const empresaId = get().empresaId;
      if (!empresaId) return;

      if (get().fetchedWorkerIds.has(workerId)) return;

      set({ loading: true });
      try {
        const records = await fetchAttendanceRecords(empresaId, { workerId });
        set(state => {
          const newWorkerIds = new Set(state.fetchedWorkerIds);
          newWorkerIds.add(workerId);
          
          return {
            loading: false,
            fetchedWorkerIds: newWorkerIds,
            attendance: replaceAttendanceForWorker(state.attendance, workerId, records),
          };
        });
      } catch (error) {
        set({ loading: false, error: (error as Error).message });
        console.error('Error loading attendance by worker:', error);
      }
    },

    refresh: async () => {
      await get().initialize();
    },

    clearError: () => set({ error: null }),

    addProject: async (project) => {
      await runMutationInternal(async () => {
        const empresaId = getEmpresaIdInternal();
        await insertRows('proyectos', {
          empresa_id: empresaId,
          nombre: project.nombre,
          codigo: project.codigo || null,
          descripcion: project.descripcion || null,
          ubicacion: project.ubicacion || null,
          estado: project.estado,
          fecha_inicio: project.fechaInicio || null,
          fecha_fin: project.fechaFin || null,
        });
      });
    },

    updateProject: async (id, data) => {
      await runMutationInternal(async () => {
        await updateRows(
          'proyectos',
          {
            nombre: data.nombre,
            codigo: data.codigo || null,
            descripcion: data.descripcion || null,
            ubicacion: data.ubicacion || null,
            estado: data.estado,
            fecha_inicio: data.fechaInicio || null,
            fecha_fin: data.fechaFin || null,
          },
          [{ column: 'id', value: id }]
        );
      });
    },

    deleteProject: async (id) => {
      await runMutationInternal(async () => {
        await deleteRows('proyectos', [{ column: 'id', value: id }]);
      });
    },

    addWorker: async (worker) => {
      await runMutationInternal(async () => {
        const empresaId = getEmpresaIdInternal();
        await insertRows('trabajadores', {
          empresa_id: empresaId,
          proyecto_id: worker.proyectoId || null,
          nombre_completo: worker.nombre,
          cedula: worker.cedula,
          telefono: worker.telefono || null,
          cargo: worker.cargo,
          salario_diario: worker.salarioHora,
          tipo_pago: worker.tipoPago,
          estado: worker.estado,
          fecha_ingreso: worker.fechaIngreso,
        });
      });
    },

    updateWorker: async (id, data) => {
      await runMutationInternal(async () => {
        await updateRows(
          'trabajadores',
          {
            proyecto_id: data.proyectoId,
            nombre_completo: data.nombre,
            cedula: data.cedula,
            telefono: data.telefono || null,
            cargo: data.cargo,
            salario_diario: data.salarioHora,
            tipo_pago: data.tipoPago,
            estado: data.estado,
            fecha_ingreso: data.fechaIngreso,
          },
          [{ column: 'id', value: id }]
        );
      });
    },

    deleteWorker: async (id) => {
      await runMutationInternal(async () => {
        await deleteRows('trabajadores', [{ column: 'id', value: id }]);
      });
    },

    setAttendance: async (record) => {
      const prevState = get().attendance;
      const empresaId = getEmpresaIdInternal();
      const newRecord = withAttendanceId(record);

      set((state) => {
        return { attendance: upsertAttendanceRecord(state.attendance, newRecord) };
      });

      try {
        await insertRows(
          'asistencias',
          {
            empresa_id: empresaId,
            trabajador_id: newRecord.trabajadorId,
            fecha: newRecord.fecha,
            estado: newRecord.estado,
            horas_trabajadas: newRecord.horasTrabajadas,
            horas_extra: newRecord.horasExtra,
            proyecto_id: newRecord.proyectoId || null,
            observaciones: newRecord.observaciones || null,
          },
          { onConflict: 'empresa_id,trabajador_id,fecha', upsert: true }
        );
        
        set((state) => {
          const newDates = new Set(state.fetchedDates);
          newDates.add(newRecord.fecha);
          return { fetchedDates: newDates };
        });
      } catch (error) {
        set({ attendance: prevState });
        const message = error instanceof Error ? error.message : 'Error al sincronizar asistencia';
        toast.error(message);
        throw error;
      }
    },

    bulkSetAttendance: async (records) => {
      const prevState = get().attendance;
      const empresaId = getEmpresaIdInternal();

      const fullRecords = records.map(withAttendanceId);

      set((state) => {
        return { attendance: upsertAttendanceRecords(state.attendance, fullRecords) };
      });

      try {
        await insertRows(
          'asistencias',
          fullRecords.map((record) => ({
            empresa_id: empresaId,
            trabajador_id: record.trabajadorId,
            fecha: record.fecha,
            estado: record.estado,
            horas_trabajadas: record.horasTrabajadas,
            horas_extra: record.horasExtra,
            proyecto_id: record.proyectoId || null,
            observaciones: record.observaciones || null,
          })),
          { onConflict: 'empresa_id,trabajador_id,fecha', upsert: true }
        );

        if (fullRecords.length > 0) {
          set((state) => {
            const newDates = new Set(state.fetchedDates);
            fullRecords.forEach(r => newDates.add(r.fecha));
            return { fetchedDates: newDates };
          });
        }
      } catch (error) {
        set({ attendance: prevState });
        const message = error instanceof Error ? error.message : 'Error al sincronizar asistencia masiva';
        toast.error(message);
        throw error;
      }
    },

    getAttendanceByDate: (fecha) => get().attendance.filter((record) => record.fecha === fecha),
    getAttendanceByWorker: (trabajadorId) => get().attendance.filter((record) => record.trabajadorId === trabajadorId),
    getAttendanceByRange: (start, end) =>
      get().attendance.filter((record) => record.fecha >= start && record.fecha <= end),

    addDeduction: async (deduction) => {
      await runMutationInternal(async () => {
        const empresaId = getEmpresaIdInternal();
        const maxOrder = Math.max(0, ...get().deductions.map((_, index) => index + 1));
        await insertRows('deducciones_config', {
          empresa_id: empresaId,
          nombre: deduction.nombre,
          tipo: deduction.tipo,
          valor: deduction.valor,
          habilitado: deduction.habilitado,
          descripcion: deduction.descripcion || null,
          orden: maxOrder + 1,
        });
      });
    },

    updateDeduction: async (id, data) => {
      await runMutationInternal(async () => {
        await updateRows(
          'deducciones_config',
          {
            nombre: data.nombre,
            tipo: data.tipo,
            valor: data.valor,
            habilitado: data.habilitado,
            descripcion: data.descripcion || null,
          },
          [{ column: 'id', value: id }]
        );
      });
    },

    deleteDeduction: async (id) => {
      await runMutationInternal(async () => {
        await deleteRows('deducciones_config', [{ column: 'id', value: id }]);
      });
    },

    toggleDeduction: async (id) => {
      const current = get().deductions.find((item) => item.id === id);
      if (!current) return;

      await runMutationInternal(async () => {
        await updateRows('deducciones_config', { habilitado: !current.habilitado }, [{ column: 'id', value: id }]);
      });
    },

    savePayroll: async (payroll) => {
      set({ loading: true, error: null });
      try {
        const empresaId = getEmpresaIdInternal();

        const insertedPlanillas = await insertRows<{ id: string }>(
          'planillas',
          buildPlanillaInsertPayload(empresaId, payroll)
        );

        const planillaId = insertedPlanillas[0]?.id;
        if (!planillaId) throw new Error('No se pudo guardar la planilla.');

        const detailPayload = buildPlanillaDetallePayload(planillaId, payroll);

        const insertedDetails = await insertRows<{ id: string }>('planilla_detalles', detailPayload);

        const deductionPayload = buildPlanillaDeduccionPayload(
          insertedDetails.map((detail) => detail.id),
          payroll
        );

        if (deductionPayload.length > 0) {
          await insertRows('planilla_detalle_deducciones', deductionPayload);
        }

        const fullSavedPayroll: PayrollSummary = {
          ...payroll,
          id: planillaId,
        };
        
        set((state) => ({ 
          savedPayrolls: [fullSavedPayroll, ...state.savedPayrolls],
          loading: false,
          error: null 
        }));

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al guardar la planilla';
        set({ loading: false, error: message });
        throw error;
      }
    },

    deletePayroll: async (id) => {
      const prevState = get().savedPayrolls;
      
      set((state) => ({ 
        savedPayrolls: state.savedPayrolls.filter(p => p.id !== id) 
      }));

      try {
        await deleteRows('planillas', [{ column: 'id', value: id }]);
      } catch (error) {
        set({ savedPayrolls: prevState });
        const message = error instanceof Error ? error.message : 'Error al eliminar la planilla';
        toast.error(message);
        throw error;
      }
    },

    updateSettings: async (data) => {
      if (data.isrHabilitado !== undefined) {
        persistISRHabilitado(data.isrHabilitado);
      }
      await runMutationInternal(async () => {
        const empresaId = getEmpresaIdInternal();
        await updateRows(
          'empresas',
          {
            nombre: data.nombreEmpresa,
            ruc: data.idEmpresa,
            multiplicador_horas_extra: data.multiplicadorHorasExtra,
          },
          [{ column: 'id', value: empresaId }]
        );
      });
    },

    toggleISR: () => {
      const current = get().settings.isrHabilitado;
      const next = !current;
      persistISRHabilitado(next);
      set((state) => ({
        settings: { ...state.settings, isrHabilitado: next },
      }));
    },

    addDiaEspecial: (fecha: string, multiplicador: number) => {
      const current = get().settings.diasEspeciales;
      const exists = current.findIndex((d) => d.fecha === fecha);
      let next: DiaEspecialConfig[];
      if (exists >= 0) {
        next = current.map((d) => d.fecha === fecha ? { ...d, multiplicador } : d);
      } else {
        next = [...current, { fecha, multiplicador }].sort((a, b) => a.fecha.localeCompare(b.fecha));
      }
      persistDiasEspeciales(next);
      set((state) => ({
        settings: { ...state.settings, diasEspeciales: next },
      }));
    },

    removeDiaEspecial: (fecha: string) => {
      const current = get().settings.diasEspeciales;
      const next = current.filter((d) => d.fecha !== fecha);
      persistDiasEspeciales(next);
      set((state) => ({
        settings: { ...state.settings, diasEspeciales: next },
      }));
    },

    subscribeToAttendance: () => {
      const empresaId = get().empresaId;
      if (!empresaId || !supabase) return () => {};

      const channel = supabase
        .channel(`attendance-realtime-${empresaId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'asistencias',
            filter: `empresa_id=eq.${empresaId}`,
          },
          (payload: any) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            set((state) => {
              let newAttendance = [...state.attendance];
              
              if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const record = mapAttendance(newRecord as AsistenciaRow);
                newAttendance = upsertAttendanceRecord(newAttendance, record);
              } else if (eventType === 'DELETE') {
                newAttendance = newAttendance.filter((r) => r.id !== oldRecord.id);
              }
              
              return { attendance: newAttendance };
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
});

