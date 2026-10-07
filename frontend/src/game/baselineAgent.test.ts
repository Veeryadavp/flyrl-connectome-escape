import { describe, expect, it } from "vitest";
import { decideBaselineAgent } from "./baselineAgent";
import type { ThreatState } from "./threat";

function threatState(overrides: Partial<ThreatState>): ThreatState {
  return {
    cursorDistance: 120,
    cursorVelocity: { x: 0, y: 0 },
    approachVelocity: 0,
    approachDirection: { x: 1, y: 0 },
    timeToContact: null,
    flyDistanceFromBoundary: 200,
    proximityScore: 0,
    approachScore: 0,
    threat: 0,
    escapeDirection: { x: 1, y: 0 },
    ...overrides
  };
}

describe("decideBaselineAgent", () => {
  it("idles under low threat", () => {
    const result = decideBaselineAgent(threatState({ threat: 8 }), null);

    expect(result.agentState.decision).toBe("IDLE");
    expect(result.desiredVelocity.x).toBe(0);
    expect(result.desiredVelocity.y).toBe(0);
  });

  it("tracks moderate threat before committing to evasion", () => {
    const result = decideBaselineAgent(threatState({ threat: 34 }), null);

    expect(result.agentState.decision).toBe("TRACKING");
    expect(result.desiredVelocity.x).toBeGreaterThan(0);
    expect(result.responseBlend).toBe(0.06);
  });

  it("evades high threat with a faster response blend", () => {
    const result = decideBaselineAgent(threatState({ threat: 82, approachVelocity: 720 }), 64);

    expect(result.agentState.decision).toBe("EVADE");
    expect(result.agentState.reactionTimeMs).toBe(64);
    expect(result.desiredVelocity.x).toBe(340);
    expect(result.responseBlend).toBe(0.18);
  });
});
