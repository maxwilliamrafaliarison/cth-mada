'use client';

import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import Link from 'next/link';

interface StatCardProps {
  titre: string;
  valeur: string | number;
  sousTitre?: string;
  icon: PhosphorIcon;
  couleur: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  tendance?: { valeur: number; label: string };
  delayClass?: string;
  href?: string;
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

const hoverBorderColors = {
  primary: 'hover:border-[var(--primary)]/30',
  secondary: 'hover:border-[var(--secondary)]/30',
  accent: 'hover:border-[var(--accent)]/30',
  success: 'hover:border-emerald-300/50',
  warning: 'hover:border-amber-300/50',
  danger: 'hover:border-red-300/50',
  info: 'hover:border-indigo-300/50',
};

export default function StatCard({ titre, valeur, sousTitre, icon: Icon, couleur, tendance, delayClass = '', href }: StatCardProps) {
  const content = (
    <div className={`glass-card stat-card stat-${couleur} animate-fade-in opacity-0 ${delayClass} cursor-pointer
      transition-all duration-300 ease-out
      hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 hover:scale-[1.02]
      ${hoverBorderColors[couleur]}
      active:scale-[0.98] active:shadow-md`}
    >
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
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBgColors[couleur]} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={32} weight="duotone" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="group block">{content}</Link>;
  }
  return <div className="group">{content}</div>;
}
