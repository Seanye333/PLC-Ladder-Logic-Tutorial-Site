import { Plus } from 'lucide-react';
import type { LadderProgram, Rung, LadderElement, EditorTool, Variable, CellCoord } from '../engine/types';
import LadderRungComponent from './LadderRung';

interface Props {
  program: LadderProgram;
  annotatedRungs: Rung[];
  variables: Record<string, Variable>;
  activeTool: EditorTool;
  simulationMode: boolean;
  highlightedElements?: string[];
  highlightedRungs?: string[];
  onAddRung: () => void;
  onDeleteRung: (rungId: string) => void;
  onMoveRung: (rungId: string, dir: 'up' | 'down') => void;
  onAddBranch: (rungId: string) => void;
  onDeleteBranch: (rungId: string, branchId: string) => void;
  onRungCommentChange: (rungId: string, comment: string) => void;
  onElementClick: (coord: CellCoord, el: LadderElement) => void;
  onElementDoubleClick: (el: LadderElement) => void;
  onElementDelete: (coord: CellCoord) => void;
  onSlotClick: (coord: CellCoord) => void;
}

export default function LadderCanvas({
  program,
  annotatedRungs,
  variables,
  activeTool,
  simulationMode,
  highlightedElements = [],
  highlightedRungs = [],
  onAddRung,
  onDeleteRung,
  onMoveRung,
  onAddBranch,
  onDeleteBranch,
  onRungCommentChange,
  onElementClick,
  onElementDoubleClick,
  onElementDelete,
  onSlotClick,
}: Props) {
  // Use annotated rungs (with power flow) during simulation, otherwise program rungs
  const displayRungs = simulationMode ? annotatedRungs : program.rungs;

  return (
    <div className="ladder-canvas-scroll flex-1 p-4" style={{ minWidth: 0 }}>
      {displayRungs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-500">
          <div className="text-lg mb-2">Empty Program</div>
          <div className="text-sm mb-4">Click "Add Rung" to start building your ladder logic</div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            onClick={onAddRung}
          >
            <Plus size={16} />
            Add First Rung
          </button>
        </div>
      ) : (
        <>
          {displayRungs.map((rung, rungIdx) => (
            <LadderRungComponent
              key={rung.id}
              rung={rung}
              rungIndex={rungIdx}
              isSelected={false}
              activeTool={activeTool}
              simulationMode={simulationMode}
              variables={variables}
              highlightedElements={highlightedElements}
              highlightedRungs={highlightedRungs}
              onElementClick={(coord, el) => onElementClick(coord, el)}
              onElementDoubleClick={onElementDoubleClick}
              onElementDelete={onElementDelete}
              onSlotClick={onSlotClick}
              onRungDelete={() => onDeleteRung(rung.id)}
              onRungMoveUp={() => onMoveRung(rung.id, 'up')}
              onRungMoveDown={() => onMoveRung(rung.id, 'down')}
              onAddBranch={() => onAddBranch(rung.id)}
              onDeleteBranch={(branchId) => onDeleteBranch(rung.id, branchId)}
              onCommentChange={(comment) => onRungCommentChange(rung.id, comment)}
              isFirst={rungIdx === 0}
              isLast={rungIdx === displayRungs.length - 1}
            />
          ))}

          {!simulationMode && (
            <button
              className="mt-4 flex items-center gap-2 px-3 py-1.5 border border-dashed border-slate-600 hover:border-blue-500 text-slate-500 hover:text-blue-400 rounded-lg transition-colors text-sm"
              onClick={onAddRung}
            >
              <Plus size={14} />
              Add Rung
            </button>
          )}
        </>
      )}
    </div>
  );
}
