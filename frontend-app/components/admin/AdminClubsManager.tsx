'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Building2, ChevronDown, Save, Search, Trash2, Trophy, UsersRound } from 'lucide-react'
import { adminManager, type AdminClub } from '@/features/admin/admin'
import CircleImage from '@/components/media/CircleImage'
import { LEAGUE_CONFIG, getLeagueDisplayName } from '@/features/league/leagueConfig'

const roles = { club_manager: 'Responsable', sporting_director: 'Directeur sportif', recruiter: 'Recruteur', staff: 'Staff' } as const

export default function AdminClubsManager() {
  const [clubs, setClubs] = useState<AdminClub[] | null>(null); const [selected, setSelected] = useState<string | null>(null); const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  async function load() { const r = await adminManager.getClubs(); if (r.ok) { setClubs(r.data.clubs); setSelected((id) => id ?? r.data.clubs[0]?.id ?? null) } }
  useEffect(() => {
    let active = true
    void adminManager.getClubs().then((response) => {
      if (active && response.ok) {
        setClubs(response.data.clubs)
        setSelected(response.data.clubs[0]?.id ?? null)
      }
    })
    return () => { active = false }
  }, [])
  const club = clubs?.find((item) => item.id === selected)
  const filteredClubs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr')
    if (!clubs || !query) return clubs ?? []
    return clubs.filter((item) => [item.name, item.country, item.league].some((value) => value?.toLocaleLowerCase('fr').includes(query)))
  }, [clubs, search])
  const clubsByLeague = useMemo(() => {
    const groups = new Map<string, AdminClub[]>()
    for (const item of filteredClubs) {
      const league = item.league?.trim() || 'Sans championnat'
      groups.set(league, [...(groups.get(league) ?? []), item])
    }
    return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right, 'fr')).map(([league, items]) => ({
      league,
      clubs: items.sort((left, right) => left.name.localeCompare(right.name, 'fr')),
    }))
  }, [filteredClubs])
  async function save() { if (!club) return; const r = await adminManager.updateClub(club.id, { name: club.name, country: club.country, league: club.league, logoUrl: club.logoUrl, transferBudget: club.transferBudget, verificationStatus: club.verificationStatus }); setNotice(r.ok ? r.data.message : readError(r.data)); if (r.ok) void load() }
  async function role(memberId: string, value: AdminClub['members'][number]['role']) { if (!club) return; const r = await adminManager.updateClubMember(club.id, memberId, { role: value }); setNotice(r.ok ? r.data.message : readError(r.data)); if (r.ok) void load() }
  async function remove(memberId: string) { if (!club || !confirm('Retirer ce membre du club ?')) return; const r = await adminManager.removeClubMember(club.id, memberId); setNotice(r.ok ? r.data.message : readError(r.data)); if (r.ok) void load() }
  function patch<K extends keyof AdminClub>(key: K, value: AdminClub[K]) { if (!club) return; setClubs((all) => all?.map((item) => item.id === club.id ? { ...item, [key]: value } : item) ?? null) }
  return <AdminShell title="Gestion des clubs">
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="self-start rounded-2xl border border-white/10 bg-[#071722]/85 p-3 lg:sticky lg:top-24">
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un club..." aria-label="Rechercher un club" className="w-full rounded-xl border border-white/10 bg-[#0A1B2B] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-brand-cyan/40" />
        </div>
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{filteredClubs.length} club(s) · {clubsByLeague.length} championnat(s)</p>
        <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
          {clubs === null ? <p className="p-3 text-gray-400">Chargement...</p> : clubsByLeague.length === 0 ? <p className="p-3 text-sm text-gray-400">Aucun club ne correspond à la recherche.</p> : clubsByLeague.map((group) => (
            <details key={group.league} open={search.trim().length > 0 || group.clubs.some((item) => item.id === selected)} className="group/league rounded-xl border border-white/8 bg-white/3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-3 text-sm font-semibold text-white marker:hidden">
                <span className="flex min-w-0 items-center gap-2.5">
                  <CircleImage src={LEAGUE_CONFIG[group.league]?.logoUrl} alt={`Logo ${getLeagueDisplayName(group.league)}`} sizes="32px" className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white p-1 text-gray-500" imageClassName="object-contain p-1" fallback={<Trophy className="h-4 w-4" />} />
                  <span className="truncate">{getLeagueDisplayName(group.league)}</span>
                </span><span className="flex shrink-0 items-center gap-2 text-xs text-gray-500">{group.clubs.length}<ChevronDown className="h-4 w-4 transition-transform group-open/league:rotate-180" /></span>
              </summary>
              <div className="border-t border-white/8 p-1.5">{group.clubs.map((item) => <ClubButton key={item.id} club={item} selected={selected === item.id} onSelect={() => setSelected(item.id)} />)}</div>
            </details>
          ))}
        </div>
      </aside>
      {club && <div className="space-y-6">{notice && <p className="rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 p-3 text-sm text-brand-cyan">{notice}</p>}
        <section className="rounded-2xl border border-white/10 bg-[#071722]/85 p-6"><h2 className="mb-5 text-xl font-bold text-white">Informations du club</h2><div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" value={club.name} onChange={(v) => patch('name', v)} /><Field label="Pays" value={club.country ?? ''} onChange={(v) => patch('country', v)} /><Field label="Championnat" value={club.league ?? ''} onChange={(v) => patch('league', v)} /><Field label="Logo (URL)" value={club.logoUrl ?? ''} onChange={(v) => patch('logoUrl', v)} /><Field label="Budget transfert (€)" type="number" value={String(club.transferBudget / 100)} onChange={(v) => patch('transferBudget', Math.max(0, Math.round(Number(v) * 100)))} />
          <label className="text-sm text-gray-300">Statut<select value={club.verificationStatus} onChange={(e) => patch('verificationStatus', e.target.value as AdminClub['verificationStatus'])} className="mt-2 w-full rounded-lg border border-white/15 bg-[#0A1B2B] p-3 text-white"><option value="pending">En attente</option><option value="verified">Vérifié</option><option value="unverified">Non vérifié</option></select></label>
        </div><button onClick={save} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-purple px-5 py-3 font-semibold text-white"><Save className="h-4 w-4" />Enregistrer</button></section>
        <section className="rounded-2xl border border-white/10 bg-[#071722]/85 p-6"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="flex items-center gap-2 text-xl font-bold text-white"><UsersRound />Membres ({club.members.length})</h2><Link href={`/admin/clubs/${club.id}/members`} className="text-sm font-semibold text-brand-cyan hover:text-white">Voir tout</Link></div><div className="space-y-3">{club.members.slice(0, 3).map((m) => <div key={m.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><b className="text-white">{m.firstName} {m.lastName}</b><p className="truncate text-sm text-gray-400">{m.email}</p></div><select value={m.role} onChange={(e) => role(m.id, e.target.value as typeof m.role)} className="rounded-lg border border-white/15 bg-[#0A1B2B] p-2 text-sm text-white">{Object.entries(roles).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select><button onClick={() => remove(m.id)} className="p-2 text-red-300" aria-label="Retirer le membre"><Trash2 /></button></div>)}</div></section>
        <section className="rounded-2xl border border-white/10 bg-[#071722]/85 p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-bold text-white"><Building2 />Joueurs ({club.playersCount})</h2><p className="mt-1 text-sm text-gray-400">Effectif et informations contractuelles du club.</p></div><Link href={`/admin/clubs/${club.id}/players`} className="text-sm font-semibold text-brand-cyan hover:text-white">Voir tout</Link></div></section>
      </div>}
    </div></AdminShell>
}
function ClubButton({ club, selected, onSelect }: { club: AdminClub; selected: boolean; onSelect: () => void }) { return <button onClick={onSelect} className={`mb-1 flex w-full items-center gap-3 rounded-lg p-2.5 text-left last:mb-0 ${selected ? 'bg-brand-cyan/10 text-brand-cyan' : 'text-gray-300 hover:bg-white/5'}`}><CircleImage src={club.logoUrl} alt={`Logo ${club.name}`} sizes="36px" className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white p-1 text-gray-500" imageClassName="object-contain p-1" fallback={<Building2 className="h-4 w-4" />} /><span className="min-w-0"><b className="block truncate text-sm">{club.name}</b><small className="block truncate text-gray-500">{club.country || 'Pays non renseigné'} · {club.members.length} membre(s)</small></span></button> }
function Field({ label, value, onChange, type='text' }: { label:string; value:string; onChange:(v:string)=>void; type?:string }) { return <label className="text-sm text-gray-300">{label}<input type={type} value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#0A1B2B] p-3 text-white" /></label> }
export function AdminShell({ title, children }: { title:string; children:React.ReactNode }) { return <div className="auth-bg min-h-screen px-4 pb-10 pt-28"><main className="mx-auto max-w-6xl"><Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-gray-300"><ArrowLeft className="h-4 w-4" />Retour admin</Link><h1 className="mb-8 text-3xl font-bold uppercase text-white">{title}</h1>{children}</main></div> }
function readError(data: unknown) { return data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' ? data.message : 'Une erreur est survenue.' }
