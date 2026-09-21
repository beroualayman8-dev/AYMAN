import React, { useState } from 'react';
import { Sparkles, RefreshCw, Quote, Flame, Target, Brain, Coffee } from 'lucide-react';
import { MOTIVATIONAL_QUOTES, MotivationalQuote } from '../../data/motivationalQuotes.js';

interface ProductivityQuoteBannerProps {
  className?: string;
  defaultCategory?: 'all' | MotivationalQuote['tag'];
}

export const ProductivityQuoteBanner: React.FC<ProductivityQuoteBannerProps> = ({
  className = '',
  defaultCategory = 'all',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [selectedTag, setSelectedTag] = useState<'all' | MotivationalQuote['tag']>(defaultCategory);

  const filteredQuotes =
    selectedTag === 'all'
      ? MOTIVATIONAL_QUOTES
      : MOTIVATIONAL_QUOTES.filter((q) => q.tag === selectedTag);

  const currentQuote =
    filteredQuotes[currentIndex % (filteredQuotes.length || 1)] || MOTIVATIONAL_QUOTES[0];

  const handleNextQuote = () => {
    setIsRotating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredQuotes.length);
      setIsRotating(false);
    }, 200);
  };

  const tagIcons: Record<string, { label: string; icon: any }> = {
    all: { label: 'الكل ✨', icon: Sparkles },
    productivity: { label: 'إنتاجية 🎯', icon: Target },
    focus: { label: 'تركيز عميق ⚡', icon: Brain },
    grit: { label: 'إصرار وعزيمة 🔥', icon: Flame },
    calm: { label: 'هدوء وتوازن 🧘‍♂️', icon: Coffee },
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B152B] via-[#0E1D3B] to-[#0A1326] border border-[#1E335E] p-5 shadow-lg shadow-blue-950/40 text-right ${className}`}
    >
      {/* Decorative subtle ambient lights */}
      <div className="absolute top-0 right-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Quote Content */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center text-xl shrink-0 shadow-md shadow-blue-950/60 border border-blue-400/30">
            <span>{currentQuote.badgeEmoji}</span>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black text-blue-400 tracking-wide uppercase font-['Cairo'] flex items-center gap-1">
                <span>{currentQuote.author}</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-[#142347] border border-[#213564] px-2 py-0.2 rounded-full">
                وقود الإنتاجية 🚀
              </span>
            </div>

            <p
              className={`text-sm sm:text-base font-bold text-slate-100 leading-relaxed font-['Cairo'] transition-opacity duration-200 ${
                isRotating ? 'opacity-20' : 'opacity-100'
              }`}
            >
              &ldquo;{currentQuote.quote}&rdquo;
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {/* Tag filters */}
          <div className="hidden lg:flex items-center gap-1 bg-[#070D1E]/80 p-1 rounded-2xl border border-[#192A50]">
            {(['all', 'productivity', 'focus', 'grit', 'calm'] as const).map((t) => {
              const active = selectedTag === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedTag(t);
                    setCurrentIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#112040]'
                  }`}
                >
                  {tagIcons[t].label}
                </button>
              );
            })}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={handleNextQuote}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#14254C] hover:bg-[#1A3166] text-blue-300 hover:text-white border border-[#253D74] text-xs font-bold transition-all shadow-sm active:scale-95"
            title="مقولة أخرى ملهمة"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            <span>مقولة أخرى</span>
          </button>
        </div>
      </div>
    </div>
  );
};
