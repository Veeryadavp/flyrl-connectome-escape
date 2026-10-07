import { getConnectomeGraphInfo } from "../game/connectomeAgent";

export function DataProvenance() {
  const info = getConnectomeGraphInfo();
  const isDemoGraph = info.sourceKind === "synthetic-public-demo";

  return (
    <section className="panel provenance-panel" aria-label="Connectome data provenance">
      <div className="section-heading">{isDemoGraph ? "Public Demo Data" : "FlyWire Data"}</div>
      <div className="provenance-title">{isDemoGraph ? "Synthetic placeholder graph" : "FAFB v783 / Codex-derived subset"}</div>
      <dl className="provenance-grid">
        <div>
          <dt>Source</dt>
          <dd>{isDemoGraph ? "Public demo" : "FlyWire / Codex"}</dd>
        </div>
        <div>
          <dt>Nodes</dt>
          <dd>{info.nodeCount}</dd>
        </div>
        <div>
          <dt>Edges</dt>
          <dd>{info.edgeCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Cell types</dt>
          <dd>LC4, LPLC2, DNp01/GF</dd>
        </div>
      </dl>
      <div className="provenance-note">
        <strong>{isDemoGraph ? "Public-safe data" : "Real data"}</strong>
        <span>{info.realDataStatement}</span>
      </div>
      <div className="provenance-note">
        <strong>Simulation</strong>
        <span>
          syn_count-derived weights drive a simplified activity model; this is not a full-brain simulation or a trained
          policy.
        </span>
      </div>
    </section>
  );
}
