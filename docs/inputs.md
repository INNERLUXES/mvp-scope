# The feature list

One CSV file, one feature per line. The first line names the columns; their order does not matter.

| Column | Required | What goes in it |
|---|---|---|
| `id` | yes | A short name without spaces or `;`, used in `depends_on`. Each id once. |
| `name` | yes | What the user gets, in plain words. |
| `days` | yes | Your estimate in working days for one person, above 0 and at most 1000. Halves such as `2.5` are fine. |
| `depends_on` | no | Ids of the features that must exist first, separated by `;`. |
| `core` | no | `yes` when the first release cannot prove the idea without this feature. Empty means no. |
| `value` | no | 1 to 5: how much users gain from it. Empty means 3, and the plan lists every value it had to assume. |

## Where the estimates come from

From the people who will build it, after the screens are designed. A feature estimated before anyone has seen its screens is usually the one that runs over. The tool never adds its own numbers: the plan is only as good as the days in the file.

## Marking what is core

Ask one question of each feature: if it were missing, could the first users still show whether the idea works? Sign-in, the one task the product exists for, and whatever that task needs are usually core. Payments are core only when paying is the thing being tested.

## The team

| Option | Default | Meaning |
|---|---|---|
| `--people` | 1 | People building it at the same time |
| `--days-per-week` | 5 | Working days per person per week |
| `--first-weeks` | 6 | The most weeks the first release may take |
| `--release-weeks` | 2 | The length of each later release |

Capacity is people times days per week. The tool assumes the work splits across people; [limits.md](limits.md) says when it does not.
