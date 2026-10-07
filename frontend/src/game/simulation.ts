import type { AgentMode, AgentState, EvaluationMetrics, Vec2 } from "../types/game";
import { decideBaselineAgent } from "./baselineAgent";
import { createConnectomeMemory, decideConnectomeAgent, type ConnectomeAgentMemory } from "./connectomeAgent";
import { blend, distance, limitMagnitude } from "./math";
import { ARENA } from "./simulationConfig";
import { calculateThreat } from "./threat";

export { ARENA } from "./simulationConfig";

export type SimulationState = {
  fly: Vec2;
  flyVelocity: Vec2;
  cursor: Vec2 | null;
  previousCursor: Vec2 | null;
  lastTimestamp: number | null;
  episodeStartedAt: number;
  attemptActive: boolean;
  attemptStartedAt: number | null;
  threatCrossedAt: number | null;
  reactionRecorded: boolean;
  metrics: EvaluationMetrics;
  agentState: AgentState;
  connectomeMemory: ConnectomeAgentMemory;
};

export type StepResult = {
  state: SimulationState;
  cursorDistance: number;
};

const initialFly: Vec2 = { x: ARENA.width * 0.52, y: ARENA.height * 0.5 };
const MAX_TRACKING_SPEED = 150;
const MAX_ESCAPE_SPEED = 225;
const MAX_IDLE_SPEED = 42;

export function createInitialState(now = performance.now()): SimulationState {
  return {
    fly: { ...initialFly },
    flyVelocity: { x: 0, y: 0 },
    cursor: null,
    previousCursor: null,
    lastTimestamp: null,
    episodeStartedAt: now,
    attemptActive: false,
    attemptStartedAt: null,
    threatCrossedAt: null,
    reactionRecorded: false,
    metrics: {
      attempts: 0,
      escapes: 0,
      caught: 0,
      falseEscapes: 0,
      avgReactionTimeMs: 0,
      currentSurvivalTimeMs: 0,
      longestSurvivalTimeMs: 0,
      closestCursorDistance: Number.POSITIVE_INFINITY,
      movementDistance: 0
    },
    agentState: {
      threat: 0,
      sensoryActivity: 0,
      decision: "IDLE",
      escapeDirection: { x: 0, y: 0 },
      reactionTimeMs: null
    },
    connectomeMemory: createConnectomeMemory()
  };
}

function boundedFlyPosition(position: Vec2): Vec2 {
  return {
    x: Math.max(ARENA.padding, Math.min(ARENA.width - ARENA.padding, position.x)),
    y: Math.max(ARENA.padding, Math.min(ARENA.height - ARENA.padding, position.y))
  };
}

function recordReaction(state: SimulationState, now: number): void {
  if (!state.threatCrossedAt || state.reactionRecorded) {
    return;
  }
  const reactionTime = now - state.threatCrossedAt;
  const previousTotal = state.metrics.avgReactionTimeMs * Math.max(0, state.metrics.escapes + state.metrics.caught - 1);
  const sampleCount = Math.max(1, state.metrics.escapes + state.metrics.caught);
  state.metrics.avgReactionTimeMs = (previousTotal + reactionTime) / sampleCount;
  state.agentState.reactionTimeMs = reactionTime;
  state.reactionRecorded = true;
}

export function stepSimulation(previous: SimulationState, now: number, agentMode: AgentMode): StepResult {
  const state: SimulationState = {
    ...previous,
    fly: { ...previous.fly },
    flyVelocity: { ...previous.flyVelocity },
    cursor: previous.cursor ? { ...previous.cursor } : null,
    previousCursor: previous.previousCursor ? { ...previous.previousCursor } : null,
    metrics: { ...previous.metrics },
    agentState: {
      ...previous.agentState,
      escapeDirection: { ...previous.agentState.escapeDirection }
    },
    connectomeMemory: {
      activations: [...previous.connectomeMemory.activations],
      motorDirection: { ...previous.connectomeMemory.motorDirection },
      burst: previous.connectomeMemory.burst,
      jink: previous.connectomeMemory.jink
    }
  };

  const dt = Math.min(0.04, Math.max(0.001, (now - (state.lastTimestamp ?? now - 16)) / 1000));
  const survivalTime = now - state.episodeStartedAt;
  const threatState = calculateThreat({
    fly: state.fly,
    cursor: state.cursor,
    previousCursor: state.previousCursor,
    dt
  });
  const cursorDistance = threatState.cursorDistance;

  state.metrics.currentSurvivalTimeMs = survivalTime;
  state.metrics.longestSurvivalTimeMs = Math.max(state.metrics.longestSurvivalTimeMs, survivalTime);
  state.metrics.closestCursorDistance = Math.min(state.metrics.closestCursorDistance, cursorDistance);

  if (state.cursor && cursorDistance < ARENA.attemptRadius && !state.attemptActive) {
    state.attemptActive = true;
    state.attemptStartedAt = now;
    state.metrics.attempts += 1;
    state.threatCrossedAt = null;
    state.reactionRecorded = false;
    state.agentState.reactionTimeMs = null;
  }

  if (threatState.threat > 58 && !state.threatCrossedAt) {
    state.threatCrossedAt = now;
  }

  if (threatState.threat > 58) {
    recordReaction(state, now);
  }

  const baselineOutput = decideBaselineAgent(threatState, state.agentState.reactionTimeMs);
  let selectedAgentOutput = baselineOutput;

  if (agentMode === "CONNECTOME") {
    const connectomeOutput = decideConnectomeAgent(threatState, state.agentState.reactionTimeMs, state.connectomeMemory);
    state.connectomeMemory = connectomeOutput.memory;
    selectedAgentOutput = connectomeOutput;
  }

  const wander = {
    x: Math.sin(now / 820) * 0.18 + Math.cos(now / 1370) * 0.1,
    y: Math.cos(now / 910) * 0.16
  };
  const desiredVelocity = {
    x: selectedAgentOutput.desiredVelocity.x + wander.x * 30,
    y: selectedAgentOutput.desiredVelocity.y + wander.y * 30
  };
  const decisionSpeedLimit =
    selectedAgentOutput.agentState.decision === "EVADE"
      ? MAX_ESCAPE_SPEED
      : selectedAgentOutput.agentState.decision === "TRACKING"
        ? MAX_TRACKING_SPEED
        : MAX_IDLE_SPEED;
  const cappedDesiredVelocity = limitMagnitude(desiredVelocity, decisionSpeedLimit);

  state.flyVelocity = {
    x: blend(state.flyVelocity.x, cappedDesiredVelocity.x, selectedAgentOutput.responseBlend),
    y: blend(state.flyVelocity.y, cappedDesiredVelocity.y, selectedAgentOutput.responseBlend)
  };
  const recoveryDrag =
    selectedAgentOutput.agentState.decision === "EVADE"
      ? Math.pow(0.985, dt * 60)
      : selectedAgentOutput.agentState.decision === "TRACKING"
        ? Math.pow(0.955, dt * 60)
        : Math.pow(0.9, dt * 60);
  const steeringWobble = selectedAgentOutput.agentState.decision === "EVADE" ? Math.sin(now / 90) * 0.035 : 0;

  state.flyVelocity = limitMagnitude(
    {
      x: state.flyVelocity.x * recoveryDrag - state.flyVelocity.y * steeringWobble,
      y: state.flyVelocity.y * recoveryDrag + state.flyVelocity.x * steeringWobble
    },
    decisionSpeedLimit
  );

  const nextFly = boundedFlyPosition({
    x: state.fly.x + state.flyVelocity.x * dt,
    y: state.fly.y + state.flyVelocity.y * dt
  });
  state.metrics.movementDistance += distance(state.fly, nextFly);
  state.fly = nextFly;

  const captured = Boolean(state.cursor && distance(state.fly, state.cursor) <= ARENA.captureRadius);

  if (captured) {
    state.metrics.caught += 1;
    state.metrics.longestSurvivalTimeMs = Math.max(state.metrics.longestSurvivalTimeMs, now - state.episodeStartedAt);
    state.episodeStartedAt = now;
    state.attemptActive = false;
    state.attemptStartedAt = null;
    state.threatCrossedAt = null;
    state.reactionRecorded = false;
    state.fly = {
      x: ARENA.width * (0.38 + Math.random() * 0.24),
      y: ARENA.height * (0.36 + Math.random() * 0.28)
    };
    state.flyVelocity = { x: 0, y: 0 };
  } else if (state.attemptActive && state.cursor && cursorDistance > ARENA.resetDistance) {
    state.metrics.escapes += 1;
    state.attemptActive = false;
    state.attemptStartedAt = null;
    state.threatCrossedAt = null;
    state.reactionRecorded = false;
  }

  state.agentState = selectedAgentOutput.agentState;
  if (captured) {
    state.agentState.decision = "CAPTURED";
  }
  state.previousCursor = state.cursor ? { ...state.cursor } : null;
  state.lastTimestamp = now;

  return { state, cursorDistance };
}

export function setCursor(state: SimulationState, cursor: Vec2 | null): SimulationState {
  return {
    ...state,
    cursor: cursor ? { ...cursor } : null
  };
}
