'use client';

import { Warning, Clock, X } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { getAlertes } from '@/app/actions/alertes';

export default function AlertesBanner() {
  const [visible, setVisible] = useState(true);
  const [alertesUrgentes, setAlertesUrgentes] = useState<Array<{ id: string; message: string; niveau: string; lue: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlertes({ lue: false })
      .then((data) => {
        const urgentes = data.filter(
          (a: { niveau: string }) => a.niveau === 'urgent' || a.niveau === 'critique'
        );
        setAlertesUrgentes(urgentes);
      })
      .catch(() => {
        setAlertesUrgentes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card animate-pulse !bg-red-50/80 !border-red-200/50 !p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100/60" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-red-100/60 rounded" />
            <div className="h-3 w-48 bg-red-100/60 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!visible || alertesUrgentes.length === 0) return null;

  return (
    <div className="glass-card animate-fade-in !bg-red-50/80 !border-red-200/50 !p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <Warning size={22} weight="duotone" className="text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-red-800 text-sm mb-1">
            {alertesUrgentes.length} alerte{alertesUrgentes.length > 1 ? 's' : ''} urgente{alertesUrgentes.length > 1 ? 's' : ''}
          </h3>
          <ul className="space-y-1">
            {alertesUrgentes.map(a => (
              <li key={a.id} className="flex items-center gap-2 text-sm text-red-700">
                <Clock size={14} weight="duotone" className="flex-shrink-0" />
                <span>{a.message}</span>
              </li>
            ))}
          </ul>
        </div>
        <button onClick={() => setVisible(false)} className="text-red-400 hover:text-red-600 p-1">
          <X size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
