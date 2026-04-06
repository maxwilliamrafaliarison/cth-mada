'use client';

import { useEffect, useState } from 'react';
import { ChartBar } from '@phosphor-icons/react';

interface ConsommationMensuelleProps {
  data: { mois: string; quantite: number }[];
}

export default function ConsommationMensuelle({ data }: ConsommationMensuelleProps) {
  const [animated, setAnimated] = useState(false);
  const maxQuantite = Math.max(...data.map(d => d.quantite), 1);
  const allZero = data.every(d => d.quantite === 0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="glass-card animate-fade-in opacity-0 delay-5">
      <div className="flex items-center gap-2 mb-5">
        <ChartBar size={22} weight="duotone" className="text-[var(--primary)]" />
        <h3 className="font-bold text-[var(--text-primary)]">Consommation mensuelle</h3>
      </div>

      {allZero ? (
        <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
          <ChartBar size={48} weight="duotone" className="mb-3 opacity-30" />
          <p className="text-sm">Aucune donnée de consommation</p>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-2 sm:gap-3" style={{ height: '200px' }}>
          {data.map((item, i) => {
            const heightPercent = (item.quantite / maxQuantite) * 100;
            return (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                {/* Valeur au-dessus de la barre */}
                <span className="text-xs font-bold text-[var(--text-primary)] mb-1">
                  {item.quantite}
                </span>

                {/* Barre */}
                <div
                  className="w-full rounded-t-md transition-all duration-1000 ease-out"
                  style={{
                    height: animated ? `${Math.max(heightPercent, 4)}%` : '0%',
                    background: 'linear-gradient(to top, var(--primary), var(--accent))',
                    minHeight: animated && item.quantite > 0 ? '8px' : '0px',
                    transitionDelay: `${i * 100}ms`,
                  }}
                />

                {/* Label du mois */}
                <span className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-2 text-center leading-tight whitespace-nowrap">
                  {item.mois}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">Total sur 6 mois</span>
          <span className="font-bold text-[var(--text-primary)] text-lg">
            {data.reduce((s, d) => s + d.quantite, 0).toLocaleString('fr-FR')} dispensations
          </span>
        </div>
      </div>
    </div>
  );
}
