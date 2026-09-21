import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Feather, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { MOTIVATIONAL_QUOTES, MotivationalQuote } from '../../data/motivationalQuotes.js';

interface ClassicalQuotesHorizontalBarProps {
  className?: string;
}

export const ClassicalQuotesHorizontalBar: React.FC<ClassicalQuotesHorizontalBarProps> = ({
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const currentQuote: MotivationalQuote =
    MOTIVATIONAL_QUOTES[currentIndex % MOTIVATIONAL_QUOTES.length] || MOTIVATIONAL_QUOTES[0];

  const handleNext = () => {
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  };

  const handlePrev = () => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + MOTIVATIONAL_QUOTES.length) % MOTIVATIONAL_QUOTES.length);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#070F22] via-[#0C1733] to-[#081226] border border-[#1E3466]/80 p-4 sm:p-5 shadow-lg shadow-blue-950/40 text-right ${className}`}
    >
      {/* Subtle classical ornamental borders & ambient lights */}
      <div className="absolute top-0 right-10 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-36 h-36 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Horizontal Layout: Classical-Modern Typographic Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left/Right Horizontal Content Box */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {/* Classical Calligraphic Icon Frame */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#12244E] to-[#0A142D] border border-blue-400/30 flex items-center justify-center shrink-0 shadow-inner text-amber-300">
            <Feather className="w-5 h-5 text-amber-300 drop-shadow-sm" />
          </div>

          {/* Horizontal Text Flow: Title badge + Classical Amiri Quote text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-bold text-amber-300/90 font-['Tajawal'] flex items-center gap-1">
                <span>{currentQuote.author}</span>
                <span>•</span>
              </span>
              <span className="text-[10px] text-blue-300/80 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded-full font-['Tajawal']">
                حكمة تحفيزية {currentQuote.badgeEmoji}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentIndex + 1} / {MOTIVATIONAL_QUOTES.length}
              </span>
            </div>

            {/* Horizontal Classical Quote with Classical Amiri Font */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuote.id}
                initial={{ opacity: 0, x: direction === 'next' ? -15 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction === 'next' ? 15 : -15 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="flex items-baseline gap-2"
              >
                <Quote className="w-4 h-4 text-amber-400/40 shrink-0 rotate-180 inline-block translate-y-0.5" />
                <p className="text-sm sm:text-base md:text-[17px] font-semibold text-slate-100 font-['Amiri',serif] leading-relaxed tracking-wide">
                  &ldquo;{currentQuote.quote}&rdquo;
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Navigation & Controls in Single Horizontal Line */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 border-t md:border-t-0 md:border-r border-[#1B2F5C]/60 pt-2.5 md:pt-0 md:pr-4">
          <button
            type="button"
            onClick={handlePrev}
            className="p-2 rounded-xl bg-[#0F1D3D] hover:bg-[#162B59] text-slate-300 hover:text-white border border-[#21386B] transition-all cursor-pointer shadow-xs active:scale-95"
            title="المقولة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-700/80 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white border border-blue-400/40 text-xs font-bold font-['Tajawal'] transition-all cursor-pointer shadow-xs active:scale-95"
            title="المقولة التالية"
          >
            <span>التالية</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
