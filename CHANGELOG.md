# Changes

## 1.0.0

First release.

- The first release: every core feature and everything it depends on, in build order, each with the reason it is there.
- A check of the first release against a limit in weeks, for the team size you give.
- Later releases of a fixed length, most value per day first, never before what they depend on; a feature longer than a release is named to split.
- Every bad row stops the run with its line number; dependency loops are named.
- Reports as text, Markdown, JSON and CSV; `--fail-if-over` for use in a pipeline.
- Release packages come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
