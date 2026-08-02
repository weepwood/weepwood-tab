import type { Shortcut, ShortcutOpenMode } from './types'

const STORAGE_KEYS = ['weepwood-tab-state-v2', 'weepwood-tab-state-v1']
const BLOCKED_SCHEMES = new Set(['javascript', 'data', 'vbscript'])
const WEB_SCHEMES = new Set(['http', 'https'])

export interface BulkShortcutEntry {
  line: number
  title: string
  url: string
  error?: string
}

function getScheme(value: string) {
  return value.trim().match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase()
}

export function normalizeShortcutUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const scheme = getScheme(trimmed)
  if (scheme) {
    if (BLOCKED_SCHEMES.has(scheme)) return ''
    return trimmed
  }

  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`
  if (/^\+?[\d\s().-]{6,}$/.test(trimmed)) return `tel:${trimmed.replace(/\s+/g, '')}`
  return `https://${trimmed}`
}

export function validateShortcutUrl(value: string) {
  const normalized = normalizeShortcutUrl(value)
  if (!normalized) return '请输入有效链接，且不能使用 javascript:、data: 或 vbscript: 协议。'

  const scheme = getScheme(normalized)
  if (!scheme) return '链接缺少有效协议。'
  if (BLOCKED_SCHEMES.has(scheme)) return '该协议存在安全风险，不能保存。'

  if (WEB_SCHEMES.has(scheme)) {
    try {
      const url = new URL(normalized)
      if (!url.hostname) return '网址缺少域名。'
    } catch {
      return '网址格式不正确。'
    }
  }

  return ''
}

export function canonicalShortcutUrl(value: string) {
  const normalized = normalizeShortcutUrl(value)
  if (!normalized) return ''
  try {
    const url = new URL(normalized)
    url.hash = ''
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      url.hostname = url.hostname.toLowerCase()
      if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) url.port = ''
      return url.href.replace(/\/$/, '').toLowerCase()
    }
    return url.href.toLowerCase()
  } catch {
    return normalized.replace(/\/$/, '').toLowerCase()
  }
}

export function isWebShortcut(value: string) {
  const scheme = getScheme(normalizeShortcutUrl(value))
  return Boolean(scheme && WEB_SCHEMES.has(scheme))
}

export function inferShortcutTitle(value: string) {
  const normalized = normalizeShortcutUrl(value)
  if (!normalized) return ''
  const scheme = getScheme(normalized)

  if (scheme === 'mailto') {
    const address = normalized.slice('mailto:'.length).split('?')[0] ?? ''
    return decodeURIComponent(address) || '发送邮件'
  }
  if (scheme === 'tel') return '拨打电话'
  if (scheme === 'sms') return '发送短信'

  try {
    const url = new URL(normalized)
    if (WEB_SCHEMES.has(scheme ?? '')) {
      const hostname = url.hostname.replace(/^www\./i, '')
      const first = hostname.split('.')[0] || hostname
      return first
        .split(/[-_]/g)
        .filter(Boolean)
        .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
        .join(' ') || hostname
    }
    const pathName = decodeURIComponent(url.pathname.replace(/^\/+/, '').split('/')[0] ?? '')
    return pathName || `${scheme?.toUpperCase() ?? '外部'} 链接`
  } catch {
    return `${scheme?.toUpperCase() ?? '自定义'} 链接`
  }
}

export function describeShortcutUrl(value: string) {
  const normalized = normalizeShortcutUrl(value)
  const scheme = getScheme(normalized)
  if (!normalized || !scheme) return '无效链接'
  try {
    const url = new URL(normalized)
    if (WEB_SCHEMES.has(scheme)) return url.hostname.replace(/^www\./i, '')
    if (scheme === 'mailto') return decodeURIComponent(normalized.slice(7).split('?')[0] ?? '')
    if (scheme === 'tel') return normalized.slice(4)
    return `${scheme}:// 外部协议`
  } catch {
    return `${scheme}:// 外部协议`
  }
}

export function openShortcut(shortcut: Shortcut, override?: ShortcutOpenMode) {
  const url = normalizeShortcutUrl(shortcut.url)
  if (!url || validateShortcutUrl(url)) return false
  const mode = override ?? shortcut.openMode ?? 'sameTab'
  if (mode === 'newTab') {
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (!opened) window.location.assign(url)
  } else {
    window.location.assign(url)
  }
  return true
}

export async function copyShortcutUrl(value: string) {
  const url = normalizeShortcutUrl(value)
  if (!url) return false
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    textarea.remove()
    return copied
  }
}

export function readStoredShortcuts() {
  for (const key of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as { shortcuts?: unknown }
      if (Array.isArray(parsed.shortcuts)) return parsed.shortcuts.filter((item): item is Shortcut => Boolean(item && typeof item === 'object' && 'url' in item))
    } catch {
      // 尝试下一个存储版本。
    }
  }
  return []
}

function splitBulkLine(value: string) {
  const pipe = value.split(/\s*[|\t]\s*/).filter(Boolean)
  if (pipe.length >= 2) return { title: pipe.slice(0, -1).join(' '), url: pipe.at(-1) ?? '' }

  const commaIndex = value.lastIndexOf(',')
  if (commaIndex > 0) {
    const possibleUrl = value.slice(commaIndex + 1).trim()
    if (/^(?:[a-z][a-z0-9+.-]*:|[^\s]+\.[^\s]+)/i.test(possibleUrl)) {
      return { title: value.slice(0, commaIndex).trim(), url: possibleUrl }
    }
  }

  return { title: '', url: value }
}

export function parseBulkShortcutLines(value: string): BulkShortcutEntry[] {
  const entries: BulkShortcutEntry[] = []

  value.split(/\r?\n/).forEach((raw, index) => {
    const cleaned = raw.trim().replace(/^[-*•]\s*/, '').replace(/^\d+[.)、]\s*/, '')
    if (!cleaned || cleaned.startsWith('#')) return

    const split = splitBulkLine(cleaned)
    const url = normalizeShortcutUrl(split.url)
    const error = validateShortcutUrl(split.url)
    const entry: BulkShortcutEntry = {
      line: index + 1,
      title: split.title.trim() || inferShortcutTitle(url),
      url,
    }
    if (error) entry.error = error
    entries.push(entry)
  })

  return entries
}
