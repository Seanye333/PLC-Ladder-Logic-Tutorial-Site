import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BookOpen, Zap, Edit3, Info, Download, Upload, Pencil, Activity, MessageCircle } from 'lucide-react';
import { EXERCISES } from './data/exercises';

import type {
  LadderProgram,
  LadderElement,
  CellCoord,
  TutorialLesson,
  TutorialProgress,
  Exercise,
  ExerciseAttempt,
  ValidationResult,
  Variable,
  ElementType,
} from './engine/types';
import { validateExercise } from './engine/simulator';

import { useEditor } from './hooks/useEditor';
import { useSimulator } from './hooks/useSimulator';

import ElementPalette from './components/ElementPalette';
import LadderCanvas from './components/LadderCanvas';
import VariableTable from './components/VariableTable';
import SimulatorControls from './components/SimulatorControls';
import TutorialPanel from './components/TutorialPanel';
import ExercisePanel from './components/ExercisePanel';
import ElementConfigModal from './components/ElementConfigModal';
import WaveformPanel from './components/WaveformPanel';
import ChatPanel from './components/ChatPanel';

// ─── STORAGE ────────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  program: 'plc-program-v1',
  tutorialProgress: 'plc-tutorial-progress-v1',
  exerciseAttempts: 'plc-exercise-attempts-v1',
};

function saveToStorage<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// ─── DEFAULT PROGRAM ────────────────────────────────────────────────────────────

function createDefaultProgram(): LadderProgram {
  return {
    id: uuidv4(),
    name: 'My Program',
    rungs: [],
    variables: {},
  };
}

// ─── APP ────────────────────────────────────────────────────────────────────────

type AppView = 'editor' | 'tutorial' | 'exercise';

export default function App() {
  const [appView, setAppView] = useState<AppView>('editor');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [tutorialProgress, setTutorialProgress] = useState<Record<string, TutorialProgress>>(
    () => loadFromStorage(STORAGE_KEYS.tutorialProgress, {})
  );
  const [exerciseAttempts, setExerciseAttempts] = useState<Record<string, ExerciseAttempt>>(
    () => loadFromStorage(STORAGE_KEYS.exerciseAttempts, {})
  );
  const [highlightedElements, setHighlightedElements] = useState<string[]>([]);
  const [highlightedRungs, setHighlightedRungs] = useState<string[]>([]);
  const [configModalElement, setConfigModalElement] = useState<LadderElement | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Program name editing
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Editor state
  const [initialProgram] = useState<LadderProgram>(() =>
    loadFromStorage<LadderProgram>(STORAGE_KEYS.program, createDefaultProgram())
  );
  const editor = useEditor(initialProgram);
  const simulator = useSimulator(editor.program);

  // Auto-save program on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage(STORAGE_KEYS.program, editor.program);
    }, 500);
    return () => clearTimeout(timer);
  }, [editor.program]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.tutorialProgress, tutorialProgress);
  }, [tutorialProgress]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.exerciseAttempts, exerciseAttempts);
  }, [exerciseAttempts]);

  // Focus name input when entering edit mode
  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  // ─── KEYBOARD SHORTCUTS ─────────────────────────────────────────────────────

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); editor.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); editor.redo(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleExport(); }
      if (e.key === 'Escape') { editor.setActiveTool('select'); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editor.activeTool !== 'erase') editor.setActiveTool('erase');
      }
      if (e.key === 'F5') {
        e.preventDefault();
        if (simulator.state.mode === 'running') simulator.pause();
        else simulator.run();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editor, simulator]);

  // ─── TUTORIAL HANDLERS ──────────────────────────────────────────────────────

  function handleLessonSelect(lesson: TutorialLesson) {
    setActiveLessonId(lesson.id);
    simulator.stop();
    if (lesson.preloadedProgram) {
      editor.loadProgram(lesson.preloadedProgram);
      simulator.resetToProgram(lesson.preloadedProgram);
    }
    if (!tutorialProgress[lesson.id]) {
      setTutorialProgress(prev => ({
        ...prev,
        [lesson.id]: { lessonId: lesson.id, completed: false, currentStepIndex: 0 },
      }));
    }
    const firstStep = lesson.steps[0];
    if (firstStep) {
      setHighlightedElements(firstStep.highlightElements ?? []);
      setHighlightedRungs(firstStep.highlightRungs ?? []);
    }
  }

  function handleLessonComplete(lessonId: string) {
    setTutorialProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...(prev[lessonId] ?? { lessonId, currentStepIndex: 0 }),
        completed: true,
      },
    }));
  }

  // ─── EXERCISE HANDLERS ──────────────────────────────────────────────────────

  function handleExerciseSelect(exercise: Exercise) {
    setActiveExerciseId(exercise.id);
    simulator.stop();
    if (exercise.defaultVariables) {
      const cleanProg: LadderProgram = {
        id: uuidv4(),
        name: exercise.title,
        rungs: [],
        variables: exercise.defaultVariables,
      };
      editor.loadProgram(cleanProg);
      simulator.resetToProgram(cleanProg);
    } else {
      const emptyProg = createDefaultProgram();
      editor.loadProgram(emptyProg);
    }
    setHighlightedElements([]);
    setHighlightedRungs([]);
  }

  function handleValidateExercise(): ValidationResult {
    if (!activeExerciseId) return { passed: false, score: 0, failedVectors: [], feedback: ['No exercise selected'], hints: [] };
    const exercise = EXERCISES.find((e: Exercise) => e.id === activeExerciseId);
    if (!exercise) return { passed: false, score: 0, failedVectors: [], feedback: ['Exercise not found'], hints: [] };

    const result = validateExercise(editor.program, exercise);

    setExerciseAttempts(prev => ({
      ...prev,
      [activeExerciseId]: {
        exerciseId: activeExerciseId,
        passed: result.passed,
        score: result.score,
        completedAt: result.passed ? new Date().toISOString() : undefined,
      },
    }));

    return result;
  }

  // ─── ELEMENT CONFIG MODAL ───────────────────────────────────────────────────

  function handleElementDoubleClick(el: LadderElement) {
    if (simulator.state.mode !== 'stopped') return;
    setConfigModalElement(el);
  }

  function handleConfigSave(elementId: string, updates: Partial<LadderElement>, newVariable?: Variable) {
    editor.updateElement(elementId, updates);
    if (newVariable) {
      editor.addVariable(newVariable);
      if (newVariable.timerData) editor.updateVariable(newVariable.address, newVariable);
      if (newVariable.counterData) editor.updateVariable(newVariable.address, newVariable);
    }
    simulator.resetToProgram(editor.program);
  }

  // ─── SLOT CLICK ─────────────────────────────────────────────────────────────

  function handleSlotClick(coord: CellCoord) {
    const tool = editor.activeTool;
    if (tool === 'select' || tool === 'erase') return;

    const isCoilOrBlock = ['OUTPUT_COIL', 'SET_COIL', 'RESET_COIL', 'TON_TIMER', 'TOF_TIMER', 'CTU_COUNTER', 'CTD_COUNTER'].includes(tool);
    const isContact = ['NO_CONTACT', 'NC_CONTACT', 'POS_EDGE', 'NEG_EDGE'].includes(tool);

    if (isCoilOrBlock && coord.section !== 'output') {
      editor.placeElement({ ...coord, section: 'output', elementIndex: 0 }, tool as ElementType);
    } else if (isContact && coord.section === 'output') {
      editor.placeElement({ ...coord, section: 'branch', branchIndex: 0 }, tool as ElementType);
    } else {
      editor.placeElement(coord, tool as ElementType);
    }
  }

  // ─── PROGRAM RENAME ─────────────────────────────────────────────────────────

  function startRenamingProgram() {
    setNameDraft(editor.program.name);
    setEditingName(true);
  }

  function commitRename() {
    const trimmed = nameDraft.trim();
    if (trimmed) editor.renameProgram(trimmed);
    setEditingName(false);
  }

  // ─── EXPORT / IMPORT ────────────────────────────────────────────────────────

  function handleExport() {
    const json = JSON.stringify(editor.program, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editor.program.name.replace(/[^a-z0-9_\-]/gi, '_')}.plc.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.plc.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const program = JSON.parse(ev.target?.result as string) as LadderProgram;
          if (!program.id || !program.rungs || !program.variables) {
            alert('Invalid PLC program file — missing required fields.');
            return;
          }
          simulator.stop();
          editor.loadProgram(program);
          simulator.resetToProgram(program);
        } catch {
          alert('Could not parse file. Make sure it is a valid .plc.json export.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  const isSimRunning = simulator.state.mode !== 'stopped';
  const displayVariables = isSimRunning ? simulator.state.variables : editor.program.variables;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-xs font-bold">PLC</div>
          <span className="font-semibold text-sm text-white hidden sm:inline">Ladder Logic Trainer</span>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 ml-4 bg-slate-800 rounded-lg p-0.5 flex-shrink-0">
          {([
            { key: 'tutorial', label: 'Tutorials', icon: BookOpen },
            { key: 'editor', label: 'Editor', icon: Edit3 },
            { key: 'exercise', label: 'Exercises', icon: Zap },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                appView === key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setAppView(key)}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Program name — click to rename */}
        <div className="ml-2 flex items-center gap-1 min-w-0">
          {editingName ? (
            <input
              ref={nameInputRef}
              className="bg-slate-700 border border-blue-500 rounded px-2 py-0.5 text-xs font-mono text-white outline-none"
              style={{ minWidth: 120, maxWidth: 200 }}
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditingName(false);
              }}
              onBlur={commitRename}
            />
          ) : (
            <button
              className="text-xs text-slate-500 font-mono truncate hidden md:flex items-center gap-1 hover:text-slate-300 transition-colors group"
              onClick={startRenamingProgram}
              title="Click to rename program"
            >
              <span className="truncate max-w-[140px]">{editor.program.name}</span>
              <Pencil size={10} className="opacity-0 group-hover:opacity-100 flex-shrink-0" />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Waveform toggle */}
          <button
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              showWaveform ? 'bg-blue-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            onClick={() => setShowWaveform(v => !v)}
            title="Toggle waveform / timing diagram"
          >
            <Activity size={14} />
            <span className="hidden lg:inline">Waveform</span>
          </button>

          {/* AI Tutor toggle */}
          <button
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              showChat ? 'bg-green-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            onClick={() => setShowChat(v => !v)}
            title="Open PLC Tutor (ChatGPT)"
          >
            <MessageCircle size={14} />
            <span className="hidden lg:inline">Tutor</span>
          </button>

          {/* Export */}
          <button
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-300 transition-colors"
            onClick={handleExport}
            title="Export program as JSON (Ctrl+S)"
          >
            <Download size={14} />
            <span className="hidden lg:inline">Export</span>
          </button>

          {/* Import */}
          <button
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-300 transition-colors"
            onClick={handleImport}
            title="Import program from JSON"
          >
            <Upload size={14} />
            <span className="hidden lg:inline">Import</span>
          </button>

          {/* Info */}
          <button
            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
            onClick={() => setShowInfo(i => !i)}
            title="Help"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Palette */}
      <div className="flex-shrink-0">
        <ElementPalette
          activeTool={editor.activeTool}
          onToolSelect={editor.setActiveTool}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: tutorials or exercises */}
        {(appView === 'tutorial' || appView === 'exercise') && (
          <div className="w-72 flex-shrink-0 border-r border-slate-700 overflow-hidden flex flex-col">
            {appView === 'tutorial' && (
              <TutorialPanel
                progress={tutorialProgress}
                activeLessonId={activeLessonId}
                onLessonSelect={handleLessonSelect}
                onLessonComplete={handleLessonComplete}
                onClose={() => setAppView('editor')}
              />
            )}
            {appView === 'exercise' && (
              <ExercisePanel
                attempts={exerciseAttempts}
                activeExerciseId={activeExerciseId}
                onExerciseSelect={handleExerciseSelect}
                onValidate={handleValidateExercise}
                onClose={() => setAppView('editor')}
              />
            )}
          </div>
        )}

        {/* Center: Ladder canvas */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <LadderCanvas
            program={editor.program}
            annotatedRungs={simulator.state.annotatedRungs}
            variables={displayVariables}
            activeTool={editor.activeTool}
            simulationMode={isSimRunning}
            highlightedElements={highlightedElements}
            highlightedRungs={highlightedRungs}
            onAddRung={editor.addRung}
            onDeleteRung={editor.deleteRung}
            onMoveRung={editor.moveRung}
            onAddBranch={editor.addBranch}
            onDeleteBranch={editor.deleteBranch}
            onRungCommentChange={editor.setRungComment}
            onElementClick={(coord, el) => editor.setSelectedId(el.id)}
            onElementDoubleClick={handleElementDoubleClick}
            onElementDelete={editor.deleteElement}
            onSlotClick={handleSlotClick}
          />

          {/* Waveform panel (collapsible bottom strip) */}
          {showWaveform && (
            <WaveformPanel
              variables={displayVariables}
              simulationMode={isSimRunning}
              scanCount={simulator.state.scanCount}
            />
          )}
        </div>

        {/* Right sidebar: variable table */}
        <VariableTable
          variables={displayVariables}
          simulationMode={isSimRunning}
          onToggleInput={simulator.toggleInput}
        />

        {/* AI Tutor chat panel */}
        {showChat && (
          <ChatPanel
            program={editor.program}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>

      {/* Bottom: simulator controls */}
      <div className="flex-shrink-0">
        <SimulatorControls
          mode={simulator.state.mode}
          scanCount={simulator.state.scanCount}
          scanTimeMs={simulator.state.scanTimeMs}
          configuredScanRateMs={simulator.state.configuredScanRateMs}
          elapsedMs={simulator.state.elapsedMs}
          onRun={() => { simulator.run(); }}
          onPause={simulator.pause}
          onStep={simulator.step}
          onStop={() => { simulator.stop(); }}
          onScanRateChange={simulator.setScanRate}
        />
      </div>

      {/* Config modal */}
      <ElementConfigModal
        element={configModalElement}
        variables={editor.program.variables}
        isOpen={!!configModalElement}
        onClose={() => setConfigModalElement(null)}
        onSave={handleConfigSave}
      />

      {/* Info overlay */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowInfo(false)}>
          <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">PLC Ladder Logic Trainer</h2>
            <div className="text-sm text-slate-300 space-y-2">
              <p><strong className="text-blue-300">Building a circuit:</strong> Select an element from the palette, then click an empty slot on the canvas to place it. Right-click or use Erase tool to delete.</p>
              <p><strong className="text-blue-300">Configuring elements:</strong> Double-click any element to set its address, label, and preset values.</p>
              <p><strong className="text-blue-300">Parallel branches:</strong> Use the branch button (appears on rung hover) to add OR logic paths.</p>
              <p><strong className="text-blue-300">Simulation:</strong> Click Run (or F5) to start. Toggle Input (I) variables in the right panel to test your circuit.</p>
              <p><strong className="text-blue-300">Rung comments:</strong> Double-click a rung number to add or edit a comment.</p>
              <p><strong className="text-blue-300">Export / Import:</strong> Save your program as a JSON file and reload it later.</p>
              <p><strong className="text-blue-300">Waveform:</strong> Click "Waveform" to open the timing diagram during simulation.</p>
              <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500">
                <strong>Keyboard:</strong> Esc=select · Del=erase · Ctrl+Z=undo · Ctrl+Y=redo · F5=run/pause · Ctrl+S=export
              </div>
            </div>
            <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm" onClick={() => setShowInfo(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
