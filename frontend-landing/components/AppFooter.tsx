import Image from 'next/image'
import Link from 'next/link'

const PRODUCT_LINKS = [
  { href: '/#fonctionnalites', label: 'Fonctionnalités' },
  { href: '/#tarifs', label: 'Tarifs' },
  { href: '#', label: 'Roadmap' },
  { href: '#', label: 'Changelog' },
]

const ENTERPRISE_LINKS = [
  { href: '/#clubs', label: 'Clubs' },
  { href: '/#agents', label: 'Agents' },
  { href: '#', label: 'Carrières' },
  { href: '/contact', label: 'Contact' },
]

const LEGAL_LINKS = [
  { href: '/legal', label: 'Legal' },
  { href: '/legal/confidentialite', label: 'Confidentialité' },
  { href: '/legal/cgu', label: 'CGU' },
  { href: '/legal/cookies', label: 'Cookies' },
]

function AppFooter() {
  return (
    <footer className="border-t border-white/10 bg-dark-900 pt-16 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 mb-4">
              <div className="relative h-8 w-8 shrink-0">
                <Image src="/images/logo.png" alt="KickDeal" fill sizes="32px" className="object-contain" />
              </div>
              <span className="text-base font-bold text-white">KickDeal</span>
            </Link>
            <p className="text-xs text-white/60 leading-relaxed max-w-[200px]">
              La plateforme de transferts footballistiques nouvelle génération pour clubs et agents vérifiés.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">Produit</p>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">Enterprise</p>
            <ul className="space-y-2.5">
              {ENTERPRISE_LINKS.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">Légal</p>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} KickDeal. Tous droits réservés. Plateforme réservée aux clubs et agents vérifiés.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default AppFooter
