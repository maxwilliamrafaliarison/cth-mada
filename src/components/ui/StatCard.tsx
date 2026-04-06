'use client';

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  titre: string;
  valeur: string | number;
  sousTitre?: string;
  icon: LucideIcon;
  couleur: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  tendance?: { valeur: number; label: string };
  delayClass?: string;
}

const iconBgColors = {
  primary: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  secondary: 'bg-[var(--secondary)]/10 text-[var(--secondary)]',
  accent: 'bg-[var(--accent)]/10 text-[var(--accent)]',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-indigo-50 text-indigo-600',
};

export default function StatCard({ titre, valeur, sousTitre, icon: Icon, couleur, tendance, delayClass = '' }: StatCardProps) {
  return (
    <div className={`glass-card stat-card stat-${couleur} animate-fade-in opacity-0 ${delayClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">{titre}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">{valeur}</p>
          {sousTitre && (
            <p className="text-xs text-[var(--text-secondary)]">{sousTitre}</p>
          )}
          {tendance && (
            <p className={`text-xs font-medium mt-1 ${tendance.valeur >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {tendance.valeur >= 0 ? '↑' : '↓'} {Math.abs(tendance.valeur)}% {tendance.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBgColors[couleur]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
