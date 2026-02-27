import { MousePointer2, Eraser } from 'lucide-react';
import type { EditorTool, ElementType } from '../engine/types';

interface Props {
  activeTool: EditorTool;
  onToolSelect: (tool: EditorTool) => void;
}

interface ToolItem {
  type: EditorTool;
  label: string;
  symbol: string;
  description: string;
  group: string;
}

const TOOLS: ToolItem[] = [
  // Tools
  { type: 'select', label: 'Select', symbol: '↖', description: 'Select / inspect elements', group: 'tools' },
  { type: 'erase', label: 'Erase', symbol: '✕', description: 'Click elements to delete', group: 'tools' },
  // Contacts
  { type: 'NO_CONTACT', label: 'NO Contact', symbol: '┤ ├', description: 'Normally Open: passes when bit is TRUE', group: 'contacts' },
  { type: 'NC_CONTACT', label: 'NC Contact', symbol: '┤/├', description: 'Normally Closed: passes when bit is FALSE', group: 'contacts' },
  { type: 'POS_EDGE', label: 'Pos Edge', symbol: '┤P├', description: 'Rising edge: one-shot on 0→1 transition', group: 'contacts' },
  { type: 'NEG_EDGE', label: 'Neg Edge', symbol: '┤N├', description: 'Falling edge: one-shot on 1→0 transition', group: 'contacts' },
  // Coils
  { type: 'OUTPUT_COIL', label: 'Coil', symbol: '( )', description: 'Output coil: bit = rung power', group: 'coils' },
  { type: 'SET_COIL', label: 'Set', symbol: '(S)', description: 'Set coil: latches bit ON', group: 'coils' },
  { type: 'RESET_COIL', label: 'Reset', symbol: '(R)', description: 'Reset coil: clears bit / resets counter', group: 'coils' },
  // Timers
  { type: 'TON_TIMER', label: 'TON', symbol: '⏱+', description: 'Timer ON Delay: output after preset time of continuous input', group: 'timers' },
  { type: 'TOF_TIMER', label: 'TOF', symbol: '⏱-', description: 'Timer OFF Delay: output stays ON for preset time after input drops', group: 'timers' },
  // Counters
  { type: 'CTU_COUNTER', label: 'CTU', symbol: '↑⊞', description: 'Count Up: increments on rising edge, done when ACC ≥ PV', group: 'counters' },
  { type: 'CTD_COUNTER', label: 'CTD', symbol: '↓⊞', description: 'Count Down: decrements on rising edge, done when ACC ≤ 0', group: 'counters' },
];

const GROUP_LABELS: Record<string, string> = {
  tools: 'Tools',
  contacts: 'Contacts',
  coils: 'Coils',
  timers: 'Timers',
  counters: 'Counters',
};

const GROUP_ORDER = ['tools', 'contacts', 'coils', 'timers', 'counters'];

export default function ElementPalette({ activeTool, onToolSelect }: Props) {
  const groups = GROUP_ORDER.map(g => ({
    key: g,
    label: GROUP_LABELS[g],
    items: TOOLS.filter(t => t.group === g),
  }));

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border-b border-slate-700 overflow-x-auto">
      {groups.map((group, gIdx) => (
        <div key={group.key} className="flex items-center gap-1">
          {gIdx > 0 && <div className="w-px h-6 bg-slate-600 mx-1 flex-shrink-0" />}
          <span className="text-xs text-slate-500 mr-1 flex-shrink-0 hidden md:inline">{group.label}:</span>
          {group.items.map(item => (
            <button
              key={item.type}
              onClick={() => onToolSelect(item.type)}
              title={`${item.label}\n${item.description}`}
              className={`
                flex flex-col items-center justify-center px-2 py-1 rounded text-xs font-mono transition-all flex-shrink-0
                ${activeTool === item.type
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'}
              `}
              style={{ minWidth: 44, height: 36 }}
            >
              {item.type === 'select' ? (
                <MousePointer2 size={14} />
              ) : item.type === 'erase' ? (
                <Eraser size={14} />
              ) : (
                <span className="text-xs leading-none">{item.symbol}</span>
              )}
              <span className="text-xs leading-none mt-0.5 hidden lg:inline" style={{ fontSize: 9 }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      ))}

      {/* Keyboard hint */}
      <div className="ml-auto text-xs text-slate-600 flex-shrink-0 hidden xl:block">
        Esc=select · Del=erase · Right-click=delete · Dbl-click=configure
      </div>
    </div>
  );
}
