import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { SearchEngineId, Shortcut } from '../core/types'
import { normalizeShortcutUrl, openShortcut, validateShortcutUrl } from '../core/shortcutLinks'
import { Icon } from './Icon'
import { ShortcutIcon } from './ShortcutIcon'
import '../styles/search-enhancements.css'

const SEARCH_HISTORY_KEY = 'weepwood-tab-search-history-v1'
const HISTORY_LIMIT = 8

const builtInEngines: Record<Exclude<SearchEngineId, 'custom'>, { label: string; mark: string; url: string }> = {
  bing: { label: 'Bing', mark: 'B', url: 'https://www.bing.com/search?q=' },
  google: { label: 'Google', mark: 'G', url: 'https://www.google.com/search?q=' },
  baidu: { label: '百度', mark: '百', url: 'https://www.baidu.com/s?wd=' },
  duckduckgo: { label: 'DuckDuckGo', mark: 'D', url: 'https://duckduckgo.com/?q=' },
}

function looksLikeUrl(value: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) || /^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(value)
}

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? '[]') as unknown
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').slice(0, HISTORY_LIMIT) : []
  } catch {
    return []
  }
}

function buildCustomSearchUrl(template: string, query: string) {
  const encoded = encodeURIComponent(query)
  if (template.includes('{query}')) return template.replaceAll('{query}', encoded)
  return `${template}${encoded}`
}

function calculateExpression(value: string) {
  const source = value.trim().replace(/^=/, '').replaceAll('×', '*').replaceAll('÷', '/').replaceAll('，', '.')
  if (!source || !/[+\-*/%()]/.test(source) || !/^[\d\s.+\-*/%()]+$/.test(source)) return null
  const compact = source.replaceAll(/\s+/g, '')
  const tokens = compact.match(/\d*\.?\d+|[()+\-*/%]/g)
  if (!tokens || tokens.join('') !== compact) return null
  let index = 0

  const parseExpression = (): number => {
    let result = parseTerm()
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++]
      const next = parseTerm()
      result = operator === '+' ? result + next : result - next
    }
    return result
  }

  const parseTerm = (): number => {
    let result = parseFactor()
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++]
      const next = parseFactor()
      if (operator === '/' && next === 0) throw new Error('division by zero')
      result = operator === '*' ? result * next : result / next
    }
    return result
  }

  const parseFactor = (): number => {
    const token = tokens[index]
    if (token === '+' || token === '-') {
      index += 1
      const next = parseFactor()
      return token === '-' ? -next : next
    }
    let result: number
    if (token === '(') {
      index += 1
      result = parseExpression()
      if (tokens[index] !== ')') throw new Error('missing parenthesis')
      index += 1
    } else {
      if (!token || Number.isNaN(Number(token))) throw new Error('invalid number')
      result = Number(token)
      index += 1
    }
    while (tokens[index] === '%') {
      result /= 100
      index += 1
    }
    return result
  }

  try {
    const result = parseExpression()
    if (index !== tokens.length || !Number.isFinite(result)) return null
    return Number.parseFloat(result.toFixed(10)).toString()
  } catch {
    return null
  }
}

interface Props {
  shortcuts: Shortcut[]
  engine: SearchEngineId
  customSearchName?: string
  customSearchUrl?: string
  showSuggestions: boolean
  showHistory?: boolean
  onEngineChange: (engine: SearchEngineId) => void
}

export function SearchBar({ shortcuts, engine, customSearchName, customSearchUrl, showSuggestions, showHistory = true, onEngineChange }: Props) {
  const [query, setQuery] = useState('')
  const [engineMenuOpen, setEngineMenuOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [history, setHistory] = useState<string[]>(loadHistory)
  const inputRef = useRef<HTMLInputElement>(null)

  const customEnabled = Boolean(customSearchName?.trim() && customSearchUrl?.trim())
  const activeEngine = engine === 'custom' && customEnabled
    ? { label: customSearchName!.trim(), mark: customSearchName!.trim().slice(0, 1).toUpperCase(), url: customSearchUrl!.trim() }
    : builtInEngines[engine === 'custom' ? 'bing' : engine]

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const suggestions = useMemo(() => {
    if (!showSuggestions) return []
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return shortcuts
      .filter((item) => item.title.toLowerCase().includes(needle) || item.url.toLowerCase().includes(needle))
      .slice(0, 5)
  }, [query, shortcuts, showSuggestions])

  const calculation = useMemo(() => calculateExpression(query), [query])
  const visibleHistory = showHistory && focused && !query.trim() ? history : []

  const remember = (value: string) => {
    const next = [value, ...history.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, HISTORY_LIMIT)
    setHistory(next)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next))
  }

  const navigate = (value: string) => {
    const exact = shortcuts.find((item) => item.title.toLowerCase() === value.toLowerCase())
    remember(value)
    if (exact) {
      openShortcut(exact)
      return
    }

    const external = looksLikeUrl(value) ? normalizeShortcutUrl(value) : ''
    if (external && !validateShortcutUrl(external)) {
      window.location.assign(external)
      return
    }

    const destination = engine === 'custom' && customEnabled
      ? buildCustomSearchUrl(customSearchUrl!.trim(), value)
      : `${activeEngine.url}${encodeURIComponent(value)}`
    window.location.assign(destination)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    if (calculation !== null) {
      remember(value)
      setQuery(calculation)
      return
    }
    navigate(value)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  }

  return (
    <div className="wetab-search-wrap">
      <form className="wetab-search" onSubmit={submit}>
        <button className="engine-trigger" type="button" onClick={() => setEngineMenuOpen((value) => !value)} aria-label="切换搜索引擎">
          <span>{activeEngine.mark}</span><Icon name="chevronDown" />
        </button>
        <Icon name="search" className="search-main-icon" />
        <input
          ref={inputRef}
          value={query}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索、输入网址、应用协议或直接计算"
          autoComplete="off"
          aria-label="搜索网络、网址、快捷方式、外部协议或计算表达式"
        />
        <kbd>⌘ K</kbd>
      </form>

      {engineMenuOpen && (
        <div className="engine-menu">
          {Object.entries(builtInEngines).map(([id, item]) => (
            <button key={id} className={engine === id ? 'active' : ''} onClick={() => { onEngineChange(id as SearchEngineId); setEngineMenuOpen(false); inputRef.current?.focus() }}>
              <span>{item.mark}</span>{item.label}{engine === id && <Icon name="check" />}
            </button>
          ))}
          {customEnabled && (
            <button className={engine === 'custom' ? 'active' : ''} onClick={() => { onEngineChange('custom'); setEngineMenuOpen(false); inputRef.current?.focus() }}>
              <span>{activeEngine.mark}</span>{customSearchName}{engine === 'custom' && <Icon name="check" />}
            </button>
          )}
        </div>
      )}

      {calculation !== null && query.trim() && (
        <button type="button" className="calculator-search-result" onMouseDown={(event) => event.preventDefault()} onClick={() => setQuery(calculation)}>
          <span>=</span><strong>{calculation}</strong><small>按 Enter 使用结果</small>
        </button>
      )}

      {calculation === null && suggestions.length > 0 && (
        <div className="search-suggestions wetab-suggestions">
          {suggestions.map((item) => (
            <a key={item.id} href={item.url}>
              <ShortcutIcon shortcut={item} className="suggestion-icon" />
              <span><strong>{item.title}</strong><small>{item.url}</small></span>
              <Icon name="external" />
            </a>
          ))}
        </div>
      )}

      {visibleHistory.length > 0 && (
        <div className="search-history-popover">
          <header><span>最近搜索</span><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={clearHistory}>清空</button></header>
          {visibleHistory.map((item) => (
            <button key={item} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(item); navigate(item) }}>
              <Icon name="clock" /><span>{item}</span><Icon name="search" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
