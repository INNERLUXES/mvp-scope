// Command line: mvp-scope --features features.csv [--people n] [--days-per-week n] [--first-weeks n]
//               [--release-weeks n] [--format text|markdown|json|csv] [--output file] [--fail-if-over]

import { readFile, writeFile } from 'node:fs/promises';
import { parseFeatures, parseTeam } from './input.js';
import { plan, overLimit } from './plan.js';
import { toText, toMarkdown, toJson, toCsv } from './report.js';

export const USAGE = `mvp-scope --features <features.csv> [options]

Cuts a feature list into a first release and the releases after it. The first release holds every feature marked
core and everything they depend on; it is checked against a limit in weeks. The rest follows in releases of a fixed
length, most value per day first, never before what it depends on. The estimates are yours; nothing is fetched.

Options
  --features <file>       CSV with columns id, name, days, and optional depends_on, core, value (required)
  --people <n>            people building it (default 1)
  --days-per-week <n>     working days per person per week (default 5)
  --first-weeks <n>       the most weeks the first release may take (default 6)
  --release-weeks <n>     the length of each later release (default 2)
  --format <f>            text (default), markdown, json or csv
  --output <file>         write the plan to a file
  --fail-if-over          exit 1 when the first release does not fit its limit
  --help                  this text

Exit codes: 0 done, 1 first release over its limit with --fail-if-over, 2 wrong usage or invalid input.`;

const NUMBERS = { '--people': 'people', '--days-per-week': 'daysPerWeek', '--first-weeks': 'firstWeeks', '--release-weeks': 'releaseWeeks' };

export function parseArgs(argv) {
  const o = { format: 'text', failIfOver: false, team: {} };
  const takes = new Set(['--features', '--format', '--output', ...Object.keys(NUMBERS)]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { o.help = true; continue; }
    if (a === '--fail-if-over') { o.failIfOver = true; continue; }
    if (!takes.has(a)) throw new Error(`unknown option: ${a}`);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error(`${a} needs a value`);
    const v = argv[++i];
    if (NUMBERS[a]) o.team[NUMBERS[a]] = v;
    else o[a.slice(2)] = v;
  }
  if (o.help) return o;
  if (!o.features) throw new Error('--features is required');
  if (!['text', 'markdown', 'json', 'csv'].includes(o.format)) throw new Error(`unknown format: ${o.format}`);
  return o;
}

async function read(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (err) {
    throw new Error(`cannot read ${file}: ${err.message}`);
  }
}

export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) {
  let o, result;
  try {
    o = parseArgs(argv);
    if (o.help) { stdout.write(`${USAGE}\n`); return 0; }
    const team = parseTeam(o.team);
    result = plan(parseFeatures(await read(o.features)), team);
  } catch (err) {
    stderr.write(`${err.message}\n\n${USAGE}\n`);
    return 2;
  }
  const text = o.format === 'json' ? toJson(result) : o.format === 'csv' ? toCsv(result)
    : o.format === 'markdown' ? toMarkdown(result) : toText(result);
  if (o.output) await writeFile(o.output, `${text}\n`);
  else stdout.write(`${text}\n`);
  if (o.failIfOver && overLimit(result)) {
    stderr.write(`first release over its limit by ${result.first.overBy} days\n`);
    return 1;
  }
  return 0;
}
