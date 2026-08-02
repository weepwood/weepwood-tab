import type { PersistedState, Workspace } from '../core/types'

export const workspaces: Workspace[] = [
  { id: 'focus', name: '专注', hint: '只保留今天最重要的事情', icon: '◎' },
  { id: 'work', name: '工作', hint: '项目、沟通与日程', icon: '◇' },
  { id: 'study', name: '学习', hint: '阅读、课程与知识整理', icon: '△' },
  { id: 'life', name: '生活', hint: '日常安排与轻松浏览', icon: '○' },
]

export const initialState: PersistedState = {
  activeWorkspace: 'work',
  shortcuts: [
    { id: 'github', workspaceId: 'work', title: 'GitHub', url: 'https://github.com', icon: 'GH', color: '#17191f' },
    { id: 'notion', workspaceId: 'work', title: 'Notion', url: 'https://www.notion.so', icon: 'N', color: '#f1eee7' },
    { id: 'mail', workspaceId: 'work', title: '邮箱', url: 'https://mail.google.com', icon: 'M', color: '#e45c4f' },
    { id: 'calendar', workspaceId: 'work', title: '日历', url: 'https://calendar.google.com', icon: '31', color: '#4d77e8' },
    { id: 'chatgpt', workspaceId: 'study', title: 'ChatGPT', url: 'https://chatgpt.com', icon: 'AI', color: '#173f39' },
    { id: 'yuque', workspaceId: 'study', title: '语雀', url: 'https://www.yuque.com', icon: '语', color: '#39a86b' },
    { id: 'weread', workspaceId: 'study', title: '微信读书', url: 'https://weread.qq.com', icon: '读', color: '#58a5f4' },
    { id: 'bilibili', workspaceId: 'life', title: '哔哩哔哩', url: 'https://www.bilibili.com', icon: 'B', color: '#ee799a' },
    { id: 'youtube', workspaceId: 'life', title: 'YouTube', url: 'https://www.youtube.com', icon: '▶', color: '#ed3d3d' },
    { id: 'maps', workspaceId: 'life', title: '地图', url: 'https://maps.google.com', icon: '⌖', color: '#3f9867' },
    { id: 'music', workspaceId: 'focus', title: '音乐', url: 'https://music.youtube.com', icon: '♪', color: '#6d52cc' },
  ],
  tasks: [
    { id: 'task-1', title: '整理今天最重要的三件事', done: false, createdAt: Date.now() },
    { id: 'task-2', title: '留出一段不被打扰的专注时间', done: false, createdAt: Date.now() + 1 },
  ],
  notes: {
    focus: '',
    work: '记录临时想法、链接或需要稍后处理的信息。',
    study: '',
    life: '',
  },
  settings: {
    theme: 'midnight',
    glass: true,
    showSeconds: false,
    compactShortcuts: false,
  },
}
