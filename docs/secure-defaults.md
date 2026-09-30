# Secure defaults

| Setting | Default | Why |
|---|---|---|
| Bad rows | Stop and list every one | A skipped row is a feature that silently disappears from the plan. |
| Unknown dependency | Stop | A dependency on a feature that is not in the list means the list is incomplete. |
| Dependency loop | Stop and name it | A loop has no order to build in; guessing one hides the problem. |
| No core feature | First release "not chosen" | An unchecked first release must never read as one that fits. |
| Missing value | 3, listed as assumed | The order of later releases depends on it, so the reader sees every guess. |
| Exit code | 0, unless `--fail-if-over` is given | The tool reports by default; a pipeline decides whether an overrun blocks it. |
| CSV cells | Formula characters prefixed with an apostrophe | Feature names are free text and must not run in a spreadsheet. |
| Network | Never used | Product plans are confidential and stay on the machine. |
| Output | Terminal | Nothing is written to disk unless `--output` is given. |
