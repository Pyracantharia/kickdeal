'use client'

import React, { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  isLoading?: boolean
  icon?: ReactNode
}

function Button({
  children,
  variant = 'primary',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50'
  const variants: Record<string, string> = {
    primary:
      'border-[3px] border-brand-purple gradient-button text-white shadow-lg hover:shadow-xl hover:scale-[1.02]',
    secondary:
      'bg-white/10 text-white border border-white/20 hover:bg-white/20',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {children}
      {!isLoading && icon && <span aria-hidden="true">{icon}</span>}
    </button>
  )
}

export default Button
