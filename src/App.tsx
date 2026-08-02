import { useMemo, useState } from 'react'
import type { Shortcut } from './core/types'
import { workspaces } from './data/defaults'
import { useClock } from './hooks/useClock'
import { usePersistentState } from './hooks/usePersistentState'
import { SearchBar } from './components/SearchBar'
import { ShortcutGrid } from './components/ShortcutGrid'
import { CalendarWidget } from './components/CalendarWidget'
import { TaskWidget } from './components/TaskWidget'
import { FocusWidget } from './components/FocusWidget'
import { NotesWidget } from './components/NotesWidget'
import { AddShortcutModal } from './components/AddShortcutModal'
import { SettingsDrawer } from './components/SettingsDrawer'
import { Icon } from './components/Icon'
import './styles/app.css'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

export default function App() {
  const { state, setState, reset } = usePersistentState()
  const [editMode, setEditMode] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { now, time, date } = useClock(state.settings.showSeconds)
  const currentWorkspace = workspaces.find((item) => item.id === state.activeWorkspace) ?? workspaces[0]!
  const visibleShortcuts = useMemo(
    () => state.shortcuts.filter((item) => item.workspaceId === state.activeWorkspace),
    [state.shortcuts, state.activeWorkspace],
  )

  const updateShortcuts = (next: Shortcut[]) => setState((current) => ({ ...current, shortcuts: next }))

  const reorder = (sourceId: string, targetId: string) => {
    const sourceIndex = state.shortcuts.findIndex((item) => item.id === sourceId)
    const targetIndex = state.shortcuts.findIndex((item) => item.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return

    const next = [...state.shortcuts]
    const [moved] = next.splice(sourceIndex, 1)
    if (!moved) return
    next.splice(targetIndex, 0, moved)
    updateShortcuts(next)
  }

  return (
    <div className={`app theme-${state.settings.theme} ${state.settings.glass ? 'glass-enabled' : 'solid-enabled'}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="noise" />

      <header className="app-header">
        <a className="brand-lockup" href="./" aria-label="Weepwood Tab 首页">
          <span className="brand-mark">W</span>
          <span className="brand-copy"><strong>Weepwood Tab</strong><small>{currentWorkspace.name}空间</small></span>
        </a>

        <nav className="workspace-tabs" aria-label="工作区">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              className={state.activeWorkspace === workspace.id ? 'active' : ''}
              onClick={() => setState((current) => ({ ...current, activeWorkspace: workspace.id }))}
            >
              <span className="workspace-icon">{workspace.icon}</span>
              <span>{workspace.name}</span>
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className={`icon-button ${editMode ? 'active' : ''}`}
            onClick={() => setEditMode((value) => !value)}
            aria-label={editMode ? '完成快捷方式编辑' : '编辑快捷方式'}
            title={editMode ? '完成编辑' : '编辑快捷方式'}
          >
            <Icon name={editMode ? 'check' : 'edit'} />
          </button>
          <button className="icon-button" onClick={() => setShowSettings(true)} aria-label="设置" title="设置">
            <Icon name="settings" />
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="hero" aria-labelledby="hero-time">
          <div className="hero-copy">
            <span className="hero-kicker">{greeting()} · {currentWorkspace.name}</span>
            <h1 id="hero-time">{time}</h1>
            <p>{date} · {currentWorkspace.hint}</p>
          </div>
          <SearchBar shortcuts={state.shortcuts} />
        </section>

        <ShortcutGrid
          shortcuts={visibleShortcuts}
          editMode={editMode}
          compact={state.settings.compactShortcuts}
          onAdd={() => setShowAdd(true)}
          onDelete={(id) => updateShortcuts(state.shortcuts.filter((item) => item.id !== id))}
          onReorder={reorder}
        />

        <section className="overview-section">
          <div className="overview-heading">
            <div>
              <span className="eyebrow">DAILY OVERVIEW</span>
              <h2>今日概览</h2>
            </div>
            <p>把需要关注的信息收在一处，不打扰上方的快速访问。</p>
          </div>

          <div className="dashboard-grid">
            <TaskWidget tasks={state.tasks} onChange={(tasks) => setState((current) => ({ ...current, tasks }))} />
            <FocusWidget />
            <CalendarWidget now={now} />
            <NotesWidget
              value={state.notes[state.activeWorkspace]}
              onChange={(value) => setState((current) => ({
                ...current,
                notes: { ...current.notes, [current.activeWorkspace]: value },
              }))}
            />
          </div>
        </section>

        <footer>
          <span>本地优先 · 数据仅保存在当前浏览器</span>
          <a href="https://github.com/weepwood/weepwood-tab" target="_blank" rel="noreferrer">
            GitHub <Icon name="external" />
          </a>
        </footer>
      </main>

      {showAdd && (
        <AddShortcutModal
          workspaceId={state.activeWorkspace}
          onClose={() => setShowAdd(false)}
          onAdd={(shortcut) => updateShortcuts([...state.shortcuts, shortcut])}
        />
      )}
      {showSettings && (
        <SettingsDrawer
          settings={state.settings}
          state={state}
          onChange={(settings) => setState((current) => ({ ...current, settings }))}
          onClose={() => setShowSettings(false)}
          onImport={(imported) => setState(imported)}
          onReset={() => {
            reset()
            setShowSettings(false)
          }}
        />
      )}
    </div>
  )
}
