'use client';

import { Heartbeat } from '@phosphor-icons/react';

interface Props {
  data: { severite: string; count: number }[];
}

const severiteColors: Record<string, { bg: string; text: string; ring: string }> = {
  'Sévère': { bg: 'bg-red-100', text: 'text-red-700', ring: '#EF4444' },
  'Modérée': { bg: 'bg-amber-100', text: 'text-amber-700', ring: '#F59E0B' },
  'Mineure': { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: '#10B981' },
  'Décédé': { bg: 'bg-gray-100', text: 'text-gray-600', ring: '#9CA3AF' },
};

export default function PatientsBySeverity({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="glass-card animate-fade-in opacity-0 delay-6">
      <div className="flex items-center gap-2 mb-5">
        <Heartbeat size={22} weight="duotone" className="text-[var(--secondary)]" />
        <h3 className="font-bold text-[var(--text-primary)]">Répartition par sévérité</h3>
      </div>

      {/* Donut-like visualization */}
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {data.reduce((acc, item, i) => {
              const percentage = (item.count / total) * 100;
              const circumference = 2 * Math.PI * 38;
              const offset = acc.offset;
              const color = severiteColors[item.severite]?.ring || '#9CA3AF';
              acc.elements.push(
                <circle
                  key={item.severite}
                  cx="50" cy="50" r="38"
                  fill="none"
                  stroke={color}
                  strokeWidth="10"
                  strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              );
              acc.offset += (percentage / 100) * circumference;
              return acc;
            }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[var(--text-primary)]">{total}</span>
            <span className="text-[0.65rem] text-[var(--text-muted)]">patients</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {data.map(item => {
            const style = severiteColors[item.severite] || severiteColors['Décédé'];
            const pct = ((item.count / total) * 100).toFixed(1);
            return (
              <div key={item.severite} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: style.ring }} />
                  <span className="text-sm font-medium text-[var(--text-secondary)]">{item.severite}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{item.count}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-1">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
