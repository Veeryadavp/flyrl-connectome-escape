export type AgentMode = "BASELINE" | "CONNECTOME";

export type Vec2 = {
  x: number;
  y: number;
};

export type AgentDecision = "IDLE" | "TRACKING" | "EVADE" | "CAPTURED";

export type AgentState = {
  threat: number;
  sensoryActivity: number;
  decision: AgentDecision;
  escapeDirection: Vec2;
  reactionTimeMs: number | null;
};

export type EvaluationMetrics = {
  attempts: number;
  escapes: number;
  caught: number;
  falseEscapes: number;
  avgReactionTimeMs: number;
  currentSurvivalTimeMs: number;
  longestSurvivalTimeMs: number;
  closestCursorDistance: number;
  movementDistance: number;
};

export type GameSnapshot = {
  agentMode: AgentMode;
  metrics: EvaluationMetrics;
  agentState: AgentState;
  cursorDistance: number;
  flyPosition: Vec2;
};
