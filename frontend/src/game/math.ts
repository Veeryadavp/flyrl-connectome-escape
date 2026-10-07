import type { Vec2 } from "../types/game";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalize(vector: Vec2): Vec2 {
  const length = Math.hypot(vector.x, vector.y);
  if (length < 0.0001) {
    return { x: 0, y: 0 };
  }
  return { x: vector.x / length, y: vector.y / length };
}

export function limitMagnitude(vector: Vec2, maxMagnitude: number): Vec2 {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= maxMagnitude || length < 0.0001) {
    return vector;
  }
  const scale = maxMagnitude / length;
  return {
    x: vector.x * scale,
    y: vector.y * scale
  };
}

export function blend(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}
