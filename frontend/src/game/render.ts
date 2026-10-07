import { ARENA } from "./simulation";
import type { AgentMode, AgentState, Vec2 } from "../types/game";

export type RenderFrame = {
  fly: Vec2;
  cursor: Vec2 | null;
  agentState: AgentState;
  agentMode: AgentMode;
};

function drawRacket(ctx: CanvasRenderingContext2D, position: Vec2, threat: number): void {
  const pulse = 1 + threat / 420;
  const size = 0.18;

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(-0.55);
  ctx.scale(size, size);

  ctx.strokeStyle = "rgba(239, 98, 98, 0.42)";
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(28, 46);
  ctx.lineTo(104, 154);
  ctx.stroke();

  ctx.strokeStyle = "rgba(238, 246, 249, 0.98)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(0, 0, 44 * pulse, 56 * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(125, 184, 255, 0.38)";
  ctx.lineWidth = 1.8;
  for (let x = -30; x <= 30; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, -48);
    ctx.lineTo(x, 48);
    ctx.stroke();
  }
  for (let y = -38; y <= 38; y += 10) {
    ctx.beginPath();
    ctx.moveTo(-34, y);
    ctx.lineTo(34, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(239, 98, 98, 0.20)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 38 * pulse, 49 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(244, 211, 107, 0.88)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function renderArena(canvas: HTMLCanvasElement, frame: RenderFrame): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(260, Math.floor(rect.height));

  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#07090b";
  ctx.fillRect(0, 0, width, height);

  const scaleX = width / ARENA.width;
  const scaleY = height / ARENA.height;
  const scale = Math.min(scaleX, scaleY);
  const arenaWidth = ARENA.width * scale;
  const arenaHeight = ARENA.height * scale;
  const offsetX = (width - arenaWidth) / 2;
  const offsetY = (height - arenaHeight) / 2;

  const toCanvas = (point: Vec2): Vec2 => ({
    x: offsetX + point.x * scale,
    y: offsetY + point.y * scale
  });

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#0d1114";
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);

  ctx.strokeStyle = "#202a30";
  ctx.lineWidth = 1;
  for (let x = 80; x < ARENA.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ARENA.height);
    ctx.stroke();
  }
  for (let y = 80; y < ARENA.height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ARENA.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#31404a";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, ARENA.width - 2, ARENA.height - 2);

  if (frame.cursor) {
    const threatAlpha = Math.min(0.38, frame.agentState.threat / 240);
    ctx.beginPath();
    ctx.arc(frame.cursor.x, frame.cursor.y, ARENA.attemptRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(239, 98, 98, ${threatAlpha * 0.32})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(frame.cursor.x, frame.cursor.y, ARENA.captureRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(239, 98, 98, 0.65)";
    ctx.lineWidth = 2;
    ctx.stroke();

    drawRacket(ctx, frame.cursor, frame.agentState.threat);
  }

  const flyAngle = Math.atan2(frame.agentState.escapeDirection.y, frame.agentState.escapeDirection.x);
  const wingPulse = 1 + Math.sin(performance.now() / 48) * 0.12;
  const flyGlow = frame.agentMode === "CONNECTOME" ? "#44d6a8" : "#7db8ff";

  ctx.save();
  ctx.translate(frame.fly.x, frame.fly.y);
  ctx.rotate(Number.isFinite(flyAngle) ? flyAngle : 0);

  ctx.globalAlpha = 0.2 + frame.agentState.threat / 180;
  ctx.fillStyle = flyGlow;
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#c8d2d8";
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(146, 168, 179, 0.62)";
  ctx.beginPath();
  ctx.ellipse(-3, -7, 11 * wingPulse, 4, -0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-3, 7, 11 * wingPulse, 4, 0.42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f4d36b";
  ctx.beginPath();
  ctx.arc(10, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (frame.cursor) {
    ctx.strokeStyle = `rgba(244, 211, 107, ${0.18 + frame.agentState.threat / 180})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(frame.fly.x, frame.fly.y);
    ctx.lineTo(frame.cursor.x, frame.cursor.y);
    ctx.stroke();
  }

  ctx.restore();

  const flyCanvas = toCanvas(frame.fly);
  ctx.fillStyle = "rgba(207, 221, 229, 0.64)";
  ctx.font = "11px Inter, system-ui, sans-serif";
  ctx.fillText("virtual fly", flyCanvas.x + 18, flyCanvas.y - 14);

  if (frame.cursor) {
    const cursorCanvas = toCanvas(frame.cursor);
    ctx.fillStyle = "rgba(239, 98, 98, 0.9)";
    ctx.fillText("insect racket", cursorCanvas.x + 12, cursorCanvas.y + 16);
  }
}
