import type {
  LadderProgram,
  LadderElement,
  Rung,
  Branch,
  Variable,
  TimerData,
  CounterData,
  Exercise,
  TestVector,
  ValidationResult,
  FailedVector,
  ElementType,
} from './types';

// ============================================================
// DEEP CLONE
// ============================================================
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================
// HELPER: GET BOOLEAN VALUE FROM VARIABLE
// ============================================================
function getBoolValue(variable: Variable | undefined): boolean {
  if (!variable) return false;
  if (variable.type === 'BOOL') return variable.value as boolean;
  if (variable.type === 'TIMER') return variable.timerData?.done ?? false;
  if (variable.type === 'COUNTER') return variable.counterData?.done ?? false;
  return false;
}

// ============================================================
// EVALUATE CONTACT ELEMENT
// Returns true if power passes through
// ============================================================
function evaluateContact(
  element: LadderElement,
  inputImage: Record<string, Variable>,
  prevVariables: Record<string, Variable>
): boolean {
  const variable = inputImage[element.address];
  const currentBit = getBoolValue(variable);
  const prevBit = getBoolValue(prevVariables[element.address]);

  switch (element.type) {
    case 'NO_CONTACT':
      return currentBit;
    case 'NC_CONTACT':
      return !currentBit;
    case 'POS_EDGE':
      return currentBit && !prevBit;
    case 'NEG_EDGE':
      return !currentBit && prevBit;
    default:
      return false;
  }
}

// ============================================================
// EVALUATE BRANCH (series = AND logic)
// ============================================================
function evaluateBranch(
  branch: Branch,
  inputImage: Record<string, Variable>,
  prevVariables: Record<string, Variable>
): { power: boolean; elements: LadderElement[] } {
  let power = true;
  const annotated: LadderElement[] = [];

  for (const el of branch.elements) {
    const powerIn = power;
    const passes = evaluateContact(el, inputImage, prevVariables);
    power = power && passes;

    annotated.push({
      ...el,
      powerIn,
      powerOut: power,
      energized: passes,
    });
  }

  return { power, elements: annotated };
}

// ============================================================
// EXECUTE OUTPUT ELEMENT
// ============================================================
function executeOutput(
  element: LadderElement,
  rungPower: boolean,
  outputImage: Record<string, Variable>,
  elapsedMs: number,
  prevVariables: Record<string, Variable>
): LadderElement {
  const annotated: LadderElement = { ...element, powerIn: rungPower, energized: rungPower };

  switch (element.type) {
    case 'OUTPUT_COIL': {
      if (outputImage[element.address]) {
        outputImage[element.address] = {
          ...outputImage[element.address],
          value: rungPower,
        };
      }
      break;
    }

    case 'SET_COIL': {
      if (rungPower && outputImage[element.address]) {
        outputImage[element.address] = {
          ...outputImage[element.address],
          value: true,
        };
      }
      break;
    }

    case 'RESET_COIL': {
      if (rungPower && outputImage[element.address]) {
        const v = outputImage[element.address];
        if (v.type === 'BOOL') {
          outputImage[element.address] = { ...v, value: false };
        } else if (v.type === 'COUNTER' && v.counterData) {
          outputImage[element.address] = {
            ...v,
            counterData: { ...v.counterData, accumulated: 0, done: false },
            value: false,
          };
        }
      }
      break;
    }

    case 'TON_TIMER': {
      const v = outputImage[element.address];
      if (!v?.timerData) break;
      const td = { ...v.timerData };
      td.enabled = rungPower;

      if (rungPower) {
        td.timing = !td.done;
        if (!td.done) {
          td.accumulated = Math.min(td.accumulated + elapsedMs, td.preset);
          td.done = td.accumulated >= td.preset;
          if (td.done) td.timing = false;
        }
      } else {
        td.accumulated = 0;
        td.done = false;
        td.timing = false;
      }

      outputImage[element.address] = { ...v, value: td.done, timerData: td };
      annotated.timerAccumulated = td.accumulated;
      annotated.timerDone = td.done;
      annotated.timerTiming = td.timing;
      break;
    }

    case 'TOF_TIMER': {
      const v = outputImage[element.address];
      if (!v?.timerData) break;
      const td = { ...v.timerData };
      const wasEnabled = prevVariables[element.address]?.timerData?.enabled ?? false;

      if (rungPower) {
        td.enabled = true;
        td.done = true;
        td.accumulated = 0;
        td.timing = false;
      } else {
        if (wasEnabled) {
          td.timing = true;
        }
        td.enabled = false;
        if (td.timing) {
          td.accumulated = Math.min(td.accumulated + elapsedMs, td.preset);
          if (td.accumulated >= td.preset) {
            td.done = false;
            td.timing = false;
          }
        }
      }

      outputImage[element.address] = { ...v, value: td.done, timerData: td };
      annotated.timerAccumulated = td.accumulated;
      annotated.timerDone = td.done;
      annotated.timerTiming = td.timing;
      break;
    }

    case 'CTU_COUNTER': {
      const v = outputImage[element.address];
      if (!v?.counterData) break;
      const cd = { ...v.counterData };
      const prevCU = element.prevCU ?? false;

      if (rungPower && !prevCU) {
        cd.accumulated = Math.min(cd.accumulated + 1, 32767);
        if (cd.accumulated === 32767) cd.overflow = true;
      }
      cd.done = cd.accumulated >= cd.preset;
      outputImage[element.address] = { ...v, value: cd.done, counterData: cd };
      annotated.prevCU = rungPower;
      break;
    }

    case 'CTD_COUNTER': {
      const v = outputImage[element.address];
      if (!v?.counterData) break;
      const cd = { ...v.counterData };
      const prevCU = element.prevCU ?? false;

      if (rungPower && !prevCU) {
        cd.accumulated = Math.max(cd.accumulated - 1, -32768);
        if (cd.accumulated === -32768) cd.underflow = true;
      }
      cd.done = cd.accumulated <= 0;
      outputImage[element.address] = { ...v, value: cd.done, counterData: cd };
      annotated.prevCU = rungPower;
      break;
    }
  }

  return annotated;
}

// ============================================================
// EXECUTE SCAN CYCLE
// Returns: { variables: updated variables, annotatedRungs: rungs with power flow }
// ============================================================
export function executeScanCycle(
  program: LadderProgram,
  currentVariables: Record<string, Variable>,
  elapsedMs: number,
  prevVariables: Record<string, Variable>
): { variables: Record<string, Variable>; annotatedRungs: Rung[] } {
  const inputImage = deepClone(currentVariables);
  const outputImage = deepClone(currentVariables);
  const annotatedRungs: Rung[] = [];

  for (const rung of program.rungs) {
    let rungPower = false;
    const annotatedBranches: Branch[] = [];

    for (const branch of rung.branches) {
      const { power, elements } = evaluateBranch(branch, inputImage, prevVariables);
      if (power) rungPower = true;
      annotatedBranches.push({ ...branch, elements, powerFlow: power });
    }

    const annotatedOutputs: LadderElement[] = [];
    for (const outEl of rung.outputElements) {
      const annotated = executeOutput(outEl, rungPower, outputImage, elapsedMs, prevVariables);
      annotatedOutputs.push(annotated);
    }

    annotatedRungs.push({
      ...rung,
      branches: annotatedBranches,
      outputElements: annotatedOutputs,
      powerFlow: rungPower,
    });
  }

  return { variables: outputImage, annotatedRungs };
}

// ============================================================
// EXERCISE VALIDATION
// ============================================================

function getAllElementTypes(program: LadderProgram): Set<ElementType> {
  const types = new Set<ElementType>();
  for (const rung of program.rungs) {
    for (const branch of rung.branches) {
      for (const el of branch.elements) types.add(el.type);
    }
    for (const el of rung.outputElements) types.add(el.type);
  }
  return types;
}

function runTestVector(
  program: LadderProgram,
  vector: TestVector,
  initialVars?: Record<string, Variable>
): { finalVars: Record<string, Variable>; outputs: Record<string, boolean | number> } {
  let variables = initialVars ? deepClone(initialVars) : deepClone(program.variables);

  // Apply inputs
  for (const [address, value] of Object.entries(vector.inputs)) {
    if (variables[address]) {
      variables[address] = { ...variables[address], value };
    }
  }

  const durationMs = vector.durationMs ?? 200;
  const scanStep = 10; // ms per sim step
  let elapsed = 0;
  let prevVars = deepClone(variables);

  while (elapsed < durationMs) {
    const step = Math.min(scanStep, durationMs - elapsed);
    const { variables: next } = executeScanCycle(program, variables, step, prevVars);
    prevVars = variables;
    variables = next;
    elapsed += step;
  }

  const outputs: Record<string, boolean | number> = {};
  for (const [addr, v] of Object.entries(variables)) {
    outputs[addr] = v.value;
  }

  return { finalVars: variables, outputs };
}

export function validateExercise(
  program: LadderProgram,
  exercise: Exercise
): ValidationResult {
  const failedVectors: FailedVector[] = [];
  const feedback: string[] = [];

  // Check required elements
  if (exercise.requiredElements) {
    const used = getAllElementTypes(program);
    for (const req of exercise.requiredElements) {
      if (!used.has(req)) {
        feedback.push(`Missing required element type: ${req}`);
      }
    }
  }

  // Check forbidden elements
  if (exercise.forbiddenElements) {
    const used = getAllElementTypes(program);
    for (const forbidden of exercise.forbiddenElements) {
      if (used.has(forbidden)) {
        feedback.push(`Forbidden element used: ${forbidden}`);
      }
    }
  }

  // Validate program has at least one rung
  if (program.rungs.length === 0) {
    feedback.push('Your program is empty. Add some rungs and elements.');
    return { passed: false, score: 0, failedVectors: [], feedback, hints: exercise.hints.slice(0, 1) };
  }

  // Run test vectors
  const stateCache = new Map<string, Record<string, Variable>>();

  for (const vector of exercise.testVectors) {
    const startState = vector.chainFrom ? stateCache.get(vector.chainFrom) : undefined;
    const { finalVars, outputs } = runTestVector(program, vector, startState);
    stateCache.set(vector.id, finalVars);

    let passed = true;
    for (const [address, expected] of Object.entries(vector.expectedOutputs)) {
      if (outputs[address] !== expected) {
        passed = false;
        break;
      }
    }

    if (!passed) {
      failedVectors.push({
        vectorId: vector.id,
        description: vector.description,
        inputs: vector.inputs,
        expectedOutputs: vector.expectedOutputs,
        actualOutputs: outputs,
      });
    }
  }

  const overallPassed = failedVectors.length === 0 && feedback.length === 0;
  const score = exercise.testVectors.length === 0
    ? 100
    : Math.round(((exercise.testVectors.length - failedVectors.length) / exercise.testVectors.length) * 100);

  return {
    passed: overallPassed,
    score,
    failedVectors,
    feedback,
    hints: overallPassed ? [] : exercise.hints,
  };
}
