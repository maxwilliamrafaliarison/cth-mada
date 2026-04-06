'use client';

import { Hospital } from '@phosphor-icons/react';

interface Props {
  data: { centre: string; count: number }[];
}

export default function StockParCentre({ data }: Props) {
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="glass-card animate-fade-in opacity-0 delay-6">
      <div className="flex items-center gap-2 mb-5">
        <Hospital size={22} weight="duotone" className="text-[var(--accent)]" />
        <h3 className="font-bold text-[var(--text-primary)]">Patients par centre</h3>
      </div>
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={item.centre} className="flex items-center gap-3">
            <span className="text-xs font-medium text-[var(--text-secondary)] w-32 truncate flex-shrink-0">{item.centre}</span>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: i === 0 ? '#001965' : i === 1 ? '#3B97DE' : '#94B8D8',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)] w-8 text-right">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
