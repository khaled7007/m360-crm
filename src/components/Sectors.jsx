import { motion } from 'framer-motion'

const GovIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="white" strokeWidth="1.3">
    <path d="M6 46H46M6 46V26M46 46V26" strokeLinecap="round" />
    <path d="M2 26H50" strokeLinecap="round" />
    <path d="M26 6L2 26H50L26 6Z" strokeLinejoin="round" />
    <rect x="14" y="31" width="8" height="15" rx="1" />
    <rect x="30" y="31" width="8" height="15" rx="1" />
    <circle cx="26" cy="19" r="2.5" fill="white" opacity="0.5" />
    <path d="M20 38H24M28 38H32" stroke="white" strokeLinecap="round" opacity="0.35" />
  </svg>
)

const PrivateIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="white" strokeWidth="1.3">
    <rect x="8" y="24" width="36" height="22" rx="2" />
    <path d="M17 24V20C17 14.477 21.477 10 27 10H27C32.523 10 37 14.477 37 20V24" strokeLinecap="round" />
    <path d="M8 35H44" strokeLinecap="round" />
    <circle cx="26" cy="35" r="3.5" fill="white" opacity="0.5" />
    <path d="M4 46H48" strokeLinecap="round" opacity="0.25" />
  </svg>
)

const SECTORS = [
  {
    id: 'gov',
    Icon: GovIcon,
    title: 'القطاع الحكومي',
    subtitle: 'Government Sector',
    ghostNum: '01',
    description:
      'نقدم حلولاً استراتيجية متكاملة للجهات الحكومية تشمل التحول الرقمي، تطوير الكوادر البشرية، وتحسين كفاءة الأداء المؤسسي بما يتوافق مع أهداف رؤية 2030.',
    features: ['التحول الرقمي', 'تطوير الكوادر', 'تحسين الأداء', 'الإصلاح المؤسسي'],
    accent: 'rgba(47,72,245,0.14)',
  },
  {
    id: 'private',
    Icon: PrivateIcon,
    title: 'القطاع الخاص',
    subtitle: 'Private Sector',
    ghostNum: '02',
    description:
      'نساعد الشركات الخاصة على النمو المستدام والتوسع من خلال الاستشارات الاستراتيجية، تطوير نماذج الأعمال، وبناء الميزة التنافسية في السوق السعودي.',
    features: ['الاستشارات الاستراتيجية', 'نماذج الأعمال', 'التوسع والنمو', 'الميزة التنافسية'],
    accent: 'rgba(129,141,229,0.14)',
  },
]

export default function Sectors() {
  return (
    <section id="sectors" className="py-32 lg:py-44 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header — left-aligned */}
        <div className="mb-20 lg:mb-24">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-brand-blue-light text-xs font-medium tracking-[0.22em] uppercase block mb-4"
          >
            نطاق عملنا
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="text-4xl lg:text-[3rem] font-bold text-white leading-tight"
          >
            القطاعات التي{' '}
            <span className="text-brand-blue">نخدمها</span>
          </motion.h2>
        </div>

        {/* Sector cards */}
        <div className="grid md:grid-cols-2 gap-5 lg:gap-7">
          {SECTORS.map((sector, i) => (
            <motion.div
              key={sector.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, delay: 0.1 + i * 0.12 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="relative rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden group hover:border-brand-blue/30 transition-colors duration-300 h-full">

                {/* Ghost number */}
                <div className="absolute top-5 left-5 text-[8rem] font-bold text-white/[0.035] leading-none select-none pointer-events-none">
                  {sector.ghostNum}
                </div>

                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 30% 30%, ${sector.accent} 0%, transparent 65%)`,
                  }}
                />

                <div className="relative z-10 p-10 lg:p-14">
                  {/* Icon */}
                  <div className="w-20 h-20 rounded-2xl border border-brand-blue/25 bg-brand-blue/12 flex items-center justify-center mb-8 group-hover:bg-brand-blue/22 transition-colors duration-300">
                    <sector.Icon />
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl lg:text-[2.2rem] font-bold text-white leading-tight mb-1">
                    {sector.title}
                  </h3>
                  <p className="text-brand-blue-light text-sm mb-6">{sector.subtitle}</p>

                  {/* Divider */}
                  <div className="w-full border-t border-white/8 mb-7" />

                  {/* Description */}
                  <p className="text-gray-400 font-light leading-relaxed mb-8 text-[15px]">
                    {sector.description}
                  </p>

                  {/* Features as plain text */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2.5">
                    {sector.features.map((f) => (
                      <span
                        key={f}
                        className="text-[13px] text-gray-500 font-light flex items-center gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-brand-blue-light flex-shrink-0" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
