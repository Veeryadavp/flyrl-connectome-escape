import type { Vec2 } from "../types/game";
import { clamp, distance, normalize } from "./math";
import { ARENA } from "./simulationConfig";

export type ThreatInput = {
  fly: Vec2;
  cursor: Vec2 | null;
  previousCursor: Vec2 | null;
  dt: number;
};

export type ThreatState = {
  cursorDistance: number;
  cursorVelocity: Vec2;
  approachVelocity: number;
  approachDirection: Vec2;
  timeToContact: number | null;
  flyDistanceFromBoundary: number;
  proximityScore: number;
  approachScore: number;
  threat: number;
  escapeDirection: Vec2;
};

export function calculateThreat(input: ThreatInput): ThreatState {
  const flyDistanceFromBoundary = Math.min(
    input.fly.x - ARENA.padding,
    ARENA.width - ARENA.padding - input.fly.x,
    input.fly.y - ARENA.padding,
    ARENA.height - ARENA.padding - input.fly.y
  );

  if (!input.cursor) {
    return {
      cursorDistance: Number.POSITIVE_INFINITY,
      cursorVelocity: { x: 0, y: 0 },
      approachVelocity: 0,
      approachDirection: { x: 0, y: 0 },
      timeToContact: null,
      flyDistanceFromBoundary,
      proximityScore: 0,
      approachScore: 0,
      threat: 0,
      escapeDirection: { x: 0, y: 0 }
    };
  }

  const cursorDistance = distance(input.fly, input.cursor);
  const proximityScore = 1 - clamp((cursorDistance - ARENA.captureRadius) / (ARENA.attemptRadius - ARENA.captureRadius), 0, 1);
  const approachDirection = normalize({ x: input.fly.x - input.cursor.x, y: input.fly.y - input.cursor.y });
  const escapeDirection = normalize({ x: input.fly.x - input.cursor.x, y: input.fly.y - input.cursor.y });

  let cursorVelocity = { x: 0, y: 0 };
  let approachVelocity = 0;
  if (input.previousCursor && input.dt > 0) {
    cursorVelocity = {
      x: (input.cursor.x - input.previousCursor.x) / input.dt,
      y: (input.cursor.y - input.previousCursor.y) / input.dt
    };
    approachVelocity = cursorVelocity.x * approachDirection.x + cursorVelocity.y * approachDirection.y;
  }

  const approachScore = clamp(approachVelocity / 720, 0, 1);
  const timeToContact = approachVelocity > 1 ? Math.max(0, (cursorDistance - ARENA.captureRadius) / approachVelocity) : null;
  const threat = clamp((proximityScore * 0.62 + approachScore * 0.38) * 100, 0, 100);

  return {
    cursorDistance,
    cursorVelocity,
    approachVelocity,
    approachDirection,
    timeToContact,
    flyDistanceFromBoundary,
    proximityScore,
    approachScore,
    threat,
    escapeDirection
  };
}
