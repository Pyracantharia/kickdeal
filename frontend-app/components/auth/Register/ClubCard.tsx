import Card from '@/components/ui/Card'
import { Building2 } from 'lucide-react'
import Link from 'next/link'

function ClubCard() {
  return (
    <Card color="purple" baseGradient={false} className="w-full max-w-80 text-white px-5 py-3 bg-linear-to-b from-brand-purple/40 from-0% to-transparent to-90%">
      <Link href="/auth/register/club" className="">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="inline-block rounded-full bg-purple-500/20 p-3 border border-brand-purple">
            <Building2 className='w-12 h-12 text-white'/>
          </div>

          <h2 className="text-xl font-semibold">Je suis un club</h2>
          <p className="text-sm text-gray-400">Recrutez des joueurs, gérez vos transferts et accédez au marché footballistique</p>
        </div>
      </Link>
    </Card>
  )
}

export default ClubCard