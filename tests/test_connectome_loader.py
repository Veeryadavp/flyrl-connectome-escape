from pathlib import Path

import pandas as pd
import pytest

from backend.connectome.graph import build_connectivity_graph
from backend.connectome.loader import ConnectomeDataError, read_table, validate_connectivity_columns


def test_read_table_supports_csv(tmp_path: Path) -> None:
    csv_path = tmp_path / "connections.csv"
    csv_path.write_text(
        "pre_pt_root_id,post_pt_root_id,syn_count,neuropil\n"
        "1,2,5,LO_R\n"
        "2,3,2,PVLP_R\n",
        encoding="utf-8",
    )

    df = read_table(csv_path)

    assert list(df.columns) == ["pre_pt_root_id", "post_pt_root_id", "syn_count", "neuropil"]
    assert len(df) == 2


def test_read_table_supports_tsv(tmp_path: Path) -> None:
    tsv_path = tmp_path / "annotations.tsv"
    tsv_path.write_text("root_783\tcell_type\n1\tLC4\n", encoding="utf-8")

    df = read_table(tsv_path)

    assert list(df.columns) == ["root_783", "cell_type"]
    assert df.loc[0, "cell_type"] == "LC4"


def test_validate_connectivity_columns_rejects_missing_syn_count() -> None:
    df = pd.DataFrame({"pre_pt_root_id": [1], "post_pt_root_id": [2]})

    with pytest.raises(ConnectomeDataError):
        validate_connectivity_columns(df)


def test_build_connectivity_graph_aggregates_neuropil_edges() -> None:
    df = pd.DataFrame(
        {
            "pre_pt_root_id": [1, 1, 2],
            "post_pt_root_id": [2, 2, 3],
            "syn_count": [5, 3, 1],
            "neuropil": ["LO_R", "PVLP_R", "GNG"],
        }
    )

    graph = build_connectivity_graph(df, min_synapses=1)

    assert graph.number_of_nodes() == 3
    assert graph.number_of_edges() == 2
    assert graph["1"]["2"]["syn_count"] == 8
    assert graph["1"]["2"]["weight"] == 8
    assert graph["1"]["2"]["neuropils"] == {"LO_R", "PVLP_R"}


def test_build_connectivity_graph_applies_synapse_threshold() -> None:
    df = pd.DataFrame(
        {
            "pre_pt_root_id": [1, 2],
            "post_pt_root_id": [2, 3],
            "syn_count": [1, 6],
        }
    )

    graph = build_connectivity_graph(df, min_synapses=5)

    assert graph.number_of_edges() == 1
    assert graph.has_edge("2", "3")
