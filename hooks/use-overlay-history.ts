'use client'

import React from 'react'

interface UseOverlayHistoryOptions {
  open: boolean
  enabled?: boolean
  stateKey: string
  onClose: () => void
  restoreUrlOnPop?: boolean
}

export function useOverlayHistory({
  open,
  enabled = true,
  stateKey,
  onClose,
  restoreUrlOnPop = true,
}: UseOverlayHistoryOptions) {
  const pushedRef = React.useRef(false)
  const closingFromPopRef = React.useRef(false)
  const openUrlRef = React.useRef<string | null>(null)
  const onCloseRef = React.useRef(onClose)

  React.useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return
    }

    if (open && !pushedRef.current) {
      openUrlRef.current = window.location.href
      window.history.pushState(
        {
          ...(window.history.state && typeof window.history.state === 'object' ? window.history.state : {}),
          __appOverlay: stateKey,
        },
        '',
        window.location.href,
      )
      pushedRef.current = true
      return
    }

    if (!open && pushedRef.current) {
      const shouldRemoveOverlayEntry = !closingFromPopRef.current && openUrlRef.current === window.location.href

      pushedRef.current = false

      if (shouldRemoveOverlayEntry) {
        window.history.back()
      }
    }

    if (!open) {
      closingFromPopRef.current = false
      openUrlRef.current = null
    }
  }, [enabled, open, stateKey])

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return
    }

    const handlePopState = () => {
      if (!open || !pushedRef.current) {
        return
      }

      const openUrl = openUrlRef.current

      closingFromPopRef.current = true
      pushedRef.current = false

      if (restoreUrlOnPop && openUrl && window.location.href !== openUrl) {
        window.history.pushState(
          window.history.state && typeof window.history.state === 'object' ? window.history.state : {},
          '',
          openUrl,
        )
      }

      onCloseRef.current()
    }

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [enabled, open, restoreUrlOnPop])
}
