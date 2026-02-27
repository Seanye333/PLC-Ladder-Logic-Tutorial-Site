# PLC Ladder Logic Simulator

A browser-based, interactive PLC (Programmable Logic Controller) ladder logic simulator and learning platform. Write, simulate, and learn industrial ladder logic programs entirely in your browser — no hardware, no software installs, no PLC required.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-4-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3-teal)

---

## Features

### Ladder Logic Editor
- Drag-and-drop element palette onto rungs
- Add parallel branches for OR logic
- Delete elements, branches, and rungs
- Inline rung comments (double-click rung number)
- 50-step undo/redo history
- Click program name in header to rename

### Supported PLC Elements

| Element | Symbol | Description |
|---------|--------|-------------|
| NO Contact | ┤ ├ | Normally Open — passes when bit is TRUE |
| NC Contact | ┤/├ | Normally Closed — passes when bit is FALSE |
| Rising Edge | ┤P├ | One-shot on 0→1 transition |
| Falling Edge | ┤N├ | One-shot on 1→0 transition |
| Output Coil | ( ) | Sets bit = rung power each scan |
| Set Coil | (S) | Latches bit ON (retentive) |
| Reset Coil | (R) | Forces bit OFF |
| TON Timer | [TON] | ON Delay: output after preset time |
| TOF Timer | [TOF] | OFF Delay: stays on after input drops |
| CTU Counter | [CTU] | Count Up: done when ACC ≥ preset |
| CTD Counter | [CTD] | Count Down: done when ACC ≤ 0 |

### Simulator
- Real-time scan cycle execution
- **Run**, **Pause**, **Step** (single-scan), and **Stop** modes
- Color-coded power flow (blue = energized, gray = off)
- Per-branch power flow visualization on right connectors
- Variable table with live values — toggle inputs during simulation
- Scan counter display

### Waveform / Timing Diagram
- Add any boolean variable as a tracked signal
- Live recording of signal states per scan cycle (up to 400 samples)
- Zoom in/out (1–20 px/sample)
- Colored tracks with address + name labels
- Clears automatically when simulation stops

### Element Configuration
- Double-click any element to configure:
  - Address (I0.0–I7.7, Q0.0–Q7.7, M0.0–M7.7, T0–T63, C0–C63)
  - Variable name / display label
  - Timer preset with quick-select buttons (0.5s, 1s, 2s, 5s, 10s)
  - Counter preset value

### Variable Table
- Lists all variables in the current program
- Shows type, area, current value, and timer/counter data
- Toggle input bits during simulation
- Displays timer elapsed / preset and counter accumulated / preset

### Export / Import
- **Ctrl+S** — download program as `.plc.json` file
- **Import** button — upload a `.plc.json` file
- JSON format includes all rungs, branches, elements, variables, and name

### AI PLC Tutor (ChatGPT)
- Built-in chat panel powered by OpenAI gpt-4o-mini
- Answers questions about PLC programming and ladder logic concepts
- Optionally sends your current program as context for specific help
- API key stored locally in `localStorage` — never sent anywhere except OpenAI
- Toggle with the **Tutor** button in the header

---

## Tutorials (26 Lessons)

A full structured curriculum from beginner to advanced:

### Beginner
1. What is a PLC? — scan cycle introduction
2. Normally Open (NO) Contact
3. Normally Closed (NC) Contact
4. Series Logic (AND)
5. Parallel Branches (OR)
6. Set and Reset Coils

### Intermediate
7. Seal-In (Latch) Circuit
8. TON Timer (ON Delay)
9. Count Up Counter (CTU)
10. Edge Detection Contacts
11. TOF Timer (OFF Delay)
12. Combining Patterns (batch control)
13. Count Down Counter (CTD)
14. Memory Bits (M Addresses)
15. Flasher / Oscillator Circuit
16. TOF Real-World Application (fan overrun)
17. Dual Station Motor Control
18. Tank Level Control (hysteresis)
23. Timed One-Shot Pulse

### Advanced
19. 3-Step Process Sequencer
20. Alarm with Acknowledgement
21. Safety Interlock Design
22. Chained Counters (Parts → Boxes → Pallets)
24. Scan Cycle & Program Order
25. Troubleshooting Ladder Logic
26. PLC Programming Best Practices

Each lesson includes: theory with diagrams, a preloaded example program, and step-by-step interactive instructions.

---

## Exercises (20 Auto-Graded)

Test your skills with auto-graded exercises. The simulator validates your solution against test vectors automatically.

| # | Exercise | Topic |
|---|----------|-------|
| 1 | Basic NO Contact | Contacts |
| 2 | NC Contact | Contacts |
| 3 | Series AND | Logic |
| 4 | Parallel OR | Logic |
| 5 | Set/Reset Latch | Coils |
| 6 | Seal-In Circuit | Patterns |
| 7 | TON Timer | Timers |
| 8 | CTU Counter | Counters |
| 9 | Combined Timer+Counter | Mixed |
| 10 | Edge Detection | Contacts |
| 11 | TOF Timer | Timers |
| 12 | Three-Input AND | Logic |
| 13 | Mixed Series/Parallel | Logic |
| 14 | Set/Reset with Feedback | Coils |
| 15 | Dual Station Control | Advanced |
| 16 | Tank Fill (Set/Reset) | Advanced |
| 17 | 3-Step Timed Sequence | Advanced |
| 18 | Alarm with Acknowledge | Advanced |
| 19 | Chained CTU Counters | Advanced |
| 20 | Safety Interlock | Advanced |

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Install & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
# Output in dist/
```

### Preview Production Build
```bash
npm run preview
```

---

## Variable Addressing

```
Inputs:   I0.0 – I7.7   (physical inputs / sensors / buttons)
Outputs:  Q0.0 – Q7.7   (physical outputs / motors / valves)
Memory:   M0.0 – M7.7   (internal boolean flags)
Timers:   T0  – T63     (TON or TOF timer instances)
Counters: C0  – C63     (CTU or CTD counter instances)
```

---

## Project Structure

```
src/
├── engine/
│   ├── types.ts          — all TypeScript types (Branch, Rung, Variable, etc.)
│   └── simulator.ts      — PLC scan cycle execution + exercise validation
├── hooks/
│   ├── useEditor.ts      — program editing state (undo/redo, place/delete)
│   └── useSimulator.ts   — simulation state machine (run/pause/step/stop)
├── components/
│   ├── LadderCanvas.tsx  — main editor canvas with all rungs
│   ├── LadderRung.tsx    — single rung renderer + inline comment editing
│   ├── LadderElement.tsx — individual contact/coil/timer/counter SVG
│   ├── ElementPalette.tsx    — draggable element toolbar
│   ├── ElementConfigModal.tsx — element address/preset configuration
│   ├── VariableTable.tsx     — variable list with simulation toggles
│   ├── SimulatorControls.tsx — run/pause/step/stop toolbar
│   ├── TutorialPanel.tsx     — lesson browser + step-by-step guide
│   ├── ExercisePanel.tsx     — graded exercise browser
│   ├── WaveformPanel.tsx     — timing diagram canvas
│   └── ChatPanel.tsx         — AI tutor (OpenAI API)
├── data/
│   ├── tutorials.ts      — 26 tutorial lessons with preloaded programs
│   └── exercises.ts      — 20 auto-graded exercises with test vectors
└── App.tsx               — top-level layout, routing, export/import
```

---

## AI Tutor Setup

1. Click the **Tutor** button in the top-right header
2. Enter your OpenAI API key (starts with `sk-`)
   - Get a free key at [platform.openai.com](https://platform.openai.com)
3. Ask any question about PLC programming or ladder logic

The key is saved in `localStorage` in your browser only. You can clear it by clicking the key icon in the chat header.

---

## Program Persistence

Programs are **not auto-saved**. Use **Ctrl+S** (or the Export button) to download your program as a `.plc.json` file. Use the **Import** button to reload it later.

Tutorial progress and exercise attempts are saved in `localStorage` automatically.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 4 | Build tool / dev server |
| Tailwind CSS | 3 | Styling |
| Lucide React | 0.263 | Icons |
| uuid | 9 | Unique element IDs |
| OpenAI API | gpt-4o-mini | AI Tutor |
# PLC-Ladder-Logic-Tutorial-Site
