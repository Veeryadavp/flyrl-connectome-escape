import type { AgentDecision, AgentState, Vec2 } from "../types/game";
import { clamp } from "./math";
import type { ThreatState } from "./threat";

export type BaselineAgentOutput = {
  agentState: AgentState;
  desiredVelocity: Vec2;
  responseBlend: number;
};

const HIGH_THREAT_THRESHOLD = 58;
const LOW_THREAT_THRESHOLD = 18;
const DIRECTION_THRESHOLD = 25;

export function decideBaselineAgent(threatState: ThreatState, previousReactionTime: number | null): BaselineAgentOutput {
  let decision: AgentDecision = "IDLE";
  const targetSpeed = threatState.threat > HIGH_THREAT_THRESHOLD ? 340 : threatState.threat > 28 ? 130 : 22;
  const escapeDirection = threatState.threat > DIRECTION_THRESHOLD ? threatState.escapeDirection : { x: 0, y: 0 };

  if (threatState.threat > HIGH_THREAT_THRESHOLD) {
    decision = "EVADE";
  } else if (threatState.threat > LOW_THREAT_THRESHOLD) {
    decision = "TRACKING";
  }

  const sensoryActivity = clamp(threatState.threat * 0.82 + Math.max(0, threatState.approachVelocity) * 0.02, 0, 100);

  return {
    agentState: {
      threat: threatState.threat,
      sensoryActivity,
      decision,
      escapeDirection,
      reactionTimeMs: previousReactionTime
    },
    desiredVelocity: {
      x: escapeDirection.x * targetSpeed,
      y: escapeDirection.y * targetSpeed
    },
    responseBlend: threatState.threat > HIGH_THREAT_THRESHOLD ? 0.18 : 0.06
  };
}
