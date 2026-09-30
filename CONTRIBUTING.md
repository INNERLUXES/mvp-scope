# Contributing

Every change goes through a pull request and is reviewed before it is merged. The pipeline runs the tests on Linux, Windows and macOS, the repository checks, CodeQL, and a secure development check of the repository itself.

## Changing how the plan is cut

1. Describe the rule in docs/method.md first.
2. Add a test with a small, made-up feature list where the expected plan can be worked out by hand.
3. Every feature still appears exactly once, and never before what it depends on.
4. A limit that is exceeded, a feature to split and an assumed value show in every format.

## Rules for the code

- No runtime dependencies. Node 22 or newer and nothing else.
- The tool reads the file it is given and writes only when `--output` is given. It opens no network connection.
- No built-in estimates. The days in the plan are always the reader's own.
- Never commit a real product plan, even as a test fixture.

## Before you open the pull request

```
npm test
npm run check
npm run example
```
