// ============================================================
// PLC LADDER LOGIC TRAINER — TYPE DEFINITIONS
// ============================================================

export type VariableArea = 'I' | 'Q' | 'M' | 'T' | 'C';
export type VariableType = 'BOOL' | 'TIMER' | 'COUNTER';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type TutorialCategory =
  | 'fundamentals'
  | 'contacts_coils'
  | 'timers'
  | 'counters'
  | 'advanced';

export interface TimerData {
  preset: number;       // ms
  accumulated: number;  // ms elapsed
  done: boolean;        // .DN bit
  timing: boolean;      // .TT bit
  enabled: boolean;     // .EN bit
  timerType: 'TON' | 'TOF';
}

export interface CounterData {
  preset: number;
  accumulated: number;
  done: boolean;
  overflow: boolean;
  underflow: boolean;
  counterType: 'CTU' | 'CTD';
}

export interface Variable {
  address: string;       // e.g. "I0.0", "T0", "C1"
  area: VariableArea;
  name: string;          // user label e.g. "Start Button"
  type: VariableType;
  value: boolean | number;
  timerData?: TimerData;
  counterData?: CounterData;
  comment?: string;
}

// ============================================================
// ELEMENT TYPES
// ============================================================

export type ElementType =
  | 'NO_CONTACT'
  | 'NC_CONTACT'
  | 'POS_EDGE'
  | 'NEG_EDGE'
  | 'OUTPUT_COIL'
  | 'SET_COIL'
  | 'RESET_COIL'
  | 'TON_TIMER'
  | 'TOF_TIMER'
  | 'CTU_COUNTER'
  | 'CTD_COUNTER';

export type EditorTool = 'select' | 'erase' | ElementType;

export interface LadderElement {
  id: string;
  type: ElementType;
  address: string;
  label?: string;
  preset?: number;        // for timers/counters (ms for timers, count for counters)
  // Runtime simulation state (not persisted)
  energized?: boolean;
  powerIn?: boolean;
  powerOut?: boolean;
  // Edge contact state
  prevBit?: boolean;
  // Counter rising-edge state
  prevCU?: boolean;
  // Timer runtime
  timerAccumulated?: number;
  timerDone?: boolean;
  timerTiming?: boolean;
}

// ============================================================
// RUNG STRUCTURE
// ============================================================

export interface Branch {
  id: string;
  elements: LadderElement[];
  powerFlow?: boolean;  // set during simulation
}

export interface Rung {
  id: string;
  comment?: string;
  branches: Branch[];         // parallel paths (OR logic)
  outputElements: LadderElement[];  // coils/timers/counters at right rail
  powerFlow?: boolean;
}

export interface LadderProgram {
  id: string;
  name: string;
  rungs: Rung[];
  variables: Record<string, Variable>;  // keyed by address string
}

// ============================================================
// SIMULATOR
// ============================================================

export type SimulatorMode = 'stopped' | 'running' | 'paused';

export interface SimulatorState {
  mode: SimulatorMode;
  scanCount: number;
  scanTimeMs: number;
  configuredScanRateMs: number;
  elapsedMs: number;
  variables: Record<string, Variable>;
  annotatedRungs: Rung[];   // rungs with power flow data applied
}

// ============================================================
// TUTORIALS
// ============================================================

export interface TutorialStep {
  id: string;
  instruction: string;
  highlightElements?: string[];
  highlightRungs?: string[];
}

export interface TutorialLesson {
  id: string;
  title: string;
  category: TutorialCategory;
  difficulty: Difficulty;
  description: string;
  theory: string;           // markdown content
  preloadedProgram?: LadderProgram;
  steps: TutorialStep[];
  nextLessonId?: string;
  prerequisiteIds?: string[];
}

export interface TutorialProgress {
  lessonId: string;
  completed: boolean;
  currentStepIndex: number;
}

// ============================================================
// EXERCISES
// ============================================================

export interface TestVector {
  id: string;
  description: string;
  inputs: Record<string, boolean | number>;
  expectedOutputs: Record<string, boolean | number>;
  durationMs?: number;
  chainFrom?: string;   // continue from another vector's end state
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: TutorialCategory;
  hints: string[];
  requiredElements?: ElementType[];
  forbiddenElements?: ElementType[];
  testVectors: TestVector[];
  defaultVariables?: Record<string, Variable>;
}

export interface FailedVector {
  vectorId: string;
  description: string;
  inputs: Record<string, boolean | number>;
  expectedOutputs: Record<string, boolean | number>;
  actualOutputs: Record<string, boolean | number>;
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  failedVectors: FailedVector[];
  feedback: string[];
  hints: string[];
}

export interface ExerciseAttempt {
  exerciseId: string;
  passed: boolean;
  score: number;
  completedAt?: string;
}

// ============================================================
// APP STATE
// ============================================================

export type AppView = 'editor' | 'tutorial' | 'exercise';

export interface CellCoord {
  rungIndex: number;
  section: 'branch' | 'output';
  branchIndex: number;
  elementIndex: number;
}
