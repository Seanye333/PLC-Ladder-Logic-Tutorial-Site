import { useState, useRef, useCallback, useEffect } from 'react';
import type { LadderProgram, SimulatorState, Variable, Rung } from '../engine/types';
import { executeScanCycle } from '../engine/simulator';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function makeInitialState(program: LadderProgram): SimulatorState {
  return {
    mode: 'stopped',
    scanCount: 0,
    scanTimeMs: 0,
    configuredScanRateMs: 100,
    elapsedMs: 0,
    variables: deepClone(program.variables),
    annotatedRungs: deepClone(program.rungs),
  };
}

export function useSimulator(program: LadderProgram) {
  const [state, setState] = useState<SimulatorState>(() => makeInitialState(program));
  const intervalRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());
  const prevVariablesRef = useRef<Record<string, Variable>>(deepClone(program.variables));
  // Keep a ref to current variables for tick closure
  const currentVarsRef = useRef<Record<string, Variable>>(deepClone(program.variables));
  const currentProgramRef = useRef<LadderProgram>(program);

  // Sync program ref when program changes
  useEffect(() => {
    currentProgramRef.current = program;
  }, [program]);

  const tick = useCallback(() => {
    const now = performance.now();
    const elapsedMs = now - lastTickRef.current;
    lastTickRef.current = now;

    const scanStart = performance.now();
    const { variables: nextVars, annotatedRungs } = executeScanCycle(
      currentProgramRef.current,
      currentVarsRef.current,
      elapsedMs,
      prevVariablesRef.current
    );

    prevVariablesRef.current = currentVarsRef.current;
    currentVarsRef.current = nextVars;

    setState(prev => ({
      ...prev,
      scanCount: prev.scanCount + 1,
      scanTimeMs: performance.now() - scanStart,
      elapsedMs: prev.elapsedMs + elapsedMs,
      variables: nextVars,
      annotatedRungs,
    }));
  }, []);

  const run = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    lastTickRef.current = performance.now();
    setState(prev => {
      intervalRef.current = window.setInterval(tick, prev.configuredScanRateMs);
      return { ...prev, mode: 'running' };
    });
  }, [tick]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({ ...prev, mode: 'paused' }));
  }, []);

  const step = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    tick();
    setState(prev => ({ ...prev, mode: 'paused' }));
  }, [tick]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const fresh = deepClone(currentProgramRef.current.variables);
    prevVariablesRef.current = deepClone(fresh);
    currentVarsRef.current = deepClone(fresh);
    setState(prev => ({
      mode: 'stopped',
      scanCount: 0,
      scanTimeMs: 0,
      configuredScanRateMs: prev.configuredScanRateMs,
      elapsedMs: 0,
      variables: fresh,
      annotatedRungs: deepClone(currentProgramRef.current.rungs),
    }));
  }, []);

  const toggleInput = useCallback((address: string) => {
    setState(prev => {
      const v = prev.variables[address];
      if (!v) return prev;
      const updated = { ...prev.variables, [address]: { ...v, value: !v.value } };
      currentVarsRef.current = updated;
      return { ...prev, variables: updated };
    });
  }, []);

  const setScanRate = useCallback((ms: number) => {
    setState(prev => {
      if (prev.mode === 'running') {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(tick, ms);
      }
      return { ...prev, configuredScanRateMs: ms };
    });
  }, [tick]);

  // Reset when program structure changes
  const resetToProgram = useCallback((newProgram: LadderProgram) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const fresh = deepClone(newProgram.variables);
    prevVariablesRef.current = deepClone(fresh);
    currentVarsRef.current = deepClone(fresh);
    currentProgramRef.current = newProgram;
    setState({
      mode: 'stopped',
      scanCount: 0,
      scanTimeMs: 0,
      configuredScanRateMs: 100,
      elapsedMs: 0,
      variables: fresh,
      annotatedRungs: deepClone(newProgram.rungs),
    });
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { state, run, pause, step, stop, toggleInput, setScanRate, resetToProgram };
}
