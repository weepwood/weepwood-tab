export interface ImportedBookmark {
  title: string
  url: string
}

interface BookmarkNode {
  title?: string
  url?: string
  children?: BookmarkNode[]
}

interface ChromeBookmarksApi {
  getTree(callback: (nodes: BookmarkNode[]) => void): void
}

interface ChromeRuntimeApi {
  lastError?: { message?: string }
}

interface ChromeLike {
  bookmarks?: ChromeBookmarksApi
  runtime?: ChromeRuntimeApi
}

function chromeApi(): ChromeLike | undefined {
  return (globalThis as typeof globalThis & { chrome?: ChromeLike }).chrome
}

export function canImportBrowserBookmarks() {
  return Boolean(chromeApi()?.bookmarks)
}

function flattenBookmarks(nodes: BookmarkNode[], result: ImportedBookmark[]) {
  for (const node of nodes) {
    if (node.url && /^https?:\/\//i.test(node.url)) {
      result.push({ title: node.title?.trim() || new URL(node.url).hostname, url: node.url })
    }
    if (node.children) flattenBookmarks(node.children, result)
  }
}

export function readBrowserBookmarks(limit = 200): Promise<ImportedBookmark[]> {
  const api = chromeApi()
  if (!api?.bookmarks) return Promise.reject(new Error('当前环境不支持读取浏览器书签'))

  return new Promise((resolve, reject) => {
    api.bookmarks!.getTree((nodes) => {
      const message = api.runtime?.lastError?.message
      if (message) {
        reject(new Error(message))
        return
      }
      const result: ImportedBookmark[] = []
      flattenBookmarks(nodes, result)
      const unique = Array.from(new Map(result.map((item) => [item.url, item])).values())
      resolve(unique.slice(0, limit))
    })
  })
}
