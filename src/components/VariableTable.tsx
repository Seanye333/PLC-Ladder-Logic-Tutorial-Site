import { useState } from 'react';
import type { Variable, VariableArea } from '../engine/types';

interface Props {
  variables: Record<string, Variable>;
  simulationMode: boolean;
  onToggleInput: (address: string) => void;
}

const AREA_ORDER: VariableArea[] = ['I', 'Q', 'M', 'T', 'C'];
const AREA_LABELS: Record<VariableArea, string> = {
  I: 'Inputs (I)',
  Q: 'Outputs (Q)',
  M: 'Memory (M)',
  T: 'Timers (T)',
  C: 'Counters (C)',
};

function formatValue(v: Variable): string {
  if (v.type === 'BOOL') {
    return (v.value as boolean) ? 'TRUE' : 'FALSE';
  }
  if (v.type === 'TIMER' && v.timerData) {
    const acc = (v.timerData.accumulated / 1000).toFixed(1);
    const preset = (v.timerData.preset / 1000).toFixed(1);
    return `${acc}/${preset}s`;
  }
  if (v.type === 'COUNTER' && v.counterData) {
    return `${v.counterData.accumulated}/${v.counterData.preset}`;
  }
  return String(v.value);
}

function BoolIndicator({ value, canToggle, onToggle }: { value: boolean; canToggle: boolean; onToggle: () => void }) {
  return (
    <button
      className={`
        w-10 h-5 rounded-full relative transition-colors flex-shrink-0
        ${value ? 'bg-blue-600' : 'bg-slate-600'}
        ${canToggle ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
      `}
      onClick={canToggle ? onToggle : undefined}
      title={canToggle ? 'Click to toggle input' : undefined}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  );
}

export default function VariableTable({ variables, simulationMode, onToggleInput }: Props) {
  const [collapsed, setCollapsed] = useState<Set<VariableArea>>(new Set());

  function toggleCollapse(area: VariableArea) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  }

  const byArea: Record<VariableArea, Variable[]> = { I: [], Q: [], M: [], T: [], C: [] };
  for (const v of Object.values(variables)) {
    if (byArea[v.area]) byArea[v.area].push(v);
  }

  for (const area of AREA_ORDER) {
    byArea[area].sort((a, b) => a.address.localeCompare(b.address));
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-900 border-l border-slate-700" style={{ minWidth: 200, width: 220 }}>
      <div className="px-3 py-2 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Variables
      </div>
      <div className="flex-1 overflow-y-auto">
        {AREA_ORDER.map(area => {
          const items = byArea[area];
          if (items.length === 0) return null;
          const isCollapsed = collapsed.has(area);

          return (
            <div key={area}>
              <button
                className="w-full px-3 py-1.5 flex items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                onClick={() => toggleCollapse(area)}
              >
                <span>{AREA_LABELS[area]}</span>
                <span className="text-slate-600">{isCollapsed ? '▶' : '▼'} {items.length}</span>
              </button>

              {!isCollapsed && (
                <div className="border-b border-slate-800">
                  {items.map(v => {
                    const boolValue = v.type === 'BOOL' ? (v.value as boolean) : (
                      v.type === 'TIMER' ? (v.timerData?.done ?? false) :
                      v.type === 'COUNTER' ? (v.counterData?.done ?? false) : false
                    );
                    const canToggle = simulationMode && v.area === 'I' && v.type === 'BOOL';

                    return (
                      <div
                        key={v.address}
                        className={`px-3 py-1.5 border-b border-slate-800/50 flex items-center gap-2 ${canToggle ? 'hover:bg-slate-800 cursor-pointer' : ''}`}
                        onClick={canToggle ? () => onToggleInput(v.address) : undefined}
                      >
                        {/* Address */}
                        <span className="font-mono text-xs text-blue-300 flex-shrink-0" style={{ minWidth: 36 }}>
                          {v.address}
                        </span>

                        {/* Bool toggle or value */}
                        {v.type === 'BOOL' ? (
                          <BoolIndicator
                            value={boolValue}
                            canToggle={canToggle}
                            onToggle={() => onToggleInput(v.address)}
                          />
                        ) : (
                          <span className={`text-xs font-mono flex-1 ${boolValue ? 'text-green-400' : 'text-slate-400'}`}>
                            {formatValue(v)}
                          </span>
                        )}

                        {/* Name */}
                        {v.name !== v.address && (
                          <span className="text-xs text-slate-500 truncate flex-1" title={v.name}>
                            {v.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {Object.values(variables).length === 0 && (
          <div className="px-3 py-4 text-xs text-slate-600 text-center">
            No variables yet.<br />Place elements on the canvas to create them.
          </div>
        )}
      </div>
      {simulationMode && (
        <div className="px-3 py-2 border-t border-slate-700 text-xs text-slate-500">
          Click Input (I) toggles to simulate
        </div>
      )}
    </div>
  );
}
