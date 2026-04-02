import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import NewsletterBanner from '../components/NewsletterBanner'

const JOB_PATHS = [
  { id: 'cv', title: 'أرسل سيرتك الذاتية', desc: 'أضف سيرتك لقاعدة بياناتنا وستتواصل معك عند توفر الفرصة المناسبة.', variant: 'solid' },
  { id: 'coop', title: 'التدريب التعاوني', desc: 'فرص التدريب التعاوني لطلاب الجامعات في مجالاتنا المتنوعة.', variant: 'solid' },
  { id: 'leadership', title: 'برنامج القيادة', desc: 'برنامج تطوير القيادات الواعدة لبناء المسار المهني المتميز.', variant: 'outline' },
  { id: 'open', title: 'الفرص المتاحة', desc: 'استعرض جميع الوظائف المتاحة حاليًا في أوشن إكس.', variant: 'outline' },
]

const VALUES = [
  { title: 'الثقافة المؤسسية', desc: 'بيئة عمل تحتفي بالتنوع وتشجّع على الابتكار والتعاون.' },
  { title: 'بيئة العمل', desc: 'ساعات مرنة ومكتب محفّز وفريق يُلهمك كل يوم.' },
  { title: 'النمو الوظيفي', desc: 'خطط واضحة للتطوير المهني وفرص التعلم المستمر.' },
]

export default function JobsPage() {
  const [activeForm, setActiveForm] = useState(null)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ nameAr: '', nameEn: '', gender: '', dob: '', email: '', phone: '', specialization: '', experience: '', cv: '', links: '' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const handleSubmit = (e) => { e.preventDefault(); setSent(true) }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/10 transition-all'

  return (
    <>
      {/* Hero */}
      <div className="page-hero">
        <div className="absolute inset-0 light-grid opacity-30 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-white/30 mb-6"
          >
            <Link to="/" className="hover:text-white/60 no-underline transition-colors">الرئيسية</Link>
            <span>/</span>
            <span className="text-white/60">وظائف</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            انضم إلى محيطنا
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/40 text-[15px] font-light max-w-md"
          >
            أوشن إكس تستثمر في المواهب وتوفّر بيئة عمل محفّزة تنمّي المهارات وتبني المستقبل.
          </motion.p>
        </div>
      </div>

      {/* 4 paths */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid sm:grid-cols-2 gap-4 mb-16">
            {JOB_PATHS.map((path, i) => (
              <motion.button
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                onClick={() => setActiveForm(path.id)}
                className={`text-right p-7 rounded-xl border transition-all duration-200 group ${
                  activeForm === path.id
                    ? path.variant === 'solid'
                      ? 'bg-brand-blue border-brand-blue'
                      : 'bg-white border-brand-blue shadow-md'
                    : path.variant === 'solid'
                      ? 'bg-brand-blue/5 border-brand-blue/20 hover:bg-brand-blue hover:border-brand-blue'
                      : 'bg-white border-gray-200 hover:border-brand-blue/40 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`text-lg font-bold mb-2 ${
                      activeForm === path.id
                        ? path.variant === 'solid' ? 'text-white' : 'text-brand-blue'
                        : path.variant === 'solid' ? 'text-brand-blue group-hover:text-white' : 'text-gray-900'
                    }`}>
                      {path.title}
                    </h3>
                    <p className={`text-sm font-light leading-relaxed ${
                      activeForm === path.id
                        ? path.variant === 'solid' ? 'text-white/70' : 'text-gray-500'
                        : path.variant === 'solid' ? 'text-brand-blue/60 group-hover:text-white/70' : 'text-gray-500'
                    }`}>
                      {path.desc}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 mr-4 transition-all ${
                    activeForm === path.id
                      ? path.variant === 'solid' ? 'border-white/30 text-white' : 'border-brand-blue text-brand-blue'
                      : path.variant === 'solid' ? 'border-brand-blue/40 text-brand-blue group-hover:border-white/30 group-hover:text-white' : 'border-gray-200 text-gray-400 group-hover:border-brand-blue group-hover:text-brand-blue'
                  }`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M13 8H3M7 4L3 8l4 4" />
                    </svg>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Application form */}
          {activeForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto"
            >
              <div className="mb-8 border-b border-gray-100 pb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {JOB_PATHS.find(p => p.id === activeForm)?.title}
                </h2>
              </div>

              {sent ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 12l5 5L20 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">تم إرسال طلبك بنجاح!</h3>
                  <p className="text-gray-500 font-light">سيتواصل معك فريقنا عند مراجعة طلبك.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم (بالعربية) *</label>
                      <input required className={inputCls} placeholder="الاسم الكامل" value={form.nameAr} onChange={set('nameAr')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم (بالإنجليزية) *</label>
                      <input required className={inputCls} placeholder="Full Name" value={form.nameEn} onChange={set('nameEn')} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">الجنس *</label>
                      <div className="flex gap-3">
                        {['ذكر', 'أنثى'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, gender: g }))}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                              form.gender === g ? 'bg-brand-blue text-white border-brand-blue' : 'border-gray-200 text-gray-600 hover:border-brand-blue/40'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">تاريخ الميلاد *</label>
                      <input required type="date" className={inputCls} value={form.dob} onChange={set('dob')} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني *</label>
                      <input required type="email" className={inputCls} placeholder="example@email.com" value={form.email} onChange={set('email')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الجوال *</label>
                      <input required className={inputCls} placeholder="+966 5X XXX XXXX" value={form.phone} onChange={set('phone')} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">التخصص *</label>
                      <input required className={inputCls} placeholder="e.g. إدارة أعمال" value={form.specialization} onChange={set('specialization')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">سنوات الخبرة</label>
                      <input className={inputCls} placeholder="e.g. 3 سنوات" value={form.experience} onChange={set('experience')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">رابط السيرة الذاتية / CV *</label>
                    <input required className={inputCls} placeholder="رابط Google Drive أو غيره" value={form.cv} onChange={set('cv')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">روابط إضافية (LinkedIn، محفظة أعمال...)</label>
                    <input className={inputCls} placeholder="https://" value={form.links} onChange={set('links')} />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="btn-primary px-8 py-3.5">إرسال الطلب</button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* More than a job */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <span className="section-label block mb-3">أكثر من مجرد وظيفة</span>
            <h2 className="text-3xl font-bold text-gray-900">More than just a job</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card p-7"
              >
                <div className="w-10 h-10 rounded-full bg-brand-blue mb-5" />
                <h3 className="font-bold text-gray-900 text-[15px] mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm font-light leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Talent community banner */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl bg-gray-50 border border-gray-100 p-8 lg:p-10">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">انضم إلى مجتمع مواهب أوشن إكس</h3>
              <p className="text-gray-500 text-sm font-light">لا تجد الفرصة المناسبة الآن؟ كن جزءًا من قاعدة مواهبنا.</p>
            </div>
            <button className="btn-primary whitespace-nowrap flex items-center gap-2">
              انضم الآن
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 7H3M7 3l-4 4 4 4" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <NewsletterBanner />
    </>
  )
}
