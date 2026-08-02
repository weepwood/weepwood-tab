import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Shortcut } from '../core/types'

export function normalizeShortcutUrl(value: string) {
  const trimmed = value.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function getDirectFaviconUrl(value: string) {
  try {
    return new URL('/favicon.ico', normalizeShortcutUrl(value)).href
  } catch {
    return undefined
  }
}

function getFallbackFaviconUrl(value: string) {
  try {
    const normalized = normalizeShortcutUrl(value)
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(normalized)}&sz=128`
  } catch {
    return undefined
  }
}

interface Props {
  shortcut: Shortcut
  className: string
  style?: CSSProperties
}

export function ShortcutIcon({ shortcut, className, style }: Props) {
  const candidates = useMemo(() => {
    if (shortcut.iconMode === 'text') return []
    return [shortcut.iconUrl, getDirectFaviconUrl(shortcut.url), getFallbackFaviconUrl(shortcut.url)]
      .filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index)
  }, [shortcut.iconMode, shortcut.iconUrl, shortcut.url])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => setAttempt(0), [shortcut.iconMode, shortcut.iconUrl, shortcut.url])

  const source = candidates[attempt]

  return (
    <span className={`${className} ${source ? 'has-favicon' : 'uses-text-icon'}`} style={{ background: shortcut.color, ...style }}>
      {source ? (
        <img
          src={source}
          alt=""
          draggable={false}
          referrerPolicy="no-referrer"
          onError={() => setAttempt((current) => current + 1)}
        />
      ) : shortcut.icon}
    </span>
  )
}
