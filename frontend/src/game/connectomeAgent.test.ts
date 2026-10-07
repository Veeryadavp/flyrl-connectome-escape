import { describe, expect, it } from "vitest";
import { createConnectomeMemory, decideConnectomeAgent, getConnectomeGraphInfo } from "./connectomeAgent";
import type { ThreatState } from "./threat";

function threatState(overrides: Partial<ThreatState>): ThreatState {
  return {
    cursorDistance: 90,
    cursorVelocity: { x: 600, y: 0 },
    approachVelocity: 600,
    approachDirection: { x: 1, y: 0 },
    timeToContact: 0.12,
    flyDistanceFromBoundary: 200,
    proximityScore: 0.52,
    approachScore: 0.83,
    threat: 64,
    escapeDirection: { x: 1, y: 0 },
    ...overrides
  };
}

describe("connectome agent", () => {
  it("loads the public demo graph metadata", () => {
    const info = getConnectomeGraphInfo();

    expect(info.nodeCount).toBeGreaterThan(0);
    expect(info.edgeCount).toBeGreaterThan(0);
    expect(info.sourceKind).toBe("synthetic-public-demo");
    expect(info.realDataStatement).toContain("FlyWire/Codex");
  });

  it("propagates sensory threat into nonzero neural activity", () => {
    const result = decideConnectomeAgent(threatState({}), null, createConnectomeMemory());

    expect(result.agentState.sensoryActivity).toBeGreaterThan(0);
    expect(result.memory.activations.some((activation) => activation > 0)).toBe(true);
  });

  it("can evade through connectome-derived action activity", () => {
    const urgentThreat = threatState({
      cursorDistance: 52,
      approachVelocity: 760,
      timeToContact: 0.07,
      proximityScore: 0.86,
      approachScore: 1,
      threat: 88
    });
    const first = decideConnectomeAgent(urgentThreat, null, createConnectomeMemory());
    const second = decideConnectomeAgent(urgentThreat, 80, first.memory);

    expect(second.agentState.decision).toBe("EVADE");
    expect(second.agentState.reactionTimeMs).toBe(80);
    expect(second.desiredVelocity.x).toBeGreaterThan(0);
  });

  it("keeps moderate sensory threat below saturation", () => {
    const result = decideConnectomeAgent(
      threatState({
        cursorDistance: 145,
        cursorVelocity: { x: 180, y: 0 },
        approachVelocity: 180,
        timeToContact: 0.55,
        proximityScore: 0.22,
        approachScore: 0.25,
        threat: 32
      }),
      null,
      createConnectomeMemory()
    );

    expect(result.agentState.sensoryActivity).toBeGreaterThan(0);
    expect(result.agentState.sensoryActivity).toBeLessThan(60);
    expect(result.agentState.decision).not.toBe("EVADE");
  });

  it("evades a close stationary threat without requiring saturated activity", () => {
    const closeThreat = threatState({
      cursorDistance: 84,
      cursorVelocity: { x: 0, y: 0 },
      approachVelocity: 0,
      timeToContact: null,
      proximityScore: 0.57,
      approachScore: 0,
      threat: 36
    });
    const result = decideConnectomeAgent(closeThreat, null, createConnectomeMemory());

    expect(result.agentState.decision).toBe("EVADE");
    expect(result.agentState.sensoryActivity).toBeGreaterThan(12);
    expect(result.agentState.sensoryActivity).toBeLessThan(100);
    expect(result.desiredVelocity.x).toBeGreaterThan(0);
  });

  it("uses a curved memory-bearing motor direction instead of a direct baseline vector", () => {
    const closeThreat = threatState({
      cursorDistance: 78,
      cursorVelocity: { x: 0, y: 0 },
      approachVelocity: 0,
      timeToContact: null,
      proximityScore: 0.62,
      approachScore: 0,
      threat: 42,
      approachDirection: { x: 1, y: 0 },
      escapeDirection: { x: 1, y: 0 }
    });
    const first = decideConnectomeAgent(closeThreat, null, createConnectomeMemory());
    const second = decideConnectomeAgent(closeThreat, null, first.memory);

    expect(Math.abs(second.desiredVelocity.y)).toBeGreaterThan(Math.abs(second.desiredVelocity.x) * 0.55);
    expect(second.memory.burst).toBeGreaterThan(first.memory.burst * 0.8);
    expect(Math.abs(second.memory.jink)).toBeGreaterThan(0.5);
  });

  it("decays neural activity after threat input disappears", () => {
    const first = decideConnectomeAgent(threatState({}), null, createConnectomeMemory());
    const second = decideConnectomeAgent(threatState({}), null, first.memory);
    const quietThreat = threatState({
      cursorDistance: Number.POSITIVE_INFINITY,
      cursorVelocity: { x: 0, y: 0 },
      approachVelocity: 0,
      timeToContact: null,
      proximityScore: 0,
      approachScore: 0,
      threat: 0,
      escapeDirection: { x: 0, y: 0 }
    });
    const decayed = decideConnectomeAgent(quietThreat, null, second.memory);

    expect(decayed.agentState.sensoryActivity).toBeLessThan(second.agentState.sensoryActivity);
    expect(decayed.agentState.decision).not.toBe("EVADE");
  });
});
