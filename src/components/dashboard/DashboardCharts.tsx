import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  type TooltipProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type WeeklyDatum = {
  name: string;
  Presentes: number;
  Ausentes: number;
};

type CargoDatum = {
  name: string;
  value: number;
};

interface DashboardChartsProps {
  cargoDistribution: CargoDatum[];
  chartColors: string[];
  hasLoadedAttendance: boolean;
  loading: boolean;
  weeklyData: WeeklyDatum[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(226, 232, 240, 0.5)',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 88, 190, 0.1), 0 4px 6px -4px rgba(0, 88, 190, 0.1)',
        fontSize: '12px',
        padding: '10px 14px',
      }}
    >
      <p style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>{label}</p>
      {payload.map((item) => (
        <p key={String(item.name)} style={{ color: item.color, fontWeight: 500 }}>
          {item.name}: <b style={{ color: '#1e293b' }}>{item.value}</b>
        </p>
      ))}
    </div>
  );
};

export default function DashboardCharts({
  cargoDistribution,
  chartColors,
  hasLoadedAttendance,
  loading,
  weeklyData,
}: DashboardChartsProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 border-none bg-white shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
          <CardTitle className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            Asistencia Semanal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {!hasLoadedAttendance && loading ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground italic gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Clock className="w-5 h-5 text-brand-400" />
              </motion.div>
              Sincronizando registros...
            </div>
          ) : (
            <div className="h-[240px] lg:h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  />
                  <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} content={<CustomTooltip />} />
                  <Bar dataKey="Presentes" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="Ausentes" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-card">
        <CardContent className="p-8">
          <h3 className="font-heading text-lg font-bold text-foreground mb-1">Cargos</h3>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">
            {cargoDistribution.reduce((sum, item) => sum + item.value, 0)} Activos
          </p>
          {cargoDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={cargoDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {cargoDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {cargoDistribution.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: chartColors[i % chartColors.length] }}
                      />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              Sin datos
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
