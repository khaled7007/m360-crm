import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import AboutPage from './pages/AboutPage'
import CompetenciesPage from './pages/CompetenciesPage'
import InsightPage from './pages/InsightPage'
import InsightReaderPage from './pages/InsightReaderPage'
import PracticePage from './pages/PracticePage'
import NewsPage from './pages/NewsPage'
import JobsPage from './pages/JobsPage'
import ContactPage from './pages/ContactPage'
import ServicesPage from './pages/ServicesPage'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

const CONTACT_SERVICES = ['الابتكار', 'الاستشارات الإدارية', 'أبحاث السوق']

function FloatingContact() {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', service: '', message: '' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const handleSubmit = (e) => { e.preventDefault(); setSent(true) }
  const handleClose = () => { setOpen(false); setTimeout(() => setSent(false), 400) }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/10 transition-all duration-200'

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-end gap-3">

      {/* ── Form panel ── */}
      <div
        className={`transition-all duration-300 origin-bottom-left ${
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #06081e, #1a2055)' }}
          >
            <div>
              <p className="text-white font-bold text-[15px]">تواصل معنا</p>
              <p className="text-white/40 text-[11px] font-light">سنرد عليك في أقرب وقت</p>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            {sent ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 11l5 5L18 6" />
                  </svg>
                </div>
                <p className="text-gray-900 font-bold text-[15px] mb-1">تم إرسال رسالتك!</p>
                <p className="text-gray-400 text-sm font-light">سيتواصل معك فريقنا قريباً.</p>
                <button
                  onClick={handleClose}
                  className="mt-5 text-brand-blue text-sm font-semibold hover:underline"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">الاسم *</label>
                  <input required className={inputCls} placeholder="اسمك الكامل" value={form.name} onChange={set('name')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">رقم الجوال *</label>
                  <input required className={inputCls} placeholder="+966 5X XXX XXXX" value={form.phone} onChange={set('phone')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">الخدمة</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTACT_SERVICES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, service: s }))}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 ${
                          form.service === s
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-brand-blue/40'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">رسالتك</label>
                  <textarea
                    rows={3}
                    className={inputCls + ' resize-none'}
                    placeholder="كيف يمكننا مساعدتك؟"
                    value={form.message}
                    onChange={set('message')}
                  />
                </div>
                <button type="submit" className="btn-primary w-full text-sm py-3">
                  إرسال الرسالة
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="تواصل معنا"
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
          open ? 'rotate-45 bg-gray-800' : 'bg-brand-blue hover:bg-[#2338e0] hover:scale-110'
        }`}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <path d="M3 3l12 12M15 3L3 15" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>

    </div>
  )
}

function Layout() {
  return (
    <div className="font-arabic">
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/competencies" element={<CompetenciesPage />} />
          <Route path="/insight" element={<InsightPage />} />
          <Route path="/insight/read/:kind/:itemId" element={<InsightReaderPage />} />
          <Route path="/insight/article/:itemId" element={<InsightReaderPage forcedKind="article" />} />
          <Route path="/insight/report/:itemId" element={<InsightReaderPage forcedKind="report" />} />
          <Route path="/practices/innovation" element={<PracticePage />} />
          <Route path="/practices/organization" element={<PracticePage />} />
          <Route path="/practices/market-research" element={<PracticePage />} />
          <Route path="/practices" element={<Navigate to="/practices/innovation" replace />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/services" element={<ServicesPage />} />
        </Routes>
      </main>
      <Footer />
      <FloatingContact />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
