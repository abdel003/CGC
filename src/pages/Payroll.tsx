import { useMemo, useState } from 'react';
import {
  Calculator,
  CheckCircle,
  DollarSign,
  Eye,
  Receipt,
  Save,
  TrendingDown,
  Wallet,
  FileDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { formatLocalDate } from '@/lib/date';
import { formatBalboa } from '@/lib/exportUtils';
import type { PayrollDetail } from '@/types';
import AnimatedCounter from '@/components/AnimatedCounter';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
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
import { calculatePayrollDetails, calculatePayrollTotals } from '@/lib/payroll';

export default function Payroll() {
  const workers = useAppStore((s) => s.workers);
  const attendance = useAppStore((s) => s.attendance);
  const deductions = useAppStore((s) => s.deductions);
  const projects = useAppStore((s) => s.projects);
  const settings = useAppStore((s) => s.settings);
  const savePayroll = useAppStore((s) => s.savePayroll);
  const loading = useAppStore((s) => s.loading);

  const today = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);

  const [fechaInicio, setFechaInicio] = useState(formatLocalDate(twoWeeksAgo));
  const [fechaFin, setFechaFin] = useState(formatLocalDate(today));
  const [selectedProjectId, setSelectedProjectId] = useState<'todos' | string>('todos');
  const [calculated, setCalculated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detailWorker, setDetailWorker] = useState<PayrollDetail | null>(null);

  const enabledDeductions = useMemo(
    () => deductions.filter((deduction) => deduction.habilitado),
    [deductions],
  );
  const projectsMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.nombre])),
    [projects],
  );

  const payrollDetails = useMemo(() => {
    if (!calculated) return [];

    return calculatePayrollDetails({
      attendance,
      deductions,
      fechaInicio,
      fechaFin,
      projectsMap,
      selectedProjectId,
      settings,
      workers,
    });
  }, [attendance, calculated, deductions, fechaFin, fechaInicio, projectsMap, selectedProjectId, settings, workers]);

  const totals = useMemo(() => calculatePayrollTotals(payrollDetails), [payrollDetails]);

  const selectedProjectName = selectedProjectId !== 'todos' ? projectsMap.get(selectedProjectId) : null;

  const handleSavePayroll = async () => {
    try {
      await savePayroll({
        id: crypto.randomUUID(),
        fechaInicio,
        fechaFin,
        proyectoId: selectedProjectId === 'todos' ? null : selectedProjectId,
        proyectoNombre: selectedProjectName || null,
        totalTrabajadores: payrollDetails.length,
        totalDevengado: totals.devengado,
        totalDeducciones: totals.deducciones,
        totalISR: totals.isr,
        totalPagado: totals.pagado,
        detalles: payrollDetails,
        createdAt: new Date().toISOString(),
      });
      setSaved(true);
      toast.success('Planilla guardada. Ya puedes generar recibos.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la planilla');
    }
  };

  const handleExport = async () => {
    const { exportPayrollToExcel } = await import('@/lib/exportUtils');
    exportPayrollToExcel(payrollDetails, fechaInicio, fechaFin, selectedProjectName);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Planilla" subtitle="Cálculo basado en asistencia, proyecto y deducciones activas" />

      <Card className="border-border/50 shadow-card">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div className="space-y-1.5">
                <Label htmlFor="payroll-fecha-inicio" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Fecha inicio</Label>
                <Input id="payroll-fecha-inicio" type="date" value={fechaInicio} onChange={(e) => { setFechaInicio(e.target.value); setCalculated(false); setSaved(false); }} className="h-11 sm:h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payroll-fecha-fin" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Fecha fin</Label>
                <Input id="payroll-fecha-fin" type="date" value={fechaFin} onChange={(e) => { setFechaFin(e.target.value); setCalculated(false); setSaved(false); }} className="h-11 sm:h-10" />
              </div>
            </div>
            <div className="space-y-1.5 flex-1 w-full">
              <Label htmlFor="payroll-proyecto" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Proyecto</Label>
              <Select value={selectedProjectId} onValueChange={(value) => { setSelectedProjectId(value); setCalculated(false); setSaved(false); }}>
                <SelectTrigger id="payroll-proyecto" className="h-11 sm:h-10 w-full" aria-label="Proyecto para calcular la planilla"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los proyectos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="gap-2 shadow-md cursor-pointer w-full sm:w-auto h-12 sm:h-10 font-bold uppercase tracking-widest text-xs"
              onClick={() => {
                if (fechaFin < fechaInicio) {
                  toast.error('La fecha de inicio no puede ser posterior a la fecha de fin');
                  return;
                }
                const dias = (new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24) + 1;
                if (dias > 60) {
                  toast.warning(`El rango seleccionado es de ${dias} días. Verifica que el período sea correcto.`);
                }
                setCalculated(true);
                setSaved(false);
                toast.success('Planilla calculada');
              }}
            >
              <Calculator className="w-5 h-5 sm:w-4 sm:h-4" /> Calcular Planilla
            </Button>
          </div>
          {enabledDeductions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground mr-1">Deducciones activas:</span>
              {enabledDeductions.map((deduction) => (
                <Badge key={deduction.id} variant="outline" className="text-[10px] bg-brand-50 text-brand-700 border-brand-200">
                  {deduction.nombre} ({deduction.tipo === 'porcentaje' ? `${deduction.valor}%` : `$${deduction.valor}`})
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {calculated && payrollDetails.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card className="border-border/50 shadow-card">
              <CardContent className="p-4 text-center">
                <div className="w-9 h-9 rounded-lg gradient-blue flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-muted-foreground">Total devengado</p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  <AnimatedCounter value={totals.devengado} prefix="$" decimals={2} />
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-card">
              <CardContent className="p-4 text-center">
                <div className="w-9 h-9 rounded-lg gradient-rose flex items-center justify-center mx-auto mb-2">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-muted-foreground">Deducciones</p>
                <p className="text-lg font-bold text-red-600 mt-0.5">
                  <AnimatedCounter value={totals.deducciones} prefix="$" decimals={2} />
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-card">
              <CardContent className="p-4 text-center">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-2">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-muted-foreground">Retención ISR</p>
                <p className="text-lg font-bold text-orange-600 mt-0.5">
                  {settings.isrHabilitado ? (
                    <AnimatedCounter value={totals.isr} prefix="$" decimals={2} />
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Desactivado</span>
                  )}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-card">
              <CardContent className="p-4 text-center">
                <div className="w-9 h-9 rounded-lg gradient-emerald flex items-center justify-center mx-auto mb-2">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-muted-foreground">Neto a Pagar</p>
                <p className="text-lg font-bold text-emerald-600 mt-0.5">
                  <AnimatedCounter value={totals.pagado} prefix="$" decimals={2} />
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-2xl border border-dashed border-border/60">
            <div>
              <p className="text-sm font-bold text-foreground">Selección actual</p>
              <p className="text-xs text-muted-foreground">{selectedProjectName || 'Todos los proyectos'} · {payrollDetails.length} trabajadores</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none gap-2 h-11 sm:h-9 text-xs font-bold uppercase tracking-wider"
                onClick={handleExport}
              >
                <FileDown className="w-4 h-4" /> Exportar
              </Button>
              <Button
                className="flex-[2] sm:flex-none gap-2 h-11 sm:h-9 min-w-[150px] font-bold uppercase tracking-wider text-xs"
                variant={saved ? 'outline' : 'default'}
                onClick={handleSavePayroll}
                disabled={saved || loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'CALCULANDO...' : saved ? 'GUARDADO' : 'GUARDAR PLANILLA'}
              </Button>
            </div>
          </div>

          <div className="lg:hidden space-y-2">
            {payrollDetails.map((detail) => (
              <Card key={detail.trabajadorId} className="border-border/50 shadow-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{detail.trabajador.nombre}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-0.5">{detail.trabajador.cargo} · {detail.registrosDiarios.reduce((sum, r) => sum + r.horasTrabajadas, 0)}h</p>
                      <Badge variant="secondary" className="mt-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0">
                        {detail.proyectoNombre || 'Sin proyecto'}
                      </Badge>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black font-mono text-emerald-600">{formatBalboa(detail.totalPagado)}</p>
                      {detail.isr && detail.isr > 0 ? (
                        <p className="text-[10px] text-orange-600 font-bold mt-0.5">ISR: -{formatBalboa(detail.isr)}</p>
                      ) : null}
                    </div>
                  </div>
                  <Button variant="outline" size="default" className="w-full mt-4 h-11 gap-2 text-xs font-bold uppercase tracking-wider" onClick={() => setDetailWorker(detail)}>
                    <Eye className="w-4 h-4" /> Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden lg:block border-border/50 shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableCaption>Resumen detallado de planilla por trabajador para el rango seleccionado.</TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Empleado</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead className="text-center">Hrs Trabajadas</TableHead>
                    <TableHead className="text-center">H. Extraord.</TableHead>
                    <TableHead className="text-right">S. Ordinario</TableHead>
                    <TableHead className="text-right">Devengado</TableHead>
                    <TableHead className="text-right">Deducciones</TableHead>
                    <TableHead className="text-right">ISR</TableHead>
                    <TableHead className="text-right">Neto a Pagar</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollDetails.map((detail) => (
                    <TableRow key={detail.trabajadorId} className="hover:bg-brand-50/30">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{detail.trabajador.nombre}</p>
                          <p className="text-xs text-muted-foreground">{detail.trabajador.cargo}</p>
                        </div>
                      </TableCell>
                      <TableCell>{detail.proyectoNombre || 'Sin proyecto'}</TableCell>
                      <TableCell className="text-center font-medium">
                        {detail.registrosDiarios.reduce((sum, r) => sum + r.horasTrabajadas, 0)}h
                      </TableCell>
                      <TableCell className="text-center">{detail.horasExtraTotal}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatBalboa(detail.salarioBase)}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium">{formatBalboa(detail.totalDevengado)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-red-600">{formatBalboa(detail.deducciones)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-orange-600">{formatBalboa(detail.isr || 0)}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">{formatBalboa(detail.totalPagado)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setDetailWorker(detail)} className="cursor-pointer">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
                    <TableCell colSpan={5} className="text-sm">Total ({payrollDetails.length} empleados)</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatBalboa(totals.devengado)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">{formatBalboa(totals.deducciones)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-orange-600">{formatBalboa(totals.isr)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600">{formatBalboa(totals.pagado)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {calculated && payrollDetails.length === 0 && (
        <Card className="border-border/50 shadow-card">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Calculator className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-1">Sin registros</h3>
            <p className="text-sm">No hay asistencia en el rango y proyecto seleccionados.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!detailWorker} onOpenChange={(open) => !open && setDetailWorker(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detailWorker && (
            <>
              <DialogHeader>
                <DialogTitle>{detailWorker.trabajador.nombre}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-brand-50 p-3.5 rounded-xl">
                    <p className="text-xs text-muted-foreground">Proyecto</p>
                    <p className="font-bold text-foreground">{detailWorker.proyectoNombre || 'Sin proyecto'}</p>
                  </div>
                  <div className="bg-brand-50 p-3.5 rounded-xl">
                    <p className="text-xs text-muted-foreground">Total Horas Ordinarias</p>
                    <p className="font-bold text-foreground">
                      {detailWorker.registrosDiarios.reduce((sum, r) => sum + r.horasTrabajadas, 0)}h
                    </p>
                  </div>
                  <div className="bg-brand-50 p-3.5 rounded-xl">
                    <p className="text-xs text-muted-foreground">Salario Ordinario</p>
                    <p className="font-bold text-foreground">{formatBalboa(detailWorker.salarioBase)}</p>
                  </div>
                  {detailWorker.domingosTrabajados > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground transition-all">Recargo Días Especiales ({detailWorker.domingosTrabajados}d)</p>
                      <p className="font-bold text-amber-700">+{formatBalboa(detailWorker.pagoDomingos)}</p>
                    </div>
                  )}
                  <div className="bg-brand-50 p-3.5 rounded-xl">
                    <p className="text-xs text-muted-foreground">Horas Extraordinarias ({detailWorker.horasExtraTotal}h)</p>
                    <p className="font-bold text-foreground">+{formatBalboa(detailWorker.pagoHorasExtra)}</p>
                  </div>
                  <div className="bg-brand-50 p-3.5 rounded-xl col-span-2">
                    <p className="text-xs text-muted-foreground">Total devengado</p>
                    <p className="font-bold text-foreground text-lg">{formatBalboa(detailWorker.totalDevengado)}</p>
                  </div>
                </div>

                {detailWorker.deduccionesDetalle.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Desglose de deducciones</p>
                    <div className="space-y-1.5">
                      {detailWorker.deduccionesDetalle.map((deduction) => (
                        <div key={deduction.deduccionId} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-red-50/50 border border-red-100">
                          <span>{deduction.nombre} <span className="text-muted-foreground">({deduction.tipo === 'porcentaje' ? `${deduction.valor}%` : `$${deduction.valor}`})</span></span>
                          <span className="font-mono text-red-600 font-medium">-{formatBalboa(deduction.monto)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-red-100/50 font-semibold">
                        <span>Total deducciones</span>
                        <span className="font-mono text-red-600">-{formatBalboa(detailWorker.deducciones)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`border rounded-xl overflow-hidden ${settings.isrHabilitado ? 'border-orange-200' : 'border-muted/50 opacity-60'}`}>
                  <div className={`px-3.5 py-2.5 flex items-center justify-between ${settings.isrHabilitado ? 'bg-orange-50' : 'bg-muted/30'}`}>
                    <div>
                      <p className={`text-xs font-semibold ${settings.isrHabilitado ? 'text-orange-800' : 'text-muted-foreground'}`}>Impuesto sobre la Renta (ISR)</p>
                      {settings.isrHabilitado ? (
                        <p className="text-[10px] text-orange-600 mt-0.5">
                          Ingreso anualizado: {formatBalboa(detailWorker.ingresoAnualizado ?? 0)}
                          {(detailWorker.ingresoAnualizado ?? 0) <= 11000 && ' — Exento'}
                          {(detailWorker.ingresoAnualizado ?? 0) > 11000 && (detailWorker.ingresoAnualizado ?? 0) <= 50000 && ' — Tramo 15%'}
                          {(detailWorker.ingresoAnualizado ?? 0) > 50000 && ' — Tramo 25%'}
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground mt-0.5">ISR desactivado en Configuración</p>
                      )}
                    </div>
                    <span className={`font-mono text-sm font-bold ${settings.isrHabilitado ? 'text-orange-700' : 'text-muted-foreground'}`}>
                      {settings.isrHabilitado ? `-${formatBalboa(detailWorker.isr ?? 0)}` : '$0.00'}
                    </span>
                  </div>
                  {settings.isrHabilitado && (
                    <div className="px-3.5 py-2 bg-white space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Hasta $11,000/año</span><span>0% (exento)</span>
                      </div>
                      <div className={`flex justify-between text-[10px] ${(detailWorker.ingresoAnualizado ?? 0) > 11000 && (detailWorker.ingresoAnualizado ?? 0) <= 50000 ? 'text-orange-700 font-semibold' : 'text-muted-foreground'}`}>
                        <span>$11,001 – $50,000/año</span><span>15% s/excedente</span>
                      </div>
                      <div className={`flex justify-between text-[10px] ${(detailWorker.ingresoAnualizado ?? 0) > 50000 ? 'text-orange-700 font-semibold' : 'text-muted-foreground'}`}>
                        <span>Más de $50,000/año</span><span>$5,850 + 25% s/excedente</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-orange-100">
                        <span>ISR anual teórico</span><span className="font-mono">{formatBalboa(detailWorker.isrAnual ?? 0)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-brand-50 to-emerald-50 p-5 rounded-xl text-center border border-brand-100">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total a pagar</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{formatBalboa(detailWorker.totalPagado)}</p>
                </div>

                {detailWorker.registrosDiarios.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Registros diarios</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {detailWorker.registrosDiarios.map((record) => (
                        <div key={record.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/30 gap-3">
                          <span className="font-mono text-muted-foreground">{record.fecha}</span>
                          <span className="capitalize">{record.estado}</span>
                          <span className="text-muted-foreground">{record.proyectoId ? projectsMap.get(record.proyectoId) || 'Proyecto no encontrado' : 'Sin proyecto'}</span>
                          <span>{record.horasTrabajadas}h {record.horasExtra > 0 && `+${record.horasExtra}h extra`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
