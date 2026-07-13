'use client';

import React from 'react';
import { Check, Headphones, Pencil, Plus, Search, Shield, Trash2, Unlock, UserRound, X } from 'lucide-react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  adminManager,
  type AdminUser,
  type AdminUserPayload,
  type AdminUserRole,
} from '@/features/admin/admin';
import { authManager } from '@/features/auth/auth';

const roleOptions: Array<{ value: AdminUserRole; label: string; className: string }> = [
  { value: 'ROLE_ADMIN', label: 'Admin', className: 'border-brand-purple/40 bg-brand-purple/10 text-brand-purple' },
  { value: 'ROLE_AGENT', label: 'Agent', className: 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan' },
  { value: 'ROLE_CLUB', label: 'Club', className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
];

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: AdminUserRole[];
};

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roles: [],
};

function AdminUsersManager() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [search, setSearch] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<AdminUser | null>(null);
  const [supportUser, setSupportUser] = React.useState<AdminUser | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [message, setMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const fetchUsers = React.useCallback(async (value = '') => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await adminManager.getUsers(value.trim());
      if (response.ok) {
        setUsers(response.data.users);
      } else {
        setErrorMessage(readError(response.data, 'Impossible de charger les utilisateurs.'));
      }
    } catch {
      setErrorMessage('Impossible de charger les utilisateurs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchUsers('');
  }, [fetchUsers]);

  function openCreateForm() {
    setEditingUser(null);
    setForm(emptyForm);
    setFieldErrors({});
    setErrorMessage(null);
    setIsFormOpen(true);
  }

  function openEditForm(user: AdminUser) {
    setEditingUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      roles: user.roles,
    });
    setFieldErrors({});
    setErrorMessage(null);
    setIsFormOpen(true);
  }

  function toggleRole(role: AdminUserRole) {
    setForm((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    const payload: AdminUserPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      roles: form.roles,
      ...(form.password.trim() ? { password: form.password } : {}),
    };

    try {
      const response = editingUser
        ? await adminManager.updateUser(editingUser.id, payload)
        : await adminManager.createUser(payload);

      if (!response.ok) {
        setFieldErrors(readFieldErrors(response.data));
        setErrorMessage(readError(response.data, 'Impossible d’enregistrer cet utilisateur.'));
        return;
      }

      setMessage(response.data.message);
      setUsers((current) => {
        if (!editingUser) {
          return [response.data.user, ...current];
        }

        return current.map((user) => user.id === response.data.user.id ? response.data.user : user);
      });
      setIsFormOpen(false);
    } catch {
      setErrorMessage('Impossible d’enregistrer cet utilisateur.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingUser) {
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await adminManager.deleteUser(deletingUser.id);
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible de supprimer cet utilisateur.'));
        return;
      }

      setMessage(response.data.message);
      setUsers((current) => current.filter((user) => user.id !== deletingUser.id));
      setDeletingUser(null);
    } catch {
      setErrorMessage('Impossible de supprimer cet utilisateur.');
    } finally {
      setIsSaving(false);
    }
  }

  async function startSupport(){if(!supportUser)return;setIsSaving(true);setErrorMessage(null);try{const response=await authManager.startSupportSession(supportUser.email);if(!response.ok||!response.data.active){setErrorMessage(readError(response.data,'Impossible d’ouvrir le mode support.'));setIsSaving(false);return}window.location.assign('/dashboard')}catch{setErrorMessage('Impossible d’ouvrir le mode support.');setIsSaving(false)}}

  async function handleUnban(userId: string) {
    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await adminManager.unbanUser(userId);
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible de débannir cet utilisateur.'));
        return;
      }

      setMessage(response.data.message);
      setUsers((current) => current.map((user) => user.id === response.data.user.id ? response.data.user : user));
    } catch {
      setErrorMessage('Impossible de débannir cet utilisateur.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void fetchUsers(search);
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#071722]/85 p-5 shadow-2xl shadow-black/20 md:p-7">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Utilisateurs</h2>
          <p className="mt-1 text-sm text-gray-400">Comptes administrateurs, agents et clubs.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="flex min-w-0 items-center gap-2">
            <label className="sr-only" htmlFor="admin-user-search">Rechercher</label>
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 focus-within:border-brand-cyan">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                id="admin-user-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
                placeholder="Nom ou email"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
              aria-label="Lancer la recherche"
            >
              <Check className="h-4 w-4" />
            </button>
          </form>

          <Button type="button" onClick={openCreateForm} icon={<Plus className="h-4 w-4" />} className="h-10 px-4 py-2">
            Créer
          </Button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm text-brand-cyan">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-400">Chargement des utilisateurs...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-400">Aucun utilisateur trouvé.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-xs uppercase tracking-[0.14em] text-gray-500">
                <th className="px-3 py-2 font-semibold">Utilisateur</th>
                <th className="px-3 py-2 font-semibold">Rôles</th>
                <th className="px-3 py-2 font-semibold">Sécurité</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="bg-[#0A1B2B]/70 text-sm text-gray-300">
                  <td className="rounded-l-lg border-y border-l border-white/10 px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{user.firstName} {user.lastName}</p>
                        <p className="truncate text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="border-y border-white/10 px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.length === 0 ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-400">
                          Utilisateur
                        </span>
                      ) : user.roles.map((role) => (
                        <RoleBadge key={role} role={role} />
                      ))}
                    </div>
                  </td>
                  <td className="border-y border-white/10 px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${user.twoFactorEnabled ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/5 text-gray-400'}`}>
                        2FA {user.twoFactorEnabled ? 'actif' : 'inactif'}
                      </span>
                      {user.passwordExpired && (
                        <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                          Mot de passe expiré
                        </span>
                      )}
                      {user.banned && (
                        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                          Banni jusqu’au {formatDate(user.bannedUntil)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="rounded-r-lg border-y border-r border-white/10 px-3 py-4">
                    <div className="flex justify-end gap-2">
                      {user.roles.some(role=>role==='ROLE_AGENT'||role==='ROLE_CLUB')&&<button type="button" onClick={()=>setSupportUser(user)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan transition-colors hover:bg-brand-cyan/20" aria-label={`Assister ${user.firstName} ${user.lastName}`} title="Ouvrir le mode support"><Headphones className="h-4 w-4"/></button>}
                      {user.banned && (
                        <button
                          type="button"
                          onClick={() => handleUnban(user.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 transition-colors hover:bg-emerald-400/20"
                          aria-label={`Débannir ${user.firstName} ${user.lastName}`}
                        >
                          <Unlock className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditForm(user)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
                        aria-label={`Modifier ${user.firstName} ${user.lastName}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingUser(user)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20"
                        aria-label={`Supprimer ${user.firstName} ${user.lastName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingUser ? 'Modifier un utilisateur' : 'Créer un utilisateur'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Prénom"
              value={form.firstName}
              onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
              error={fieldErrors.firstName}
              required
            />
            <Input
              label="Nom"
              value={form.lastName}
              onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
              error={fieldErrors.lastName}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            error={fieldErrors.email}
            required
          />

          <Input
            label={editingUser ? 'Nouveau mot de passe' : 'Mot de passe'}
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            error={fieldErrors.password}
            required={!editingUser}
          />

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200">
              <Shield className="h-4 w-4 text-gray-400" />
              Rôles
            </div>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => {
                const isSelected = form.roles.includes(role.value);

                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => toggleRole(role.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${isSelected ? role.className : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    {role.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} icon={<X className="h-4 w-4" />}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSaving} icon={<Check className="h-4 w-4" />}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Supprimer l’utilisateur"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-300">
            Confirmer la suppression de <span className="font-semibold text-white">{deletingUser?.firstName} {deletingUser?.lastName}</span>.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setDeletingUser(null)} icon={<X className="h-4 w-4" />}>
              Annuler
            </Button>
            <Button type="button" isLoading={isSaving} onClick={handleDelete} icon={<Trash2 className="h-4 w-4" />}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={!!supportUser} onClose={()=>setSupportUser(null)} title="Ouvrir le mode support">
        <div className="space-y-5"><p className="text-sm leading-6 text-gray-300">Vous allez agir au nom de <span className="font-semibold text-white">{supportUser?.firstName} {supportUser?.lastName}</span>. Toutes les actions, y compris les actions engageantes, utiliseront ses droits et ses données.</p><div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">Chaque modification sera enregistrée dans l’audit avec votre identité d’administrateur et celle de l’utilisateur assisté.</div><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={()=>setSupportUser(null)} icon={<X className="h-4 w-4"/>}>Annuler</Button><Button type="button" isLoading={isSaving} onClick={startSupport} icon={<Headphones className="h-4 w-4"/>}>Commencer l’assistance</Button></div></div>
      </Modal>
    </section>
  );
}

function RoleBadge({ role }: { role: AdminUserRole }) {
  const option = roleOptions.find((item) => item.value === role);

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${option?.className ?? 'border-white/10 bg-white/5 text-gray-400'}`}>
      {option?.label ?? role}
    </span>
  );
}

function readFieldErrors(data: unknown): Record<string, string> {
  if (data && typeof data === 'object' && 'errors' in data) {
    const errors = (data as { errors?: unknown }).errors;
    if (errors && typeof errors === 'object') {
      return Object.fromEntries(
        Object.entries(errors).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
      );
    }
  }

  return {};
}

function readError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const message = (data as { errorMessage?: unknown; message?: unknown }).errorMessage
      ?? (data as { message?: unknown }).message;

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
  }).format(new Date(value));
}

export default AdminUsersManager;
