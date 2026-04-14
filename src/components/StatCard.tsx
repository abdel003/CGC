import type { LucideIcon } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { Link } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: { value: number; label: string };
  link?: string;
  delay?: number;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  prefix = '',
  suffix = '',
  decimals = 0,
  trend,
  link,
  delay = 0,
}: StatCardProps) {
  const content = (
    <div
      className="stat-card group"
      style={{ animationDelay: `${delay}ms`, animation: `slide-up 0.4s ease-out ${delay}ms forwards`, opacity: 0 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              trend.value >= 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div>
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          className="text-2xl font-bold text-foreground tracking-tight"
        />
        <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link} className="block">{content}</Link>;
  }

  return content;
}
