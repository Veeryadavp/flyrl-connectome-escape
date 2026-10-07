import type { GameSnapshot } from "../types/game";
import { getConnectomeGraphInfo } from "../game/connectomeAgent";

type NeuralActivityProps = {
  snapshot: GameSnapshot;
};

const nodeLabels = ["VISUAL", "LC4", "LPLC2", "DNp01", "ESCAPE"];

export function NeuralActivity({ snapshot }: NeuralActivityProps) {
  const activation = snapshot.agentState.sensoryActivity;
  const connectomeReady = snapshot.agentMode === "CONNECTOME";
  const isDemoGraph = getConnectomeGraphInfo().sourceKind === "synthetic-public-demo";

  return (
    <section className="panel neural-panel" aria-label="Neural activity">
      <div className="section-heading">Neural Activity</div>
      <div className="connectome-status">
        <span className={connectomeReady ? "status-dot ready" : "status-dot"} />
        CONNECTOME DATA: {connectomeReady ? "ACTIVE" : "STAGED"}
      </div>
      <div className="network" aria-hidden="true">
        {nodeLabels.map((label, index) => {
          const localActivation = Math.max(8, activation - index * 11);
          return (
            <div className="network-row" key={label}>
              <div
                className="network-node"
                style={{
                  opacity: 0.34 + localActivation / 150,
                  boxShadow: `0 0 ${6 + localActivation / 5}px rgba(68, 214, 168, ${0.12 + localActivation / 220})`
                }}
              />
              <span>{label}</span>
              {index < nodeLabels.length - 1 && <div className="network-edge" />}
            </div>
          );
        })}
      </div>
      <p className="microcopy">
        {connectomeReady
          ? isDemoGraph
            ? "Threat input is propagating through the public placeholder LC4/LPLC2/DNp01-style graph."
            : "Threat input is propagating through the exported FlyWire-derived LC4/LPLC2/DNp01 subgraph."
          : "Structural subgraph loaded in Phase 1. Switch to Connectome to route decisions through it."}
      </p>
    </section>
  );
}
