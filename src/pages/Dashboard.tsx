import { lazy, Suspense, useEffect, useMemo } from 'react';
import { Users, ClipboardCheck, Calculator, TrendingUp, ArrowRight, CalendarDays, DollarSign } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import StatCard from '@/components/StatCard';
import { useShallow } from 'zustand/shallow';
import { formatLocalDate, todayLocalDate } from '@/lib/date';

const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts'));

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

export default function Dashboard() {
  const { workers, attendance, savedPayrolls, projects, loadAttendanceByRange, loading } = useAppStore(
    useShallow((s) => ({
      workers: s.workers,
      attendance: s.attendance,
      savedPayrolls: s.savedPayrolls,
      projects: s.projects,
      loadAttendanceByRange: s.loadAttendanceByRange,
      loading: s.loading,
    })),
  );

  const activeWorkers = useMemo(() => workers.filter((w) => w.estado === 'activo'), [workers]);
  const today = useMemo(() => todayLocalDate(), []);

  useEffect(() => {
    const end = todayLocalDate();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const start = formatLocalDate(startDate);
    loadAttendanceByRange(start, end);
  }, [loadAttendanceByRange]);

  const hasLoadedAttendance = useMemo(() => attendance.length > 0, [attendance]);
  const todayAttendance = useMemo(() => attendance.filter((a) => a.fecha === today), [attendance, today]);
  const presentToday = useMemo(() => todayAttendance.filter((a) => a.estado === 'asistio').length, [todayAttendance]);

  const weeklyData = useMemo(() => {
    const countsByDate = new Map<string, number>();
    attendance.forEach((a) => {
      if (a.estado === 'asistio') {
        const current = countsByDate.get(a.fecha) || 0;
        countsByDate.set(a.fecha, current + 1);
      }
    });

    const days: { name: string; Presentes: number; Ausentes: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatLocalDate(d);
      const dayName = d.toLocaleDateString('es-419', { weekday: 'short' });

      const present = countsByDate.get(dateStr) || 0;
      days.push({
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        Presentes: present,
        Ausentes: Math.max(0, activeWorkers.length - present),
      });
    }
    return days;
  }, [attendance, activeWorkers.length]);

  const cargoDistribution = useMemo(() => {
    const map = new Map<string, number>();
    activeWorkers.forEach((w) => {
      map.set(w.cargo, (map.get(w.cargo) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [activeWorkers]);

  const chartColors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  const lastPayrollTotal = savedPayrolls.length > 0 ? savedPayrolls[0].totalPagado : 0;

  const recentActivity = useMemo(() => {
    return attendance
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 5)
      .map((record) => {
        const worker = workers.find((w) => w.id === record.trabajadorId);
        return { ...record, workerName: worker?.nombre || 'Desconocido', workerCargo: worker?.cargo || '' };
      });
  }, [attendance, workers]);

  const statusLabel: Record<string, string> = {
    asistio: 'Asistió',
    falta: 'Falta',
    permiso: 'Permiso',
    incapacidad: 'Incapacidad',
    vacaciones: 'Vacaciones',
  };

  const statusColor: Record<string, string> = {
    asistio: 'bg-emerald-50 text-emerald-700',
    falta: 'bg-red-50 text-red-700',
    permiso: 'bg-amber-50 text-amber-700',
    incapacidad: 'bg-blue-50 text-blue-700',
    vacaciones: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-[1.5rem] p-6 shadow-2xl transition-all duration-700 hover:shadow-brand-500/10 group lg:rounded-[2rem] lg:p-10"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-20 transition-opacity duration-700 group-hover:opacity-30">
          <div className="absolute -right-10 -top-20 h-96 w-96 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        </div>
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-100 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
            {getGreeting()}
          </div>
          <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-white lg:text-4xl">
            Panel de <span className="text-blue-400">Control</span> CGC
          </h2>
          <p className="max-w-xl text-sm font-medium text-blue-200/60 lg:text-base">
            Resumen operacional estratégico ·{' '}
            {new Date().toLocaleDateString('es-419', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Trabajadores activos"
          value={activeWorkers.length}
          icon={Users}
          gradient="gradient-blue"
          link="/trabajadores"
          delay={0}
        />
        <StatCard
          label="Presentes hoy"
          value={presentToday}
          icon={ClipboardCheck}
          gradient="gradient-emerald"
          link="/asistencia"
          delay={80}
        />
        <StatCard
          label="Proyectos activos"
          value={projects.filter((project) => project.estado === 'activo').length}
          icon={TrendingUp}
          gradient="gradient-rose"
          link="/proyectos"
          delay={160}
        />
        <StatCard
          label="Última planilla"
          value={lastPayrollTotal}
          icon={DollarSign}
          gradient="gradient-amber"
          prefix="$"
          decimals={2}
          link="/planilla"
          delay={240}
        />
      </div>

      <Suspense
        fallback={
          <Card className="border-border/50 shadow-card">
            <CardContent className="p-10 text-center text-muted-foreground">Cargando visualizaciones...</CardContent>
          </Card>
        }
      >
        <DashboardCharts
          cargoDistribution={cargoDistribution}
          chartColors={chartColors}
          hasLoadedAttendance={hasLoadedAttendance}
          loading={loading}
          weeklyData={weeklyData}
        />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50 shadow-card">
          <CardContent className="p-5">
            <h3 className="mb-4 font-semibold text-foreground">Acciones rápidas</h3>
            <div className="space-y-2">
              <Link
                to="/asistencia"
                className="group flex cursor-pointer items-center gap-4 rounded-xl bg-brand-50 p-3.5 transition-all duration-200 hover:bg-brand-100"
              >
                <div className="gradient-blue flex h-10 w-10 items-center justify-center rounded-lg shadow-sm">
                  <ClipboardCheck className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Pasar asistencia</p>
                  <p className="text-xs text-muted-foreground">Registrar asistencia del día</p>
                </div>
                <ArrowRight className="h-4 w-4 text-brand-400 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/planilla"
                className="group flex cursor-pointer items-center gap-4 rounded-xl bg-emerald-50 p-3.5 transition-all duration-200 hover:bg-emerald-100"
              >
                <div className="gradient-emerald flex h-10 w-10 items-center justify-center rounded-lg shadow-sm">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Generar planilla</p>
                  <p className="text-xs text-muted-foreground">Calcular planilla por rango de fechas</p>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/comprobantes"
                className="group flex cursor-pointer items-center gap-4 rounded-xl bg-amber-50 p-3.5 transition-all duration-200 hover:bg-amber-100"
              >
                <div className="gradient-amber flex h-10 w-10 items-center justify-center rounded-lg shadow-sm">
                  <CalendarDays className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Comprobantes</p>
                  <p className="text-xs text-muted-foreground">Generar e imprimir recibos de pago</p>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-400 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-card">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Actividad reciente</h3>
              <Link to="/asistencia" className="cursor-pointer text-xs font-medium text-brand-500 hover:text-brand-700">
                Ver todo
              </Link>
            </div>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((record) => (
                  <div key={record.id} className="flex items-center gap-3 border-b border-border/40 py-2 last:border-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-50">
                      <span className="text-xs font-bold text-brand-600">{record.workerName.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{record.workerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.workerCargo} · {record.fecha}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusColor[record.estado] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel[record.estado] || record.estado}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ClipboardCheck className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No hay registros de asistencia</p>
                <p className="mt-1 text-xs text-muted-foreground/70">Comienza registrando asistencia</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
