import type { GameSnapshot } from "../types/game";

function formatMs(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }
  return `${Math.round(value)} ms`;
}

function formatSeconds(value: number): string {
  return `${(value / 1000).toFixed(1)} s`;
}

function escapeRate(snapshot: GameSnapshot): string {
  const total = snapshot.metrics.escapes + snapshot.metrics.caught;
  if (total === 0) {
    return "--";
  }
  return `${Math.round((snapshot.metrics.escapes / total) * 100)}%`;
}

type MetricPanelProps = {
  snapshot: GameSnapshot;
};

export function MetricPanel({ snapshot }: MetricPanelProps) {
  const metrics = snapshot.metrics;
  const closest = Number.isFinite(metrics.closestCursorDistance)
    ? `${Math.round(metrics.closestCursorDistance)} px`
    : "--";

  return (
    <aside className="panel metric-panel" aria-label="Live evaluation">
      <section className="panel-section">
        <div className="section-heading">Live Evaluation</div>
        <dl className="metric-grid">
          <div>
            <dt>Attempts</dt>
            <dd>{metrics.attempts}</dd>
          </div>
          <div>
            <dt>Escapes</dt>
            <dd>{metrics.escapes}</dd>
          </div>
          <div>
            <dt>Caught</dt>
            <dd>{metrics.caught}</dd>
          </div>
          <div>
            <dt>Escape Rate</dt>
            <dd>{escapeRate(snapshot)}</dd>
          </div>
          <div>
            <dt>Avg Reaction Time</dt>
            <dd>{metrics.avgReactionTimeMs > 0 ? formatMs(metrics.avgReactionTimeMs) : "--"}</dd>
          </div>
          <div>
            <dt>Survival Time</dt>
            <dd>{formatSeconds(metrics.currentSurvivalTimeMs)}</dd>
          </div>
          <div>
            <dt>Longest Survival</dt>
            <dd>{formatSeconds(metrics.longestSurvivalTimeMs)}</dd>
          </div>
          <div>
            <dt>False Escapes</dt>
            <dd>{metrics.falseEscapes}</dd>
          </div>
          <div>
            <dt>Closest Cursor</dt>
            <dd>{closest}</dd>
          </div>
          <div>
            <dt>Movement Cost</dt>
            <dd>{Math.round(metrics.movementDistance)}</dd>
          </div>
        </dl>
      </section>

      <section className="panel-section">
        <div className="section-heading">Agent State</div>
        <div className="state-row">
          <span>Threat</span>
          <strong>{Math.round(snapshot.agentState.threat)}%</strong>
        </div>
        <div className="bar-track">
          <div className="bar-fill threat" style={{ width: `${snapshot.agentState.threat}%` }} />
        </div>
        <div className="state-row">
          <span>Sensory activity</span>
          <strong>{Math.round(snapshot.agentState.sensoryActivity)}%</strong>
        </div>
        <div className="bar-track">
          <div className="bar-fill sensory" style={{ width: `${snapshot.agentState.sensoryActivity}%` }} />
        </div>
        <dl className="agent-details">
          <div>
            <dt>Decision</dt>
            <dd>{snapshot.agentState.decision}</dd>
          </div>
          <div>
            <dt>Escape direction</dt>
            <dd>
              {snapshot.agentState.escapeDirection.x.toFixed(2)}, {snapshot.agentState.escapeDirection.y.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt>Reaction time</dt>
            <dd>{formatMs(snapshot.agentState.reactionTimeMs)}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
