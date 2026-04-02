import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ARTICLES, REPORTS, TAG_COLORS } from '../data/insight'
import { articleRoute, isInsightDirectEntry, reportRoute } from '../utils/insightLinks'

function tagCls(tag) {
  return TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 10.5L9 7L5.5 3.5" />
    </svg>
  )
}

function ExternalArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 11L11 3M6 3h5v5" />
    </svg>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5 mt-10">
      <div className="h-5 bg-gray-100 rounded-full w-3/4" />
      <div className="h-4 bg-gray-100 rounded-full w-full" />
      <div className="h-4 bg-gray-100 rounded-full w-5/6" />
      <div className="h-4 bg-gray-100 rounded-full w-full" />
      <div className="h-4 bg-gray-100 rounded-full w-2/3" />
      <div className="h-40 bg-gray-100 rounded-2xl w-full mt-8" />
      <div className="h-4 bg-gray-100 rounded-full w-full" />
      <div className="h-4 bg-gray-100 rounded-full w-4/5" />
      <div className="h-4 bg-gray-100 rounded-full w-full" />
      <div className="h-4 bg-gray-100 rounded-full w-3/4" />
    </div>
  )
}

function relatedLink(kind, id) {
  return kind === 'article' ? articleRoute(id) : reportRoute(id)
}

export default function InsightReaderPage({ forcedKind }) {
  const { kind: routeKind, itemId } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const kind = forcedKind ?? routeKind
  const parsedId = Number(itemId)
  const list = kind === 'report' ? REPORTS : ARTICLES
  const meta = Number.isInteger(parsedId) && parsedId >= 0 ? list[parsedId] ?? null : null

  const tags = useMemo(() => {
    if (!meta) return []
    if (kind === 'report') return meta.tags ?? []
    return meta.tag ? [meta.tag] : []
  }, [kind, meta])

  const relatedItems = useMemo(() => {
    if (!meta) return []

    return list
      .map((item, index) => ({ ...item, index }))
      .filter((item) => {
        if (item.index === parsedId) return false
        if (!isInsightDirectEntry(item.url)) return false
        if (kind === 'report') {
          if (item.year === meta.year) return true
          return (item.tags ?? []).some((tag) => tags.includes(tag))
        }
        return item.tag && tags.includes(item.tag)
      })
      .slice(0, 3)
  }, [kind, list, meta, parsedId, tags])

  useEffect(() => {
    if (!meta || !isInsightDirectEntry(meta.url)) {
      setError('not_found')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setPost(null)

    fetch(`/api/article?url=${encodeURIComponent(meta.url)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok || data.error || !data.content || data.content.trim().length < 50) {
          setError(response.status >= 500 ? 'fetch_error' : 'not_found')
          return
        }
        setPost({ content: data.content })
      })
      .catch(() => setError('fetch_error'))
      .finally(() => setLoading(false))
  }, [meta])

  const externalUrl = meta?.url ?? (kind === 'report' ? 'https://insight.oceanx.sa/reports/' : 'https://insight.oceanx.sa/articles/')
  const contentTypeLabel = kind === 'report' ? 'تقرير' : 'مقالة'
  const relatedLabel = kind === 'report' ? 'تقارير ذات صلة' : 'مقالات ذات صلة'

  return (
    <>
      <div className="relative bg-brand-dark overflow-hidden pt-28 sm:pt-36 pb-10 sm:pb-12">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(47,72,245,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(47,72,245,0.08) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        {meta?.image && (
          <>
            <img
              src={meta.image}
              alt={meta.title}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/80 to-brand-dark" />
          </>
        )}

        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-sm text-gray-500 mb-6"
          >
            <Link to="/" className="hover:text-gray-300 transition-colors no-underline">الرئيسية</Link>
            <span className="rotate-180 opacity-40"><ChevronIcon /></span>
            <Link to="/insight" className="hover:text-gray-300 transition-colors no-underline">إنسايت</Link>
            <span className="rotate-180 opacity-40"><ChevronIcon /></span>
            <span className="text-gray-400 line-clamp-1">{meta?.title ?? contentTypeLabel}</span>
          </motion.div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs text-brand-blue-light font-semibold tracking-widest uppercase">{contentTypeLabel}</span>
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className={`text-xs px-2.5 py-0.5 rounded-full border ${tagCls(tag)}`}>
                {tag}
              </span>
            ))}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4"
          >
            {meta?.title ?? contentTypeLabel}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="text-gray-500 text-sm"
          >
            أوشن إكس إنسايت · {meta?.date ?? ''}
          </motion.p>
        </div>
      </div>

      <div className="bg-white min-h-screen">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-14">
          {loading && <Skeleton />}

          {!loading && !post && (
            <div className="text-center py-20">
              <h2 className="text-xl font-bold text-gray-800 mb-3">تعذّر عرض {contentTypeLabel}</h2>
              <p className="text-gray-500 mb-8 font-light">
                المحتوى غير متاح داخل الموقع حاليًا. يمكنك فتح النسخة الأصلية مباشرة.
              </p>
              <div className="flex items-center justify-center gap-4 mb-8">
                <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                  افتح المصدر الأصلي
                </a>
                <button onClick={() => navigate(-1)} className="btn-light text-sm">
                  رجوع
                </button>
              </div>
              {error === 'fetch_error' && (
                <p className="text-xs text-gray-400 font-light">
                  سبب تقني من المصدر الخارجي، وليس من الموقع الجديد.
                </p>
              )}
            </div>
          )}

          {!loading && post && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="prose prose-lg prose-gray max-w-none
                  prose-headings:font-bold prose-headings:text-gray-900
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:font-light
                  prose-a:text-brand-blue prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-2xl prose-img:shadow-md
                  prose-strong:text-gray-900
                  prose-ul:list-disc prose-ol:list-decimal
                  prose-li:text-gray-700 prose-li:font-light
                  [&>*:first-child]:mt-0"
                dir="rtl"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
                <p className="text-gray-400 text-sm font-light">نُشر على منصة أوشن إكس إنسايت</p>
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand-blue font-medium hover:underline"
                >
                  عرض المصدر الأصلي <ExternalArrow />
                </a>
              </div>

              {relatedItems.length > 0 && (
                <div className="mt-16 pt-10 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">{relatedLabel}</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {relatedItems.map((item) => (
                      <Link
                        key={item.index}
                        to={relatedLink(kind, item.index)}
                        className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-blue/20 transition-all duration-300 overflow-hidden no-underline p-5"
                      >
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {(kind === 'report' ? (item.tags ?? []).slice(0, 2) : item.tag ? [item.tag] : []).map((tag) => (
                            <span key={tag} className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${tagCls(tag)}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h4 className="text-gray-900 font-bold text-sm leading-snug group-hover:text-brand-blue transition-colors duration-200 line-clamp-3">
                          {item.title}
                        </h4>
                        <p className="text-gray-400 text-xs mt-3">{item.date}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
