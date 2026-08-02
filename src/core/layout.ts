import type { DesktopItem, DesktopLayout, WidgetInstance, WidgetSize, WorkspaceId } from './types'

export const DESKTOP_COLUMNS = 12
export const DESKTOP_ROW_HEIGHT = 92
export const DESKTOP_GAP = 16

const widgetDimensions: Record<WidgetSize, Pick<DesktopLayout, 'w' | 'h'>> = {
  small: { w: 3, h: 2 },
  medium: { w: 4, h: 2 },
  wide: { w: 5, h: 2 },
  tall: { w: 3, h: 4 },
}

export function getDefaultItemSize(item: DesktopItem, widgets: WidgetInstance[]): Pick<DesktopLayout, 'w' | 'h'> {
  if (item.kind !== 'widget') return { w: 1, h: 1 }
  const widget = widgets.find((entry) => entry.id === item.refId)
  return widgetDimensions[widget?.size ?? 'small']
}

export function clampLayout(layout: DesktopLayout, columns = DESKTOP_COLUMNS): DesktopLayout {
  const w = Math.max(1, Math.min(columns, Math.round(layout.w)))
  const h = Math.max(1, Math.round(layout.h))
  return {
    x: Math.max(0, Math.min(columns - w, Math.round(layout.x))),
    y: Math.max(0, Math.round(layout.y)),
    w,
    h,
  }
}

export function layoutsOverlap(a: DesktopLayout, b: DesktopLayout) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function findNearestFreeLayout(
  proposed: DesktopLayout,
  occupied: DesktopLayout[],
  columns = DESKTOP_COLUMNS,
): DesktopLayout {
  const base = clampLayout(proposed, columns)
  if (!occupied.some((layout) => layoutsOverlap(base, layout))) return base

  const maxY = Math.max(base.y + 12, ...occupied.map((layout) => layout.y + layout.h + 4))
  const candidates: DesktopLayout[] = []
  for (let y = 0; y <= maxY; y += 1) {
    for (let x = 0; x <= columns - base.w; x += 1) {
      const candidate = { ...base, x, y }
      if (!occupied.some((layout) => layoutsOverlap(candidate, layout))) candidates.push(candidate)
    }
  }

  candidates.sort((a, b) => {
    const distanceA = Math.abs(a.x - base.x) + Math.abs(a.y - base.y)
    const distanceB = Math.abs(b.x - base.x) + Math.abs(b.y - base.y)
    return distanceA - distanceB || a.y - b.y || a.x - b.x
  })
  return candidates[0] ?? { ...base, y: maxY + 1 }
}

export function normalizeDesktopLayouts(items: DesktopItem[], widgets: WidgetInstance[]): DesktopItem[] {
  const occupiedByWorkspace = new Map<WorkspaceId, DesktopLayout[]>()

  return items.map((item) => {
    const occupied = occupiedByWorkspace.get(item.workspaceId) ?? []
    const size = getDefaultItemSize(item, widgets)
    const requested = item.layout ? { ...item.layout, ...size } : { x: 0, y: 0, ...size }
    const layout = findNearestFreeLayout(requested, occupied)
    occupied.push(layout)
    occupiedByWorkspace.set(item.workspaceId, occupied)
    return { ...item, layout }
  })
}

export function getNextDesktopLayout(
  workspaceId: WorkspaceId,
  kind: DesktopItem['kind'],
  items: DesktopItem[],
  widgets: WidgetInstance[],
  widgetSize?: WidgetSize,
): DesktopLayout {
  const occupied = items
    .filter((item) => item.workspaceId === workspaceId && item.layout)
    .map((item) => item.layout as DesktopLayout)

  const size = kind === 'widget'
    ? widgetDimensions[widgetSize ?? 'small']
    : { w: 1, h: 1 }

  return findNearestFreeLayout({ x: 0, y: 0, ...size }, occupied)
}

export function widgetSizeFromLayout(layout: DesktopLayout): WidgetSize {
  if (layout.h >= 4) return 'tall'
  if (layout.w >= 5) return 'wide'
  if (layout.w >= 4) return 'medium'
  return 'small'
}
