import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Task } from '../core/types'
import { Icon } from './Icon'

export function TaskWidget({ tasks, onChange }: { tasks: Task[]; onChange: (tasks: Task[]) => void }) {
  const [title, setTitle] = useState('')
  const remaining = tasks.filter((task) => !task.done).length

  const add = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    onChange([...tasks, { id: crypto.randomUUID(), title: title.trim(), done: false, createdAt: Date.now() }])
    setTitle('')
  }

  return (
    <article className="widget task-widget">
      <div className="widget-heading"><div><span className="eyebrow">TODAY</span><h3>今日待办</h3></div><span className="count-badge">{remaining}</span></div>
      <div className="task-list">
        {tasks.length === 0 && <p className="empty-state">今天暂时没有待办。</p>}
        {tasks.slice(0, 6).map((task) => (
          <div className={`task-row ${task.done ? 'is-done' : ''}`} key={task.id}>
            <button className="task-check" onClick={() => onChange(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}>{task.done && <Icon name="check" />}</button>
            <span>{task.title}</span>
            <button className="task-remove" onClick={() => onChange(tasks.filter((item) => item.id !== task.id))}><Icon name="close" /></button>
          </div>
        ))}
      </div>
      <form className="quick-add" onSubmit={add}><Icon name="plus" /><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="添加一项任务" /></form>
    </article>
  )
}
