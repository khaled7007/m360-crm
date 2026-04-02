import { motion } from 'framer-motion'

const STEPS = [
  {
    num: '01',
    phase: 'المرحلة الأولى',
    title: 'الاستيعاب',
    description: 'نتعمق في فهم مؤسستك وتحدياتها الحقيقية قبل أي خطوة.',
  },
  {
    num: '02',
    phase: 'المرحلة الثانية',
    title: 'التحليل',
    description: 'نحلل البيانات ونشخّص الفجوات بأدوات علمية متقدمة.',
  },
  {
    num: '03',
    phase: 'المرحلة الثالثة',
    title: 'التصميم',
    description: 'نصمم الحلول المخصصة وفق أفضل الممارسات الدولية.',
  },
  {
    num: '04',
    phase: 'المرحلة الرابعة',
    title: 'التنفيذ',
    description: 'ننفذ بجانبك ونقيس الأثر الحقيقي بمؤشرات واضحة.',
  },
]

export default function Process() {
  return (
    <section className="py-32 lg:py-44 bg-[#f7f7f5]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="mb-20 lg:mb-28">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="section-label block mb-4"
          >
            الآلية
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="text-4xl lg:text-[3rem] font-bold text-gray-900 leading-tight"
          >
            كيف{' '}
            <span className="text-brand-blue">نعمل معك</span>
          </motion.h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting dashed line — desktop only */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay: 0.2, ease: 'easeInOut' }}
            className="absolute top-6 right-[12.5%] left-[12.5%] hidden lg:block origin-right"
            style={{ borderTop: '2px dashed #d1d5db' }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.65, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-end text-right relative"
              >
                {/* Numbered circle */}
                <motion.div
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.15, ease: 'backOut' }}
                  className="w-12 h-12 rounded-full bg-white border-2 border-brand-blue flex items-center justify-center mb-8 shadow-sm relative z-10"
                >
                  <span className="text-sm font-bold text-brand-blue">{step.num}</span>
                </motion.div>

                <span className="text-[11px] text-gray-400 font-medium tracking-widest uppercase mb-2.5">
                  {step.phase}
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-[14px] text-gray-500 font-light leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
