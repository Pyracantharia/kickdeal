'use client'

import Image from 'next/image'

import { getApiUrl } from '@/features/api'

type Props={mode:'login'|'register';accountType?:'club'|'agent';disabled?:boolean}

export default function GoogleSignInButton({mode,accountType,disabled=false}:Props){
 const start=()=>{const api=getApiUrl();const query=new URLSearchParams({mode,...(accountType?{accountType}:{})});window.location.assign(`${api}/auth/google/start?${query}`)}
 return <button type="button" onClick={start} disabled={disabled} className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/20 bg-white px-4 py-3 font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"><Image src="/google.svg" alt="" width={20} height={20}/>{mode==='login'?'Continuer avec Google':'S’inscrire avec Google'}</button>
}
