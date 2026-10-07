# Data Notice and Attribution

FlyRL is a portfolio and research-style prototype that uses public Drosophila connectome resources as source material for a simplified browser simulation.

## Source Data

The connectome-derived data used during local development came from:

- FlyWire / Codex FAFB v783 public release
- FlyWire Whole-brain Connectome Connectivity Data, version 783.0, Zenodo record: https://zenodo.org/records/10676866
- FlyWire annotation tables from `flyconnectome/flywire_annotations`: https://github.com/flyconnectome/flywire_annotations

FlyWire's public release guidelines state that public release data is available under CC BY-NC 4.0. Treat FlyRL's use of this data as non-commercial unless you have separately verified that a specific source file permits broader use.

## Attribution

This project should acknowledge the original FlyWire and annotation authors whenever it is shared publicly. Suggested short attribution:

> FlyRL uses public FlyWire/Codex FAFB v783 connectome resources and FlyWire annotation data as source material. The interactive agent is a simplified computational simulation built on top of those resources, not a complete biological brain simulation.

For formal or paper-style writing, cite the relevant FlyWire and annotation publications requested by the upstream sources, including Dorkenwald et al. for the FlyWire connectome release and Schlegel et al. for FlyWire annotations where applicable.

## Redistribution Boundary

The raw and processed connectome files are intentionally not part of the public source tree:

- `data/raw/*`
- `data/processed/*`
- `frontend/src/data/escapeSubgraph.json`

`frontend/src/data/escapeSubgraph.json` is generated from local downloaded source data. It may contain derived root IDs, cell-type labels, synapse counts, and edge weights from the FlyWire/Codex data. For a public repository, keep this file untracked and regenerate it locally from the original sources.

## Scientific Boundary

FlyRL does not train a model on the fly brain and does not simulate the complete Drosophila nervous system. It uses structural connectivity and annotations to drive a simplified threat-response controller for an interactive escape experiment.
