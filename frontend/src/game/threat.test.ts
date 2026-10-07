import { describe, expect, it } from "vitest";
import { calculateThreat } from "./threat";

const fly = { x: 500, y: 300 };

describe("calculateThreat", () => {
  it("reports no threat when the cursor is absent", () => {
    const result = calculateThreat({
      fly,
      cursor: null,
      previousCursor: null,
      dt: 0.016
    });

    expect(result.threat).toBe(0);
    expect(result.timeToContact).toBeNull();
    expect(result.cursorDistance).toBe(Number.POSITIVE_INFINITY);
  });

  it("scores an approaching cursor higher than a retreating cursor at the same distance", () => {
    const approaching = calculateThreat({
      fly,
      cursor: { x: 430, y: 300 },
      previousCursor: { x: 400, y: 300 },
      dt: 0.05
    });
    const retreating = calculateThreat({
      fly,
      cursor: { x: 430, y: 300 },
      previousCursor: { x: 460, y: 300 },
      dt: 0.05
    });

    expect(approaching.approachVelocity).toBeGreaterThan(0);
    expect(retreating.approachVelocity).toBeLessThan(0);
    expect(approaching.threat).toBeGreaterThan(retreating.threat);
    expect(approaching.timeToContact).not.toBeNull();
    expect(retreating.timeToContact).toBeNull();
  });

  it("points escape direction away from the cursor", () => {
    const result = calculateThreat({
      fly,
      cursor: { x: 430, y: 300 },
      previousCursor: { x: 420, y: 300 },
      dt: 0.05
    });

    expect(result.escapeDirection.x).toBeGreaterThan(0);
    expect(result.escapeDirection.y).toBeCloseTo(0);
  });
});
