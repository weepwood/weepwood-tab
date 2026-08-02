import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { WidgetInstance } from '../core/types'
import { Icon } from './Icon'
import '../styles/advanced-widgets.css'

const DAY_MS = 86_400_000
const HOTLIST_CACHE_KEY = 'weepwood-tab-hotlist-cache-v1'
const HOTLIST_CACHE_TTL = 15 * 60 * 1000
const WORLD_CLOCK_KEY = 'weepwood-tab-world-clock-zones-v1'

const quotes = [
  ['把复杂问题拆成可以验证的小步骤。', '工程方法'],
  ['真正重要的不是预测，而是为多种结果做好准备。', '概率思维'],
  ['系统的行为通常来自结构，而不是单个事件。', '系统思考'],
  ['先建立可复用的资产，再追求一次性的速度。', '长期主义'],
  ['清晰的边界能够减少大多数隐性复杂度。', '软件设计'],
  ['注意力不是时间的附属品，而是最稀缺的生产资料。', '专注'],
  ['好的工具让正确的行动比错误的行动更容易。', '产品设计'],
  ['保留反例，往往比寻找支持更接近事实。', '批判性思考'],
]

interface HotItem {
  id: number
  title: string
  url: string
  score: number
}

function localDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function AnniversaryWidget({ widget, onChange }: {
  widget: WidgetInstance
  onChange: (widget: WidgetInstance) => void
}) {
  const defaultDate = useMemo(() => localDateValue(new Date(new Date().getFullYear() + 1, 0, 1)), [])
  const savedTitle = typeof widget.config?.title === 'string' ? widget.config.title : '重要日期'
  const savedDate = typeof widget.config?.date === 'string' ? widget.config.date : defaultDate
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(savedTitle)
  const [date, setDate] = useState(savedDate)

  useEffect(() => {
    setTitle(savedTitle)
    setDate(savedDate)
  }, [savedDate, savedTitle])

  const target = new Date(`${savedDate}T00:00:00`)
  const diff = Math.ceil((target.getTime() - Date.now()) / DAY_MS)
  const passed = Number.isNaN(diff) || diff < 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !date) return
    onChange({ ...widget, title: title.trim(), config: { ...widget.config, title: title.trim(), date } })
    setEditing(false)
  }

  if (editing) {
    return (
      <form className="anniversary-editor" onSubmit={submit}>
        <label><span>名称</span><input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></label>
        <label><span>日期</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <div><button type="button" onClick={() => setEditing(false)}>取消</button><button type="submit">保存</button></div>
      </form>
    )
  }

  return (
    <button className="anniversary-widget" onClick={() => setEditing(true)} title="点击编辑日期">
      <span className="anniversary-icon"><Icon name="calendar" /></span>
      <div><small>{savedTitle}</small><strong>{passed ? '已到达' : diff}<em>{passed ? '' : '天'}</em></strong></div>
      <span className="anniversary-date">{savedDate}</span>
    </button>
  )
}

const zoneOptions = [
  { city: '东京', zone: 'Asia/Tokyo' },
  { city: '上海', zone: 'Asia/Shanghai' },
  { city: '新加坡', zone: 'Asia/Singapore' },
  { city: '伦敦', zone: 'Europe/London' },
  { city: '巴黎', zone: 'Europe/Paris' },
  { city: '纽约', zone: 'America/New_York' },
  { city: '洛杉矶', zone: 'America/Los_Angeles' },
  { city: '悉尼', zone: 'Australia/Sydney' },
]
const defaultZones = ['Asia/Tokyo', 'Europe/London', 'America/New_York']

function loadWorldClockZones() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WORLD_CLOCK_KEY) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return defaultZones
    const valid = parsed.filter((item): item is string => typeof item === 'string' && zoneOptions.some((zone) => zone.zone === item))
    return valid.length ? valid.slice(0, 4) : defaultZones
  } catch {
    return defaultZones
  }
}

export function WorldClockWidget({ now }: { now: Date }) {
  const [zones, setZones] = useState<string[]>(loadWorldClockZones)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(zones)

  const toggleZone = (zone: string) => {
    setDraft((current) => current.includes(zone)
      ? current.length > 1 ? current.filter((item) => item !== zone) : current
      : current.length < 4 ? [...current, zone] : current)
  }

  const save = () => {
    setZones(draft)
    localStorage.setItem(WORLD_CLOCK_KEY, JSON.stringify(draft))
    setEditing(false)
  }

  return (
    <div className="world-clock-widget">
      <div className="widget-title">
        <div><small>WORLD TIME</small><strong>世界时钟</strong></div>
        <button className="world-clock-settings" onClick={() => { setDraft(zones); setEditing((value) => !value) }} title="选择城市">
          <Icon name={editing ? 'close' : 'settings'} />
        </button>
      </div>
      {editing ? (
        <div className="world-clock-editor">
          <div>
            {zoneOptions.map((item) => (
              <label key={item.zone} className={draft.includes(item.zone) ? 'active' : ''}>
                <input type="checkbox" checked={draft.includes(item.zone)} onChange={() => toggleZone(item.zone)} />
                <span>{item.city}</span>
              </label>
            ))}
          </div>
          <footer><small>可选择 1—4 个城市</small><button onClick={save}>保存</button></footer>
        </div>
      ) : (
        <div className={`world-clock-list world-clock-count-${zones.length}`}>
          {zones.map((zoneId) => {
            const item = zoneOptions.find((zone) => zone.zone === zoneId) ?? zoneOptions[0]!
            return (
              <div key={item.zone}>
                <span>{item.city}</span>
                <strong>{new Intl.DateTimeFormat('zh-CN', { timeZone: item.zone, hour: '2-digit', minute: '2-digit', hour12: false }).format(now)}</strong>
                <small>{new Intl.DateTimeFormat('zh-CN', { timeZone: item.zone, weekday: 'short', month: 'numeric', day: 'numeric' }).format(now)}</small>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function QuoteWidget({ now }: { now: Date }) {
  const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS)
  const quote = quotes[Math.abs(dayNumber) % quotes.length] ?? quotes[0]!
  return (
    <div className="quote-widget">
      <span className="quote-mark">“</span>
      <p>{quote[0]}</p>
      <footer><span>{quote[1]}</span><small>{now.getMonth() + 1}月{now.getDate()}日</small></footer>
    </div>
  )
}

function readHotlistCache(): HotItem[] | null {
  try {
    const raw = sessionStorage.getItem(HOTLIST_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { updatedAt?: number; items?: HotItem[] }
    if (!parsed.updatedAt || Date.now() - parsed.updatedAt > HOTLIST_CACHE_TTL || !Array.isArray(parsed.items)) return null
    return parsed.items
  } catch {
    return null
  }
}

export function HotlistWidget() {
  const [items, setItems] = useState<HotItem[]>(() => readHotlistCache() ?? [])
  const [loading, setLoading] = useState(items.length === 0)
  const [error, setError] = useState('')

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const idsResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      if (!idsResponse.ok) throw new Error('top stories failed')
      const ids = (await idsResponse.json() as number[]).slice(0, 8)
      const records = await Promise.all(ids.map(async (id) => {
        const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        if (!response.ok) return null
        const data = await response.json() as { id?: number; title?: string; url?: string; score?: number }
        if (!data.id || !data.title) return null
        return {
          id: data.id,
          title: data.title,
          url: data.url || `https://news.ycombinator.com/item?id=${data.id}`,
          score: data.score ?? 0,
        }
      }))
      const next = records.filter((item): item is HotItem => Boolean(item)).slice(0, 6)
      setItems(next)
      sessionStorage.setItem(HOTLIST_CACHE_KEY, JSON.stringify({ updatedAt: Date.now(), items: next }))
    } catch {
      setError('热榜暂时不可用')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (items.length === 0) void refresh()
  }, [])

  return (
    <div className="hotlist-widget">
      <div className="widget-title">
        <div><small>TECH TRENDING</small><strong>科技热榜</strong></div>
        <button onClick={() => void refresh()} disabled={loading} title="刷新热榜"><Icon name="refresh" /></button>
      </div>
      <div className="hotlist-list">
        {items.map((item, index) => (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
            <em>{index + 1}</em><span>{item.title}</span><small>{item.score}</small>
          </a>
        ))}
        {loading && items.length === 0 && <p>正在获取热门内容…</p>}
        {error && items.length === 0 && <button className="hotlist-retry" onClick={() => void refresh()}>{error}，点击重试</button>}
      </div>
      <footer>数据来源：Hacker News</footer>
    </div>
  )
}
