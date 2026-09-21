import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  Filter,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { FocusSession, Subject } from '../../types.js';

interface SubjectWeeklyTrendChartProps {
  sessions: FocusSession[];
  subjects: Subject[];
}

export const SubjectWeeklyTrendChart: React.FC<SubjectWeeklyTrendChartProps> = ({
  sessions = [],
  subjects = [],
}) => {
  // Filter states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [weeksCount, setWeeksCount] = useState<number>(4); // 4 or 6 weeks
  const [hoveredPoint, setHoveredPoint] = useState<{
    weekLabel: string;
    subjectName: string;
    color: string;
    hours: number;
    sessionsCount: number;
    x: number;
    y: number;
  } | null>(null);

  // Fallback palette for subjects that may lack explicit colors
  const fallbackColors = [
    '#2563EB', // Blue
    '#10B981', // Emerald
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#6366F1', // Indigo
  ];

  // Helper to map subject details
  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string; coefficient?: number }>();
    subjects.forEach((s, idx) => {
      map.set(s.id, {
        name: s.name,
        color: s.color || fallbackColors[idx % fallbackColors.length],
        coefficient: s.coefficient,
      });
    });
    return map;
  }, [subjects]);

  // Compute weekly chronological buckets ending at the current week
  const weekBuckets = useMemo(() => {
    const buckets: {
      id: string;
      label: string;
      startDate: Date;
      endDate: Date;
      startStr: string;
      endStr: string;
    }[] = [];

    const now = new Date();
    // Normalize current day to end of day
    const currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    for (let i = weeksCount - 1; i >= 0; i--) {
      const end = new Date(currentEnd.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);

      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      let label = '';
      if (i === 0) {
        label = 'هذا الأسبوع';
      } else if (i === 1) {
        label = 'الأسبوع الماضي';
      } else {
        const startDay = start.getDate();
        const startMonth = start.toLocaleDateString('ar-DZ', { month: 'numeric' });
        label = `قبل ${i} أسابيع`;
      }

      buckets.push({
        id: `week_${i}`,
        label,
        startDate: start,
        endDate: end,
        startStr,
        endStr,
      });
    }

    return buckets;
  }, [weeksCount]);

  // Build weekly aggregated hours per subject from sessions
  const chartData = useMemo(() => {
    // Determine active subjects to plot
    let activeSubjects: { id: string; name: string; color: string }[] = [];

    if (subjects.length > 0) {
      activeSubjects = subjects.map((s, idx) => ({
        id: s.id,
        name: s.name,
        color: s.color || fallbackColors[idx % fallbackColors.length],
      }));
    } else {
      // Deduce from session records if subjects list is not yet loaded
      const uniqueSubNames = Array.from(new Set(sessions.map((s) => s.subjectName || 'عام')));
      activeSubjects = uniqueSubNames.map((name, idx) => ({
        id: `sub_${idx}`,
        name,
        color: fallbackColors[idx % fallbackColors.length],
      }));
    }

    // Filter by selected subject if single-subject view is chosen
    if (selectedSubjectId !== 'all') {
      activeSubjects = activeSubjects.filter((s) => s.id === selectedSubjectId);
    }

    // Process each week bucket
    const weeklyData = weekBuckets.map((bucket) => {
      // Find all sessions falling inside this bucket
      const bucketSessions = sessions.filter((s) => {
        const sDate = s.date || (s.completedAt ? s.completedAt.split('T')[0] : '');
        return sDate >= bucket.startStr && sDate <= bucket.endStr;
      });

      const subjectHours: Record<string, number> = {};
      const subjectSessionsCount: Record<string, number> = {};

      activeSubjects.forEach((sub) => {
        const matching = bucketSessions.filter(
          (s) => s.subjectId === sub.id || (!s.subjectId && s.subjectName === sub.name)
        );
        const mins = matching.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
        subjectHours[sub.id] = Math.round((mins / 60) * 10) / 10;
        subjectSessionsCount[sub.id] = matching.length;
      });

      return {
        ...bucket,
        subjectHours,
        subjectSessionsCount,
      };
    });

    return {
      activeSubjects,
      weeklyData,
    };
  }, [weekBuckets, sessions, subjects, selectedSubjectId]);

  // Determine max value for chart Y axis scaling
  const maxHours = useMemo(() => {
    let max = 0;
    chartData.weeklyData.forEach((w) => {
      chartData.activeSubjects.forEach((sub) => {
        const val = w.subjectHours[sub.id] || 0;
        if (val > max) max = val;
      });
    });
    // Ensure minimum scale ceiling of 4 hours
    return Math.max(4, Math.ceil(max * 1.25));
  }, [chartData]);

  // Dimensions & SVG Coordinate mapping
  const chartWidth = 720;
  const chartHeight = 240;
  const padding = { top: 25, right: 35, bottom: 40, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (chartData.weeklyData.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (chartData.weeklyData.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxHours));
    return padding.top + innerHeight - ratio * innerHeight;
  };

  // Generate SVG path for a given subject
  const getSubjectPath = (subId: string) => {
    const points = chartData.weeklyData.map((d, idx) => ({
      x: getX(idx),
      y: getY(d.subjectHours[subId] || 0),
    }));

    if (points.length === 0) return '';
    return points.reduce(
      (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
      ''
    );
  };

  // Generate smooth area path below line
  const getSubjectAreaPath = (subId: string) => {
    const points = chartData.weeklyData.map((d, idx) => ({
      x: getX(idx),
      y: getY(d.subjectHours[subId] || 0),
    }));

    if (points.length === 0) return '';
    const baseLine = padding.top + innerHeight;
    const linePart = points.reduce(
      (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
      ''
    );
    return `${linePart} L ${points[points.length - 1].x},${baseLine} L ${points[0].x},${baseLine} Z`;
  };

  // Total hours studied across current filtered scope
  const totalScopeHours = useMemo(() => {
    let sum = 0;
    chartData.weeklyData.forEach((w) => {
      chartData.activeSubjects.forEach((sub) => {
        sum += w.subjectHours[sub.id] || 0;
      });
    });
    return Math.round(sum * 10) / 10;
  }, [chartData]);

  return (
    <div className="bg-[#0B152B] rounded-3xl border border-[#1C2F58] p-5 sm:p-6 shadow-md relative overflow-hidden transition-all hover:border-blue-500/40">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-5 border-b border-[#1E3666]/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white font-['Cairo'] flex items-center gap-2">
              <span>تطور ساعات المراجعة لكل مادة أسبوعياً (Line Chart)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                تحليل دقيق
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              مخطط بياني خطي تحليلي مستخرج مباشرة من أرشيف جلسات التركيز الموثقة
            </p>
          </div>
        </div>

        {/* Controls: Weeks count & Subject filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Weeks toggle */}
          <div className="flex items-center bg-[#081126] p-1 rounded-2xl border border-[#16274E]">
            <button
              onClick={() => setWeeksCount(4)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                weeksCount === 4
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              آخر 4 أسابيع
            </button>
            <button
              onClick={() => setWeeksCount(6)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                weeksCount === 6
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              آخر 6 أسابيع
            </button>
          </div>

          {/* Subject Filter Dropdown */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-[#081126] border border-[#16274E] text-slate-200 text-xs font-bold rounded-2xl pr-8 pl-3 py-2 outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="all">جميع المواد (مقارنة شاملة)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} (معامل {sub.coefficient || 1})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SVG Interactive Line Chart Container */}
      <div className="relative bg-[#070F22] rounded-2xl border border-[#142347] p-3 sm:p-4 overflow-hidden">
        {/* Y-axis gridlines & labels */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-56 sm:h-64 select-none drop-shadow-sm"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Gradients for each active subject */}
              {chartData.activeSubjects.map((sub) => (
                <linearGradient
                  key={`grad_${sub.id}`}
                  id={`areaGrad_${sub.id}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={sub.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={sub.color} stopOpacity="0.0" />
                </linearGradient>
              ))}
            </defs>

            {/* Horizontal Gridlines and Y Labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
              const val = Math.round(maxHours * step * 10) / 10;
              const y = getY(val);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#16274E"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    fill="#64748B"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {val}س
                  </text>
                </g>
              );
            })}

            {/* Vertical guidelines for each week */}
            {chartData.weeklyData.map((w, idx) => {
              const x = getX(idx);
              return (
                <line
                  key={w.id}
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={chartHeight - padding.bottom}
                  stroke="#101D38"
                  strokeWidth="1"
                />
              );
            })}

            {/* Subject Area Fills (when single subject or smooth overlay) */}
            {selectedSubjectId !== 'all' &&
              chartData.activeSubjects.map((sub) => (
                <path
                  key={`area_${sub.id}`}
                  d={getSubjectAreaPath(sub.id)}
                  fill={`url(#areaGrad_${sub.id})`}
                />
              ))}

            {/* Subject Lines */}
            {chartData.activeSubjects.map((sub) => {
              const pathD = getSubjectPath(sub.id);
              return (
                <motion.path
                  key={`line_${sub.id}`}
                  d={pathD}
                  fill="none"
                  stroke={sub.color}
                  strokeWidth={selectedSubjectId === sub.id ? 3.5 : 2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              );
            })}

            {/* Data Points on the line */}
            {chartData.weeklyData.map((w, weekIdx) => {
              const x = getX(weekIdx);
              return (
                <g key={`points_${w.id}`}>
                  {chartData.activeSubjects.map((sub) => {
                    const hours = w.subjectHours[sub.id] || 0;
                    const y = getY(hours);
                    const isHovered =
                      hoveredPoint?.weekLabel === w.label && hoveredPoint?.subjectName === sub.name;

                    return (
                      <g key={`pt_${w.id}_${sub.id}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 6 : 4}
                          fill="#070F22"
                          stroke={sub.color}
                          strokeWidth={isHovered ? 3 : 2}
                          className="cursor-pointer transition-all hover:r-6"
                          onMouseEnter={() =>
                            setHoveredPoint({
                              weekLabel: w.label,
                              subjectName: sub.name,
                              color: sub.color,
                              hours,
                              sessionsCount: w.subjectSessionsCount[sub.id] || 0,
                              x,
                              y,
                            })
                          }
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* X-axis Labels (Weeks) */}
            {chartData.weeklyData.map((w, idx) => {
              const x = getX(idx);
              const isCurrentWeek = idx === chartData.weeklyData.length - 1;
              return (
                <text
                  key={`lbl_${w.id}`}
                  x={x}
                  y={chartHeight - padding.bottom + 20}
                  fill={isCurrentWeek ? '#38BDF8' : '#94A3B8'}
                  fontSize="11"
                  textAnchor="middle"
                  fontWeight={isCurrentWeek ? 'bold' : 'normal'}
                  fontFamily="Cairo, sans-serif"
                >
                  {w.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Floating Tooltip card when hovering data point */}
        <AnimatePresence>
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-20 top-4 left-4 p-3 rounded-2xl bg-[#0F1D3D] border border-[#233C6F] shadow-xl text-right pointer-events-none min-w-[170px]"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: hoveredPoint.color }}
                />
                <span className="text-xs font-black text-white font-['Cairo']">
                  {hoveredPoint.subjectName}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">
                {hoveredPoint.weekLabel}
              </span>
              <div className="flex items-baseline gap-1 mt-1.5 font-mono">
                <span className="text-lg font-black text-white">{hoveredPoint.hours}</span>
                <span className="text-xs text-blue-400 font-bold">ساعات مراجعة</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                محققة عبر {hoveredPoint.sessionsCount} جلسة تركيز
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Legend and Summary Pills */}
      <div className="mt-4 pt-3 border-t border-[#1E3666]/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Subject badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedSubjectId === 'all'
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                : 'bg-[#0E1A33] text-slate-400 border-[#1B2F57] hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>الكل ({subjects.length})</span>
          </button>

          {subjects.map((sub, idx) => {
            const isSelected = selectedSubjectId === sub.id;
            const color = sub.color || fallbackColors[idx % fallbackColors.length];
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#15274D] text-white border-blue-400/80 shadow-xs'
                    : 'bg-[#0E1A33] text-slate-300 border-[#1B2F57] hover:border-slate-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span>{sub.name}</span>
                {sub.coefficient && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 font-mono text-slate-400">
                    ×{sub.coefficient}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Total Summary Info Pill */}
        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <span className="text-slate-400 text-[11px]">مجموع الساعات في المخطط:</span>
          <span className="px-2.5 py-1 rounded-xl bg-blue-900/30 border border-blue-500/30 text-blue-300 font-bold">
            {totalScopeHours} ساعة ⏱️
          </span>
        </div>
      </div>
    </div>
  );
};
