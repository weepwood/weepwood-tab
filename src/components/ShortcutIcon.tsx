import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Shortcut } from '../core/types'
import '../styles/favicon-folder.css'

const FAVICON_CACHE_KEY = 'weepwood-tab-favicon-cache-v1'
const MAX_CACHE_ENTRIES = 120

export function normalizeShortcutUrl(value: string) {
  const trimmed = value.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function getCacheKey(value: string) {
  try {
    return new URL(normalizeShortcutUrl(value)).origin
  } catch {
    return value
  }
}

function readFaviconCache(): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem(FAVICON_CACHE_KEY) ?? '{}') as unknown
    return value && typeof value === 'object' ? value as Record<string, string> : {}
  } catch {
    return {}
  }
}

function getCachedFavicon(value: string) {
  return readFaviconCache()[getCacheKey(value)]
}

function rememberFavicon(value: string, source: string) {
  if (!source || source.startsWith('data:')) return
  try {
    const cache = readFaviconCache()
    const key = getCacheKey(value)
    const next = { ...cache, [key]: source }
    const entries = Object.entries(next)
    const trimmed = entries.length > MAX_CACHE_ENTRIES
      ? Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES))
      : next
    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage 不可用时保持普通回退流程。
  }
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
    if (shortcut.iconMode === 'image') return shortcut.iconUrl ? [shortcut.iconUrl] : []
    return [getCachedFavicon(shortcut.url), shortcut.iconUrl, getDirectFaviconUrl(shortcut.url), getFallbackFaviconUrl(shortcut.url)]
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
          onLoad={() => {
            if ((shortcut.iconMode ?? 'auto') === 'auto') rememberFavicon(shortcut.url, source)
          }}
          onError={() => setAttempt((current) => current + 1)}
        />
      ) : shortcut.icon}
    </span>
  )
}
