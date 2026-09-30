# mvp-scope

Cuts a startup's feature list into a first release that proves the idea, and the releases after it.

You list the features with your own estimates, mark the ones the first release cannot do without, and say what each one needs first. The tool answers the questions a founder and a development team have to agree on before a budget is signed:

- What exactly is in the first release, including the features nobody marked but the core ones depend on?
- Does it fit the weeks we have, with the team we have? If not, by how many days?
- In what order does the rest follow, so nothing is built before what it needs?
- Which features are too big to ship in one release and should be split?

Plain JavaScript, no dependencies. It reads the file you give it and fetches nothing; the plan stays on your machine.

```
npm test
```

```
# tests 27
# pass 27
# fail 0
```

## Try it

Requires Node 22 or newer. There is nothing to install.

```
git clone https://github.com/INNERLUXES/mvp-scope.git
cd mvp-scope
npm run example
```

```
MVP scope: 12 features, 69 days of work. Team: 2 people x 5 days a week = 10 days a week.

First release: 4 features, 14 days, about 1.4 weeks (limit 6 weeks, 60 days): fits
  auth          3 days  Sign up and sign in  (core)
  profile       2 days  Business profile  (core)
  calendar      4 days  Calendar of free slots  (needed by booking)
  booking       5 days  Book an appointment  (core)

Later releases, 2 weeks each (20 days): 3
Release 2: 5 features, 19 days
  reminders     3 days  Email and SMS reminders  (value 4, 1.3 per day)
  payments      5 days  Card payments at booking  (value 5, 1 per day)
  admin         3 days  Admin area  (value 3 (assumed), 1 per day)
  widget        4 days  Booking widget for the customer's site  (value 4, 1 per day)
  staff         4 days  Several staff calendars  (value 3, 0.8 per day)
Release 3: 2 features, 12 days
  reviews       3 days  Reviews after a visit  (value 2, 0.7 per day)
  reports       9 days  Revenue and no-show reports  (value 3, 0.3 per day)
Release 4: 1 feature, 24 days
  mobile       24 days  Mobile app for customers  (value 4, 0.2 per day)

Longer than one release (20 days), split them: mobile
Value 3 assumed for 1 feature(s) without one: admin
```

The booking product in `examples/` is made up, and so are its estimates. Your days come from the people who will build your product; the tool has none built in.

## Your own list

`features.csv`, one feature per line:

| Column | |
|---|---|
| `id`, `name`, `days` | required; `days` is your estimate in working days for one person |
| `depends_on` | ids that must exist first, separated by `;` |
| `core` | `yes` when the first release cannot prove the idea without it |
| `value` | 1 to 5; empty means 3, and the plan lists every value it assumed |

[docs/inputs.md](docs/inputs.md) explains each column and how to decide what is core, and [docs/method.md](docs/method.md) gives the exact rules behind the plan.

## Options

| Option | What it does |
|---|---|
| `--people <n>` | People building it (default 1) |
| `--days-per-week <n>` | Working days per person per week (default 5) |
| `--first-weeks <n>` | The most weeks the first release may take (default 6) |
| `--release-weeks <n>` | The length of each later release (default 2) |
| `--format text\|markdown\|json\|csv` | CSV has one line per feature in build order, ready for a ticket import |
| `--output <file>` | Write the plan to a file |
| `--fail-if-over` | Exit 1 when the first release does not fit its limit |

Exit codes: 0 done, 1 first release over its limit with `--fail-if-over`, 2 wrong usage or invalid input.

## Rules that keep the plan honest

- Every row is checked; a bad one stops the run with its line number instead of being skipped. A dependency loop is named.
- Nothing is planned before what it depends on, and every feature appears exactly once.
- Without a core feature the first release says "not chosen", never "fits".
- An overrun is reported, never fixed by quietly dropping a core feature. [docs/limits.md](docs/limits.md) lists what a plan built from estimates cannot know.

## As a library

```js
import { parseFeatures, parseTeam, plan, toMarkdown } from './src/index.js';

const result = plan(parseFeatures(csvText), parseTeam({ people: 2, firstWeeks: 6 }));
console.log(toMarkdown(result));
```

## How this repository is kept

- No runtime dependencies, a committed lock file, `npm ci` in the pipeline.
- Tests on Linux, Windows and macOS with Node 22 and 24, CodeQL, and repository checks for syntax, exports, credentials and leftovers.
- Every workflow sets its token permissions and pins every action to a full commit hash; Dependabot keeps them current.
- The pipeline checks the repository against NIST SP 800-218 with [ssdf-repo-check](https://github.com/INNERLUXES/ssdf-repo-check).
- Releases come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
- [SECURITY.md](SECURITY.md), [threat model](docs/threat-model.md), [secure defaults](docs/secure-defaults.md), [design decisions](docs/decisions).

## Related

Built by the team behind [software development for startups at INNERLUXES](https://innerluxes.dev/software-development/startup).

## License

MIT
