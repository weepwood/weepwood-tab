import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Shortcut } from '../core/types'
import { Icon } from './Icon'

const engines = {
  bing: { label: 'Bing', url: 'https://www.bing.com/search?q=' },
  google: { label: 'Google', url: 'https://www.google.com/search?q=' },
  baidu: { label: '百度', url: 'https://www.baidu.com/s?wd=' },
  duckduckgo: { label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
}

type EngineId = keyof typeof engines

function looksLikeUrl(value: string) {
  return /^(https?:\/\/)/i.test(value) || /^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(value)
}

export function SearchBar({ shortcuts }: { shortcuts: Shortcut[] }) {
  const [query, setQuery] = useState('')
  const [engine, setEngine] = useState<EngineId>('bing')
  const suggestions = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return shortcuts.filter((item) => item.title.toLowerCase().includes(needle) || item.url.toLowerCase().includes(needle)).slice(0, 4)
  }, [query, shortcuts])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    const exact = shortcuts.find((item) => item.title.toLowerCase() === value.toLowerCase())
    const destination = exact?.url ?? (looksLikeUrl(value) ? (value.startsWith('http') ? value : `https://${value}`) : `${engines[engine].url}${encodeURIComponent(value)}`)
    window.location.href = destination
  }

  return (
    <div className="search-wrap">
      <form className="search-bar" onSubmit={submit}>
        <Icon name="search" className="search-icon" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索网络、网址或快捷方式…" aria-label="搜索" autoComplete="off" />
        <select value={engine} onChange={(event) => setEngine(event.target.value as EngineId)} aria-label="搜索引擎">
          {Object.entries(engines).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
        </select>
        <kbd>Enter</kbd>
      </form>
      {suggestions.length > 0 && (
        <div className="search-suggestions">
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
