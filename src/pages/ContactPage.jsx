import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import NewsletterBanner from '../components/NewsletterBanner'

const SERVICES = ['الابتكار', 'الاستشارات الإدارية', 'أبحاث السوق']
const SOURCES = ['وسائل التواصل الاجتماعي', 'النشرة البريدية', 'صديق أو زميل', 'أخرى']

export default function ContactPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', service: '', source: '', message: '' })
  const [sent, setSent] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const handleSubmit = (e) => { e.preventDefault(); setSent(true) }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/10 transition-all duration-200'

  return (
    <>
      {/* Page hero */}
      <div className="page-hero">
        <div className="absolute inset-0 light-grid opacity-30 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-sm text-white/30 mb-6"
          >
            <Link to="/" className="hover:text-white/60 no-underline transition-colors">الرئيسية</Link>
            <span>/</span>
            <span className="text-white/60">تواصل معنا</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl lg:text-6xl font-bold text-white"
          >
            تواصل معنا
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/40 text-[15px] font-light mt-4 max-w-md"
          >
            يسعدنا سماع طلبك — سنتواصل معك في أقرب وقت ممكن.
          </motion.p>
        </div>
      </div>

      {/* Form + info */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-[1fr_360px] gap-14">

            {/* Form */}
            {sent ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-6">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 14l6 6L23 8" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">شكرًا لتواصلك!</h3>
                <p className="text-gray-500 font-light">سيتواصل معك فريقنا في أقرب وقت ممكن.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الأول *</label>
                    <input required className={inputCls} placeholder="محمد" value={form.firstName} onChange={set('firstName')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الأخير *</label>
                    <input required className={inputCls} placeholder="العمري" value={form.lastName} onChange={set('lastName')} />
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نحن هنا للمساعدة — ما الذي تحتاجه؟ *</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, service: s }))}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
                          form.service === s
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-blue/40'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">كيف سمعت عن أوشن إكس؟</label>
                  <div className="flex flex-wrap gap-2">
                    {SOURCES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, source: s }))}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
                          form.source === s
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-blue/40'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">رسالتك *</label>
                  <textarea
                    required
                    rows={5}
                    className={inputCls}
                    placeholder="أخبرنا عن مشروعك أو استفسارك..."
                    value={form.message}
                    onChange={set('message')}
                  />
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="btn-primary px-8 py-3.5">
                    إرسال الرسالة
                  </button>
                </div>
              </form>
            )}

            {/* Contact info */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-7">
                <h3 className="font-bold text-gray-900 mb-5 text-[15px]">معلومات التواصل</h3>
                {[
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="4" width="16" height="11" rx="2" />
                        <path d="M1 7l8 5 8-5" strokeLinecap="round" />
                      </svg>
                    ),
                    label: 'البريد الإلكتروني',
                    value: 'info@oceanx.sa',
                    href: 'mailto:info@oceanx.sa',
                  },
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M15.5 12.5l-3-1.5-1.5 1.5C9 11.5 6.5 9 5.5 7l1.5-1.5-1.5-3-3 .5C2 7.5 4 13.5 10.5 16l.5-3.5z" strokeLinejoin="round" />
                      </svg>
                    ),
                    label: 'الهاتف',
                    value: '0512488182',
                    href: 'tel:0512488182',
                  },
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 2C6.2 2 4 4.2 4 7c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z" />
                        <circle cx="9" cy="7" r="2" />
                      </svg>
                    ),
                    label: 'ساعات العمل',
                    value: 'الأحد – الخميس: 9ص – 5م',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 mb-4 last:mb-0">
                    <div className="w-9 h-9 rounded-lg bg-brand-blue/8 text-brand-blue flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-gray-800 text-sm font-medium no-underline hover:text-brand-blue transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-gray-800 text-sm font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* FAQ CTA */}
              <div className="rounded-2xl bg-brand-dark p-7 text-center">
                <h4 className="text-white font-bold mb-2 text-[15px]">الأسئلة الشائعة</h4>
                <p className="text-white/40 text-sm font-light mb-4">
                  قد تجد إجابتك في قائمة الأسئلة الشائعة لدينا.
                </p>
                <button className="btn-outline text-sm w-full">
                  استعرض الأسئلة
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map area */}
      <section className="bg-white pb-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-0">
          <div className="rounded-2xl overflow-hidden border border-gray-100 h-72 bg-gray-100 relative">
            <iframe
              title="OceanX Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3624.3766305097893!2d46.6752669!3d24.7135517!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f03890d489399%3A0xba974d1c98e79fd5!2sRiyadh%20Saudi%20Arabia!5e0!3m2!1sen!2s!4v1680000000000!5m2!1sen!2s"
              className="w-full h-full border-0 grayscale"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="absolute bottom-5 right-5 bg-white rounded-xl shadow-md px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8">
                  <path d="M7 1C4.8 1 3 2.8 3 5c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" />
                  <circle cx="7" cy="5" r="1.5" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 text-xs font-bold">أوشن إكس</p>
                <p className="text-gray-400 text-[11px]">الرياض، المملكة العربية السعودية</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Self-Support FAQs dark banner */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div
            className="rounded-2xl p-10 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-8"
            style={{ background: 'linear-gradient(140deg, #06081e 0%, #0b0e2e 60%, #08061a 100%)' }}
          >
            <div>
              <span className="text-white/30 text-xs font-mono uppercase tracking-widest block mb-3">Self-Support</span>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">الأسئلة الشائعة</h3>
              <p className="text-white/40 font-light leading-relaxed max-w-lg">
                اطلع على دليل الأسئلة الشائعة للحصول على إجابات فورية دون الحاجة للتواصل المباشر.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button className="btn-outline inline-flex items-center gap-2 whitespace-nowrap">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2.5 2h10a1 1 0 011 1v8a1 1 0 01-1 1H9l-1.5 2L6 12H2.5a1 1 0 01-1-1V3a1 1 0 011-1z" />
                </svg>
                استعرض الأسئلة
              </button>
              <button className="btn-primary inline-flex items-center gap-2 whitespace-nowrap">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2.5 1.5h10v12l-5-3-5 3V1.5z" />
                </svg>
                تحميل PDF
              </button>
            </div>
          </div>
        </div>
      </section>

      <NewsletterBanner />
    </>
  )
}
