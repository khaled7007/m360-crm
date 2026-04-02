import { motion } from 'framer-motion'

const STATS = [
  { value: '+12', label: 'سنة خبرة', sub: 'منذ 2012' },
  { value: '+30', label: 'عميل موثوق', sub: 'حكومي وخاص' },
  { value: '+100', label: 'مشروع منجز', sub: 'في مجالات متنوعة' },
  { value: '2', label: 'قطاع رئيسي', sub: 'حكومي وخاص' },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
})

export default function About() {
  return (
    <section id="about" className="py-32 lg:py-44 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Opening rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="w-full h-px bg-gray-200 mb-14 origin-right"
        />

        {/* Label + manifesto */}
        <div className="mb-16">
          <motion.span {...fadeUp(0)} className="section-label block mb-5">
            من نحن
          </motion.span>
          <motion.h2
            {...fadeUp(0.08)}
            className="text-[2.2rem] sm:text-[2.8rem] lg:text-[3.4rem] font-bold text-gray-900 leading-[1.15] tracking-tight max-w-5xl"
          >
            نُعيد تشكيل المؤسسات وتطويرها —{' '}
            <span className="text-brand-blue">
              لأن النمو الحقيقي يبدأ بشراكة حقيقية
            </span>
          </motion.h2>
        </div>

        {/* Horizontal stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="border-y border-gray-200 mb-20"
        >
          <div className="flex flex-wrap">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`flex-1 min-w-[130px] py-8 px-5 lg:px-10 text-center ${
                  i > 0 ? 'border-r border-gray-200' : ''
                }`}
              >
                <div className="text-[2.6rem] lg:text-[3.4rem] font-bold text-brand-dark leading-none tracking-tight mb-1">
                  {s.value}
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-0.5">{s.label}</div>
                <div className="text-xs text-gray-400 font-light">{s.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Body */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-28 items-start">

          {/* Text column */}
          <div>
            <motion.p {...fadeUp(0)} className="text-[16px] text-gray-600 font-light leading-[1.9] mb-6">
              أوشن إكس لحلول الأعمال شركة استشارية سعودية تأسست عام 2012، تقدم خدماتها
              للقطاعين الحكومي والخاص انطلاقًا من خبرة محلية ودولية راسخة في الابتكار
              والاستشارات الإدارية وأبحاث السوق.
            </motion.p>
            <motion.p {...fadeUp(0.08)} className="text-[16px] text-gray-600 font-light leading-[1.9] mb-10">
              لن نتبنى مشروعك فحسب — بل سنُعيد تشكيله وتطويره حتى يصبح واقعًا ملموسًا.
              نؤمن بالشراكة الحقيقية ونعمل مع عملائنا من الفكرة حتى التنفيذ بأعلى
              معايير الجودة والاحترافية.
            </motion.p>
            <motion.div {...fadeUp(0.14)} className="flex flex-wrap gap-2">
              {['القطاع الحكومي', 'القطاع الخاص', 'رؤية 2030'].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 text-[13px] font-medium px-4 py-1.5 rounded-full"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Callout boxes — leading-edge accent bars */}
          <div className="space-y-6">
            {[
              {
                accent: '#2f48f5',
                title: 'رؤية 2030',
                body: 'نُسهم بفاعلية في تحقيق أهداف رؤية المملكة 2030 من خلال تمكين المؤسسات وتطوير قدراتها الاستراتيجية والتشغيلية.',
              },
              {
                accent: '#818DE5',
                title: 'خبرة محلية ودولية',
                body: 'نمتلك عضوية ESOMAR الأوروبية وشهادة Insights Association الأمريكية — ضمانًا لأعلى معايير الجودة في أبحاث السوق.',
              },
              {
                accent: '#d1d5db',
                title: 'التزامنا',
                body: 'لا ننجح إلا حين ينجح عميلنا — هذا المبدأ يوجّه كل قرار نتخذه ويشكّل جوهر شراكتنا معك.',
              },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                {...fadeUp(0.08 + i * 0.08)}
                className="pr-6 py-3 border-r-[3px]"
                style={{ borderColor: c.accent }}
              >
                <div className="font-bold text-gray-900 mb-1.5 text-[15px]">{c.title}</div>
                <p className="text-[14px] text-gray-500 font-light leading-relaxed">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
