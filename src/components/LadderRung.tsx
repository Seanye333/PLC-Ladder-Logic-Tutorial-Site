import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, GitBranch, MessageSquare } from 'lucide-react';
import type { Rung, Branch, LadderElement, EditorTool, Variable, CellCoord } from '../engine/types';
import LadderElementComponent from './LadderElement';

interface Props {
  rung: Rung;
  rungIndex: number;
  isSelected: boolean;
  activeTool: EditorTool;
  simulationMode: boolean;
  variables: Record<string, Variable>;
  highlightedElements?: string[];
  highlightedRungs?: string[];
  onElementClick: (coord: CellCoord, element: LadderElement) => void;
  onElementDoubleClick: (element: LadderElement) => void;
  onElementDelete: (coord: CellCoord) => void;
  onSlotClick: (coord: CellCoord) => void;
  onRungDelete: () => void;
  onRungMoveUp: () => void;
  onRungMoveDown: () => void;
  onAddBranch: () => void;
  onDeleteBranch: (branchId: string) => void;
  onCommentChange: (comment: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

function WireLine({ energized, sim, vertical = false, height = 0 }: {
  energized?: boolean; sim: boolean; vertical?: boolean; height?: number;
}) {
  const color = sim && energized ? '#3b82f6' : '#4b5563';
  if (vertical) {
    return (
      <div style={{ width: 2, height, background: color, margin: '0 auto' }} />
    );
  }
  return <div style={{ width: 24, height: 2, background: color, alignSelf: 'center' }} />;
}

const CELL_HEIGHT = 88; // px per branch row

export default function LadderRung({
  rung,
  rungIndex,
  isSelected,
  activeTool,
  simulationMode,
  variables,
  highlightedElements = [],
  highlightedRungs = [],
  onElementClick,
  onElementDoubleClick,
  onElementDelete,
  onSlotClick,
  onRungDelete,
  onRungMoveUp,
  onRungMoveDown,
  onAddBranch,
  onDeleteBranch,
  onCommentChange,
  isFirst,
  isLast,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [editingComment, setEditingComment] = useState(false);
  const [commentDraft, setCommentDraft] = useState(rung.comment ?? '');
  const commentInputRef = useRef<HTMLInputElement>(null);
  const isHighlightedRung = highlightedRungs.includes(rung.id);

  useEffect(() => {
    if (editingComment) commentInputRef.current?.focus();
  }, [editingComment]);

  function commitComment() {
    onCommentChange(commentDraft.trim());
    setEditingComment(false);
  }

  const branchCount = rung.branches.length;
  const totalHeight = branchCount * CELL_HEIGHT;
  const railColor = simulationMode && rung.powerFlow ? '#3b82f6' : '#4b5563';

  const isPlacingTool = activeTool !== 'select' && activeTool !== 'erase';
  const isEraseTool = activeTool === 'erase';

  function renderSlot(coord: CellCoord, placementHint: string) {
    return (
      <div
        key={`slot-${coord.branchIndex}-${coord.elementIndex}`}
        className="flex items-center"
        style={{ height: CELL_HEIGHT }}
      >
        {/* Wire before slot */}
        <WireLine sim={simulationMode} />
        {/* Empty slot */}
        {isPlacingTool ? (
          <div
            className="border-2 border-dashed border-blue-500 bg-blue-900/20 rounded flex items-center justify-center cursor-crosshair hover:bg-blue-800/30 transition-colors"
            style={{ width: 64, height: 48 }}
            onClick={() => onSlotClick(coord)}
            title={`Place ${activeTool} here`}
          >
            <Plus size={16} className="text-blue-400" />
          </div>
        ) : (
          <div
            className="border border-dashed border-slate-700 rounded flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ width: 64, height: 48 }}
            onClick={() => onSlotClick(coord)}
            title="Click to add element"
          >
            <Plus size={12} className="text-slate-500" />
          </div>
        )}
        <WireLine sim={simulationMode} />
      </div>
    );
  }

  function renderBranch(branch: Branch, branchIdx: number) {
    const isMainBranch = branchIdx === 0;

    return (
      <div key={branch.id} className="flex items-center" style={{ height: CELL_HEIGHT, position: 'relative' }}>
        {/* Delete branch button (not for main branch) */}
        {!isMainBranch && branchCount > 1 && !simulationMode && (
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 text-red-500 hover:text-red-400 z-10 opacity-0 group-hover:opacity-100"
            onClick={() => onDeleteBranch(branch.id)}
            title="Delete this branch"
          >
            <Trash2 size={12} />
          </button>
        )}

        {/* Branch elements */}
        {branch.elements.map((el, elIdx) => (
          <React.Fragment key={el.id}>
            <WireLine sim={simulationMode} energized={el.powerIn} />
            <div
              onContextMenu={(e) => {
                e.preventDefault();
                if (!simulationMode) {
                  onElementDelete({ rungIndex, section: 'branch', branchIndex: branchIdx, elementIndex: elIdx });
                }
              }}
            >
              <LadderElementComponent
                element={el}
                variables={variables}
                isSelected={false}
                simulationMode={simulationMode}
                isHighlighted={highlightedElements.includes(el.id)}
                onClick={() => {
                  if (isEraseTool) {
                    onElementDelete({ rungIndex, section: 'branch', branchIndex: branchIdx, elementIndex: elIdx });
                  } else {
                    onElementClick({ rungIndex, section: 'branch', branchIndex: branchIdx, elementIndex: elIdx }, el);
                  }
                }}
                onDoubleClick={() => onElementDoubleClick(el)}
                onDelete={() => onElementDelete({ rungIndex, section: 'branch', branchIndex: branchIdx, elementIndex: elIdx })}
              />
            </div>
            {/* Wire after last element or slot */}
            {elIdx === branch.elements.length - 1 && (
              <WireLine sim={simulationMode} energized={el.powerOut} />
            )}
          </React.Fragment>
        ))}

        {/* Add slot at end of branch */}
        {renderSlot(
          { rungIndex, section: 'branch', branchIndex: branchIdx, elementIndex: branch.elements.length },
          'contact'
        )}
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-stretch mb-2 rounded ${isHighlightedRung ? 'ring-2 ring-purple-400' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rung number + comment */}
      <div className="flex flex-col items-center mr-1 flex-shrink-0" style={{ width: 24 }}>
        <div
          className="text-xs text-slate-600 font-mono cursor-default"
          title="Double-click to add/edit rung comment"
          onDoubleClick={() => { if (!simulationMode) { setCommentDraft(rung.comment ?? ''); setEditingComment(true); } }}
        >
          {rungIndex + 1}
        </div>
        {rung.comment && !editingComment && (
          <div
            className="text-slate-500 cursor-pointer hover:text-blue-400 mt-0.5"
            title={rung.comment}
            onDoubleClick={() => { if (!simulationMode) { setCommentDraft(rung.comment ?? ''); setEditingComment(true); } }}
          >
            <MessageSquare size={9} />
          </div>
        )}
      </div>

      {/* Left power rail */}
      <div
        className="flex-shrink-0 flex items-center"
        style={{ position: 'relative', width: 12 }}
      >
        <div style={{ width: 4, height: totalHeight, background: railColor, borderRadius: 2 }} />
      </div>

      {/* Left vertical connector for parallel branches */}
      {branchCount > 1 && (
        <div style={{ position: 'relative', width: 16, height: totalHeight, flexShrink: 0 }}>
          <svg width="16" height={totalHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* Vertical line connecting all branches on left */}
            <line
              x1="8" y1={CELL_HEIGHT / 2}
              x2="8" y2={totalHeight - CELL_HEIGHT / 2}
              stroke={railColor} strokeWidth="1.5"
            />
            {/* Horizontal taps per branch */}
            {rung.branches.map((_, bIdx) => (
              <line
                key={bIdx}
                x1="8" y1={bIdx * CELL_HEIGHT + CELL_HEIGHT / 2}
                x2="16" y2={bIdx * CELL_HEIGHT + CELL_HEIGHT / 2}
                stroke={railColor} strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>
      )}

      {/* Branches */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rung.branches.map((branch, bIdx) => renderBranch(branch, bIdx))}
      </div>

      {/* Right vertical connector for parallel branches */}
      {branchCount > 1 && (
        <div style={{ position: 'relative', width: 16, height: totalHeight, flexShrink: 0 }}>
          <svg width="16" height={totalHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
            <line
              x1="8" y1={CELL_HEIGHT / 2}
              x2="8" y2={totalHeight - CELL_HEIGHT / 2}
              stroke={simulationMode && rung.powerFlow ? '#3b82f6' : '#4b5563'} strokeWidth="1.5"
            />
            {rung.branches.map((branch, bIdx) => (
              <line
                key={bIdx}
                x1="0" y1={bIdx * CELL_HEIGHT + CELL_HEIGHT / 2}
                x2="8" y2={bIdx * CELL_HEIGHT + CELL_HEIGHT / 2}
                stroke={simulationMode && branch.powerFlow ? '#3b82f6' : '#4b5563'} strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>
      )}

      {/* Wire to output section */}
      <div className="flex items-center" style={{ height: CELL_HEIGHT, alignSelf: 'flex-start' }}>
        <WireLine sim={simulationMode} energized={rung.powerFlow} />
      </div>

      {/* Output elements (coils/timers) */}
      <div className="flex flex-col justify-center">
        {rung.outputElements.map((el, elIdx) => (
          <div key={el.id} className="flex items-center" style={{ height: CELL_HEIGHT }}>
            <div
              onContextMenu={(e) => {
                e.preventDefault();
                if (!simulationMode) {
                  onElementDelete({ rungIndex, section: 'output', branchIndex: 0, elementIndex: elIdx });
                }
              }}
            >
              <LadderElementComponent
                element={el}
                variables={variables}
                isSelected={false}
                simulationMode={simulationMode}
                isHighlighted={highlightedElements.includes(el.id)}
                onClick={() => {
                  if (isEraseTool) {
                    onElementDelete({ rungIndex, section: 'output', branchIndex: 0, elementIndex: elIdx });
                  } else {
                    onElementClick({ rungIndex, section: 'output', branchIndex: 0, elementIndex: elIdx }, el);
                  }
                }}
                onDoubleClick={() => onElementDoubleClick(el)}
                onDelete={() => onElementDelete({ rungIndex, section: 'output', branchIndex: 0, elementIndex: elIdx })}
              />
            </div>
          </div>
        ))}
        {/* Output slot */}
        {rung.outputElements.length === 0 && (
          <div className="flex items-center" style={{ height: CELL_HEIGHT }}>
            {renderSlot(
              { rungIndex, section: 'output', branchIndex: 0, elementIndex: 0 },
              'coil'
            )}
          </div>
        )}
      </div>

      {/* Wire to right rail */}
      <div className="flex items-center" style={{ height: CELL_HEIGHT, alignSelf: 'flex-start' }}>
        <WireLine sim={simulationMode} energized={rung.powerFlow} />
      </div>

      {/* Right power rail */}
      <div className="flex-shrink-0" style={{ position: 'relative', width: 12 }}>
        <div style={{ width: 4, height: totalHeight, background: railColor, borderRadius: 2 }} />
      </div>

      {/* Rung controls (visible on hover) */}
      {!simulationMode && (hovered || isSelected) && (
        <div className="absolute right-0 top-0 flex flex-col gap-1 pr-1 pt-1 z-10" style={{ transform: 'translateX(100%)' }}>
          <button
            className="text-slate-500 hover:text-slate-300 transition-colors"
            onClick={onRungMoveUp}
            disabled={isFirst}
            title="Move rung up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            className="text-slate-500 hover:text-slate-300 transition-colors"
            onClick={onRungMoveDown}
            disabled={isLast}
            title="Move rung down"
          >
            <ChevronDown size={14} />
          </button>
          <button
            className="text-slate-500 hover:text-blue-400 transition-colors"
            onClick={onAddBranch}
            title="Add parallel branch"
          >
            <GitBranch size={14} />
          </button>
          <button
            className="text-slate-500 hover:text-red-400 transition-colors"
            onClick={onRungDelete}
            title="Delete rung"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Rung comment — display or inline edit */}
      {editingComment ? (
        <div className="absolute -top-6 left-8 z-20 flex items-center gap-1">
          <input
            ref={commentInputRef}
            className="bg-slate-700 border border-blue-500 rounded px-2 py-0.5 text-xs text-white font-mono outline-none"
            style={{ minWidth: 180 }}
            value={commentDraft}
            onChange={e => setCommentDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitComment();
              if (e.key === 'Escape') setEditingComment(false);
            }}
            onBlur={commitComment}
            placeholder="Rung comment…"
          />
        </div>
      ) : rung.comment ? (
        <div
          className="absolute -top-5 left-8 text-xs text-slate-500 italic cursor-pointer hover:text-blue-400 transition-colors"
          onDoubleClick={() => { if (!simulationMode) { setCommentDraft(rung.comment ?? ''); setEditingComment(true); } }}
          title="Double-click to edit"
        >
          {rung.comment}
        </div>
      ) : null}
    </div>
  );
}
