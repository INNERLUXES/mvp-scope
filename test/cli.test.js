import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, main } from '../src/cli.js';

const EX = join(fileURLToPath(import.meta.url), '..', '..', 'examples', 'features.csv');

function sink() {
  let data = '';
  return { write(s) { data += s; }, get text() { return data; } };
}

test('parseArgs', () => {
  const o = parseArgs(['--features', 'f.csv', '--people', '3', '--format', 'csv', '--fail-if-over']);
  assert.equal(o.features, 'f.csv');
  assert.deepEqual(o.team, { people: '3' });
  assert.equal(o.failIfOver, true);
  assert.throws(() => parseArgs([]), /--features is required/);
  assert.throws(() => parseArgs(['--features', 'f', '--format', 'xml']), /unknown format/);
  assert.throws(() => parseArgs(['--features']), /needs a value/);
  assert.throws(() => parseArgs(['--nope', 'x']), /unknown option/);
  assert.equal(parseArgs(['--help']).help, true);
});

test('help', async () => {
  const out = sink();
  assert.equal(await main(['--help'], { stdout: out, stderr: sink() }), 0);
  assert.match(out.text, /Exit codes/);
});

test('the example plan', async () => {
  const out = sink();
  assert.equal(await main(['--features', EX, '--people', '2'], { stdout: out, stderr: sink() }), 0);
  assert.match(out.text, /First release: 4 features, 14 days, about 1.4 weeks \(limit 6 weeks, 60 days\): fits/);
  assert.match(out.text, /split them: mobile/);
});

test('--fail-if-over exits 1 only when the first release is over', async () => {
  const err = sink();
  assert.equal(await main(['--features', EX, '--first-weeks', '2', '--fail-if-over'], { stdout: sink(), stderr: err }), 1);
  assert.match(err.text, /over its limit by 4 days/);
  assert.equal(await main(['--features', EX, '--fail-if-over'], { stdout: sink(), stderr: sink() }), 0);
});

test('--output writes the file, bad input exits 2', async (t) => {
  const d = await mkdtemp(join(tmpdir(), 'mvp-'));
  t.after(() => rm(d, { recursive: true, force: true }));
  const file = join(d, 'plan.json');
  assert.equal(await main(['--features', EX, '--format', 'json', '--output', file], { stdout: sink(), stderr: sink() }), 0);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).totals.features, 12);
  await writeFile(join(d, 'bad.csv'), 'id,name,days\na,A,-1\n');
  const err = sink();
  assert.equal(await main(['--features', join(d, 'bad.csv')], { stdout: sink(), stderr: err }), 2);
  assert.match(err.text, /line 2: days must be a number/);
  assert.equal(await main(['--features', join(d, 'missing.csv')], { stdout: sink(), stderr: sink() }), 2);
  assert.equal(await main(['--features', EX, '--people', '0'], { stdout: sink(), stderr: sink() }), 2);
});
