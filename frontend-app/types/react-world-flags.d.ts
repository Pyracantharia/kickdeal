declare module 'react-world-flags' {
  import type { ImgHTMLAttributes, ReactNode } from 'react'

  export type WorldFlagProps = ImgHTMLAttributes<HTMLImageElement> & {
    code?: string | null
    fallback?: ReactNode
  }

  export default function Flag(props: WorldFlagProps): ReactNode
}
