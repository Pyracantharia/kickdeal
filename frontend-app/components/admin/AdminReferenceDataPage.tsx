'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, Building2, CalendarDays, Database, Plus, Save, Trash2, X } from 'lucide-react'

import { adminManager, type AdminReferenceData, type AdminReferenceItem } from '@/features/admin/admin'

type Type = AdminReferenceItem['type']

const tabs: Array<[Type, string]> = [
  ['league', 'Ligues'],
  ['country', 'Pays'],
  ['position', 'Positions'],
  ['plan', 'Plans'],
  ['business_parameter', 'Paramètres métier'],
]

type SummerWindow = {
  year: number
  startDate: string
  endDate: string
}

export default function AdminReferenceDataPage() {
  const [data, setData] = useState<AdminReferenceData | null>(null)
  const [type, setType] = useState<Type>('league')
  const [notice, setNotice] = useState('')
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newLabel, setNewLabel] = useState('')

  async function load() {
    const response = await adminManager.getReferenceData()
    if (response.ok) setData(response.data)
  }

  useEffect(() => {
    let active = true

    void adminManager.getReferenceData().then((response) => {
      if (active && response.ok) setData(response.data)
    })

    return () => {
      active = false
    }
  }, [])

  function patch(id: string, key: keyof AdminReferenceItem, value: unknown) {
    setData((current) =>
      current
        ? {
            ...current,
            references: {
              ...current.references,
              [type]: current.references[type].map((item) => (item.id === id ? { ...item, [key]: value } : item)),
            },
          }
        : null,
    )
  }

  async function save(item: AdminReferenceItem) {
    const response = await adminManager.updateReferenceItem(item.id, {
      code: item.code,
      label: item.label,
      value: item.value,
      active: item.active,
    })

    setNotice(response.ok ? response.data.message : error(response.data))
    if (response.ok) void load()
  }

  async function remove(item: AdminReferenceItem) {
    if (!confirm(`Supprimer « ${item.label} » ?`)) return

    const response = await adminManager.deleteReferenceItem(item.id)
    setNotice(response.ok ? response.data.message : error(response.data))
    if (response.ok) void load()
  }

  async function create() {
    const response = await adminManager.createReferenceItem({ type, code: newCode, label: newLabel })
    setNotice(response.ok ? response.data.message : error(response.data))

    if (response.ok) {
      setCreating(false)
      setNewCode('')
      setNewLabel('')
      void load()
    }
  }

  const items = data?.references[type] ?? []

  return (
    <div className="auth-bg min-h-screen px-4 pb-10 pt-28">
      <main className="mx-auto max-w-7xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-gray-300">
          <ArrowLeft className="h-4 w-4" />
          Retour administration
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold uppercase text-white">Données de référence</h1>
            <p className="mt-2 text-gray-400">Ligues, pays, clubs, positions, plans et règles métier.</p>
          </div>
          <Link href="/admin/clubs" className="btn-secondary text-white">
            <Building2 className="h-4 w-4" />
            Gérer les clubs
          </Link>
        </div>

        <div className="my-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setType(id)
                setCreating(false)
              }}
              className={`tab-button ${type === id ? 'tab-active' : ''}`}
            >
              {label}
              <span className="ml-1 text-xs">({data?.references[id].length ?? 0})</span>
            </button>
          ))}
        </div>

        {notice && <p className="mb-5 rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 p-3 text-brand-cyan">{notice}</p>}

        <section className="rounded-2xl border border-white/10 bg-[#071722]/85 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <Database className="h-5 w-5" />
                {tabs.find((tab) => tab[0] === type)?.[1]}
              </h2>
              <p className="mt-1 text-sm text-gray-400">{description(type)}</p>
              {type === 'plan' && (
                <p className="mt-2 text-xs text-amber-200">
                  Le prix modifie l’affichage utilisateur. Les tarifs récurrents Stripe restent configurés séparément dans Stripe.
                </p>
              )}
            </div>

            {['league', 'country', 'position'].includes(type) && (
              <button onClick={() => setCreating(true)} className="btn-primary">
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            )}
          </div>

          {creating && (
            <div className="mb-5 grid gap-3 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-4 md:grid-cols-[1fr_1fr_auto]">
              <Field label="Code / valeur technique" value={newCode} onChange={setNewCode} />
              <Field label="Libellé" value={newLabel} onChange={setNewLabel} />
              <button onClick={create} className="btn-primary self-end">
                <Save className="h-4 w-4" />
                Créer
              </button>
            </div>
          )}

          <div className="space-y-3">
            {data === null ? (
              <p className="text-gray-400">Chargement...</p>
            ) : (
              items.map((item) => (
                <ReferenceCard
                  key={item.id}
                  item={item}
                  type={type}
                  onPatch={(key, value) => patch(item.id, key, value)}
                  onRemove={() => remove(item)}
                  onSave={() => save(item)}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function ReferenceCard({
  item,
  type,
  onPatch,
  onRemove,
  onSave,
}: {
  item: AdminReferenceItem
  type: Type
  onPatch: (key: keyof AdminReferenceItem, value: unknown) => void
  onRemove: () => void
  onSave: () => void
}) {
  const isPlan = type === 'plan'
  const isBusinessParameter = type === 'business_parameter'
  const gridClass = isPlan || item.code === 'transfer_windows' ? 'lg:grid-cols-2' : 'lg:grid-cols-[1fr_1fr_1.2fr_auto]'

  return (
    <article className="rounded-xl border border-white/10 bg-white/3 p-4">
      <div className={`grid gap-4 ${gridClass}`}>
        <Field
          label="Code"
          value={item.code}
          disabled={isPlan || isBusinessParameter}
          onChange={(value) => onPatch('code', value)}
        />
        <Field label="Libellé" value={item.label} onChange={(value) => onPatch('label', value)} />

        {isBusinessParameter ? (
          item.code === 'transfer_windows' ? (
            <TransferWindowFields item={item} onChange={(value) => onPatch('value', value)} />
          ) : (
            <Field
              label={`Valeur (${String(item.value.unit ?? '')})`}
              type="number"
              value={String(item.value.value ?? '')}
              onChange={(value) => onPatch('value', { ...item.value, value: Number(value) })}
            />
          )
        ) : isPlan ? (
          <PlanFields item={item} onChange={(value) => onPatch('value', value)} />
        ) : (
          <label className="text-sm text-gray-300">
            Métadonnées JSON
            <textarea
              defaultValue={JSON.stringify(item.value)}
              onBlur={(event) => {
                try {
                  onPatch('value', JSON.parse(event.target.value))
                } catch {
                  // The page notice is intentionally not controlled from this child card.
                }
              }}
              rows={1}
              className="input font-mono text-xs"
            />
          </label>
        )}

        <div className="flex items-end gap-2">
          <button onClick={onSave} className="btn-primary">
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
          {!isPlan && !isBusinessParameter && (
            <button
              onClick={onRemove}
              className="btn-secondary text-red-300"
              title={item.usageCount ? `${item.usageCount} utilisation(s)` : undefined}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{item.usageCount} utilisation(s)</span>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={item.active} onChange={(event) => onPatch('active', event.target.checked)} />
          Actif
        </label>
      </div>
    </article>
  )
}

function TransferWindowFields({ item, onChange }: { item: AdminReferenceItem; onChange: (value: Record<string, unknown>) => void }) {
  const windows = getSummerWindows(item.value)

  function update(next: SummerWindow[]) {
    onChange({
      ...item.value,
      winter: { fixed: true, start: '01-01', end: '01-31' },
      summerWindows: next.sort((left, right) => left.year - right.year),
    })
  }

  function updateWindow(index: number, patch: Partial<SummerWindow>) {
    update(windows.map((window, currentIndex) => (currentIndex === index ? { ...window, ...patch } : window)))
  }

  function addWindow() {
    const nextYear = Math.max(new Date().getFullYear(), ...windows.map((window) => window.year)) + 1
    update([...windows, { year: nextYear, startDate: `${nextYear}-06-10`, endDate: `${nextYear}-08-30` }])
  }

  return (
    <div className="lg:col-span-2">
      <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-1 h-5 w-5 shrink-0 text-brand-cyan" />
          <div>
            <p className="font-bold uppercase tracking-[0.22em] text-brand-cyan">Périodes mercato</p>
            <p className="mt-1 text-sm text-gray-300">
              Le mercato hivernal est verrouillé du 1er janvier au 31 janvier. Le mercato estival peut être ajusté année par année.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-black/15 p-3 text-sm text-gray-300 md:grid-cols-3">
          <span className="font-semibold text-white">Mercato hivernal</span>
          <span>Début : 1 janvier</span>
          <span>Fin : 31 janvier</span>
        </div>

        <div className="mt-4 space-y-3">
          {windows.map((window, index) => (
            <div key={`${window.year}-${index}`} className="grid gap-3 rounded-lg border border-white/10 bg-white/5 p-3 md:grid-cols-[0.7fr_1fr_1fr_auto]">
              <Field
                label="Année"
                type="number"
                value={String(window.year)}
                onChange={(value) => {
                  const year = Number(value)
                  updateWindow(index, {
                    year,
                    startDate: normalizeDateYear(window.startDate, year),
                    endDate: normalizeDateYear(window.endDate, year),
                  })
                }}
              />
              <Field label="Début estival" type="date" value={window.startDate} onChange={(value) => updateWindow(index, { startDate: value })} />
              <Field label="Fin estival" type="date" value={window.endDate} onChange={(value) => updateWindow(index, { endDate: value })} />
              <button
                type="button"
                onClick={() => update(windows.filter((_, currentIndex) => currentIndex !== index))}
                className="btn-secondary self-end text-red-300"
                title="Supprimer cette année"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addWindow} className="btn-secondary mt-4 text-white">
          <Plus className="h-4 w-4" />
          Ajouter une année
        </button>
      </div>
    </div>
  )
}

function PlanFields({ item, onChange }: { item: AdminReferenceItem; onChange: (value: Record<string, unknown>) => void }) {
  const features = Array.isArray(item.value.features) ? item.value.features.filter((value): value is string => typeof value === 'string') : []

  function update(next: string[]) {
    onChange({ ...item.value, features: next })
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= features.length) return

    const next = [...features]
    ;[next[index], next[target]] = [next[target], next[index]]
    update(next)
  }

  return (
    <div className="contents">
      <Field
        label="Prix (€)"
        type="number"
        value={String(Number(item.value.priceCents ?? 0) / 100)}
        onChange={(value) => onChange({ ...item.value, priceCents: Math.max(0, Math.round(Number(value) * 100)) })}
      />
      <label className="text-sm text-gray-300">
        Période
        <select value={String(item.value.billingPeriod ?? 'month')} onChange={(event) => onChange({ ...item.value, billingPeriod: event.target.value })} className="input">
          <option value="month">Mensuelle</option>
          <option value="year">Annuelle</option>
        </select>
      </label>
      <label className="text-sm text-gray-300 lg:col-span-2">
        Texte d’introduction <span className="text-gray-500">(facultatif)</span>
        <textarea value={String(item.value.description ?? '')} onChange={(event) => onChange({ ...item.value, description: event.target.value })} rows={2} className="input" />
      </label>
      <div className="lg:col-span-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-gray-300">Avantages affichés avec une coche</p>
          <button type="button" onClick={() => update([...features, 'Nouvel avantage'])} className="btn-secondary text-white">
            <Plus className="h-4 w-4" />
            Ajouter un avantage
          </button>
        </div>
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-brand-cyan">✓</span>
              <input
                value={feature}
                onChange={(event) => {
                  const next = [...features]
                  next[index] = event.target.value
                  update(next)
                }}
                className="input mt-0"
              />
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded p-2 text-gray-300 disabled:opacity-25" title="Monter">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === features.length - 1} className="rounded p-2 text-gray-300 disabled:opacity-25" title="Descendre">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => update(features.filter((_, currentIndex) => currentIndex !== index))} className="rounded p-2 text-red-300" title="Supprimer">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  disabled?: boolean
}) {
  return (
    <label className="text-sm text-gray-300">
      {label}
      <input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="input disabled:cursor-not-allowed disabled:opacity-50" />
    </label>
  )
}

function getSummerWindows(value: Record<string, unknown>): SummerWindow[] {
  const rawWindows = Array.isArray(value.summerWindows) ? value.summerWindows : []

  return rawWindows
    .filter((window): window is Record<string, unknown> => window !== null && typeof window === 'object')
    .map((window) => ({
      year: typeof window.year === 'number' ? window.year : Number(window.year ?? new Date().getFullYear()),
      startDate: typeof window.startDate === 'string' ? window.startDate : `${new Date().getFullYear()}-06-10`,
      endDate: typeof window.endDate === 'string' ? window.endDate : `${new Date().getFullYear()}-08-30`,
    }))
    .sort((left, right) => left.year - right.year)
}

function normalizeDateYear(value: string, year: number): string {
  const suffix = value.match(/^\d{4}-(\d{2}-\d{2})$/)?.[1]

  return `${year}-${suffix ?? '06-10'}`
}

function description(type: Type) {
  return type === 'league'
    ? 'Renommer une ligue met à jour tous les clubs et publications associés.'
    : type === 'country'
      ? 'Renommer un pays met à jour les clubs, agents et publications associés.'
      : type === 'position'
        ? 'Renommer une position met à jour tous les joueurs concernés.'
        : type === 'plan'
          ? 'Les codes techniques restent fixes ; les libellés et métadonnées sont modifiables.'
          : 'Ces valeurs contrôlent directement les limites des plans gratuits et les règles de mercato.'
}

function error(data: unknown) {
  return data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' ? data.message : 'Une erreur est survenue.'
}
