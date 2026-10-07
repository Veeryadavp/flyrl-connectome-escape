from __future__ import annotations

import networkx as nx
import pandas as pd

from backend.connectome.loader import ConnectomeDataError, validate_connectivity_columns


def build_connectivity_graph(connections: pd.DataFrame, min_synapses: int = 1) -> nx.DiGraph:
    validate_connectivity_columns(connections)
    if min_synapses < 1:
        raise ConnectomeDataError("min_synapses must be >= 1")

    graph = nx.DiGraph()
    filtered = connections[connections["syn_count"] >= min_synapses]

    for row in filtered.itertuples(index=False):
        source = str(getattr(row, "pre_pt_root_id"))
        target = str(getattr(row, "post_pt_root_id"))
        syn_count = int(getattr(row, "syn_count"))

        if graph.has_edge(source, target):
            graph[source][target]["syn_count"] += syn_count
            graph[source][target]["weight"] += syn_count
            neuropils = graph[source][target].setdefault("neuropils", set())
            if hasattr(row, "neuropil"):
                neuropils.add(str(getattr(row, "neuropil")))
        else:
            attrs = {"syn_count": syn_count, "weight": syn_count}
            if hasattr(row, "neuropil"):
                attrs["neuropils"] = {str(getattr(row, "neuropil"))}
            graph.add_edge(source, target, **attrs)

    return graph
