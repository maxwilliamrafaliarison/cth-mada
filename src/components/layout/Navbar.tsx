'use client';

import { BellRinging, MagnifyingGlass, UserCircle, Hospital, CaretDown } from '@phosphor-icons/react';
import { useState } from 'react';

interface NavbarProps {
  titre: string;
}

export default function Navbar({ titre }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="glass-navbar sticky top-0 z-30 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Titre de la page */}
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{titre}</h2>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Recherche */}
          <div className={`relative transition-all duration-300 ${searchOpen ? 'w-64' : 'w-10'}`}>
            {searchOpen ? (
              <input
                type="text"
                placeholder="Rechercher un patient, médicament..."
                className="glass-input w-full pr-10"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            ) : null}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`${searchOpen ? 'absolute right-2 top-1/2 -translate-y-1/2' : ''} p-2 rounded-xl hover:bg-white/50 transition-colors text-[var(--text-secondary)]`}
            >
              <MagnifyingGlass size={20} weight="duotone" />
            </button>
          </div>

          {/* Centre actuel */}
          <button className="btn-glass btn-sm flex items-center gap-2">
            <Hospital size={18} weight="duotone" className="text-[var(--primary)]" />
            <span className="text-sm font-medium hidden md:inline">CTH Antananarivo</span>
            <CaretDown size={14} className="text-[var(--text-muted)]" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-white/50 transition-colors text-[var(--text-secondary)]">
            <BellRinging size={20} weight="duotone" />
            <span className="absolute -top-0.5 -right-0.5 bg-[var(--secondary)] text-white text-[0.6rem] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
              4
            </span>
          </button>

          {/* Profil */}
          <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
              <UserCircle size={20} weight="duotone" className="text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">Dr FETY André</p>
              <p className="text-[0.65rem] text-[var(--text-muted)]">Médecin</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
