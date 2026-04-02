import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import NewsletterBanner from '../components/NewsletterBanner'
import { NEWS, NEWS_TAGS as TAGS, NEWS_TAG_COLORS as TAG_COLORS } from '../data/news'

export default function NewsPage() {
  const [activeTag, setActiveTag] = useState('الكل')

  const filtered = activeTag === 'الكل' ? NEWS : NEWS.filter(n => n.tag === activeTag)
  const featured = NEWS.find(n => n.featured)
  const rest = filtered.filter(n => !n.featured)

  return (
    <>
      {/* Hero */}
      <div className="page-hero">
        <div className="absolute inset-0 light-grid opacity-30 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-white/30 mb-6"
          >
            <Link to="/" className="hover:text-white/60 no-underline transition-colors">الرئيسية</Link>
            <span>/</span>
            <span className="text-white/60">الأخبار</span>
          </motion.div>
          <div className="flex items-end justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl lg:text-6xl font-bold text-white mb-3"
              >
                آخر أخبارنا
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-white/40 text-[15px] font-light"
              >
                أحدث إنجازاتنا وفعالياتنا وشراكاتنا
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden lg:flex items-center gap-3 mb-1"
            >
              <span className="text-white/30 text-sm">{NEWS.length} خبر</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Featured article */}
      {activeTag === 'الكل' && featured && (
        <section className="pt-16 pb-0 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group cursor-pointer rounded-2xl overflow-hidden border border-gray-100 grid lg:grid-cols-2"
            >
              {/* Image side */}
              <div className="relative h-64 lg:h-auto min-h-[280px] bg-gradient-to-br from-brand-navy via-[#1a2055] to-brand-blue overflow-hidden">
                {featured.image
                  ? <img src={featured.image} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0 ocean-mesh opacity-20" />
                }
                <div className="absolute inset-0 flex flex-col items-start justify-end p-10">
                  <span className="text-white/50 text-xs font-mono uppercase tracking-widest mb-3">Featured</span>
                  <div className="w-12 h-0.5 bg-brand-blue mb-4" />
                </div>
              </div>
              {/* Content side */}
              <div className="p-10 flex flex-col justify-between bg-gray-50">
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${TAG_COLORS[featured.tag]}`}>
                      {featured.tag}
                    </span>
                    <span className="text-gray-400 text-xs">{featured.date}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-4 group-hover:text-brand-blue transition-colors duration-200">
                    {featured.title}
                  </h2>
                  <p className="text-gray-500 font-light leading-relaxed text-[15px]">
                    {featured.excerpt}
                  </p>
                </div>
                <div className="mt-8">
                  <a href={featured.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-blue text-sm font-semibold hover:gap-3 transition-all duration-200 no-underline">
                    اقرأ المزيد
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 8H4M8 4l-4 4 4 4" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.article>
          </div>
        </section>
      )}

      {/* Filter + grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* Filter pills */}
          <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                    activeTag === tag
                      ? 'bg-brand-blue text-white border-brand-blue'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-blue/40'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <span className="text-gray-400 text-sm">{filtered.length} نتيجة</span>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((item, i) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="card overflow-hidden group cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-navy via-[#1a2055] to-brand-blue" />
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${TAG_COLORS[item.tag] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                      {item.tag}
                    </span>
                    <span className="text-gray-400 text-xs">{item.date}</span>
                  </div>
                  <h3 className="text-gray-900 font-bold text-[15px] leading-snug mb-2 group-hover:text-brand-blue transition-colors duration-200 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm font-light leading-relaxed line-clamp-3 mb-5">
                    {item.excerpt}
                  </p>
                  <div className="border-t border-gray-100 pt-4">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-brand-blue text-xs font-semibold inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-200 no-underline">
                      اقرأ المزيد
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 6H3M5 4L3 6l2 2" />
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <NewsletterBanner />
    </>
  )
}
