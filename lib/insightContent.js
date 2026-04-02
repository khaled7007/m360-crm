import { parse } from 'node-html-parser'
import { marked } from 'marked'

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'ar,en;q=0.9',
}
const NOISY_TOKENS =
  /(et_pb_|_builder_version|custom_padding|global_colors_info|module_id=|background_size|background_position|background_repeat|min_height=|custom_margin=|fb_built=|header_2_font=)/i
const ARABIC_CHARS = /[\u0600-\u06FF]/

function normalizeInsightUrl({ slug, url }) {
  if (typeof url === 'string' && url.length > 0) {
    const parsed = new URL(url)
    if (parsed.hostname !== 'insight.oceanx.sa') {
      return { status: 400, error: 'Only insight.oceanx.sa URLs are allowed' }
    }

    // Keep Arabic path segments readable to avoid upstream 403 on encoded paths.
    const decodedPath = (() => {
      try {
        return decodeURIComponent(parsed.pathname)
      } catch {
        return parsed.pathname
      }
    })()
    const normalizedPath = decodedPath.endsWith('/') ? decodedPath : `${decodedPath}/`

    return { status: 200, targetUrl: `https://insight.oceanx.sa${normalizedPath}${parsed.search}` }
  }

  if (typeof slug === 'string' && slug.length > 0) {
    const decodedSlug = (() => {
      try {
        return decodeURIComponent(slug)
      } catch {
        return slug
      }
    })()
    const cleanSlug = decodedSlug.replace(/^\/+|\/+$/g, '')
    return { status: 200, targetUrl: `https://insight.oceanx.sa/${cleanSlug}/` }
  }

  return { status: 400, error: 'Missing slug or url' }
}

function extractContentFromHtml(html) {
  const root = parse(html)

  const textModules = root.querySelectorAll('.et_pb_text_inner')
  if (textModules.length > 0) {
    return textModules.map((node) => node.innerHTML).join('\n')
  }

  const entry = root.querySelector('.entry-content, .post-content, article .post-content')
  if (entry) return entry.innerHTML

  return null
}

function isBuilderNoiseLine(text) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return true
  if (NOISY_TOKENS.test(normalized)) return true
  if (!ARABIC_CHARS.test(normalized) && /[_=|]{2,}|_version|global_colors/i.test(normalized)) return true
  return false
}

function sanitizeExtractedHtml(inputHtml) {
  let html = inputHtml

  // Keep content inside et_pb_text modules when shortcodes are present.
  if (html.includes('[et_pb_text')) {
    const modules = []
    const re = /\[et_pb_text[^\]]*]([\s\S]*?)\[\/et_pb_text]/g
    let match
    while ((match = re.exec(html)) !== null) {
      modules.push(match[1])
    }
    if (modules.length > 0) {
      html = modules.join('\n')
    }
  }

  // Remove any residual shortcode tags.
  html = html.replace(/\[[^\]]*]/g, '')

  const root = parse(`<div>${html}</div>`)
  const container = root.querySelector('div')
  if (!container) return null

  container.querySelectorAll('script,style').forEach((node) => node.remove())

  // Remove block lines that are clearly Divi builder metadata.
  container.querySelectorAll('p,li,div,span,section').forEach((node) => {
    const text = node.text
    if (isBuilderNoiseLine(text)) node.remove()
  })

  const cleaned = container.innerHTML
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<div>\s*<\/div>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return cleaned.length > 0 ? cleaned : null
}

async function fetchInsightContentFromRest(targetUrl) {
  const parsed = new URL(targetUrl)
  const slug = decodeURIComponent(parsed.pathname).replace(/^\/+|\/+$/g, '')
  if (!slug) return { status: 404, error: 'Content not found in page' }

  const restUrl = `https://insight.oceanx.sa/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=content.rendered`
  const response = await fetch(restUrl, {
    headers: {
      ...DEFAULT_HEADERS,
      Accept: 'application/json',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    return { status: response.status, error: `REST returned ${response.status}` }
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return { status: 502, error: 'REST endpoint returned non-JSON response' }
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    return { status: 502, error: 'REST endpoint returned invalid JSON' }
  }
  const renderedHtml = payload?.[0]?.content?.rendered
  if (typeof renderedHtml !== 'string') {
    return { status: 404, error: 'Content not found in page' }
  }

  const content = sanitizeExtractedHtml(renderedHtml)
  if (!content) {
    return { status: 404, error: 'Content not found in page' }
  }

  return { status: 200, content }
}

async function fetchInsightContentFromJina(targetUrl) {
  const parsed = new URL(targetUrl)
  const jinaUrl = `https://r.jina.ai/http://${parsed.host}${parsed.pathname}${parsed.search}`
  let response = await fetch(jinaUrl, { redirect: 'follow' })
  if (response.status === 403) {
    // Retry with minimal explicit Accept header when mirror rate-limits defaults.
    response = await fetch(jinaUrl, {
      headers: { Accept: 'text/plain' },
      redirect: 'follow',
    })
  }

  if (!response.ok) {
    return { status: response.status, error: `Jina returned ${response.status}` }
  }

  const text = await response.text()
  const marker = '\nMarkdown Content:\n'
  const markerIndex = text.indexOf(marker)
  const markdown = markerIndex >= 0 ? text.slice(markerIndex + marker.length).trim() : text.trim()
  if (!markdown) {
    return { status: 404, error: 'Jina returned empty content' }
  }

  const html = marked.parse(markdown, { breaks: true, gfm: true })
  const content = sanitizeExtractedHtml(typeof html === 'string' ? html : String(html))
  if (!content) {
    return { status: 404, error: 'Unable to parse Jina markdown content' }
  }

  return { status: 200, content }
}

export async function fetchInsightContent({ slug, url }) {
  try {
    const normalized = normalizeInsightUrl({ slug, url })
    if (normalized.status !== 200) {
      return { status: normalized.status, error: normalized.error }
    }

    const response = await fetch(normalized.targetUrl, {
      headers: DEFAULT_HEADERS,
      redirect: 'follow',
    })

    if (response.ok) {
      const html = await response.text()
      const extracted = extractContentFromHtml(html)
      const content = extracted ? sanitizeExtractedHtml(extracted) : null
      if (content && content.trim().length > 0) {
        return { status: 200, content }
      }
    }

    // Fallback 1: Jina mirror (usually bypasses anti-bot challenge safely).
    const jinaFallback = await fetchInsightContentFromJina(normalized.targetUrl)
    if (jinaFallback.status === 200) {
      return jinaFallback
    }

    // Fallback 2: WordPress REST endpoint.
    const restFallback = await fetchInsightContentFromRest(normalized.targetUrl)
    if (restFallback.status === 200) {
      return restFallback
    }

    if (response.ok) {
      return jinaFallback.status !== 404 ? jinaFallback : restFallback
    }

    return { status: response.status, error: `WP returned ${response.status}`, detail: jinaFallback.error ?? restFallback.error }
  } catch (error) {
    return { status: 500, error: 'Server error', detail: error.message }
  }
}
