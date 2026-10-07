from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import pandas as pd


EXPECTED_CONNECTIVITY_FILE = "proofread_connections_783.feather"
ROOT_ID_COLUMNS = ("root_id", "pt_root_id", "pre_pt_root_id", "post_pt_root_id")


class ConnectomeDataError(RuntimeError):
    """Raised when required connectome data is missing or malformed."""


@dataclass(frozen=True)
class TableSummary:
    path: Path
    rows: int | None
    columns: tuple[str, ...]
    dtypes: dict[str, str]


def require_file(path: Path) -> Path:
    if not path.exists():
        raise ConnectomeDataError(
            f"Missing required data file: {path}. Download real FlyWire/Codex data "
            "into data/raw before running this step."
        )
    if not path.is_file():
        raise ConnectomeDataError(f"Expected a file but found: {path}")
    return path


def find_first_existing(directory: Path, names: Iterable[str]) -> Path | None:
    for name in names:
        candidate = directory / name
        if candidate.exists() and candidate.is_file():
            return candidate
    return None


def read_table(path: Path, columns: list[str] | None = None, nrows: int | None = None) -> pd.DataFrame:
    require_file(path)
    suffixes = "".join(path.suffixes)

    if path.suffix == ".feather":
        df = pd.read_feather(path, columns=columns)
        return df.head(nrows) if nrows is not None else df

    if path.suffix == ".parquet":
        df = pd.read_parquet(path, columns=columns)
        return df.head(nrows) if nrows is not None else df

    if suffixes.endswith(".csv") or suffixes.endswith(".csv.gz"):
        return pd.read_csv(path, usecols=columns, nrows=nrows, low_memory=False)

    if suffixes.endswith(".tsv") or suffixes.endswith(".tsv.gz"):
        return pd.read_csv(path, sep="\t", usecols=columns, nrows=nrows, low_memory=False)

    raise ConnectomeDataError(
        f"Unsupported data format for {path.name}. "
        "Supported formats: .feather, .parquet, .csv, .csv.gz, .tsv, .tsv.gz"
    )


def summarize_table(path: Path, sample_rows: int = 1000) -> TableSummary:
    df = read_table(path, nrows=sample_rows)
    return TableSummary(
        path=path,
        rows=None if len(df) == sample_rows else len(df),
        columns=tuple(df.columns),
        dtypes={column: str(dtype) for column, dtype in df.dtypes.items()},
    )


def validate_connectivity_columns(df: pd.DataFrame) -> None:
    required = {"pre_pt_root_id", "post_pt_root_id", "syn_count"}
    missing = sorted(required.difference(df.columns))
    if missing:
        raise ConnectomeDataError(
            "Connectivity table is missing required columns: "
            + ", ".join(missing)
            + ". Expected FlyWire proofread connections schema."
        )
