import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAttendanceRecords } from '@/lib/appData';
import type { AttendanceRecord } from '@/types';
import { toast } from 'sonner';

export function useAttendanceRealtime(empresaId: string | null, date: string) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    setError(null);
    try {
      const records = await fetchAttendanceRecords(empresaId, { date });
      setAttendance(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar asistencias');
      toast.error('Error al sincronizar con Supabase');
    } finally {
      setLoading(false);
    }
  }, [empresaId, date]);

  useEffect(() => {
    loadData();

    if (!empresaId || !supabase) return;

    // Suscripción Realtime
    const channel = supabase
      .channel(`attendance-realtime-${date}-${empresaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asistencias',
          filter: `empresa_id=eq.${empresaId}`,
        },
        (payload) => {
          // Filtrar por fecha localmente si el payload lo permite (Supabase Realtime v2 filters are limited)
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // Solo procesar si la fecha coincide con la que estamos viendo
          if (
            (newRecord && newRecord.fecha === date) ||
            (oldRecord && !newRecord && attendance.find(r => r.id === oldRecord.id)?.fecha === date)
          ) {
            setAttendance((current) => {
              if (payload.eventType === 'INSERT') {
                const record: AttendanceRecord = {
                    id: newRecord.id,
                    trabajadorId: newRecord.trabajador_id,
                    fecha: newRecord.fecha,
                    estado: newRecord.estado,
                    horasTrabajadas: Number(newRecord.horas_trabajadas || 0),
                    horasExtra: Number(newRecord.horas_extra || 0),
                    proyectoId: newRecord.proyecto_id,
                    observaciones: newRecord.observaciones || undefined,
                };
                // Si ya existe por algún motivo, actualizarlo, si no añadirlo
                const exists = current.find(r => r.id === record.id);
                if (exists) return current.map(r => r.id === record.id ? record : r);
                return [...current, record];
              }

              if (payload.eventType === 'UPDATE') {
                const record: AttendanceRecord = {
                    id: newRecord.id,
                    trabajadorId: newRecord.trabajador_id,
                    fecha: newRecord.fecha,
                    estado: newRecord.estado,
                    horasTrabajadas: Number(newRecord.horas_trabajadas || 0),
                    horasExtra: Number(newRecord.horas_extra || 0),
                    proyectoId: newRecord.proyecto_id,
                    observaciones: newRecord.observaciones || undefined,
                };
                return current.map(r => r.id === record.id ? record : r);
              }

              if (payload.eventType === 'DELETE') {
                return current.filter(r => r.id !== oldRecord.id);
              }

              return current;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId, date, loadData]);

  return { attendance, loading, error, refresh: loadData };
}
