import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { LadderElement, Variable, VariableArea } from '../engine/types';

interface Props {
  element: LadderElement | null;
  variables: Record<string, Variable>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (elementId: string, updates: Partial<LadderElement>, newVariable?: Variable) => void;
}

const ELEMENT_LABELS: Record<string, string> = {
  NO_CONTACT: 'Normally Open Contact',
  NC_CONTACT: 'Normally Closed Contact',
  POS_EDGE: 'Rising Edge Contact',
  NEG_EDGE: 'Falling Edge Contact',
  OUTPUT_COIL: 'Output Coil',
  SET_COIL: 'Set (Latch) Coil',
  RESET_COIL: 'Reset (Unlatch) Coil',
  TON_TIMER: 'Timer ON Delay (TON)',
  TOF_TIMER: 'Timer OFF Delay (TOF)',
  CTU_COUNTER: 'Count Up Counter (CTU)',
  CTD_COUNTER: 'Count Down Counter (CTD)',
};

function isTimerType(type: string) {
  return type === 'TON_TIMER' || type === 'TOF_TIMER';
}
function isCounterType(type: string) {
  return type === 'CTU_COUNTER' || type === 'CTD_COUNTER';
}

function defaultAreaForType(type: string): VariableArea {
  if (type.includes('CONTACT') || type.includes('EDGE')) return 'I';
  if (type.includes('COIL')) return 'Q';
  if (type.includes('TIMER')) return 'T';
  if (type.includes('COUNTER')) return 'C';
  return 'M';
}

export default function ElementConfigModal({ element, variables, isOpen, onClose, onSave }: Props) {
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [presetMs, setPresetMs] = useState(5000);
  const [presetCount, setPresetCount] = useState(5);
  const [varName, setVarName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (element) {
      setAddress(element.address);
      setLabel(element.label ?? '');
      setPresetMs(element.preset ?? 5000);
      setPresetCount(element.preset ?? 5);
      const v = variables[element.address];
      setVarName(v?.name ?? element.address);
      setCreating(false);
      setError('');
    }
  }, [element, variables]);

  if (!isOpen || !element) return null;

  const isTimer = isTimerType(element.type);
  const isCounter = isCounterType(element.type);
  const existingVar = variables[address];
  const expectedArea = defaultAreaForType(element.type);

  // Address format validation
  function validateAddress(addr: string): string | null {
    if (!addr.trim()) return 'Address is required';
    const bitPattern = /^[IQM]\d+\.\d+$/;
    const wordPattern = /^[TC]\d+$/;
    if (isTimer || isCounter) {
      if (!wordPattern.test(addr)) return `Timer/Counter addresses must be like T0, C1`;
    } else {
      if (!bitPattern.test(addr) && !wordPattern.test(addr)) {
        return `Address format: I0.0, Q0.1, M0.0, T0, C0`;
      }
    }
    return null;
  }

  function handleSave() {
    if (!element) return;
    const addrErr = validateAddress(address);
    if (addrErr) { setError(addrErr); return; }

    const updates: Partial<LadderElement> = {
      address: address.trim(),
      label: label.trim() || undefined,
    };

    if (isTimer) {
      updates.preset = presetMs;
    } else if (isCounter) {
      updates.preset = presetCount;
    }

    let newVariable: Variable | undefined;

    if (!variables[address.trim()] || creating) {
      // Create new variable
      const addr = address.trim();
      const timerType = element.type === 'TON_TIMER' ? 'TON' : element.type === 'TOF_TIMER' ? 'TOF' : undefined;
      const counterType = element.type === 'CTU_COUNTER' ? 'CTU' : element.type === 'CTD_COUNTER' ? 'CTD' : undefined;

      if (timerType) {
        newVariable = {
          address: addr, area: 'T', name: varName || addr, type: 'TIMER', value: false,
          timerData: { preset: presetMs, accumulated: 0, done: false, timing: false, enabled: false, timerType },
        };
      } else if (counterType) {
        newVariable = {
          address: addr, area: 'C', name: varName || addr, type: 'COUNTER', value: false,
          counterData: { preset: presetCount, accumulated: 0, done: false, overflow: false, underflow: false, counterType },
        };
      } else {
        const area = addr.startsWith('I') ? 'I' : addr.startsWith('Q') ? 'Q' : addr.startsWith('M') ? 'M' : 'M';
        newVariable = {
          address: addr, area: area as VariableArea, name: varName || addr, type: 'BOOL', value: false,
        };
      }
    } else if (varName !== existingVar?.name) {
      // Update variable name
      newVariable = { ...(existingVar!), name: varName };
    }

    // Update timer preset in variable too
    if (isTimer && existingVar?.timerData) {
      newVariable = { ...existingVar, timerData: { ...existingVar.timerData, preset: presetMs } };
    }
    if (isCounter && existingVar?.counterData) {
      newVariable = { ...existingVar, counterData: { ...existingVar.counterData, preset: presetCount } };
    }

    onSave(element.id, updates, newVariable);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-80 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">{element.type.replace(/_/g, ' ')}</div>
            <div className="text-sm font-semibold text-white">{ELEMENT_LABELS[element.type]}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Address
              <span className="ml-1 text-slate-600 font-normal">
                ({isTimer ? 'T0, T1...' : isCounter ? 'C0, C1...' : 'I0.0, Q0.1, M0.0...'})
              </span>
            </label>
            <input
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
              value={address}
              onChange={e => { setAddress(e.target.value.toUpperCase()); setError(''); }}
              placeholder={isTimer ? 'T0' : isCounter ? 'C0' : 'I0.0'}
              autoFocus
            />
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
          </div>

          {/* Variable name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Label / Name</label>
            <input
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={varName}
              onChange={e => setVarName(e.target.value)}
              placeholder="e.g. Start Button, Motor, Delay Timer"
            />
          </div>

          {/* Element display label */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Display Label (optional)</label>
            <input
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Short text shown above element"
            />
          </div>

          {/* Timer preset */}
          {isTimer && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Preset Time (PT)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={100}
                  max={3600000}
                  step={100}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={presetMs}
                  onChange={e => setPresetMs(Number(e.target.value))}
                />
                <span className="text-slate-400 self-center text-sm">ms</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{(presetMs / 1000).toFixed(1)} seconds</div>
              {/* Quick presets */}
              <div className="flex gap-1 mt-2 flex-wrap">
                {[500, 1000, 2000, 5000, 10000].map(ms => (
                  <button
                    key={ms}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${presetMs === ms ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                    onClick={() => setPresetMs(ms)}
                  >
                    {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Counter preset */}
          {isCounter && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Preset Count (PV)
              </label>
              <input
                type="number"
                min={1}
                max={32767}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={presetCount}
                onChange={e => setPresetCount(Number(e.target.value))}
              />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-5">
          <button
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold transition-colors"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
