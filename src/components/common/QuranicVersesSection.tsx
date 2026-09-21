import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { QURANIC_VERSES, QuranicVerse } from '../../data/motivationalQuotes.js';

interface QuranicVersesSectionProps {
  className?: string;
}

export const QuranicVersesSection: React.FC<QuranicVersesSectionProps> = ({
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const currentVerse: QuranicVerse =
    QURANIC_VERSES[currentIndex % QURANIC_VERSES.length] || QURANIC_VERSES[0];

  const handleNext = () => {
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % QURANIC_VERSES.length);
  };

  const handlePrev = () => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + QURANIC_VERSES.length) % QURANIC_VERSES.length);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#071320] via-[#091C2E] to-[#061523] border border-emerald-900/60 p-5 sm:p-6 shadow-md shadow-emerald-950/20 text-right ${className}`}
    >
      {/* Subtle Islamic emerald/gold ambient lighting */}
      <div className="absolute top-0 right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar of the Quranic Section */}
      <div className="relative z-10 flex items-center justify-between pb-3.5 mb-3.5 border-b border-emerald-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-700/40 to-teal-900/50 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white font-['Tajawal'] flex items-center gap-2">
              <span>قبس من القرآن الكريم</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-medium">
                سكينة وطمأنينة 🌿
              </span>
            </h3>
            <p className="text-[11px] text-emerald-200/70 font-['Cairo']">
              آيات بينات لتثبيت القلب وشحذ العزيمة والتوكل على الله في مسيرة البكالوريا
            </p>
          </div>
        </div>

        {/* Index indicator & navigation controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/40 hidden sm:inline-block">
            {currentIndex + 1} / {QURANIC_VERSES.length}
          </span>
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-xl bg-[#09221C] hover:bg-[#0E332A] text-emerald-300 hover:text-white border border-emerald-800/50 transition-all cursor-pointer shadow-xs active:scale-95"
            title="الآية السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-xl bg-[#09221C] hover:bg-[#0E332A] text-emerald-300 hover:text-white border border-emerald-800/50 transition-all cursor-pointer shadow-xs active:scale-95"
            title="الآية التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Quranic Verse Display in Classical Arabic Calligraphic Amiri Typography */}
      <div className="relative z-10 py-2 sm:py-3 px-3 sm:px-4 rounded-2xl bg-[#06121C]/80 border border-emerald-950/80">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVerse.id}
            initial={{ opacity: 0, y: direction === 'next' ? 8 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === 'next' ? -8 : 8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex-1">
              <p className="text-base sm:text-lg md:text-xl font-bold text-amber-200/95 font-['Amiri',serif] leading-loose text-center sm:text-right select-text">
                ﴿ {currentVerse.verse} ﴾
              </p>
            </div>

            {/* Surah reference & thematic reminder tag */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-r border-emerald-900/40 sm:pr-4">
              <span className="text-xs font-bold text-emerald-300 font-['Tajawal'] bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-800/40">
                {currentVerse.surah} • الآية {currentVerse.ayahNumber}
              </span>
              <span className="text-[10px] text-emerald-400/80 font-['Cairo']">
                {currentVerse.theme}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
