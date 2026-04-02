import { motion } from 'framer-motion'

const PRACTICES = [
  {
    id: 'innovation',
    num: '01',
    label: 'Innovation',
    title: 'الابتكار',
    description:
      'نقدم استشارات متخصصة في مجال الابتكار وتمكين الأعمال عبر خبراء متخصصين وشراكات متنوعة، من تصميم مبادرات الابتكار حتى التنفيذ الكامل للبرامج.',
    services: ['استشارات الابتكار', 'تمكين الأعمال', 'تنفيذ البرامج', 'إدارة المشاريع'],
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="13" cy="11" r="5.5" />
        <path d="M10.5 16.5V20H15.5V16.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 20H15" strokeLinecap="round" />
        <path d="M13 5.5V3M6 7.5L4.2 5.7M20 7.5L21.8 5.7M3.5 13H2M24.5 13H23" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'consulting',
    num: '02',
    label: 'Management Consulting',
    title: 'الاستشارات الإدارية',
    description:
      'نطوّر المنظمات وندعم نموها باستخدام أحدث المنهجيات العلمية وأفضل الممارسات الدولية، عبر خدمات متكاملة تشمل التطوير الاستراتيجي وإدارة المشاريع.',
    services: ['التطوير التنظيمي', 'التطوير الاستراتيجي', 'إدارة المشاريع', 'الاستعانة بمصادر خارجية'],
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3.5 21.5V9.5L13 3.5L22.5 9.5V21.5H3.5Z" strokeLinejoin="round" />
        <path d="M9.5 21.5V14.5H16.5V21.5" strokeLinejoin="round" />
        <path d="M3.5 13.5H22.5" />
        <circle cx="13" cy="9.5" r="2" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 'research',
    num: '03',
    label: 'Market Research',
    title: 'أبحاث السوق',
    description:
      'نُجري دراسات وتحليلات السوق بمنهجيات علمية متقدمة. نفخر بعضوية ESOMAR الأوروبية وشهادة Insights Association الأمريكية، ضمانًا لأعلى معايير الجودة.',
    services: ['أبحاث وتحليلات السوق', 'البحث الأولي', 'البحث المكتبي', 'تحليل البيانات'],
    badge: ['ESOMAR Member', 'Insights Association'],
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5L22.5 22.5" strokeLinecap="round" />
        <path d="M8 11H14M11 8V14" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function WhyOceanX() {
  return (
    <section id="practices" className="py-32 lg:py-44 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Asymmetric 2-col header */}
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-20 items-end pb-14 border-b border-gray-100 mb-0">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="section-label block mb-4"
            >
              ممارساتنا
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="text-4xl lg:text-[3rem] font-bold text-gray-900 leading-tight"
            >
              خدماتنا{' '}
              <span className="text-brand-blue">الأساسية</span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.14 }}
            className="text-gray-500 text-[16px] font-light leading-relaxed max-w-xl lg:pb-1"
          >
            ثلاث ممارسات متكاملة تُغطي احتياجاتكم الاستراتيجية — من الابتكار وتمكين الأعمال
            حتى البحث والتحليل المتخصص.
          </motion.p>
        </div>

        {/* McKinsey-style numbered rows */}
        {PRACTICES.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative grid lg:grid-cols-[80px_260px_1fr_auto] gap-6 lg:gap-10 items-start border-b border-gray-100 py-10 -mx-6 lg:-mx-10 px-6 lg:px-10 hover:bg-gray-50/50 transition-colors duration-300"
          >
            {/* Leading accent bar on hover */}
            <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-brand-blue scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom rounded-full" />

            {/* Ghost number */}
            <div className="pt-1 select-none">
              <span className="text-[5rem] lg:text-[6rem] font-bold text-gray-100 group-hover:text-brand-blue/12 transition-colors duration-500 leading-none">
                {p.num}
              </span>
            </div>

            {/* Icon + title */}
            <div className="pt-1">
              <div className="w-12 h-12 rounded-xl bg-brand-blue/8 text-brand-blue flex items-center justify-center mb-5 group-hover:bg-brand-blue/16 transition-colors duration-300">
                {p.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-blue transition-colors duration-200 mb-1">
                {p.title}
              </h3>
              <span className="text-[11px] text-brand-blue-light font-medium tracking-wide">
                {p.label}
              </span>
            </div>

            {/* Description */}
            <div className="pt-1 lg:pt-3">
              <p className="text-[15px] text-gray-500 font-light leading-[1.85]">
                {p.description}
              </p>
              {p.badge && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {p.badge.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1.5 text-[11px] text-brand-blue font-medium bg-brand-blue/6 border border-brand-blue/15 px-3 py-1 rounded-full"
                    >
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
                        <path d="M4.5 0L5.5 3.2H9L6.3 5.2L7.3 8.4L4.5 6.4L1.7 8.4L2.7 5.2L0 3.2H3.5L4.5 0Z" />
                      </svg>
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Services list */}
            <div className="hidden lg:flex flex-col gap-2.5 pt-3 min-w-[180px]">
              {p.services.map((s) => (
                <span
                  key={s}
                  className="text-[13px] text-gray-400 font-light group-hover:text-gray-600 transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-brand-blue transition-colors duration-200 flex-shrink-0" />
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
