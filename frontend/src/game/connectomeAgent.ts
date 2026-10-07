import escapeSubgraph from "../data/escapeSubgraph.demo.json";
import type { AgentDecision, AgentState, Vec2 } from "../types/game";
import { blend, clamp, normalize } from "./math";
import type { ThreatState } from "./threat";

type ConnectomeNode = {
  id: string;
  cellType: string;
  hemibrainType: string;
  side: string;
  neurotransmitter: string;
};

type ConnectomeEdge = {
  source: number;
  target: number;
  synCount: number;
  weight: number;
};

type ConnectomeGraph = {
  metadata: {
    nodeCount: number;
    edgeCount: number;
    sourceKind?: string;
    realDataStatement: string;
    simulationAssumptionStatement: string;
  };
  nodes: ConnectomeNode[];
  edges: ConnectomeEdge[];
};

export type ConnectomeAgentMemory = {
  activations: number[];
  motorDirection: Vec2;
  burst: number;
  jink: number;
};

export type ConnectomeAgentOutput = {
  agentState: AgentState;
  desiredVelocity: Vec2;
  responseBlend: number;
  memory: ConnectomeAgentMemory;
};

const graph = escapeSubgraph as ConnectomeGraph;
const nodes = graph.nodes;
const edges = graph.edges;
const activityGain = graph.metadata.sourceKind === "synthetic-public-demo" ? 2.5 : 1;

const lc4Indexes = nodes.flatMap((node, index) => (node.cellType === "LC4" ? [index] : []));
const lplc2Indexes = nodes.flatMap((node, index) => (node.cellType === "LPLC2" ? [index] : []));
const dnp01Indexes = nodes.flatMap((node, index) => (node.cellType === "DNp01" ? [index] : []));
const leftIndexes = nodes.flatMap((node, index) => (node.side === "left" ? [index] : []));
const rightIndexes = nodes.flatMap((node, index) => (node.side === "right" ? [index] : []));
const incomingTotals = new Array(nodes.length).fill(0);

for (const edge of edges) {
  incomingTotals[edge.target] += edge.weight;
}

export function createConnectomeMemory(): ConnectomeAgentMemory {
  return {
    activations: new Array(nodes.length).fill(0),
    motorDirection: { x: 0, y: 0 },
    burst: 0,
    jink: 0
  };
}

function average(indexes: number[], values: number[]): number {
  if (indexes.length === 0) {
    return 0;
  }
  return indexes.reduce((sum, index) => sum + values[index], 0) / indexes.length;
}

function applyInput(values: number[], indexes: number[], amount: number): void {
  for (const index of indexes) {
    values[index] += amount;
  }
}

function activityToPercent(activity: number): number {
  return clamp((1 - Math.exp(-activity * 1.35)) * 100, 0, 100);
}

export function decideConnectomeAgent(
  threatState: ThreatState,
  previousReactionTime: number | null,
  previousMemory: ConnectomeAgentMemory
): ConnectomeAgentOutput {
  const input = new Array(nodes.length).fill(0);
  const ttcScore = threatState.timeToContact === null ? 0 : clamp(1 - threatState.timeToContact / 0.7, 0, 1);
  const inputDrive = Math.max(threatState.proximityScore, threatState.approachScore, ttcScore);

  applyInput(input, lc4Indexes, threatState.proximityScore * 0.38 + threatState.approachScore * 0.18);
  applyInput(input, lplc2Indexes, threatState.approachScore * 0.34 + ttcScore * 0.2 + threatState.proximityScore * 0.08);

  const baseDecay = 0.36 + inputDrive * 0.12;
  const propagationGain = 0.18 + inputDrive * 0.28;
  const outputDecay = 0.68 + inputDrive * 0.24;
  const base = previousMemory.activations.map((activation, index) => clamp(activation * baseDecay + input[index] * 0.34, 0, 1));
  const propagated = new Array(nodes.length).fill(0);

  for (const edge of edges) {
    propagated[edge.target] += base[edge.source] * edge.weight;
  }

  const activations = base.map((activation, index) => {
    const incoming = incomingTotals[index] > 0 ? propagated[index] / incomingTotals[index] : 0;
    return clamp((activation + incoming * propagationGain) * outputDecay, 0, 1);
  });

  const visualActivity = Math.max(average(lc4Indexes, activations), average(lplc2Indexes, activations));
  const actionActivity = average(dnp01Indexes, activations);
  const leftActivity = average(leftIndexes, activations);
  const rightActivity = average(rightIndexes, activations);
  const currentInputGate = 0.35 + inputDrive * 0.65;
  const sensoryActivity = activityToPercent(visualActivity * currentInputGate * activityGain);
  const motorActivity = activityToPercent(actionActivity * currentInputGate * activityGain);
  const connectomeThreat = clamp(threatState.threat * 0.62 + motorActivity * 0.38, 0, 100);
  const imminentThreat =
    threatState.cursorDistance < 112 ||
    threatState.proximityScore > 0.48 ||
    (threatState.timeToContact !== null && threatState.timeToContact < 0.28);

  let decision: AgentDecision = "IDLE";
  if (
    (imminentThreat && sensoryActivity > 5) ||
    (threatState.threat > 45 && sensoryActivity > 18) ||
    (threatState.threat > 58 && motorActivity > 42) ||
    connectomeThreat > 76
  ) {
    decision = "EVADE";
  } else if (sensoryActivity > 22 || connectomeThreat > 28) {
    decision = "TRACKING";
  }

  const escapeDirection = decision === "IDLE" ? { x: 0, y: 0 } : threatState.escapeDirection;
  const neuralSideBias = clamp((rightActivity - leftActivity) * 2.6, -0.75, 0.75);
  const approachTurnBias = clamp(threatState.approachDirection.x * 0.42 + threatState.approachDirection.y * 0.2, -0.55, 0.55);
  const freshJink = Math.abs(neuralSideBias + approachTurnBias) > 0.08 ? Math.sign(neuralSideBias + approachTurnBias) : 1;
  const nextJink = decision === "EVADE" ? (previousMemory.jink === 0 ? freshJink : previousMemory.jink) : previousMemory.jink * 0.74;
  const lateralBias = clamp(nextJink * 0.72 + neuralSideBias * 0.28 + approachTurnBias * 0.22, -1.05, 1.05);
  const speed =
    decision === "EVADE" ? 178 + sensoryActivity * 0.32 + motorActivity * 0.38 : decision === "TRACKING" ? 54 + sensoryActivity * 0.5 : 14;
  const perpendicular = { x: -escapeDirection.y, y: escapeDirection.x };
  const targetMotorDirection =
    decision === "IDLE"
      ? { x: 0, y: 0 }
      : normalize({
          x: escapeDirection.x * 0.72 + perpendicular.x * lateralBias,
          y: escapeDirection.y * 0.72 + perpendicular.y * lateralBias
        });
  const nextBurst =
    decision === "EVADE" ? Math.max(previousMemory.burst * 0.82, 1) : decision === "TRACKING" ? previousMemory.burst * 0.68 : previousMemory.burst * 0.48;
  const motorBlend = decision === "EVADE" ? 0.46 : decision === "TRACKING" ? 0.22 : 0.1;
  const motorDirection = normalize({
    x: blend(previousMemory.motorDirection.x, targetMotorDirection.x, motorBlend),
    y: blend(previousMemory.motorDirection.y, targetMotorDirection.y, motorBlend)
  });
  const burstSpeed = speed * (1 + nextBurst * 0.24);

  return {
    agentState: {
      threat: connectomeThreat,
      sensoryActivity,
      decision,
      escapeDirection,
      reactionTimeMs: previousReactionTime
    },
    desiredVelocity: {
      x: motorDirection.x * burstSpeed,
      y: motorDirection.y * burstSpeed
    },
    responseBlend: decision === "EVADE" ? 0.13 + motorActivity * 0.00045 : 0.035 + sensoryActivity * 0.00032,
    memory: { activations, motorDirection, burst: nextBurst, jink: nextJink }
  };
}

export function getConnectomeGraphInfo() {
  return graph.metadata;
}
