'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'

interface CircleImageProps {
  alt: string
  className: string
  fallback: ReactNode
  src?: string | null
  sizes: string
  imageClassName?: string
}

function CircleImage({
  alt,
  className,
  fallback,
  src,
  sizes,
  imageClassName = 'object-cover',
}: CircleImageProps) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return <div className={className}>{fallback}</div>
  }

  return (
    <div className={className}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={imageClassName}
        onError={() => setHasError(true)}
        unoptimized
      />
    </div>
  )
}

export default CircleImage