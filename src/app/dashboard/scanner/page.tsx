'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Barcode, Camera, Keyboard, Package, CheckCircle, Warning, MagnifyingGlass, ArrowRight, Stop } from '@phosphor-icons/react';
import { getLots } from '@/app/actions/stock';

type LotWithMedicament = Awaited<ReturnType<typeof getLots>>[number];

export default function ScannerPage() {
  const [mode, setMode] = useState<'douchette' | 'camera' | 'manuel'>('manuel');
  const [codeInput, setCodeInput] = useState('');
  const [result, setResult] = useState<LotWithMedicament | null>(null);
  const [error, setError] = useState('');
  const [lots, setLots] = useState<LotWithMedicament[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    getLots()
      .then(data => setLots(data))
      .catch(() => setLots([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = useCallback((code: string) => {
    if (!code) return;
    setError('');
    setResult(null);
    const normalized = code.trim().toLowerCase();
    const lot = lots.find(l =>
      l.numero_lot?.toLowerCase() === normalized ||
      (l as Record<string, unknown>).code_barre === code.trim() ||
      l.numero_lot?.toLowerCase().includes(normalized)
    );
    if (lot) {
      setResult(lot);
      // Stop camera after successful scan
      if (cameraActive) stopCamera();
    } else {
      setError(`Aucun lot trouvé pour "${code.trim()}"`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lots, cameraActive]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && codeInput.trim()) handleSearch(codeInput.trim());
  };

  // Camera barcode scanning
  const startCamera = async () => {
    setCameraError('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scannerId = 'barcode-scanner';

      if (!document.getElementById(scannerId)) {
        setCameraError('Conteneur vidéo introuvable.');
        return;
      }

      const scanner = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText: string) => {
          setCodeInput(decodedText);
          handleSearch(decodedText);
        },
        () => {
          // Ignore scan failures (continuous scanning)
        }
      );
      setCameraActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('permission')) {
        setCameraError('Accès à la caméra refusé. Autorisez l\'accès dans les paramètres de votre navigateur.');
      } else if (msg.includes('NotFound') || msg.includes('not found')) {
        setCameraError('Aucune caméra détectée sur cet appareil.');
      } else {
        setCameraError(`Erreur caméra: ${msg}`);
      }
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch {
      // Ignore stop errors
    }
    setCameraActive(false);
  };

  // Cleanup on unmount or mode change
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (mode !== 'camera' && cameraActive) {
      stopCamera();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const resultMed = result?.medicament as Record<string, string> | null;
  const joursExp = result ? Math.ceil((new Date(result.date_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const pctRestant = result ? Math.round(((result.quantite_restante || 0) / (result.quantite_recue || 1)) * 100) : 0;

  if (loading) {
    return (
      <>
        <Navbar titre="Scanner de codes-barres" />
        <main className="p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="glass-card animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-12 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar titre="Scanner de codes-barres" />
      <main className="p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Mode selection */}
          <div className="glass-card">
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Mode de saisie</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => { setMode('douchette'); setTimeout(() => inputRef.current?.focus(), 100); }}
                className={`p-3 rounded-xl border-2 transition-all text-center ${mode === 'douchette' ? 'border-[var(--primary)] bg-blue-50/50' : 'border-transparent bg-white/30 hover:bg-white/50'}`}
              >
                <Barcode size={24} weight="duotone" className={`mx-auto mb-1 ${mode === 'douchette' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                <p className="text-xs font-semibold">Douchette USB</p>
              </button>
              <button
                onClick={() => setMode('camera')}
                className={`p-3 rounded-xl border-2 transition-all text-center ${mode === 'camera' ? 'border-[var(--primary)] bg-blue-50/50' : 'border-transparent bg-white/30 hover:bg-white/50'}`}
              >
                <Camera size={24} weight="duotone" className={`mx-auto mb-1 ${mode === 'camera' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                <p className="text-xs font-semibold">Caméra</p>
              </button>
              <button
                onClick={() => { setMode('manuel'); setTimeout(() => inputRef.current?.focus(), 100); }}
                className={`p-3 rounded-xl border-2 transition-all text-center ${mode === 'manuel' ? 'border-[var(--primary)] bg-blue-50/50' : 'border-transparent bg-white/30 hover:bg-white/50'}`}
              >
                <Keyboard size={24} weight="duotone" className={`mx-auto mb-1 ${mode === 'manuel' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                <p className="text-xs font-semibold">Saisie manuelle</p>
              </button>
            </div>
          </div>

          {/* Camera mode */}
          {mode === 'camera' && (
            <div className="glass-card">
              <div ref={scannerRef} className="relative">
                <div id="barcode-scanner" className="w-full rounded-xl overflow-hidden" style={{ minHeight: cameraActive ? 300 : 0 }} />
                {!cameraActive && (
                  <div className="text-center py-8">
                    <Camera size={48} weight="duotone" className="text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                      Utilisez la caméra pour scanner le code-barres du médicament.
                    </p>
                    <button className="btn btn-primary" onClick={startCamera}>
                      <Camera size={18} weight="duotone" />
                      Activer la caméra
                    </button>
                  </div>
                )}
                {cameraActive && (
                  <div className="text-center mt-3">
                    <p className="text-sm text-[var(--text-secondary)] mb-2">Pointez la caméra vers le code-barres du médicament</p>
                    <button className="btn btn-danger btn-sm" onClick={stopCamera}>
                      <Stop size={16} weight="bold" />
                      Arrêter la caméra
                    </button>
                  </div>
                )}
              </div>
              {cameraError && (
                <div className="mt-3 p-3 rounded-xl bg-red-50/80 border border-red-200/50">
                  <div className="flex items-center gap-2">
                    <Warning size={18} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{cameraError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text input modes (douchette & manual) */}
          {mode !== 'camera' && (
            <div className="glass-card">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    ref={inputRef}
                    type="text"
                    className="glass-input w-full pl-10 font-mono text-base"
                    placeholder={mode === 'douchette' ? 'Scannez le code-barres...' : 'Entrez le numéro de lot...'}
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                </div>
                <button className="btn btn-primary" onClick={() => handleSearch(codeInput.trim())}>
                  <MagnifyingGlass size={18} weight="bold" />
                  Rechercher
                </button>
              </div>

              {/* Quick lot buttons */}
              {!result && lots.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200/30">
                  <p className="text-xs text-[var(--text-muted)] mb-2">Lots en stock :</p>
                  <div className="flex flex-wrap gap-2">
                    {lots.slice(0, 8).map(l => (
                      <button
                        key={l.id}
                        className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-white/40 hover:bg-white/70 border border-gray-200/30 transition-all flex items-center gap-1.5"
                        onClick={() => { setCodeInput(l.numero_lot); handleSearch(l.numero_lot); }}
                      >
                        {l.numero_lot}
                        <ArrowRight size={10} className="text-[var(--text-muted)]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="glass-card !bg-red-50/80 !border-red-200/50 animate-fade-in">
              <div className="flex items-center gap-3">
                <Warning size={24} weight="duotone" className="text-red-500 flex-shrink-0" />
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && resultMed && (
            <div className="glass-card !bg-emerald-50/50 !border-emerald-200/50 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={24} weight="duotone" className="text-emerald-500" />
                <h4 className="font-bold text-emerald-800">Lot identifié</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Produit</p>
                    <p className="font-bold text-sm">{resultMed.nom_complet}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Type de facteur</p>
                    <span className="badge badge-primary">{resultMed.type_facteur}</span>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Fabricant</p>
                    <p className="text-sm">{resultMed.fabricant || '-'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">N° de lot</p>
                    <p className="font-mono font-bold text-sm">{result.numero_lot}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Stock restant</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{result.quantite_restante} / {result.quantite_recue} UI</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pctRestant > 50 ? 'bg-emerald-500' : pctRestant > 20 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${pctRestant}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Expiration</p>
                    <p className={`text-sm font-bold ${joursExp <= 0 ? 'text-red-600' : joursExp <= 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {new Date(result.date_expiration).toLocaleDateString('fr-FR')}
                      {joursExp <= 0 ? ' (expiré)' : ` (${joursExp} jours)`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-emerald-200/50">
                <button
                  className="btn btn-glass flex-1 text-sm"
                  onClick={() => { setResult(null); setCodeInput(''); setError(''); inputRef.current?.focus(); }}
                >
                  <Package size={16} weight="duotone" />
                  Nouveau scan
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
