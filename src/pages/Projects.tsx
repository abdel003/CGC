import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Building2, MapPin, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import type { Project, ProjectStatus } from '@/types';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';

const emptyProject = (): Omit<Project, 'id' | 'createdAt' | 'updatedAt'> => ({
  nombre: '',
  codigo: '',
  descripcion: '',
  ubicacion: '',
  estado: 'activo',
  fechaInicio: '',
  fechaFin: '',
});

const statusLabel: Record<ProjectStatus, string> = {
  activo: 'Activo',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
};

const statusClass: Record<ProjectStatus, string> = {
  activo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pausado: 'bg-amber-50 text-amber-700 border-amber-200',
  finalizado: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default function Projects() {
  const projects = useAppStore(s => s.projects);
  const workers = useAppStore(s => s.workers);
  const addProject = useAppStore(s => s.addProject);
  const updateProject = useAppStore(s => s.updateProject);
  const deleteProject = useAppStore(s => s.deleteProject);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyProject());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const value = search.toLowerCase();
      return (
        project.nombre.toLowerCase().includes(value) ||
        project.codigo?.toLowerCase().includes(value) ||
        project.ubicacion?.toLowerCase().includes(value)
      );
    });
  }, [projects, search]);

  const assignedWorkersCount = (projectId: string) =>
    workers.filter((worker) => worker.proyectoId === projectId && worker.estado === 'activo').length;

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyProject());
    setFormErrors({});
  };

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre del proyecto es obligatorio';
    if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio) {
      errors.fechaFin = 'La fecha de fin no puede ser anterior a la fecha de inicio';
    }
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
      codigo: form.codigo?.trim() || undefined,
      descripcion: form.descripcion?.trim() || undefined,
      ubicacion: form.ubicacion?.trim() || undefined,
      fechaInicio: form.fechaInicio || undefined,
      fechaFin: form.fechaFin || undefined,
    };

    if (editingId) {
      try {
        await updateProject(editingId, payload);
        toast.success('Proyecto actualizado');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el proyecto');
        return;
      }
    } else {
      try {
        await addProject(payload);
        toast.success('Proyecto agregado');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo agregar el proyecto');
        return;
      }
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setForm({
      nombre: project.nombre,
      codigo: project.codigo || '',
      descripcion: project.descripcion || '',
      ubicacion: project.ubicacion || '',
      estado: project.estado,
      fechaInicio: project.fechaInicio || '',
      fechaFin: project.fechaFin || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      toast.success(`Proyecto "${deleteTarget.nombre}" eliminado`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el proyecto');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold font-heading tracking-tight text-foreground">Proyectos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{projects.length} registrados · {projects.filter((project) => project.estado === 'activo').length} activos</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-md cursor-pointer h-12 sm:h-10 font-bold uppercase tracking-widest text-xs">
              <Plus className="w-5 h-5 sm:w-4 sm:h-4" /> Agregar proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar' : 'Nuevo'} proyecto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Nombre *</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFormErrors((p) => ({ ...p, nombre: '' })); }}
                  className={`h-11 ${formErrors.nombre ? 'border-destructive' : ''}`}
                />
                {formErrors.nombre && <p className="text-xs text-destructive mt-1">{formErrors.nombre}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Código</Label>
                  <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Estado</Label>
                  <Select value={form.estado} onValueChange={(value) => setForm({ ...form, estado: value as ProjectStatus })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="pausado">Pausado</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Ubicación</Label>
                <Input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Descripción</Label>
                <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Fecha de inicio</Label>
                  <Input type="date" value={form.fechaInicio} onChange={(e) => { setForm({ ...form, fechaInicio: e.target.value }); setFormErrors((p) => ({ ...p, fechaFin: '' })); }} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Fecha de fin</Label>
                  <Input
                    type="date"
                    value={form.fechaFin}
                    min={form.fechaInicio || undefined}
                    onChange={(e) => { setForm({ ...form, fechaFin: e.target.value }); setFormErrors((p) => ({ ...p, fechaFin: '' })); }}
                    className={`h-11 ${formErrors.fechaFin ? 'border-destructive' : ''}`}
                  />
                  {formErrors.fechaFin && <p className="text-xs text-destructive mt-1">{formErrors.fechaFin}</p>}
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full mt-2 h-12 font-bold uppercase tracking-widest text-xs">
                {editingId ? 'Guardar cambios' : 'Crear proyecto'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o ubicación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 sm:h-11"
            />
          </div>
        </CardContent>
      </Card>

      {filteredProjects.length === 0 ? (
        <Card className="border-border/50 shadow-card">
          <EmptyState
            icon={Building2}
            title="Sin proyectos"
            description="Aún no hay proyectos registrados o no coinciden con la búsqueda."
          />
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
            >
              <Card className="border-border/50 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-foreground">{project.nombre}</h3>
                        {project.codigo && <Badge variant="outline">{project.codigo}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{project.ubicacion || 'Ubicación no definida'}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`border ${statusClass[project.estado]}`}>
                      {statusLabel[project.estado]}
                    </Badge>
                  </div>

                  {project.descripcion && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{project.descripcion}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-brand-50 p-3">
                      <p className="text-xs text-muted-foreground">Trabajadores activos</p>
                      <p className="font-bold text-foreground mt-1">{assignedWorkersCount(project.id)}</p>
                    </div>
                    <div className="rounded-xl bg-brand-50 p-3">
                      <p className="text-xs text-muted-foreground">Período</p>
                      <p className="font-bold text-foreground mt-1 text-sm">
                        {project.fechaInicio || '—'} {project.fechaFin ? `a ${project.fechaFin}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" size="default" className="flex-1 sm:flex-none h-11 sm:h-9 text-xs font-bold uppercase tracking-wider" onClick={() => handleEdit(project)}>
                      <Pencil className="w-4 h-4 mr-1.5" /> Editar
                    </Button>
                    <Button variant="outline" size="default" className="flex-1 sm:flex-none h-11 sm:h-9 text-xs font-bold uppercase tracking-wider text-destructive" onClick={() => setDeleteTarget(project)}>
                      <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirmación de eliminación */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              ¿Eliminar proyecto?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Estás a punto de eliminar <strong>{deleteTarget?.nombre}</strong>. Esta acción no se puede deshacer.
                </p>
                {deleteTarget && assignedWorkersCount(deleteTarget.id) > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Users className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800">
                      <strong>{assignedWorkersCount(deleteTarget.id)} trabajador(es) activo(s)</strong> están asignados a este proyecto.
                      Los trabajadores no serán eliminados pero quedarán sin proyecto asignado.
                    </p>
                  </div>
                )}
              </div>
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
