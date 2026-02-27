import React from 'react';
import type { LadderElement as LadderElementType, Variable } from '../engine/types';

interface Props {
  element: LadderElementType;
  variables: Record<string, Variable>;
  isSelected: boolean;
  simulationMode: boolean;
  isHighlighted?: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onDelete?: () => void;
}

function getColor(energized: boolean | undefined, simulationMode: boolean): string {
  if (!simulationMode) return '#94a3b8'; // slate-400
  return energized ? '#3b82f6' : '#6b7280'; // blue vs gray
}

function ContactSymbol({ type, energized, sim }: { type: string; energized?: boolean; sim: boolean }) {
  const color = getColor(energized, sim);
  const lineColor = getColor(true, sim); // input line always from power

  return (
    <svg width="64" height="48" viewBox="0 0 64 48">
      {/* Left wire */}
      <line x1="0" y1="24" x2="16" y2="24" stroke={color} strokeWidth="2" />
      {/* Left bar */}
      <line x1="16" y1="10" x2="16" y2="38" stroke={color} strokeWidth="2" />
      {/* Right bar */}
      <line x1="48" y1="10" x2="48" y2="38" stroke={color} strokeWidth="2" />
      {/* Right wire */}
      <line x1="48" y1="24" x2="64" y2="24" stroke={color} strokeWidth="2" />

      {/* NC slash */}
      {type === 'NC_CONTACT' && (
        <line x1="16" y1="38" x2="48" y2="10" stroke={color} strokeWidth="2" />
      )}
      {/* POS edge P */}
      {type === 'POS_EDGE' && (
        <text x="32" y="28" textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">P</text>
      )}
      {/* NEG edge N */}
      {type === 'NEG_EDGE' && (
        <text x="32" y="28" textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">N</text>
      )}
    </svg>
  );
}

function CoilSymbol({ type, energized, sim }: { type: string; energized?: boolean; sim: boolean }) {
  const color = getColor(energized, sim);
  const label = type === 'SET_COIL' ? 'S' : type === 'RESET_COIL' ? 'R' : '';

  return (
    <svg width="64" height="48" viewBox="0 0 64 48">
      {/* Left wire */}
      <line x1="0" y1="24" x2="16" y2="24" stroke={color} strokeWidth="2" />
      {/* Circle (parentheses style) */}
      <path d="M 16 10 Q 8 24 16 38" stroke={color} strokeWidth="2" fill="none" />
      <path d="M 48 10 Q 56 24 48 38" stroke={color} strokeWidth="2" fill="none" />
      {/* Right wire */}
      <line x1="48" y1="24" x2="64" y2="24" stroke={color} strokeWidth="2" />
      {/* Label inside */}
      {label && (
        <text x="32" y="29" textAnchor="middle" fill={color} fontSize="13" fontWeight="bold">{label}</text>
      )}
    </svg>
  );
}

function TimerBlock({ element, variables, energized, sim }: {
  element: LadderElementType;
  variables: Record<string, Variable>;
  energized?: boolean;
  sim: boolean;
}) {
  const color = getColor(energized, sim);
  const borderColor = energized && sim ? '#3b82f6' : '#4b5563';
  const v = variables[element.address];
  const preset = element.preset ?? v?.timerData?.preset ?? 5000;
  const accMs = element.timerAccumulated ?? v?.timerData?.accumulated ?? 0;
  const done = element.timerDone ?? v?.timerData?.done ?? false;
  const typeLabel = element.type === 'TON_TIMER' ? 'TON' : 'TOF';

  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      {/* Input wire */}
      <line x1="0" y1="40" x2="8" y2="40" stroke={color} strokeWidth="2" />
      {/* Output wire */}
      <line x1="72" y1="40" x2="80" y2="40" stroke={color} strokeWidth="2" />
      {/* Box */}
      <rect x="8" y="4" width="64" height="72" rx="3" fill="#1e293b" stroke={borderColor} strokeWidth="1.5" />
      {/* Type label */}
      <text x="40" y="20" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">{typeLabel}</text>
      {/* Address */}
      <text x="40" y="32" textAnchor="middle" fill="#94a3b8" fontSize="9">{element.address}</text>
      {/* PT label */}
      <text x="14" y="47" fill="#6b7280" fontSize="8">PT</text>
      <text x="60" y="47" textAnchor="end" fill="#94a3b8" fontSize="8">{(preset / 1000).toFixed(1)}s</text>
      {/* ET label */}
      <text x="14" y="60" fill="#6b7280" fontSize="8">ET</text>
      <text x="60" y="60" textAnchor="end" fill={done ? '#22c55e' : '#94a3b8'} fontSize="8">
        {(accMs / 1000).toFixed(1)}s
      </text>
      {/* DN indicator */}
      <circle cx="40" cy="70" r="4" fill={done ? '#22c55e' : '#374151'} />
      <text x="40" y="73" textAnchor="middle" fill={done ? '#fff' : '#6b7280'} fontSize="6">DN</text>
    </svg>
  );
}

function CounterBlock({ element, variables, energized, sim }: {
  element: LadderElementType;
  variables: Record<string, Variable>;
  energized?: boolean;
  sim: boolean;
}) {
  const color = getColor(energized, sim);
  const borderColor = energized && sim ? '#3b82f6' : '#4b5563';
  const v = variables[element.address];
  const preset = element.preset ?? v?.counterData?.preset ?? 5;
  const acc = v?.counterData?.accumulated ?? 0;
  const done = v?.counterData?.done ?? false;
  const typeLabel = element.type === 'CTU_COUNTER' ? 'CTU' : 'CTD';

  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <line x1="0" y1="40" x2="8" y2="40" stroke={color} strokeWidth="2" />
      <line x1="72" y1="40" x2="80" y2="40" stroke={color} strokeWidth="2" />
      <rect x="8" y="4" width="64" height="72" rx="3" fill="#1e293b" stroke={borderColor} strokeWidth="1.5" />
      <text x="40" y="20" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">{typeLabel}</text>
      <text x="40" y="32" textAnchor="middle" fill="#94a3b8" fontSize="9">{element.address}</text>
      <text x="14" y="47" fill="#6b7280" fontSize="8">PV</text>
      <text x="60" y="47" textAnchor="end" fill="#94a3b8" fontSize="8">{preset}</text>
      <text x="14" y="60" fill="#6b7280" fontSize="8">ACC</text>
      <text x="60" y="60" textAnchor="end" fill={done ? '#22c55e' : '#94a3b8'} fontSize="8">{acc}</text>
      <circle cx="40" cy="70" r="4" fill={done ? '#22c55e' : '#374151'} />
      <text x="40" y="73" textAnchor="middle" fill={done ? '#fff' : '#6b7280'} fontSize="6">DN</text>
    </svg>
  );
}

const LadderElementComponent = React.memo(function LadderElementComponent({
  element,
  variables,
  isSelected,
  simulationMode,
  isHighlighted,
  onClick,
  onDoubleClick,
}: Props) {
  const isBlock = element.type === 'TON_TIMER' || element.type === 'TOF_TIMER' ||
                  element.type === 'CTU_COUNTER' || element.type === 'CTD_COUNTER';
  const isCoil = element.type === 'OUTPUT_COIL' || element.type === 'SET_COIL' || element.type === 'RESET_COIL';
  const isContact = !isBlock && !isCoil;

  const v = variables[element.address];
  const varName = v?.name ?? element.address;

  const borderClass = isSelected
    ? 'ring-2 ring-yellow-400'
    : isHighlighted
    ? 'ring-2 ring-purple-400'
    : '';

  return (
    <div
      className={`relative inline-flex flex-col items-center cursor-pointer select-none ${borderClass} rounded`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={`${element.type} — ${varName}\nDouble-click to configure`}
    >
      {/* Address label above */}
      <div className="text-xs text-center mb-0.5 leading-tight" style={{ color: '#94a3b8', maxWidth: isBlock ? 80 : 64 }}>
        <span className="font-mono text-xs" style={{ color: simulationMode && element.energized ? '#93c5fd' : '#94a3b8' }}>
          {element.address}
        </span>
      </div>

      {/* Symbol */}
      {isContact && (
        <ContactSymbol
          type={element.type}
          energized={element.energized}
          sim={simulationMode}
        />
      )}
      {isCoil && (
        <CoilSymbol
          type={element.type}
          energized={element.energized}
          sim={simulationMode}
        />
      )}
      {(element.type === 'TON_TIMER' || element.type === 'TOF_TIMER') && (
        <TimerBlock element={element} variables={variables} energized={element.energized} sim={simulationMode} />
      )}
      {(element.type === 'CTU_COUNTER' || element.type === 'CTD_COUNTER') && (
        <CounterBlock element={element} variables={variables} energized={element.energized} sim={simulationMode} />
      )}

      {/* Name label below */}
      {varName !== element.address && (
        <div className="text-xs text-center mt-0.5 leading-tight" style={{ color: '#64748b', maxWidth: isBlock ? 80 : 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {varName}
        </div>
      )}
    </div>
  );
});

export default LadderElementComponent;
