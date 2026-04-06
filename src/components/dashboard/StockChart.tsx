'use client';

import { Package } from 'lucide-react';

interface StockChartProps {
  data: { type: string; quantite: number }[];
}

const barColors = ['#001965', '#C72127', '#3B97DE', '#F59E0B'];

export default function StockChart({ data }: StockChartProps) {
  const maxQuantite = Math.max(...data.map(d => d.quantite));

  return (
    <div className="glass-card animate-fade-in opacity-0 delay-5">
      <div className="flex items-center gap-2 mb-5">
        <Package className="w-5 h-5 text-[var(--primary)]" />
        <h3 className="font-bold text-[var(--text-primary)]">Stock par type de facteur</h3>
      </div>
      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={item.type}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-[var(--text-secondary)]">{item.type}</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{item.quantite.toLocaleString('fr-FR')} unités</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${(item.quantite / maxQuantite) * 100}%`,
                  backgroundColor: barColors[i % barColors.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">Total en stock</span>
          <span className="font-bold text-[var(--text-primary)] text-lg">
            {data.reduce((s, d) => s + d.quantite, 0).toLocaleString('fr-FR')} unités
          </span>
        </div>
      </div>
    </div>
  );
}
