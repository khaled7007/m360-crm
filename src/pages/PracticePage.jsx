import { useParams, Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { PRACTICES } from '../data/practices'
import { REPORTS } from '../data/insight'
import NewsletterBanner from '../components/NewsletterBanner'

/* ── Accordion row ───────────────────────────────────── */
function AccordionRow({ label }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-4 text-right gap-4"
      >
        <span className={`text-[14px] font-semibold transition-colors ${open ? 'text-brand-blue' : 'text-gray-800'}`}>
          {label}
        </span>
        <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          open ? 'border-brand-blue bg-brand-blue text-white rotate-45' : 'border-gray-300 text-gray-400'
        }`}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M5.5 1.5v8M1.5 5.5h8" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="text-gray-500 text-[13px] font-light pb-4 leading-relaxed">
              نقدم خدمات متخصصة في هذا المجال بمنهجيات علمية وأفضل الممارسات الدولية.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Blue service card ───────────────────────────────── */
function BlueCard({ title, arrowDir = 'left' }) {
  return (
    <div className="bg-brand-blue rounded-xl p-8 flex flex-col justify-between min-h-[200px] group">
      <h3 className="text-white font-bold text-lg leading-snug">{title}</h3>
      <div className={`w-10 h-10 rounded-full border border-white/30 flex items-center justify-center group-hover:border-white/70 transition-colors mt-6 ${arrowDir === 'right' ? 'self-end' : 'self-start'}`}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          {arrowDir === 'right'
            ? <path d="M3 8h10M9 4l4 4-4 4" />
            : <path d="M13 8H3M7 4L3 8l4 4" />
          }
        </svg>
      </div>
    </div>
  )
}

/* ── Gray description card ───────────────────────────── */
function GrayCard({ description, badges, extraCards, sectors }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 flex flex-col justify-between min-h-[200px]">
      {description && (
        <p className="text-gray-600 text-[13px] font-light leading-[1.85]">{description}</p>
      )}
      {sectors && (
        <p className="text-gray-500 text-[13px] font-light leading-[1.85]">{sectors}</p>
      )}
      {badges && (
        <div className="flex gap-3 mt-5">
          {badges.map(b => (
            <div key={b} className="w-28 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 text-center px-2">{b}</span>
            </div>
          ))}
        </div>
      )}
      {extraCards && (
        <div className="flex flex-col gap-2 mt-5">
          {extraCards.map(ec => (
            <div key={ec.title} className={`rounded-lg px-4 py-2.5 text-[12px] font-semibold ${
              ec.featured ? 'bg-brand-blue text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}>
              {ec.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Empty placeholder card ──────────────────────────── */
function PlaceholderCard({ text }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 min-h-[200px] flex items-end">
      {text && <p className="text-gray-400 text-[13px] font-light leading-relaxed">{text}</p>}
    </div>
  )
}

/* ── Insight card in strip ───────────────────────────── */
function InsightStrip({ reports }) {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-3 gap-4">
          {reports.slice(0, 2).map(r => (
            <a
              key={r.title}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl overflow-hidden border border-gray-100 group no-underline block bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className="h-32 overflow-hidden bg-gray-100">
                {r.image
                  ? <img src={r.image} alt={r.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  : <div className="w-full h-full bg-gradient-to-br from-brand-navy to-brand-blue" />
                }
              </div>
              <div className="p-4">
                <p className="text-gray-900 font-bold text-[13px] leading-snug mb-2 group-hover:text-brand-blue transition-colors line-clamp-2">{r.title}</p>
                <span className="text-brand-blue text-[11px] font-semibold">اقرأ التقرير ←</span>
              </div>
            </a>
          ))}
          {/* CTA card */}
          <Link
            to="/insight"
            className="bg-brand-blue rounded-xl p-7 flex flex-col justify-between min-h-[180px] no-underline group"
          >
            <div className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center group-hover:border-white transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M11 7H3M5 3L1 7l4 4" />
              </svg>
            </div>
            <p className="text-white font-bold text-lg leading-snug">
              اكتشف<br />أحدث<br />الإنسايت
            </p>
          </Link>
        </div>
      </div>
    </section>
  )
}

const LEADERS = [
  { name: 'م. إبراهيم الزهيميل', title: 'رئيس مجلس الإدارة والشريك المؤسس', photo: 'https://oceanx.sa/wp-content/uploads/2022/03/Ibraheem-Alzuhaimeel-500x500.jpg', linkedin: 'https://www.linkedin.com/in/ibraheem-alzuhimeel-a61a8416/' },
  { name: 'ديفيد كابيتانيو', title: 'الرئيس التنفيذي', photo: 'https://oceanx.sa/wp-content/uploads/2023/01/Davide-pic500_500-12.jpg', linkedin: 'https://www.linkedin.com/in/davide-capitanio-2b39432a/' },
  { name: 'سارة الزهيميل', title: 'شريك — إدارة الابتكار', photo: 'https://oceanx.sa/wp-content/uploads/2022/03/Sara-Alzuhimeel-500x500.jpg', linkedin: '#' },
]

export default function PracticePage() {
  const { slug } = useParams()
  const practice = PRACTICES.find(p => p.slug === slug)
  if (!practice) return <Navigate to="/" replace />

  const featuredReports = REPORTS.filter(r => r.image).slice(0, 2)

  /* ── Which card layout to render ───────────────────── */
  const renderCards = () => {
    if (slug === 'innovation') {
      return (
        <div className="grid lg:grid-cols-2 gap-4">
          <BlueCard title="حلول الاستشارات" arrowDir="right" />
          <GrayCard description="تُقيّم ممارستنا الوضع الراهن وتُحدد الفجوات الابتكارية، ثم تُصمّم خطط التطوير وتنفّذها بأفضل المنهجيات الدولية." />
          <PlaceholderCard text="متاح لتحديد الأهداف، وإعداد خطط التنفيذ، وتطوير مبادرات الابتكار ومتابعة تنفيذها." />
          <BlueCard title="تنفيذ المشاريع وإدارتها (PMO)" arrowDir="left" />
        </div>
      )
    }
    if (slug === 'organization') {
      return (
        <div className="grid lg:grid-cols-2 gap-4">
          <BlueCard title="حلول الاستشارات" arrowDir="right" />
          <GrayCard description="تعمل ممارستنا على تطوير المنظمات وحل مشكلاتها من خلال أحدث المنهجيات العلمية وأفضل الممارسات الدولية، مما يتيح لها تحديد مسؤولياتها وضمان استدامتها." />
          <PlaceholderCard text="متاح لتحديد النطاق وتصميم الهيكل التنظيمي وتطوير السياسات والإجراءات وفق المعايير الدولية." />
          <BlueCard title="تنفيذ المشاريع وإدارتها (PMO)" arrowDir="left" />
        </div>
      )
    }
    if (slug === 'market-research') {
      return (
        <div className="grid lg:grid-cols-2 gap-4">
          <BlueCard title="اعتماد البحث والتطوير" arrowDir="right" />
          <GrayCard
            description="حصلنا على اعتماد من منظمات عالمية في مجالات البحث والتطوير: العضوية الأوروبية ESOMAR وشهادة Insights Association الأمريكية."
            badges={['ESOMAR', 'Insights Association']}
          />
        </div>
      )
    }
    return null
  }

  return (
    <>
      {/* ── Hero ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-40 pb-14"
        style={{ background: 'linear-gradient(160deg, #07091f 0%, #0b0e2e 60%, #08061a 100%)' }}
      >
        <div className="absolute inset-0 ocean-mesh opacity-25 pointer-events-none" />
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(47,72,245,0.1) 0%, transparent 65%)' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
          <div className={`grid ${practice.image ? 'lg:grid-cols-2 gap-12 items-center' : ''}`}>
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-white/30 mb-10"
              >
                <Link to="/" className="hover:text-white/50 no-underline transition-colors">Home</Link>
                <span>/</span>
                <span className="hover:text-white/50 cursor-default">Practices</span>
                <span>/</span>
                <span className="text-white/50">{practice.titleEn}</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl lg:text-7xl font-black text-white italic mb-5 leading-none tracking-tight"
              >
                {practice.titleEn}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.22 }}
                className="text-white font-semibold text-[13px] leading-relaxed max-w-sm"
              >
                {practice.subtitle}
              </motion.p>
            </div>

            {practice.image && (
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:block overflow-hidden rounded-2xl"
                style={{ height: 340 }}
              >
                <img src={practice.image} alt={practice.title} className="w-full h-full object-cover" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Service cards ────────────────────────────── */}
      <section className="bg-white pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {renderCards()}
        </div>
      </section>

      {/* ── Our Expertise accordion / bullets ────────── */}
      <section className="bg-white pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <p className="text-gray-400 text-[11px] font-semibold tracking-[0.2em] uppercase mb-5 mt-8">
            Our Expertise
          </p>
          {practice.bulletPoints ? (
            <ul className="space-y-3">
              {practice.accordion.map(item => (
                <li key={item.label} className="flex items-center gap-3 text-gray-800 font-semibold text-[15px]">
                  <span className="w-2 h-2 rounded-full bg-brand-blue flex-shrink-0" />
                  {item.label}
                </li>
              ))}
            </ul>
          ) : (
          <div className="grid lg:grid-cols-2 gap-x-14">
            {practice.accordion.map(item => (
              <AccordionRow key={item.label} label={item.label} />
            ))}
          </div>
          )}
          {practice.tags && (
            <div className="flex flex-wrap gap-5 mt-6">
              {practice.tags.map(tag => (
                <span key={tag} className="text-gray-400 text-xs">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Why section — purple/blue gradient ───────── */}
      <section
        style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4338ca 45%, #2f48f5 100%)' }}
        className="py-20"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Why
                <br />
                <span className="italic font-black text-5xl lg:text-6xl">{practice.titleEn}?</span>
              </h2>
            </div>
            <ul className="space-y-5">
              {practice.whyPoints.map((pt, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                  className="flex items-start gap-3 text-white/90 text-[13px] font-semibold leading-relaxed"
                >
                  <span className="w-2 h-2 rounded-full bg-white flex-shrink-0 mt-1.5" />
                  {pt}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Insights strip ────────────────────────────── */}
      <InsightStrip reports={featuredReports} />

      {/* ── Success case study (organizations) ───────── */}
      {practice.caseStudy && (
        <section className="pb-14 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div
              className="relative rounded-xl overflow-hidden min-h-[200px] flex items-center px-12 py-10 group cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #06081e 0%, #1a2055 100%)' }}
            >
              <div className="absolute inset-0 ocean-mesh opacity-15 pointer-events-none" />
              <div className="relative z-10">
                <span className="text-white/40 text-[11px] font-bold tracking-[0.2em] uppercase block mb-2">
                  success case-study
                </span>
                <h3 className="text-2xl lg:text-4xl font-black text-white italic">
                  {practice.caseStudy.title}
                </h3>
              </div>
              <div className="absolute left-10 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 hidden lg:flex items-center justify-center group-hover:border-white/50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M13 8H3M7 4L3 8l4 4" />
                </svg>
              </div>
            </div>
          </div>
        </section>
      )}


      {/* ── Meet Our Practice Leaders ─────────────────── */}
      <section className="py-14 bg-white border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <h2 className="text-xl font-bold text-gray-900 mb-8">Meet Our Practice Leaders</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEADERS.map((leader, i) => (
              <motion.div
                key={leader.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex items-center gap-4 p-5 rounded-xl border border-gray-100 hover:border-brand-blue/20 hover:shadow-md transition-all duration-200"
              >
                <img src={leader.photo} alt={leader.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-100" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-[13px] mb-0.5 leading-snug">{leader.name}</p>
                  <p className="text-gray-400 text-[11px] font-light line-clamp-2">{leader.title}</p>
                </div>
                <div className="flex gap-2">
                  <a href={leader.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-brand-blue transition-colors no-underline" aria-label="LinkedIn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                  <a href="#" className="text-gray-300 hover:text-sky-400 transition-colors no-underline" aria-label="Twitter">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <NewsletterBanner />
    </>
  )
}
