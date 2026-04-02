import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import NewsletterBanner from '../components/NewsletterBanner'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
})

/* ─── Practices data ────────────────────────────────────── */
const SERVICES = [
  {
    num: '01',
    slug: 'innovation',
    image: '/innovation-hero.jpg',
    title: 'الابتكار',
    titleEn: 'Innovation',
    desc: 'نقدم استشارات في مجال الابتكار وتمكين قطاع الأعمال للجهات الحكومية والخاصة، وذلك من خلال خبراء ومختصصين وشبكة متنوعة من الشركاء لتلبية الاحتياجات وتحويل الأفكار إلى واقع.',
    points: [
      'الاستشارات في مجال الابتكار',
      'تنفيذ وإدارة البرامج الابتكارية',
      'تطوير استراتيجيات الابتكار',
      'منظومة الشركاء',
    ],
  },
  {
    num: '02',
    slug: 'organization',
    image: '/org-hero.jpg',
    title: 'الاستشارات الإدارية',
    titleEn: 'Management Consulting',
    desc: 'نقدم الاستشارات الإدارية عبر خدمات تطويرية تستهدف المنظمات، من خلال تحسين كفاءتها وتوفير تجربة مميزة للعميل عبر تقديم حلول بأحدث المنهجيات العلمية والعملية، واستخدام أفضل الممارسات والأدوات التي تساعد في رفع قدرات المنظمة وضمان استدامة التميز المؤسسي لها.',
    points: [
      'التطوير التنظيمي',
      'التطوير الاستراتيجي',
      'إدارة المشاريع',
      'الإسناد والتشغيل',
      'إعداد السياسات والإجراءات',
      'بناء الهياكل التنظيمية',
      'توفير الكفاءات البشرية',
    ],
  },
  {
    num: '03',
    slug: 'market-research',

    image: '/market-research-hero.jpg',
    title: 'أبحاث السوق',
    titleEn: 'Market Research',
    desc: 'نُقدّم حلولاً بحثية رقمية متكاملة تُمكّنك من الاطلاع على أحدث الاتجاهات والإحصاءات والبيانات في مختلف المجالات للقطاعين الحكومي والخاص، باستخدام أحدث الأساليب العلمية والدولية.',
    points: [
      'أبحاث السوق والتحليل',
      'البحث الكمي',
      'البحث النوعي',
      'تحليل المنافسين',
      'قياس رضا العملاء',
      'تحليل الاتجاهات والتوقعات',
    ],
  },
]

/* ─── Dummy image placeholder ───────────────────────────── */
function DummyImage({ index }) {
  const gradients = [
    'from-[#1a2055] to-[#2f48f5]',
    'from-[#0c1030] to-[#1a2055]',
    'from-[#2f48f5] to-[#06081e]',
    'from-[#1a2055] to-[#2f48f5]',
  ]
  return (
    <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center relative overflow-hidden min-h-[360px]`}>
      <div className="absolute inset-0 ocean-mesh opacity-20" />
      <span className="text-white/10 font-black text-[5rem] select-none relative z-10">
        {String(index + 1).padStart(2, '0')}
      </span>
    </div>
  )
}

/* ─── Single service row (alternating) ─────────────────── */
function ServiceRow({ s, index }) {
  const isEven = index % 2 === 0

  return (
    <div className="py-16 lg:py-24 border-b border-gray-100 last:border-0">
      <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${isEven ? '' : 'lg:[direction:ltr]'}`}>

        {/* Image side */}
        <motion.div {...fadeUp(isEven ? 0 : 0.1)} className={isEven ? '' : 'lg:order-2'}>
          {s.image
            ? <img src={s.image} alt={s.title} className="w-full rounded-2xl object-cover min-h-[360px]" style={{ maxHeight: 420 }} />
            : <DummyImage index={index} />
          }
        </motion.div>

        {/* Text side */}
        <motion.div {...fadeUp(isEven ? 0.1 : 0)} className={`[direction:rtl] ${isEven ? '' : 'lg:order-1'}`}>
          {/* Number + label */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-brand-blue font-black text-[18px] tabular-nums tracking-widest">
              {s.num}
            </span>
            <div className="h-px flex-1 bg-brand-blue/20" />
          </div>

          {/* Title */}
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight mb-2">
            {s.title}
          </h2>
          {/* Description */}
          <p className="text-gray-500 font-light text-[18px] leading-[1.9] mb-8">
            {s.desc}
          </p>

          {/* Bullet points */}
          <ul className="space-y-3 mb-8">
            {s.points.map((pt) => (
              <li key={pt} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
                <span className="text-gray-700 font-medium text-[14px]">{pt}</span>
              </li>
            ))}
          </ul>

        </motion.div>

      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function ServicesPage() {
  return (
    <>
      {/* ══ HERO ════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden pt-36 pb-16"
        style={{ background: 'linear-gradient(160deg, #07091f 0%, #0c1030 60%, #080618 100%)' }}
      >
        <div className="absolute inset-0 ocean-mesh opacity-25 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-white/30 mb-12"
          >
            <Link to="/" className="hover:text-white/60 no-underline transition-colors">الرئيسية</Link>
            <span>/</span>
            <span className="text-white/50">خدماتنا</span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-end">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl lg:text-7xl font-black text-white leading-none"
              >
                خدماتنا
              </motion.h1>
            </div>
          </div>

        </div>
      </div>

      {/* ══ SERVICES LIST ═══════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {SERVICES.map((s, i) => (
            <div key={s.slug} id={`practice-${s.slug}`}>
              <ServiceRow s={s} index={i} />
            </div>
          ))}
        </div>
      </section>

      <NewsletterBanner />
    </>
  )
}
