import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/shallow';
import {
  AlertTriangle,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Save,
  RefreshCw,
  Search,
  Settings2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { shiftDate, todayLocalDate } from '@/lib/date';
import type { AttendanceRecord, AttendanceStatus, Worker } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const statusConfig: Record<
  AttendanceStatus,
  { short: string; bg: string; text: string; border: string }
> = {
  asistio: { short: 'Asistió', bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' },
  falta: { short: 'Falta', bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
  permiso: { short: 'Permiso', bg: 'bg-amber-400', text: 'text-amber-900', border: 'border-amber-500' },
  incapacidad: { short: 'Incap.', bg: 'bg-blue-400', text: 'text-white', border: 'border-blue-500' },
  vacaciones: { short: 'Vacac.', bg: 'bg-purple-400', text: 'text-white', border: 'border-purple-500' },
};

const quickStatuses: AttendanceStatus[] = ['asistio', 'permiso', 'incapacidad', 'vacaciones', 'falta'];

const WorkerAttendanceCard = memo(({
  worker,
  status,
  record,
  projectName,
  onSetStatus,
  onDetail,
  index,
}: {
  worker: Worker;
  status: AttendanceStatus;
  record?: AttendanceRecord;
  projectName?: string | null;
  onSetStatus: (id: string, s: AttendanceStatus) => void;
  onDetail: (id: string) => void;
  index: number;
}) => {
  const isPresent = status === 'asistio';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
    >
      <div
        className={`overflow-hidden rounded-xl border transition-all duration-200 ${
          isPresent ? 'border-emerald-200 bg-emerald-50/60 shadow-sm' : 'border-border/60 bg-white shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3 px-4 pb-3 pt-4">
          <button
            onClick={() => onSetStatus(worker.id, isPresent ? 'falta' : 'asistio')}
            title={isPresent ? 'Marcar como falta' : 'Marcar como presente'}
            aria-label={isPresent ? `Marcar a ${worker.nombre} como falta` : `Marcar a ${worker.nombre} como presente`}
            aria-pressed={isPresent}
            className={`h-12 w-12 flex-shrink-0 rounded-xl border-2 transition-all duration-200 active:scale-95 ${
              isPresent
                ? 'border-emerald-600 bg-emerald-500 shadow-md shadow-emerald-200'
                : 'border-border bg-white hover:border-emerald-300 hover:bg-emerald-50'
            } flex items-center justify-center cursor-pointer`}
          >
            {isPresent ? (
              <Check className="h-6 w-6 stroke-[2.5] text-white" />
            ) : (
              <span className="text-base font-bold text-muted-foreground">{worker.nombre.charAt(0)}</span>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{worker.nombre}</p>
            <p className="truncate text-xs text-muted-foreground">
              {worker.cargo}
              {projectName ? <span className="text-muted-foreground/60"> · {projectName}</span> : null}
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {isPresent && (
              <div className="flex flex-col items-end">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    record?.horasTrabajadas === 8
                      ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                      : 'border-amber-200 bg-amber-100 text-amber-700'
                  }`}
                >
                  {record?.horasTrabajadas === 8 ? 'Jornada completa' : `${record?.horasTrabajadas}h trabajadas`}
                </span>
                {record?.horasExtra ? (
                  <span className="mt-0.5 text-[9px] font-bold text-blue-600">+{record.horasExtra}h extra</span>
                ) : null}
              </div>
            )}
            <button
              onClick={() => onDetail(worker.id)}
              title="Configurar horas y detalles"
              aria-label={`Configurar horas y detalles de ${worker.nombre}`}
              className="h-8 w-8 cursor-pointer rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground flex items-center justify-center"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-4">
          {quickStatuses.map((s) => {
            const statusVariant = statusConfig[s];
            const isSelected = status === s;
            return (
              <button
                key={s}
                onClick={() => onSetStatus(worker.id, s)}
                aria-label={`Marcar a ${worker.nombre} como ${s}`}
                aria-pressed={isSelected}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? `${statusVariant.bg} ${statusVariant.text} ${statusVariant.border} shadow-sm`
                    : 'border-border/60 bg-white text-muted-foreground hover:border-border hover:bg-muted/40'
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
                {statusVariant.short}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

WorkerAttendanceCard.displayName = 'WorkerAttendanceCard';

export default function Attendance() {
  const {
    workers,
    attendance,
    projects,
    setAttendance,
    bulkSetAttendance,
    loading,
    loadAttendanceByDate,
    subscribeToAttendance,
    empresaId,
  } = useAppStore(
    useShallow((s) => ({
      workers: s.workers,
      attendance: s.attendance,
      projects: s.projects,
      setAttendance: s.setAttendance,
      bulkSetAttendance: s.bulkSetAttendance,
      loading: s.loading,
      loadAttendanceByDate: s.loadAttendanceByDate,
      subscribeToAttendance: s.subscribeToAttendance,
      empresaId: s.empresaId,
    })),
  );

  const [selectedDate, setSelectedDate] = useState(todayLocalDate());
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState<'todos' | string>('todos');

  const todayRecords = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance
      .filter((r) => r.fecha === selectedDate)
      .forEach((r) => map.set(r.trabajadorId, r));
    return map;
  }, [attendance, selectedDate]);

  const relevantWorkers = useMemo(() => {
    // Incluir trabajadores activos Y trabajadores inactivos que tengan asistencia registrada para esta fecha
    return workers.filter((w) => w.estado === 'activo' || todayRecords.has(w.id));
  }, [workers, todayRecords]);

  const activeWorkersCount = useMemo(() => workers.filter(w => w.estado === 'activo').length, [workers]);


  useEffect(() => {
    if (empresaId) {
      loadAttendanceByDate(selectedDate);
    }
  }, [selectedDate, loadAttendanceByDate, empresaId]);

  useEffect(() => {
    const unsubscribe = subscribeToAttendance();
    return () => unsubscribe();
  }, [subscribeToAttendance]);

  const hasLoadedDate = useMemo(() => attendance.some((a) => a.fecha === selectedDate), [attendance, selectedDate]);
  const [detailWorker, setDetailWorker] = useState<string | null>(null);
  const [detailForm, setDetailForm] = useState({
    estado: 'falta' as AttendanceStatus,
    horasTrabajadas: 8,
    horasExtra: 0,
    proyectoId: 'sin-proyecto' as string,
    observaciones: '',
  });
  const attendanceDialogTitleId = 'attendance-detail-title';
  const attendanceDialogDescriptionId = 'attendance-detail-help';

  const projectsMap = useMemo(() => new Map(projects.map((p) => [p.id, p.nombre])), [projects]);


  const filteredWorkers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return relevantWorkers.filter((w) => {
      const matchSearch =
        !q ||
        w.nombre.toLowerCase().includes(q) ||
        w.cedula.toLowerCase().includes(q) ||
        w.cargo.toLowerCase().includes(q);
      const workerProjectId = todayRecords.get(w.id)?.proyectoId || w.proyectoId || null;
      const matchProject = filterProject === 'todos' || workerProjectId === filterProject;
      return matchSearch && matchProject;
    });
  }, [relevantWorkers, search, filterProject, todayRecords]);

  const getStatus = (id: string): AttendanceStatus => todayRecords.get(id)?.estado || 'falta';

  const handleSetStatus = useCallback((workerId: string, estado: AttendanceStatus) => {
    const state = useAppStore.getState();
    const existing = state.attendance.find((r) => r.trabajadorId === workerId && r.fecha === selectedDate);

    try {
      setAttendance({
        id: existing?.id || crypto.randomUUID(),
        trabajadorId: workerId,
        fecha: selectedDate,
        estado,
        horasTrabajadas: estado === 'asistio' ? (existing?.horasTrabajadas || 8) : 0,
        horasExtra: existing?.horasExtra || 0,
        proyectoId: existing?.proyectoId || state.workers.find((w) => w.id === workerId)?.proyectoId || null,
        observaciones: existing?.observaciones,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  }, [setAttendance, selectedDate]);

  const markAllPresent = useCallback(async () => {
    const targets = filterProject === 'todos' ? relevantWorkers.filter(w => w.estado === 'activo') : filteredWorkers.filter(w => w.estado === 'activo');
    const records: AttendanceRecord[] = targets.map((w) => {
      const existing = todayRecords.get(w.id);
      return {
        id: existing?.id || crypto.randomUUID(),
        trabajadorId: w.id,
        fecha: selectedDate,
        estado: 'asistio',
        horasTrabajadas: existing?.horasTrabajadas || 8,
        horasExtra: existing?.horasExtra || 0,
        proyectoId: existing?.proyectoId || w.proyectoId || null,
        observaciones: existing?.observaciones,
      };
    });
    try {
      await bulkSetAttendance(records);
      toast.success(
        filterProject === 'todos'
          ? 'Todos marcados como presentes'
          : `${targets.length} trabajadores marcados como presentes`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  }, [relevantWorkers, filteredWorkers, filterProject, bulkSetAttendance, selectedDate, todayRecords]);

  const openDetail = useCallback((workerId: string) => {
    const state = useAppStore.getState();
    const existing = state.attendance.find((r) => r.trabajadorId === workerId && r.fecha === selectedDate);
    const worker = state.workers.find((w) => w.id === workerId);

    if (worker) {
      setDetailForm({
        estado: existing?.estado || 'falta',
        horasTrabajadas: existing?.horasTrabajadas || 8,
        horasExtra: existing?.horasExtra || 0,
        proyectoId: existing?.proyectoId || worker.proyectoId || 'sin-proyecto',
        observaciones: existing?.observaciones || '',
      });
      setDetailWorker(workerId);
    }
  }, [selectedDate]);

  const saveDetail = async () => {
    if (!detailWorker) return;
    const existing = todayRecords.get(detailWorker);
    const horas = detailForm.horasTrabajadas;
    const extra = detailForm.horasExtra;
    if (horas < 0 || horas > 24) {
      toast.error('Las horas trabajadas deben estar entre 0 y 24');
      return;
    }
    if (extra < 0) {
      toast.error('Las horas extra no pueden ser negativas');
      return;
    }
    if (horas > 0 && extra >= horas) {
      toast.error('Las horas extra no pueden ser mayores o iguales a las horas trabajadas');
      return;
    }
    if (extra > 8) {
      toast.warning('Se están registrando más de 8 horas extra. ¿Es correcto?');
    }

    try {
      await setAttendance({
        id: existing?.id || crypto.randomUUID(),
        trabajadorId: detailWorker,
        fecha: selectedDate,
        estado: detailForm.estado,
        horasTrabajadas: detailForm.horasTrabajadas,
        horasExtra: detailForm.horasExtra,
        proyectoId: detailForm.proyectoId === 'sin-proyecto' ? null : detailForm.proyectoId,
        observaciones: detailForm.observaciones,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el detalle');
      return;
    }

    setDetailWorker(null);
    toast.success('Detalle guardado');
  };

  const changeDate = (days: number) => {
    setSelectedDate(shiftDate(selectedDate, days));
  };

  const isFutureDate = selectedDate > todayLocalDate();
  const presentCount = filteredWorkers.filter((w) => getStatus(w.id) === 'asistio').length;
  const absentCount = filteredWorkers.length - presentCount;
  const progressPct = filteredWorkers.length > 0 ? (presentCount / filteredWorkers.length) * 100 : 0;
  const totalPresent = relevantWorkers.filter((w) => getStatus(w.id) === 'asistio').length;
  const detailWorkerData = workers.find((w) => w.id === detailWorker);
  const dateFormatted = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-419', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-4">
      <div className="mb-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Asistencia diaria</h1>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/50 px-2.5 py-0.5 shadow-sm">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">En vivo</span>
            </div>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {totalPresent} de {activeWorkersCount} activos presentes hoy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 cursor-pointer shadow-sm sm:h-10 sm:w-10"
            onClick={() => loadAttendanceByDate(selectedDate, true)}
            title="Sincronizar con Supabase"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="default"
            size="default"
            className="h-12 cursor-pointer gap-2 text-xs font-bold uppercase tracking-widest shadow-md sm:h-10"
            onClick={markAllPresent}
          >
            <CheckCheck className="h-5 w-5 sm:h-4 sm:w-4" />
            {filterProject !== 'todos' ? 'Marcar filtrados' : 'Marcar todos presente'}
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-card">
        <CardContent className="p-4">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => changeDate(-1)} className="h-11 w-11 cursor-pointer shadow-sm">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <Input
                  aria-label="Fecha de asistencia"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto cursor-pointer border-none bg-transparent px-4 text-center text-lg font-extrabold text-foreground shadow-none focus-visible:ring-0"
                />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">{dateFormatted}</span>
              {isFutureDate && (
                <span className="mt-1 flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600">
                  <AlertTriangle className="h-3 w-3" /> FECHA FUTURA
                </span>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={() => changeDate(1)} className="h-11 w-11 cursor-pointer shadow-sm">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-bold leading-none text-emerald-700">{presentCount}</p>
              <p className="mt-1 text-xs font-medium text-emerald-600">Presentes</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
              <p className="text-2xl font-bold leading-none text-red-600">{absentCount}</p>
              <p className="mt-1 text-xs font-medium text-red-500">Ausentes / Otro</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso{filterProject !== 'todos' ? ' (filtrado)' : ''}</span>
              <span className="font-semibold text-foreground">{Math.round(progressPct)}%</span>
            </div>
            <Progress value={progressPct} className="h-2.5 rounded-full" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar trabajador en asistencia"
            placeholder="Buscar trabajador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 pl-10 shadow-sm sm:h-11"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterProject} onValueChange={(v) => setFilterProject(v)}>
            <SelectTrigger className="h-12 w-full bg-white shadow-sm sm:h-11 sm:w-[220px]" aria-label="Filtrar asistencia por proyecto">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Todos los proyectos" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los proyectos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(search || filterProject !== 'todos') && (
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>
            Mostrando <b className="text-foreground">{filteredWorkers.length}</b> trabajadores
          </span>
          <button onClick={() => { setSearch(''); setFilterProject('todos'); }} aria-label="Limpiar filtros de asistencia" className="text-brand-600 hover:underline">
            Limpiar filtros
          </button>
        </div>
      )}

      {filteredWorkers.length > 0 && (
        <p className="px-2 text-center text-xs text-muted-foreground">
          Toca el{' '}
          <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-border bg-white text-[9px]">✓</span>
          </span>{' '}
          para marcar presente/ausente, o elige un estado directamente
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && !hasLoadedDate ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-white py-12 text-muted-foreground">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="mb-3"
            >
              <Clock className="h-8 w-8 text-brand-400" />
            </motion.div>
            <p className="text-sm font-medium">Cargando asistencias del día...</p>
          </div>
        ) : (
          filteredWorkers.map((worker, index) => {
            const record = todayRecords.get(worker.id);
            const status = record?.estado || 'falta';
            const projectName = record?.proyectoId
              ? projectsMap.get(record.proyectoId)
              : worker.proyectoId
                ? projectsMap.get(worker.proyectoId)
                : null;
            return (
              <WorkerAttendanceCard
                key={worker.id}
                worker={worker}
                status={status}
                record={record}
                projectName={projectName}
                onSetStatus={handleSetStatus}
                onDetail={openDetail}
                index={index}
              />
            );
          })
        )}
      </div>

      {filteredWorkers.length === 0 && relevantWorkers.length > 0 && (
        <Card className="border-border/50 shadow-card">
          <CardContent className="p-10 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <h3 className="mb-1 font-semibold">Sin resultados</h3>
            <p className="text-sm text-muted-foreground">No hay trabajadores que coincidan con la búsqueda o el proyecto seleccionado.</p>
            <button
              onClick={() => { setSearch(''); setFilterProject('todos'); }}
              aria-label="Limpiar filtros de asistencia"
              className="mx-auto mt-2 block text-xs text-brand-600 hover:underline"
            >
              Limpiar filtros
            </button>
          </CardContent>
        </Card>
      )}

      {activeWorkersCount === 0 && (
        <Card className="border-border/50 shadow-card">
          <CardContent className="p-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-1 font-semibold">Sin trabajadores activos</h3>
            <p className="text-sm text-muted-foreground">Agrega trabajadores primero para registrar asistencia.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!detailWorker} onOpenChange={(open) => !open && setDetailWorker(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle id={attendanceDialogTitleId} className="flex items-center gap-2">
              <div className="gradient-blue flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white">
                {detailWorkerData?.nombre.charAt(0)}
              </div>
              {detailWorkerData?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3" aria-labelledby={attendanceDialogTitleId} aria-describedby={attendanceDialogDescriptionId}>
            <p id={attendanceDialogDescriptionId} className="text-xs text-muted-foreground">
              Ajusta estado, proyecto y horas del trabajador seleccionado para la fecha actual.
            </p>
            <div>
              <Label htmlFor="attendance-detail-status">Estado</Label>
              <Select
                value={detailForm.estado}
                onValueChange={(v) => setDetailForm({ ...detailForm, estado: v as AttendanceStatus })}
              >
                <SelectTrigger id="attendance-detail-status" aria-label="Estado de asistencia"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asistio">Asistió</SelectItem>
                  <SelectItem value="falta">Falta</SelectItem>
                  <SelectItem value="permiso">Permiso</SelectItem>
                  <SelectItem value="incapacidad">Incapacidad</SelectItem>
                  <SelectItem value="vacaciones">Vacaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="attendance-detail-project">Proyecto del día</Label>
              <Select
                value={detailForm.proyectoId}
                onValueChange={(v) => setDetailForm({ ...detailForm, proyectoId: v })}
              >
                <SelectTrigger id="attendance-detail-project" aria-label="Proyecto del día"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-proyecto">Sin proyecto</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="attendance-detail-hours">Horas trabajadas</Label>
                <Input
                  id="attendance-detail-hours"
                  type="number"
                  value={detailForm.horasTrabajadas}
                  onChange={(e) => setDetailForm({ ...detailForm, horasTrabajadas: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="attendance-detail-extra-hours">Horas extraordinarias</Label>
                <Input
                  id="attendance-detail-extra-hours"
                  type="number"
                  value={detailForm.horasExtra}
                  onChange={(e) => setDetailForm({ ...detailForm, horasExtra: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="attendance-detail-notes">Observaciones</Label>
              <Textarea
                id="attendance-detail-notes"
                value={detailForm.observaciones}
                onChange={(e) => setDetailForm({ ...detailForm, observaciones: e.target.value })}
                rows={2}
                placeholder="Notas adicionales..."
              />
            </div>
            <Button onClick={saveDetail} className="w-full cursor-pointer gap-2">
              <Save className="h-4 w-4" /> Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
