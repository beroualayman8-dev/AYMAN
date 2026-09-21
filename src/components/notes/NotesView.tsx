import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Pin,
  Search,
  Trash2,
  Edit2,
  X,
  BookOpen,
  Calendar,
  Save,
  Tag,
  PenTool,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../../services/api.js';
import type { Note, Subject } from '../../types.js';
import { HandwritingPad } from './HandwritingPad.js';
import { FUN_STICKERS } from '../../data/motivationalQuotes.js';
import { AestheticStickersBar } from '../common/AestheticStickersBar.js';
import { ProductivityQuoteBanner } from '../common/ProductivityQuoteBanner.js';

interface NotesViewProps {
  initialSubjectId?: string;
}

export const NotesView: React.FC<NotesViewProps> = ({ initialSubjectId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || 'all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubId, setNoteSubId] = useState('');
  const [notePinned, setNotePinned] = useState(false);
  const [noteTags, setNoteTags] = useState('');
  const [handwrittenData, setHandwrittenData] = useState<string | undefined>(undefined);
  const [activeInputMode, setActiveInputMode] = useState<'text' | 'handwriting'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesRes, subsRes] = await Promise.all([api.getNotes(), api.getSubjects()]);
      setNotes(notesRes);
      setSubjects(subsRes);
      if (subsRes.length > 0 && !noteSubId) {
        setNoteSubId(subsRes[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNotePinned(false);
    setNoteTags('');
    setHandwrittenData(undefined);
    setActiveInputMode('text');
    if (selectedSubjectId !== 'all') {
      setNoteSubId(selectedSubjectId);
    } else if (subjects.length > 0) {
      setNoteSubId(subjects[0].id);
    }
    setShowModal(true);
  };

  const handleOpenEdit = (n: Note) => {
    setEditingNoteId(n.id);
    setNoteTitle(n.title);
    setNoteContent(n.content);
    setNoteSubId(n.subjectId || '');
    setNotePinned(n.pinned ?? false);
    setNoteTags((n.tags || []).join(', '));
    setHandwrittenData(n.handwrittenData);
    setActiveInputMode(n.handwrittenData ? 'handwriting' : 'text');
    setShowModal(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || (!noteContent.trim() && !handwrittenData) || !noteSubId) return;

    const tagsArray = noteTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setIsSubmitting(true);
      if (editingNoteId) {
        const updated = await api.updateNote(editingNoteId, {
          title: noteTitle.trim(),
          content: noteContent.trim() || 'ملاحظة يدوية ومخطط بياني ✍️',
          subjectId: noteSubId,
          pinned: notePinned,
          tags: tagsArray,
          handwrittenData,
        });
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      } else {
        const created = await api.createNote({
          title: noteTitle.trim(),
          content: noteContent.trim() || 'ملاحظة يدوية ومخطط بياني ✍️',
          subjectId: noteSubId,
          pinned: notePinned,
          tags: tagsArray,
          handwrittenData,
        });
        setNotes((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'تعذر حفظ الملاحظة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const updated = await api.updateNote(note.id, { pinned: !note.pinned });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return;
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered & sorted notes (pinned first)
  const filteredNotes = notes
    .filter((n) => {
      const matchSub = selectedSubjectId === 'all' || n.subjectId === selectedSubjectId;
      const matchSearch =
        !searchTerm.trim() ||
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.tags || []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSub && matchSearch;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-right">
      {/* Productivity Quote Banner */}
      <ProductivityQuoteBanner defaultCategory="focus" />

      {/* Aesthetic Stickers Bar */}
      <AestheticStickersBar title="ملصقات التدوين والتركيز 🏷️" showDesc={false} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B152B] p-6 rounded-3xl border border-[#1C2F58] shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white font-['Cairo'] flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-900/50 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <span>الملاحظات والملخصات المنهجية (كتابة ورسم يدوي دائم) 📝🎨</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            دوّن القوانين الرياضية، الملاحظات المنهجية، أفكار التمارين المعقدة، والملخصات المركزة نصياً أو بخط يدك مع حفظها الدائم.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-950/50 transition-colors flex items-center justify-center gap-2 self-start sm:self-auto border border-purple-400/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ملاحظة جديدة ✍️</span>
        </button>
      </div>

      {/* Search and Subject Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="بحث في العناوين، المحتوى، أو الوسوم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">جميع المواد</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">جاري تحميل الملاحظات...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 mx-auto flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            لا توجد ملاحظات مطابقة
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            سجّل أول ملخص أو فكرة منهجية لتبقى في متناول يدك دائماً.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
          >
            إضافة ملاحظة الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                note.pinned
                  ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white"
                    style={{ backgroundColor: note.subjectColor || '#9333EA' }}
                  >
                    {note.subjectName}
                  </span>

                  <button
                    onClick={() => handleTogglePin(note)}
                    className={`p-1 rounded-lg transition-colors ${
                      note.pinned
                        ? 'text-purple-600 dark:text-purple-400 fill-purple-600'
                        : 'text-slate-400 hover:text-purple-600'
                    }`}
                    title={note.pinned ? 'إلغاء التثبيت' : 'تثبيت في الأعلى'}
                  >
                    <Pin className={`w-4 h-4 ${note.pinned ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {note.title}
                </h3>

                {/* Handwritten Canvas Preview if present */}
                {note.handwrittenData && (
                  <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1">
                    <div className="flex items-center justify-between px-1.5 py-0.5 text-[10px] text-blue-400 font-bold mb-1">
                      <span className="flex items-center gap-1">
                        <PenTool className="w-3 h-3" />
                        <span>ملاحظة يدوية مثبتة ✍️</span>
                      </span>
                      <span className="text-emerald-400">محفوظة دائماً</span>
                    </div>
                    <img
                      src={note.handwrittenData}
                      alt="ملاحظة يدوية"
                      className="w-full h-32 object-contain rounded-lg bg-slate-900"
                    />
                  </div>
                )}

                {note.content && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-4 leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>
                )}

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {note.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>{new Date(note.updatedAt).toLocaleDateString('ar-DZ')}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(note)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Note Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <form
            onSubmit={handleSaveNote}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-right space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-['Cairo']">
                {editingNoteId ? 'تعديل الملاحظة' : 'تدوين ملاحظة جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                عنوان الملاحظة
              </label>
              <input
                type="text"
                required
                placeholder="مثال: منهجية الإجابة في العلوم الطبيعية، قواعد النهايات..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  المادة المرتبطة
                </label>
                <select
                  required
                  value={noteSubId}
                  onChange={(e) => setNoteSubId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  الوسوم (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  placeholder="منهجية, حفظ, قوانين"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Mode selection: Text vs Handwriting */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveInputMode('text')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeInputMode === 'text'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>تدوين نصي</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveInputMode('handwriting')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeInputMode === 'handwriting'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>كتابة ورسم يدوي ✍️</span>
              </button>
            </div>

            {/* Handwriting Pad */}
            {activeInputMode === 'handwriting' && (
              <div className="space-y-2">
                <HandwritingPad
                  initialDataUrl={handwrittenData}
                  onSave={(dataUrl) => setHandwrittenData(dataUrl)}
                  height={220}
                />
              </div>
            )}

            {/* Text Note area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نص الملاحظة / الملخص {activeInputMode === 'handwriting' && '(اختياري بجانب الرسم)'}
              </label>
              <textarea
                rows={activeInputMode === 'handwriting' ? 3 : 5}
                placeholder="اكتب النقاط الأساسية، المعادلات، أو الملاحظات التي تنساها دائماً..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pinCheck"
                checked={notePinned}
                onChange={(e) => setNotePinned(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="pinCheck" className="text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                تثبيت هذه الملاحظة في الأعلى ⭐
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-950/40 transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري التأكيد والحفظ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد حفظ الملاحظة دائماً ✍️</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
