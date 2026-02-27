import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import type { Variable, VariableArea } from '../engine/types';

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────

const TRACK_HEIGHT = 28;        // px per signal track
const LABEL_WIDTH = 88;         // px for address+name label column
const MAX_SAMPLES = 400;        // ring buffer size
const COLORS: string[] = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ec4899', // pink
  '#a78bfa', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

// ─── TYPES ─────────────────────────────────────────────────────────────────────

interface Sample {
  scanCount: number;
  values: Record<string, boolean>; // address → boolean value
}

interface TrackedSignal {
  address: string;
  color: string;
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────────

interface Props {
  variables: Record<string, Variable>;
  simulationMode: boolean;
  scanCount: number;
}

export default function WaveformPanel({ variables, simulationMode, scanCount }: Props) {
  const [tracked, setTracked] = useState<TrackedSignal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const samplesRef = useRef<Sample[]>([]);
  const prevScanRef = useRef<number>(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(4); // px per sample

  // Record a sample each scan cycle
  useEffect(() => {
    if (!simulationMode || scanCount === prevScanRef.current) return;
    prevScanRef.current = scanCount;

    if (tracked.length === 0) return;

    const values: Record<string, boolean> = {};
    for (const sig of tracked) {
      const v = variables[sig.address];
      if (!v) { values[sig.address] = false; continue; }
      if (v.type === 'BOOL') values[sig.address] = v.value as boolean;
      else if (v.type === 'TIMER') values[sig.address] = v.timerData?.done ?? false;
      else if (v.type === 'COUNTER') values[sig.address] = v.counterData?.done ?? false;
      else values[sig.address] = false;
    }

    const ring = samplesRef.current;
    ring.push({ scanCount, values });
    if (ring.length > MAX_SAMPLES) ring.shift();
  }, [scanCount, simulationMode, tracked, variables]);

  // Clear samples when sim stops
  useEffect(() => {
    if (!simulationMode) {
      samplesRef.current = [];
      prevScanRef.current = -1;
    }
  }, [simulationMode]);

  // Draw waveforms on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const samples = samplesRef.current;
    const totalHeight = Math.max(tracked.length * TRACK_HEIGHT, 1);
    canvas.height = totalHeight;

    const W = canvas.width;
    ctx.clearRect(0, 0, W, totalHeight);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, totalHeight);

    if (samples.length === 0 || tracked.length === 0) {
      ctx.fillStyle = '#334155';
      ctx.font = '11px monospace';
      ctx.fillText('Run simulation to record waveforms', 8, 18);
      return;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= tracked.length; i++) {
      const y = i * TRACK_HEIGHT;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Render each signal track
    for (let tIdx = 0; tIdx < tracked.length; tIdx++) {
      const sig = tracked[tIdx];
      const trackY = tIdx * TRACK_HEIGHT;
      const highY = trackY + 4;
      const lowY = trackY + TRACK_HEIGHT - 6;
      const color = sig.color;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      // Compute x positions — show rightmost samples
      const maxVisible = Math.floor(W / zoom);
      const startIdx = Math.max(0, samples.length - maxVisible);

      let prevVal: boolean | null = null;
      for (let sIdx = startIdx; sIdx < samples.length; sIdx++) {
        const x = (sIdx - startIdx) * zoom;
        const val = samples[sIdx].values[sig.address] ?? false;
        const y = val ? highY : lowY;

        if (prevVal === null) {
          ctx.moveTo(x, y);
        } else {
          if (val !== prevVal) {
            // Vertical transition
            ctx.lineTo(x, prevVal ? highY : lowY);
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        prevVal = val;
      }
      ctx.stroke();
    }
  });

  // Auto-add booleans from simulation when first tracking signal
  function addSignal(address: string) {
    if (tracked.some(t => t.address === address)) return;
    const color = COLORS[tracked.length % COLORS.length];
    setTracked(prev => [...prev, { address, color }]);
    setShowAdd(false);
  }

  function removeSignal(address: string) {
    setTracked(prev => prev.filter(t => t.address !== address));
  }

  // Available boolean signals (not yet tracked)
  const available = Object.values(variables).filter(
    v => (v.type === 'BOOL' || v.type === 'TIMER' || v.type === 'COUNTER') &&
         !tracked.some(t => t.address === v.address)
  );

  const AREA_PRIORITY: Record<VariableArea, number> = { I: 0, Q: 1, M: 2, T: 3, C: 4 };
  available.sort((a, b) => (AREA_PRIORITY[a.area] ?? 9) - (AREA_PRIORITY[b.area] ?? 9) || a.address.localeCompare(b.address));

  const totalHeight = Math.max(tracked.length * TRACK_HEIGHT, TRACK_HEIGHT);

  return (
    <div className="flex-shrink-0 border-t border-slate-700 bg-slate-900" style={{ height: Math.min(totalHeight + 36, 220) }}>
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-slate-800 bg-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Waveform</span>

        <div className="flex items-center gap-1 ml-2">
          <button
            className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
            onClick={() => setZoom(z => Math.max(1, z - 1))}
            title="Zoom out"
          >
            <Minus size={11} />
          </button>
          <span className="text-xs text-slate-600 font-mono" style={{ minWidth: 32, textAlign: 'center' }}>{zoom}px</span>
          <button
            className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
            onClick={() => setZoom(z => Math.min(20, z + 1))}
            title="Zoom in"
          >
            <Plus size={11} />
          </button>
        </div>

        {/* Add signal button */}
        <div className="relative ml-1">
          <button
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            onClick={() => setShowAdd(v => !v)}
          >
            <Plus size={10} /> Add Signal
          </button>
          {showAdd && (
            <div className="absolute top-full left-0 mt-1 z-30 bg-slate-800 border border-slate-600 rounded shadow-xl"
                 style={{ minWidth: 180, maxHeight: 200, overflowY: 'auto' }}>
              {available.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-500">
                  {Object.keys(variables).length === 0
                    ? 'No variables in program yet'
                    : 'All signals already tracked'}
                </div>
              ) : (
                available.map(v => (
                  <button
                    key={v.address}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-700 transition-colors flex items-center gap-2"
                    onClick={() => addSignal(v.address)}
                  >
                    <span className="font-mono text-blue-300">{v.address}</span>
                    {v.name !== v.address && (
                      <span className="text-slate-500 truncate">{v.name}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {!simulationMode && tracked.length > 0 && (
          <span className="text-xs text-slate-600 ml-1">Start simulation to record</span>
        )}

        {/* sample count */}
        {simulationMode && samplesRef.current.length > 0 && (
          <span className="text-xs text-slate-600 ml-1 font-mono">{samplesRef.current.length} samples</span>
        )}
      </div>

      {/* Tracks */}
      <div className="flex overflow-hidden" style={{ height: totalHeight }}>
        {/* Left: labels */}
        <div className="flex-shrink-0 overflow-hidden" style={{ width: LABEL_WIDTH, borderRight: '1px solid #1e293b' }}>
          {tracked.length === 0 ? (
            <div className="px-2 py-2 text-xs text-slate-600">No signals</div>
          ) : (
            tracked.map((sig, idx) => {
              const v = variables[sig.address];
              return (
                <div
                  key={sig.address}
                  className="flex items-center gap-1 px-2 group"
                  style={{ height: TRACK_HEIGHT, borderBottom: '1px solid #1e293b' }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sig.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs truncate" style={{ color: sig.color }}>{sig.address}</div>
                    {v?.name && v.name !== sig.address && (
                      <div className="text-slate-600 truncate" style={{ fontSize: 9 }}>{v.name}</div>
                    )}
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 flex-shrink-0 transition-all"
                    onClick={() => removeSignal(sig.address)}
                    title="Remove signal"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Right: canvas */}
        <div className="flex-1 overflow-hidden" style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: totalHeight }}
            width={800}
            height={totalHeight}
          />
        </div>
      </div>
    </div>
  );
}
