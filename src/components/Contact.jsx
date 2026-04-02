import { motion } from 'framer-motion'

export default function Contact() {
  return (
    <section id="contact" className="relative py-32 lg:py-44 bg-brand-navy overflow-hidden">
      {/* Typographic watermark */}
      <div
        className="absolute bottom-0 left-0 leading-none select-none pointer-events-none font-bold text-white whitespace-nowrap"
        style={{ fontSize: '18vw', opacity: 0.025 }}
      >
        OCEANX
      </div>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(47,72,245,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(47,72,245,0.07) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.25,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-24 items-center">

          {/* Headline — right in RTL */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-brand-blue-light text-xs font-medium tracking-[0.22em] uppercase block mb-6"
            >
              تواصل معنا
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.78, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="text-[2.8rem] sm:text-[3.4rem] lg:text-[4.2rem] font-bold text-white leading-[1.08] tracking-tight mb-6"
            >
              جاهز للخطوة
              <br />
              <span className="text-brand-blue">التالية؟</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="text-gray-400 text-[16px] font-light leading-relaxed max-w-lg"
            >
              تواصل معنا لنبدأ الحديث عن مشروعك — بلا التزامات.
              فريقنا جاهز للاستماع إليك وتقديم الرأي المتخصص.
            </motion.p>
          </div>

          {/* Actions — left in RTL */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="flex flex-col gap-4 lg:min-w-[230px]"
          >
            <a
              href="mailto:info@oceanx.sa"
              className="btn-primary text-[15px] py-4 px-8 whitespace-nowrap"
            >
              احجز جلسة استشارية
            </a>
            <a
              href="mailto:info@oceanx.sa"
              className="btn-dark text-[15px] py-4 px-8 whitespace-nowrap"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="3" width="14" height="10" rx="1.5" />
                <path d="M1 5.5L8 9.5L15 5.5" strokeLinecap="round" />
              </svg>
              info@oceanx.sa
            </a>

            {/* Availability */}
            <div className="flex items-center gap-2 pt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <span className="text-gray-500 text-xs font-light">متاحون للمشاريع الجديدة</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
