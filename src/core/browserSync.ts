import type { PersistedState, Shortcut, WidgetInstance, WorkspaceAppearance, WorkspaceId } from './types'

const META_KEY = 'weepwoodTabSyncMetaV1'
const CHUNK_PREFIX = 'weepwoodTabSyncChunkV1-'
const CHUNK_SIZE = 5000

interface SyncMeta {
  version: 1
  chunks: number
  updatedAt: number
}

interface ChromeStorageArea {
  get: (keys: string | string[] | null, callback: (items: Record<string, unknown>) => void) => void
  set: (items: Record<string, unknown>, callback?: () => void) => void
  remove: (keys: string | string[], callback?: () => void) => void
}

interface ChromeLike {
  storage?: { sync?: ChromeStorageArea }
  runtime?: { lastError?: { message?: string } }
}

function chromeApi() {
  return (globalThis as typeof globalThis & { chrome?: ChromeLike }).chrome
}

function syncArea() {
  return chromeApi()?.storage?.sync
}

function runtimeError() {
  return chromeApi()?.runtime?.lastError?.message
}

export function canUseBrowserSync() {
  return Boolean(syncArea())
}

function storageGet(keys: string | string[]) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const area = syncArea()
    if (!area) {
      reject(new Error('仅扩展版支持浏览器同步'))
      return
    }
    area.get(keys, (items) => {
      const error = runtimeError()
      if (error) reject(new Error(error))
      else resolve(items)
    })
  })
}

function storageSet(items: Record<string, unknown>) {
  return new Promise<void>((resolve, reject) => {
    const area = syncArea()
    if (!area) {
      reject(new Error('仅扩展版支持浏览器同步'))
      return
    }
    area.set(items, () => {
      const error = runtimeError()
      if (error) reject(new Error(error))
      else resolve()
    })
  })
}

function storageRemove(keys: string[]) {
  return new Promise<void>((resolve, reject) => {
    const area = syncArea()
    if (!area || keys.length === 0) {
      resolve()
      return
    }
    area.remove(keys, () => {
      const error = runtimeError()
      if (error) reject(new Error(error))
      else resolve()
    })
  })
}

function sanitizeAppearance(appearance: WorkspaceAppearance): WorkspaceAppearance {
  if (appearance.wallpaper !== 'custom') return { ...appearance, customWallpaper: undefined }
  return {
    wallpaper: 'meadow',
    wallpaperBlur: appearance.wallpaperBlur,
    wallpaperShade: appearance.wallpaperShade,
  }
}

function sanitizeShortcut(shortcut: Shortcut): Shortcut {
  if (shortcut.iconMode !== 'image') return shortcut
  return { ...shortcut, iconMode: 'text', iconUrl: undefined }
}

function sanitizeWidget(widget: WidgetInstance): WidgetInstance {
  if (!widget.config || typeof widget.config.imageData !== 'string') return widget
  const { imageData: _imageData, ...config } = widget.config
  return { ...widget, config }
}

function sanitizeState(state: PersistedState): PersistedState {
  const workspaceAppearances = state.workspaceAppearances
    ? Object.fromEntries(
        Object.entries(state.workspaceAppearances).map(([key, value]) => [
          key,
          value ? sanitizeAppearance(value) : value,
        ]),
      ) as Partial<Record<WorkspaceId, WorkspaceAppearance>>
    : undefined

  return {
    ...state,
    shortcuts: state.shortcuts.map(sanitizeShortcut),
    widgets: state.widgets.map(sanitizeWidget),
    workspaceAppearances,
    settings: {
      ...state.settings,
      wallpaper: state.settings.wallpaper === 'custom' ? 'meadow' : state.settings.wallpaper,
      customWallpaper: undefined,
    },
  }
}

function restoreLocalAssets(remote: PersistedState, local: PersistedState): PersistedState {
  const localShortcuts = new Map(local.shortcuts.map((item) => [item.id, item]))
  const localWidgets = new Map(local.widgets.map((item) => [item.id, item]))

  const shortcuts = remote.shortcuts.map((item) => {
    const localItem = localShortcuts.get(item.id)
    if (localItem?.iconMode === 'image' && localItem.iconUrl) return { ...item, iconMode: 'image' as const, iconUrl: localItem.iconUrl }
    return item
  })

  const widgets = remote.widgets.map((item) => {
    const localConfig = localWidgets.get(item.id)?.config
    if (typeof localConfig?.imageData !== 'string') return item
    return { ...item, config: { ...item.config, imageData: localConfig.imageData } }
  })

  return {
    ...remote,
    shortcuts,
    widgets,
    settings: {
      ...remote.settings,
      customWallpaper: local.settings.customWallpaper,
      wallpaper: local.settings.wallpaper === 'custom' && local.settings.customWallpaper
        ? 'custom'
        : remote.settings.wallpaper,
    },
    workspaceAppearances: {
      ...(remote.workspaceAppearances ?? {}),
      ...Object.fromEntries(
        Object.entries(local.workspaceAppearances ?? {}).filter(([, value]) => value?.wallpaper === 'custom' && value.customWallpaper),
      ),
    },
  }
}

export async function writeBrowserSync(state: PersistedState) {
  const sanitized = sanitizeState(state)
  const text = JSON.stringify(sanitized)
  const chunks = Array.from({ length: Math.ceil(text.length / CHUNK_SIZE) }, (_, index) =>
    text.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  )

  const current = await storageGet(META_KEY)
  const previous = current[META_KEY] as SyncMeta | undefined
  const payload: Record<string, unknown> = {
    [META_KEY]: { version: 1, chunks: chunks.length, updatedAt: Date.now() } satisfies SyncMeta,
  }
  chunks.forEach((chunk, index) => {
    payload[`${CHUNK_PREFIX}${index}`] = chunk
  })
  await storageSet(payload)

  if (previous && previous.chunks > chunks.length) {
    await storageRemove(Array.from(
      { length: previous.chunks - chunks.length },
      (_, index) => `${CHUNK_PREFIX}${chunks.length + index}`,
    ))
  }
}

export async function readBrowserSync(localState: PersistedState) {
  const metaResult = await storageGet(META_KEY)
  const meta = metaResult[META_KEY] as SyncMeta | undefined
  if (!meta?.chunks) throw new Error('浏览器同步中还没有备份')

  const keys = Array.from({ length: meta.chunks }, (_, index) => `${CHUNK_PREFIX}${index}`)
  const chunkResult = await storageGet(keys)
  const text = keys.map((key) => chunkResult[key]).join('')
  if (!text) throw new Error('浏览器同步数据不完整')

  const remote = JSON.parse(text) as PersistedState
  return {
    state: restoreLocalAssets(remote, localState),
    updatedAt: meta.updatedAt,
  }
}

export async function clearBrowserSync() {
  const metaResult = await storageGet(META_KEY)
  const meta = metaResult[META_KEY] as SyncMeta | undefined
  const keys = [META_KEY]
  if (meta?.chunks) {
    keys.push(...Array.from({ length: meta.chunks }, (_, index) => `${CHUNK_PREFIX}${index}`))
  }
  await storageRemove(keys)
}
