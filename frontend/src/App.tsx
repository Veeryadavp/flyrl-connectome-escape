import { useCallback, useMemo, useState } from "react";
import { DataProvenance } from "./components/DataProvenance";
import { GameCanvas } from "./components/GameCanvas";
import { MetricPanel } from "./components/MetricPanel";
import { createInitialState, type SimulationState } from "./game/simulation";
import { NeuralActivity } from "./visualisation/NeuralActivity";
import type { AgentMode, GameSnapshot } from "./types/game";
import { getConnectomeGraphInfo } from "./game/connectomeAgent";

function createSnapshot(state: SimulationState, agentMode: AgentMode): GameSnapshot {
  return {
    agentMode,
    metrics: state.metrics,
    agentState: state.agentState,
    cursorDistance: Number.POSITIVE_INFINITY,
    flyPosition: state.fly
  };
}

export function App() {
  const [agentMode, setAgentMode] = useState<AgentMode>("CONNECTOME");
  const [simState, setSimState] = useState(() => createInitialState());
  const [snapshot, setSnapshot] = useState(() => createSnapshot(simState, "CONNECTOME"));
  const graphInfo = getConnectomeGraphInfo();
  const isDemoGraph = graphInfo.sourceKind === "synthetic-public-demo";

  const handleStateChange = useCallback((next: SimulationState, nextSnapshot: GameSnapshot) => {
    setSimState(next);
    setSnapshot(nextSnapshot);
  }, []);

  const statusLabel = useMemo(() => {
    if (agentMode === "CONNECTOME") {
      return "DATA READY";
    }
    return "ONLINE";
  }, [agentMode]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">FLYRL</div>
          <h1>Drosophila Connectome Escape Environment</h1>
          <p className="topbar-subtitle">
            {isDemoGraph
              ? "Public demo build with a synthetic placeholder graph; real FlyWire/Codex data can be regenerated locally."
              : "Uses a real FlyWire/Codex FAFB v783 candidate subgraph, with simplified computational dynamics."}
          </p>
        </div>
        <div className="agent-status" aria-label={`Agent ${statusLabel.toLowerCase()}`}>
          <span className="status-dot ready" />
          AGENT · {statusLabel}
        </div>
      </header>

      <section className="control-strip" aria-label="Experiment controls">
        <div className="mode-control" role="group" aria-label="Agent mode">
          <button
            className={agentMode === "BASELINE" ? "active" : ""}
            type="button"
            onClick={() => setAgentMode("BASELINE")}
          >
            Baseline
          </button>
          <button
            className={agentMode === "CONNECTOME" ? "active" : ""}
            type="button"
            onClick={() => setAgentMode("CONNECTOME")}
            title={
              isDemoGraph
                ? "Routes threat input through a synthetic public demo graph. Regenerate local data for real FlyWire/Codex runs."
                : "Routes threat input through the real FlyWire/Codex candidate subgraph with simplified neural dynamics."
            }
          >
            Connectome
          </button>
        </div>
        <button
          className="reset-button"
          type="button"
          onClick={() => {
            const next = createInitialState();
            setSimState(next);
            setSnapshot(createSnapshot(next, agentMode));
          }}
        >
          Reset run
        </button>
      </section>

      <div className="workspace">
        <GameCanvas agentMode={agentMode} state={simState} onStateChange={handleStateChange} />
        <div className="side-stack">
          <MetricPanel snapshot={{ ...snapshot, agentMode }} />
          <NeuralActivity snapshot={{ ...snapshot, agentMode }} />
          <DataProvenance />
        </div>
      </div>

      <footer className="footer-note">
        {isDemoGraph
          ? "Public connectome mode uses a synthetic placeholder graph so the repository can be shared without redistributing derived FlyWire data."
          : "Connectome mode routes threat input through the FlyWire/Codex candidate subgraph. Baseline is kept as a hand-built comparison controller."}
      </footer>
    </main>
  );
}
