import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { DeductionConfig } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Settings as SettingsIcon, Plus, Pencil, Trash2, Building2, DollarSign, Save, Receipt, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

const emptyDeduction = (): Omit<DeductionConfig, 'id'> => ({
  nombre: '',
  tipo: 'porcentaje',
  valor: 0,
  habilitado: true,
  descripcion: '',
});

export default function Settings() {
  const settings = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);
  const toggleISR = useAppStore(s => s.toggleISR);
  const addDiaEspecial = useAppStore(s => s.addDiaEspecial);
  const removeDiaEspecial = useAppStore(s => s.removeDiaEspecial);
  const deductions = useAppStore(s => s.deductions);
  const addDeduction = useAppStore(s => s.addDeduction);
  const updateDeduction = useAppStore(s => s.updateDeduction);
  const deleteDeduction = useAppStore(s => s.deleteDeduction);
  const toggleDeduction = useAppStore(s => s.toggleDeduction);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState(settings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDeduction());
  const [diaEspecialFecha, setDiaEspecialFecha] = useState('');
  const [diaEspecialMult, setDiaEspecialMult] = useState('2');

  useEffect(() => {
    setCompanyForm(settings);
  }, [settings]);

  const handleSaveSettings = async () => {
    if (!companyForm.nombreEmpresa.trim()) {
      toast.error('El nombre de la empresa es obligatorio');
      return;
    }

    try {
      await updateSettings(companyForm);
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la configuración');
    }
  };

  const handleSubmitDeduction = async () => {
    if (!form.nombre) {
      toast.error('El nombre de la deducción es obligatorio');
      return;
    }
    if (editingId) {
      try {
        await updateDeduction(editingId, form);
        toast.success('Deducción actualizada');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la deducción');
        return;
      }
    } else {
      try {
        await addDeduction(form);
        toast.success('Deducción agregada');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo agregar la deducción');
        return;
      }
    }
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyDeduction());
  };

  const handleEdit = (d: DeductionConfig) => {
    setEditingId(d.id);
    setForm({
      nombre: d.nombre,
      tipo: d.tipo,
      valor: d.valor,
      habilitado: d.habilitado,
      descripcion: d.descripcion,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDeduction(id);
      toast.success('Deducción eliminada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la deducción');
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Configuración de empresa y gestión de deducciones</p>
      </div>

      {/* Información de la Empresa */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Información de la Empresa</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company-name">Nombre de la Empresa</Label>
              <Input
                id="company-name"
                value={companyForm.nombreEmpresa}
                onChange={(e) => setCompanyForm({ ...companyForm, nombreEmpresa: e.target.value })}
                placeholder="Nombre de tu empresa"
              />
            </div>
            <div>
              <Label htmlFor="company-ruc">RUC / Identificación Fiscal</Label>
              <Input
                id="company-ruc"
                value={companyForm.idEmpresa}
                onChange={(e) => setCompanyForm({ ...companyForm, idEmpresa: e.target.value })}
                placeholder="XX-XXXXXXX"
              />
            </div>
            <div>
              <Label htmlFor="company-extra-multiplier">Multiplicador de Horas Extraordinarias</Label>
              <Input
                id="company-extra-multiplier"
                type="number"
                step="0.1"
                min="1"
                value={companyForm.multiplicadorHorasExtra}
                onChange={(e) => setCompanyForm({ ...companyForm, multiplicadorHorasExtra: Number(e.target.value) })}
                aria-describedby="company-extra-multiplier-help"
              />
              <p id="company-extra-multiplier-help" className="text-xs text-muted-foreground mt-1">Ej: 1.5 = tiempo y medio</p>
            </div>
            <div>
              <Label>Moneda</Label>
              <div className="flex items-center gap-2 mt-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">USD — Dólar Estadounidense</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveSettings} className="gap-2">
              <Save className="w-4 h-4" /> Guardar configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Impuesto sobre la Renta (ISR) */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Impuesto sobre la Renta (ISR)</h3>
          </div>
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-orange-200 bg-orange-50/40">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Aplicar ISR en el cálculo de planilla
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cuando está activo, el sistema calcula y descuenta el Impuesto sobre la Renta de forma
                proporcional al período según los tramos legales vigentes: exento hasta $11,000/año,
                15% de $11,001 a $50,000 y 25% sobre $50,000/año.
              </p>
              {!settings.isrHabilitado && (
                <p className="text-xs text-orange-700 font-medium mt-2 flex items-center gap-1">
                  <Receipt className="w-3 h-3" />
                  El ISR no se está aplicando en la planilla actual
                </p>
              )}
            </div>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <Switch
                id="isr-toggle"
                checked={settings.isrHabilitado}
                onCheckedChange={() => {
                  toggleISR();
                  toast.success(
                    settings.isrHabilitado
                      ? 'ISR desactivado — no se aplicará en la próxima planilla'
                      : 'ISR activado — se aplicará en la próxima planilla'
                  );
                }}
                aria-describedby="isr-help"
              />
              <span className="text-xs font-medium text-muted-foreground">
                {settings.isrHabilitado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          <p id="isr-help" className="sr-only">
            Activa o desactiva el cálculo automático del impuesto sobre la renta en la planilla.
          </p>
        </CardContent>
      </Card>

      {/* Días con Pago Especial */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Gestión de Días Especiales</h3>
            <Badge variant="secondary" className="text-xs">{settings.diasEspeciales.length}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Agrega fechas específicas con un multiplicador de salario. Ej: 1.5 = tiempo y medio, 2 = doble, 3 = triple.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <Label htmlFor="dia-especial-fecha">Fecha</Label>
              <Input
                type="date"
                id="dia-especial-fecha"
                className="mt-1"
                value={diaEspecialFecha}
                onChange={(e) => setDiaEspecialFecha(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-36">
              <Label htmlFor="dia-especial-mult">Multiplicador</Label>
              <Input
                type="number"
                step="0.1"
                min="1.1"
                id="dia-especial-mult"
                value={diaEspecialMult}
                onChange={(e) => setDiaEspecialMult(e.target.value)}
                placeholder="Ej: 1.5"
                className="mt-1"
                aria-describedby="dia-especial-help"
              />
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                className="gap-1.5 w-full sm:w-auto"
                onClick={() => {
                  const fecha = diaEspecialFecha;
                  const mult = Number(diaEspecialMult);
                  if (!fecha) { toast.error('Selecciona una fecha'); return; }
                  if (!mult || mult <= 1) { toast.error('El multiplicador debe ser mayor a 1'); return; }
                  addDiaEspecial(fecha, mult);
                  toast.success(`${fecha} → pago ${mult}×`);
                  setDiaEspecialFecha('');
                  setDiaEspecialMult('2');
                }}
              >
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
          </div>
          <p id="dia-especial-help" className="text-xs text-muted-foreground -mt-1 mb-4">
            Usa un multiplicador mayor a 1 para pagos especiales como doble o triple jornada.
          </p>

          {settings.diasEspeciales.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              No hay días especiales configurados — todos los días se pagan al salario normal.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableCaption>Fechas especiales con multiplicador de pago configurado.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Fecha</TableHead>
                    <TableHead className="text-xs">Día</TableHead>
                    <TableHead className="text-xs text-right">Multiplicador</TableHead>
                    <TableHead className="text-xs w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.diasEspeciales.map((d) => {
                    const date = new Date(d.fecha + 'T12:00:00');
                    const dayName = date.toLocaleDateString('es', { weekday: 'long' });
                    const formatted = date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
                    return (
                      <TableRow key={d.fecha}>
                        <TableCell className="text-sm font-medium">{formatted}</TableCell>
                        <TableCell className="text-sm text-muted-foreground capitalize">{dayName}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className={`text-xs font-bold ${d.multiplicador >= 2 ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>
                            {d.multiplicador}×
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-7 w-7 p-0"
                            onClick={() => {
                              removeDiaEspecial(d.fecha);
                              toast.success('Día especial eliminado');
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gestión de Deducciones */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Deducciones</h3>
              <Badge variant="secondary" className="text-xs">{deductions.length}</Badge>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => { setEditingId(null); setForm(emptyDeduction()); setDialogOpen(true); }}>
              <Plus className="w-4 h-4" /> Agregar
            </Button>
          </div>

          {/* Tarjetas móviles */}
          <div className="lg:hidden space-y-2">
            {deductions.map((d) => (
              <Card key={d.id} className={`${!d.habilitado ? 'opacity-50' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{d.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.tipo === 'porcentaje' ? `${d.valor}%` : `$${d.valor.toFixed(2)}`}
                        {d.descripcion && ` · ${d.descripcion}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={d.habilitado} onCheckedChange={async () => { try { await toggleDeduction(d.id); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la deducción'); } }} />
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(d)} aria-label={`Editar deducción ${d.nombre}`}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(d.id)} aria-label={`Eliminar deducción ${d.nombre}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabla de escritorio */}
          <div className="hidden lg:block">
            <Table>
              <TableCaption>Listado de deducciones configuradas para aplicar en planilla.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deductions.map((d) => (
                  <TableRow key={d.id} className={`${!d.habilitado ? 'opacity-50' : ''}`}>
                    <TableCell className="font-medium text-sm">{d.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {d.tipo === 'porcentaje' ? 'Porcentaje' : 'Fijo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {d.tipo === 'porcentaje' ? `${d.valor}%` : `$${d.valor.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.descripcion || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={d.habilitado} onCheckedChange={async () => { try { await toggleDeduction(d.id); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la deducción'); } }} aria-label={`Cambiar estado de ${d.nombre}`} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(d)} aria-label={`Editar deducción ${d.nombre}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(d.id)} aria-label={`Eliminar deducción ${d.nombre}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {deductions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No hay deducciones configuradas</p>
              <p className="text-xs mt-1">Agrega deducciones para aplicarlas automáticamente al calcular la planilla</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para agregar/editar deducción */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyDeduction()); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle id="deduccion-dialog-title">{editingId ? 'Editar' : 'Nueva'} Deducción</DialogTitle>
            </DialogHeader>
          <div className="space-y-3 mt-2" aria-labelledby="deduccion-dialog-title" aria-describedby="deduccion-dialog-help">
            <p id="deduccion-dialog-help" className="text-xs text-muted-foreground">
              Define si la deducción es porcentual o fija y si debe venir activada por defecto.
            </p>
            <div>
              <Label htmlFor="deduccion-nombre">Nombre *</Label>
              <Input id="deduccion-nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Seguro Social" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="deduccion-tipo">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as 'porcentaje' | 'fijo' })}>
                  <SelectTrigger id="deduccion-tipo" aria-label="Tipo de deducción"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                    <SelectItem value="fijo">Monto Fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deduccion-valor">Valor {form.tipo === 'porcentaje' ? '(%)' : '($)'}</Label>
                <Input
                  id="deduccion-valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="deduccion-descripcion">Descripción (opcional)</Label>
              <Input id="deduccion-descripcion" value={form.descripcion || ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Breve descripción..." />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="deduccion-habilitada">Habilitado por defecto</Label>
              <Switch id="deduccion-habilitada" checked={form.habilitado} onCheckedChange={(v) => setForm({ ...form, habilitado: v })} />
            </div>
            <Button onClick={handleSubmitDeduction} className="w-full mt-2">
              {editingId ? 'Guardar Cambios' : 'Agregar Deducción'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
