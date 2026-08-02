import { useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  Shortcut,
  ShortcutIconFit,
  ShortcutIconMode,
  ShortcutOpenMode,
  WorkspaceId,
} from '../core/types'
import {
  canonicalShortcutUrl,
  copyShortcutUrl,
  describeShortcutUrl,
  inferShortcutTitle,
  normalizeShortcutUrl,
  openShortcut,
  readStoredShortcuts,
  validateShortcutUrl,
} from '../core/shortcutLinks'
import { Icon } from './Icon'
import { ShortcutIcon } from './ShortcutIcon'
import { ShortcutIconPicker } from './ShortcutIconPicker'
import '../styles/shortcut-workflow.css'

const colors = ['#17191f', '#4d78e8', '#35a86b', '#ec7696', '#ff5a25', '#7656d6', '#e4584e', '#f5f2ea']
const protocolPresets = [
  { label: '网页', value: 'https://' },
  { label: '邮件', value: 'mailto:' },
  { label: '电话', value: 'tel:' },
  { label: 'Obsidian', value: 'obsidian://' },
  { label: 'VS Code', value: 'vscode://' },
]

interface Props {
  workspaceId: WorkspaceId
  initial?: Shortcut
  submitLabel: string
  onSubmit: (shortcut: Shortcut) => void
  onCancel?: () => void
}

export function ShortcutForm({ workspaceId, initial, submitLabel, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [url, setUrl] = useState(initial?.url ?? 'https://')
  const [icon, setIcon] = useState(initial?.icon ?? 'W')
  const [color, setColor] = useState(initial?.color ?? colors[1] ?? '#4d78e8')
  const [iconMode, setIconMode] = useState<ShortcutIconMode>(initial?.iconMode ?? 'auto')
  const [iconUrl, setIconUrl] = useState(initial?.iconUrl)
  const [iconFit, setIconFit] = useState<ShortcutIconFit>(initial?.iconFit ?? 'contain')
  const [iconPadding, setIconPadding] = useState(initial?.iconPadding ?? 0)
  const [iconBackground, setIconBackground] = useState(initial?.iconBackground ?? initial?.color ?? colors[1] ?? '#4d78e8')
  const [openMode, setOpenMode] = useState<ShortcutOpenMode>(initial?.openMode ?? 'sameTab')
  const [titleTouched, setTitleTouched] = useState(Boolean(initial))
  const [clipboardStatus, setClipboardStatus] = useState('')
  const urlRef = useRef<HTMLInputElement>(null)

  const normalizedUrl = normalizeShortcutUrl(url)
  const urlError = validateShortcutUrl(url)
  const inferredTitle = inferShortcutTitle(url)
  const duplicate = useMemo(() => {
    if (urlError) return undefined
    const canonical = canonicalShortcutUrl(normalizedUrl)
    return readStoredShortcuts().find((item) => item.id !== initial?.id && canonicalShortcutUrl(item.url) === canonical)
  }, [initial?.id, normalizedUrl, urlError])

  const previewShortcut = useMemo<Shortcut>(() => ({
    id: initial?.id ?? 'preview',
    workspaceId,
    title: title.trim() || inferredTitle || '新快捷方式',
    url: normalizedUrl,
    icon: icon.trim().slice(0, 2) || title.trim().slice(0, 1).toUpperCase() || 'W',
    color,
    iconMode,
    iconUrl,
    iconFit,
    iconPadding,
    iconBackground,
    openMode,
  }), [color, icon, iconBackground, iconFit, iconMode, iconPadding, iconUrl, inferredTitle, initial?.id, normalizedUrl, openMode, title, workspaceId])

  const updateUrl = (value: string) => {
    setUrl(value)
    if (!titleTouched) {
      const suggested = inferShortcutTitle(value)
      if (suggested) {
        setTitle(suggested)
        setIcon(suggested.slice(0, 1).toUpperCase())
      }
    }
    if (iconMode === 'auto') setIconUrl(undefined)
  }

  const pasteFromClipboard = async () => {
    try {
      const value = (await navigator.clipboard.readText()).trim()
      if (!value) {
        setClipboardStatus('剪贴板中没有文本')
        return
      }
      updateUrl(value)
      setClipboardStatus('已粘贴并识别链接')
      urlRef.current?.focus()
    } catch {
      setClipboardStatus('浏览器未授权读取剪贴板')
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (urlError || duplicate || !title.trim()) return
    if ((iconMode === 'image' || iconMode === 'url') && !iconUrl) return
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      workspaceId: initial?.workspaceId ?? workspaceId,
      title: title.trim(),
      url: normalizedUrl,
      icon: icon.trim().slice(0, 2) || title.trim().slice(0, 1).toUpperCase(),
      color,
      iconMode,
      iconUrl: iconMode === 'text' ? undefined : iconUrl,
      iconFit,
      iconPadding,
      iconBackground,
      openMode,
    })
  }

  return (
    <form className="shortcut-form shortcut-form-deep" onSubmit={submit}>
      <div className="shortcut-icon-preview shortcut-live-preview">
        <ShortcutIcon shortcut={previewShortcut} className="app-icon shape-squircle" />
        <div>
          <strong>{previewShortcut.title}</strong>
          <small>{describeShortcutUrl(normalizedUrl)} · {openMode === 'newTab' ? '新标签页打开' : '当前页打开'}</small>
        </div>
        <div className="shortcut-preview-actions">
          <button type="button" disabled={Boolean(urlError)} onClick={() => openShortcut(previewShortcut, 'newTab')} title="测试链接"><Icon name="external" /></button>
          <button type="button" disabled={Boolean(urlError)} onClick={() => void copyShortcutUrl(normalizedUrl)} title="复制链接"><Icon name="download" /></button>
        </div>
      </div>

      <div className="link-preset-row">
        {protocolPresets.map((preset) => (
          <button key={preset.value} type="button" onClick={() => { updateUrl(preset.value); urlRef.current?.focus() }}>{preset.label}</button>
        ))}
      </div>

      <label className="shortcut-url-field">
        <span>链接地址</span>
        <div>
          <input ref={urlRef} value={url} onChange={(event) => updateUrl(event.target.value)} placeholder="粘贴网页、邮箱、电话或应用协议链接" autoFocus />
          <button type="button" onClick={() => void pasteFromClipboard()}><Icon name="upload" />粘贴</button>
        </div>
        {clipboardStatus && <small>{clipboardStatus}</small>}
        {urlError && <small className="form-error">{urlError}</small>}
        {duplicate && <small className="form-error">已存在同一链接：{duplicate.title}</small>}
      </label>

      <label>
        <span>显示名称</span>
        <div className="title-suggestion-row">
          <input value={title} onChange={(event) => { setTitleTouched(true); setTitle(event.target.value) }} placeholder="快捷方式名称" />
          {inferredTitle && inferredTitle !== title && <button type="button" onClick={() => { setTitle(inferredTitle); setIcon(inferredTitle.slice(0, 1).toUpperCase()) }}>使用“{inferredTitle}”</button>}
        </div>
      </label>

      <div className="shortcut-open-settings">
        <span>打开方式</span>
        <div className="segmented-control">
          <button type="button" className={openMode === 'sameTab' ? 'active' : ''} onClick={() => setOpenMode('sameTab')}>当前标签页</button>
          <button type="button" className={openMode === 'newTab' ? 'active' : ''} onClick={() => setOpenMode('newTab')}>新标签页</button>
        </div>
      </div>

      <ShortcutIconPicker
        mode={iconMode}
        shortcutUrl={normalizedUrl}
        imageUrl={iconUrl}
        fit={iconFit}
        padding={iconPadding}
        background={iconBackground}
        onModeChange={setIconMode}
        onImageChange={setIconUrl}
        onFitChange={setIconFit}
        onPaddingChange={setIconPadding}
        onBackgroundChange={setIconBackground}
      />

      {iconMode === 'text' && (
        <div className="form-two-columns">
          <label><span>图标文字</span><input value={icon} maxLength={2} onChange={(event) => setIcon(event.target.value)} /></label>
          <label><span>图标颜色</span><div className="color-options">{colors.map((item) => <button type="button" key={item} className={color === item ? 'active' : ''} style={{ background: item }} onClick={() => { setColor(item); setIconBackground(item) }} aria-label={item} />)}</div></label>
        </div>
      )}

      <div className="shortcut-form-footer">
        {onCancel && <button type="button" className="secondary-action" onClick={onCancel}>取消</button>}
        <button className="primary-action" type="submit" disabled={Boolean(urlError || duplicate || !title.trim() || ((iconMode === 'image' || iconMode === 'url') && !iconUrl))}>
          <Icon name={initial ? 'check' : 'plus'} />{submitLabel}
        </button>
      </div>
    </form>
  )
}
