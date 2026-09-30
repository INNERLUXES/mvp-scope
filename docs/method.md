# How the plan is cut

## 1. The list is checked

Every row is checked before anything is planned. An empty id, an id used twice, days that are not a positive number, a `core` that is not yes or no, a value outside 1 to 5, or a dependency on an id that is not in the file stops the run, and every bad row is listed with its line number. A dependency loop (`a` needs `b`, `b` needs `a`) is named with its full path, because it has no order to build in.

## 2. The first release

The first release holds every feature marked `core`, and every feature a core feature depends on, directly or through another feature. Each one says why it is there: `core`, or `needed by` the core feature that pulled it in. The features are listed in an order that can be built: nothing comes before what it depends on.

Its days are added up and divided by the team's days per week. If the total is above the limit (`--first-weeks` times the weekly capacity), the plan says by how many days. The tool does not cut a core feature itself: which one to drop is a product decision ([decision 2](decisions/0002-the-tool-never-cuts-a-core-feature.md)).

Without any core feature there is no first release to check, and the plan says "not chosen" instead of pretending one exists.

## 3. The later releases

Every other feature goes into releases of `--release-weeks`. A feature is ready when everything it depends on is in an earlier release, or earlier in the same one. Among the ready features, the one with the most value per day goes first (value divided by days); a tie goes to the feature higher in the file. When the next one does not fit the room left in the release, the next ready one that does fit is taken, so a release is filled rather than closed early.

A feature longer than a whole release gets a release of its own and is named in the notes as one to split: nothing that long should reach users in one piece.

## 4. What every format carries

The text, Markdown, JSON and CSV reports carry the same facts: the first release and its verdict, every later release, the features to split, and every value that was assumed. In CSV a cell that starts with `=`, `+`, `-`, `@` or a tab is prefixed with an apostrophe so a spreadsheet does not run it.
