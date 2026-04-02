import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* ── Video background ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/hero-video.mp4"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Subtle blue glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 600,
          background: 'radial-gradient(ellipse, rgba(47,72,245,0.07) 0%, transparent 65%)',
        }}
      />

      {/* ── Center content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-72 lg:mt-96">

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.55 }}
          className="text-white/55 text-[15px] lg:text-base font-light leading-relaxed max-w-lg mx-auto mb-10"
        >
          شركة استشارية سعوديـة تقدم خدماتها الاستشارية للقطاعين الحكومي والخاص.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.72 }}
        >
          <Link to="/about" className="btn-primary px-8 py-3.5 text-[14px]">
            اكتشف أوشن إكس
          </Link>
        </motion.div>
      </div>

      {/* ── Scroll cue ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-white/20 text-[9px] font-semibold tracking-[0.3em] uppercase">
          scroll
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-brand-blue/50 to-transparent" />
      </motion.div>
    </section>
  )
}
