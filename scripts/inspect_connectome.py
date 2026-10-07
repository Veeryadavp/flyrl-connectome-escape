from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.connectome.loader import (  # noqa: E402
    EXPECTED_CONNECTIVITY_FILE,
    ConnectomeDataError,
    find_first_existing,
    read_table,
    summarize_table,
)


ANNOTATION_CANDIDATES = (
    "Supplemental_file1_neuron_annotations.tsv",
    "Supplemental_file1_neuron_annotations.tsv.gz",
    "consolidated_cell_types.csv",
    "consolidated_cell_types.csv.gz",
    "consolidated_cell_types_783.csv",
    "consolidated_cell_types_783.csv.gz",
    "cell_types.csv",
    "cell_types.csv.gz",
)


def print_summary(path: Path, sample_rows: int) -> None:
    summary = summarize_table(path, sample_rows=sample_rows)
    row_text = "unknown from sampled read" if summary.rows is None else str(summary.rows)
    print(f"\nFile: {summary.path}")
    print(f"Rows: {row_text}")
    print("Columns:")
    for column in summary.columns:
        print(f"  - {column}: {summary.dtypes[column]}")


def inspect_connectivity(path: Path, sample_rows: int) -> None:
    print_summary(path, sample_rows)
    df = read_table(path, nrows=sample_rows)
    if "syn_count" in df.columns:
        print("\nSynapse-count sample stats:")
        print(f"  min: {int(df['syn_count'].min())}")
        print(f"  max: {int(df['syn_count'].max())}")
        print(f"  mean: {float(df['syn_count'].mean()):.3f}")
    if "neuropil" in df.columns:
        neuropils = sorted(str(value) for value in df["neuropil"].dropna().unique()[:20])
        print("\nNeuropils in sample:")
        for neuropil in neuropils:
            print(f"  - {neuropil}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect local FlyWire/Codex connectome exports.")
    parser.add_argument("--raw-dir", type=Path, default=ROOT / "data" / "raw")
    parser.add_argument("--sample-rows", type=int, default=1000)
    args = parser.parse_args()

    raw_dir = args.raw_dir.resolve()
    print(f"Inspecting raw data directory: {raw_dir}")

    connectivity_path = raw_dir / EXPECTED_CONNECTIVITY_FILE
    if not connectivity_path.exists():
        print(
            "\nMissing proofread connectivity file. Download the real FlyWire/Codex export "
            f"`{EXPECTED_CONNECTIVITY_FILE}` into data/raw before extraction."
        )
        return 2

    try:
        inspect_connectivity(connectivity_path, args.sample_rows)
    except ConnectomeDataError as exc:
        print(f"\nError: {exc}")
        return 2

    annotation_path = find_first_existing(raw_dir, ANNOTATION_CANDIDATES)
    if annotation_path is None:
        print(
            "\nNo annotation table found yet. Add a real Codex/FlyWire cell-type export before "
            "extracting LC4/LPLC2/DNp01 candidates."
        )
        return 0

    print("\nAnnotation candidate found.")
    print_summary(annotation_path, args.sample_rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
