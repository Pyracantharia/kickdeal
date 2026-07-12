import Card from '@/components/ui/Card'
import { User } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function ManagerCard() {
  return (
    <Card color="cyan" baseGradient={false} className="w-full max-w-80 text-white px-5 py-3 bg-linear-to-b from-brand-cyan/40 from-0% to-transparent to-90%">
      <Link href="/auth/register/manager" className="">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="inline-block rounded-full bg-cyan-500/20 p-3 border border-brand-cyan">
            <User className='w-12 h-12 text-white'/>
          </div>

          <h2 className="text-xl font-semibold">Je suis un agent</h2>
          <p className="text-sm text-gray-400">Représentez vos joueurs et négociez avec les clubs du monde entier</p>
        </div>
      </Link>
    </Card>
  )
}

export default ManagerCard