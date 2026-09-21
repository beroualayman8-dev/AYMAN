import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface SmallDigitalClockProps {
  className?: string;
  showSeconds?: boolean;
}

export const SmallDigitalClock: React.FC<SmallDigitalClockProps> = ({
  className = '',
  showSeconds = true,
}) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  // Arabic formatted date
  const dateFormatted = time.toLocaleDateString('ar-DZ', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#09152F] border border-[#1C3264] text-slate-100 shadow-sm ${className}`}
      title="الوقت الحالي"
    >
      <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
      </div>

      <div className="flex items-baseline gap-1 font-mono font-black text-sm text-white tracking-wider">
        <span>{hours}</span>
        <span className="text-blue-400 animate-pulse">:</span>
        <span>{minutes}</span>
        {showSeconds && (
          <>
            <span className="text-blue-400 animate-pulse text-xs">:</span>
            <span className="text-xs text-blue-300 font-normal">{seconds}</span>
          </>
        )}
      </div>

      <span className="text-[10px] text-slate-400 font-['Cairo'] border-r border-[#1C3264] pr-2 mr-0.5 hidden sm:inline-block">
        {dateFormatted}
      </span>
    </div>
  );
};
