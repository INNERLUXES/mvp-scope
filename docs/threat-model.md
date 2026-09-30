# Threat model

The tool reads a product plan, which is confidential in itself, and prints a release plan that may be used to set a budget or a date. The risks are a wrong plan that looks right, and the plan going where it should not.

| Threat | Response |
|---|---|
| A malformed row is skipped and a feature disappears from the plan | Every row is checked; the run stops and names each bad row. |
| A feature is planned before something it needs | Nothing is placed before its dependencies; a test checks that every feature appears exactly once. |
| A dependency loop is broken at an arbitrary point | The run stops and names the loop. |
| A first release that was not checked reads as one that fits | Without a core feature every format says "not chosen". |
| An assumed value changes the order unseen | Every assumed value is listed in every format. |
| A feature name runs as a formula when the CSV is opened | Cells that start with a formula character are prefixed with an apostrophe. |
| The plan leaves the machine | The tool opens no network connection and writes a file only when `--output` is given. |

## Outside this model

- Whether the estimates and the values are right.
- A modified copy of the tool. Install from a release and check the attestation and checksums.
