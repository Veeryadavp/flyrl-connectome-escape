# FlyRL Data Provenance

This directory is reserved for real Drosophila connectome data and processed FlyRL subsets.

## Source Dataset

Primary source:

- Dataset: FlyWire Whole-brain Connectome Connectivity Data
- Version: 783.0
- Organism/sample: adult female Drosophila melanogaster brain, FAFB/FlyWire
- Access: FlyWire Codex static downloads and Zenodo release
- Canonical portal: https://codex.flywire.ai/
- Zenodo record: https://zenodo.org/records/10676866
- Public release guidance: https://flywire.ai/guidelines
- Community principles: https://edit.flywire.ai/principles.html

Codex describes FAFB v783 as a static connectome snapshot. The Zenodo release describes `proofread_connections_783.feather` as a proofread, summarized neuron-neuron connectivity table.

FlyWire public release guidance says public release data is available under CC BY-NC 4.0. Treat this project as a non-commercial research/portfolio prototype unless a specific upstream source is separately verified to allow broader use.

## Raw Files

Place downloaded source files in:

```text
data/raw/
```

Expected connectivity file:

```text
proofread_connections_783.feather
```

Relevant columns documented by the source:

- `pre_pt_root_id`: presynaptic neuron root ID
- `post_pt_root_id`: postsynaptic neuron root ID
- `neuropil`: neuropil label associated with the connection
- `syn_count`: number of synapses for that neuron-neuron-neuropil combination
- `gaba_avg`, `ach_avg`, `glut_avg`, `oct_avg`, `ser_avg`, `da_avg`: average neurotransmitter prediction probabilities when present

For cell-type selection, also download a real FlyWire annotation table into `data/raw/`. The first supported source is the `flyconnectome/flywire_annotations` repository:

```text
Supplemental_file1_neuron_annotations.tsv
```

That repository describes this file as neuron annotations for flow, superclass, cell class, nerve, lineage, side, morphology groups, neurotransmitter and VirtualFlyBrain IDs for the `783` public release. Codex/FlyWire cell-type exports such as `consolidated_cell_types.csv` can also be inspected when available.

## Processed Files

Processed FlyRL subsets will be written to:

```text
data/processed/
```

The planned Phase 1 extraction outputs are:

- `escape_subgraph_nodes.csv`
- `escape_subgraph_edges.csv`
- `escape_subgraph_metadata.json`

For the frontend experiment, `scripts/export_frontend_connectome.py` converts the processed CSV subset into:

```text
frontend/src/data/escapeSubgraph.json
```

This JSON is a compact browser-friendly representation of the real processed subset. It preserves root IDs, cell-type labels, side, neurotransmitter annotation, directed edges, synapse counts, and normalized computational edge weights.

The public source tree does not track that generated JSON. It tracks only `frontend/src/data/escapeSubgraph.demo.json`, a small synthetic placeholder graph used to keep public builds runnable.

These files should only be produced from real downloaded data. Do not generate synthetic neuron IDs, invented cell types, or fabricated synapse counts.

## Selection Strategy

Initial biologically motivated candidates:

- `LC4`
- `LPLC2`
- `DNp01`
- `GF`

Reasoning:

- literature supports LC4 and LPLC2 as looming-sensitive visual projection neuron classes
- literature supports DNp01/GF as an escape-related descending neuron class

Important limitation:

- those biological labels are not enough by themselves
- exact root IDs and connections must be verified from the downloaded annotation and connectivity tables before being used by the FlyRL agent

## Modelling Assumptions

Structural connectivity is not a trained AI policy and is not equivalent to neural firing dynamics.

If a future FlyRL agent uses `syn_count` as a computational edge weight, that must be documented as a simplified modelling assumption. It should not be described as a direct biological firing strength.

Cursor-derived values such as distance, approach velocity, and time-to-contact are simulation inputs. They are not directly present in the connectome.
