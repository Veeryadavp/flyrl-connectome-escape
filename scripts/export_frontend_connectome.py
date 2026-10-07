from __future__ import annotations

import json
import math
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
OUTPUT = ROOT / "frontend" / "src" / "data" / "escapeSubgraph.json"


def main() -> int:
    nodes = pd.read_csv(PROCESSED / "escape_subgraph_nodes.csv")
    edges = pd.read_csv(PROCESSED / "escape_subgraph_edges.csv")
    metadata = json.loads((PROCESSED / "escape_subgraph_metadata.json").read_text(encoding="utf-8"))

    selected_columns = ["root_id", "cell_type", "hemibrain_type", "side", "top_nt"]
    missing = [column for column in selected_columns if column not in nodes.columns]
    if missing:
        raise RuntimeError(f"Missing expected node columns: {missing}")

    node_records = []
    node_index = {}
    for index, row in nodes[selected_columns].reset_index(drop=True).iterrows():
        root_id = str(row["root_id"])
        node_index[root_id] = int(index)
        node_records.append(
            {
                "id": root_id,
                "cellType": str(row["cell_type"]),
                "hemibrainType": str(row["hemibrain_type"]),
                "side": str(row["side"]),
                "neurotransmitter": str(row["top_nt"]),
            }
        )

    edge_records = []
    max_log_weight = max(math.log1p(int(value)) for value in edges["syn_count"])
    for row in edges[["pre_pt_root_id", "post_pt_root_id", "syn_count"]].itertuples(index=False):
        source_id = str(row.pre_pt_root_id)
        target_id = str(row.post_pt_root_id)
        if source_id not in node_index or target_id not in node_index:
            continue
        syn_count = int(row.syn_count)
        edge_records.append(
            {
                "source": node_index[source_id],
                "target": node_index[target_id],
                "synCount": syn_count,
                "weight": round(math.log1p(syn_count) / max_log_weight, 6),
            }
        )

    payload = {
        "metadata": {
            "source": "FlyWire/Codex FAFB v783 processed escape-candidate subgraph",
            "nodeCount": len(node_records),
            "edgeCount": len(edge_records),
            "candidateCellTypes": metadata.get("candidate_cell_types", []),
            "edgeSelection": metadata.get("edge_selection"),
            "realDataStatement": metadata.get("real_data_statement"),
            "simulationAssumptionStatement": metadata.get("simulation_assumption_statement"),
        },
        "nodes": node_records,
        "edges": edge_records,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT}")
    print(f"Nodes: {len(node_records)}")
    print(f"Edges: {len(edge_records)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
