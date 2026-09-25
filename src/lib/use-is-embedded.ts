'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/** Agentūros portale įterptas vaizdas (iframe arba ?embed=1). */
export function useIsEmbedded(): boolean {
  const searchParams = useSearchParams()
  const embedQuery = searchParams.get('embed') === '1'
  const [inIframe, setInIframe] = useState(
    () => typeof window !== 'undefined' && window.self !== window.top
  )

  useEffect(() => {
    setInIframe(window.self !== window.top)
  }, [])

  return embedQuery || inIframe
}
