# FlyRL

Drosophila Connectome Escape Environment

FlyRL is a small portfolio project exploring whether structural connectivity principles from an open Drosophila connectome can inform a lightweight escape-response agent in an interactive browser environment.

> FlyRL does not simulate the complete Drosophila brain. It uses structural connectivity information from an open Drosophila connectome to construct a simplified computational model for an interactive escape-response experiment.

## Data License and Attribution

FlyRL's code is separate from the public FlyWire/Codex data used during local development. The project uses FlyWire/Codex FAFB v783 and FlyWire annotation resources as source material, and those upstream resources must be credited when the project is shared publicly.

The generated browser graph file is intentionally kept out of public commits:

```text
frontend/src/data/escapeSubgraph.json
```

That file is derived from local downloaded source data and should be regenerated locally rather than redistributed casually. The public repository includes a tiny synthetic demo graph at `frontend/src/data/escapeSubgraph.demo.json` so the app and tests can run without redistributing FlyWire-derived records. See `DATA_NOTICE.md` for attribution text, source links, and public-release guidance.

## Phase 1 Scope

This repository currently includes the Phase 1 data scaffold, Phase 2 interactive browser arena, Phase 3 baseline agent, and an initial Phase 4/5 connectome-informed agent path.

Phase 1 creates:

- a clean frontend/backend/data/scripts/test layout
- a small connectome file loader
- a graph construction helper for proofread FlyWire connectivity tables
- an inspection script for local FlyWire/Codex exports
- a cautious escape-subgraph extraction script that requires real annotation files
- provenance documentation in `data/README.md`

## Scientific Boundaries

REAL DATA:

- FlyWire/Codex structural connectivity tables
- root IDs, synapse counts, neuropil labels, and neurotransmitter probability fields when present
- cell-type annotations only when supplied by the downloaded source data

BIOLOGICAL INTERPRETATION:

- LC4 and LPLC2 are literature-supported looming-sensitive visual projection neuron classes
- DNp01/GF is a literature-supported descending escape-related neuron class
- Exact FlyWire root IDs must be verified from downloaded annotations before use

SIMULATION:

- Future cursor-derived threat signals will be mapped onto selected input nodes
- Future neural dynamics will use simplified activation propagation
- If synapse counts are used as edge weights, that will be a modelling assumption, not a claim about true firing strength

## Repository Structure

```text
frontend/
  src/
    components/
    game/
    services/
    types/
    visualisation/

backend/
  main.py
  agent/
  connectome/
  environment/
  evaluation/

data/
  raw/
  processed/
  README.md

scripts/
  inspect_connectome.py
  extract_escape_subgraph.py

tests/
```

## Data Setup

Download the FlyWire/Codex static exports into `data/raw/`. The expected Phase 1 file is:

```text
data/raw/proofread_connections_783.feather
```

For subgraph extraction, also include a real annotation export such as a Codex/FlyWire cell-type table containing root IDs and cell-type labels.

Run inspection:

```bash
python scripts/inspect_connectome.py --raw-dir data/raw
```

Attempt subgraph extraction after annotations are available:

```bash
python scripts/extract_escape_subgraph.py \
  --raw-dir data/raw \
  --processed-dir data/processed
```

## Development

Install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run tests:

```bash
pytest
```

## Next Phase

## Current Agent Modes

BASELINE:

- deterministic threat-response controller
- uses cursor distance, cursor velocity, approach velocity, and escape direction
- serves as the conventional control condition

CONNECTOME:

- uses an exported real FlyWire-derived LC4/LPLC2/DNp01 candidate subgraph
- maps cursor threat variables onto LC4/LPLC2 input activity
- propagates simplified activity through structural edges weighted by normalized synapse counts
- uses DNp01/Giant Fiber candidate activity as an action-related escape signal

This is still a simplified computational model. It is not a complete brain simulation, not a trained model, and not a claim that synapse count directly equals firing strength.

## Next Phase

The next phase should move the connectome agent behind the FastAPI backend or shared service boundary, broaden metrics for baseline-vs-connectome comparison, and document early measured results.
