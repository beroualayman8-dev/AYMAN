import React, { useState } from 'react';
import { Sparkles, Check, Heart } from 'lucide-react';
import { FUN_STICKERS, AestheticSticker } from '../../data/motivationalQuotes.js';

interface AestheticStickersBarProps {
  title?: string;
  showDesc?: boolean;
  className?: string;
}

export const AestheticStickersBar: React.FC<AestheticStickersBarProps> = ({
  title = 'ملصقات الهمة والتفوق 🏷️',
  showDesc = false,
  className = '',
}) => {
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [copiedTip, setCopiedTip] = useState<string | null>(null);

  const handleClickSticker = (stk: AestheticSticker) => {
    setActiveStickerId(stk.id);
    setCopiedTip(`${stk.emoji} ${stk.label} — ${stk.desc || 'استمر في الاجتهاد!'}`);
    setTimeout(() => {
      setCopiedTip(null);
    }, 3000);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-300 flex items-center gap-1.5 font-['Cairo']">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{title}</span>
          </span>
          <span className="text-[10px] text-blue-400/80 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-900/50">
            أزرق ليلي 🌙
          </span>
        </div>

        {copiedTip && (
          <div className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-3 py-0.5 rounded-full animate-fade-in flex items-center gap-1">
            <span>✨</span>
            <span>{copiedTip}</span>
          </div>
        )}
      </div>

      {/* Stickers flow container */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 px-0.5 scrollbar-thin scrollbar-thumb-blue-900/60">
        {FUN_STICKERS.map((stk) => {
          const isActive = activeStickerId === stk.id;
          return (
            <button
              key={stk.id}
              type="button"
              onClick={() => handleClickSticker(stk)}
              title={stk.desc}
              className={`group shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all duration-300 text-xs font-bold cursor-pointer select-none ${
                isActive
                  ? 'bg-gradient-to-r from-blue-900/90 via-indigo-950 to-blue-900 text-white border-blue-400 shadow-lg shadow-blue-950/50 scale-105'
                  : 'bg-[#0A1329]/90 hover:bg-[#112042] text-slate-300 border-[#1B2D54] hover:border-blue-500/60 shadow-sm'
              }`}
            >
              <span className="text-base group-hover:scale-125 transition-transform duration-200">
                {stk.emoji}
              </span>
              <span className="font-['Cairo'] whitespace-nowrap">{stk.label}</span>
              {showDesc && stk.desc && (
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline opacity-75">
                  ({stk.desc})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
