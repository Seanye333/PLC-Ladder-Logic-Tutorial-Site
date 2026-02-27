import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, BookOpen, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import type { TutorialLesson, TutorialProgress } from '../engine/types';
import { TUTORIALS } from '../data/tutorials';

interface Props {
  progress: Record<string, TutorialProgress>;
  activeLessonId: string | null;
  onLessonSelect: (lesson: TutorialLesson) => void;
  onLessonComplete: (lessonId: string) => void;
  onClose: () => void;
}

// Simple markdown renderer (no external deps)
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\| (.+) \|$/gm, (_, row) => {
      const cells = row.split(' | ').map((c: string) => `<td>${c}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .replace(/^---+$/gm, '<hr/>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hupolt])(.+)$/gm, (line) => line.trim() ? line : '')
    .replace(/<tr>/g, '<tr>')
    .replace(/(<tr>.*<\/tr>\n?)+/g, (m) => `<table>${m}</table>`);
}

const CATEGORY_LABELS: Record<string, string> = {
  fundamentals: 'Fundamentals',
  contacts_coils: 'Contacts & Coils',
  timers: 'Timers',
  counters: 'Counters',
  advanced: 'Advanced',
};

const CATEGORY_ORDER = ['fundamentals', 'contacts_coils', 'timers', 'counters', 'advanced'];

export default function TutorialPanel({ progress, activeLessonId, onLessonSelect, onLessonComplete, onClose }: Props) {
  const [view, setView] = useState<'list' | 'lesson'>('list');
  const [activeLesson, setActiveLesson] = useState<TutorialLesson | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Mark lesson complete when reaching the final step
  useEffect(() => {
    if (activeLesson && activeLesson.steps.length > 0 && stepIndex === activeLesson.steps.length - 1) {
      onLessonComplete(activeLesson.id);
    }
  }, [stepIndex, activeLesson, onLessonComplete]);

  function openLesson(lesson: TutorialLesson) {
    setActiveLesson(lesson);
    setStepIndex(0);
    setView('lesson');
    onLessonSelect(lesson);
  }

  function toggleCat(cat: string) {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  const byCategory: Record<string, TutorialLesson[]> = {};
  for (const lesson of TUTORIALS) {
    if (!byCategory[lesson.category]) byCategory[lesson.category] = [];
    byCategory[lesson.category].push(lesson);
  }

  if (view === 'lesson' && activeLesson) {
    const prog = progress[activeLesson.id];
    const currentStep = activeLesson.steps[stepIndex];
    const isLastStep = stepIndex === activeLesson.steps.length - 1;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800">
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => setView('list')}
          >
            ← Back
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-blue-400 uppercase tracking-wide">{CATEGORY_LABELS[activeLesson.category]}</div>
            <div className="text-sm font-semibold text-white truncate">{activeLesson.title}</div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeLesson.difficulty === 'beginner' ? 'bg-green-900 text-green-300' :
            activeLesson.difficulty === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
            'bg-red-900 text-red-300'
          }`}>
            {activeLesson.difficulty}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Theory */}
          <div
            className="tutorial-content mb-6"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(activeLesson.theory) }}
          />

          {/* Divider */}
          {activeLesson.steps.length > 0 && (
            <>
              <div className="border-t border-slate-700 mb-4" />
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Interactive Steps ({stepIndex + 1} / {activeLesson.steps.length})
              </div>

              {/* Step indicator */}
              <div className="flex gap-1 mb-4">
                {activeLesson.steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < stepIndex ? 'bg-green-500' :
                      i === stepIndex ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Current step */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
                <div
                  className="text-slate-200 text-sm leading-relaxed tutorial-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(currentStep.instruction) }}
                />
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <button
                    className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                    onClick={() => setStepIndex(i => i - 1)}
                  >
                    ← Previous
                  </button>
                )}
                {!isLastStep ? (
                  <button
                    className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex items-center gap-1 ml-auto"
                    onClick={() => setStepIndex(i => i + 1)}
                  >
                    Next Step <ArrowRight size={14} />
                  </button>
                ) : (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <CheckCircle2 size={14} /> Lesson complete!
                    </span>
                    {activeLesson.nextLessonId && (
                      <button
                        className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                        onClick={() => {
                          const next = TUTORIALS.find(t => t.id === activeLesson.nextLessonId);
                          if (next) openLesson(next);
                        }}
                      >
                        Next Lesson →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800">
        <BookOpen size={16} className="text-blue-400" />
        <span className="font-semibold text-white text-sm">Tutorials</span>
        <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300 text-xs">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {CATEGORY_ORDER.map(cat => {
          const lessons = byCategory[cat];
          if (!lessons?.length) return null;
          const isCollapsed = collapsedCats.has(cat);
          const doneCount = lessons.filter(l => progress[l.id]?.completed).length;

          return (
            <div key={cat}>
              <button
                className="w-full px-4 py-2 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors uppercase tracking-wide"
                onClick={() => toggleCat(cat)}
              >
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                {CATEGORY_LABELS[cat]}
                <span className="ml-auto text-slate-600">{doneCount}/{lessons.length}</span>
              </button>

              {!isCollapsed && (
                <div className="mb-1">
                  {lessons.map(lesson => {
                    const done = progress[lesson.id]?.completed;
                    const isActive = lesson.id === activeLessonId;

                    return (
                      <button
                        key={lesson.id}
                        className={`w-full px-4 py-2.5 flex items-start gap-3 text-left transition-colors border-b border-slate-800/50 ${
                          isActive
                            ? 'bg-blue-900/30 border-l-2 border-l-blue-500'
                            : 'hover:bg-slate-800'
                        }`}
                        onClick={() => openLesson(lesson)}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {done
                            ? <CheckCircle2 size={14} className="text-green-400" />
                            : <Circle size={14} className="text-slate-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-200 font-medium leading-tight">{lesson.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">{lesson.description}</div>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                          lesson.difficulty === 'beginner' ? 'bg-green-900/50 text-green-400' :
                          lesson.difficulty === 'intermediate' ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {lesson.difficulty[0].toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
