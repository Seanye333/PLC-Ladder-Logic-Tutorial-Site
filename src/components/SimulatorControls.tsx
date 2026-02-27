import { Play, Pause, Square, StepForward } from 'lucide-react';
import type { SimulatorMode } from '../engine/types';

interface Props {
  mode: SimulatorMode;
  scanCount: number;
  scanTimeMs: number;
  configuredScanRateMs: number;
  elapsedMs: number;
  onRun: () => void;
  onPause: () => void;
  onStep: () => void;
  onStop: () => void;
  onScanRateChange: (ms: number) => void;
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export default function SimulatorControls({
  mode,
  scanCount,
  scanTimeMs,
  configuredScanRateMs,
  elapsedMs,
  onRun,
  onPause,
  onStep,
  onStop,
  onScanRateChange,
}: Props) {
  const isRunning = mode === 'running';
  const isStopped = mode === 'stopped';

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border-t border-slate-700 text-sm">
      {/* Simulation status indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          isRunning ? 'bg-green-400 animate-pulse' :
          mode === 'paused' ? 'bg-yellow-400' : 'bg-slate-600'
        }`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${
          isRunning ? 'text-green-400' :
          mode === 'paused' ? 'text-yellow-400' : 'text-slate-500'
        }`}>
          {mode}
        </span>
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* Control buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onStop}
          disabled={isStopped}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Stop simulation (F5)"
        >
          <Square size={12} />
          Stop
        </button>

        {isRunning ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-600 hover:bg-yellow-500 text-white transition-colors"
            title="Pause simulation (F5)"
          >
            <Pause size={12} />
            Pause
          </button>
        ) : (
          <button
            onClick={onRun}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-600 hover:bg-green-500 text-white transition-colors"
            title="Run simulation (F5)"
          >
            <Play size={12} />
            Run
          </button>
        )}

        <button
          onClick={onStep}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          title="Execute one scan cycle"
        >
          <StepForward size={12} />
          Step
        </button>
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* Scan rate control */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Scan Rate:</span>
        <select
          value={configuredScanRateMs}
          onChange={e => onScanRateChange(Number(e.target.value))}
          className="bg-slate-700 text-slate-300 text-xs rounded px-1 py-0.5 border border-slate-600"
        >
          <option value={50}>50ms</option>
          <option value={100}>100ms</option>
          <option value={200}>200ms</option>
          <option value={500}>500ms</option>
          <option value={1000}>1000ms</option>
        </select>
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500 ml-auto">
        <span>Scans: <span className="text-slate-300 font-mono">{scanCount.toLocaleString()}</span></span>
        <span>Elapsed: <span className="text-slate-300 font-mono">{formatTime(elapsedMs)}</span></span>
        {scanCount > 0 && (
          <span>Last scan: <span className="text-slate-300 font-mono">{scanTimeMs.toFixed(1)}ms</span></span>
        )}
      </div>
    </div>
  );
}
