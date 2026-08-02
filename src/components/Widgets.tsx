import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Task, WeatherSnapshot, WidgetInstance } from '../core/types'
import { Icon } from './Icon'

const weatherMap: Record<number, string> = {
  0: '晴朗', 1: '大致晴朗', 2: '局部多云', 3: '阴天', 45: '有雾', 48: '雾凇',
  51: '小毛毛雨', 53: '毛毛雨', 55: '较强毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪', 80: '阵雨', 81: '较强阵雨', 82: '强阵雨', 95: '雷雨',
}

function widgetIcon(type: WidgetInstance['type']) {
  if (type === 'calendar') return 'calendar'
  if (type === 'tasks') return 'task'
  if (type === 'notes') return 'note'
  if (type === 'clock') return 'clock'
  return 'sparkles'
}

export function WidgetFrame({ widget, editMode, onRemove, children }: {
  widget: WidgetInstance
  editMode: boolean
  onRemove: () => void
  children: ReactNode
}) {
  return (
    <article className={`desktop-widget widget-${widget.type} size-${widget.size}`}>
      {editMode && (
        <button className="desktop-remove" onClick={onRemove} aria-label="删除小组件">
          <Icon name="close" />
        </button>
      )}
      <span className="widget-drag-handle" aria-hidden="true"><Icon name={widgetIcon(widget.type)} /></span>
      {children}
    </article>
  )
}

export function ClockWidget({ now }: { now: Date }) {
  const time = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now)
  const date = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(now)
  return (
    <div className="clock-widget-content">
      <strong>{time}</strong>
      <span>{date}</span>
    </div>
  )
}

export function WeatherWidget({ weather, onChange }: {
  weather?: WeatherSnapshot
  onChange: (weather: WeatherSnapshot) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const locate = () => {
    if (!navigator.geolocation) {
      setError('浏览器不支持定位')
      return
    }
    setLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`)
        if (!response.ok) throw new Error('weather request failed')
        const data = await response.json() as { current?: { temperature_2m?: number; weather_code?: number }; timezone_abbreviation?: string }
        onChange({
          temperature: Math.round(data.current?.temperature_2m ?? 0),
          code: data.current?.weather_code ?? 0,
          location: data.timezone_abbreviation || '当前位置',
          updatedAt: Date.now(),
        })
      } catch {
        setError('天气获取失败')
      } finally {
        setLoading(false)
      }
    }, () => {
      setLoading(false)
      setError('需要定位权限')
    }, { timeout: 10000 })
  }

  if (!weather) {
    return (
      <button className="weather-empty" onClick={locate} disabled={loading}>
        <span className="weather-symbol">☁</span>
        <strong>{loading ? '正在定位…' : '获取本地天气'}</strong>
        <small>{error || '点击后授权位置'}</small>
      </button>
    )
  }

  return (
    <button className="weather-content" onClick={locate} title="刷新天气">
      <div><strong>{weather.temperature}°</strong><span>{weatherMap[weather.code] ?? '天气'}</span></div>
      <div className="weather-side"><span className="weather-symbol">{weather.code >= 51 ? '🌧' : weather.code <= 1 ? '☀️' : '⛅'}</span><small><Icon name="location" />{weather.location}</small></div>
    </button>
  )
}

export function CalendarMini({ now }: { now: Date }) {
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const start = firstDay === 0 ? 6 : firstDay - 1
  const cells = Array.from({ length: 35 }, (_, index) => {
    const day = index - start + 1
    return day > 0 && day <= days ? day : null
  })
  return (
    <div className="calendar-mini">
      <div className="calendar-title"><strong>{month + 1}月</strong><span>{year}</span></div>
      <div className="calendar-days">
        {['一','二','三','四','五','六','日'].map((day) => <small key={day}>{day}</small>)}
        {cells.map((day, index) => <span key={index} className={day === now.getDate() ? 'today' : ''}>{day}</span>)}
      </div>
    </div>
  )
}

export function CountdownWidget({ title }: { title?: string }) {
  const now = new Date()
  const nextYear = new Date(now.getFullYear() + 1, 0, 1)
  const days = Math.max(0, Math.ceil((nextYear.getTime() - now.getTime()) / 86_400_000))
  const percent = Math.min(100, Math.round(((365 - days) / 365) * 100))
  return (
    <div className="countdown-content">
      <div><small>{title || '距离新年'}</small><strong>{days}<em>天</em></strong></div>
      <div className="countdown-track"><span style={{ width: `${percent}%` }} /></div>
      <p>{now.getFullYear()} 已走过 {percent}%</p>
    </div>
  )
}

export function TasksMini({ tasks, onChange }: { tasks: Task[]; onChange: (tasks: Task[]) => void }) {
  const [title, setTitle] = useState('')
  const add = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    onChange([...tasks, { id: crypto.randomUUID(), title: title.trim(), done: false, createdAt: Date.now() }])
    setTitle('')
  }
  return (
    <div className="tasks-mini">
      <div className="widget-title"><div><small>TODAY</small><strong>今日待办</strong></div><span>{tasks.filter((task) => !task.done).length}</span></div>
      <div className="tasks-mini-list">
        {tasks.slice(0, 5).map((task) => (
          <label key={task.id} className={task.done ? 'done' : ''}>
            <input type="checkbox" checked={task.done} onChange={() => onChange(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} />
            <span>{task.title}</span>
          </label>
        ))}
      </div>
      <form onSubmit={add}><Icon name="plus" /><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="添加任务" /></form>
    </div>
  )
}

export function NotesMini({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="notes-mini">
      <div className="widget-title"><div><small>QUICK NOTE</small><strong>随手记</strong></div><span>自动保存</span></div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="写下一条想法、链接或提醒…" />
    </div>
  )
}
