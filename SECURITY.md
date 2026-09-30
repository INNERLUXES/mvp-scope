# Security

## Reporting a problem

Write to info@innerluxes.dev with the subject line "mvp-scope security", or use private vulnerability reporting on this repository. Please do not open a public issue for a vulnerability.

Include a feature list that shows the problem (made-up features are best), what you expected and what happened. Do not send a real product plan.

## Scope

In scope:

- input that passes validation but produces a wrong or incomplete plan, such as a feature placed before what it depends on, or a feature left out
- input that makes the tool hang or use unbounded memory
- a CSV report that runs as a formula when opened in a spreadsheet
- anything that makes the tool open a network connection, or read or write a file it was not given

Out of scope: whether your estimates are right; docs/limits.md lists what the tool cannot know.

Read [docs/threat-model.md](docs/threat-model.md) for the rest.
