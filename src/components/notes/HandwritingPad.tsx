import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Eraser,
  RotateCcw,
  Save,
  CheckCircle2,
  Download,
  Palette,
  Sparkles,
} from 'lucide-react';

interface HandwritingPadProps {
  initialDataUrl?: string;
  onSave: (dataUrl: string) => void;
  height?: number;
}

export const HandwritingPad: React.FC<HandwritingPadProps> = ({
  initialDataUrl,
  onSave,
  height = 240,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#60A5FA'); // Default bright blue for dark mode
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Initialize canvas with dark background
  const initCanvas = (dataUrl?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set display resolution vs internal coordinate size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Dark canvas background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, rect.width, height);

    // Draw subtle grid lines (ruled lines for handwriting)
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    const lineSpacing = 28;
    for (let y = lineSpacing; y < height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Load initial image if provided
    if (dataUrl && dataUrl.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, height);
        setHasContent(true);
      };
      img.src = dataUrl;
    }
  };

  useEffect(() => {
    initCanvas(initialDataUrl);
  }, [initialDataUrl]);

  // Handle drawing coordinates
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#0F172A' : color;
    ctx.lineWidth = isEraser ? lineWidth * 3 : lineWidth;

    setIsDrawing(true);
    setHasContent(true);
    setSavedSuccess(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  const handleClear = () => {
    initCanvas();
    setHasContent(false);
    setSavedSuccess(false);
  };

  const handleConfirmSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-3 space-y-2">
      {/* Handwriting Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <PenTool className="w-3.5 h-3.5 text-blue-400" />
            <span>لوح الكتابة والرسم اليدوي ✍️</span>
          </span>

          {/* Color palette */}
          <div className="flex items-center gap-1 mr-2">
            {[
              { c: '#60A5FA', label: 'أزرق' },
              { c: '#34D399', label: 'أخضر' },
              { c: '#FBBF24', label: 'أصفر' },
              { c: '#F87171', label: 'أحمر' },
              { c: '#E2E8F0', label: 'أبيض' },
            ].map((p) => (
              <button
                key={p.c}
                type="button"
                onClick={() => {
                  setColor(p.c);
                  setIsEraser(false);
                }}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  !isEraser && color === p.c ? 'scale-125 border-white' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: p.c }}
                title={p.label}
              />
            ))}
          </div>

          {/* Stroke size */}
          <select
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-0.5 text-[11px] font-mono"
          >
            <option value={2}>خط دقيق</option>
            <option value={3}>خط متوسط</option>
            <option value={5}>خط عريض</option>
          </select>

          {/* Eraser toggle */}
          <button
            type="button"
            onClick={() => setIsEraser(!isEraser)}
            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
              isEraser
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>ممحاة</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear canvas */}
          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-1 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>مسح اللوح</span>
          </button>

          {/* Confirm & Save Button */}
          <button
            type="button"
            onClick={handleConfirmSave}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white'
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم تأكيد الحفظ! ✅</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>تأكيد الملاحظة اليدوية ✍️</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Touch & Mouse Canvas */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 cursor-crosshair">
        <canvas
          ref={canvasRef}
          style={{ height: `${height}px` }}
          className="w-full block touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasContent && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-600 text-xs font-medium">
            <span>اكتب أو ارسم بيدك أو بالقلم هنا (معادلات رياضية، رسومات تخطيطية)...</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>💡 يتم حفظ كتابتك وتثبيتها بشكل دائم داخل الملاحظة دون أن تفقدها أبداً.</span>
        {savedSuccess && <span className="text-emerald-400 font-bold">محفوظة دائماً ✨</span>}
      </div>
    </div>
  );
};
