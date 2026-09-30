# 2. The tool never cuts a core feature

## Context

When the first release is over its limit, a tool could drop the core feature with the least value until it fits. That turns a product decision into an arithmetic one: the feature it drops may be the one the idea depends on.

## Decision

- An overrun is reported with the number of days, in every format, and `--fail-if-over` can stop a pipeline on it.
- Which core feature to cut, split or simplify stays with the people who own the product.

## Consequences

- A plan that is over its limit is visible and cannot be missed, but it is not changed behind the reader's back.
