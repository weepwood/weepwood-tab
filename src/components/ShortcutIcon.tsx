import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import type { Shortcut } from '../core/types'
import { isWebShortcut, normalizeShortcutUrl, openShortcut } from '../core/shortcutLinks'
import '../styles/favicon-folder.css'

const FAVICON_CACHE_KEY = 'weepwood-tab-favicon-cache-v2'
const LEGACY_CACHE_KEY = 'weepwood-tab-favicon-cache-v1'
const MAX_CACHE_ENTRIES = 180
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000

interface CacheEntry {
  source: string
  updatedAt: number
}

export interface FaviconCandidate {
  id: string
  label: string
  url: string
}

export { normalizeShortcutUrl }

function getCacheKey(value: string) {
  try {
    return new URL(normalizeShortcutUrl(value)).origin
  } catch {
    return normalizeShortcutUrl(value)
  }
}

function readFaviconCache(): Record<string, CacheEntry> {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVICON_CACHE_KEY) ?? '{}') as unknown
    if (parsed && typeof parsed === 'object') return parsed as Record<string, CacheEntry>

    const legacy = JSON.parse(localStorage.getItem(LEGACY_CACHE_KEY) ?? '{}') as Record<string, string>
    return Object.fromEntries(Object.entries(legacy).map(([key, source]) => [key, { source, updatedAt: Date.now() }]))
  } catch {
    return {}
  }
}

export function getCachedFavicon(value: string) {
  const entry = readFaviconCache()[getCacheKey(value)]
  if (!entry || Date.now() - entry.updatedAt > CACHE_TTL) return undefined
  return entry.source
}

export function clearFaviconCache(value?: string) {
  try {
    if (!value) {
      localStorage.removeItem(FAVICON_CACHE_KEY)
      localStorage.removeItem(LEGACY_CACHE_KEY)
      return
    }
    const cache = readFaviconCache()
    delete cache[getCacheKey(value)]
    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage 不可用时忽略缓存操作。
  }
}

function rememberFavicon(value: string, source: string) {
  if (!source || source.startsWith('data:')) return
  try {
    const cache = readFaviconCache()
    const next = { ...cache, [getCacheKey(value)]: { source, updatedAt: Date.now() } }
    const entries = Object.entries(next).sort((a, b) => a[1].updatedAt - b[1].updatedAt)
    const trimmed = entries.length > MAX_CACHE_ENTRIES
      ? Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES))
      : next
    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage 不可用时保持普通回退流程。
  }
}

function getChromeFaviconUrl(value: string) {
  if (!isWebShortcut(value)) return undefined
  const chromeApi = (globalThis as typeof globalThis & {
    chrome?: { runtime?: { id?: string; getURL?: (path: string) => string } }
  }).chrome
  if (!chromeApi?.runtime?.id || !chromeApi.runtime.getURL) return undefined
  const normalized = normalizeShortcutUrl(value)
  return chromeApi.runtime.getURL(`_favicon/?pageUrl=${encodeURIComponent(normalized)}&size=128`)
}

export function getDirectFaviconUrl(value: string) {
  if (!isWebShortcut(value)) return undefined
  try {
    return new URL('/favicon.ico', normalizeShortcutUrl(value)).href
  } catch {
    return undefined
  }
}

export function getFaviconCandidates(value: string, preferred?: string): FaviconCandidate[] {
  if (!isWebShortcut(value)) return []
  const normalized = normalizeShortcutUrl(value)
  let hostname = ''
  let origin = ''
  try {
    const url = new URL(normalized)
    hostname = url.hostname
    origin = url.origin
  } catch {
    return []
  }

  const candidates: Array<FaviconCandidate | undefined> = [
    preferred ? { id: 'preferred', label: '已选择', url: preferred } : undefined,
    getCachedFavicon(value) ? { id: 'cached', label: '上次成功', url: getCachedFavicon(value)! } : undefined,
    getChromeFaviconUrl(value) ? { id: 'chrome', label: '浏览器原生', url: getChromeFaviconUrl(value)! } : undefined,
    { id: 'google', label: 'Google 图标', url: `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(normalized)}&sz=256` },
    { id: 'duckduckgo', label: 'DuckDuckGo', url: `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico` },
    { id: 'apple', label: 'Apple Touch', url: `${origin}/apple-touch-icon.png` },
    { id: 'png', label: '站点 PNG', url: `${origin}/favicon.png` },
    { id: 'large', label: '高清 Favicon', url: `${origin}/favicon-196x196.png` },
    { id: 'ico', label: '标准 Favicon', url: `${origin}/favicon.ico` },
  ]

  const seen = new Set<string>()
  return candidates.filter((candidate): candidate is FaviconCandidate => {
    if (!candidate || seen.has(candidate.url)) return false
    seen.add(candidate.url)
    return true
  })
}

interface Props {
  shortcut: Shortcut
  className: string
  style?: CSSProperties
}

export function ShortcutIcon({ shortcut, className, style }: Props) {
  const candidates = useMemo(() => {
    if (shortcut.iconMode === 'text') return []
    if (shortcut.iconMode === 'image' || shortcut.iconMode === 'url') return shortcut.iconUrl ? [shortcut.iconUrl] : []
    return getFaviconCandidates(shortcut.url, shortcut.iconUrl).map((candidate) => candidate.url)
  }, [shortcut.iconMode, shortcut.iconUrl, shortcut.url])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => setAttempt(0), [shortcut.iconMode, shortcut.iconUrl, shortcut.url])

  const source = candidates[attempt]
  const background = shortcut.iconBackground || shortcut.color
  const iconPadding = Math.max(0, Math.min(24, shortcut.iconPadding ?? 0))

  const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
    if ((shortcut.openMode ?? 'sameTab') !== 'newTab') return
    const anchor = event.currentTarget.closest('a')
    if (!anchor?.getAttribute('href')) return
    event.preventDefault()
    event.stopPropagation()
    openShortcut(shortcut, 'newTab')
  }

  return (
    <span
      className={`${className} ${source ? 'has-favicon' : 'uses-text-icon'}`}
      style={{ background, ...style }}
      data-shortcut-id={shortcut.id}
      onClick={handleClick}
    >
      {source ? (
        <img
          src={source}
          alt=""
          draggable={false}
          referrerPolicy="no-referrer"
          style={{ objectFit: shortcut.iconFit ?? 'contain', padding: iconPadding }}
          onLoad={() => {
            if ((shortcut.iconMode ?? 'auto') === 'auto') rememberFavicon(shortcut.url, source)
          }}
          onError={() => setAttempt((current) => current + 1)}
        />
      ) : shortcut.icon}
    </span>
  )
}
