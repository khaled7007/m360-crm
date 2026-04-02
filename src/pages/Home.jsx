import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Hero from '../components/Hero'
import PracticesAccordion from '../components/PracticesAccordion'
import NewsletterBanner from '../components/NewsletterBanner'
import { ARTICLES, REPORTS, PODCASTS, TAG_COLORS } from '../data/insight'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
})

/* ─────────────────────────────────────────────────────────────
   1. Identity — محيط من الحلول + الأرقام الكبيرة
───────────────────────────────────────────────────────────── */
const STATS = [
  { value: '+440', label: 'عميل من القطاعين الحكومي والخاص' },
  { value: '+20',  label: 'قطاع خدمناه' },
  { value: '+40',  label: 'شريك عالمي ومحلي' },
  { value: '+13',  label: 'سنوات الخبرة' },
  { value: '+763', label: 'مشروع تم العمل عليه' },
]

function IdentitySection() {
  return (
    <>
      {/* ── Text block ── */}
      <section className="pt-24 lg:pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <motion.span {...fadeUp(0)} className="section-label block mb-5">
            من نحن
          </motion.span>
          <motion.h2
            {...fadeUp(0.08)}
            className="text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 leading-tight mb-8"
          >
            محيطٌ من
            <br />
            <span className="text-brand-blue">الحلول</span>
          </motion.h2>
          <motion.p
            {...fadeUp(0.18)}
            className="text-gray-500 text-xl lg:text-2xl font-light leading-[1.85] max-w-full"
          >
            أوشن إكس شركة استشارية سعودية تأسست عام 2012، تقدم خدمات متكاملة للقطاعين
            الحكومي والخاص. نُسهم في تطوير المنظمات عبر الابتكار، الاستشارات الإدارية،
            الاستشارات المالية، وأبحاث السوق — بأحدث المنهجيات وأعلى معايير الجودة.
          </motion.p>
        </div>
      </section>

      {/* ── Stats cards ── */}
      <section className="pb-24 lg:pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-8 flex flex-col gap-3 hover:shadow-md hover:border-brand-blue/20 transition-all duration-300"
              >
                <span className="text-4xl lg:text-5xl font-black text-brand-blue leading-none tracking-tight tabular-nums">
                  {s.value}
                </span>
                <span className="text-gray-500 text-[14px] font-light leading-snug">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────
   2. Latest Releases — تقارير + مقالات + بودكاست
───────────────────────────────────────────────────────────── */
const reportItems = REPORTS.filter(r => r.image).slice(0, 3).map(r => ({
  kind: 'تقرير', typeCls: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  title: r.title, date: r.date, image: r.image, tag: r.tags?.[0] ?? 'تقرير',
  href: r.url, external: true,
}))

const articleItems = ARTICLES.filter(a => a.image).slice(0, 3).map(a => ({
  kind: 'مقالة', typeCls: 'bg-blue-50 text-blue-700 border-blue-100',
  title: a.title, date: a.date, image: a.image, tag: a.tag,
  href: a.url, external: true,
}))

const podcastItems = PODCASTS.slice(0, 3).map(p => ({
  kind: 'بودكاست', typeCls: 'bg-violet-50 text-violet-700 border-violet-100',
  title: p.title, date: p.date, image: null, tag: p.guest ? `مع ${p.guest}` : `الموسم ${p.season}`,
  href: p.url, external: true,
  excerpt: `${p.duration} — الموسم ${p.season}`,
}))

const TABS = [
  { id: 'reports',  label: 'تقارير' },
  { id: 'articles', label: 'مقالات' },
  { id: 'podcast',  label: 'بودكاست' },
]

function LatestReleases() {
  const [tab, setTab] = useState('reports')
  const items = tab === 'reports' ? reportItems
    : tab === 'articles' ? articleItems
    : podcastItems

  return (
    <section className="py-24 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-5 mb-12">
          <div>
            <motion.h2 {...fadeUp(0.08)} className="text-3xl lg:text-4xl font-bold text-gray-900">
              أحدث<span className="text-brand-blue"> الإصدارات</span>
            </motion.h2>
          </div>

          {/* Tabs */}
          <motion.div {...fadeUp(0.12)} className="flex items-center gap-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-150 ${
                  tab === t.id
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-brand-blue/40'
                }`}
              >
                {t.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => {
            const tagCls = TAG_COLORS[item.tag] ?? item.typeCls
            const Wrapper = item.external ? 'a' : Link
            const linkProps = item.external
              ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
              : { to: item.href }

            return (
              <motion.div
                key={item.title + i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <Wrapper
                  {...linkProps}
                  className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-brand-blue/15 transition-all duration-300 no-underline h-full"
                >
                  {/* Image */}
                  <div className="h-44 overflow-hidden bg-gray-100 relative">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-navy via-[#1a2055] to-brand-blue">
                        <div className="absolute inset-0 ocean-mesh opacity-20" />
                      </div>
                    )}
                    {/* Type badge on image */}
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${item.typeCls}`}>
                      {item.kind}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${tagCls}`}>
                        {item.tag}
                      </span>
                      <span className="text-gray-400 text-xs">{item.date}</span>
                    </div>
                    <h3 className="text-gray-900 font-bold text-[14px] leading-snug line-clamp-2 mb-3 group-hover:text-brand-blue transition-colors duration-200">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <p className="text-gray-400 text-xs font-light leading-relaxed line-clamp-2 mb-3">
                        {item.excerpt}
                      </p>
                    )}
                    <span className="text-brand-blue text-xs font-semibold inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-200">
                      اقرأ المزيد
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 5.5H2M6 2.5L9 5.5 6 8.5" />
                      </svg>
                    </span>
                  </div>
                </Wrapper>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-center mt-10">
          <Link to="/insight" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-blue no-underline transition-colors font-medium border border-gray-200 hover:border-brand-blue/30 px-5 py-2.5 rounded-lg bg-white">
            عرض كل الإصدارات
          </Link>
        </div>

      </div>
    </section>
  )
}


/* ─────────────────────────────────────────────────────────────
   Home page — compose all sections
───────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      {/* 1. Video hero */}
      <Hero />

      {/* 2. محيط من الحلول + الأرقام الكبيرة */}
      <IdentitySection />

      {/* 3. الخدمات */}
      <PracticesAccordion />

      {/* 4. أحدث الإصدارات — إنسايت + أخبار */}
      <LatestReleases />

      {/* 6. Newsletter */}
      <NewsletterBanner />
    </>
  )
}
