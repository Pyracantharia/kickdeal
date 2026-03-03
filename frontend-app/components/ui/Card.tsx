import React, { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  color: 'cyan' | 'purple'
  baseGradient?: boolean
  className?: string
}

function Card({ children, color, baseGradient = true, className = '' }: CardProps) {
  const colorClasses = {
    cyan: 'border-brand-cyan',
    purple: 'border-brand-purple',
  }
  return (
    <div
      className={`rounded-2xl border-2 ${colorClasses[color]} ${baseGradient ? 'gradient-card' : ''} shadow-2xl backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
