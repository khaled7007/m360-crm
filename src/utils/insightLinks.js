export function isInsightDirectEntry(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'insight.oceanx.sa') return false
    const pathname = parsed.pathname.toLowerCase()
    return !pathname.startsWith('/category/') && !pathname.startsWith('/tag/')
  } catch {
    return false
  }
}

export function articleRoute(index) {
  return `/insight/read/article/${index}`
}

export function reportRoute(index) {
  return `/insight/read/report/${index}`
}
