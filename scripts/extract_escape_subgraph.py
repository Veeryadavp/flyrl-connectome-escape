from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.connectome.loader import (  # noqa: E402
    EXPECTED_CONNECTIVITY_FILE,
    ConnectomeDataError,
    find_first_existing,
    read_table,
    validate_connectivity_columns,
)
from inspect_connectome import ANNOTATION_CANDIDATES  # noqa: E402


DEFAULT_CELL_TYPES = ("LC4", "LPLC2", "DNp01", "GF")
TYPE_COLUMN_HINTS = ("type", "cell_type", "primary_type", "classification", "label", "name")
ROOT_COLUMN_CANDIDATES = ("root_id", "pt_root_id", "root_783", "id")


def find_root_column(df: pd.DataFrame) -> str:
    for column in ROOT_COLUMN_CANDIDATES:
        if column in df.columns:
            return column
    raise ConnectomeDataError(
        "Annotation table does not contain a recognized root ID column. "
        f"Expected one of: {', '.join(ROOT_COLUMN_CANDIDATES)}"
    )


def find_type_columns(df: pd.DataFrame) -> list[str]:
    columns = []
    for column in df.columns:
        lower = column.lower()
        if any(hint in lower for hint in TYPE_COLUMN_HINTS):
            columns.append(column)
    if not columns:
        raise ConnectomeDataError(
            "Annotation table does not contain an obvious cell-type/label column. "
            "Inspect the file and update TYPE_COLUMN_HINTS if needed."
        )
    return columns


def select_candidate_nodes(annotations: pd.DataFrame, cell_types: tuple[str, ...]) -> pd.DataFrame:
    root_column = find_root_column(annotations)
    type_columns = find_type_columns(annotations)

    mask = pd.Series(False, index=annotations.index)
    for column in type_columns:
        values = annotations[column].astype(str)
        for cell_type in cell_types:
            mask = mask | values.str.fullmatch(cell_type, case=False, na=False)
            mask = mask | values.str.contains(rf"\b{cell_type}\b", case=False, na=False, regex=True)

    selected = annotations.loc[mask].copy()
    if selected.empty:
        raise ConnectomeDataError(
            "No candidate LC4/LPLC2/DNp01/GF rows found in the annotation table. "
            "Do not proceed until the real relevant cell labels/root IDs are verified."
        )

    selected["flyrl_root_id"] = selected[root_column].astype(str)
    selected["flyrl_matched_columns"] = ", ".join(type_columns)
    return selected


def extract_edges(connections: pd.DataFrame, root_ids: set[str]) -> pd.DataFrame:
    validate_connectivity_columns(connections)
    pre = connections["pre_pt_root_id"].astype(str)
    post = connections["post_pt_root_id"].astype(str)
    return connections.loc[pre.isin(root_ids) & post.isin(root_ids)].copy()


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract a verified FlyRL escape-candidate subgraph.")
    parser.add_argument("--raw-dir", type=Path, default=ROOT / "data" / "raw")
    parser.add_argument("--processed-dir", type=Path, default=ROOT / "data" / "processed")
    parser.add_argument("--cell-type", action="append", dest="cell_types")
    args = parser.parse_args()

    raw_dir = args.raw_dir.resolve()
    processed_dir = args.processed_dir.resolve()
    cell_types = tuple(args.cell_types) if args.cell_types else DEFAULT_CELL_TYPES

    connectivity_path = raw_dir / EXPECTED_CONNECTIVITY_FILE
    annotation_path = find_first_existing(raw_dir, ANNOTATION_CANDIDATES)

    if annotation_path is None:
        print(
            "Missing real annotation table. Download a Codex/FlyWire cell-type export into data/raw "
            "before extracting an escape subgraph."
        )
        return 2

    try:
        annotations = read_table(annotation_path)
        nodes = select_candidate_nodes(annotations, cell_types)
        connections = read_table(connectivity_path)
        edges = extract_edges(connections, set(nodes["flyrl_root_id"]))
    except ConnectomeDataError as exc:
        print(f"Error: {exc}")
        return 2

    if edges.empty:
        print(
            "Candidate nodes were found, but no edges touching those root IDs were found in the "
            "connectivity table. Verify that annotation and connectivity files use the same snapshot."
        )
        return 2

    processed_dir.mkdir(parents=True, exist_ok=True)
    nodes_path = processed_dir / "escape_subgraph_nodes.csv"
    edges_path = processed_dir / "escape_subgraph_edges.csv"
    metadata_path = processed_dir / "escape_subgraph_metadata.json"

    nodes.to_csv(nodes_path, index=False)
    edges.to_csv(edges_path, index=False)
    metadata = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source_connectivity_file": str(connectivity_path),
        "source_annotation_file": str(annotation_path),
        "candidate_cell_types": cell_types,
        "node_count": int(len(nodes)),
        "edge_count": int(len(edges)),
        "edge_selection": "Induced subgraph: edges are included only when both pre and post root IDs are in the selected candidate set.",
        "real_data_statement": "Rows are derived from local FlyWire/Codex files; no synthetic neurons or synapse counts are generated.",
        "simulation_assumption_statement": "Future use of syn_count as a computational weight is a simplified modelling assumption.",
    }
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {nodes_path}")
    print(f"Wrote {edges_path}")
    print(f"Wrote {metadata_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
