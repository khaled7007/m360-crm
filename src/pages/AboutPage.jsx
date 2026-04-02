import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import NewsletterBanner from '../components/NewsletterBanner'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
})

/* ─── Values ────────────────────────────────────────────── */
const VALUES = [
  { title: 'الإنجاز بكفاءة', desc: 'من أولوياتنا تجاه عملائنا أن نقدم لهم خدمات بجودة عالية، وأن نسعى لتحقيق ذلك لكي يبقى الأثر على المدى الطويل', icon: '/values/value-1.png' },
  { title: 'الإبداع بلا حدود', desc: 'نتخذ من الابتكار أساساً لإبداعنا والذي ينعكس على مخرجاتنا في العمل، فلا نتأثر مهما اختلفت الظروف', icon: '/values/value-4.png' },
  { title: 'عطاء أكثر لعملاءنا', desc: 'غايتنا هي تحقيق متطلبات العميل، ونحرص دائمًا بأن نقدم المزيد لخلق تجربة تفوق توقعاته', icon: '/values/value-3.png' },
  { title: 'التعلم ومشاركة المعرفة', desc: 'نمتلك شغفًا متجددًا لاكتساب المهارات الجديدة والتعلم من مصادر مختلفة، ودورنا يكمن في نقل ومشاركة المعرفة لزملائنا', icon: '/values/value-2.png' },
]

/* ─── Why points ────────────────────────────────────────── */
const WHY_POINTS = [
  {
    title: 'خبرة أكثر من 13 عاماً',
    desc: 'حضور راسخ في السوق السعودي منذ 2012 مع سجل حافل من المشاريع الناجحة.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    title: 'فريق متعدد التخصصات',
    desc: 'كفاءات محلية ودولية تجمع بين الاستشارات الإدارية، المالية، الابتكار وأبحاث السوق.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    title: 'اعتماد دولي',
    desc: 'عضوية ESOMAR الأوروبية وشهادة Insights Association الأمريكية واعتماد هيئة المقيّمين السعوديين.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  },
  {
    title: 'منهجية علمية',
    desc: 'نعتمد أحدث الأساليب العلمية والدولية في التحليل وتقديم الحلول لكل عميل.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H3m6 0h12m0 0V5M3 7h18M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"/></svg>,
  },
  {
    title: 'نتائج قابلة للقياس',
    desc: 'كل مشروع نُنجزه يُترجم إلى مؤشرات أداء واضحة وأثر حقيقي على الأعمال.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
]

/* ─── People data ───────────────────────────────────────── */
const BOARD = [
  { name: 'طارق القرعاوي', nameEn: 'Tareq Al-Garawy', title: 'عضو مجلس إدارة', photo: 'https://oceanx.sa/wp-content/uploads/2024/08/Tareq-Al-Garawy.jpg', initials: 'طق', linkedin: 'https://www.linkedin.com/in/tareq-al-garawy-cma-cfm-a491614/' },
  { name: 'عبدالإله الصعب', nameEn: 'Abdulelah Alsaab', title: 'عضو مجلس إدارة', photo: 'https://oceanx.sa/wp-content/uploads/2024/08/1517627911488.png', initials: 'عص', linkedin: 'https://www.linkedin.com/in/abdulelah-alsaab-7720b62b/' },
  { name: 'أحمد الزهيميل', nameEn: 'Ahmed Alzohimeel', title: 'عضو مجلس إدارة', photo: 'https://oceanx.sa/wp-content/uploads/2024/08/1609695295564-500x500.png', initials: 'أز', linkedin: 'https://www.linkedin.com/in/ahmed-alzohimeel-9aa63a84/' },
]

const FOUNDERS = [
  { name: 'م. إبراهيم الزهيميل', nameEn: 'Eng. Ibrahim Alzuhaimeel', title: 'رئيس مجلس الإدارة', subtitle: 'شريك مؤسس', photo: 'https://oceanx.sa/wp-content/uploads/2022/03/Ibraheem-Alzuhaimeel-500x500.jpg', initials: 'إز', experience: '+18', expLabel: 'سنة خبرة', bio: 'بخبرة تزيد عن 18 عامًا في الاستشارات الاستراتيجية والإدارية، توسعت لتشمل الاستثمار الملائكي وإدارة الأعمال والاستشارات المالية. يتميز بفهمه العميق لتوجهات السوق والابتكار، وساهم بشكل بارز في تعزيز منظومة الابتكار في المملكة العربية السعودية.', linkedin: 'https://www.linkedin.com/in/ibraheem-alzuhimeel-a61a8416/' },
  { name: 'عبدالله العساف', nameEn: 'Abdullah Alassaf', title: 'نائب رئيس مجلس الإدارة', subtitle: 'شريك مؤسس', photo: 'https://oceanx.sa/wp-content/uploads/2022/03/Abdullah-Alassaf-500x500.jpg', initials: 'عع', experience: '+15', expLabel: 'سنة خبرة', bio: 'شريك مؤسس لأوشن إكس ونائب رئيس مجلس الإدارة، يمتلك خبرة واسعة في قيادة الأعمال وبناء الشراكات الاستراتيجية، وساهم في تشكيل هوية الشركة ورؤيتها منذ تأسيسها.', linkedin: 'https://www.linkedin.com/in/abdullah-alassaf-080a0422/' },
]

const TEAM = [
  { name: 'ديفيد كابيتانيو', nameEn: 'Davide Capitanio', title: 'الرئيس التنفيذي', photo: 'https://oceanx.sa/wp-content/uploads/2023/01/Davide-pic500_500-12.jpg', initials: 'DC', experience: '+16', expLabel: 'سنة خبرة', bio: 'مستشار استراتيجي بخبرة تزيد عن 16 عامًا في التقنية واستراتيجية الأعمال والابتكار في أوروبا والولايات المتحدة والشرق الأوسط. قاد استراتيجيات ابتكار كبرى وبرامج تنظيم وقيادة.', linkedin: 'https://www.linkedin.com/in/davide-capitanio-2b39432a/' },
  { name: 'سارة الزهيميل', nameEn: 'Sara Alzuhimeel', title: 'شريك — إدارة الابتكار', photo: 'https://oceanx.sa/wp-content/uploads/2022/03/Sara-Alzuhaimeel-500x500.jpg', initials: 'سز', experience: '+11', expLabel: 'سنة خبرة', bio: 'مستشار في الابتكار وريادة الأعمال بخبرة تتجاوز 11 عامًا، ساهمت في تأسيس أكثر من 35 مشروعًا بما فيها حاضنات ومسرعات الأعمال، وقدّمت أكثر من 50 ورشة عمل في الابتكار.', linkedin: 'https://www.linkedin.com/in/sara-alzuhimeel-a80a9ab6/' },
  { name: 'رومان سانت كلير', nameEn: 'Roman St. Clair', title: 'شريك — إدارة أبحاث السوق', photo: 'https://oceanx.sa/wp-content/uploads/2026/01/Roman-headshot-1-2-500x500.png', initials: 'RS', experience: '+10', expLabel: 'سنة في الخليج', bio: 'قائد في الاتصال الاستراتيجي وتحليل الأسواق بخبرة أكثر من 10 سنوات في دول الخليج، متخصص في رؤى الأعمال والتحليلات التي تدعم صناعة القرار لدى الجهات الحكومية والخاصة.', linkedin: 'https://www.linkedin.com/in/roman-st-clair-48813343/' },
  { name: 'أسماء المطيري', nameEn: 'Asma Almutairi', title: 'مدير عام — الاستشارات الإدارية', photo: 'https://oceanx.sa/wp-content/uploads/2022/03/Asma-Almutairi-500x500.jpg', initials: 'أم', experience: '+9', expLabel: 'سنة خبرة', bio: 'مستشار إداري بخبرة تتجاوز 9 سنوات في تطوير الاستراتيجيات وتحول المنظمات، متخصصة في حلول إدارية مبتكرة تلبّي احتياجات مختلف القطاعات وتدعم رؤية 2030.', linkedin: 'https://www.linkedin.com/in/asma-almutairi-470743141/' },
  { name: 'فينتشنزو ميركوريو', nameEn: 'Vincenzo Mercurio', title: 'مدير عام — الاستشارات الإدارية', photo: 'https://oceanx.sa/wp-content/uploads/2024/11/Vincenzo-Mercurio-4-500x500.jpg', initials: 'VM', experience: '+9', expLabel: 'سنة خبرة', bio: 'مستشار إداري بخبرة تزيد عن 9 سنوات في الاستشارات الاستراتيجية. خبرة في لندن وليماسول وميلانو، يتخصص في صياغة الاستراتيجيات ودفع النمو والابتكار في القطاعين العام والخاص.', linkedin: 'https://www.linkedin.com/in/vincenzo-mercurio-6893b2a5/' },
]

/* ─── Helpers ───────────────────────────────────────────── */
function Avatar({ photo, initials, size = 'md' }) {
  const [failed, setFailed] = useState(false)
  const cls = { sm: 'w-16 h-16 text-base', md: 'w-20 h-20 text-lg', lg: 'w-24 h-24 text-xl' }
  return (
    <div className={`${cls[size]} rounded-full overflow-hidden border-2 border-brand-blue/20 flex-shrink-0 bg-brand-blue/10 flex items-center justify-center`}>
      {!failed && photo
        ? <img src={photo} alt={initials} className="w-full h-full object-cover" onError={() => setFailed(true)} />
        : <span className="font-bold text-brand-blue">{initials}</span>}
    </div>
  )
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.6 5.4H1V15H3.6V5.4ZM2.3 4.3C3.1 4.3 3.8 3.6 3.8 2.8 3.8 2 3.1 1.3 2.3 1.3 1.5 1.3 0.8 2 0.8 2.8 0.8 3.6 1.5 4.3 2.3 4.3ZM15 15H12.4V10.3C12.4 9.3 12.4 8 10.9 8 9.4 8 9.2 9.1 9.2 10.2V15H6.6V5.4H9.1V6.5H9.1C9.5 5.7 10.5 4.9 11.9 4.9 14.5 4.9 15 6.6 15 8.9V15Z" />
    </svg>
  )
}

function BoardCard({ m, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.06 * i }}
      whileHover={{ y: -5 }}
    >
      <div className="card p-8 flex flex-col items-center text-center gap-5 h-full">
        <Avatar photo={m.photo} initials={m.initials} size="lg" />
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-base leading-snug">{m.name}</p>
          <p className="text-[12px] text-gray-400 font-light mt-1">{m.nameEn}</p>
          <p className="text-brand-blue text-sm font-semibold mt-3 leading-snug">{m.title}</p>
          {m.subtitle && <p className="text-gray-400 text-[12px] mt-1 font-light">{m.subtitle}</p>}
        </div>
        <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="text-brand-blue-light hover:text-brand-blue transition-colors no-underline">
          <LinkedInIcon />
        </a>
      </div>
    </motion.div>
  )
}

function TeamCard({ m, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.07 * i }}
      whileHover={{ y: -5 }} className="flex"
    >
      <div className="card p-7 flex flex-col gap-5 w-full">
        <div className="flex items-start gap-4">
          <Avatar photo={m.photo} initials={m.initials} size="lg" />
          <div className="flex-1 min-w-0 pt-1">
            <p className="font-bold text-gray-900 leading-snug text-base">{m.name}</p>
            <p className="text-[12px] text-gray-400 font-light mt-0.5">{m.nameEn}</p>
            <p className="text-brand-blue text-xs font-semibold mt-2 leading-snug">{m.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-brand-blue/8 border border-brand-blue/18 text-brand-blue text-sm font-bold px-3 py-1 rounded-full">{m.experience}</span>
          <span className="text-gray-500 text-sm font-light">{m.expLabel}</span>
        </div>
        <p className="text-gray-600 text-[14px] font-light leading-relaxed flex-1">{m.bio}</p>
        <div className="pt-4 border-t border-gray-100">
          <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-blue-light hover:text-brand-blue text-xs font-medium transition-colors no-underline">
            <LinkedInIcon /> عرض الملف الشخصي
          </a>
        </div>
      </div>
    </motion.div>
  )
}

function SectionDivider({ label }) {
  return (
    <motion.div {...fadeUp(0)} className="flex items-center gap-4 mb-12">
      <div className="h-px flex-1 bg-gray-100" />
      <span className="text-gray-800 font-bold text-base whitespace-nowrap tracking-wide">{label}</span>
      <div className="h-px flex-1 bg-gray-100" />
    </motion.div>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <>
      {/* ══ HERO ════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden pt-24 pb-0"
        style={{ background: 'linear-gradient(160deg, #07091f 0%, #0c1030 60%, #080618 100%)' }}
      >
        <div className="absolute inset-0 ocean-mesh opacity-25 pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(47,72,245,0.1) 0%, transparent 65%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center pb-10">

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="overflow-hidden rounded-2xl order-2 lg:order-2 flex items-center justify-center"
              style={{ height: 360, background: 'rgba(255,255,255,0.04)' }}
            >
              <img src="/office-hero.png" alt="مكتب أوشن إكس" className="w-full h-full rounded-2xl" style={{ objectFit: 'contain' }} />
            </motion.div>

            {/* Text */}
            <div className="order-1 lg:order-1 flex flex-col justify-center py-10 lg:py-12">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs text-white/30 mb-6">
                <Link to="/" className="hover:text-white/60 no-underline transition-colors">الرئيسية</Link>
                <span>/</span>
                <span className="text-white/50">من نحن</span>
              </motion.div>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="section-label block mb-4">من نحن</motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-[1.2] mb-6"
              >
                أعوامنا من المعرفة جعلتنا كياناً{' '}
                <span className="text-brand-blue">يمكنك الوثوق به</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="text-white/60 text-[15px] font-light leading-[1.8]"
              >
                أوشن إكس لحلول الأعمال شركة استشارية سعودية تأسست عام 2012، تقدم خدماتها للقطاعين الحكومي والخاص. نُسهم في تطوير المنظمات عبر الابتكار، الاستشارات الإدارية، الاستشارات المالية، وأبحاث السوق — بأحدث المنهجيات وأعلى معايير الجودة.
              </motion.p>
            </div>

          </div>
        </div>
      </div>

      {/* ══ رؤيتنا + رسالتنا ════════════════════════════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col divide-y divide-gray-100">
          <motion.div {...fadeUp(0)} className="grid lg:grid-cols-[180px_1fr] gap-6 lg:gap-16 lg:items-center pb-10">
            <h3 className="text-brand-blue text-2xl font-black flex-shrink-0">رؤيتنا</h3>
            <p className="text-gray-600 font-light text-[18px] leading-relaxed">أن نكون ضمن الجهات الاستشارية التي تُحدث فرقًا حقيقيًا في قطاع الأعمال بالمملكة، من خلال استشارات ترتبط بالنتائج وتنعكس أثرًا ملموسًا ومستدامًا.</p>
          </motion.div>
          <motion.div {...fadeUp(0.08)} className="grid lg:grid-cols-[180px_1fr] gap-6 lg:gap-16 lg:items-center pt-10">
            <h3 className="text-brand-blue text-2xl font-black flex-shrink-0">رسالتنا</h3>
            <p className="text-gray-600 font-light text-[18px] leading-relaxed">المساهمة في تطوير قطاع الأعمال في المملكة عبر خدمات استشارية نوعية تمكّن المنظمات من تحقيق أهدافها وتعزيز استدامة نموها، من خلال حلول عملية ترتكز على الفهم العميق والتخطيط الاستراتيجي والتنفيذ الفعّال.</p>
          </motion.div>
        </div>
      </section>

      {/* ══ قيمنا ═══════════════════════════════════════════ */}
      <section className="py-14 lg:py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div {...fadeUp(0)} className="grid lg:grid-cols-[180px_1fr] gap-6 lg:gap-16 lg:items-start">
            <h3 className="text-brand-blue text-2xl font-black flex-shrink-0">قيمنا</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {VALUES.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-2xl p-7 flex flex-col gap-5 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12"><img src={v.icon} alt={v.title} className="w-full h-full object-contain" /></div>
                  <h3 className="text-gray-900 font-bold text-[17px] leading-snug">{v.title}</h3>
                  <p className="text-gray-500 text-[15px] font-light leading-relaxed">"{v.desc}"</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ تميّزنا ══════════════════════════════════════════ */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
            <div className="lg:sticky lg:top-28">
              <motion.span {...fadeUp(0)} className="section-label block mb-4 text-base">تميّزنا</motion.span>
              <motion.h2 {...fadeUp(0.08)} className="text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 leading-tight">
                لماذا<br /><span className="text-brand-blue">أوشن إكس؟</span>
              </motion.h2>
            </div>
            <div className="space-y-0 divide-y divide-gray-100">
              {WHY_POINTS.map((pt, i) => (
                <motion.div key={pt.title} {...fadeUp(i * 0.08)} className="py-7 flex gap-5 items-start group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mt-0.5 group-hover:bg-brand-blue group-hover:text-white transition-all duration-300">
                    {pt.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-[17px] mb-1.5 group-hover:text-brand-blue transition-colors duration-200">{pt.title}</h3>
                    <p className="text-gray-500 font-light text-[18px] leading-relaxed">{pt.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ بيئة عملنا ══════════════════════════════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div {...fadeUp(0)} className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
            <img src="/gptw-badge.png" alt="Great Place To Work Certified" className="w-56 flex-shrink-0" />
            <div>
              <motion.span {...fadeUp(0.06)} className="section-label block mb-3 text-base">بيئة عملنا</motion.span>
              <motion.h2 {...fadeUp(0.1)} className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">
                حاصلون على جائزة <span className="text-brand-blue">أفضل بيئة عمل</span>
              </motion.h2>
              <motion.p {...fadeUp(0.14)} className="text-gray-500 font-light text-[18px] leading-relaxed max-w-xl">
                حاصل على جائزة أفضل بيئة عمل 2023-2024 من Great Place To Work® تقديراً لثقافتنا المؤسسية التي تضع الإنسان في قلب العمل.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ مجلس الإدارة + المؤسسون ════════════════════════ */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <SectionDivider label="مجلس الإدارة" />
            <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
              {BOARD.map((m, i) => <BoardCard key={m.nameEn} m={m} i={i} />)}
            </div>
          </div>
          <div>
            <SectionDivider label="المؤسسون" />
            <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {FOUNDERS.map((m, i) => <TeamCard key={m.nameEn} m={m} i={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ══ الكفاءات ═════════════════════════════════════════ */}
      <section className="py-14 lg:py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <SectionDivider label="الكفاءات" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map((m, i) => <TeamCard key={m.nameEn} m={m} i={i} />)}
          </div>
        </div>
      </section>

      {/* ══ دورنا في رؤية 2030 ══════════════════════════════ */}
      <section className="py-14 lg:py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-[180px_1fr] gap-6 lg:gap-16 items-center">
            <h3 className="text-brand-blue text-2xl font-black flex-shrink-0">دورنا في رؤية 2030</h3>
            <motion.p {...fadeUp(0.08)} className="text-gray-600 font-light text-[18px] leading-relaxed">
              أولت المملكة العربية السعودية اهتمامًا بالشركات المحلية في مختلف المجالات، وحرصت على تطويرها لتصبح شركات رائدة إقليميًا وعالميًا؛ من خلال تعزيز دورهم في تحقيق مستهدفات برامج رؤية المملكة 2030. ومن هذا المنطلق؛ نسعى بدورنا كأحد الشركات الاستشارية المحلية الرائدة في المملكة إلى تقديم حلول نوعية تساهم بشكل رئيسي في تنمية الاقتصاد المحلي، وتعزيز التنمية المجتمعية، ودعم قطاع الأعمال والمنشآت المحلية الصغيرة والمتوسطة.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ══ NEWSLETTER ══════════════════════════════════════ */}
      <NewsletterBanner />
    </>
  )
}
