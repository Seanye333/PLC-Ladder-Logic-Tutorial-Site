import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  LadderProgram,
  LadderElement,
  ElementType,
  EditorTool,
  Variable,
  VariableArea,
  CellCoord,
  Rung,
  Branch,
} from '../engine/types';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================
// HELPER: determine which area new elements default to
// ============================================================
function defaultAreaForType(type: ElementType): VariableArea {
  switch (type) {
    case 'NO_CONTACT':
    case 'NC_CONTACT':
    case 'POS_EDGE':
    case 'NEG_EDGE':
      return 'I';
    case 'OUTPUT_COIL':
    case 'SET_COIL':
    case 'RESET_COIL':
      return 'Q';
    case 'TON_TIMER':
    case 'TOF_TIMER':
      return 'T';
    case 'CTU_COUNTER':
    case 'CTD_COUNTER':
      return 'C';
  }
}

function findNextAddress(area: VariableArea, variables: Record<string, Variable>): string {
  if (area === 'T' || area === 'C') {
    for (let i = 0; i < 64; i++) {
      const addr = `${area}${i}`;
      if (!variables[addr]) return addr;
    }
    return `${area}0`;
  }
  // Bit-addressed (I, Q, M)
  for (let byte = 0; byte < 8; byte++) {
    for (let bit = 0; bit < 8; bit++) {
      const addr = `${area}${byte}.${bit}`;
      if (!variables[addr]) return addr;
    }
  }
  return `${area}0.0`;
}

function createDefaultVariable(address: string, area: VariableArea, type: ElementType): Variable {
  if (type === 'TON_TIMER' || type === 'TOF_TIMER') {
    return {
      address,
      area,
      name: address,
      type: 'TIMER',
      value: false,
      timerData: {
        preset: 5000,
        accumulated: 0,
        done: false,
        timing: false,
        enabled: false,
        timerType: type === 'TON_TIMER' ? 'TON' : 'TOF',
      },
    };
  }
  if (type === 'CTU_COUNTER' || type === 'CTD_COUNTER') {
    return {
      address,
      area,
      name: address,
      type: 'COUNTER',
      value: false,
      counterData: {
        preset: 5,
        accumulated: 0,
        done: false,
        overflow: false,
        underflow: false,
        counterType: type === 'CTU_COUNTER' ? 'CTU' : 'CTD',
      },
    };
  }
  return {
    address,
    area,
    name: address,
    type: 'BOOL',
    value: false,
  };
}

function createElement(type: ElementType, address: string, preset?: number): LadderElement {
  return {
    id: uuidv4(),
    type,
    address,
    preset,
  };
}

function createEmptyRung(): Rung {
  return {
    id: uuidv4(),
    branches: [{ id: uuidv4(), elements: [] }],
    outputElements: [],
  };
}

function createEmptyBranch(): Branch {
  return { id: uuidv4(), elements: [] };
}

// ============================================================
// EDITOR HOOK
// ============================================================
export function useEditor(initialProgram: LadderProgram) {
  const [program, setProgram] = useState<LadderProgram>(initialProgram);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [configTarget, setConfigTarget] = useState<LadderElement | null>(null);

  const historyRef = useRef<LadderProgram[]>([deepClone(initialProgram)]);
  const historyIndexRef = useRef<number>(0);

  const pushHistory = useCallback((newProgram: LadderProgram) => {
    const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
    truncated.push(deepClone(newProgram));
    historyRef.current = truncated.slice(-50); // keep last 50
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const updateProgram = useCallback((updater: (prev: LadderProgram) => LadderProgram) => {
    setProgram(prev => {
      const next = updater(prev);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setProgram(deepClone(historyRef.current[historyIndexRef.current]));
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      setProgram(deepClone(historyRef.current[historyIndexRef.current]));
    }
  }, []);

  // Load a new program (for tutorials/exercises)
  const loadProgram = useCallback((newProgram: LadderProgram) => {
    historyRef.current = [deepClone(newProgram)];
    historyIndexRef.current = 0;
    setProgram(deepClone(newProgram));
    setSelectedId(null);
    setConfigTarget(null);
    setActiveTool('select');
  }, []);

  // ---- RUNG OPERATIONS ----

  const addRung = useCallback(() => {
    updateProgram(prev => ({
      ...prev,
      rungs: [...prev.rungs, createEmptyRung()],
    }));
  }, [updateProgram]);

  const deleteRung = useCallback((rungId: string) => {
    updateProgram(prev => ({
      ...prev,
      rungs: prev.rungs.filter(r => r.id !== rungId),
    }));
  }, [updateProgram]);

  const moveRung = useCallback((rungId: string, dir: 'up' | 'down') => {
    updateProgram(prev => {
      const idx = prev.rungs.findIndex(r => r.id === rungId);
      if (idx < 0) return prev;
      const newRungs = [...prev.rungs];
      const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= newRungs.length) return prev;
      [newRungs[idx], newRungs[targetIdx]] = [newRungs[targetIdx], newRungs[idx]];
      return { ...prev, rungs: newRungs };
    });
  }, [updateProgram]);

  // ---- BRANCH OPERATIONS ----

  const addBranch = useCallback((rungId: string) => {
    updateProgram(prev => ({
      ...prev,
      rungs: prev.rungs.map(r =>
        r.id === rungId
          ? { ...r, branches: [...r.branches, createEmptyBranch()] }
          : r
      ),
    }));
  }, [updateProgram]);

  const deleteBranch = useCallback((rungId: string, branchId: string) => {
    updateProgram(prev => ({
      ...prev,
      rungs: prev.rungs.map(r => {
        if (r.id !== rungId) return r;
        if (r.branches.length <= 1) return r; // must keep at least 1
        return { ...r, branches: r.branches.filter(b => b.id !== branchId) };
      }),
    }));
  }, [updateProgram]);

  // ---- ELEMENT PLACEMENT ----

  const placeElement = useCallback((coord: CellCoord, type: ElementType) => {
    updateProgram(prev => {
      const area = defaultAreaForType(type);
      const address = findNextAddress(area, prev.variables);
      const newVar = createDefaultVariable(address, area, type);
      const newEl = createElement(type, address, newVar.timerData?.preset ?? newVar.counterData?.preset);

      const newRungs = prev.rungs.map((rung, rungIdx) => {
        if (rungIdx !== coord.rungIndex) return rung;

        if (coord.section === 'output') {
          return {
            ...rung,
            outputElements: [
              ...rung.outputElements.slice(0, coord.elementIndex),
              newEl,
              ...rung.outputElements.slice(coord.elementIndex),
            ],
          };
        }

        // branch section
        return {
          ...rung,
          branches: rung.branches.map((branch, bIdx) => {
            if (bIdx !== coord.branchIndex) return branch;
            return {
              ...branch,
              elements: [
                ...branch.elements.slice(0, coord.elementIndex),
                newEl,
                ...branch.elements.slice(coord.elementIndex),
              ],
            };
          }),
        };
      });

      return {
        ...prev,
        rungs: newRungs,
        variables: { ...prev.variables, [address]: newVar },
      };
    });
  }, [updateProgram]);

  const deleteElement = useCallback((coord: CellCoord) => {
    updateProgram(prev => ({
      ...prev,
      rungs: prev.rungs.map((rung, rungIdx) => {
        if (rungIdx !== coord.rungIndex) return rung;
        if (coord.section === 'output') {
          return {
            ...rung,
            outputElements: rung.outputElements.filter((_, i) => i !== coord.elementIndex),
          };
        }
        return {
          ...rung,
          branches: rung.branches.map((branch, bIdx) => {
            if (bIdx !== coord.branchIndex) return branch;
            return { ...branch, elements: branch.elements.filter((_, i) => i !== coord.elementIndex) };
          }),
        };
      }),
    }));
  }, [updateProgram]);

  const updateElement = useCallback((elementId: string, updates: Partial<LadderElement>) => {
    updateProgram(prev => ({
      ...prev,
      rungs: prev.rungs.map(rung => ({
        ...rung,
        branches: rung.branches.map(branch => ({
          ...branch,
          elements: branch.elements.map(el =>
            el.id === elementId ? { ...el, ...updates } : el
          ),
        })),
        outputElements: rung.outputElements.map(el =>
          el.id === elementId ? { ...el, ...updates } : el
        ),
      })),
    }));
  }, [updateProgram]);

  const addVariable = useCallback((variable: Variable) => {
    updateProgram(prev => ({
      ...prev,
      variables: { ...prev.variables, [variable.address]: variable },
    }));
  }, [updateProgram]);

  const updateVariable = useCallback((address: string, updates: Partial<Variable>) => {
    updateProgram(prev => {
      const existing = prev.variables[address];
      if (!existing) return prev;
      return {
        ...prev,
        variables: { ...prev.variables, [address]: { ...existing, ...updates } },
      };
    });
  }, [updateProgram]);

  const setRungComment = useCallback((rungId: string, comment: string) => {
    updateProgram(prev => ({
      ...prev,
      rungs: prev.rungs.map(r => r.id === rungId ? { ...r, comment: comment || undefined } : r),
    }));
  }, [updateProgram]);

  const renameProgram = useCallback((name: string) => {
    updateProgram(prev => ({ ...prev, name }));
  }, [updateProgram]);

  return {
    program,
    activeTool,
    selectedId,
    configTarget,
    setActiveTool,
    setSelectedId,
    setConfigTarget,
    addRung,
    deleteRung,
    moveRung,
    addBranch,
    deleteBranch,
    placeElement,
    deleteElement,
    updateElement,
    addVariable,
    updateVariable,
    setRungComment,
    renameProgram,
    loadProgram,
    undo,
    redo,
  };
}
