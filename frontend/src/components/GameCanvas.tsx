import { useEffect, useRef } from "react";
import { ARENA, setCursor, stepSimulation, type SimulationState } from "../game/simulation";
import { renderArena } from "../game/render";
import type { AgentMode, GameSnapshot } from "../types/game";

type GameCanvasProps = {
  agentMode: AgentMode;
  state: SimulationState;
  onStateChange: (next: SimulationState, snapshot: GameSnapshot) => void;
};

function pointerToArena(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / ARENA.width, rect.height / ARENA.height);
  const arenaWidth = ARENA.width * scale;
  const arenaHeight = ARENA.height * scale;
  const offsetX = (rect.width - arenaWidth) / 2;
  const offsetY = (rect.height - arenaHeight) / 2;

  return {
    x: Math.max(0, Math.min(ARENA.width, (clientX - rect.left - offsetX) / scale)),
    y: Math.max(0, Math.min(ARENA.height, (clientY - rect.top - offsetY) / scale))
  };
}

export function GameCanvas({ agentMode, state, onStateChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  const modeRef = useRef(agentMode);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    modeRef.current = agentMode;
  }, [agentMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let frameId = 0;
    const tick = (now: number) => {
      const result = stepSimulation(stateRef.current, now, modeRef.current);
      stateRef.current = result.state;
      const snapshot: GameSnapshot = {
        agentMode: modeRef.current,
        metrics: result.state.metrics,
        agentState: result.state.agentState,
        cursorDistance: result.cursorDistance,
        flyPosition: result.state.fly
      };
      renderArena(canvas, {
        fly: result.state.fly,
        cursor: result.state.cursor,
        agentState: result.state.agentState,
        agentMode: modeRef.current
      });
      onStateChange(result.state, snapshot);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [onStateChange]);

  return (
    <div className="arena-shell">
      <div className="arena-label">
        <span>Game Area</span>
        <span>Move the insect racket toward the fly and try to catch it.</span>
      </div>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerMove={(event) => {
          const canvas = canvasRef.current;
          if (!canvas) {
            return;
          }
          stateRef.current = setCursor(stateRef.current, pointerToArena(canvas, event.clientX, event.clientY));
        }}
        onPointerLeave={() => {
          stateRef.current = setCursor(stateRef.current, null);
        }}
      />
    </div>
  );
}
