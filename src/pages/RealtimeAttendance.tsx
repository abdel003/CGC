import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/shallow';
import { useAttendanceRealtime } from '@/hooks/useAttendanceRealtime';
import { todayLocalDate, shiftDate } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import type { AttendanceStatus } from '@/types';

const statusConfig: Record<AttendanceStatus, { label: string; color: string; icon: any }> = {
  asistio: { label: 'Asistió', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  falta: { label: 'Falta', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', icon: XCircle },
  permiso: { label: 'Permiso', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: Info },
  incapacidad: { label: 'Incapacidad', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: Activity },
  vacaciones: { label: 'Vacaciones', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', icon: Calendar },
};

export default function RealtimeAttendance() {
  const [selectedDate, setSelectedDate] = useState(todayLocalDate());
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('todos');

  const { workers, projects, empresaId } = useAppStore(
    useShallow((s) => ({
      workers: s.workers.filter(w => w.estado === 'activo'),
      projects: s.projects,
      empresaId: s.empresaId,
    }))
  );

  const { attendance, loading, error, refresh } = useAttendanceRealtime(empresaId, selectedDate);

  const stats = useMemo(() => {
    const total = workers.length;
    const present = attendance.filter(a => a.estado === 'asistio').length;
    const absent = attendance.filter(a => a.estado === 'falta').length;
    const others = attendance.length - present - absent;
    const pending = total - attendance.length;

    return { total, present, absent, others, pending };
  }, [workers, attendance]);

  const filteredData = useMemo(() => {
    const q = search.toLowerCase().trim();
    return workers.filter(w => {
      const matchSearch = !q || w.nombre.toLowerCase().includes(q) || w.cedula.includes(q);
      const record = attendance.find(a => a.trabajadorId === w.id);
      const currentProjectId = record?.proyectoId || w.proyectoId;
      const matchProject = filterProject === 'todos' || currentProjectId === filterProject;
      return matchSearch && matchProject;
    }).map(w => ({
      worker: w,
      record: attendance.find(a => a.trabajadorId === w.id),
      project: projects.find(p => p.id === (attendance.find(a => a.trabajadorId === w.id)?.proyectoId || w.proyectoId))
    }));
  }, [workers, attendance, projects, search, filterProject]);

  const changeDate = (days: number) => {
    setSelectedDate(shiftDate(selectedDate, days));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">En Vivo (Supabase)</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            Monitor de Asistencia
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Visualización de personal en tiempo real y flujo de datos directo.</p>
        </div>

        <div className="flex bg-white/50 backdrop-blur-sm border border-border/50 p-1 rounded-2xl shadow-sm items-center">
          <Button variant="ghost" size="icon" onClick={() => changeDate(-1)} className="rounded-xl h-10 w-10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="px-4 flex flex-col items-center min-w-[140px]">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-center focus:ring-0 cursor-pointer"
            />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => changeDate(1)} className="rounded-xl h-10 w-10">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Personal Total', value: stats.total, icon: Users, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Presentes', value: stats.present, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Ausentes', value: stats.absent, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Especiales', value: stats.others, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((item, idx) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="border-none shadow-sm overflow-hidden bg-white/80 backdrop-blur-md hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
                  <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-500 transition-colors" />
          <Input 
            placeholder="Buscar por nombre o cédula..." 
            className="pl-11 h-12 bg-white/60 border-border/60 rounded-2xl shadow-sm focus:ring-brand-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-full md:w-[240px] h-12 bg-white/60 border-border/60 rounded-2xl shadow-sm">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filtrar por proyecto" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60">
              <SelectItem value="todos">Todos los proyectos</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={refresh}
            className="h-12 w-12 rounded-2xl bg-white/60 hover:bg-white border-border/60 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="p-12 text-center bg-rose-50 border border-rose-100 rounded-3xl">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-rose-900 mb-1">Error de conexión</h3>
          <p className="text-rose-700/70 text-sm max-w-md mx-auto">{error}</p>
        </div>
      ) : loading && attendance.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-40 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="p-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[40px]">
          <Activity className="h-16 w-16 text-slate-300 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-slate-400">No se encontraron registros</h3>
          <p className="text-slate-400/70 text-sm mt-1">Ajusta los filtros o selecciona otra fecha.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredData.map(({ worker, record, project }, idx) => {
              const status = record?.estado || 'falta';
              const config = statusConfig[status];
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={worker.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.2) }}
                  className="group relative"
                >
                  <Card className={`overflow-hidden border-none shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    record ? 'bg-white' : 'bg-slate-50/50 grayscale-[0.3]'
                  }`}>
                    {/* Status Top Bar */}
                    <div className={`h-1.5 w-full ${config.color.split(' ')[1]}`} />
                    
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 duration-500 shadow-sm ${
                            record ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {worker.nombre.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 leading-tight group-hover:text-brand-600 transition-colors uppercase text-sm tracking-tight">
                              {worker.nombre}
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-bold tracking-widest mt-0.5">{worker.cargo}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-400 uppercase tracking-widest text-[9px]">Proyecto</span>
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            {project?.nombre || 'General'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${config.color} ${
                            !record ? 'opacity-50' : ''
                          }`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
                          </div>
                          
                          {record && (
                             <div className="text-right">
                               <p className="text-[10px] font-black text-slate-900 leading-none">{record.horasTrabajadas}h</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Laboradas</p>
                             </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State Footer */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="flex items-center justify-center gap-4 pt-10 text-muted-foreground animate-in slide-in-from-bottom duration-1000">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-border" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Fin de la lista</p>
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-border" />
        </div>
      )}
    </div>
  );
}
