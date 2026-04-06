'use client';

import Navbar from '@/components/layout/Navbar';
import { useState } from 'react';
import { ScanBarcode, Camera, Keyboard, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import { lots, medicaments } from '@/lib/demo-data';

export default function ScannerPage() {
  const [mode, setMode] = useState<'douchette' | 'camera' | 'manuel'>('douchette');
  const [codeInput, setCodeInput] = useState('');
  const [result, setResult] = useState<typeof lots[0] | null>(null);
  const [error, setError] = useState('');

  const handleSearch = (code: string) => {
    setError('');
    setResult(null);
    const lot = lots.find(l => l.numero_lot === code || l.code_barre === code);
    if (lot) {
      setResult(lot);
    } else {
      setError(`Aucun lot trouvé pour le code "${code}"`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && codeInput.trim()) {
      handleSearch(codeInput.trim());
    }
  };

  const resultMed = result ? medicaments.find(m => m.id === result.medicament_id) : null;
  const joursExp = result ? Math.ceil((new Date(result.date_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <>
      <Navbar titre="Scanner de codes-barres" />
      <main className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Mode selection */}
          <div className="glass-card mb-6">
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Mode de saisie</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setMode('douchette')}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  mode === 'douchette' ? 'border-[var(--primary)] bg-blue-50/50' : 'border-transparent bg-white/30 hover:bg-white/50'
                }`}
              >
                <ScanBarcode className={`w-8 h-8 mx-auto mb-2 ${mode === 'douchette' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                <p className="text-sm font-semibold">Douchette USB</p>
                <p className="text-xs text-[var(--text-muted)]">Scanner avec lecteur branché</p>
              </button>
              <button
                onClick={() => setMode('camera')}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  mode === 'camera' ? 'border-[var(--primary)] bg-blue-50/50' : 'border-transparent bg-white/30 hover:bg-white/50'
                }`}
              >
                <Camera className={`w-8 h-8 mx-auto mb-2 ${mode === 'camera' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                <p className="text-sm font-semibold">Caméra</p>
                <p className="text-xs text-[var(--text-muted)]">Photo du code-barres</p>
              </button>
              <button
                onClick={() => setMode('manuel')}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  mode === 'manuel' ? 'border-[var(--primary)] bg-blue-50/50' : 'border-transparent bg-white/30 hover:bg-white/50'
                }`}
              >
                <Keyboard className={`w-8 h-8 mx-auto mb-2 ${mode === 'manuel' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                <p className="text-sm font-semibold">Saisie manuelle</p>
                <p className="text-xs text-[var(--text-muted)]">Entrer le n° de lot</p>
              </button>
            </div>
          </div>

          {/* Zone de scan */}
          <div className="glass-card mb-6">
            {mode === 'douchette' && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <ScanBarcode className="w-10 h-10 text-[var(--primary)]" />
                </div>
                <h4 className="font-bold text-lg mb-2">Mode douchette USB</h4>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Scannez le code-barres du médicament avec votre douchette USB. Le code sera automatiquement saisi.
                </p>
                <input
                  type="text"
                  className="glass-input w-full max-w-md mx-auto text-center text-lg font-mono"
                  placeholder="Scannez ou tapez le code-barres..."
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <p className="text-xs text-[var(--text-muted)] mt-2">Appuyez sur Entrée pour rechercher</p>
              </div>
            )}

            {mode === 'camera' && (
              <div className="text-center">
                <div className="w-full h-64 rounded-xl bg-gray-900 flex items-center justify-center mb-4 relative overflow-hidden">
                  <div className="absolute inset-4 border-2 border-dashed border-white/30 rounded-lg" />
                  <div className="absolute w-48 h-0.5 bg-red-500/60 animate-pulse" />
                  <Camera className="w-16 h-16 text-white/30" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Placez le code-barres du médicament dans le cadre de la caméra.
                </p>
                <button className="btn btn-primary mt-3">
                  <Camera className="w-4 h-4" />
                  Activer la caméra
                </button>
              </div>
            )}

            {mode === 'manuel' && (
              <div className="text-center">
                <h4 className="font-bold text-lg mb-2">Saisie manuelle</h4>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Entrez le numéro de lot du médicament.</p>
                <div className="flex gap-2 max-w-md mx-auto">
                  <input
                    type="text"
                    className="glass-input flex-1 text-center font-mono"
                    placeholder="Ex: P100506556, 2714PR7..."
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button className="btn btn-primary" onClick={() => handleSearch(codeInput.trim())}>
                    Rechercher
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <p className="text-xs text-[var(--text-muted)] w-full mb-1">Exemples de lots en stock :</p>
                  {lots.slice(0, 5).map(l => (
                    <button key={l.id} className="text-xs font-mono px-2 py-1 rounded bg-white/50 hover:bg-white/80 transition-colors"
                      onClick={() => { setCodeInput(l.numero_lot); handleSearch(l.numero_lot); }}>
                      {l.numero_lot}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Résultat */}
          {error && (
            <div className="glass-card !bg-red-50/80 !border-red-200/50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {result && resultMed && (
            <div className="glass-card !bg-emerald-50/50 !border-emerald-200/50 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <h4 className="font-bold text-emerald-800">Médicament identifié</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Produit</span>
                    <span className="font-bold">{resultMed.nom_complet}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Type de facteur</span>
                    <span className="badge badge-primary">{resultMed.type_facteur}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Indication</span>
                    <span>{resultMed.indication}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Fabricant</span>
                    <span>{resultMed.fabricant}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">N° de lot</span>
                    <span className="font-mono font-bold">{result.numero_lot}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Quantité restante</span>
                    <span className="font-bold">{result.quantite_restante} / {result.quantite_recue}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Date d&apos;expiration</span>
                    <span className={`font-bold ${joursExp <= 90 ? 'text-red-600' : ''}`}>
                      {new Date(result.date_expiration).toLocaleDateString('fr-FR')} ({joursExp}j)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Conservation</span>
                    <span>{resultMed.conservation}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-emerald-200/50">
                <button className="btn btn-primary flex-1">
                  <Package className="w-4 h-4" />
                  Ajouter au stock
                </button>
                <button className="btn btn-glass flex-1">
                  Voir l&apos;historique du lot
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
