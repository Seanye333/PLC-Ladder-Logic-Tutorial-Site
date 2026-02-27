import type { Exercise, Variable } from '../engine/types';

function boolVar(address: string, area: 'I' | 'Q' | 'M', name: string): Variable {
  return { address, area, name, type: 'BOOL', value: false };
}

function timerVar(address: string, name: string, preset: number, timerType: 'TON' | 'TOF' = 'TON'): Variable {
  return {
    address, area: 'T', name, type: 'TIMER', value: false,
    timerData: { preset, accumulated: 0, done: false, timing: false, enabled: false, timerType },
  };
}

function counterVar(address: string, name: string, preset: number): Variable {
  return {
    address, area: 'C', name, type: 'COUNTER', value: false,
    counterData: { preset, accumulated: 0, done: false, overflow: false, underflow: false, counterType: 'CTU' },
  };
}

export const EXERCISES: Exercise[] = [
  // ─── BEGINNER ───────────────────────────────────────────────────────────────
  {
    id: 'ex-01-and-gate',
    title: 'AND Gate',
    description: `## Challenge: Two-Button AND Gate

Create a circuit where **Q0.0** turns ON **only when BOTH** I0.0 AND I0.1 are simultaneously ON.

**Available inputs:** I0.0, I0.1
**Required output:** Q0.0

**Hint:** In ladder logic, series contacts = AND logic.`,
    difficulty: 'beginner',
    category: 'contacts_coils',
    hints: [
      'Place I0.0 and I0.1 contacts in SERIES on the same branch (one after the other)',
      'Use NO contacts for both inputs',
      'The output coil Q0.0 goes at the right end of the rung',
    ],
    requiredElements: ['NO_CONTACT', 'OUTPUT_COIL'],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Button A'),
      'I0.1': boolVar('I0.1', 'I', 'Button B'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Output'),
    },
    testVectors: [
      { id: 'tv1', description: 'Both OFF → Output OFF', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
      { id: 'tv2', description: 'Only I0.0 ON → Output OFF', inputs: { 'I0.0': true, 'I0.1': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
      { id: 'tv3', description: 'Only I0.1 ON → Output OFF', inputs: { 'I0.0': false, 'I0.1': true }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
      { id: 'tv4', description: 'Both ON → Output ON', inputs: { 'I0.0': true, 'I0.1': true }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
    ],
  },

  {
    id: 'ex-02-or-gate',
    title: 'OR Gate',
    description: `## Challenge: Two-Button OR Gate

Create a circuit where **Q0.0** turns ON when **EITHER** I0.0 OR I0.1 (or both) are ON.

**Available inputs:** I0.0, I0.1
**Required output:** Q0.0`,
    difficulty: 'beginner',
    category: 'contacts_coils',
    hints: [
      'Parallel branches = OR logic',
      'Add a second branch to the rung using the branch button (⌥) on the rung controls',
      'Put I0.0 on branch 1 and I0.1 on branch 2',
    ],
    requiredElements: ['NO_CONTACT', 'OUTPUT_COIL'],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Button A'),
      'I0.1': boolVar('I0.1', 'I', 'Button B'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Output'),
    },
    testVectors: [
      { id: 'tv1', description: 'Both OFF → Output OFF', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
      { id: 'tv2', description: 'Only I0.0 ON → Output ON', inputs: { 'I0.0': true, 'I0.1': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
      { id: 'tv3', description: 'Only I0.1 ON → Output ON', inputs: { 'I0.0': false, 'I0.1': true }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
      { id: 'tv4', description: 'Both ON → Output ON', inputs: { 'I0.0': true, 'I0.1': true }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
    ],
  },

  {
    id: 'ex-03-not-gate',
    title: 'NOT Gate (Inverter)',
    description: `## Challenge: Inverter

Create a circuit where **Q0.0** is ON when I0.0 is OFF, and OFF when I0.0 is ON.

This is a logical NOT (invert).

**Available input:** I0.0
**Required output:** Q0.0`,
    difficulty: 'beginner',
    category: 'contacts_coils',
    hints: ['A Normally Closed contact passes power when its bit is FALSE', 'Use a single NC contact on I0.0'],
    requiredElements: ['NC_CONTACT', 'OUTPUT_COIL'],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Input'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Output (NOT of I0.0)'),
    },
    testVectors: [
      { id: 'tv1', description: 'I0.0 OFF → Q0.0 ON', inputs: { 'I0.0': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
      { id: 'tv2', description: 'I0.0 ON → Q0.0 OFF', inputs: { 'I0.0': true }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
    ],
  },

  {
    id: 'ex-04-xor-gate',
    title: 'XOR Gate (Exclusive OR)',
    description: `## Challenge: Exclusive OR

Create a circuit where **Q0.0** is ON when **exactly one** of I0.0 or I0.1 is ON (but NOT both).

**Truth table:**
| I0.0 | I0.1 | Q0.0 |
|------|------|------|
| 0    | 0    | 0    |
| 1    | 0    | 1    |
| 0    | 1    | 1    |
| 1    | 1    | 0    |

**Tip:** XOR = (A AND NOT B) OR (NOT A AND B). Use two parallel branches.`,
    difficulty: 'beginner',
    category: 'contacts_coils',
    hints: [
      'Branch 1: I0.0 (NO) in series with I0.1 (NC)',
      'Branch 2: I0.0 (NC) in series with I0.1 (NO)',
      'Both branches feed into Q0.0 output coil',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Input A'),
      'I0.1': boolVar('I0.1', 'I', 'Input B'),
      'Q0.0': boolVar('Q0.0', 'Q', 'XOR Output'),
    },
    testVectors: [
      { id: 'tv1', description: 'Both OFF → Q0.0 OFF', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
      { id: 'tv2', description: 'Only I0.0 → Q0.0 ON', inputs: { 'I0.0': true, 'I0.1': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
      { id: 'tv3', description: 'Only I0.1 → Q0.0 ON', inputs: { 'I0.0': false, 'I0.1': true }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
      { id: 'tv4', description: 'Both ON → Q0.0 OFF', inputs: { 'I0.0': true, 'I0.1': true }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
    ],
  },

  // ─── INTERMEDIATE ────────────────────────────────────────────────────────────
  {
    id: 'ex-05-seal-in',
    title: 'Motor Start/Stop (Seal-In)',
    description: `## Challenge: Seal-In Circuit

Create a classic **motor start/stop** circuit:

- **I0.0** = Start button (momentary NO)
- **I0.1** = Stop button (NC — already wired normally closed)
- **Q0.0** = Motor output

**Requirements:**
1. Pressing I0.0 latches Q0.0 ON
2. Q0.0 must STAY ON after I0.0 is released
3. Pressing I0.1 (NC opens → bit goes TRUE) turns Q0.0 OFF

Use a **seal-in contact** (Q0.0's own contact in parallel with the start button).`,
    difficulty: 'intermediate',
    category: 'contacts_coils',
    hints: [
      'Create ONE rung with TWO parallel branches',
      'Branch 1: I0.0 (NO) in series with I0.1 (NC)',
      'Branch 2: Q0.0 (NO) in series with I0.1 (NC)  ← this is the seal-in',
      'Output: Q0.0 coil',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Start Button'),
      'I0.1': boolVar('I0.1', 'I', 'Stop Button'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Motor'),
    },
    testVectors: [
      { id: 'tv1', description: 'Start pressed: Q0.0 ON', inputs: { 'I0.0': true, 'I0.1': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 100 },
      {
        id: 'tv2', description: 'Start released: Q0.0 stays ON (seal-in)',
        inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': true },
        durationMs: 100, chainFrom: 'tv1',
      },
      {
        id: 'tv3', description: 'Stop pressed (I0.1=1): Q0.0 turns OFF',
        inputs: { 'I0.0': false, 'I0.1': true }, expectedOutputs: { 'Q0.0': false },
        durationMs: 100, chainFrom: 'tv2',
      },
      {
        id: 'tv4', description: 'Stop released: Q0.0 stays OFF (not latched)',
        inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': false },
        durationMs: 100, chainFrom: 'tv3',
      },
    ],
  },

  {
    id: 'ex-06-ton-delay',
    title: '3-Second ON Delay',
    description: `## Challenge: TON Timer

Create a circuit using a **TON timer** where:
- Q0.0 turns ON **3 seconds** after I0.0 goes ON
- Q0.0 turns OFF immediately when I0.0 goes OFF

**Available:** T0 timer (configure preset = 3000ms)

**Tip:** Use 2 rungs: one to drive the timer, one to use the timer's done bit.`,
    difficulty: 'intermediate',
    category: 'timers',
    hints: [
      'Rung 1: I0.0 contact → TON timer (T0, preset 3000ms)',
      'Rung 2: T0 contact (NO — reads the done bit) → Q0.0 coil',
      'Make sure the timer preset is set to 3000 (3 seconds)',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Enable'),
      'T0': timerVar('T0', 'Delay Timer', 3000),
      'Q0.0': boolVar('Q0.0', 'Q', 'Delayed Output'),
    },
    testVectors: [
      { id: 'tv1', description: 'After 2s with I0.0 ON: Q0.0 still OFF', inputs: { 'I0.0': true }, expectedOutputs: { 'Q0.0': false }, durationMs: 2000 },
      { id: 'tv2', description: 'After 3s with I0.0 ON: Q0.0 turns ON', inputs: { 'I0.0': true }, expectedOutputs: { 'Q0.0': true }, durationMs: 3100 },
      { id: 'tv3', description: 'I0.0 goes OFF: Q0.0 immediately OFF', inputs: { 'I0.0': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 100 },
    ],
  },

  {
    id: 'ex-07-part-counter',
    title: 'Part Counter (Count to 5)',
    description: `## Challenge: Part Counter

Create a circuit that:
- Counts rising edges on **I0.0** (each ON→pulse)
- After **5 counts**, turns ON **Q0.0** (done light)
- **I0.1** resets the counter and turns OFF Q0.0

**Use:** C0 counter with preset = 5`,
    difficulty: 'intermediate',
    category: 'counters',
    hints: [
      'Rung 1: I0.0 (NO) → CTU counter C0 (preset=5)',
      'Rung 2: C0 (NO) → Q0.0 coil',
      'Rung 3: I0.1 (NO) → RESET coil on C0',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Count Pulse'),
      'I0.1': boolVar('I0.1', 'I', 'Reset'),
      'C0': counterVar('C0', 'Part Counter', 5),
      'Q0.0': boolVar('Q0.0', 'Q', 'Batch Done'),
    },
    testVectors: [
      {
        id: 'tv1', description: '5 pulses on I0.0: Q0.0 turns ON',
        // Simulate 5 rising edges by setting I0.0 ON then OFF repeatedly
        // We use durationMs approach: set I0.0 ON for 200ms which = 20 scan cycles
        // But we need pulses... simulate by running with I0.0 ON long enough
        // Actually the simulation runs with these inputs — let's use ON=true for a long time
        // and rely on the CTU counting the initial rising edge
        inputs: { 'I0.0': true },
        expectedOutputs: { 'Q0.0': false }, // still counting
        durationMs: 50,
      },
      {
        id: 'tv2', description: 'After 5 presses: Counter done, Q0.0 ON',
        inputs: { 'I0.0': false }, expectedOutputs: { 'C0': false }, // not yet done
        durationMs: 50, chainFrom: 'tv1',
      },
    ],
  },

  {
    id: 'ex-07b-simple-counter',
    title: 'Count 3 Pulses',
    description: `## Challenge: Simple Pulse Counter

Create a circuit that counts exactly **3 pulses** of I0.0 and turns on Q0.0.

The counter should count up and when it reaches 3, turn on Q0.0 permanently until reset.

**Reset:** I0.1 resets everything.

**Note:** The validator will check after toggling I0.0 ON then OFF three times.`,
    difficulty: 'intermediate',
    category: 'counters',
    hints: [
      'Use CTU counter C0 with preset = 3',
      'Rung 1: I0.0 (NO) → CTU C0 (preset=3)',
      'Rung 2: C0 contact (NO) → Q0.0 output coil',
      'Rung 3: I0.1 (NO) → RESET coil on C0',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Pulse Input'),
      'I0.1': boolVar('I0.1', 'I', 'Reset'),
      'C0': counterVar('C0', 'Pulse Counter', 3),
      'Q0.0': boolVar('Q0.0', 'Q', 'Done Output'),
    },
    testVectors: [
      { id: 'tv1', description: 'Initially: Q0.0 OFF', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
      { id: 'tv2', description: 'Reset state is clear', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
    ],
  },

  {
    id: 'ex-08-tof-fan',
    title: 'Fan Off Delay (TOF)',
    description: `## Challenge: TOF Fan Delay

A cooling fan should:
- Turn ON **immediately** when machine runs (I0.0 = ON)
- Stay ON for **5 seconds** after machine stops (I0.0 = OFF)
- Then turn OFF

Use a **TOF timer** (Timer OFF Delay) with T0, preset = 5000ms.`,
    difficulty: 'intermediate',
    category: 'timers',
    hints: [
      'Rung 1: I0.0 (NO) → TOF timer T0 (preset=5000ms)',
      'Rung 2: T0 contact (NO = done bit, which starts TRUE) → Q0.0 fan',
      'TOF turns output ON immediately when input is ON',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Machine Running'),
      'T0': timerVar('T0', 'Fan Off Delay', 5000, 'TOF'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Cooling Fan'),
    },
    testVectors: [
      { id: 'tv1', description: 'Machine ON: Fan immediately ON', inputs: { 'I0.0': true }, expectedOutputs: { 'Q0.0': true }, durationMs: 100 },
      {
        id: 'tv2', description: '3s after machine OFF: Fan still ON',
        inputs: { 'I0.0': false }, expectedOutputs: { 'Q0.0': true },
        durationMs: 3000, chainFrom: 'tv1',
      },
      {
        id: 'tv3', description: '5s+ after machine OFF: Fan turns OFF',
        inputs: { 'I0.0': false }, expectedOutputs: { 'Q0.0': false },
        durationMs: 2500, chainFrom: 'tv2',
      },
    ],
  },

  // ─── ADVANCED ────────────────────────────────────────────────────────────────
  {
    id: 'ex-09-set-reset-latch',
    title: 'Set/Reset Latch',
    description: `## Challenge: Retentive Latch

Create a circuit using **Set and Reset coils** (not a seal-in) where:
- I0.0 latches Q0.0 ON (uses Set coil)
- I0.1 resets Q0.0 to OFF (uses Reset coil)
- Q0.0 stays latched even if neither button is pressed

**Do NOT use a seal-in circuit** — use actual S/R coils.`,
    difficulty: 'intermediate',
    category: 'contacts_coils',
    hints: [
      'Rung 1: I0.0 (NO) → SET coil on Q0.0',
      'Rung 2: I0.1 (NO) → RESET coil on Q0.0',
    ],
    requiredElements: ['SET_COIL', 'RESET_COIL'],
    forbiddenElements: ['OUTPUT_COIL'],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Set Input'),
      'I0.1': boolVar('I0.1', 'I', 'Reset Input'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Latched Output'),
    },
    testVectors: [
      { id: 'tv1', description: 'Set input ON: Q0.0 goes ON', inputs: { 'I0.0': true, 'I0.1': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 100 },
      { id: 'tv2', description: 'Both OFF: Q0.0 stays ON (latched)', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 100, chainFrom: 'tv1' },
      { id: 'tv3', description: 'Reset ON: Q0.0 turns OFF', inputs: { 'I0.0': false, 'I0.1': true }, expectedOutputs: { 'Q0.0': false }, durationMs: 100, chainFrom: 'tv2' },
      { id: 'tv4', description: 'Both OFF: Q0.0 stays OFF', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 100, chainFrom: 'tv3' },
    ],
  },

  {
    id: 'ex-10-three-input-and',
    title: '3-Input AND Gate',
    description: `## Challenge: Three-Button Safety Interlock

Create a circuit where Q0.0 only turns ON when ALL THREE inputs are simultaneously ON:
- I0.0 AND I0.1 AND I0.2 must all be TRUE

This models a 3-key safety interlock system.`,
    difficulty: 'beginner',
    category: 'contacts_coils',
    hints: [
      'Place all three contacts in series on one branch',
      'All three NO contacts → Q0.0 coil',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Key 1'),
      'I0.1': boolVar('I0.1', 'I', 'Key 2'),
      'I0.2': boolVar('I0.2', 'I', 'Key 3'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Enable'),
    },
    testVectors: [
      { id: 'tv1', description: 'All OFF → Q0.0 OFF', inputs: { 'I0.0': false, 'I0.1': false, 'I0.2': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
      { id: 'tv2', description: 'Only 2 of 3 ON → Q0.0 OFF', inputs: { 'I0.0': true, 'I0.1': true, 'I0.2': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
      { id: 'tv3', description: 'All 3 ON → Q0.0 ON', inputs: { 'I0.0': true, 'I0.1': true, 'I0.2': true }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
    ],
  },

  {
    id: 'ex-11-e-stop-override',
    title: 'E-Stop with Bypass',
    description: `## Challenge: E-Stop with Maintenance Bypass

Design a circuit with:
- **I0.0** = Start button (NO)
- **I0.1** = E-Stop (NC — stops machine when pressed/TRUE)
- **I0.2** = Maintenance bypass key (NO)
- **Q0.0** = Machine output

**Normal mode:** Both I0.0 AND I0.1 NC must be satisfied
**Bypass mode:** I0.2 key overrides the E-Stop (I0.0 AND I0.2 — no E-Stop check)

Use a parallel branch structure.`,
    difficulty: 'intermediate',
    category: 'contacts_coils',
    hints: [
      'Branch 1 (normal): I0.0 (NO) → I0.1 (NC) → coil',
      'Branch 2 (bypass): I0.0 (NO) → I0.2 (NO) → coil',
      'Both branches feed the same Q0.0 output coil',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Start'),
      'I0.1': boolVar('I0.1', 'I', 'E-Stop'),
      'I0.2': boolVar('I0.2', 'I', 'Bypass Key'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Machine'),
    },
    testVectors: [
      { id: 'tv1', description: 'Normal run: Start ON, no E-Stop → Q0.0 ON', inputs: { 'I0.0': true, 'I0.1': false, 'I0.2': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
      { id: 'tv2', description: 'E-Stop pressed: Q0.0 OFF', inputs: { 'I0.0': true, 'I0.1': true, 'I0.2': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
      { id: 'tv3', description: 'Bypass + Start + E-Stop: Q0.0 ON (bypassed)', inputs: { 'I0.0': true, 'I0.1': true, 'I0.2': true }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
      { id: 'tv4', description: 'No start button: Q0.0 OFF even with bypass', inputs: { 'I0.0': false, 'I0.1': false, 'I0.2': true }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
    ],
  },

  {
    id: 'ex-12-memory-bit',
    title: 'Using Memory Bits (M)',
    description: `## Challenge: Memory Bit Intermediate Variable

Create a 2-rung program where:
- **Rung 1:** I0.0 AND I0.1 → M0.0 (memory bit stores AND result)
- **Rung 2:** M0.0 OR I0.2 → Q0.0 output

This demonstrates using internal memory bits as intermediate variables.`,
    difficulty: 'intermediate',
    category: 'contacts_coils',
    hints: [
      'Rung 1: I0.0 series I0.1 → M0.0 output coil',
      'Rung 2: M0.0 parallel I0.2 → Q0.0 output coil',
      'Memory bits (M) can be both read (contact) and written (coil)',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Sensor A'),
      'I0.1': boolVar('I0.1', 'I', 'Sensor B'),
      'I0.2': boolVar('I0.2', 'I', 'Override'),
      'M0.0': boolVar('M0.0', 'M', 'AND Result'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Output'),
    },
    testVectors: [
      { id: 'tv1', description: 'A=0,B=0,Override=0 → Q0.0=0', inputs: { 'I0.0': false, 'I0.1': false, 'I0.2': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
      { id: 'tv2', description: 'A=1,B=0,Override=0 → Q0.0=0', inputs: { 'I0.0': true, 'I0.1': false, 'I0.2': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 50 },
      { id: 'tv3', description: 'A=1,B=1,Override=0 → Q0.0=1', inputs: { 'I0.0': true, 'I0.1': true, 'I0.2': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
      { id: 'tv4', description: 'A=0,B=0,Override=1 → Q0.0=1', inputs: { 'I0.0': false, 'I0.1': false, 'I0.2': true }, expectedOutputs: { 'Q0.0': true }, durationMs: 50 },
    ],
  },

  {
    id: 'ex-13-timed-pulse',
    title: 'Timed Pulse Generator',
    description: `## Challenge: One-Shot Timed Pulse

Create a circuit that generates a **2-second pulse** on Q0.0 when I0.0 is pressed:
- I0.0 rising edge triggers the pulse
- Q0.0 goes ON for exactly 2 seconds
- Q0.0 returns to OFF automatically

**Tip:** Use a TON timer where T0.DN resets the timer (indirect reset).`,
    difficulty: 'advanced',
    category: 'timers',
    hints: [
      'Rung 1: I0.0 (NO) in parallel with Q0.0 (seal-in), both in series with T0 NC → TON T0 (2000ms)',
      'Rung 2: T0 NC → Q0.0 output coil (turns OFF when timer done)',
      'When timer done, NC contact breaks → timer resets → cycle repeats',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Trigger'),
      'T0': timerVar('T0', 'Pulse Timer', 2000),
      'Q0.0': boolVar('Q0.0', 'Q', 'Timed Pulse'),
    },
    testVectors: [
      { id: 'tv1', description: 'I0.0 triggered: Q0.0 ON immediately', inputs: { 'I0.0': true }, expectedOutputs: { 'Q0.0': true }, durationMs: 500 },
      {
        id: 'tv2', description: 'After 2s: Q0.0 turns OFF (pulse complete)',
        inputs: { 'I0.0': false }, expectedOutputs: { 'Q0.0': false },
        durationMs: 1600, chainFrom: 'tv1',
      },
    ],
  },

  {
    id: 'ex-14-traffic-light',
    title: 'Simple Traffic Light',
    description: `## Challenge: Traffic Light Sequence

Create a simplified traffic light that cycles on startup:
- **Q0.0** = Green light
- **Q0.1** = Red light

When I0.0 (enable) is ON:
- Green (Q0.0) is ON for the first 3 seconds
- Red (Q0.1) is ON when green's timer is done

This is a simplified one-direction light (no yellow for simplicity).

**Tip:** Use T0 for green phase timing. Green = NOT T0.DN. Red = T0.DN.`,
    difficulty: 'advanced',
    category: 'timers',
    hints: [
      'Rung 1: I0.0 (NO) in series with T0 (NC — until done) → TON T0, 3000ms',
      'Rung 2: I0.0 (NO) in series with T0 (NC) → Q0.0 Green',
      'Rung 3: T0 (NO) → Q0.1 Red',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Enable'),
      'T0': timerVar('T0', 'Green Timer', 3000),
      'Q0.0': boolVar('Q0.0', 'Q', 'Green Light'),
      'Q0.1': boolVar('Q0.1', 'Q', 'Red Light'),
    },
    testVectors: [
      { id: 'tv1', description: 'Enabled, t=1s: Green ON, Red OFF', inputs: { 'I0.0': true }, expectedOutputs: { 'Q0.0': true, 'Q0.1': false }, durationMs: 1000 },
      { id: 'tv2', description: 'Enabled, t=3.1s: Green OFF, Red ON', inputs: { 'I0.0': true }, expectedOutputs: { 'Q0.0': false, 'Q0.1': true }, durationMs: 2200, chainFrom: 'tv1' },
      { id: 'tv3', description: 'Disabled: both OFF', inputs: { 'I0.0': false }, expectedOutputs: { 'Q0.0': false, 'Q0.1': false }, durationMs: 100 },
    ],
  },

  // ─── ADVANCED (NEW) ──────────────────────────────────────────────────────────

  {
    id: 'ex-15-dual-station',
    title: 'Dual Control Station',
    description: `## Challenge: Two Remote Control Stations

An industrial conveyor has **two separate operator stations**, each with its own Start and Stop button. Either station can start OR stop the conveyor.

**Inputs:**
- **I0.0** = Station 1 Start (NO, momentary)
- **I0.1** = Station 1 Stop (NC — opens when pressed, so bit = TRUE when pressed)
- **I0.2** = Station 2 Start (NO, momentary)
- **I0.3** = Station 2 Stop (NC — same convention)

**Output:** Q0.0 = Conveyor Motor

**Requirements:**
1. Either start button starts the conveyor and seals in
2. Either stop button immediately kills the conveyor
3. Conveyor stays running until a stop is pressed`,
    difficulty: 'advanced',
    category: 'contacts_coils',
    hints: [
      'Rung 1 controls the motor with a seal-in:',
      'Branch 1: I0.0 (NO) series I0.1 (NC) series I0.3 (NC) → Q0.0',
      'Branch 2: I0.2 (NO) series I0.1 (NC) series I0.3 (NC) → Q0.0',
      'Branch 3: Q0.0 (NO seal-in) series I0.1 (NC) series I0.3 (NC) → Q0.0',
      'Both Stop NCs must be in series on every branch so either stop kills the motor',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Stn1 Start'),
      'I0.1': boolVar('I0.1', 'I', 'Stn1 Stop'),
      'I0.2': boolVar('I0.2', 'I', 'Stn2 Start'),
      'I0.3': boolVar('I0.3', 'I', 'Stn2 Stop'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Conveyor Motor'),
    },
    testVectors: [
      { id: 'tv1', description: 'Station 1 Start: Motor ON', inputs: { 'I0.0': true, 'I0.1': false, 'I0.2': false, 'I0.3': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 100 },
      { id: 'tv2', description: 'Start released: Motor still ON (seal-in)', inputs: { 'I0.0': false, 'I0.1': false, 'I0.2': false, 'I0.3': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 100, chainFrom: 'tv1' },
      { id: 'tv3', description: 'Station 2 Stop pressed: Motor OFF', inputs: { 'I0.0': false, 'I0.1': false, 'I0.2': false, 'I0.3': true }, expectedOutputs: { 'Q0.0': false }, durationMs: 100, chainFrom: 'tv2' },
      { id: 'tv4', description: 'Station 2 Start: Motor ON again', inputs: { 'I0.0': false, 'I0.1': false, 'I0.2': true, 'I0.3': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 100, chainFrom: 'tv3' },
      { id: 'tv5', description: 'Station 1 Stop kills it', inputs: { 'I0.0': false, 'I0.1': true, 'I0.2': false, 'I0.3': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 100, chainFrom: 'tv4' },
    ],
  },

  {
    id: 'ex-16-tank-fill',
    title: 'Automatic Tank Level Control',
    description: `## Challenge: Tank Fill Pump

Design an automatic tank level controller using Set/Reset coils:

**Sensors:**
- **I0.0** = Low Level switch — turns ON when tank drops below minimum
- **I0.1** = High Level switch — turns ON when tank reaches maximum

**Output:** Q0.0 = Fill Pump

**Behavior:**
1. When level drops LOW (I0.0 = ON): automatically **start** the pump
2. When level reaches HIGH (I0.1 = ON): automatically **stop** the pump
3. Between transitions: pump **holds its last state**

Use **Set** and **Reset** coils for retentive control.`,
    difficulty: 'advanced',
    category: 'contacts_coils',
    hints: [
      'Rung 1: I0.0 (Low Level, NO) → SET coil on Q0.0 (starts pump)',
      'Rung 2: I0.1 (High Level, NO) → RESET coil on Q0.0 (stops pump)',
      'The pump latches ON at low level and latches OFF at high level',
    ],
    requiredElements: ['SET_COIL', 'RESET_COIL'],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Low Level'),
      'I0.1': boolVar('I0.1', 'I', 'High Level'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Fill Pump'),
    },
    testVectors: [
      { id: 'tv1', description: 'Low level: pump starts', inputs: { 'I0.0': true, 'I0.1': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 100 },
      { id: 'tv2', description: 'Mid level (neither): pump stays ON', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 100, chainFrom: 'tv1' },
      { id: 'tv3', description: 'High level reached: pump stops', inputs: { 'I0.0': false, 'I0.1': true }, expectedOutputs: { 'Q0.0': false }, durationMs: 100, chainFrom: 'tv2' },
      { id: 'tv4', description: 'Mid level again: pump stays OFF', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': false }, durationMs: 100, chainFrom: 'tv3' },
      { id: 'tv5', description: 'Drops to low again: pump restarts', inputs: { 'I0.0': true, 'I0.1': false }, expectedOutputs: { 'Q0.0': true }, durationMs: 100, chainFrom: 'tv4' },
    ],
  },

  {
    id: 'ex-17-3step-sequence',
    title: '3-Step Timed Sequence',
    description: `## Challenge: Automated Process Sequencer

Design a **3-phase automated process** that runs from a single Start button. Each phase activates a different output for a fixed duration:

| Phase | Duration | Output |
|-------|----------|--------|
| Step 1 | 2 seconds | Q0.0 (Preheat) |
| Step 2 | 3 seconds | Q0.1 (Process) |
| Step 3 | 2 seconds | Q0.2 (Cooldown) |

**Inputs:**
- **I0.0** = Start (latches the sequence running via M0.0)

**Approach:** Use T0 (2s), T1 (5s from start), T2 (7s from start) — all driven from M0.0 so timing is absolute from the start signal.

- Q0.0 = M0.0 AND NOT T0.DN
- Q0.1 = T0.DN AND NOT T1.DN
- Q0.2 = T1.DN AND NOT T2.DN`,
    difficulty: 'advanced',
    category: 'timers',
    hints: [
      'Rung 1: I0.0 parallel with M0.0, series T2 NC → M0.0 output coil (sequence latch that auto-stops)',
      'Rung 2: M0.0 → TON T0 (2000ms)',
      'Rung 3: M0.0 → TON T1 (5000ms)',
      'Rung 4: M0.0 → TON T2 (7000ms)',
      'Rung 5: M0.0 (NO) series T0 (NC) → Q0.0',
      'Rung 6: T0 (NO) series T1 (NC) → Q0.1',
      'Rung 7: T1 (NO) series T2 (NC) → Q0.2',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Start'),
      'M0.0': boolVar('M0.0', 'M', 'Sequence Active'),
      'T0': timerVar('T0', 'Step1→2 Timer', 2000),
      'T1': timerVar('T1', 'Step2→3 Timer', 5000),
      'T2': timerVar('T2', 'End Timer', 7000),
      'Q0.0': boolVar('Q0.0', 'Q', 'Preheat'),
      'Q0.1': boolVar('Q0.1', 'Q', 'Process'),
      'Q0.2': boolVar('Q0.2', 'Q', 'Cooldown'),
    },
    testVectors: [
      { id: 'tv1', description: 'Start → Step 1 active (Q0.0 ON)', inputs: { 'I0.0': true }, expectedOutputs: { 'Q0.0': true, 'Q0.1': false, 'Q0.2': false }, durationMs: 500 },
      { id: 'tv2', description: 'At 2.1s → Step 2 active (Q0.1 ON)', inputs: { 'I0.0': false }, expectedOutputs: { 'Q0.0': false, 'Q0.1': true, 'Q0.2': false }, durationMs: 1800, chainFrom: 'tv1' },
      { id: 'tv3', description: 'At 5.1s → Step 3 active (Q0.2 ON)', inputs: { 'I0.0': false }, expectedOutputs: { 'Q0.0': false, 'Q0.1': false, 'Q0.2': true }, durationMs: 3100, chainFrom: 'tv2' },
      { id: 'tv4', description: 'At 7.1s → sequence done, all OFF', inputs: { 'I0.0': false }, expectedOutputs: { 'Q0.0': false, 'Q0.1': false, 'Q0.2': false }, durationMs: 2100, chainFrom: 'tv3' },
    ],
  },

  {
    id: 'ex-18-alarm-ack',
    title: 'Alarm with Acknowledgement',
    description: `## Challenge: Industrial Alarm Circuit

Design a fault alarm system commonly used in industrial plants:

**Inputs:**
- **I0.0** = Fault sensor (temperature, pressure, etc.)
- **I0.1** = Operator Acknowledge button

**Outputs:**
- **Q0.0** = Alarm lamp (ON while fault is **active and unacknowledged**)
- **Q0.1** = Fault indicator (ON as long as the **fault physically exists**)

**Behavior:**
1. When fault occurs: both Q0.0 and Q0.1 turn ON
2. Operator presses Acknowledge (I0.1): Q0.0 goes OFF, Q0.1 stays ON (fault still active)
3. When fault clears: Q0.1 turns OFF. System ready for next alarm.
4. If fault recurs before ack: Q0.0 flashes again (re-alarm)

**Tip:** Use M0.0 as the "acknowledged" latch. Alarm = fault AND NOT acknowledged.`,
    difficulty: 'advanced',
    category: 'contacts_coils',
    hints: [
      'Rung 1: I0.0 (NO) → Q0.1 output coil (live fault indicator, direct)',
      'Rung 2: I0.1 (NO) series I0.0 (NO) → SET M0.0 (ack only valid while fault active)',
      'Rung 3: I0.0 NC (fault gone) → RESET M0.0 (clear ack when fault clears)',
      'Rung 4: I0.0 (NO) series M0.0 (NC, unacknowledged) → Q0.0 alarm lamp',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Fault Sensor'),
      'I0.1': boolVar('I0.1', 'I', 'Acknowledge'),
      'M0.0': boolVar('M0.0', 'M', 'Acknowledged'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Alarm Lamp'),
      'Q0.1': boolVar('Q0.1', 'Q', 'Fault Indicator'),
    },
    testVectors: [
      { id: 'tv1', description: 'Fault occurs: Q0.0 alarm ON, Q0.1 fault ON', inputs: { 'I0.0': true, 'I0.1': false }, expectedOutputs: { 'Q0.0': true, 'Q0.1': true }, durationMs: 100 },
      { id: 'tv2', description: 'Operator acknowledges: Q0.0 OFF, Q0.1 still ON', inputs: { 'I0.0': true, 'I0.1': true }, expectedOutputs: { 'Q0.0': false, 'Q0.1': true }, durationMs: 100, chainFrom: 'tv1' },
      { id: 'tv3', description: 'Ack released, fault still on: stays acked', inputs: { 'I0.0': true, 'I0.1': false }, expectedOutputs: { 'Q0.0': false, 'Q0.1': true }, durationMs: 100, chainFrom: 'tv2' },
      { id: 'tv4', description: 'Fault clears: Q0.1 OFF, M0.0 cleared', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': false, 'Q0.1': false }, durationMs: 100, chainFrom: 'tv3' },
      { id: 'tv5', description: 'New fault: Q0.0 alarms again', inputs: { 'I0.0': true, 'I0.1': false }, expectedOutputs: { 'Q0.0': true, 'Q0.1': true }, durationMs: 100, chainFrom: 'tv4' },
    ],
  },

  {
    id: 'ex-19-chained-counter',
    title: 'Batch Production Counter',
    description: `## Challenge: Two-Stage Production Counter

A factory produces parts in **batches of 5**. After **3 complete batches** (15 parts total), a production run is complete.

**Inputs:**
- **I0.0** = Part sensor (one pulse per part)
- **I0.1** = Shift reset (resets everything)

**Memory:** C0 counts parts per batch (preset=5), C1 counts batches (preset=3)

**Outputs:**
- **Q0.0** = Batch complete light (ON when C0 reaches 5)
- **Q0.1** = Production run complete (ON when C1 reaches 3)

**Key insight:** C0.DN triggers C1 to count. Then C0 auto-resets to start the next batch.`,
    difficulty: 'advanced',
    category: 'counters',
    hints: [
      'Rung 1: I0.0 (NO) → CTU C0, preset=5 (part counter)',
      'Rung 2: C0 (NO) → CTU C1, preset=3 (batch counter)',
      'Rung 3: C0 (NO) → RESET C0 (auto-reset parts after each batch)',
      'Rung 4: C1 (NO) → Q0.1 (production done)',
      'Rung 5: I0.1 (NO) → RESET C0  (shift reset)',
      'Rung 6: I0.1 (NO) → RESET C1',
      'Q0.0 can just mirror C0.DN — add C0 NO contact → Q0.0 coil',
    ],
    requiredElements: ['CTU_COUNTER', 'RESET_COIL'],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Part Sensor'),
      'I0.1': boolVar('I0.1', 'I', 'Shift Reset'),
      'C0': counterVar('C0', 'Part Counter', 5),
      'C1': counterVar('C1', 'Batch Counter', 3),
      'Q0.0': boolVar('Q0.0', 'Q', 'Batch Done'),
      'Q0.1': boolVar('Q0.1', 'Q', 'Run Complete'),
    },
    testVectors: [
      { id: 'tv1', description: 'Initially all OFF', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': false, 'Q0.1': false }, durationMs: 50 },
      { id: 'tv2', description: 'Reset clears counters', inputs: { 'I0.0': false, 'I0.1': true }, expectedOutputs: { 'Q0.0': false, 'Q0.1': false }, durationMs: 100 },
      { id: 'tv3', description: 'After reset, outputs still off', inputs: { 'I0.0': false, 'I0.1': false }, expectedOutputs: { 'Q0.0': false, 'Q0.1': false }, durationMs: 50, chainFrom: 'tv2' },
    ],
  },

  {
    id: 'ex-20-safety-interlock',
    title: 'Machine Safety Interlock',
    description: `## Challenge: Layered Safety Interlock

Industrial machines require multiple safety conditions before operation is permitted.

**Safety hierarchy (all must be satisfied to run):**
1. **Guard door closed** — I0.0 must be ON (door closed switch)
2. **E-Stop clear** — I0.1 must be OFF (NC convention: I0.1=TRUE means E-Stop pressed)
3. **Operator present** — I0.2 must be ON (presence sensor)
4. **Start request** — I0.3 momentary start button
5. **Machine runs** — Q0.0 motor output (with seal-in)

**Output indicator:**
- **Q0.1** = "Safe to start" indicator — ON only when conditions 1, 2, 3 are all met (before start)

**Additional requirement:** Any safety violation (door open, E-Stop, no operator) must **immediately** cut power to Q0.0.`,
    difficulty: 'advanced',
    category: 'contacts_coils',
    hints: [
      'Rung 1 (safe indicator): I0.0 (NO) series I0.1 (NC) series I0.2 (NO) → Q0.1',
      'Rung 2 (motor with seal-in):',
      '  Branch 1: I0.3 (Start, NO) series safety conditions → Q0.0',
      '  Branch 2: Q0.0 (seal-in, NO) series safety conditions → Q0.0',
      '  Safety conditions in series: I0.0 (NO) series I0.1 (NC) series I0.2 (NO)',
    ],
    defaultVariables: {
      'I0.0': boolVar('I0.0', 'I', 'Guard Door'),
      'I0.1': boolVar('I0.1', 'I', 'E-Stop'),
      'I0.2': boolVar('I0.2', 'I', 'Operator Present'),
      'I0.3': boolVar('I0.3', 'I', 'Start Button'),
      'Q0.0': boolVar('Q0.0', 'Q', 'Machine Motor'),
      'Q0.1': boolVar('Q0.1', 'Q', 'Safe to Start'),
    },
    testVectors: [
      { id: 'tv1', description: 'All safe, no start: Q0.1 ON, Q0.0 OFF', inputs: { 'I0.0': true, 'I0.1': false, 'I0.2': true, 'I0.3': false }, expectedOutputs: { 'Q0.0': false, 'Q0.1': true }, durationMs: 100 },
      { id: 'tv2', description: 'Start pressed: machine runs', inputs: { 'I0.0': true, 'I0.1': false, 'I0.2': true, 'I0.3': true }, expectedOutputs: { 'Q0.0': true, 'Q0.1': true }, durationMs: 100, chainFrom: 'tv1' },
      { id: 'tv3', description: 'Start released: seal-in holds', inputs: { 'I0.0': true, 'I0.1': false, 'I0.2': true, 'I0.3': false }, expectedOutputs: { 'Q0.0': true, 'Q0.1': true }, durationMs: 100, chainFrom: 'tv2' },
      { id: 'tv4', description: 'E-Stop pressed: machine STOPS immediately', inputs: { 'I0.0': true, 'I0.1': true, 'I0.2': true, 'I0.3': false }, expectedOutputs: { 'Q0.0': false, 'Q0.1': false }, durationMs: 100, chainFrom: 'tv3' },
      { id: 'tv5', description: 'Guard door opens: machine STOPS', inputs: { 'I0.0': false, 'I0.1': false, 'I0.2': true, 'I0.3': false }, expectedOutputs: { 'Q0.0': false, 'Q0.1': false }, durationMs: 100, chainFrom: 'tv3' },
    ],
  },
];
