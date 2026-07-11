'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FileCheck2, Trash2, UserRound, UsersRound } from 'lucide-react'
import { adminManager, type AdminAgent } from '@/features/admin/admin'
import { AdminShell } from './AdminClubsManager'

export default function AdminAgentsManager() {
  const [agents, setAgents] = useState<AdminAgent[] | null>(null); const [notice, setNotice] = useState('')
  async function load() { const r = await adminManager.getAgents(); if (r.ok) setAgents(r.data.agents) }
  useEffect(() => {
    let active = true
    void adminManager.getAgents().then((response) => { if (active && response.ok) setAgents(response.data.agents) })
    return () => { active = false }
  }, [])
  async function license(id:string, status:'pending'|'approved'|'rejected') { const r=await adminManager.updateAgentLicense(id,status); setNotice(r.ok?r.data.message:readError(r.data)); if(r.ok) void load() }
  async function remove(agentId:string,playerId:string) { if(!confirm('Retirer ce joueur du portefeuille ?')) return; const r=await adminManager.removeAgentPlayer(agentId,playerId); setNotice(r.ok?r.data.message:readError(r.data)); if(r.ok) void load() }
  return <AdminShell title="Gestion des agents">{notice&&<p className="mb-5 rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 p-3 text-brand-cyan">{notice}</p>}<div className="mb-5 flex justify-end"><Link href="/admin/player-agent-requests" className="rounded-lg border border-brand-purple/30 bg-brand-purple/10 px-4 py-2 font-semibold text-brand-purple">Gérer les demandes et passations</Link></div>
    {agents===null?<p className="text-gray-400">Chargement...</p>:agents.length===0?<p className="text-gray-400">Aucun profil agent.</p>:<div className="space-y-5">{agents.map((a)=><article key={a.id} className="rounded-2xl border border-white/10 bg-[#071722]/85 p-6"><div className="flex flex-col gap-5 md:flex-row md:justify-between"><div className="flex gap-3"><UserRound className="text-brand-cyan"/><div><h2 className="text-xl font-bold text-white">{a.agencyName||`${a.user.firstName} ${a.user.lastName}`}</h2><p className="text-sm text-gray-400">{a.user.email} · {a.country||'Pays non renseigné'}</p></div></div>{a.license?<div className="min-w-64 rounded-xl border border-white/10 bg-white/5 p-4"><p className="mb-2 flex gap-2 font-semibold text-white"><FileCheck2 className="h-5 w-5"/>Licence {a.license.number}</p><p className="text-xs text-gray-400">{a.license.issuedBy||'Émetteur inconnu'} · validité {a.license.validUntil||'non renseignée'}</p>{a.license.documentUrl&&<a href={a.license.documentUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-brand-cyan">Voir le document</a>}<select value={a.license.status} onChange={(e)=>license(a.id,e.target.value as NonNullable<AdminAgent['license']>['status'])} className="mt-3 w-full rounded-lg border border-white/15 bg-[#0A1B2B] p-2 text-white"><option value="pending">En attente</option><option value="approved">Approuvée</option><option value="rejected">Rejetée</option></select></div>:<p className="text-sm text-amber-300">Aucune licence enregistrée</p>}</div>
      <div className="mt-5 border-t border-white/10 pt-5"><h3 className="mb-3 flex items-center gap-2 font-semibold text-white"><UsersRound className="h-5 w-5"/>Joueurs représentés ({a.players.length})</h3>{a.players.length===0?<p className="text-sm text-gray-500">Aucun joueur représenté.</p>:<div className="grid gap-2 md:grid-cols-2">{a.players.map(p=><div key={p.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3"><span><b className="text-white">{p.firstName} {p.lastName}</b><small className="block text-gray-400">{p.position||'Poste inconnu'} · {p.team||'Sans club'}</small></span><button onClick={()=>remove(a.id,p.id)} className="p-2 text-red-300" aria-label="Retirer le joueur"><Trash2 className="h-4 w-4"/></button></div>)}</div>}</div></article>)}</div>}
  </AdminShell>
}
function readError(data:unknown){return data&&typeof data==='object'&&'message'in data&&typeof data.message==='string'?data.message:'Une erreur est survenue.'}
