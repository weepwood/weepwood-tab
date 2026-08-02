import { useMemo, useState } from 'react'
import type { Shortcut, WidgetSize, WidgetType, WorkspaceId } from '../core/types'
import {
  canonicalShortcutUrl,
  parseBulkShortcutLines,
  readStoredShortcuts,
} from '../core/shortcutLinks'
import { Icon } from './Icon'
import { ShortcutForm } from './ShortcutForm'

const colors = ['#4d78e8', '#35a86b', '#7656d6', '#e4584e', '#ff5a25', '#ec7696']
const widgetOptions: Array<{ type: WidgetType; title: string; description: string; icon: 'clock' | 'calendar' | 'task' | 'note' | 'location' | 'sparkles'; size: WidgetSize }> = [
  { type: 'clock', title: '时钟', description: '大号时间与日期', icon: 'clock', size: 'medium' },
  { type: 'weather', title: '天气', description: '基于当前位置获取天气', icon: 'location', size: 'small' },
  { type: 'calendar', title: '日历', description: '快速查看本月日期', icon: 'calendar', size: 'small' },
  { type: 'countdown', title: '年度进度', description: '查看今年剩余时间', icon: 'sparkles', size: 'wide' },
  { type: 'anniversary', title: '纪念日', description: '设置目标日期并实时倒计时', icon: 'calendar', size: 'small' },
  { type: 'worldClock', title: '世界时钟', description: '查看多个城市时间', icon: 'clock', size: 'wide' },
  { type: 'hotlist', title: '科技热榜', description: '获取 Hacker News 热门内容', icon: 'sparkles', size: 'tall' },
  { type: 'quote', title: '每日一句', description: '每天展示一句思考提示', icon: 'note', size: 'wide' },
  { type: 'tasks', title: '待办', description: '记录当天任务', icon: 'task', size: 'tall' },
  { type: 'notes', title: '随手记', description: '保存临时想法与链接', icon: 'note', size: 'wide' },
]

interface Props {
  open: boolean
  workspaceId: WorkspaceId
  onClose: () => void
  onAddShortcut: (shortcut: Shortcut) => void
  onAddWidget: (type: WidgetType, size: WidgetSize) => void
}

export function AddPanel({ open, workspaceId, onClose, onAddShortcut, onAddWidget }: Props) {
  const [tab, setTab] = useState<'shortcut' | 'bulk' | 'widgets'>('shortcut')
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState('')
  const parsedEntries = useMemo(() => parseBulkShortcutLines(bulkText), [bulkText])
  const existingUrls = useMemo(() => new Set(readStoredShortcuts().map((item) => canonicalShortcutUrl(item.url))), [bulkText, open])
  const seenBatch = new Set<string>()
  const preparedEntries = parsedEntries.map((entry) => {
    const canonical = canonicalShortcutUrl(entry.url)
    const duplicate = Boolean(canonical && (existingUrls.has(canonical) || seenBatch.has(canonical)))
    if (canonical) seenBatch.add(canonical)
    return { ...entry, duplicate }
  })
  const validEntries = preparedEntries.filter((entry) => !entry.error && !entry.duplicate)

  if (!open) return null

  const addBulk = () => {
    validEntries.forEach((entry, index) => {
      onAddShortcut({
        id: crypto.randomUUID(),
        workspaceId,
        title: entry.title,
        url: entry.url,
        icon: entry.title.slice(0, 1).toUpperCase() || 'W',
        color: colors[index % colors.length] ?? '#4d78e8',
        iconMode: 'auto',
        iconFit: 'contain',
        iconPadding: 0,
        openMode: 'sameTab',
      })
    })
    setBulkResult(`已添加 ${validEntries.length} 个快捷方式，跳过 ${preparedEntries.length - validEntries.length} 条无效或重复记录。`)
    setBulkText('')
  }

  return (
    <div className="panel-backdrop" onMouseDown={onClose}>
      <aside className="floating-panel add-panel add-panel-shortcut-first" onMouseDown={(event) => event.stopPropagation()}>
        <header className="panel-header">
          <div><small>ADD TO DESKTOP</small><h2>添加快捷方式</h2></div>
          <button className="panel-close" onClick={onClose}><Icon name="close" /></button>
        </header>

        <div className="panel-tabs panel-tabs-three">
          <button className={tab === 'shortcut' ? 'active' : ''} onClick={() => setTab('shortcut')}><Icon name="grid" />单个链接</button>
          <button className={tab === 'bulk' ? 'active' : ''} onClick={() => setTab('bulk')}><Icon name="upload" />批量导入</button>
          <button className={tab === 'widgets' ? 'active' : ''} onClick={() => setTab('widgets')}><Icon name="widgets" />小组件</button>
        </div>

        {tab === 'shortcut' && (
          <ShortcutForm
            workspaceId={workspaceId}
            submitLabel="添加到当前空间"
            onSubmit={(shortcut) => { onAddShortcut(shortcut); onClose() }}
          />
        )}

        {tab === 'bulk' && (
          <div className="bulk-shortcut-import">
            <div className="bulk-import-guide">
              <strong>一次粘贴多个链接</strong>
              <small>每行一个网址，也支持“名称 | 网址”、制表符或“名称, 网址”。空行和以 # 开头的行会被忽略。</small>
            </div>
            <textarea
              value={bulkText}
              onChange={(event) => { setBulkText(event.target.value); setBulkResult('') }}
              placeholder={'GitHub | https://github.com\nChatGPT | https://chatgpt.com\nobsidian://open?vault=Notes'}
              autoFocus
            />
            <div className="bulk-import-summary">
              <span>识别 {preparedEntries.length} 条</span>
              <span>可添加 {validEntries.length} 条</span>
              <span>跳过 {preparedEntries.length - validEntries.length} 条</span>
            </div>
            {preparedEntries.length > 0 && (
              <div className="bulk-import-preview">
                {preparedEntries.slice(0, 12).map((entry) => (
                  <div key={`${entry.line}-${entry.url}`} className={entry.error || entry.duplicate ? 'invalid' : ''}>
                    <span>{entry.line}</span>
                    <div><strong>{entry.title || '未命名'}</strong><small>{entry.url || entry.error}</small></div>
                    <em>{entry.error ? '格式错误' : entry.duplicate ? '重复' : '可添加'}</em>
                  </div>
                ))}
              </div>
            )}
            {bulkResult && <p className="bulk-import-result">{bulkResult}</p>}
            <button className="primary-action" disabled={validEntries.length === 0} onClick={addBulk}><Icon name="plus" />添加 {validEntries.length} 个链接</button>
          </div>
        )}

        {tab === 'widgets' && (
          <div className="widget-library widget-library-secondary">
            <p>小组件保持现有能力，当前开发重点已经转向快捷方式、用户图标和外链访问。</p>
            {widgetOptions.map((widget) => (
              <button key={widget.type} onClick={() => { onAddWidget(widget.type, widget.size); onClose() }}>
                <span><Icon name={widget.icon} /></span>
                <div><strong>{widget.title}</strong><small>{widget.description}</small></div>
                <Icon name="plus" />
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}
