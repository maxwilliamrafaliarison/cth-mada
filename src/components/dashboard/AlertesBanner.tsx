'use client';

import { AlertTriangle, Clock, X } from 'lucide-react';
import { useState } from 'react';
import { alertes } from '@/lib/demo-data';

export default function AlertesBanner() {
  const [visible, setVisible] = useState(true);
  const alertesUrgentes = alertes.filter(a => !a.lue && (a.niveau === 'urgent' || a.niveau === 'critique'));

  if (!visible || alertesUrgentes.length === 0) return null;

  return (
    <div className="glass-card animate-fade-in !bg-red-50/80 !border-red-200/50 !p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-red-800 text-sm mb-1">
            {alertesUrgentes.length} alerte{alertesUrgentes.length > 1 ? 's' : ''} urgente{alertesUrgentes.length > 1 ? 's' : ''}
          </h3>
          <ul className="space-y-1">
            {alertesUrgentes.map(a => (
              <li key={a.id} className="flex items-center gap-2 text-sm text-red-700">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{a.message}</span>
              </li>
            ))}
          </ul>
        </div>
        <button onClick={() => setVisible(false)} className="text-red-400 hover:text-red-600 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
