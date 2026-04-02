import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PRACTICES } from '../data/practices'

function AccordionItem({ practice, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-right group"
      >
        <div className="flex items-center gap-5">
          <span className="text-gray-200 text-sm font-medium select-none w-6">
            {String(PRACTICES.indexOf(practice) + 1).padStart(2, '0')}
          </span>
          <h3 className={`text-xl font-bold transition-colors duration-200 ${
            isOpen ? 'text-brand-blue' : 'text-gray-900 group-hover:text-brand-blue'
          }`}>
            {practice.title}
          </h3>
        </div>
        <div className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          isOpen
            ? 'border-brand-blue bg-brand-blue text-white rotate-45'
            : 'border-gray-200 text-gray-400 group-hover:border-brand-blue group-hover:text-brand-blue'
        }`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 2v10M2 7h10" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-8 pr-11">
              <p className="text-gray-500 font-light leading-[1.85] text-[19px]">
                  {practice.subtitle}
                </p>
              <Link
                to={`/services#practice-${practice.slug}`}
                className="inline-flex items-center gap-2 text-brand-blue text-sm font-semibold mt-6 no-underline hover:gap-3 transition-all duration-200 group"
              >
                اكتشف المزيد
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 7H3M7 3l-4 4 4 4" />
                </svg>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PracticesAccordion() {
  const [openId, setOpenId] = useState('innovation')

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="flex items-end justify-between mb-12 pb-6 border-b border-gray-100">
          <div>
            <span className="section-label block mb-3">ممارساتنا</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              خدماتنا <span className="text-brand-blue">الأساسية</span>
            </h2>
          </div>
          <Link
            to="/about"
            className="hidden sm:inline-flex items-center gap-2 text-sm text-gray-400 hover:text-brand-blue no-underline transition-colors font-medium"
          >
            عن أوشن إكس
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M11 7H3M7 3l-4 4 4 4" />
            </svg>
          </Link>
        </div>

        {/* Accordion */}
        <div>
          {PRACTICES.map((p) => (
            <AccordionItem
              key={p.id}
              practice={p}
              isOpen={openId === p.id}
              onToggle={() => setOpenId(openId === p.id ? null : p.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
