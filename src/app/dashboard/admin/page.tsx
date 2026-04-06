'use client';

import Navbar from '@/components/layout/Navbar';
import {
  GearSix,
  UsersThree,
  Hospital,
  Shield,
  Database,
  UserPlus,
  PencilSimple,
  Trash,
  ArrowsLeftRight,
  MagnifyingGlass,
  X,
  Check,
  Plus,
  Warning,
  CaretDown,
  Funnel,
  Envelope,
} from '@phosphor-icons/react';
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getCentres } from '@/app/actions/stock';
import {
  getUtilisateurs,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
  assignUserToCentre,
  removeUserFromCentre,
  transferUser,
} from '@/app/actions/admin';
import type { Role } from '@/lib/rbac';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Utilisateur = Awaited<ReturnType<typeof getUtilisateurs>>[number];
type Centre = Awaited<ReturnType<typeof getCentres>>[number];

const ROLES: { value: Role; label: string; badgeClass: string }[] = [
  { value: 'administrateur', label: 'Administrateur', badgeClass: 'badge-danger' },
  { value: 'medecin', label: 'Médecin', badgeClass: 'badge-info' },
  { value: 'pharmacien', label: 'Pharmacien', badgeClass: 'badge-success' },
];

function roleBadge(role: string) {
  const r = ROLES.find(x => x.value === role);
  return r || { label: role, badgeClass: '' };
}

function initials(prenom: string, nom: string) {
  return `${(prenom?.[0] || '').toUpperCase()}${(nom?.[0] || '').toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const { isAdmin } = useUser();

  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterCentre, setFilterCentre] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<Utilisateur | null>(null);
  const [transferUserState, setTransferUserState] = useState<Utilisateur | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Utilisateur | null>(null);
  const [assignCentreUser, setAssignCentreUser] = useState<Utilisateur | null>(null);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    try {
      const [usersData, centresData] = await Promise.all([getUtilisateurs(), getCentres()]);
      setUtilisateurs(usersData);
      setCentres(centresData);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Filtered users
  // ---------------------------------------------------------------------------

  const filteredUsers = utilisateurs.filter(u => {
    if (filterCentre !== 'all') {
      const inPrimary = u.centre_id === filterCentre;
      const inSecondary = u.utilisateur_centres?.some(
        (uc: { centre_id: string }) => uc.centre_id === filterCentre
      );
      if (!inPrimary && !inSecondary) return false;
    }
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        u.nom.toLowerCase().includes(q) ||
        u.prenom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // ---------------------------------------------------------------------------
  // Centre stats
  // ---------------------------------------------------------------------------

  function centreStats(centreId: string) {
    const users = utilisateurs.filter(
      u =>
        u.centre_id === centreId ||
        u.utilisateur_centres?.some((uc: { centre_id: string }) => uc.centre_id === centreId)
    );
    const medecins = users.filter(u => u.role === 'medecin').length;
    const pharmaciens = users.filter(u => u.role === 'pharmacien').length;
    return { medecins, pharmaciens, total: users.length };
  }

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <Navbar titre="Administration" />
        <main className="p-4 md:p-6">
          <div className="space-y-6">
            <div className="glass-card animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Navbar titre="Administration" />
        <main className="p-4 md:p-6">
          <div className="glass-card text-center py-12">
            <Shield size={48} weight="duotone" className="text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Accès refusé</h2>
            <p className="text-[var(--text-muted)]">
              Seuls les administrateurs peuvent accéder à cette page.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar titre="Administration" />
      <main className="p-4 md:p-6 space-y-6">
        {error && (
          <div className="glass-card border-l-4 border-red-400 flex items-center gap-3 py-3">
            <Warning size={20} weight="duotone" className="text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* ================================================================= */}
        {/* USERS SECTION                                                     */}
        {/* ================================================================= */}
        <div className="glass-card">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <UsersThree size={22} weight="duotone" className="text-[var(--primary)]" />
              <h3 className="font-bold text-[var(--text-primary)]">
                Utilisateurs ({filteredUsers.length})
              </h3>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <UserPlus size={16} weight="duotone" />
              Ajouter un utilisateur
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                weight="duotone"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                className="glass-input pl-9 w-full"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Centre filter */}
            <div className="relative">
              <Funnel
                size={14}
                weight="duotone"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <select
                className="glass-input pl-8 pr-8 appearance-none cursor-pointer"
                value={filterCentre}
                onChange={e => setFilterCentre(e.target.value)}
              >
                <option value="all">Tous les centres</option>
                {centres.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom} — {c.ville}
                  </option>
                ))}
              </select>
              <CaretDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              />
            </div>

            {/* Role filter */}
            <div className="relative">
              <Shield
                size={14}
                weight="duotone"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <select
                className="glass-input pl-8 pr-8 appearance-none cursor-pointer"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
              >
                <option value="all">Tous les rôles</option>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <CaretDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              />
            </div>
          </div>

          {/* Users list */}
          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                Aucun utilisateur trouvé.
              </div>
            ) : (
              filteredUsers.map(user => {
                const rb = roleBadge(user.role);
                const centre = user.centre as { nom?: string; ville?: string } | null;
                const secondaryCentres = (user.utilisateur_centres || []).filter(
                  (uc: { est_principal: boolean }) => !uc.est_principal
                );
                const inactive = user.actif === false;

                return (
                  <div
                    key={user.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-white/30 hover:bg-white/50 transition-all duration-200 ${inactive ? 'opacity-50' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-bold">
                          {initials(user.prenom, user.nom)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">
                          {user.prenom} {user.nom}
                          {inactive && (
                            <span className="ml-2 text-xs text-red-400 font-normal">(inactif)</span>
                          )}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Role + centres */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${rb.badgeClass}`}>{rb.label}</span>
                      {centre && (
                        <span className="text-xs text-[var(--text-secondary)] bg-white/40 px-2 py-0.5 rounded-full">
                          {centre.nom}
                        </span>
                      )}
                      {secondaryCentres.map(
                        (uc: { centre_id: string; centre?: { nom?: string } }) => (
                          <span
                            key={uc.centre_id}
                            className="text-xs text-[var(--text-muted)] bg-white/20 px-2 py-0.5 rounded-full"
                          >
                            + {uc.centre?.nom || uc.centre_id}
                          </span>
                        )
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="btn btn-glass btn-sm"
                        title="Modifier"
                        onClick={() => setEditUser(user)}
                      >
                        <PencilSimple size={15} weight="duotone" />
                      </button>
                      <button
                        className="btn btn-glass btn-sm"
                        title="Transférer"
                        onClick={() => setTransferUserState(user)}
                      >
                        <ArrowsLeftRight size={15} weight="duotone" />
                      </button>
                      <button
                        className="btn btn-glass btn-sm"
                        title="Ajouter un centre"
                        onClick={() => setAssignCentreUser(user)}
                      >
                        <Plus size={15} weight="duotone" />
                      </button>
                      {user.actif !== false && (
                        <button
                          className="btn btn-danger btn-sm"
                          title="Désactiver"
                          onClick={() => setDeleteConfirm(user)}
                        >
                          <Trash size={15} weight="duotone" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CENTRES SECTION                                                   */}
        {/* ================================================================= */}
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <Hospital size={22} weight="duotone" className="text-[var(--accent)]" />
            <h3 className="font-bold text-[var(--text-primary)]">Centres de traitement</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {centres.map(centre => {
              const stats = centreStats(centre.id);
              return (
                <div
                  key={centre.id}
                  className="p-3 rounded-xl bg-white/30 hover:bg-white/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${centre.est_central ? 'bg-[var(--secondary)]' : 'bg-[var(--accent)]'}`}
                    />
                    <p className="font-semibold text-sm flex-1 truncate">{centre.nom}</p>
                    {centre.est_central && (
                      <span className="badge badge-secondary text-[0.6rem]">CENTRAL</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    {centre.ville} — {centre.province}
                  </p>
                  <div className="flex gap-3 text-xs">
                    <span className="text-[var(--info)]">{stats.medecins} médecin(s)</span>
                    <span className="text-[var(--success)]">{stats.pharmaciens} pharmacien(s)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CONFIG + DATABASE                                                 */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <GearSix size={22} weight="duotone" className="text-[var(--text-secondary)]" />
              <h3 className="font-bold text-[var(--text-primary)]">Configuration</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/30">
                <div className="flex items-center gap-2">
                  <Shield size={18} weight="duotone" className="text-[var(--text-muted)]" />
                  <span className="text-sm">Seuil d&apos;alerte expiration</span>
                </div>
                <span className="font-bold text-sm">90 jours</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/30">
                <div className="flex items-center gap-2">
                  <Database size={18} weight="duotone" className="text-[var(--text-muted)]" />
                  <span className="text-sm">Seuil de stock faible</span>
                </div>
                <span className="font-bold text-sm">10 unités</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/30">
                <div className="flex items-center gap-2">
                  <Envelope size={18} weight="duotone" className="text-[var(--text-muted)]" />
                  <span className="text-sm">E-mail des rapports</span>
                </div>
                <span className="text-sm text-[var(--text-secondary)]">
                  fitahiana@cth-madagascar.mg
                </span>
              </div>
            </div>
          </div>

          {/* Base de données */}
          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <Database size={22} weight="duotone" className="text-emerald-600" />
              <h3 className="font-bold text-[var(--text-primary)]">Base de données</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/30">
                <span className="text-sm">Statut Supabase</span>
                <span className="badge badge-success">Connecté</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/30">
                <span className="text-sm">Dernière synchronisation</span>
                <span className="text-sm text-[var(--text-muted)]">
                  {new Date().toLocaleString('fr-FR')}
                </span>
              </div>
              <button className="btn btn-glass btn-sm w-full">
                <Database size={14} weight="duotone" />
                Importer les données Excel existantes
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MODALS                                                            */}
        {/* ================================================================= */}

        {/* --- Create User Modal --- */}
        {showCreateModal && (
          <CreateUserModal
            centres={centres}
            onClose={() => setShowCreateModal(false)}
            onCreated={loadData}
          />
        )}

        {/* --- Edit User Modal --- */}
        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSaved={loadData}
          />
        )}

        {/* --- Transfer Modal --- */}
        {transferUserState && (
          <TransferModal
            user={transferUserState}
            centres={centres}
            onClose={() => setTransferUserState(null)}
            onTransferred={loadData}
          />
        )}

        {/* --- Assign Centre Modal --- */}
        {assignCentreUser && (
          <AssignCentreModal
            user={assignCentreUser}
            centres={centres}
            onClose={() => setAssignCentreUser(null)}
            onAssigned={loadData}
          />
        )}

        {/* --- Delete Confirmation --- */}
        {deleteConfirm && (
          <DeleteConfirmModal
            user={deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onDeleted={loadData}
          />
        )}
      </main>
    </>
  );
}

// ===========================================================================
// CREATE USER MODAL
// ===========================================================================

function CreateUserModal({
  centres,
  onClose,
  onCreated,
}: {
  centres: Centre[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    role: 'medecin' as Role,
    centre_id: centres[0]?.id || '',
    telephone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      await createUtilisateur(form);
      await onCreated();
      onClose();
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <UserPlus size={20} weight="duotone" className="text-[var(--primary)]" />
            Nouvel utilisateur
          </h3>
          <button className="btn btn-glass btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {err && (
          <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
            <Warning size={14} weight="duotone" />
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                Prénom
              </label>
              <input
                className="glass-input w-full"
                required
                value={form.prenom}
                onChange={e => set('prenom', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                Nom
              </label>
              <input
                className="glass-input w-full"
                required
                value={form.nom}
                onChange={e => set('nom', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
              Email
            </label>
            <input
              type="email"
              className="glass-input w-full"
              required
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
              Mot de passe
            </label>
            <input
              type="password"
              className="glass-input w-full"
              required
              minLength={6}
              value={form.password}
              onChange={e => set('password', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
              Téléphone
            </label>
            <input
              className="glass-input w-full"
              value={form.telephone}
              onChange={e => set('telephone', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                Rôle
              </label>
              <div className="relative">
                <select
                  className="glass-input w-full appearance-none cursor-pointer pr-8"
                  value={form.role}
                  onChange={e => set('role', e.target.value)}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <CaretDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                Centre
              </label>
              <div className="relative">
                <select
                  className="glass-input w-full appearance-none cursor-pointer pr-8"
                  value={form.centre_id}
                  onChange={e => set('centre_id', e.target.value)}
                >
                  {centres.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
                <CaretDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-glass btn-sm" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? (
                'Création...'
              ) : (
                <>
                  <Check size={14} /> Créer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================================================
// EDIT USER MODAL
// ===========================================================================

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: Utilisateur;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role as Role,
    telephone: user.telephone || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      await updateUtilisateur(user.id, form);
      await onSaved();
      onClose();
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <PencilSimple size={20} weight="duotone" className="text-[var(--primary)]" />
            Modifier — {user.prenom} {user.nom}
          </h3>
          <button className="btn btn-glass btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {err && (
          <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
            <Warning size={14} weight="duotone" />
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                Prénom
              </label>
              <input
                className="glass-input w-full"
                required
                value={form.prenom}
                onChange={e => set('prenom', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                Nom
              </label>
              <input
                className="glass-input w-full"
                required
                value={form.nom}
                onChange={e => set('nom', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
              Email
            </label>
            <input
              type="email"
              className="glass-input w-full"
              required
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
              Téléphone
            </label>
            <input
              className="glass-input w-full"
              value={form.telephone}
              onChange={e => set('telephone', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
              Rôle
            </label>
            <div className="relative">
              <select
                className="glass-input w-full appearance-none cursor-pointer pr-8"
                value={form.role}
                onChange={e => set('role', e.target.value)}
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <CaretDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-glass btn-sm" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? (
                'Enregistrement...'
              ) : (
                <>
                  <Check size={14} /> Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================================================
// TRANSFER MODAL
// ===========================================================================

function TransferModal({
  user,
  centres,
  onClose,
  onTransferred,
}: {
  user: Utilisateur;
  centres: Centre[];
  onClose: () => void;
  onTransferred: () => Promise<void>;
}) {
  const [newCentreId, setNewCentreId] = useState(user.centre_id || '');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleTransfer() {
    if (newCentreId === user.centre_id) {
      setErr("Veuillez sélectionner un centre différent du centre actuel.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await transferUser(user.id, newCentreId);
      await onTransferred();
      onClose();
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  const currentCentre = centres.find(c => c.id === user.centre_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ArrowsLeftRight size={20} weight="duotone" className="text-[var(--primary)]" />
            Transférer — {user.prenom} {user.nom}
          </h3>
          <button className="btn btn-glass btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {err && (
          <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
            <Warning size={14} weight="duotone" />
            {err}
          </div>
        )}

        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-white/30">
            <p className="text-xs text-[var(--text-muted)] mb-1">Centre principal actuel</p>
            <p className="font-semibold text-sm">
              {currentCentre?.nom || 'Aucun'}{' '}
              {currentCentre && (
                <span className="text-xs text-[var(--text-muted)]">— {currentCentre.ville}</span>
              )}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
              Nouveau centre principal
            </label>
            <div className="relative">
              <select
                className="glass-input w-full appearance-none cursor-pointer pr-8"
                value={newCentreId}
                onChange={e => setNewCentreId(e.target.value)}
              >
                {centres.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom} — {c.ville}
                  </option>
                ))}
              </select>
              <CaretDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              />
            </div>
          </div>

          {/* Show secondary centres */}
          {user.utilisateur_centres && user.utilisateur_centres.length > 0 && (
            <div className="p-3 rounded-xl bg-white/20">
              <p className="text-xs text-[var(--text-muted)] mb-2">Centres secondaires actuels</p>
              <div className="flex flex-wrap gap-1">
                {user.utilisateur_centres
                  .filter((uc: { est_principal: boolean }) => !uc.est_principal)
                  .map((uc: { centre_id: string; centre?: { nom?: string } }) => (
                    <span
                      key={uc.centre_id}
                      className="text-xs bg-white/40 px-2 py-0.5 rounded-full"
                    >
                      {uc.centre?.nom || uc.centre_id}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-glass btn-sm" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={submitting}
              onClick={handleTransfer}
            >
              {submitting ? (
                'Transfert...'
              ) : (
                <>
                  <ArrowsLeftRight size={14} /> Transférer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// ASSIGN CENTRE MODAL
// ===========================================================================

function AssignCentreModal({
  user,
  centres,
  onClose,
  onAssigned,
}: {
  user: Utilisateur;
  centres: Centre[];
  onClose: () => void;
  onAssigned: () => Promise<void>;
}) {
  const existingCentreIds = new Set(
    (user.utilisateur_centres || []).map((uc: { centre_id: string }) => uc.centre_id)
  );
  // Also include legacy centre_id
  if (user.centre_id) existingCentreIds.add(user.centre_id);

  const availableCentres = centres.filter(c => !existingCentreIds.has(c.id));

  const [selectedCentreId, setSelectedCentreId] = useState(availableCentres[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleAssign() {
    if (!selectedCentreId) return;
    setSubmitting(true);
    setErr(null);
    try {
      await assignUserToCentre(user.id, selectedCentreId);
      await onAssigned();
      onClose();
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(centreId: string) {
    setSubmitting(true);
    setErr(null);
    try {
      await removeUserFromCentre(user.id, centreId);
      await onAssigned();
      onClose();
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  const secondaryCentres = (user.utilisateur_centres || []).filter(
    (uc: { est_principal: boolean }) => !uc.est_principal
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Hospital size={20} weight="duotone" className="text-[var(--accent)]" />
            Centres — {user.prenom} {user.nom}
          </h3>
          <button className="btn btn-glass btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {err && (
          <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
            <Warning size={14} weight="duotone" />
            {err}
          </div>
        )}

        <div className="space-y-3">
          {/* Current secondary centres with remove buttons */}
          {secondaryCentres.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                Centres secondaires
              </p>
              <div className="space-y-1">
                {secondaryCentres.map(
                  (uc: { centre_id: string; centre?: { nom?: string; ville?: string } }) => (
                    <div
                      key={uc.centre_id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/30"
                    >
                      <span className="text-sm">
                        {uc.centre?.nom || uc.centre_id}{' '}
                        <span className="text-xs text-[var(--text-muted)]">
                          {uc.centre?.ville}
                        </span>
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={submitting}
                        onClick={() => handleRemove(uc.centre_id)}
                        title="Retirer ce centre"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Add new centre */}
          {availableCentres.length > 0 ? (
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                Ajouter un centre secondaire
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    className="glass-input w-full appearance-none cursor-pointer pr-8"
                    value={selectedCentreId}
                    onChange={e => setSelectedCentreId(e.target.value)}
                  >
                    {availableCentres.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nom} — {c.ville}
                      </option>
                    ))}
                  </select>
                  <CaretDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={submitting || !selectedCentreId}
                  onClick={handleAssign}
                >
                  <Plus size={14} /> Ajouter
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] text-center py-2">
              Cet utilisateur est déjà affecté à tous les centres.
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button className="btn btn-glass btn-sm" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// DELETE CONFIRMATION MODAL
// ===========================================================================

function DeleteConfirmModal({
  user,
  onClose,
  onDeleted,
}: {
  user: Utilisateur;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleDelete() {
    setSubmitting(true);
    setErr(null);
    try {
      await deleteUtilisateur(user.id);
      await onDeleted();
      onClose();
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="glass-card w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-red-600 flex items-center gap-2">
            <Warning size={20} weight="duotone" />
            Désactiver l&apos;utilisateur
          </h3>
          <button className="btn btn-glass btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {err && (
          <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
            <Warning size={14} weight="duotone" />
            {err}
          </div>
        )}

        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Voulez-vous vraiment désactiver le compte de{' '}
          <strong>
            {user.prenom} {user.nom}
          </strong>{' '}
          ? L&apos;utilisateur ne pourra plus se connecter.
        </p>

        <div className="flex justify-end gap-2">
          <button className="btn btn-glass btn-sm" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-danger btn-sm" disabled={submitting} onClick={handleDelete}>
            {submitting ? (
              'Désactivation...'
            ) : (
              <>
                <Trash size={14} /> Désactiver
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
