import { v4 as uuidv4 } from 'uuid';
import type { TutorialLesson, LadderProgram } from '../engine/types';

function makeVar(address: string, area: 'I' | 'Q' | 'M' | 'T' | 'C', name: string, type: 'BOOL' | 'TIMER' | 'COUNTER' = 'BOOL', timerPreset?: number, counterPreset?: number) {
  const base = { address, area, name, type, value: false as boolean | number };
  if (type === 'TIMER') {
    return { ...base, timerData: { preset: timerPreset ?? 5000, accumulated: 0, done: false, timing: false, enabled: false, timerType: (area === 'T' ? 'TON' : 'TON') as 'TON' | 'TOF' } };
  }
  if (type === 'COUNTER') {
    return { ...base, counterData: { preset: counterPreset ?? 5, accumulated: 0, done: false, overflow: false, underflow: false, counterType: 'CTU' as 'CTU' | 'CTD' } };
  }
  return base;
}

function prog(name: string, rungs: LadderProgram['rungs'], variables: LadderProgram['variables']): LadderProgram {
  return { id: uuidv4(), name, rungs, variables };
}

// Pre-built programs for each lesson
const LESSON1_PROG: LadderProgram = prog('Lesson 1 Demo', [
  {
    id: 'r1', comment: 'Start button controls pilot light',
    branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Start' }] }],
    outputElements: [{ id: 'e2', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Light' }],
    powerFlow: false,
  }
], {
  'I0.0': makeVar('I0.0', 'I', 'Start Button'),
  'Q0.0': makeVar('Q0.0', 'Q', 'Pilot Light'),
});

const LESSON2_PROG: LadderProgram = prog('NO Contact Demo', [
  {
    id: 'r1', comment: 'NO contact - passes when TRUE',
    branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0' }] }],
    outputElements: [{ id: 'e2', type: 'OUTPUT_COIL', address: 'Q0.0' }],
  }
], {
  'I0.0': makeVar('I0.0', 'I', 'Switch'),
  'Q0.0': makeVar('Q0.0', 'Q', 'Output'),
});

const LESSON3_PROG: LadderProgram = prog('NC Contact Demo', [
  {
    id: 'r1', comment: 'NC contact - passes when FALSE (e.g. E-Stop)',
    branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NC_CONTACT', address: 'I0.0' }] }],
    outputElements: [{ id: 'e2', type: 'OUTPUT_COIL', address: 'Q0.0' }],
  }
], {
  'I0.0': makeVar('I0.0', 'I', 'E-Stop (NC)'),
  'Q0.0': makeVar('Q0.0', 'Q', 'Motor Enable'),
});

const LESSON4_PROG: LadderProgram = prog('Series Logic (AND)', [
  {
    id: 'r1', comment: 'BOTH buttons must be pressed',
    branches: [{ id: 'b1', elements: [
      { id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Btn A' },
      { id: 'e2', type: 'NO_CONTACT', address: 'I0.1', label: 'Btn B' },
    ]}],
    outputElements: [{ id: 'e3', type: 'OUTPUT_COIL', address: 'Q0.0' }],
  }
], {
  'I0.0': makeVar('I0.0', 'I', 'Button A'),
  'I0.1': makeVar('I0.1', 'I', 'Button B'),
  'Q0.0': makeVar('Q0.0', 'Q', 'Output'),
});

const LESSON5_PROG: LadderProgram = prog('Parallel Logic (OR)', [
  {
    id: 'r1', comment: 'EITHER button energizes the output',
    branches: [
      { id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Btn A' }] },
      { id: 'b2', elements: [{ id: 'e2', type: 'NO_CONTACT', address: 'I0.1', label: 'Btn B' }] },
    ],
    outputElements: [{ id: 'e3', type: 'OUTPUT_COIL', address: 'Q0.0' }],
  }
], {
  'I0.0': makeVar('I0.0', 'I', 'Button A'),
  'I0.1': makeVar('I0.1', 'I', 'Button B'),
  'Q0.0': makeVar('Q0.0', 'Q', 'Output'),
});

const LESSON6_PROG: LadderProgram = prog('Set/Reset Coils', [
  {
    id: 'r1', comment: 'Rung 1: SET output',
    branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Set Input' }] }],
    outputElements: [{ id: 'e2', type: 'SET_COIL', address: 'Q0.0' }],
  },
  {
    id: 'r2', comment: 'Rung 2: RESET output',
    branches: [{ id: 'b1', elements: [{ id: 'e3', type: 'NO_CONTACT', address: 'I0.1', label: 'Reset Input' }] }],
    outputElements: [{ id: 'e4', type: 'RESET_COIL', address: 'Q0.0' }],
  }
], {
  'I0.0': makeVar('I0.0', 'I', 'Set Button'),
  'I0.1': makeVar('I0.1', 'I', 'Reset Button'),
  'Q0.0': makeVar('Q0.0', 'Q', 'Latched Output'),
});

const LESSON7_PROG: LadderProgram = prog('Seal-In Circuit', [
  {
    id: 'r1', comment: 'Start (I0.0) OR Q0.0 seal-in, Stop NC (I0.1)',
    branches: [
      { id: 'b1', elements: [
        { id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'START' },
        { id: 'e2', type: 'NC_CONTACT', address: 'I0.1', label: 'STOP' },
      ]},
      { id: 'b2', elements: [
        { id: 'e3', type: 'NO_CONTACT', address: 'Q0.0', label: 'Seal-in' },
        { id: 'e4', type: 'NC_CONTACT', address: 'I0.1', label: 'STOP' },
      ]},
    ],
    outputElements: [{ id: 'e5', type: 'OUTPUT_COIL', address: 'Q0.0' }],
  }
], {
  'I0.0': makeVar('I0.0', 'I', 'Start Button'),
  'I0.1': makeVar('I0.1', 'I', 'Stop Button'),
  'Q0.0': makeVar('Q0.0', 'Q', 'Motor'),
});

const LESSON8_PROG: LadderProgram = prog('TON Timer Demo', [
  {
    id: 'r1', comment: 'Rung 1: Enable timer when I0.0 is ON',
    branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Enable' }] }],
    outputElements: [{ id: 'e2', type: 'TON_TIMER', address: 'T0', preset: 3000 }],
  },
  {
    id: 'r2', comment: 'Rung 2: T0 done bit energizes output',
    branches: [{ id: 'b1', elements: [{ id: 'e3', type: 'NO_CONTACT', address: 'T0', label: 'T0.DN' }] }],
    outputElements: [{ id: 'e4', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Delayed Out' }],
  }
], {
  'I0.0': makeVar('I0.0', 'I', 'Enable'),
  'T0': { address: 'T0', area: 'T', name: 'Delay Timer', type: 'TIMER', value: false, timerData: { preset: 3000, accumulated: 0, done: false, timing: false, enabled: false, timerType: 'TON' } },
  'Q0.0': makeVar('Q0.0', 'Q', 'Delayed Output'),
});

const LESSON9_PROG: LadderProgram = prog('CTU Counter Demo', [
  {
    id: 'r1', comment: 'Rung 1: Count pulses on I0.0',
    branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Count Pulse' }] }],
    outputElements: [{ id: 'e2', type: 'CTU_COUNTER', address: 'C0', preset: 3 }],
  },
  {
    id: 'r2', comment: 'Rung 2: C0 done bit → output',
    branches: [{ id: 'b1', elements: [{ id: 'e3', type: 'NO_CONTACT', address: 'C0', label: 'C0.DN' }] }],
    outputElements: [{ id: 'e4', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Count Done' }],
  },
  {
    id: 'r3', comment: 'Rung 3: Reset counter on I0.1',
    branches: [{ id: 'b1', elements: [{ id: 'e5', type: 'NO_CONTACT', address: 'I0.1', label: 'Reset' }] }],
    outputElements: [{ id: 'e6', type: 'RESET_COIL', address: 'C0' }],
  }
], {
  'I0.0': makeVar('I0.0', 'I', 'Count Pulse'),
  'I0.1': makeVar('I0.1', 'I', 'Reset'),
  'C0': { address: 'C0', area: 'C', name: 'Part Counter', type: 'COUNTER', value: false, counterData: { preset: 3, accumulated: 0, done: false, overflow: false, underflow: false, counterType: 'CTU' } },
  'Q0.0': makeVar('Q0.0', 'Q', 'Count Done Light'),
});

const LESSON10_PROG: LadderProgram = prog('Edge Contacts Demo', [
  {
    id: 'r1', comment: 'Rung 1: Rising edge one-shot',
    branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'POS_EDGE', address: 'I0.0', label: 'Button' }] }],
    outputElements: [{ id: 'e2', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'One-shot' }],
  }
], {
  'I0.0': makeVar('I0.0', 'I', 'Button'),
  'Q0.0': makeVar('Q0.0', 'Q', 'One-Shot Output'),
});

export const TUTORIALS: TutorialLesson[] = [
  {
    id: 'lesson-01-intro',
    title: 'What is a PLC?',
    category: 'fundamentals',
    difficulty: 'beginner',
    description: 'Introduction to PLCs, ladder logic, and the scan cycle',
    theory: `# What is a PLC?

A **Programmable Logic Controller (PLC)** is an industrial computer designed to control electromechanical processes — conveyors, assembly machines, lighting systems, and much more.

## Why "Ladder" Logic?

Ladder logic gets its name from its visual resemblance to an electrical ladder diagram:
- The two vertical lines on each side are **power rails** (like the sides of a ladder)
- Each horizontal line is a **rung** (like the rungs you climb)
- Logic flows from left rail → through contacts → to output coil → to right rail

## The PLC Scan Cycle

PLCs don't run code like a computer program. Instead they continuously repeat a **scan cycle**:

1. **Read Inputs** — snapshot all physical input states
2. **Execute Program** — evaluate all rungs top to bottom
3. **Write Outputs** — apply output states to physical devices

This cycle repeats every **1–100ms** (called the scan time).

## Key Rule

Power flows **left to right** in ladder logic. If all contacts in a rung pass power through, the output coil is energized.`,
    preloadedProgram: LESSON1_PROG,
    steps: [
      {
        id: 's1',
        instruction: 'Look at the ladder rung. It has a **Normally Open contact** (I0.0) connected to an **Output Coil** (Q0.0). This reads: "When I0.0 is ON, turn Q0.0 ON."',
        highlightRungs: ['r1'],
      },
      {
        id: 's2',
        instruction: 'Click **Run** in the simulator bar at the bottom to start the PLC scan cycle. Watch the status change to green.',
      },
      {
        id: 's3',
        instruction: 'Now find **I0.0** in the Variable Table on the right. Click its toggle to simulate pressing the start button. The rung should light up blue (power flowing), and Q0.0 turns ON!',
        highlightElements: ['e1', 'e2'],
      },
      {
        id: 's4',
        instruction: 'Toggle I0.0 back OFF. The power flow stops and Q0.0 turns OFF. This is ladder logic in action!',
      },
    ],
    nextLessonId: 'lesson-02-no-contact',
  },

  {
    id: 'lesson-02-no-contact',
    title: 'Normally Open (NO) Contact',
    category: 'contacts_coils',
    difficulty: 'beginner',
    description: 'Learn how NO contacts work — they pass power when their bit is TRUE',
    theory: `# Normally Open Contact  ┤ ├

A **Normally Open (NO)** contact passes power when its associated bit is **TRUE (1)**.

In its default (un-energized) state, it is **open** — no current flows.
When the bit goes TRUE, it **closes** — power passes through.

## Symbol
\`\`\`
──┤ ├──
\`\`\`

## Real-World Analogy
A **momentary pushbutton** (normally open type):
- At rest: open circuit, no current
- Pressed: closed circuit, current flows

## Address
NO contacts read from:
- **I0.x** — physical input bits (sensors, buttons)
- **Q0.x** — output bits (use as feedback)
- **M0.x** — internal memory bits
- **T0** — timer done bit (.DN)
- **C0** — counter done bit (.DN)`,
    preloadedProgram: LESSON2_PROG,
    steps: [
      { id: 's1', instruction: 'The NO contact `I0.0` is currently shown in gray — no power is flowing because I0.0 is FALSE.', highlightElements: ['e1'] },
      { id: 's2', instruction: 'Start the simulation (Run button). Then toggle **I0.0** in the Variable Table to TRUE.' },
      { id: 's3', instruction: 'The contact turns blue (energized) and the coil Q0.0 activates. Toggle I0.0 back — it stops.' },
      { id: 's4', instruction: 'Summary: NO contact = power passes when its bit is TRUE. This is the most common contact type in PLC programming.' },
    ],
    nextLessonId: 'lesson-03-nc-contact',
    prerequisiteIds: ['lesson-01-intro'],
  },

  {
    id: 'lesson-03-nc-contact',
    title: 'Normally Closed (NC) Contact',
    category: 'contacts_coils',
    difficulty: 'beginner',
    description: 'Learn how NC contacts work — they pass power when their bit is FALSE',
    theory: `# Normally Closed Contact  ┤/├

A **Normally Closed (NC)** contact passes power when its associated bit is **FALSE (0)**.

It is the **opposite** of the NO contact:
- At rest (bit=0): closed — power flows
- Bit goes TRUE: opens — power is blocked

## Symbol
\`\`\`
──┤/├──
\`\`\`

## Real-World Use: Emergency Stop (E-Stop)
The **E-Stop** is almost always wired as a NC contact in ladder logic:
- Normally (not pressed): E-Stop bit = 0 → NC contact closed → power flows → machine runs
- E-Stop pressed: E-Stop bit = 1 → NC contact opens → power blocked → machine stops

This is called **"fail-safe"** design — a broken wire also stops the machine.

## Memory Aid
- NO = "Normally Open" = open when bit=0, closes when bit=1
- NC = "Normally Closed" = closed when bit=0, opens when bit=1`,
    preloadedProgram: LESSON3_PROG,
    steps: [
      { id: 's1', instruction: 'Notice the NC contact `I0.0` (E-Stop). When I0.0 is FALSE, power flows through and the motor is enabled.', highlightElements: ['e1'] },
      { id: 's2', instruction: 'Run the simulation. Q0.0 (Motor Enable) is already ON because the E-Stop is not pressed (I0.0=FALSE).' },
      { id: 's3', instruction: 'Now toggle **I0.0** to TRUE (simulating E-Stop pressed). The NC contact OPENS and motor stops!' },
      { id: 's4', instruction: 'Toggle I0.0 back to FALSE — the E-Stop is released and the motor re-enables.' },
    ],
    nextLessonId: 'lesson-04-series',
    prerequisiteIds: ['lesson-02-no-contact'],
  },

  {
    id: 'lesson-04-series',
    title: 'Series Logic (AND)',
    category: 'contacts_coils',
    difficulty: 'beginner',
    description: 'Place multiple contacts in series to create AND logic',
    theory: `# Series Contacts = AND Logic

When contacts are placed **in series** (one after another on the same branch), the output is energized only when **ALL contacts** pass power.

This is **AND logic**: A AND B must both be true.

## Diagram
\`\`\`
──┤A├──┤B├──(Output)──
\`\`\`
Output is ON only when A=1 **AND** B=1

## Real-World Example: Two-Hand Safety Circuit
Many machines require an operator to press TWO buttons simultaneously to activate (one per hand). This prevents accidentally activating the machine with one hand while the other is in a danger zone.

\`\`\`
──┤Left Hand├──┤Right Hand├──(Machine Start)──
\`\`\`

## Truth Table
| A | B | Output |
|---|---|--------|
| 0 | 0 | 0 |
| 1 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 1 | 1 |`,
    preloadedProgram: LESSON4_PROG,
    steps: [
      { id: 's1', instruction: 'This rung has two NO contacts in series (I0.0 AND I0.1). Both must be ON for Q0.0 to energize.', highlightRungs: ['r1'] },
      { id: 's2', instruction: 'Run the simulation. Try toggling only I0.0 ON — the rung does NOT energize.' },
      { id: 's3', instruction: 'Now toggle only I0.1 ON — still not energized. Power stops at the first open contact.' },
      { id: 's4', instruction: 'Toggle BOTH I0.0 and I0.1 ON — the full rung energizes! This is AND logic.' },
    ],
    nextLessonId: 'lesson-05-parallel',
    prerequisiteIds: ['lesson-02-no-contact'],
  },

  {
    id: 'lesson-05-parallel',
    title: 'Parallel Branches (OR)',
    category: 'contacts_coils',
    difficulty: 'beginner',
    description: 'Add parallel branches to create OR logic',
    theory: `# Parallel Branches = OR Logic

When you add a **second branch** (parallel path) to a rung, the output energizes when **EITHER** branch passes power.

This is **OR logic**: A OR B (or both) is true.

## Diagram
\`\`\`
──┤A├──┬──(Output)──
       │
──┤B├──┘
\`\`\`
Output is ON when A=1 **OR** B=1

## How to Add a Parallel Branch
In this app, click the **branch icon** (⌥) on the rung controls to add another branch below.

## Real-World Example: Multiple Start Buttons
A machine might have start buttons at several stations:
\`\`\`
──┤Station 1 Start├──┬──(Machine Start)──
                     │
──┤Station 2 Start├──┘
\`\`\`

## Truth Table
| A | B | Output |
|---|---|--------|
| 0 | 0 | 0 |
| 1 | 0 | 1 |
| 0 | 1 | 1 |
| 1 | 1 | 1 |`,
    preloadedProgram: LESSON5_PROG,
    steps: [
      { id: 's1', instruction: 'This rung has TWO branches (parallel paths). I0.0 is on the top branch, I0.1 on the bottom branch.', highlightRungs: ['r1'] },
      { id: 's2', instruction: 'Run the simulation. Toggle only I0.0 ON — Q0.0 energizes! (Top branch passes power)' },
      { id: 's3', instruction: 'Toggle I0.0 OFF, then I0.1 ON — Q0.0 still energizes! (Bottom branch passes power)' },
      { id: 's4', instruction: 'This is OR logic: either branch can deliver power to the output.' },
    ],
    nextLessonId: 'lesson-06-set-reset',
    prerequisiteIds: ['lesson-04-series'],
  },

  {
    id: 'lesson-06-set-reset',
    title: 'Set and Reset Coils',
    category: 'contacts_coils',
    difficulty: 'beginner',
    description: 'Use Set (S) and Reset (R) coils for retentive latching',
    theory: `# Set (S) and Reset (R) Coils

Standard output coils (O) are **non-retentive**: the output bit equals the current rung power. Turn the power off, the output goes off.

**Set (S) and Reset (R) coils** are **retentive** (they "remember"):
- **Set coil (S)**: When rung power is ON → bit latches TRUE and STAYS true even when power is removed
- **Reset coil (R)**: When rung power is ON → bit is forced FALSE

## Symbol
\`\`\`
──(S)──   Set coil (latch)
──(R)──   Reset coil (unlatch)
\`\`\`

## Usage Pattern
Set and Reset coils are always used **in pairs** on separate rungs:
- Rung 1: condition → (S) latch
- Rung 2: condition → (R) unlatch

## Real-World Use
A light that should stay on until a reset button is pressed:
\`\`\`
Rung 1: ──┤Start├──(S)Light──
Rung 2: ──┤Reset├──(R)Light──
\`\`\``,
    preloadedProgram: LESSON6_PROG,
    steps: [
      { id: 's1', instruction: 'This program has 2 rungs. Rung 1 has a SET coil, Rung 2 has a RESET coil — both control Q0.0.' },
      { id: 's2', instruction: 'Run the simulation. Toggle I0.0 ON briefly, then OFF. Notice Q0.0 STAYS ON! That\'s the latch.', highlightElements: ['e2'] },
      { id: 's3', instruction: 'Now toggle I0.1 ON (Reset input). Q0.0 turns OFF. Toggle I0.1 back OFF.', highlightElements: ['e4'] },
      { id: 's4', instruction: 'Set/Reset coils are powerful for state machines — light indicators, alarms, and mode control.' },
    ],
    nextLessonId: 'lesson-07-seal-in',
    prerequisiteIds: ['lesson-05-parallel'],
  },

  {
    id: 'lesson-07-seal-in',
    title: 'Seal-In (Latch) Circuit',
    category: 'advanced',
    difficulty: 'intermediate',
    description: 'Classic motor start/stop using a seal-in contact — the most fundamental PLC pattern',
    theory: `# Seal-In (Self-Holding) Circuit

The **seal-in circuit** is one of the most important patterns in PLC programming. It uses the output's own contact in a parallel branch to keep itself energized after the start button is released.

## The Pattern
\`\`\`
──┤START (NO)├──┬──┤STOP (NC)├──(MOTOR Q0.0)──
                │
──┤Q0.0 (NO)├──┘
\`\`\`

## How it Works
1. Press START (I0.0): power flows through START → STOP → Q0.0 energizes
2. Q0.0 energizes: its own NO contact closes, creating an alternate path
3. Release START: the seal-in branch (Q0.0 contact) maintains power
4. Press STOP (I0.1 NC opens): power is blocked on BOTH branches → Q0.0 de-energizes → seal-in releases

## Why Use a Seal-In vs Set/Reset?
- The seal-in is **fail-safe**: if the STOP wire breaks, the motor stops
- Simpler for basic start/stop; Set/Reset is better for complex state management

## Note on STOP button wiring
In real systems, the physical STOP button is wired as NC (breaks the circuit when pressed). We simulate this here with an NC contact on I0.1.`,
    preloadedProgram: LESSON7_PROG,
    steps: [
      { id: 's1', instruction: 'Study the circuit: Branch 1 = START → STOP_NC → Motor. Branch 2 = Q0.0 (seal-in) → STOP_NC → Motor.', highlightRungs: ['r1'] },
      { id: 's2', instruction: 'Run the simulation. Toggle **I0.0 (Start)** ON — Q0.0 energizes.' },
      { id: 's3', instruction: 'Now toggle **I0.0 OFF** (release start). Q0.0 STAYS ON! The Q0.0 contact is holding itself in.', highlightElements: ['e3'] },
      { id: 's4', instruction: 'Toggle **I0.1 (Stop)** ON — the NC contact opens, breaking BOTH branches. Q0.0 turns OFF and releases.', highlightElements: ['e2', 'e4'] },
      { id: 's5', instruction: 'Toggle I0.1 back OFF. This is the classic motor starter circuit — used in virtually every factory.' },
    ],
    nextLessonId: 'lesson-08-ton',
    prerequisiteIds: ['lesson-05-parallel', 'lesson-03-nc-contact'],
  },

  {
    id: 'lesson-08-ton',
    title: 'TON Timer (ON Delay)',
    category: 'timers',
    difficulty: 'intermediate',
    description: 'Learn the Timer ON Delay — energizes output after a preset time of continuous input',
    theory: `# Timer ON Delay (TON)

The **TON (Timer ON Delay)** is the most common PLC timer. It delays turning an output ON.

## Behavior
- When rung power is ON → timer starts accumulating (ET = elapsed time)
- When ET ≥ PT (preset time) → timer Done (.DN) bit goes TRUE
- If rung power is removed BEFORE done → timer resets to 0 (non-retentive)

## Timer Bits
| Bit | Name | Description |
|-----|------|-------------|
| .EN | Enable | Rung is currently powered |
| .TT | Timing | Timer is counting (EN=1, DN=0) |
| .DN | Done | Accumulated ≥ Preset |

## Typical Usage
\`\`\`
Rung 1: ──┤I0.0├──[TON T0, PT=5s]──
Rung 2: ──┤T0.DN├──(Q0.0)──
\`\`\`
This turns Q0.0 ON 5 seconds after I0.0 goes ON.

## Reset
The TON resets automatically when rung power is removed. No separate reset rung needed.`,
    preloadedProgram: LESSON8_PROG,
    steps: [
      { id: 's1', instruction: 'This program has 2 rungs. Rung 1: I0.0 feeds a TON timer (T0, preset=3s). Rung 2: T0.DN feeds Q0.0.', highlightRungs: ['r1', 'r2'] },
      { id: 's2', instruction: 'Run the simulation. Toggle **I0.0 ON**. Watch the timer\'s ET (elapsed time) count up in the variable table!', highlightElements: ['e2'] },
      { id: 's3', instruction: 'After 3 seconds, the timer Done (T0.DN) bit goes TRUE — Q0.0 turns ON. You\'ll see T0 = "3.0/3.0s".' },
      { id: 's4', instruction: 'Toggle I0.0 OFF before the timer finishes. Notice the timer RESETS to 0! TON is non-retentive.' },
      { id: 's5', instruction: 'Toggle I0.0 ON again and wait 3 seconds for the full delay.' },
    ],
    nextLessonId: 'lesson-09-ctu',
    prerequisiteIds: ['lesson-06-set-reset'],
  },

  {
    id: 'lesson-09-ctu',
    title: 'Counter Up (CTU)',
    category: 'counters',
    difficulty: 'intermediate',
    description: 'Count events with the CTU counter — triggers done bit when accumulated count reaches preset',
    theory: `# Count Up Counter (CTU)

The **CTU (Count Up)** counter increments its accumulated value each time its input transitions from OFF to ON (rising edge).

## Behavior
- On each **rising edge** of rung power → ACC (accumulated) increments by 1
- When ACC ≥ PV (preset value) → .DN (done) bit goes TRUE
- Reset: Use a RESET coil on the counter address to clear ACC

## Counter Bits
| Bit | Description |
|-----|-------------|
| .DN | Done: ACC ≥ PV |
| .OV | Overflow: ACC exceeded max |
| ACC | Current accumulated count |
| PV  | Preset value (target count) |

## Common Pattern
\`\`\`
Rung 1: ──┤Pulse├──[CTU C0, PV=5]──   (count each pulse)
Rung 2: ──┤C0.DN├──(Q0.0)──           (output when done)
Rung 3: ──┤Reset├──(R C0)──           (reset counter)
\`\`\`

## Real-World Use
- Count parts on a conveyor
- Count machine cycles before maintenance alert
- Batch counting (fill 100 bottles, then stop)`,
    preloadedProgram: LESSON9_PROG,
    steps: [
      { id: 's1', instruction: 'This program counts 3 pulses of I0.0 before energizing Q0.0. Study all 3 rungs.' },
      { id: 's2', instruction: 'Run the simulation. Toggle **I0.0 ON then OFF** (one pulse). Watch C0 ACC increment to 1 in the variable table.' },
      { id: 's3', instruction: 'Repeat — pulse I0.0 twice more (total 3 pulses). When ACC=3 = PV=3, the DN bit fires and Q0.0 turns ON!', highlightElements: ['e2'] },
      { id: 's4', instruction: 'Toggle **I0.1** to reset the counter. ACC goes back to 0, DN clears, Q0.0 turns OFF.', highlightElements: ['e6'] },
    ],
    nextLessonId: 'lesson-10-edge',
    prerequisiteIds: ['lesson-04-series'],
  },

  {
    id: 'lesson-10-edge',
    title: 'Edge Detection Contacts',
    category: 'advanced',
    difficulty: 'intermediate',
    description: 'Use rising/falling edge contacts for one-shot triggering',
    theory: `# Edge Detection Contacts

Sometimes you need to detect a **transition** (the moment something changes state), not a steady-state condition. Edge contacts do exactly this.

## Rising Edge  ┤P├
Passes power for **exactly ONE scan cycle** when its bit transitions from 0→1.

## Falling Edge  ┤N├
Passes power for **exactly ONE scan cycle** when its bit transitions from 1→0.

## Why Use Edge Contacts?
Without edge detection, if you use a plain NO contact to count, it would increment the counter **every scan cycle** while the button is held — potentially thousands of counts per second.

With a **POS_EDGE** (rising edge) contact, it counts exactly once per button press, regardless of how long you hold it.

## Typical Use Cases
- Counting parts (one count per part, not per scan)
- Triggering a one-shot output pulse
- Detecting conveyor product arrival
- Detecting machine faults (transition to fault state)

## Example
\`\`\`
──┤P I0.0├──(Q0.0)──
\`\`\`
Q0.0 turns ON for ONE scan cycle each time I0.0 goes from 0→1`,
    preloadedProgram: LESSON10_PROG,
    steps: [
      { id: 's1', instruction: 'This rung uses a POS_EDGE contact on I0.0. The output Q0.0 will only pulse for ONE scan cycle on each button press.' },
      { id: 's2', instruction: 'Run the simulation with Step mode (click "Step" not "Run"). Click **Step** once — nothing happens (I0.0 still FALSE).' },
      { id: 's3', instruction: 'Toggle **I0.0 ON**, then click **Step** — Q0.0 turns ON for that one scan! Click Step again — Q0.0 turns OFF even though I0.0 is still ON.', highlightElements: ['e1'] },
      { id: 's4', instruction: 'The rising edge contact "sees" the 0→1 transition only on the first scan after the bit changes. Subsequent scans with the bit still ON do NOT trigger it.' },
    ],
    prerequisiteIds: ['lesson-04-series'],
  },

  {
    id: 'lesson-11-tof',
    title: 'TOF Timer (OFF Delay)',
    category: 'timers',
    difficulty: 'intermediate',
    description: 'The TOF timer keeps its output ON for a set time AFTER the input turns off',
    theory: `# Timer OFF Delay (TOF)

The **TOF (Timer OFF Delay)** is the mirror of the TON. It delays turning an output **OFF**.

## Behavior
- When rung power turns ON → output (.DN) turns ON **immediately** (no delay)
- When rung power turns OFF → timer starts counting
- When ET ≥ PT → output (.DN) turns OFF
- If rung power returns before timer completes → output stays ON, timer resets

## Key Difference from TON
| | TON | TOF |
|--|-----|-----|
| Output when input ON | Delayed ON | Immediate ON |
| Output when input OFF | Immediate OFF | Delayed OFF |

## Common Real-World Use
**Fan delay**: A machine fan should run for 30 seconds AFTER the machine shuts off (to cool down).
\`\`\`
Rung 1: ──┤Machine Running├──[TOF T1, PT=30s]──
Rung 2: ──┤T1.DN├──(Fan Motor)──
\`\`\`
- Machine ON → T1.DN immediately TRUE → Fan ON
- Machine OFF → T1 starts counting → After 30s → T1.DN FALSE → Fan OFF`,
    preloadedProgram: {
      id: 'p-tof', name: 'TOF Demo',
      rungs: [
        {
          id: 'r1', comment: 'I0.0 ON → TOF immediately ON, OFF → delays 3s',
          branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0' }] }],
          outputElements: [{ id: 'e2', type: 'TOF_TIMER', address: 'T0', preset: 3000 }],
        },
        {
          id: 'r2', comment: 'T0.DN drives output',
          branches: [{ id: 'b1', elements: [{ id: 'e3', type: 'NO_CONTACT', address: 'T0' }] }],
          outputElements: [{ id: 'e4', type: 'OUTPUT_COIL', address: 'Q0.0' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Enable'),
        'T0': { address: 'T0', area: 'T', name: 'Off Delay', type: 'TIMER', value: false, timerData: { preset: 3000, accumulated: 0, done: false, timing: false, enabled: false, timerType: 'TOF' } },
        'Q0.0': makeVar('Q0.0', 'Q', 'Output'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Run the simulation. Toggle **I0.0 ON** — notice Q0.0 turns ON **immediately** (TOF difference from TON).' },
      { id: 's2', instruction: 'Now toggle **I0.0 OFF**. Watch the timer start counting. Q0.0 STAYS ON while T0 counts up!' },
      { id: 's3', instruction: 'After 3 seconds, T0 reaches its preset → T0.DN goes FALSE → Q0.0 turns OFF.' },
      { id: 's4', instruction: 'Toggle I0.0 back ON before 3s elapses — Q0.0 stays ON and the timer resets.' },
    ],
    prerequisiteIds: ['lesson-08-ton'],
  },

  {
    id: 'lesson-12-combining',
    title: 'Combining Patterns',
    category: 'advanced',
    difficulty: 'advanced',
    description: 'Build a complete sequence: start/stop with timer and counter',
    theory: `# Combining Patterns: A Complete Control Sequence

Real PLC programs combine multiple patterns. Let's design a simple **batch control system**:

## Specification
- Press START (I0.0) → start motor (Q0.0)
- Motor runs for 5 seconds → stops automatically
- After 3 complete cycles → alarm light (Q0.1) turns on
- Press RESET (I0.1) → clear counter, acknowledge alarm

## Solution Structure

**Rung 1: Start/Stop with seal-in**
\`\`\`
──┤START├──┬──┤STOP NC├──┤T0.DN NC├──(Q0.0 Motor)──
           │
──┤Q0.0├───┘
\`\`\`

**Rung 2: Run timer while motor runs**
\`\`\`
──┤Q0.0├──[TON T0, PT=5s]──
\`\`\`

**Rung 3: Count completed cycles (timer done edge)**
\`\`\`
──┤P T0.DN├──[CTU C0, PV=3]──
\`\`\`

**Rung 4: Alarm when count done**
\`\`\`
──┤C0.DN├──(Q0.1 Alarm)──
\`\`\`

**Rung 5: Reset counter**
\`\`\`
──┤RESET├──(R C0)──
\`\`\`

This demonstrates how ladder logic programs grow organically — each requirement adds one or two rungs.`,
    preloadedProgram: {
      id: 'p-combo', name: 'Batch Control',
      rungs: [
        {
          id: 'r1', comment: 'Motor start/stop with auto-stop',
          branches: [
            { id: 'b1', elements: [
              { id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'START' },
              { id: 'e2', type: 'NC_CONTACT', address: 'I0.1', label: 'STOP' },
              { id: 'e3', type: 'NC_CONTACT', address: 'T0', label: 'Timer Done' },
            ]},
            { id: 'b2', elements: [
              { id: 'e4', type: 'NO_CONTACT', address: 'Q0.0', label: 'Seal-in' },
              { id: 'e5', type: 'NC_CONTACT', address: 'I0.1', label: 'STOP' },
              { id: 'e6', type: 'NC_CONTACT', address: 'T0', label: 'Timer Done' },
            ]},
          ],
          outputElements: [{ id: 'e7', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Motor' }],
        },
        {
          id: 'r2', comment: 'Timer runs while motor is on',
          branches: [{ id: 'b1', elements: [{ id: 'e8', type: 'NO_CONTACT', address: 'Q0.0' }] }],
          outputElements: [{ id: 'e9', type: 'TON_TIMER', address: 'T0', preset: 5000 }],
        },
        {
          id: 'r3', comment: 'Count completed cycles',
          branches: [{ id: 'b1', elements: [{ id: 'ea', type: 'POS_EDGE', address: 'T0', label: 'Cycle done' }] }],
          outputElements: [{ id: 'eb', type: 'CTU_COUNTER', address: 'C0', preset: 3 }],
        },
        {
          id: 'r4', comment: 'Alarm after 3 cycles',
          branches: [{ id: 'b1', elements: [{ id: 'ec', type: 'NO_CONTACT', address: 'C0' }] }],
          outputElements: [{ id: 'ed', type: 'OUTPUT_COIL', address: 'Q0.1', label: 'Alarm' }],
        },
        {
          id: 'r5', comment: 'Reset counter',
          branches: [{ id: 'b1', elements: [{ id: 'ee', type: 'NO_CONTACT', address: 'I0.1', label: 'RESET' }] }],
          outputElements: [{ id: 'ef', type: 'RESET_COIL', address: 'C0' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'START'),
        'I0.1': makeVar('I0.1', 'I', 'STOP/RESET'),
        'Q0.0': makeVar('Q0.0', 'Q', 'Motor'),
        'Q0.1': makeVar('Q0.1', 'Q', 'Alarm Light'),
        'T0': { address: 'T0', area: 'T', name: 'Run Timer', type: 'TIMER', value: false, timerData: { preset: 5000, accumulated: 0, done: false, timing: false, enabled: false, timerType: 'TON' } },
        'C0': { address: 'C0', area: 'C', name: 'Cycle Counter', type: 'COUNTER', value: false, counterData: { preset: 3, accumulated: 0, done: false, overflow: false, underflow: false, counterType: 'CTU' } },
      },
    },
    steps: [
      { id: 's1', instruction: 'This is a complete batch control program with 5 rungs. Read each rung\'s comment to understand its purpose.' },
      { id: 's2', instruction: 'Run the simulation. Toggle **I0.0 (START)** briefly — the motor latches ON.' },
      { id: 's3', instruction: 'Watch the timer T0 count up to 5s. When done, T0.DN goes TRUE, which BREAKS the motor circuit (NC contact) and auto-stops the motor. C0 increments by 1.' },
      { id: 's4', instruction: 'Toggle START again for 2 more cycles (6 total motor starts / 3 timer completions). After the 3rd cycle done, C0.DN fires and Q0.1 (Alarm) turns ON!' },
      { id: 's5', instruction: 'Toggle I0.1 to reset the counter and clear the alarm. This is a real industrial pattern for batch counting.' },
    ],
    prerequisiteIds: ['lesson-07-seal-in', 'lesson-08-ton', 'lesson-09-ctu'],
  },

  // ─────────────────────────── ADVANCED LESSONS ────────────────────────────

  {
    id: 'lesson-13-ctd',
    title: 'Count Down Counter (CTD)',
    category: 'counters',
    difficulty: 'intermediate',
    description: 'Learn the CTD counter — starts at a preset and counts down to zero',
    theory: `# Count Down Counter (CTD)

The **CTD (Count Down)** counter is the reverse of CTU. It starts at a preset value and decrements on each rising edge.

## Behavior
- **Load**: When a SET coil writes to the counter address, ACC is set to the preset
- On each **rising edge** of rung power → ACC decrements by 1
- When ACC ≤ 0 → .DN (done) bit goes TRUE
- If ACC tries to go below 0 → .UN (underflow) bit goes TRUE

## CTD vs CTU
| | CTU | CTD |
|--|-----|-----|
| Counts | Up from 0 | Down from preset |
| Done when | ACC ≥ PV | ACC ≤ 0 |
| Reset | RESET coil | SET coil (reloads PV) |

## Real-World Use
- **Dispensing**: Load 10 items, count down as each is dispensed
- **Shift quota**: Start at 500 parts, count down to 0 = shift done
- **Batch remaining**: "5 parts remaining in this batch"

## Loading the Counter
Use a SET coil on the counter address to reload it to PV:
\`\`\`
Rung 1: ──┤Load Input├──(S C0)──    (loads ACC = PV = 5)
Rung 2: ──┤Count Pulse├──[CTD C0, PV=5]──
Rung 3: ──┤C0.DN├──(Q0.0 Done)──
\`\`\``,
    preloadedProgram: {
      id: 'p-ctd', name: 'CTD Counter Demo',
      rungs: [
        {
          id: 'r1', comment: 'Load/reload counter to preset',
          branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.2', label: 'Load' }] }],
          outputElements: [{ id: 'e2', type: 'SET_COIL', address: 'C0' }],
        },
        {
          id: 'r2', comment: 'Count down on each pulse',
          branches: [{ id: 'b1', elements: [{ id: 'e3', type: 'NO_CONTACT', address: 'I0.0', label: 'Count Pulse' }] }],
          outputElements: [{ id: 'e4', type: 'CTD_COUNTER', address: 'C0', preset: 5 }],
        },
        {
          id: 'r3', comment: 'Done when count reaches zero',
          branches: [{ id: 'b1', elements: [{ id: 'e5', type: 'NO_CONTACT', address: 'C0', label: 'C0.DN' }] }],
          outputElements: [{ id: 'e6', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Done' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Count Pulse'),
        'I0.2': makeVar('I0.2', 'I', 'Load Counter'),
        'C0': { address: 'C0', area: 'C', name: 'Countdown', type: 'COUNTER', value: false, counterData: { preset: 5, accumulated: 0, done: false, overflow: false, underflow: false, counterType: 'CTD' } },
        'Q0.0': makeVar('Q0.0', 'Q', 'All Done'),
      },
    },
    steps: [
      { id: 's1', instruction: 'This CTD counter starts at 5 and counts down. First, Run the simulation and toggle **I0.2 (Load)** ON briefly to load the counter — ACC becomes 5.' },
      { id: 's2', instruction: 'Now pulse **I0.0 (Count Pulse)** — toggle ON then OFF. Watch ACC decrease: 5 → 4 → 3...' },
      { id: 's3', instruction: 'Keep pulsing I0.0. After 5 pulses, ACC=0 and the DN bit fires, turning ON Q0.0 (Done signal).' },
      { id: 's4', instruction: 'Toggle I0.2 again to reload (ACC returns to 5, DN clears). CTD is perfect for dispense-and-reload patterns.' },
    ],
    nextLessonId: 'lesson-14-memory-bits',
    prerequisiteIds: ['lesson-09-ctu'],
  },

  {
    id: 'lesson-14-memory-bits',
    title: 'Memory Bits (M Addresses)',
    category: 'contacts_coils',
    difficulty: 'intermediate',
    description: 'Use internal memory bits (M0.0–M7.7) as flags and intermediate variables',
    theory: `# Memory Bits — Internal Boolean Flags

**Memory bits** (M addresses: M0.0 through M7.7) are internal boolean variables with no physical connection. They act as "scratch pad" storage inside the PLC.

## Why Use Memory Bits?
- Store intermediate results that are used in multiple rungs
- Create flags: "has the fault been acknowledged?", "is the system in auto mode?"
- Avoid using expensive output addresses for internal logic
- Build readable, modular programs

## Address Range
\`\`\`
M0.0 – M0.7   (byte 0)
M1.0 – M1.7   (byte 1)
...up to M7.7
\`\`\`

## Pattern: Mode Flag
\`\`\`
Rung 1: ──┤Auto Mode Button├──(S M0.0)──  (set AUTO flag)
Rung 2: ──┤Manual Button├──(R M0.0)──     (clear AUTO flag)
Rung 3: ──┤M0.0├──┤Sensor├──(Motor)──     (motor runs only in AUTO)
\`\`\`

## Pattern: One-Shot with Memory
Edge contacts work well with memory bits to create latched one-shots without consuming Q outputs.`,
    preloadedProgram: {
      id: 'p-mem', name: 'Memory Bit Demo',
      rungs: [
        {
          id: 'r1', comment: 'Set AUTO mode flag',
          branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Auto Btn' }] }],
          outputElements: [{ id: 'e2', type: 'SET_COIL', address: 'M0.0' }],
        },
        {
          id: 'r2', comment: 'Clear AUTO mode flag',
          branches: [{ id: 'b1', elements: [{ id: 'e3', type: 'NO_CONTACT', address: 'I0.1', label: 'Manual Btn' }] }],
          outputElements: [{ id: 'e4', type: 'RESET_COIL', address: 'M0.0' }],
        },
        {
          id: 'r3', comment: 'Motor runs only when AUTO and sensor active',
          branches: [{ id: 'b1', elements: [
            { id: 'e5', type: 'NO_CONTACT', address: 'M0.0', label: 'AUTO' },
            { id: 'e6', type: 'NO_CONTACT', address: 'I0.2', label: 'Sensor' },
          ]}],
          outputElements: [{ id: 'e7', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Motor' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Auto Button'),
        'I0.1': makeVar('I0.1', 'I', 'Manual Button'),
        'I0.2': makeVar('I0.2', 'I', 'Run Sensor'),
        'M0.0': makeVar('M0.0', 'M', 'AUTO Mode Flag'),
        'Q0.0': makeVar('Q0.0', 'Q', 'Motor'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Run the simulation. Notice the motor (Q0.0) is OFF even if I0.2 is ON — because M0.0 (AUTO flag) is not set yet.' },
      { id: 's2', instruction: 'Toggle **I0.0 (Auto Button)** ON briefly. M0.0 latches TRUE — the system is now in AUTO mode.', highlightElements: ['e2'] },
      { id: 's3', instruction: 'Now toggle **I0.2 (Sensor)** ON. Q0.0 runs! Both conditions (AUTO and sensor) are met.', highlightElements: ['e5', 'e6'] },
      { id: 's4', instruction: 'Toggle **I0.1 (Manual Button)** ON — M0.0 clears, motor stops even with sensor still ON. Memory bits are perfect for mode control.' },
    ],
    nextLessonId: 'lesson-15-flasher',
    prerequisiteIds: ['lesson-06-set-reset'],
  },

  {
    id: 'lesson-15-flasher',
    title: 'Flasher / Oscillator Circuit',
    category: 'timers',
    difficulty: 'intermediate',
    description: 'Build a self-resetting timer that creates a repeating ON/OFF pulse',
    theory: `# Flasher (Oscillator) Circuit

A **flasher** creates a repeating ON/OFF cycle without any external input. It's built using a TON timer that resets itself when it completes.

## The Pattern
\`\`\`
Rung 1: ──┤T0.DN NC├──[TON T0, PT=1s]──
Rung 2: ──┤T0.DN├──(Q0.0 Flash)──
\`\`\`

## How it Works
1. T0.DN starts FALSE → NC contact is CLOSED → timer starts
2. After 1 second → T0.DN goes TRUE
3. T0.DN TRUE → NC contact OPENS → timer loses power → RESETS
4. Timer reset → T0.DN goes FALSE → NC contact CLOSES → timer starts again
5. Repeat forever!

## Duty Cycle
The ON time of Q0.0 is exactly **one scan cycle** (very short pulse), while the OFF time is the preset.

For a symmetric 50% duty cycle (equal ON and OFF), use two timers:
\`\`\`
T0 (ON timer): controls ON phase
T1 (OFF timer): controls OFF phase
\`\`\`

## Real-World Uses
- Flashing warning lights
- Heartbeat indicators
- Periodic machine checks
- Timed sequences where you need a clock signal`,
    preloadedProgram: {
      id: 'p-flash', name: 'Flasher Circuit',
      rungs: [
        {
          id: 'r1', comment: 'Self-resetting timer — NC on own done bit',
          branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NC_CONTACT', address: 'T0', label: 'T0.DN NC' }] }],
          outputElements: [{ id: 'e2', type: 'TON_TIMER', address: 'T0', preset: 1000 }],
        },
        {
          id: 'r2', comment: 'Output flashes at 1-second intervals',
          branches: [{ id: 'b1', elements: [{ id: 'e3', type: 'NO_CONTACT', address: 'T0', label: 'T0.DN' }] }],
          outputElements: [{ id: 'e4', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Flash Light' }],
        },
      ],
      variables: {
        'T0': { address: 'T0', area: 'T', name: 'Flash Timer', type: 'TIMER', value: false, timerData: { preset: 1000, accumulated: 0, done: false, timing: false, enabled: false, timerType: 'TON' } },
        'Q0.0': makeVar('Q0.0', 'Q', 'Flash Light'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Notice Rung 1 uses the NC contact of T0.DN to feed the TON timer. When T0.DN is FALSE, the NC contact is CLOSED, so the timer runs.' },
      { id: 's2', instruction: 'Run the simulation. Watch T0 count up to 1 second. When it hits the preset, T0.DN briefly goes TRUE.' },
      { id: 's3', instruction: 'When T0.DN is TRUE: the NC contact on Rung 1 opens (timer resets) AND Rung 2\'s NO contact closes (Q0.0 flashes ON for one scan).', highlightElements: ['e1', 'e3'] },
      { id: 's4', instruction: 'The cycle then repeats automatically. Q0.0 flashes once per second. Change the T0 preset (double-click the timer element) to speed it up or slow it down.' },
    ],
    nextLessonId: 'lesson-16-tof-application',
    prerequisiteIds: ['lesson-08-ton', 'lesson-03-nc-contact'],
  },

  {
    id: 'lesson-16-tof-application',
    title: 'TOF Real-World Application',
    category: 'timers',
    difficulty: 'intermediate',
    description: 'Apply the TOF timer to a fan overrun delay and conveyor coast-down',
    theory: `# TOF Applications: Fan Delay & Coast-Down

The TOF timer shines in "keep running after the command goes away" scenarios.

## Application 1: Cooling Fan Overrun
A machine motor generates heat. The cooling fan should run for 60 seconds after the motor stops:
\`\`\`
Rung 1: ──┤Motor Running├──[TOF T1, PT=60s]──
Rung 2: ──┤T1.DN├──(Fan Motor)──
\`\`\`
- Motor ON → T1.DN immediately ON → Fan ON
- Motor OFF → T1 starts counting → Fan stays ON 60s → Fan OFF

## Application 2: Warning Light Coast-Down
After pressing E-Stop, flash a warning for 10 seconds:
\`\`\`
Rung 1: ──┤E-Stop NC├──[TOF T2, PT=10s]──
Rung 2: ──┤T2.DN├──┤Flash Clock├──(Warning Light)──
\`\`\`

## Application 3: Seal-In with Timeout
A valve should auto-close 30 seconds after losing a sensor signal:
\`\`\`
Rung 1: ──┤Sensor├──[TOF T3, PT=30s]──
Rung 2: ──┤T3.DN├──(Valve Open)──
\`\`\`

## Key Insight
TOF lets you add **hysteresis** (minimum ON time) to avoid rapid on/off cycling — a common technique for motors, compressors, and HVAC systems.`,
    preloadedProgram: {
      id: 'p-tof-app', name: 'Fan Overrun Delay',
      rungs: [
        {
          id: 'r1', comment: 'Machine running signal feeds TOF',
          branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Machine Run' }] }],
          outputElements: [{ id: 'e2', type: 'TOF_TIMER', address: 'T0', preset: 5000 }],
        },
        {
          id: 'r2', comment: 'Fan runs while T0.DN is ON',
          branches: [{ id: 'b1', elements: [{ id: 'e3', type: 'NO_CONTACT', address: 'T0', label: 'T0.DN' }] }],
          outputElements: [{ id: 'e4', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Fan Motor' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Machine Running'),
        'T0': { address: 'T0', area: 'T', name: 'Fan Overrun', type: 'TIMER', value: false, timerData: { preset: 5000, accumulated: 0, done: false, timing: false, enabled: false, timerType: 'TOF' } },
        'Q0.0': makeVar('Q0.0', 'Q', 'Fan Motor'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Run the simulation. Toggle **I0.0 (Machine Running)** ON. Fan (Q0.0) turns ON immediately — no delay.' },
      { id: 's2', instruction: 'Toggle I0.0 OFF (machine stopped). Watch T0 start counting 5 seconds. Q0.0 (fan) STAYS ON during the countdown.' },
      { id: 's3', instruction: 'After 5 seconds, T0.DN goes FALSE and the fan finally turns OFF. This is the "overrun" that prevents heat buildup.' },
      { id: 's4', instruction: 'Try turning the machine back ON before the 5s delay finishes. The timer resets and the fan stays on — no blip.' },
    ],
    nextLessonId: 'lesson-17-dual-station',
    prerequisiteIds: ['lesson-11-tof'],
  },

  {
    id: 'lesson-17-dual-station',
    title: 'Dual Station Motor Control',
    category: 'advanced',
    difficulty: 'intermediate',
    description: 'Control one motor from two separate operator stations using OR logic',
    theory: `# Dual Station (Remote) Motor Control

In industrial settings, large machines often have **multiple operator stations** — one at each end of a conveyor, or at different floor levels. Any station should be able to start or stop the machine.

## Wiring Logic
- **Two START buttons** in parallel (OR) — either can start
- **Two STOP buttons** in series (AND) — either can stop (each wired NC)
- **Seal-in contact** as usual

## Ladder Diagram
\`\`\`
Station 1 START (I0.0) ──┬──┤STOP1 NC├──┤STOP2 NC├──(Motor Q0.0)
Station 2 START (I0.1) ──┤
Q0.0 Seal-in ────────────┘
\`\`\`

## Safety Rule for STOP Buttons
STOP buttons are **always in series** (AND). This means:
- Either stop button can halt the machine
- Both must be released for the machine to start
- If either STOP wire breaks → machine stops (fail-safe!)

## Why Not STOP in Parallel?
If STOPs were in parallel, both would have to be pressed simultaneously to stop the machine — impossible with one operator, and dangerous.`,
    preloadedProgram: {
      id: 'p-dual', name: 'Dual Station Control',
      rungs: [
        {
          id: 'r1', comment: 'Two STARTs in parallel, two STOPs in series',
          branches: [
            { id: 'b1', elements: [
              { id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'START-1' },
              { id: 'e3', type: 'NC_CONTACT', address: 'I0.2', label: 'STOP-1' },
              { id: 'e4', type: 'NC_CONTACT', address: 'I0.3', label: 'STOP-2' },
            ]},
            { id: 'b2', elements: [
              { id: 'e2', type: 'NO_CONTACT', address: 'I0.1', label: 'START-2' },
              { id: 'e5', type: 'NC_CONTACT', address: 'I0.2', label: 'STOP-1' },
              { id: 'e6', type: 'NC_CONTACT', address: 'I0.3', label: 'STOP-2' },
            ]},
            { id: 'b3', elements: [
              { id: 'e7', type: 'NO_CONTACT', address: 'Q0.0', label: 'Seal-in' },
              { id: 'e8', type: 'NC_CONTACT', address: 'I0.2', label: 'STOP-1' },
              { id: 'e9', type: 'NC_CONTACT', address: 'I0.3', label: 'STOP-2' },
            ]},
          ],
          outputElements: [{ id: 'ea', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Motor' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Start Station 1'),
        'I0.1': makeVar('I0.1', 'I', 'Start Station 2'),
        'I0.2': makeVar('I0.2', 'I', 'Stop Station 1'),
        'I0.3': makeVar('I0.3', 'I', 'Stop Station 2'),
        'Q0.0': makeVar('Q0.0', 'Q', 'Motor'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Study the 3 parallel branches: Branch 1=Start1+Stops, Branch 2=Start2+Stops, Branch 3=Seal-in+Stops.' },
      { id: 's2', instruction: 'Run the simulation. Toggle **I0.0 (Start-1)** — motor starts. Release I0.0 — motor seals in.' },
      { id: 's3', instruction: 'Toggle **I0.2 (Stop-1)** — motor stops. Now start again with **I0.1 (Start-2)** from the other station.' },
      { id: 's4', instruction: 'With motor running, toggle **I0.3 (Stop-2)** — motor stops. Either stop station works independently.' },
    ],
    nextLessonId: 'lesson-18-tank-level',
    prerequisiteIds: ['lesson-07-seal-in'],
  },

  {
    id: 'lesson-18-tank-level',
    title: 'Tank Level Control (Hysteresis)',
    category: 'advanced',
    difficulty: 'intermediate',
    description: 'Automatic pump control using high/low level sensors with Set/Reset latching',
    theory: `# Tank Level Control with Hysteresis

Automatic fill/drain control is one of the most common PLC applications. The challenge is **preventing rapid on/off cycling** (hunting) when the level is near the setpoint.

## Solution: Two-Level Hysteresis
Use a **HIGH level** sensor and a **LOW level** sensor:
- Fill pump turns ON when level drops to LOW
- Fill pump turns OFF when level reaches HIGH
- The "dead band" between LOW and HIGH prevents hunting

## Ladder Using Set/Reset
\`\`\`
Rung 1: ──┤Low Level Sensor├──(S Q0.0)──   (start pump)
Rung 2: ──┤High Level Sensor├──(R Q0.0)──  (stop pump)
\`\`\`

## Behavior
| Condition | Action |
|-----------|--------|
| Level below LOW sensor | Pump starts |
| Level between LOW and HIGH | Pump continues (latched ON) |
| Level reaches HIGH sensor | Pump stops |
| Level drops to LOW again | Pump starts |

## Real System Addition
Add an overflow sensor (very top) that triggers an alarm and closes the inlet valve as a safety backup.`,
    preloadedProgram: {
      id: 'p-tank', name: 'Tank Level Control',
      rungs: [
        {
          id: 'r1', comment: 'Low level sensor triggers pump start',
          branches: [{ id: 'b1', elements: [
            { id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Low Sensor' },
            { id: 'e2', type: 'NC_CONTACT', address: 'I0.2', label: 'Overflow' },
          ]}],
          outputElements: [{ id: 'e3', type: 'SET_COIL', address: 'Q0.0' }],
        },
        {
          id: 'r2', comment: 'High level sensor stops pump',
          branches: [{ id: 'b1', elements: [{ id: 'e4', type: 'NO_CONTACT', address: 'I0.1', label: 'High Sensor' }] }],
          outputElements: [{ id: 'e5', type: 'RESET_COIL', address: 'Q0.0' }],
        },
        {
          id: 'r3', comment: 'Overflow alarm (emergency)',
          branches: [{ id: 'b1', elements: [{ id: 'e6', type: 'NO_CONTACT', address: 'I0.2', label: 'Overflow' }] }],
          outputElements: [{ id: 'e7', type: 'OUTPUT_COIL', address: 'Q0.1', label: 'Alarm' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Low Level Sensor'),
        'I0.1': makeVar('I0.1', 'I', 'High Level Sensor'),
        'I0.2': makeVar('I0.2', 'I', 'Overflow Sensor'),
        'Q0.0': makeVar('Q0.0', 'Q', 'Fill Pump'),
        'Q0.1': makeVar('Q0.1', 'Q', 'Overflow Alarm'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Run the simulation. Toggle **I0.0 (Low Level Sensor)** ON — the SET coil latches Q0.0 (pump) ON.' },
      { id: 's2', instruction: 'Toggle I0.0 back OFF (tank filling, sensor no longer detecting low). Pump STAYS ON due to SET latch.' },
      { id: 's3', instruction: 'Toggle **I0.1 (High Level Sensor)** ON — RESET coil turns pump OFF. Tank is full.' },
      { id: 's4', instruction: 'Toggle I0.1 OFF (normal — high sensor just triggered momentarily). Pump stays OFF. Toggle I0.0 ON to start the cycle again.' },
      { id: 's5', instruction: 'Try the safety: toggle **I0.2 (Overflow)** ON — pump is blocked from starting AND the alarm fires.' },
    ],
    nextLessonId: 'lesson-19-sequencer',
    prerequisiteIds: ['lesson-06-set-reset', 'lesson-14-memory-bits'],
  },

  {
    id: 'lesson-19-sequencer',
    title: '3-Step Process Sequencer',
    category: 'advanced',
    difficulty: 'advanced',
    description: 'Build a timed 3-step sequence using memory bits as step flags',
    theory: `# Step Sequencer with Memory Bits

A **sequencer** runs a process through a fixed series of steps in order — one at a time. This pattern appears constantly in manufacturing: wash → rinse → dry; mix → heat → cool; extend → wait → retract.

## Design Pattern: Memory Bit per Step
Each step is represented by a memory bit (M0.x):
- Only one step bit is ON at a time
- A timer in each step triggers transition to the next step
- The last step transitions back to idle (or back to step 1 for a cycle)

## 3-Step Example
\`\`\`
Step 1 (M0.0): Mix — runs motor for 5s → Set M0.1, Reset M0.0
Step 2 (M0.1): Heat — runs heater for 10s → Set M0.2, Reset M0.1
Step 3 (M0.2): Cool — runs fan for 8s → Reset M0.2 (back to idle)
\`\`\`

## Transition Logic
\`\`\`
Step 1 timer done → ┤M0.0├──┤T0.DN├──(S M0.1)── and ──(R M0.0)──
\`\`\`

## Why Not Use Counters?
Sequencers with different outputs per step are clearer with memory bits. Counters are better when each step is identical.`,
    preloadedProgram: {
      id: 'p-seq', name: '3-Step Sequencer',
      rungs: [
        {
          id: 'r1', comment: 'START: Set Step 1 flag',
          branches: [{ id: 'b1', elements: [
            { id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'START' },
            { id: 'e2', type: 'NC_CONTACT', address: 'M0.0', label: 'Not Step1' },
            { id: 'e3', type: 'NC_CONTACT', address: 'M0.1', label: 'Not Step2' },
            { id: 'e4', type: 'NC_CONTACT', address: 'M0.2', label: 'Not Step3' },
          ]}],
          outputElements: [{ id: 'e5', type: 'SET_COIL', address: 'M0.0' }],
        },
        {
          id: 'r2', comment: 'Step 1 timer (3 seconds)',
          branches: [{ id: 'b1', elements: [{ id: 'e6', type: 'NO_CONTACT', address: 'M0.0', label: 'Step 1' }] }],
          outputElements: [{ id: 'e7', type: 'TON_TIMER', address: 'T0', preset: 3000 }],
        },
        {
          id: 'r3', comment: 'Step 1 output: Mixer runs',
          branches: [{ id: 'b1', elements: [{ id: 'e8', type: 'NO_CONTACT', address: 'M0.0', label: 'Step 1' }] }],
          outputElements: [{ id: 'e9', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Mixer' }],
        },
        {
          id: 'r4', comment: 'Transition: Step 1 → Step 2',
          branches: [{ id: 'b1', elements: [
            { id: 'ea', type: 'NO_CONTACT', address: 'M0.0', label: 'Step1' },
            { id: 'eb', type: 'NO_CONTACT', address: 'T0', label: 'T0.DN' },
          ]}],
          outputElements: [{ id: 'ec', type: 'SET_COIL', address: 'M0.1' }],
        },
        {
          id: 'r5', comment: 'Clear Step 1 when advancing',
          branches: [{ id: 'b1', elements: [
            { id: 'ed', type: 'NO_CONTACT', address: 'M0.0', label: 'Step1' },
            { id: 'ee', type: 'NO_CONTACT', address: 'T0', label: 'T0.DN' },
          ]}],
          outputElements: [{ id: 'ef', type: 'RESET_COIL', address: 'M0.0' }],
        },
        {
          id: 'r6', comment: 'Step 2 timer (4 seconds)',
          branches: [{ id: 'b1', elements: [{ id: 'e10', type: 'NO_CONTACT', address: 'M0.1', label: 'Step 2' }] }],
          outputElements: [{ id: 'e11', type: 'TON_TIMER', address: 'T1', preset: 4000 }],
        },
        {
          id: 'r7', comment: 'Step 2 output: Heater on',
          branches: [{ id: 'b1', elements: [{ id: 'e12', type: 'NO_CONTACT', address: 'M0.1', label: 'Step 2' }] }],
          outputElements: [{ id: 'e13', type: 'OUTPUT_COIL', address: 'Q0.1', label: 'Heater' }],
        },
        {
          id: 'r8', comment: 'Transition: Step 2 → Step 3',
          branches: [{ id: 'b1', elements: [
            { id: 'e14', type: 'NO_CONTACT', address: 'M0.1', label: 'Step2' },
            { id: 'e15', type: 'NO_CONTACT', address: 'T1', label: 'T1.DN' },
          ]}],
          outputElements: [{ id: 'e16', type: 'SET_COIL', address: 'M0.2' }],
        },
        {
          id: 'r9', comment: 'Clear Step 2 when advancing',
          branches: [{ id: 'b1', elements: [
            { id: 'e17', type: 'NO_CONTACT', address: 'M0.1', label: 'Step2' },
            { id: 'e18', type: 'NO_CONTACT', address: 'T1', label: 'T1.DN' },
          ]}],
          outputElements: [{ id: 'e19', type: 'RESET_COIL', address: 'M0.1' }],
        },
        {
          id: 'r10', comment: 'Step 3 timer (3 seconds)',
          branches: [{ id: 'b1', elements: [{ id: 'e20', type: 'NO_CONTACT', address: 'M0.2', label: 'Step 3' }] }],
          outputElements: [{ id: 'e21', type: 'TON_TIMER', address: 'T2', preset: 3000 }],
        },
        {
          id: 'r11', comment: 'Step 3 output: Fan on',
          branches: [{ id: 'b1', elements: [{ id: 'e22', type: 'NO_CONTACT', address: 'M0.2', label: 'Step 3' }] }],
          outputElements: [{ id: 'e23', type: 'OUTPUT_COIL', address: 'Q0.2', label: 'Fan' }],
        },
        {
          id: 'r12', comment: 'Step 3 done — reset all',
          branches: [{ id: 'b1', elements: [
            { id: 'e24', type: 'NO_CONTACT', address: 'M0.2', label: 'Step3' },
            { id: 'e25', type: 'NO_CONTACT', address: 'T2', label: 'T2.DN' },
          ]}],
          outputElements: [{ id: 'e26', type: 'RESET_COIL', address: 'M0.2' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'START'),
        'M0.0': makeVar('M0.0', 'M', 'Step 1 Active'),
        'M0.1': makeVar('M0.1', 'M', 'Step 2 Active'),
        'M0.2': makeVar('M0.2', 'M', 'Step 3 Active'),
        'T0': { address: 'T0', area: 'T', name: 'Step 1 Timer', type: 'TIMER', value: false, timerData: { preset: 3000, accumulated: 0, done: false, timing: false, enabled: false, timerType: 'TON' } },
        'T1': { address: 'T1', area: 'T', name: 'Step 2 Timer', type: 'TIMER', value: false, timerData: { preset: 4000, accumulated: 0, done: false, timing: false, enabled: false, timerType: 'TON' } },
        'T2': { address: 'T2', area: 'T', name: 'Step 3 Timer', type: 'TIMER', value: false, timerData: { preset: 3000, accumulated: 0, done: false, timing: false, enabled: false, timerType: 'TON' } },
        'Q0.0': makeVar('Q0.0', 'Q', 'Mixer'),
        'Q0.1': makeVar('Q0.1', 'Q', 'Heater'),
        'Q0.2': makeVar('Q0.2', 'Q', 'Fan'),
      },
    },
    steps: [
      { id: 's1', instruction: 'This 12-rung program runs a 3-step timed sequence: Mixer (3s) → Heater (4s) → Fan (3s). Read the rung comments to understand the structure.' },
      { id: 's2', instruction: 'Run the simulation. Toggle **I0.0 (START)** briefly. M0.0 (Step 1) sets, and Q0.0 (Mixer) turns ON. T0 starts counting.' },
      { id: 's3', instruction: 'After 3 seconds, T0.DN fires: M0.1 (Step 2) is SET, M0.0 is RESET. Q0.0 turns OFF, Q0.1 (Heater) turns ON. T1 begins.' },
      { id: 's4', instruction: 'After 4 more seconds, Step 3 activates: Q0.1 OFF, Q0.2 (Fan) ON. After 3s, M0.2 is reset. System returns to idle — ready for another cycle.' },
      { id: 's5', instruction: 'Observe the Variable Table — only ONE step flag is ON at a time. This mutual exclusion is the key to reliable sequencers.' },
    ],
    nextLessonId: 'lesson-20-alarm-ack',
    prerequisiteIds: ['lesson-14-memory-bits', 'lesson-08-ton'],
  },

  {
    id: 'lesson-20-alarm-ack',
    title: 'Alarm with Acknowledgement',
    category: 'advanced',
    difficulty: 'advanced',
    description: 'Build a fault alarm that requires operator acknowledgement before it can be cleared',
    theory: `# Alarm with Acknowledgement

Industrial alarms need careful logic. A simple NC contact on a fault isn't enough — you need the operator to **actively acknowledge** the fault before the system can restart.

## Requirements
1. When a fault occurs → alarm lamp flashes
2. Operator presses ACK button → lamp goes steady (alarm acknowledged)
3. When fault clears AND alarm is acknowledged → lamp goes OFF, system can restart

## Pattern: Two Memory Bits
- **M0.0**: Fault Latched (SET by fault, RESET when fault clears AND acked)
- **M0.1**: Acknowledged (SET by ACK button, RESET when fault clears)

## Ladder Structure
\`\`\`
Rung 1: ──┤Fault├──(S M0.0)──            Latch fault
Rung 2: ──┤ACK Button├──┤M0.0├──(S M0.1)──  Acknowledge
Rung 3: ──┤Fault NC├──┤M0.1├──(R M0.0)── Clear when resolved+acked
Rung 4: ──┤Fault NC├──(R M0.1)──         Clear ack when fault gone
Rung 5: ──┤M0.0├──┤M0.1 NC├──┤Flash├──(Alarm)── Flash if unacked
Rung 6: ──┤M0.0├──┤M0.1├──(Alarm)──       Steady if acked
\`\`\`

## Why This Matters
Without acknowledgement, an alarm could clear automatically the moment the fault goes away — giving the operator no chance to investigate. ACK logic forces human intervention.`,
    preloadedProgram: {
      id: 'p-alarm', name: 'Alarm with ACK',
      rungs: [
        {
          id: 'r1', comment: 'Latch fault condition',
          branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Fault' }] }],
          outputElements: [{ id: 'e2', type: 'SET_COIL', address: 'M0.0' }],
        },
        {
          id: 'r2', comment: 'Operator acknowledges alarm',
          branches: [{ id: 'b1', elements: [
            { id: 'e3', type: 'NO_CONTACT', address: 'I0.1', label: 'ACK Button' },
            { id: 'e4', type: 'NO_CONTACT', address: 'M0.0', label: 'Fault Active' },
          ]}],
          outputElements: [{ id: 'e5', type: 'SET_COIL', address: 'M0.1' }],
        },
        {
          id: 'r3', comment: 'Clear fault latch only when fault gone AND acked',
          branches: [{ id: 'b1', elements: [
            { id: 'e6', type: 'NC_CONTACT', address: 'I0.0', label: 'Fault Gone' },
            { id: 'e7', type: 'NO_CONTACT', address: 'M0.1', label: 'Acked' },
          ]}],
          outputElements: [{ id: 'e8', type: 'RESET_COIL', address: 'M0.0' }],
        },
        {
          id: 'r4', comment: 'Clear ack state when fault clears',
          branches: [{ id: 'b1', elements: [{ id: 'e9', type: 'NC_CONTACT', address: 'I0.0', label: 'Fault Gone' }] }],
          outputElements: [{ id: 'ea', type: 'RESET_COIL', address: 'M0.1' }],
        },
        {
          id: 'r5', comment: 'Flash alarm lamp if fault latched but NOT yet acked',
          branches: [{ id: 'b1', elements: [
            { id: 'eb', type: 'NO_CONTACT', address: 'M0.0', label: 'Fault' },
            { id: 'ec', type: 'NC_CONTACT', address: 'M0.1', label: 'Not Acked' },
            { id: 'ed', type: 'NO_CONTACT', address: 'T0', label: 'Flash Clock' },
          ]}],
          outputElements: [{ id: 'ee', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Alarm Lamp' }],
        },
        {
          id: 'r6', comment: 'Steady alarm lamp once acked',
          branches: [{ id: 'b1', elements: [
            { id: 'ef', type: 'NO_CONTACT', address: 'M0.0', label: 'Fault' },
            { id: 'e10', type: 'NO_CONTACT', address: 'M0.1', label: 'Acked' },
          ]}],
          outputElements: [{ id: 'e11', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Alarm Lamp' }],
        },
        {
          id: 'r7', comment: 'Flash clock (1 second)',
          branches: [{ id: 'b1', elements: [{ id: 'e12', type: 'NC_CONTACT', address: 'T0', label: 'T0 NC' }] }],
          outputElements: [{ id: 'e13', type: 'TON_TIMER', address: 'T0', preset: 500 }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Fault Input'),
        'I0.1': makeVar('I0.1', 'I', 'ACK Button'),
        'M0.0': makeVar('M0.0', 'M', 'Fault Latched'),
        'M0.1': makeVar('M0.1', 'M', 'Acknowledged'),
        'T0': { address: 'T0', area: 'T', name: 'Flash Clock', type: 'TIMER', value: false, timerData: { preset: 500, accumulated: 0, done: false, timing: false, enabled: false, timerType: 'TON' } },
        'Q0.0': makeVar('Q0.0', 'Q', 'Alarm Lamp'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Run the simulation. Toggle **I0.0 (Fault)** ON — the alarm lamp Q0.0 begins FLASHING (driven by the flash clock T0). M0.0 is latched.' },
      { id: 's2', instruction: 'Toggle I0.0 back OFF (fault condition gone). Notice Q0.0 KEEPS FLASHING — the alarm latch M0.0 is still set. The fault must be acknowledged first.' },
      { id: 's3', instruction: 'Toggle **I0.1 (ACK Button)** ON briefly. M0.1 sets — alarm acknowledged. Q0.0 changes from flashing to STEADY ON.', highlightElements: ['e5'] },
      { id: 's4', instruction: 'Since the fault is already gone (I0.0=OFF) and M0.1 is set, Rung 3 fires → M0.0 resets. Rung 4 also fires → M0.1 resets. Alarm clears completely.' },
      { id: 's5', instruction: 'Try it with fault still active: toggle I0.0 ON, then ACK. Lamp goes steady but STAYS ON because the fault is still present. Clear the fault to finish.' },
    ],
    nextLessonId: 'lesson-21-safety-interlock',
    prerequisiteIds: ['lesson-14-memory-bits', 'lesson-15-flasher'],
  },

  {
    id: 'lesson-21-safety-interlock',
    title: 'Safety Interlock Design',
    category: 'advanced',
    difficulty: 'advanced',
    description: 'Layer multiple safety conditions using NC contacts — the foundation of machine safety',
    theory: `# Safety Interlock Design

A **safety interlock** prevents a machine from operating unless ALL safety conditions are met. Safety contacts are **always NC** (fail-safe): a broken wire, tripped switch, or lost signal all stop the machine.

## Principle: Safety in Series
\`\`\`
──┤Guard Door NC├──┤E-Stop NC├──┤Presence Sensor NC├──(Enable)──
\`\`\`
Any single fault breaks the chain and stops everything.

## Layer Model (Functional Safety)
Modern machine safety uses layers:
1. **Hard-wired E-Stop** (physical disconnect — not in PLC)
2. **PLC Safety Interlocks** (what we're building here)
3. **Software Limits** (speed limits, position checks)
4. **Monitoring** (watchdog timers, fault logging)

## Key Rules
- Safety contacts = NC in ladder (fail-safe wiring)
- Never bypass safety interlocks in normal operation
- Use SET/RESET for safety state to require deliberate reset after fault
- Add a FAULT RESET button that requires safety to be clear first

## Reset Requirement
\`\`\`
Reset only works if all interlocks are clear:
──┤Reset Btn├──┤Guard OK├──┤EStop OK├──(S SafeToRun)──
\`\`\``,
    preloadedProgram: {
      id: 'p-safety', name: 'Safety Interlock',
      rungs: [
        {
          id: 'r1', comment: 'All safety conditions must be OK to set SAFE flag',
          branches: [{ id: 'b1', elements: [
            { id: 'e1', type: 'NO_CONTACT', address: 'I0.3', label: 'Reset Btn' },
            { id: 'e2', type: 'NC_CONTACT', address: 'I0.0', label: 'Guard OK' },
            { id: 'e3', type: 'NC_CONTACT', address: 'I0.1', label: 'EStop OK' },
            { id: 'e4', type: 'NC_CONTACT', address: 'I0.2', label: 'Presence OK' },
          ]}],
          outputElements: [{ id: 'e5', type: 'SET_COIL', address: 'M0.0' }],
        },
        {
          id: 'r2', comment: 'Any safety fault immediately clears SAFE flag',
          branches: [
            { id: 'b1', elements: [{ id: 'e6', type: 'NO_CONTACT', address: 'I0.0', label: 'Guard Open' }] },
            { id: 'b2', elements: [{ id: 'e7', type: 'NO_CONTACT', address: 'I0.1', label: 'EStop' }] },
            { id: 'b3', elements: [{ id: 'e8', type: 'NO_CONTACT', address: 'I0.2', label: 'Presence' }] },
          ],
          outputElements: [{ id: 'e9', type: 'RESET_COIL', address: 'M0.0' }],
        },
        {
          id: 'r3', comment: 'Machine runs only when SAFE and start requested',
          branches: [{ id: 'b1', elements: [
            { id: 'ea', type: 'NO_CONTACT', address: 'M0.0', label: 'SAFE' },
            { id: 'eb', type: 'NO_CONTACT', address: 'I0.4', label: 'Run Cmd' },
          ]}],
          outputElements: [{ id: 'ec', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Machine Run' }],
        },
        {
          id: 'r4', comment: 'Safety fault indicator',
          branches: [{ id: 'b1', elements: [{ id: 'ed', type: 'NC_CONTACT', address: 'M0.0', label: 'Not Safe' }] }],
          outputElements: [{ id: 'ee', type: 'OUTPUT_COIL', address: 'Q0.1', label: 'Safety Fault' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Guard Door Open'),
        'I0.1': makeVar('I0.1', 'I', 'E-Stop Pressed'),
        'I0.2': makeVar('I0.2', 'I', 'Person Detected'),
        'I0.3': makeVar('I0.3', 'I', 'Safety Reset'),
        'I0.4': makeVar('I0.4', 'I', 'Run Command'),
        'M0.0': makeVar('M0.0', 'M', 'Safe To Run'),
        'Q0.0': makeVar('Q0.0', 'Q', 'Machine Running'),
        'Q0.1': makeVar('Q0.1', 'Q', 'Safety Fault Light'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Run the simulation. All faults are FALSE (safe). Toggle **I0.3 (Safety Reset)** briefly — M0.0 (Safe To Run) sets. Q0.1 (Safety Fault) turns OFF.' },
      { id: 's2', instruction: 'Now toggle **I0.4 (Run Command)** ON — machine starts! Both M0.0 and I0.4 are required.' },
      { id: 's3', instruction: 'Toggle **I0.1 (E-Stop)** ON while running — M0.0 immediately RESETS, machine stops, fault light activates.', highlightElements: ['e7', 'e9'] },
      { id: 's4', instruction: 'Toggle I0.1 OFF. The machine stays stopped — M0.0 stays clear. You MUST press Reset again to re-enable.' },
      { id: 's5', instruction: 'Try to reset (I0.3) while a fault is present — it won\'t work! Rung 1 requires ALL NC safety contacts to be closed.' },
    ],
    nextLessonId: 'lesson-22-chained-counters',
    prerequisiteIds: ['lesson-14-memory-bits', 'lesson-06-set-reset'],
  },

  {
    id: 'lesson-22-chained-counters',
    title: 'Chained Counters (Large Counts)',
    category: 'counters',
    difficulty: 'advanced',
    description: 'Chain two CTU counters to count large quantities — parts into boxes into pallets',
    theory: `# Chained Counters for Large Counts

A single CTU counter has a maximum preset of 32,767. For larger counts, or for **hierarchical counting** (parts → boxes → pallets), chain multiple counters.

## Pattern
\`\`\`
Counter 1 (Parts): PV=10  → done = one full box
Counter 2 (Boxes): PV=5   → done = one full pallet
\`\`\`

## Wiring
- C0 counts part pulses (PV=10)
- When C0.DN → reset C0 AND trigger C1
- C1 counts box completions (PV=5)
- When C1.DN → pallet complete alarm

## Ladder
\`\`\`
Rung 1: ──┤Part Sensor├──[CTU C0, PV=10]──
Rung 2: ──┤C0.DN├──┤P├──[CTU C1, PV=5]── (edge: count once per box)
Rung 3: ──┤C0.DN├──┤P├──(R C0)──          (reset parts counter)
Rung 4: ──┤C1.DN├──(Q0.1 Pallet Done)──
Rung 5: ──┤Reset All├──(R C0)──
Rung 6: ──┤Reset All├──(R C1)──
\`\`\`

## Key: Use POS_EDGE on C0.DN
Without the edge contact, Rung 2 would try to increment C1 **every scan cycle** while C0.DN is TRUE. The POS_EDGE ensures C1 only gets one count per box completion.`,
    preloadedProgram: {
      id: 'p-chain', name: 'Parts → Boxes → Pallets',
      rungs: [
        {
          id: 'r1', comment: 'Count parts (3 parts per box for demo)',
          branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Part Sensor' }] }],
          outputElements: [{ id: 'e2', type: 'CTU_COUNTER', address: 'C0', preset: 3 }],
        },
        {
          id: 'r2', comment: 'Count boxes (2 boxes per pallet for demo)',
          branches: [{ id: 'b1', elements: [{ id: 'e3', type: 'POS_EDGE', address: 'C0', label: 'Box Done Edge' }] }],
          outputElements: [{ id: 'e4', type: 'CTU_COUNTER', address: 'C1', preset: 2 }],
        },
        {
          id: 'r3', comment: 'Auto-reset parts counter when box complete',
          branches: [{ id: 'b1', elements: [{ id: 'e5', type: 'POS_EDGE', address: 'C0', label: 'Box Done Edge' }] }],
          outputElements: [{ id: 'e6', type: 'RESET_COIL', address: 'C0' }],
        },
        {
          id: 'r4', comment: 'Pallet complete output',
          branches: [{ id: 'b1', elements: [{ id: 'e7', type: 'NO_CONTACT', address: 'C1', label: 'C1.DN' }] }],
          outputElements: [{ id: 'e8', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Pallet Done' }],
        },
        {
          id: 'r5', comment: 'Reset all counters',
          branches: [{ id: 'b1', elements: [{ id: 'e9', type: 'NO_CONTACT', address: 'I0.1', label: 'Reset All' }] }],
          outputElements: [{ id: 'ea', type: 'RESET_COIL', address: 'C0' }],
        },
        {
          id: 'r6', comment: 'Reset box counter',
          branches: [{ id: 'b1', elements: [{ id: 'eb', type: 'NO_CONTACT', address: 'I0.1', label: 'Reset All' }] }],
          outputElements: [{ id: 'ec', type: 'RESET_COIL', address: 'C1' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Part Sensor'),
        'I0.1': makeVar('I0.1', 'I', 'Reset All'),
        'C0': { address: 'C0', area: 'C', name: 'Parts Counter', type: 'COUNTER', value: false, counterData: { preset: 3, accumulated: 0, done: false, overflow: false, underflow: false, counterType: 'CTU' } },
        'C1': { address: 'C1', area: 'C', name: 'Box Counter', type: 'COUNTER', value: false, counterData: { preset: 2, accumulated: 0, done: false, overflow: false, underflow: false, counterType: 'CTU' } },
        'Q0.0': makeVar('Q0.0', 'Q', 'Pallet Complete'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Run the simulation. Pulse **I0.0** three times (toggle ON/OFF each time). After 3 parts, C0.DN fires and C0 auto-resets. C1 increments to 1 (first box done).' },
      { id: 's2', instruction: 'Pulse I0.0 three more times. C0 counts 3 again → auto-resets → C1 increments to 2 (second box done). C1.DN fires → Q0.0 (Pallet Done) turns ON!' },
      { id: 's3', instruction: 'Toggle **I0.1 (Reset All)** to clear both counters and turn off Q0.0. You\'re ready for the next pallet.' },
      { id: 's4', instruction: 'Notice the POS_EDGE on C0.DN (Rung 2 & 3) — without it, the box counter would count continuously every scan while C0.DN is TRUE.' },
    ],
    nextLessonId: 'lesson-23-one-shot-timer',
    prerequisiteIds: ['lesson-09-ctu', 'lesson-10-edge'],
  },

  {
    id: 'lesson-23-one-shot-timer',
    title: 'Timed One-Shot Pulse',
    category: 'timers',
    difficulty: 'intermediate',
    description: 'Generate a fixed-duration output pulse from a momentary input using TON',
    theory: `# Timed One-Shot Pulse

A **one-shot pulse** produces a fixed-duration output regardless of how long the input is held. This is essential when you need exactly 2 seconds of cylinder extension, a 500ms solenoid pulse, or a 1-second audible beep.

## The Challenge
- Edge contacts give one-scan pulses (too short for real actuators)
- Plain coils give variable-duration outputs (depends on operator)
- You need: **fixed duration from any-length input**

## Pattern
\`\`\`
Rung 1: ──┤Trigger├──(S M0.0)──              Latch trigger
Rung 2: ──┤M0.0├──[TON T0, PT=2s]──          Run timer
Rung 3: ──┤M0.0├──┤T0.DN NC├──(Q0.0)──       Output: ON while timing
Rung 4: ──┤T0.DN├──(R M0.0)──                Auto-reset after pulse
\`\`\`

## How it Works
1. Trigger → latch M0.0 ON
2. M0.0 starts TON timer
3. Q0.0 = M0.0 AND NOT T0.DN (output ON during timing)
4. When T0.DN → reset M0.0 → timer resets → ready for next trigger

## Retrigger Behavior
With this pattern, a new trigger during the pulse is **ignored** (M0.0 is already set, no effect). For retriggerable behavior, reset M0.0 on new trigger before setting.`,
    preloadedProgram: {
      id: 'p-oneshot', name: 'Timed One-Shot',
      rungs: [
        {
          id: 'r1', comment: 'Any trigger latches the one-shot',
          branches: [{ id: 'b1', elements: [
            { id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Trigger' },
            { id: 'e2', type: 'NC_CONTACT', address: 'M0.0', label: 'Not active' },
          ]}],
          outputElements: [{ id: 'e3', type: 'SET_COIL', address: 'M0.0' }],
        },
        {
          id: 'r2', comment: 'Timer runs during one-shot',
          branches: [{ id: 'b1', elements: [{ id: 'e4', type: 'NO_CONTACT', address: 'M0.0', label: 'Active' }] }],
          outputElements: [{ id: 'e5', type: 'TON_TIMER', address: 'T0', preset: 3000 }],
        },
        {
          id: 'r3', comment: 'Output ON during pulse (M0.0 AND NOT done)',
          branches: [{ id: 'b1', elements: [
            { id: 'e6', type: 'NO_CONTACT', address: 'M0.0', label: 'Active' },
            { id: 'e7', type: 'NC_CONTACT', address: 'T0', label: 'Not Done' },
          ]}],
          outputElements: [{ id: 'e8', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Pulse Output' }],
        },
        {
          id: 'r4', comment: 'Auto-reset after pulse completes',
          branches: [{ id: 'b1', elements: [{ id: 'e9', type: 'NO_CONTACT', address: 'T0', label: 'T0.DN' }] }],
          outputElements: [{ id: 'ea', type: 'RESET_COIL', address: 'M0.0' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Trigger'),
        'M0.0': makeVar('M0.0', 'M', 'Pulse Active'),
        'T0': { address: 'T0', area: 'T', name: 'Pulse Timer', type: 'TIMER', value: false, timerData: { preset: 3000, accumulated: 0, done: false, timing: false, enabled: false, timerType: 'TON' } },
        'Q0.0': makeVar('Q0.0', 'Q', 'Pulse Output'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Run the simulation. Toggle **I0.0 (Trigger)** ON briefly, then OFF. Q0.0 turns ON and begins a 3-second timed pulse.' },
      { id: 's2', instruction: 'Regardless of what you do with I0.0, Q0.0 stays ON for exactly 3 seconds, then turns OFF automatically.' },
      { id: 's3', instruction: 'Try holding I0.0 ON during the pulse — nothing changes. The NC contact on Rung 1 prevents re-triggering while active.', highlightElements: ['e2'] },
      { id: 's4', instruction: 'After the pulse ends (M0.0 reset), trigger again — it works immediately. This pattern is used for solenoid valves, buzzers, and timed ejectors.' },
    ],
    nextLessonId: 'lesson-24-scan-cycle-tips',
    prerequisiteIds: ['lesson-08-ton', 'lesson-14-memory-bits'],
  },

  {
    id: 'lesson-24-scan-cycle-tips',
    title: 'Scan Cycle & Program Order',
    category: 'fundamentals',
    difficulty: 'advanced',
    description: 'Understand how rung order affects scan-cycle behavior and avoid common mistakes',
    theory: `# Scan Cycle & Rung Order Effects

Understanding the PLC scan cycle is critical for writing programs that work correctly, especially with multiple rungs that interact.

## Scan Cycle Reminder
1. **Read inputs** into memory image
2. **Execute rungs top-to-bottom** — each rung reads and writes internal bits immediately
3. **Write outputs** from memory image to physical outputs

## Key: Internal Bits Update Immediately
When a coil in Rung 2 turns ON, Rung 3 can read that same bit ON in the **same scan cycle**.

## "Forward Reference" vs "Backward Reference"
\`\`\`
Rung 1: ──┤I0.0├──(M0.0)──    ← M0.0 set this scan
Rung 2: ──┤M0.0├──(Q0.0)──    ← Reads M0.0 SAME scan ✓ (forward)

vs.

Rung 1: ──┤M0.0├──(Q0.0)──    ← Reads M0.0 from LAST scan ✗ (backward)
Rung 2: ──┤I0.0├──(M0.0)──    ← M0.0 set THIS scan
\`\`\`

## Common Mistake: Coil After Its Contact
Placing the output coil in a HIGHER rung than its contacts means there's always a one-scan delay.

## Best Practice: Top-Down Data Flow
Write rungs so data flows **downward**: inputs → calculations → outputs.

## The "Last Write Wins" Rule
If two rungs write to the same bit, the **last rung** (lowest in the program) wins for that scan cycle. Use this deliberately or avoid it.`,
    preloadedProgram: {
      id: 'p-scan', name: 'Scan Order Demo',
      rungs: [
        {
          id: 'r1', comment: 'Rung 1: I0.0 sets M0.0',
          branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Input' }] }],
          outputElements: [{ id: 'e2', type: 'OUTPUT_COIL', address: 'M0.0' }],
        },
        {
          id: 'r2', comment: 'Rung 2: M0.0 drives Q0.0 — same scan, instant response',
          branches: [{ id: 'b1', elements: [{ id: 'e3', type: 'NO_CONTACT', address: 'M0.0', label: 'Flag' }] }],
          outputElements: [{ id: 'e4', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Output' }],
        },
        {
          id: 'r3', comment: 'Rung 3: I0.1 drives Q0.1 directly',
          branches: [{ id: 'b1', elements: [{ id: 'e5', type: 'NO_CONTACT', address: 'I0.1', label: 'Direct' }] }],
          outputElements: [{ id: 'e6', type: 'OUTPUT_COIL', address: 'Q0.1', label: 'Direct Out' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Input A'),
        'I0.1': makeVar('I0.1', 'I', 'Input B'),
        'M0.0': makeVar('M0.0', 'M', 'Internal Flag'),
        'Q0.0': makeVar('Q0.0', 'Q', 'Output via Flag'),
        'Q0.1': makeVar('Q0.1', 'Q', 'Direct Output'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Run the simulation. Toggle I0.0 ON — both M0.0 AND Q0.0 turn on in the SAME scan. Rung 2 reads the M0.0 that Rung 1 just set.' },
      { id: 's2', instruction: 'Use Step mode to observe this: click Step with I0.0 ON — both rungs respond in that single step.' },
      { id: 's3', instruction: 'Understand the "last write wins" rule: if you had a rung ABOVE that reset M0.0, and Rung 1 sets it, the SET wins (it\'s lower/later in the scan).' },
      { id: 's4', instruction: 'Best practice takeaway: organize your ladder so inputs are at the top, internal logic in the middle, and final outputs at the bottom. This produces predictable, one-scan-delay-free behavior.' },
    ],
    nextLessonId: 'lesson-25-troubleshooting',
    prerequisiteIds: ['lesson-01-intro'],
  },

  {
    id: 'lesson-25-troubleshooting',
    title: 'Troubleshooting Ladder Logic',
    category: 'advanced',
    difficulty: 'advanced',
    description: 'Systematic approach to debugging PLC programs using power flow and variable monitoring',
    theory: `# Troubleshooting Ladder Logic

When a PLC program doesn't behave as expected, follow a systematic process rather than guessing.

## Step 1: Identify the Symptom
"Output Q0.0 is not turning ON when it should"

## Step 2: Work Backwards from the Output
Find the rung with the Q0.0 output coil. Ask: why isn't power reaching the coil?

## Step 3: Trace the Power Flow
Check each contact in the rung from left to right:
- Which contact is open that shouldn't be?
- Check the Variable Table for the actual values

## Step 4: Find the Root Cause
If contact X is open:
- What should be driving X?
- Find the rung that controls X's bit
- Repeat from Step 2 for that bit

## Common Bugs

**Bug 1: Wrong address**
- Used I0.1 when you meant I0.0
- Fix: Check address in element config (double-click)

**Bug 2: Missing seal-in**
- Output turns on momentarily then off
- Fix: Add a parallel seal-in branch

**Bug 3: NC vs NO confusion**
- Output is stuck ON or stuck OFF
- Fix: Check contact type — NC is the "/" contact

**Bug 4: Coil above its contact**
- One-scan delay on startup
- Fix: Move the driving rung above the rung that uses the bit

**Bug 5: Counter not resetting**
- Counter DN fires but never clears
- Fix: Add a RESET coil rung for the counter address

## Use the Simulator
The color-coded power flow in this simulator shows you exactly where power is stopped.`,
    preloadedProgram: {
      id: 'p-debug', name: 'Debug Practice',
      rungs: [
        {
          id: 'r1', comment: 'BUGGY: Wrong contact type — should be NC but is NO',
          branches: [{ id: 'b1', elements: [
            { id: 'e1', type: 'NO_CONTACT', address: 'I0.0', label: 'Start' },
            { id: 'e2', type: 'NO_CONTACT', address: 'I0.1', label: 'E-Stop??' },
          ]}],
          outputElements: [{ id: 'e3', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Motor' }],
        },
        {
          id: 'r2', comment: 'BUGGY: No seal-in — motor only runs while Start held',
          branches: [{ id: 'b1', elements: [{ id: 'e4', type: 'NO_CONTACT', address: 'I0.2', label: 'Start2' }] }],
          outputElements: [{ id: 'e5', type: 'OUTPUT_COIL', address: 'Q0.1', label: 'Motor2' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Start Button'),
        'I0.1': makeVar('I0.1', 'I', 'E-Stop (should be NC!)'),
        'I0.2': makeVar('I0.2', 'I', 'Start2 (needs seal-in)'),
        'Q0.0': makeVar('Q0.0', 'Q', 'Motor 1'),
        'Q0.1': makeVar('Q0.1', 'Q', 'Motor 2'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Run the simulation. Try to turn on Motor 1: toggle I0.0 AND I0.1 both ON. It works! But wait — the E-Stop should STOP the motor when pressed, not be required to START it. **Bug found**: I0.1 should be NC, not NO.' },
      { id: 's2', instruction: 'The fix: double-click the I0.1 contact element and change its type to NC_CONTACT. After the fix, Motor 1 should run with just I0.0, and pressing I0.1 should stop it.' },
      { id: 's3', instruction: 'Now try Motor 2 (Rung 2): Toggle I0.2 ON — Q0.1 turns ON. Toggle I0.2 OFF — Q0.1 turns OFF immediately. **Bug found**: Motor needs a seal-in circuit.' },
      { id: 's4', instruction: 'The fix for Motor 2: add a parallel branch with a Q0.1 NO contact (and the stop NC) to create a seal-in. This is the most common beginner mistake!' },
    ],
    nextLessonId: 'lesson-26-best-practices',
    prerequisiteIds: ['lesson-07-seal-in', 'lesson-03-nc-contact'],
  },

  {
    id: 'lesson-26-best-practices',
    title: 'PLC Programming Best Practices',
    category: 'fundamentals',
    difficulty: 'advanced',
    description: 'Professional conventions for writing readable, maintainable, and safe ladder logic',
    theory: `# PLC Programming Best Practices

Writing PLC programs that work is just the beginning. Professional-quality ladder logic must also be readable, maintainable, and safe.

## 1. Name Everything
Give every I/O point and variable a clear, descriptive name:
- Bad: I0.0, Q0.3, M0.5
- Good: "Emergency Stop", "Conveyor Motor", "Cycle Active Flag"

## 2. Comment Every Rung
Add a comment to each rung explaining its purpose:
- Bad: (no comment)
- Good: "Rung 5: Auto-stop motor after timer preset reached"

## 3. Address Conventions
Follow a consistent scheme:
- I0.x → Physical inputs (sensors, buttons)
- Q0.x → Physical outputs (motors, valves, lights)
- M0.x → Internal memory flags
- T0–T9 → Timers (name them descriptively)
- C0–C9 → Counters (name them descriptively)

## 4. Safety First
- E-Stops and safety contacts: **always NC, always first** in the series chain
- Never place an output coil higher than its controlling contact
- Use Set/Reset (not regular coils) for anything that must retain state on power loss

## 5. Structured Layout
Organize rungs in this order:
1. Safety interlocks
2. Mode and state logic
3. Process control (timers, counters, sequences)
4. Output assignments
5. Alarm and fault handling

## 6. Avoid Coil Duplication
Never drive the same output coil from two separate rungs (unless intentional "last-write-wins"). Use a memory bit and OR the conditions before the single coil.

## 7. Test Edge Cases
Always test: power-on state, E-Stop during each step, sensor failure (bit stuck ON), and reset from any state.`,
    preloadedProgram: {
      id: 'p-best', name: 'Well-Written Example',
      rungs: [
        {
          id: 'r1', comment: 'SAFETY: E-Stop must be clear to run anything',
          branches: [{ id: 'b1', elements: [{ id: 'e1', type: 'NC_CONTACT', address: 'I0.7', label: 'E-STOP' }] }],
          outputElements: [{ id: 'e2', type: 'SET_COIL', address: 'M0.7' }],
        },
        {
          id: 'r2', comment: 'E-Stop pressed: clear safe-to-run flag',
          branches: [{ id: 'b1', elements: [{ id: 'e3', type: 'NO_CONTACT', address: 'I0.7', label: 'E-STOP' }] }],
          outputElements: [{ id: 'e4', type: 'RESET_COIL', address: 'M0.7' }],
        },
        {
          id: 'r3', comment: 'Conveyor: start/stop with seal-in (requires safe-to-run)',
          branches: [
            { id: 'b1', elements: [
              { id: 'e5', type: 'NO_CONTACT', address: 'I0.0', label: 'Conv Start' },
              { id: 'e6', type: 'NC_CONTACT', address: 'I0.1', label: 'Conv Stop' },
              { id: 'e7', type: 'NO_CONTACT', address: 'M0.7', label: 'Safe' },
            ]},
            { id: 'b2', elements: [
              { id: 'e8', type: 'NO_CONTACT', address: 'Q0.0', label: 'Conv Seal' },
              { id: 'e9', type: 'NC_CONTACT', address: 'I0.1', label: 'Conv Stop' },
              { id: 'ea', type: 'NO_CONTACT', address: 'M0.7', label: 'Safe' },
            ]},
          ],
          outputElements: [{ id: 'eb', type: 'OUTPUT_COIL', address: 'Q0.0', label: 'Conveyor' }],
        },
        {
          id: 'r4', comment: 'Run indicator: green light when conveyor running',
          branches: [{ id: 'b1', elements: [{ id: 'ec', type: 'NO_CONTACT', address: 'Q0.0', label: 'Conveyor' }] }],
          outputElements: [{ id: 'ed', type: 'OUTPUT_COIL', address: 'Q0.1', label: 'Run Light' }],
        },
      ],
      variables: {
        'I0.0': makeVar('I0.0', 'I', 'Conveyor Start'),
        'I0.1': makeVar('I0.1', 'I', 'Conveyor Stop'),
        'I0.7': makeVar('I0.7', 'I', 'Emergency Stop'),
        'M0.7': makeVar('M0.7', 'M', 'Safe To Run'),
        'Q0.0': makeVar('Q0.0', 'Q', 'Conveyor Motor'),
        'Q0.1': makeVar('Q0.1', 'Q', 'Running Indicator'),
      },
    },
    steps: [
      { id: 's1', instruction: 'Study this well-structured 4-rung program. Notice: (1) Safety check first, (2) named variables, (3) rung comments, (4) clear logical structure.' },
      { id: 's2', instruction: 'Run the simulation. The E-Stop (I0.7) NC contact keeps M0.7 SET. Toggle **I0.0** to start the conveyor — it only starts because M0.7 (safe) is ON.' },
      { id: 's3', instruction: 'Toggle **I0.7 (E-Stop)** — the RESET coil immediately clears M0.7. The conveyor stops even though the seal-in was active. E-Stop is in the motor path AND controls M0.7.' },
      { id: 's4', instruction: 'Toggle I0.7 OFF (E-Stop released). The conveyor does NOT auto-restart — you must press Start again (deliberate re-enable). This is the correct safe design pattern.' },
      { id: 's5', instruction: 'Congratulations! You have completed the full PLC ladder logic curriculum. Use the AI Tutor (chat icon) for further questions, and try the Exercises to test your skills.' },
    ],
    prerequisiteIds: ['lesson-21-safety-interlock', 'lesson-07-seal-in'],
  },
];
