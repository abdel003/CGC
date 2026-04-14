import { useState, useRef } from 'react';
import { formatBalboa } from '@/lib/exportUtils';
import type { PayrollSummary, PayrollDetail } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Printer, Trash2, ChevronRight, Building2, FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Receipts() {
  const savedPayrolls = useAppStore(s => s.savedPayrolls);
  const settings = useAppStore(s => s.settings);
  const deletePayroll = useAppStore(s => s.deletePayroll);
  const getPayrollDetails = useAppStore(s => s.getPayrollDetails);
  const loading = useAppStore(s => s.loading);
  
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
  const selectedPayroll = savedPayrolls.find(p => p.id === selectedPayrollId) || null;
  const [receiptDetail, setReceiptDetail] = useState<PayrollDetail | null>(null);
  const [receiptPayroll, setReceiptPayroll] = useState<PayrollSummary | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const hiddenReceiptRef = useRef<HTMLDivElement>(null);

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExportAllToZip = async () => {
    if (!selectedPayroll) return;
    
    // Ensure details are loaded before export
    if (!selectedPayroll.detalles) {
      await getPayrollDetails(selectedPayroll.id);
    }
    
    // Refresh ref to new state with details
    const currentPayroll = savedPayrolls.find(p => p.id === selectedPayroll.id);
    if (!currentPayroll || !currentPayroll.detalles) {
      toast.error('No se pudieron obtener los detalles para exportar');
      return;
    }

    setIsExportingZip(true);
    setExportProgress(0);
    const [{ default: JSZip }, { captureElementAsPng, downloadZip }] = await Promise.all([
      import('jszip'),
      import('@/lib/exportUtils'),
    ]);
    const zip = new JSZip();
    const toastId = toast.loading('Generando comprobantes...');

    try {
      const details = currentPayroll.detalles;
      for (let i = 0; i < details.length; i++) {
        const detail = details[i];
        setExportProgress(i + 1);
        
        setReceiptDetail(detail);
        setReceiptPayroll(currentPayroll);
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const container = hiddenReceiptRef.current;
        if (container) {
          const blob = await captureElementAsPng(container);
          if (blob) {
            const fileName = `${detail.trabajador.nombre.replace(/\s/g, '_')}_Recibo.png`;
            zip.file(fileName, blob);
          }
        }
      }

      const zipName = `Planilla_${(selectedPayroll.proyectoNombre || 'General').replace(/\s/g, '_')}_${selectedPayroll.fechaInicio}.zip`;
      await downloadZip(zip, zipName);
      toast.success('¡Descarga completada!', { id: toastId });
    } catch (error) {
      toast.error('Error en la descarga masiva', { id: toastId });
      console.error(error);
    } finally {
      setIsExportingZip(false);
      setExportProgress(0);
      setReceiptDetail(null);
      setReceiptPayroll(null);
    }
  };

  const fmtDate = (dateStr: string) => new Date(dateStr + 'T12:00:00').toLocaleDateString('es-419', { day: 'numeric', month: 'short' });
  const fmtDateFull = (dateStr: string) => new Date(dateStr + 'T12:00:00').toLocaleDateString('es-419', { day: 'numeric', month: 'short', year: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  const openReceipt = (detail: PayrollDetail, payroll: PayrollSummary) => {
    setReceiptDetail(detail);
    setReceiptPayroll(payroll);
  };

  const handleDeletePayroll = async (id: string) => {
    try {
      await deletePayroll(id);
      setSelectedPayrollId(null);
      toast.success('Planilla eliminada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la planilla');
    }
  };

  const tipoPagoLabel: Record<string, string> = {
    diario: 'Diario',
    semanal: 'Semanal',
    bisemanal: 'Bisemanal',
    mensual: 'Mensual',
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-extrabold font-heading tracking-tight text-foreground">Comprobantes</h1>
            {selectedPayroll && (
              <Button 
                variant="outline" 
                size="default" 
                className="gap-2 w-full sm:w-auto h-11 shadow-sm" 
                disabled={isExportingZip}
                onClick={handleExportAllToZip}
                aria-label={isExportingZip ? 'Exportando comprobantes en ZIP' : 'Exportar todos los comprobantes en ZIP'}
              >
                <FileDown className="w-4 h-4" /> 
                {isExportingZip ? `Procesando (${exportProgress}/${selectedPayroll.detalles?.length || 0})` : 'Exportar Todo a ZIP'}
              </Button>
            )}
          </div>
        <p className="text-sm text-muted-foreground">Genera e imprime recibos de pago individuales</p>
      </div>

      {savedPayrolls.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No hay planillas guardadas</h3>
            <p className="text-sm text-muted-foreground">
              Calcula y guarda una planilla para ver los recibos aquí.
            </p>
          </CardContent>
        </Card>
      ) : !selectedPayroll ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Selecciona un período de planilla:</p>
          <div className="grid grid-cols-1 gap-3">
            {savedPayrolls.map((p) => (
              <Card 
                key={p.id} 
                className="cursor-pointer hover:shadow-md transition-all group border-border/50" 
                onClick={async () => {
                  setSelectedPayrollId(p.id);
                  if (!p.detalles) {
                    await getPayrollDetails(p.id);
                  }
                }}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-bold text-foreground">
                      {fmtDate(p.fechaInicio)} — {fmtDateFull(p.fechaFin)}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 truncate">{p.totalTrabajadores} empleados{p.proyectoNombre ? ` · ${p.proyectoNombre}` : ""}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 shrink-0">Neto: <span className="text-emerald-600 font-mono">{formatBalboa(p.totalPagado)}</span></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 flex-1 sm:flex-none">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 sm:h-9 sm:w-9 text-brand-600 border-brand-100 hover:bg-brand-50"
                        title="Excel"
                        aria-label={`Exportar planilla ${fmtDate(p.fechaInicio)} a Excel`}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!p.detalles) {
                            await getPayrollDetails(p.id);
                          }
                          const fresh = useAppStore.getState().savedPayrolls.find(item => item.id === p.id);
                          if (fresh?.detalles) {
                            const { exportPayrollToExcel } = await import('@/lib/exportUtils');
                            exportPayrollToExcel(fresh.detalles, p.fechaInicio, p.fechaFin, p.proyectoNombre);
                          } else {
                            toast.error('No se pudieron cargar los detalles');
                          }
                        }}
                      >
                        <FileDown className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-10 w-10 sm:h-9 sm:w-9 text-destructive border-destructive/20 hover:bg-destructive/5 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-destructive flex items-center gap-2">
                              <Trash2 className="w-5 h-5" />
                              ¿Eliminar planilla?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600">
                              Esta acción no se puede deshacer. Los recibos y el resumen de este período se perderán permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4 gap-2">
                            <AlertDialogCancel className="cursor-pointer h-11 sm:h-10">Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePayroll(p.id);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer h-11 sm:h-10"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <Button variant="default" size="sm" className="flex-1 sm:flex-none h-10 sm:h-9 px-4 cursor-pointer font-bold text-xs uppercase tracking-wider" aria-label={`Ver recibos de la planilla ${fmtDate(p.fechaInicio)}`} onClick={async () => {
                      setSelectedPayrollId(p.id);
                      if (!p.detalles) await getPayrollDetails(p.id);
                    }}>
                      Ver planilla <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setSelectedPayrollId(null)} className="h-10 w-10 shrink-0" aria-label="Volver al listado de planillas">←</Button>
              <div>
                <p className="text-base font-bold text-foreground">
                  {fmtDate(selectedPayroll.fechaInicio)} — {fmtDateFull(selectedPayroll.fechaFin)}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">{selectedPayroll.totalTrabajadores} empleados{selectedPayroll.proyectoNombre ? ` · ${selectedPayroll.proyectoNombre}` : ''}</p>
              </div>
            </div>
          </div>

          {/* Tarjetas móviles */}
          <div className="lg:hidden space-y-2">
            {!selectedPayroll.detalles ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-xs">Cargando detalles de la planilla...</p>
              </div>
            ) : selectedPayroll.detalles.length === 0 ? (
              <p className="text-center py-8 text-xs text-muted-foreground">No hay detalles en esta planilla</p>
            ) : (
              selectedPayroll.detalles.map((d) => (
                <Card key={d.trabajadorId} className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{d.trabajador.nombre}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-0.5">{d.trabajador.cargo}{d.proyectoNombre ? ` · ${d.proyectoNombre}` : ''}</p>
                      </div>
                      <p className="text-sm font-black text-emerald-600 font-mono shrink-0">{formatBalboa(d.totalPagado)}</p>
                    </div>
                    <Button variant="outline" size="default" className="w-full h-11 gap-2 text-xs font-bold uppercase tracking-wider" aria-label={`Ver comprobante de ${d.trabajador.nombre}`} onClick={() => openReceipt(d, selectedPayroll)}>
                      <Printer className="w-4 h-4" /> Ver Comprobante
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Tabla de escritorio */}
          <div className="hidden lg:block border rounded-lg overflow-hidden">
            {!selectedPayroll.detalles ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm">Recuperando detalles históricos...</p>
              </div>
            ) : (
              <Table>
                <TableCaption>Recibos disponibles para la planilla seleccionada.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Cargo / Proyecto</TableHead>
                    <TableHead className="text-right">Neto Pagado</TableHead>
                    <TableHead className="text-center w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPayroll.detalles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                        No se encontraron registros en esta planilla.
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedPayroll.detalles.map((d) => (
                      <TableRow key={d.trabajadorId}>
                        <TableCell className="font-semibold text-sm">{d.trabajador.nombre}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {d.trabajador.cargo}
                          {d.proyectoNombre ? (
                            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                              {d.proyectoNombre}
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right font-bold text-success">{formatBalboa(d.totalPagado)}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm" className="h-8 gap-1.5" aria-label={`Abrir recibo de ${d.trabajador.nombre}`} onClick={() => openReceipt(d, selectedPayroll)}>
                            <Printer className="w-3.5 h-3.5" /> Recibo
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}

      {/* Diálogo de recibo */}
      <Dialog open={!!receiptDetail} onOpenChange={(o) => { if (!o) { setReceiptDetail(null); setReceiptPayroll(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {receiptDetail && receiptPayroll && (
            <>
              <DialogHeader className="print:hidden border-b pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full pr-8">
                  <div>
                    <DialogTitle className="text-xl font-extrabold font-heading tracking-tight">Comprobante de Pago</DialogTitle>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Vista previa para impresión digital</p>
                  </div>
                  <Button size="default" className="gap-2 h-11 sm:h-10 px-6 font-bold uppercase tracking-widest text-xs" onClick={handlePrint} aria-label="Imprimir comprobante actual">
                    <Printer className="w-4 h-4" /> Imprimir Ahora
                  </Button>
                </div>
              </DialogHeader>

              <div ref={receiptRef} className="receipt-printable space-y-4 mt-2" id="receipt-content">
                {/* Encabezado */}
                <div className="border-b-2 border-slate-950 pb-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 mb-2">
                    <img src="/logo.png" alt="Logo" className="h-40 w-auto object-contain invert" />
                    <h2 className="text-xl font-black font-heading tracking-tight text-slate-900 mt-2">{settings.nombreEmpresa}</h2>
                  </div>
                  {settings.idEmpresa && (
                    <p className="text-xs text-muted-foreground">RUC: {settings.idEmpresa}</p>
                  )}
                  <p className="text-sm font-medium mt-2">RECIBO DE PAGO</p>
                  {receiptPayroll.proyectoNombre && (
                    <p className="text-xs text-muted-foreground mt-1">Proyecto: {receiptPayroll.proyectoNombre}</p>
                  )}
                </div>

                {/* Info del período y empleado */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Información del Trabajador</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-brand-100 text-brand-800 px-2 py-0.5 rounded text-[10px] font-bold">PROYECTO: {receiptDetail.proyectoNombre || 'GENERAL'}</span>
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">CÉDULA: {receiptDetail.trabajador.cedula}</span>
                      </div>
                      <p className="font-bold text-lg mt-1 text-foreground leading-tight">{receiptDetail.trabajador.nombre.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{receiptDetail.trabajador.cargo}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Período de pago</p>
                    <p className="font-semibold">
                      {fmtDate(receiptPayroll.fechaInicio)} — {fmtDateFull(receiptPayroll.fechaFin)}
                    </p>
                    <p className="text-xs text-muted-foreground">Fecha de ingreso: {new Date(receiptDetail.trabajador.fechaIngreso + 'T12:00:00').toLocaleDateString('es-419')}</p>
                    <p className="text-xs text-muted-foreground">Tipo de pago: {tipoPagoLabel[receiptDetail.trabajador.tipoPago] || receiptDetail.trabajador.tipoPago}</p>
                  </div>
                </div>

                {/* Ingresos */}
                <div>
                  <p className="text-sm font-semibold mb-2 uppercase tracking-wide">Ingresos</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Descripción</TableHead>
                        <TableHead className="text-xs text-center">Cantidad</TableHead>
                        <TableHead className="text-xs text-right">Tarifa</TableHead>
                        <TableHead className="text-xs text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-sm font-medium">Salario Ordinario</TableCell>
                        <TableCell className="text-sm text-center">{receiptDetail.registrosDiarios.reduce((sum, r) => sum + r.horasTrabajadas, 0)} horas</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatBalboa(receiptDetail.trabajador.salarioHora)}/hora</TableCell>
                        <TableCell className="text-sm text-right font-mono font-medium">{formatBalboa(receiptDetail.salarioBase)}</TableCell>
                      </TableRow>
                      {(receiptDetail.domingosTrabajados ?? 0) > 0 && (
                        <TableRow className="border-b last:border-0 border-slate-100 hover:bg-transparent">
                          <TableCell className="text-sm font-medium">Recargo por Días Especiales</TableCell>
                          <TableCell className="text-sm text-center">{receiptDetail.domingosTrabajados} días</TableCell>
                          <TableCell className="text-sm text-right font-mono text-muted-foreground">—</TableCell>
                          <TableCell className="text-sm text-right font-mono font-medium">{formatBalboa(receiptDetail.pagoDomingos ?? 0)}</TableCell>
                        </TableRow>
                      )}
                      {receiptDetail.horasExtraTotal > 0 && (
                        <TableRow className="border-b last:border-0 border-slate-100 hover:bg-transparent">
                          <TableCell className="text-sm font-medium">Horas Extraordinarias</TableCell>
                          <TableCell className="text-sm text-center">{receiptDetail.horasExtraTotal} horas</TableCell>
                          <TableCell className="text-sm text-right font-mono">{formatBalboa(receiptDetail.trabajador.salarioHora * settings.multiplicadorHorasExtra)}/hora</TableCell>
                          <TableCell className="text-sm text-right font-mono font-medium">{formatBalboa(receiptDetail.pagoHorasExtra)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="border-t-2">
                        <TableCell colSpan={3} className="text-sm font-semibold">Salario Bruto (Devengado)</TableCell>
                        <TableCell className="text-sm text-right font-mono font-bold">{formatBalboa(receiptDetail.totalDevengado)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Deducciones */}
                {receiptDetail.deduccionesDetalle && receiptDetail.deduccionesDetalle.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 uppercase tracking-wide">Deducciones</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Descripción</TableHead>
                          <TableHead className="text-xs text-right">Tasa / Valor</TableHead>
                          <TableHead className="text-xs text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receiptDetail.deduccionesDetalle.map((ded) => (
                          <TableRow key={ded.deduccionId}>
                            <TableCell className="text-sm">{ded.nombre}</TableCell>
                            <TableCell className="text-sm text-right font-mono">
                              {ded.tipo === 'porcentaje' ? `${ded.valor}%` : fmt(ded.valor)}
                            </TableCell>
                            <TableCell className="text-sm text-right font-mono text-destructive">-{formatBalboa(ded.monto)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2">
                          <TableCell colSpan={2} className="text-sm font-semibold">Total deducciones</TableCell>
                          <TableCell className="text-sm text-right font-mono font-bold text-destructive">-{formatBalboa(receiptDetail.deducciones + (receiptDetail.isr || 0))}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* ISR en el recibo */}
                {(receiptDetail.isr ?? 0) > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 uppercase tracking-wide">Impuesto sobre la Renta (ISR)</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Descripción</TableHead>
                          <TableHead className="text-xs text-right">Base anualizada</TableHead>
                          <TableHead className="text-xs text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-sm">
                            ISR —{' '}
                            {(receiptDetail.ingresoAnualizado ?? 0) <= 11000 && 'Exento'}
                            {(receiptDetail.ingresoAnualizado ?? 0) > 11000 && (receiptDetail.ingresoAnualizado ?? 0) <= 50000 && 'Tramo 15%'}
                            {(receiptDetail.ingresoAnualizado ?? 0) > 50000 && 'Tramo 25%'}
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono">{formatBalboa(receiptDetail.ingresoAnualizado ?? 0)}/año</TableCell>
                          <TableCell className="text-sm text-right font-mono text-orange-600">-{formatBalboa(receiptDetail.isr ?? 0)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Neto a pagar */}
                <div className="bg-brand-50/50 border-2 border-brand-200 p-8 rounded-2xl text-center shadow-inner">
                  <p className="text-[10px] text-brand-700 font-black uppercase tracking-widest mb-2">Neto a Pagar</p>
                  <p className="text-4xl font-black text-brand-600 drop-shadow-sm leading-none tabular-nums">{formatBalboa(receiptDetail.totalPagado)}</p>
                  <p className="text-[9px] text-muted-foreground mt-4 font-bold tracking-widest uppercase">Balboas — Panamá</p>
                </div>

                {/* Firmas */}
                <div className="grid grid-cols-2 gap-8 pt-8 mt-4">
                  <div className="text-center">
                    <div className="border-t border-foreground pt-2">
                      <p className="text-xs text-muted-foreground">Firma del Empleador</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-foreground pt-2">
                      <p className="text-xs text-muted-foreground">Firma del Empleado</p>
                    </div>
                  </div>
                </div>

                {/* Pie de página */}
                <div className="text-center text-[10px] text-muted-foreground pt-2 border-t">
                  <p>Generado el {new Date().toLocaleDateString('es-419', { year: 'numeric', month: 'long', day: 'numeric' })} · {settings.nombreEmpresa}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden container for batch image generation (Mirrors the Dialog layout exactly) */}
      <div className="fixed -left-[5000px] top-0 opacity-0 pointer-events-none p-10 bg-white" style={{ width: '800px' }}>
        <div ref={hiddenReceiptRef} className="bg-white p-10 border border-slate-200">
          {isExportingZip && receiptDetail && receiptPayroll && (
            <div className="space-y-6">
              {/* Encabezado */}
              <div className="border-b-2 border-slate-950 pb-6 text-center">
                <div className="flex flex-col items-center justify-center gap-3 mb-3">
                  <img src="/logo.png" alt="Logo" className="h-64 w-auto object-contain invert" />
                  <h2 className="text-3xl font-black font-heading tracking-tight text-slate-950 mt-2">{settings.nombreEmpresa}</h2>
                </div>
                {settings.idEmpresa && (
                  <p className="text-xs text-muted-foreground">RUC: {settings.idEmpresa}</p>
                )}
                <p className="text-sm font-bold mt-4 tracking-widest">RECIBO DE PAGO</p>
                {receiptPayroll.proyectoNombre && (
                  <p className="text-xs text-muted-foreground mt-1">Proyecto: {receiptPayroll.proyectoNombre}</p>
                )}
              </div>

              {/* Info del período y empleado */}
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div className="space-y-1">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Información del Trabajador</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 uppercase">PROYECTO: {receiptDetail.proyectoNombre || 'GENERAL'}</span>
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 uppercase">CÉDULA: {receiptDetail.trabajador.cedula}</span>
                    </div>
                    <p className="font-bold text-2xl mt-2 text-foreground leading-tight">{receiptDetail.trabajador.nombre.toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">{receiptDetail.trabajador.cargo}</p>
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Período de pago</p>
                  <p className="font-bold text-lg">
                    {fmtDate(receiptPayroll.fechaInicio)} — {fmtDateFull(receiptPayroll.fechaFin)}
                  </p>
                  <p className="text-xs text-muted-foreground">Fecha de ingreso: {new Date(receiptDetail.trabajador.fechaIngreso + 'T12:00:00').toLocaleDateString('es-419')}</p>
                  <p className="text-xs text-muted-foreground">Tipo de pago: {tipoPagoLabel[receiptDetail.trabajador.tipoPago] || receiptDetail.trabajador.tipoPago}</p>
                </div>
              </div>

              {/* Ingresos */}
              <div>
                <p className="text-xs font-bold mb-3 uppercase tracking-widest text-slate-900">Ingresos</p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Descripción</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-center">Cantidad</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Tarifa</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-sm font-semibold">Salario Ordinario</TableCell>
                        <TableCell className="text-sm text-center">{receiptDetail.registrosDiarios.reduce((sum, r) => sum + r.horasTrabajadas, 0)} horas</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatBalboa(receiptDetail.trabajador.salarioHora)}/hora</TableCell>
                        <TableCell className="text-sm text-right font-mono font-bold">{formatBalboa(receiptDetail.salarioBase)}</TableCell>
                      </TableRow>
                      {(receiptDetail.domingosTrabajados ?? 0) > 0 && (
                        <TableRow>
                          <TableCell className="text-sm font-semibold">Recargo por Días Especiales</TableCell>
                          <TableCell className="text-sm text-center">{receiptDetail.domingosTrabajados} días</TableCell>
                          <TableCell className="text-sm text-right font-mono">—</TableCell>
                          <TableCell className="text-sm text-right font-mono font-bold">{formatBalboa(receiptDetail.pagoDomingos ?? 0)}</TableCell>
                        </TableRow>
                      )}
                      {receiptDetail.horasExtraTotal > 0 && (
                        <TableRow>
                          <TableCell className="text-sm font-semibold">Horas Extraordinarias</TableCell>
                          <TableCell className="text-sm text-center">{receiptDetail.horasExtraTotal} horas</TableCell>
                          <TableCell className="text-sm text-right font-mono">{formatBalboa(receiptDetail.trabajador.salarioHora * settings.multiplicadorHorasExtra)}/hora</TableCell>
                          <TableCell className="text-sm text-right font-mono font-bold">{formatBalboa(receiptDetail.pagoHorasExtra)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-slate-50/50">
                        <TableCell colSpan={3} className="text-sm font-bold uppercase">Salario Bruto (Devengado)</TableCell>
                        <TableCell className="text-sm text-right font-mono font-black">{formatBalboa(receiptDetail.totalDevengado)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Deducciones */}
              <div>
                <p className="text-xs font-bold mb-3 uppercase tracking-widest text-slate-900">Deducciones</p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Descripción</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Tasa / Valor</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiptDetail.deduccionesDetalle.map((ded) => (
                        <TableRow key={ded.deduccionId}>
                          <TableCell className="text-sm font-medium">{ded.nombre}</TableCell>
                          <TableCell className="text-sm text-right font-mono">
                            {ded.tipo === 'porcentaje' ? `${ded.valor}%` : formatBalboa(ded.valor)}
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono font-bold text-red-600">-{formatBalboa(ded.monto)}</TableCell>
                        </TableRow>
                      ))}
                      {(receiptDetail.isr ?? 0) > 0 && (
                        <TableRow>
                          <TableCell className="text-sm font-medium">Retención ISR</TableCell>
                          <TableCell className="text-sm text-right font-mono text-muted-foreground">Tablas ISR</TableCell>
                          <TableCell className="text-sm text-right font-mono font-bold text-red-600">-{formatBalboa(receiptDetail.isr ?? 0)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-red-50/30">
                        <TableCell colSpan={2} className="text-sm font-bold uppercase">Total Deducciones</TableCell>
                        <TableCell className="text-sm text-right font-mono font-black text-red-600">-{formatBalboa(receiptDetail.deducciones + (receiptDetail.isr || 0))}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Neto a pagar */}
              <div className="bg-brand-50/50 border-2 border-brand-200 p-8 rounded-2xl text-center shadow-inner">
                <p className="text-[10px] text-brand-700 font-black uppercase tracking-widest mb-2">Neto a Pagar</p>
                <p className="text-4xl font-black text-brand-600 drop-shadow-sm leading-none tabular-nums">{formatBalboa(receiptDetail.totalPagado)}</p>
                <p className="text-[9px] text-muted-foreground mt-4 font-bold tracking-widest uppercase">Balboas — Panamá</p>
              </div>

              {/* Footer opcional */}
              <div className="pt-8 text-center text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                <p>Generado por {settings.nombreEmpresa} el {new Date().toLocaleDateString('es-419')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
