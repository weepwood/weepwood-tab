import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { SearchEngineId, Shortcut } from '../core/types'
import { Icon } from './Icon'

const engines: Record<SearchEngineId, { label: string; mark: string; url: string }> = {
  bing: { label: 'Bing', mark: 'B', url: 'https://www.bing.com/search?q=' },
  google: { label: 'Google', mark: 'G', url: 'https://www.google.com/search?q=' },
  baidu: { label: '百度', mark: '百', url: 'https://www.baidu.com/s?wd=' },
  duckduckgo: { label: 'DuckDuckGo', mark: 'D', url: 'https://duckduckgo.com/?q=' },
}

function looksLikeUrl(value: string) {
  return /^(https?:\/\/)/i.test(value) || /^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(value)
}

interface Props {
  shortcuts: Shortcut[]
  engine: SearchEngineId
  showSuggestions: boolean
  onEngineChange: (engine: SearchEngineId) => void
}

export function SearchBar({ shortcuts, engine, showSuggestions, onEngineChange }: Props) {
  const [query, setQuery] = useState('')
  const [engineMenuOpen, setEngineMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    const exact = shortcuts.find((item) => item.title.toLowerCase() === value.toLowerCase())
    const destination = exact?.url ?? (looksLikeUrl(value)
      ? (value.startsWith('http') ? value : `https://${value}`)
      : `${engines[engine].url}${encodeURIComponent(value)}`)
    window.location.href = destination
  }

  return (
    <div className="wetab-search-wrap">
      <form className="wetab-search" onSubmit={submit}>
        <button
          className="engine-trigger"
          type="button"
          onClick={() => setEngineMenuOpen((value) => !value)}
          aria-label="切换搜索引擎"
        >
          <span>{engines[engine].mark}</span>
          <Icon name="chevronDown" />
        </button>
        <Icon name="search" className="search-main-icon" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="输入搜索内容"
          autoComplete="off"
          aria-label="搜索网络、网址或快捷方式"
        />
        <kbd>⌘ K</kbd>
      </form>

      {engineMenuOpen && (
        <div className="engine-menu">
          {Object.entries(engines).map(([id, item]) => (
            <button
              key={id}
              className={engine === id ? 'active' : ''}
              onClick={() => {
                onEngineChange(id as SearchEngineId)
                setEngineMenuOpen(false)
                inputRef.current?.focus()
              }}
            >
              <span>{item.mark}</span>{item.label}
              {engine === id && <Icon name="check" />}
            </button>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="search-suggestions wetab-suggestions">
          {suggestions.map((item) => (
            <a key={item.id} href={item.url}>
              <span className="suggestion-icon" style={{ background: item.color }}>{item.icon}</span>
              <span><strong>{item.title}</strong><small>{item.url}</small></span>
              <Icon name="external" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
