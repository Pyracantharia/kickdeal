import type { ReactNode } from 'react'

export type LinkButtonVariant = 'cyan' | 'purple' | 'outline'

interface LinkButtonProps {
  href: string
  children: ReactNode
  variant?: LinkButtonVariant
  icon?: ReactNode
  className?: string
}

const VARIANT_CLASSES: Record<LinkButtonVariant, string> = {
  cyan: 'bg-brand-cyan text-dark-900 hover:bg-brand-cyan/90',
  purple: 'bg-brand-purple text-white hover:bg-brand-purple/90',
  outline: 'border border-white/20 bg-white/5 text-white hover:bg-white/10',
}

function LinkButton({
  href,
  children,
  variant = 'cyan',
  icon,
  className = '',
}: LinkButtonProps) {
  return (
    <a href={href} className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-colors ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
      {icon}
    </a>
  )
}

export default LinkButton