import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'search' | 'plus' | 'settings' | 'edit' | 'close' | 'check' | 'trash'
  | 'play' | 'pause' | 'reset' | 'external' | 'download' | 'upload' | 'sparkles'
  | 'home' | 'widgets' | 'wallpaper' | 'grid' | 'user' | 'folder' | 'more'
  | 'chevronDown' | 'image' | 'layout' | 'sun' | 'moon' | 'dock' | 'pin'
  | 'location' | 'refresh' | 'calendar' | 'note' | 'task' | 'clock'

const paths: Record<IconName, ReactNode> = {
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9.6h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8c.13.37.34.7.6 1 .3.3.68.48 1.1.5h.1v4h-.1A1.7 1.7 0 0 0 19.4 15Z"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></>,
  play: <path d="m8 5 11 7-11 7Z"/>,
  pause: <><path d="M9 5v14M15 5v14"/></>,
  reset: <><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 1-2-5"/></>,
  external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></>,
  upload: <><path d="M12 15V3M7 8l5-5 5 5M5 21h14"/></>,
  sparkles: <><path d="m12 3 1.2 3.1L16 7.5l-2.8 1.4L12 12l-1.2-3.1L8 7.5l2.8-1.4ZM6 14l.8 2.2L9 17l-2.2.8L6 20l-.8-2.2L3 17l2.2-.8ZM18 13l.8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8Z"/></>,
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
  widgets: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  wallpaper: <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 17 5-5 4 4 3-3 4 4"/></>,
  grid: <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  folder: <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  image: <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m4 16 5-5 4 4 3-3 4 4"/></>,
  layout: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M9 10h12"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"/></>,
  moon: <path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>,
  dock: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 15h10"/></>,
  pin: <><path d="m9 4 6 0 1 5 3 3H5l3-3Z"/><path d="M12 12v8"/></>,
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></>,
  refresh: <><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 1-2-5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
  note: <><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  task: <><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
}

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  )
}
