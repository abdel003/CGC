import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/shallow';
import { AlertTriangle, Briefcase, Clock, Eye, Filter, LayoutGrid, List, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { todayLocalDate } from '@/lib/date';
import type { AttendanceRecord, PaymentType, Worker, WorkerStatus } from '@/types';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const emptyWorker = (): Omit<Worker, 'id' | 'createdAt'> => ({
  nombre: '',
  cedula: '',
  salarioHora: 0,
  tipoPago: 'bisemanal',
  cargo: '',
  estado: 'activo',
  telefono: '',
  fechaIngreso: todayLocalDate(),
  proyectoId: null,
});

interface FormErrors {
  nombre?: string;
  cedula?: string;
  cargo?: string;
  salarioHora?: string;
  fechaIngreso?: string;
}

const WorkerStatsDialog = ({ 
  worker, 
  attendance, 
  projectsMap, 
  open, 
  onOpenChange, 
  onLoadRequested, 
  isLoading 
}: { 
  worker: Worker | null, 
  attendance: AttendanceRecord[], 
  projectsMap: Map<string, string>,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onLoadRequested: (id: string) => void,
  isLoading: boolean
}) => {
  useEffect(() => {
    if (open && worker) {
      onLoadRequested(worker.id);
    }
  }, [open, worker, onLoadRequested]);

  const stats = useMemo(() => {
    if (!worker) return null;
    const workerRecords = attendance.filter(r => r.trabajadorId === worker.id);
    const totalHours = workerRecords.reduce((s, r) => s + (r.horasTrabajadas || 0), 0);
    const totalExtra = workerRecords.reduce((s, r) => s + (r.horasExtra || 0), 0);
    const daysPresent = workerRecords.filter(r => r.estado === 'asistio').length;
    
    const byProject = new Map<string, { hours: number, extra: number }>();
    workerRecords.forEach(r => {
      const pid = r.proyectoId || worker.proyectoId || 'sin-proyecto';
      const current = byProject.get(pid) || { hours: 0, extra: 0 };
      byProject.set(pid, { 
        hours: current.hours + (r.horasTrabajadas || 0), 
        extra: current.extra + (r.horasExtra || 0) 
      });
    });

    const projectBreakdown = Array.from(byProject.entries()).map(([id, data]) => ({
      name: projectsMap.get(id) || 'Sin proyecto',
      ...data
    })).sort((a, b) => (b.hours + b.extra) - (a.hours + a.extra));

    const history = [...workerRecords]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 8);

    return { totalHours, totalExtra, daysPresent, projectBreakdown, history };
  }, [worker, attendance, projectsMap]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {worker && stats && (
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl gradient-blue flex items-center justify-center flex-shrink-0 text-xl font-extrabold text-white shadow-lg">
              {worker.nombre.charAt(0)}
            </div>
            <div>
              <DialogTitle className="text-xl font-heading font-extrabold tracking-tight">{worker.nombre}</DialogTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{worker.cargo} · {worker.cedula}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="p-4 rounded-3xl bg-blue-50/50 border border-blue-100/50 flex flex-col items-center justify-center text-center shadow-sm">
            <Clock className="w-4 h-4 text-blue-600 mb-1.5" />
            <p className="text-lg font-heading font-extrabold text-blue-900 leading-none">{stats.totalHours + stats.totalExtra}h</p>
            <p className="text-[9px] text-blue-500 uppercase font-bold tracking-widest mt-1">Hrs Totales</p>
          </div>
          <div className="p-4 rounded-3xl bg-emerald-50/50 border border-emerald-100/50 flex flex-col items-center justify-center text-center shadow-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600 mb-1.5" />
            <p className="text-lg font-heading font-extrabold text-emerald-900 leading-none">{stats.daysPresent}</p>
            <p className="text-[9px] text-emerald-500 uppercase font-bold tracking-widest mt-1">Asistencias</p>
          </div>
          <div className="p-4 rounded-3xl bg-amber-50/50 border border-amber-100/50 flex flex-col items-center justify-center text-center shadow-sm">
            <Briefcase className="w-4 h-4 text-amber-600 mb-1.5" />
            <p className="text-lg font-heading font-extrabold text-amber-900 leading-none">{stats.projectBreakdown.length}</p>
            <p className="text-[9px] text-amber-500 uppercase font-bold tracking-widest mt-1">Proyectos</p>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center text-muted-foreground italic">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="mb-2">
                <Clock className="w-6 h-6" />
              </motion.div>
              Cargando historial...
            </div>
          ) : (
            <>
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" /> 
                  Esfuerzo por Proyecto
                </h4>
                <div className="space-y-2">
                  {stats.projectBreakdown.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50 text-sm">
                      <span className="font-medium truncate">{p.name}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-muted-foreground">Ord: <b className="text-foreground">{p.hours}h</b></span>
                        <span className="text-muted-foreground">Ext: <b className="text-brand-600">{p.extra}h</b></span>
                      </div>
                    </div>
                  ))}
                  {stats.projectBreakdown.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2 italic">Sin actividad registrada aún.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> 
                  Actividad Reciente
                </h4>
                <div className="rounded-lg border border-border/50 overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left font-semibold">Fecha</th>
                        <th className="p-2 text-left font-semibold">Estado</th>
                        <th className="p-2 text-right font-semibold">Hrs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {stats.history.map((r, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="p-2">{r.fecha}</td>
                          <td className="p-2">
                            <span className={r.estado === 'asistio' ? 'text-emerald-600 font-medium' : 'text-red-500'}>
                              {r.estado}
                            </span>
                          </td>
                          <td className="p-2 text-right">{(r.horasTrabajadas || 0) + (r.horasExtra || 0)}h</td>
                        </tr>
                      ))}
                      {stats.history.length === 0 && (
                        <tr><td colSpan={3} className="p-3 text-center text-muted-foreground italic">Cero registros</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default function Workers() {
  const {
    workers,
    projects,
    attendance,
    addWorker,
    updateWorker,
    deleteWorker,
    globalLoading,
    loadAttendanceByWorker,
    fetchedWorkerIds
  } = useAppStore(
    useShallow((s) => ({
      workers: s.workers,
      projects: s.projects,
      attendance: s.attendance,
      addWorker: s.addWorker,
      updateWorker: s.updateWorker,
      deleteWorker: s.deleteWorker,
      globalLoading: s.loading,
      loadAttendanceByWorker: s.loadAttendanceByWorker,
      fetchedWorkerIds: s.fetchedWorkerIds,
    }))
  );

  // Seguridad: Asegurar que el scroll y los eventos de ratón se restauren si Radix falla
  useEffect(() => {
    return () => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, []);

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'activo' | 'inactivo'>('todos');
  const [projectFilter, setProjectFilter] = useState<'todos' | string>('todos');
  const [form, setForm] = useState(emptyWorker());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [viewWorker, setViewWorker] = useState<Worker | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const projectsMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.nombre])),
    [projects]
  );

  const filtered = useMemo(() => {
    return workers.filter((worker) => {
      const projectName = worker.proyectoId ? projectsMap.get(worker.proyectoId) || '' : '';
      const matchesSearch =
        worker.nombre.toLowerCase().includes(search.toLowerCase()) ||
        worker.cargo.toLowerCase().includes(search.toLowerCase()) ||
        worker.cedula.includes(search) ||
        projectName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || worker.estado === filterStatus;
      const matchesProject = projectFilter === 'todos' || worker.proyectoId === projectFilter;
      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [workers, projectsMap, search, filterStatus, projectFilter]);

  const activeCount = workers.filter((worker) => worker.estado === 'activo').length;

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyWorker());
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!form.cargo.trim()) errors.cargo = 'El cargo es obligatorio';
    if (!form.fechaIngreso) errors.fechaIngreso = 'La fecha de ingreso es obligatoria';

    const cedulaTrimmed = form.cedula.trim();
    if (!cedulaTrimmed) {
      errors.cedula = 'La cédula es obligatoria';
    } else {
      const duplicate = workers.find(
        (w) => w.cedula.trim() === cedulaTrimmed && w.id !== editingId
      );
      if (duplicate) errors.cedula = `Ya existe un trabajador con esta cédula (${duplicate.nombre})`;
    }

    if (form.salarioHora <= 0) errors.salarioHora = 'El salario debe ser mayor a $0';
    if (form.salarioHora > 999) errors.salarioHora = 'El salario parece demasiado alto. ¿Es correcto?';

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Corrige los errores antes de continuar');
      return;
    }

    const payload = {
      ...form,
      cedula: form.cedula.trim(),
      nombre: form.nombre.trim(),
      cargo: form.cargo.trim(),
      telefono: form.telefono?.trim() || undefined,
      proyectoId: form.proyectoId || null,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await updateWorker(editingId, payload);
        toast.success('Trabajador actualizado');
      } else {
        await addWorker(payload);
        toast.success('Trabajador agregado');
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo procesar la solicitud');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (worker: Worker) => {
    setEditingId(worker.id);
    setForm({
      nombre: worker.nombre,
      cedula: worker.cedula,
      salarioHora: worker.salarioHora,
      tipoPago: worker.tipoPago,
      cargo: worker.cargo,
      estado: worker.estado,
      telefono: worker.telefono || '',
      fechaIngreso: worker.fechaIngreso,
      proyectoId: worker.proyectoId || null,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWorker(deleteTarget.id);
      toast.success(`Trabajador "${deleteTarget.nombre}" eliminado`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el trabajador');
    } finally {
      setDeleteTarget(null);
    }
  };

  const resetFormErrors = () => setFormErrors({});
  const workerFormTitleId = editingId ? 'editar-trabajador-titulo' : 'nuevo-trabajador-titulo';
  const workerFormDescriptionId = 'trabajador-form-ayuda';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trabajadores"
        subtitle={`${workers.length} registrados · ${activeCount} activos · ${projects.length} proyectos`}
      >
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { resetForm(); resetFormErrors(); }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm cursor-pointer">
              <Plus className="w-4 h-4" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle id={workerFormTitleId}>{editingId ? 'Editar' : 'Nuevo'} trabajador</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2" aria-labelledby={workerFormTitleId} aria-describedby={workerFormDescriptionId}>
              <p id={workerFormDescriptionId} className="text-xs text-muted-foreground">
                Completa los campos obligatorios para guardar el trabajador.
              </p>
              <div>
                <Label htmlFor="worker-nombre">Nombre completo *</Label>
                <Input
                  id="worker-nombre"
                  value={form.nombre}
                  onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFormErrors((prev) => ({ ...prev, nombre: undefined })); }}
                  className={formErrors.nombre ? 'border-destructive' : ''}
                  aria-invalid={!!formErrors.nombre}
                  aria-describedby={formErrors.nombre ? 'worker-nombre-error' : undefined}
                />
                {formErrors.nombre && <p id="worker-nombre-error" className="text-xs text-destructive mt-1">{formErrors.nombre}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="worker-cedula" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Cédula *</Label>
                  <Input
                    id="worker-cedula"
                    value={form.cedula}
                    onChange={(e) => { setForm({ ...form, cedula: e.target.value }); setFormErrors((prev) => ({ ...prev, cedula: undefined })); }}
                    className={formErrors.cedula ? 'border-destructive' : 'h-11'}
                    aria-invalid={!!formErrors.cedula}
                    aria-describedby={formErrors.cedula ? 'worker-cedula-error' : undefined}
                  />
                  {formErrors.cedula && <p id="worker-cedula-error" className="text-[10px] text-destructive mt-1 font-medium">{formErrors.cedula}</p>}
                </div>
                <div>
                  <Label htmlFor="worker-telefono" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Teléfono</Label>
                  <Input id="worker-telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="h-11" />
                </div>
              </div>
              <div>
                <Label htmlFor="worker-cargo">Cargo *</Label>
                <Input
                  id="worker-cargo"
                  value={form.cargo}
                  onChange={(e) => { setForm({ ...form, cargo: e.target.value }); setFormErrors((prev) => ({ ...prev, cargo: undefined })); }}
                  className={formErrors.cargo ? 'border-destructive' : ''}
                  aria-invalid={!!formErrors.cargo}
                  aria-describedby={formErrors.cargo ? 'worker-cargo-error' : undefined}
                />
                {formErrors.cargo && <p id="worker-cargo-error" className="text-xs text-destructive mt-1">{formErrors.cargo}</p>}
              </div>
              <div>
                <Label htmlFor="worker-proyecto">Proyecto asignado</Label>
                <Select value={form.proyectoId || 'sin-proyecto'} onValueChange={(value) => setForm({ ...form, proyectoId: value === 'sin-proyecto' ? null : value })}>
                  <SelectTrigger id="worker-proyecto" aria-label="Proyecto asignado"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-proyecto">Sin proyecto</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="worker-salario" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Salario por hora (USD $) *</Label>
                  <Input
                    id="worker-salario"
                    type="number" step="0.01" min="0.01"
                    value={form.salarioHora}
                    onChange={(e) => { setForm({ ...form, salarioHora: Number(e.target.value) }); setFormErrors((prev) => ({ ...prev, salarioHora: undefined })); }}
                    className={formErrors.salarioHora ? 'border-destructive' : 'h-11'}
                    aria-invalid={!!formErrors.salarioHora}
                    aria-describedby={formErrors.salarioHora ? 'worker-salario-error' : undefined}
                  />
                  {formErrors.salarioHora && <p id="worker-salario-error" className="text-[10px] text-destructive mt-1 font-medium">{formErrors.salarioHora}</p>}
                </div>
                <div>
                  <Label htmlFor="worker-tipo-pago" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Tipo de pago</Label>
                  <Select value={form.tipoPago} onValueChange={(value) => setForm({ ...form, tipoPago: value as PaymentType })}>
                    <SelectTrigger id="worker-tipo-pago" className="h-11" aria-label="Tipo de pago"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diario</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="bisemanal">Bisemanal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="worker-fecha-ingreso" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Fecha de ingreso *</Label>
                  <Input
                    id="worker-fecha-ingreso"
                    type="date"
                    value={form.fechaIngreso}
                    max={todayLocalDate()}
                    onChange={(e) => { setForm({ ...form, fechaIngreso: e.target.value }); setFormErrors((prev) => ({ ...prev, fechaIngreso: undefined })); }}
                    className={formErrors.fechaIngreso ? 'border-destructive' : 'h-11'}
                    aria-invalid={!!formErrors.fechaIngreso}
                    aria-describedby={formErrors.fechaIngreso ? 'worker-fecha-error' : undefined}
                  />
                  {formErrors.fechaIngreso && <p id="worker-fecha-error" className="text-[10px] text-destructive mt-1 font-medium">{formErrors.fechaIngreso}</p>}
                </div>
                <div>
                  <Label htmlFor="worker-estado" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Estado</Label>
                  <Select value={form.estado} onValueChange={(value) => setForm({ ...form, estado: value as WorkerStatus })}>
                    <SelectTrigger id="worker-estado" className="h-11" aria-label="Estado del trabajador"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={isSaving} className="w-full mt-2 cursor-pointer">
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                ) : (
                  editingId ? 'Guardar cambios' : 'Agregar trabajador'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            aria-label="Buscar trabajadores"
            placeholder="Buscar por nombre, cédula, cargo o proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'todos' | 'activo' | 'inactivo')}>
            <SelectTrigger className="flex-1 sm:w-[135px] h-11">
              <Filter className="w-4 h-4 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="inactivo">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="flex-1 sm:w-[180px] h-11">
              <SelectValue placeholder="Proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los proyectos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>{project.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden sm:flex border border-border rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Vista en tarjetas"
              aria-pressed={viewMode === 'grid'}
              className={`p-2.5 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              aria-label="Vista en tabla"
              aria-pressed={viewMode === 'table'}
              className={`p-2.5 transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-brand-50 text-brand-600' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/50 shadow-card">
          <EmptyState
            icon={Search}
            title="Sin resultados"
            description="No se encontraron trabajadores con los filtros actuales."
          />
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((worker, i) => {
            const projectName = worker.proyectoId ? projectsMap.get(worker.proyectoId) : 'Sin proyecto';
            return (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="bg-card rounded-xl border border-border/50 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
              >
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 font-bold shrink-0">
                        {worker.nombre.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-sm truncate leading-tight">{worker.nombre}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider truncate mt-0.5">{worker.cargo}</p>
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      worker.estado === 'activo' 
                        ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20' 
                        : 'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${worker.estado === 'activo' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                      {worker.estado}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-muted-foreground mb-0.5">Cédula</p>
                      <p className="font-medium truncate">{worker.cedula}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-muted-foreground mb-0.5">Salario/h</p>
                      <p className="font-medium">${worker.salarioHora.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 py-1 border-y border-border/50">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Proyecto</span>
                      <span className="font-medium truncate max-w-[120px]">{projectName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Ingreso</span>
                      <span className="font-medium">{worker.fechaIngreso}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <Briefcase className="w-3 h-3" />
                      {worker.tipoPago}
                    </div>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100 transition-colors" aria-label={`Abrir acciones para ${worker.nombre}`}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="cursor-pointer gap-2" onSelect={(e) => { e.preventDefault(); setTimeout(() => setViewWorker(worker), 10); }}>
                          <Eye className="w-4 h-4 text-muted-foreground" /> Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2" onSelect={(e) => { e.preventDefault(); setTimeout(() => handleEdit(worker), 10); }}>
                          <Pencil className="w-4 h-4 text-muted-foreground" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive" onSelect={(e) => { e.preventDefault(); setTimeout(() => setDeleteTarget(worker), 10); }}>
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/50 shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableCaption>Listado de trabajadores con filtros por estado, proyecto y búsqueda.</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Trabajador</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-right">Salario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((worker) => (
                  <TableRow key={worker.id} className="hover:bg-brand-50/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{worker.nombre}</p>
                        <p className="text-xs text-muted-foreground">{worker.telefono || 'Sin teléfono'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{worker.cedula}</TableCell>
                    <TableCell>{worker.proyectoId ? projectsMap.get(worker.proyectoId) || 'Proyecto no encontrado' : 'Sin proyecto'}</TableCell>
                    <TableCell>{worker.cargo}</TableCell>
                    <TableCell className="text-right font-mono text-xs">${worker.salarioHora.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={worker.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}>
                        {worker.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" aria-label={`Abrir acciones para ${worker.nombre}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">{worker.nombre}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer gap-2" onSelect={(e) => { e.preventDefault(); setTimeout(() => setViewWorker(worker), 10); }}>
                              <Eye className="w-4 h-4 text-brand-600" /> Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-2" onSelect={(e) => { e.preventDefault(); setTimeout(() => handleEdit(worker), 10); }}>
                              <Pencil className="w-4 h-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive" onSelect={(e) => { e.preventDefault(); setTimeout(() => setDeleteTarget(worker), 10); }}>
                              <Trash2 className="w-4 h-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <WorkerStatsDialog
        worker={viewWorker} 
        attendance={attendance} 
        projectsMap={projectsMap} 
        open={!!viewWorker} 
        onOpenChange={(open) => !open && setViewWorker(null)} 
        onLoadRequested={loadAttendanceByWorker}
        isLoading={globalLoading && !fetchedWorkerIds.has(viewWorker?.id || '')}
      />

      {/* Confirmación de eliminación */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              ¿Eliminar trabajador?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar a <strong>{deleteTarget?.nombre}</strong>. Esta acción no se puede deshacer y
              también borrará todos sus registros de asistencia asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
