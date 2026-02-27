import { useState } from 'react';
import { Zap, CheckCircle2, XCircle, Lightbulb, ChevronRight } from 'lucide-react';
import type { Exercise, ValidationResult, ExerciseAttempt } from '../engine/types';
import { EXERCISES } from '../data/exercises';

interface Props {
  attempts: Record<string, ExerciseAttempt>;
  activeExerciseId: string | null;
  onExerciseSelect: (exercise: Exercise) => void;
  onValidate: () => ValidationResult;
  onClose: () => void;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\| (.+) \|$/gm, (_, row) => {
      const cells = row.split(' | ').map((c: string) => `<td>${c}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (m) => `<table>${m}</table>`)
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>');
}

const DIFF_COLORS: Record<string, string> = {
  beginner: 'text-green-400 bg-green-900/50',
  intermediate: 'text-yellow-400 bg-yellow-900/50',
  advanced: 'text-red-400 bg-red-900/50',
};

const CATEGORY_LABELS: Record<string, string> = {
  fundamentals: 'Fundamentals',
  contacts_coils: 'Contacts & Coils',
  timers: 'Timers',
  counters: 'Counters',
  advanced: 'Advanced',
};

export default function ExercisePanel({ attempts, activeExerciseId, onExerciseSelect, onValidate, onClose }: Props) {
  const [view, setView] = useState<'list' | 'exercise'>('list');
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [visibleHints, setVisibleHints] = useState(0);
  const [validating, setValidating] = useState(false);

  function openExercise(ex: Exercise) {
    setActiveExercise(ex);
    setResult(null);
    setVisibleHints(0);
    setView('exercise');
    onExerciseSelect(ex);
  }

  function handleValidate() {
    if (!activeExercise) return;
    setValidating(true);
    setTimeout(() => {
      const r = onValidate();
      setResult(r);
      setValidating(false);
    }, 100);
  }

  // Group by difficulty
  const byDiff: Record<string, Exercise[]> = { beginner: [], intermediate: [], advanced: [] };
  for (const ex of EXERCISES) {
    byDiff[ex.difficulty].push(ex);
  }

  if (view === 'exercise' && activeExercise) {
    const attempt = attempts[activeExercise.id];

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800">
          <button className="text-slate-400 hover:text-slate-200 transition-colors text-sm" onClick={() => setView('list')}>
            ← Back
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-yellow-400 uppercase tracking-wide">{CATEGORY_LABELS[activeExercise.category]}</div>
            <div className="text-sm font-semibold text-white truncate">{activeExercise.title}</div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${DIFF_COLORS[activeExercise.difficulty]}`}>
            {activeExercise.difficulty}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Description */}
          <div
            className="tutorial-content mb-4"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(activeExercise.description) }}
          />

          {/* Required / Forbidden elements */}
          {(activeExercise.requiredElements || activeExercise.forbiddenElements) && (
            <div className="mb-4 p-3 bg-slate-800 rounded border border-slate-700">
              {activeExercise.requiredElements && (
                <div className="text-xs text-slate-400 mb-1">
                  <span className="text-green-400">Required:</span>{' '}
                  {activeExercise.requiredElements.join(', ')}
                </div>
              )}
              {activeExercise.forbiddenElements && (
                <div className="text-xs text-slate-400">
                  <span className="text-red-400">Forbidden:</span>{' '}
                  {activeExercise.forbiddenElements.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Validate button */}
          <button
            className="w-full py-2 mb-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
            onClick={handleValidate}
            disabled={validating}
          >
            {validating ? 'Validating...' : '✓ Check My Solution'}
          </button>

          {/* Result */}
          {result && (
            <div className={`mb-4 p-4 rounded-lg border ${
              result.passed
                ? 'bg-green-900/30 border-green-700'
                : 'bg-red-900/30 border-red-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.passed
                  ? <CheckCircle2 size={18} className="text-green-400" />
                  : <XCircle size={18} className="text-red-400" />
                }
                <span className={`font-semibold ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
                  {result.passed ? 'Correct! Well done!' : `Not quite — Score: ${result.score}%`}
                </span>
              </div>

              {/* Feedback messages */}
              {result.feedback.length > 0 && (
                <ul className="text-xs text-slate-400 mb-2">
                  {result.feedback.map((f, i) => <li key={i} className="mb-1">• {f}</li>)}
                </ul>
              )}

              {/* Failed vectors */}
              {result.failedVectors.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-2">Failed test cases:</div>
                  {result.failedVectors.map(fv => (
                    <div key={fv.vectorId} className="text-xs bg-slate-800 rounded p-2 mb-2">
                      <div className="text-red-300 mb-1 font-medium">{fv.description}</div>
                      <div className="font-mono text-slate-400">
                        <div>Inputs: {JSON.stringify(fv.inputs)}</div>
                        <div>Expected: {JSON.stringify(fv.expectedOutputs)}</div>
                        <div className="text-red-400">Got: {JSON.stringify(
                          Object.fromEntries(
                            Object.keys(fv.expectedOutputs).map(k => [k, fv.actualOutputs[k]])
                          )
                        )}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hints */}
          {activeExercise.hints.length > 0 && (
            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={14} className="text-yellow-400" />
                <span className="text-xs font-semibold text-slate-400">Hints</span>
              </div>
              {activeExercise.hints.slice(0, visibleHints).map((hint, i) => (
                <div key={i} className="text-xs text-slate-300 bg-slate-800 rounded p-2 mb-2 border-l-2 border-yellow-500">
                  <span className="text-yellow-400 font-semibold">Hint {i + 1}:</span> {hint}
                </div>
              ))}
              {visibleHints < activeExercise.hints.length && (
                <button
                  className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                  onClick={() => setVisibleHints(v => v + 1)}
                >
                  <ChevronRight size={12} />
                  {visibleHints === 0 ? 'Show hint' : 'Show next hint'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  const diffOrder: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800">
        <Zap size={16} className="text-yellow-400" />
        <span className="font-semibold text-white text-sm">Exercises</span>
        <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300 text-xs">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {diffOrder.map(diff => {
          const exercises = byDiff[diff];
          if (!exercises.length) return null;
          const doneCount = exercises.filter(e => attempts[e.id]?.passed).length;

          return (
            <div key={diff}>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-800 flex justify-between">
                <span>{diff}</span>
                <span>{doneCount}/{exercises.length} solved</span>
              </div>
              {exercises.map(ex => {
                const attempt = attempts[ex.id];
                const isActive = ex.id === activeExerciseId;

                return (
                  <button
                    key={ex.id}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors border-b border-slate-800/50 ${
                      isActive ? 'bg-yellow-900/20 border-l-2 border-l-yellow-500' : 'hover:bg-slate-800'
                    }`}
                    onClick={() => openExercise(ex)}
                  >
                    <div className="flex-shrink-0">
                      {attempt?.passed
                        ? <CheckCircle2 size={16} className="text-green-400" />
                        : attempt
                        ? <XCircle size={16} className="text-red-400" />
                        : <div className="w-4 h-4 rounded-full border border-slate-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200 font-medium">{ex.title}</div>
                      <div className="text-xs text-slate-500">{CATEGORY_LABELS[ex.category]}</div>
                    </div>
                    {attempt && !attempt.passed && (
                      <span className="text-xs text-red-400">{attempt.score}%</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
