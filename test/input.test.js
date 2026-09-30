import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, parseFeatures, parseTeam } from '../src/index.js';

const HEAD = 'id,name,days,depends_on,core,value\n';

test('parseCsv: quotes, commas and line ends inside quotes, BOM, blank lines', () => {
  const rows = parseCsv('﻿id,name,days\r\n\r\na,"Sign in, with ""magic"" link",2\n', ['id', 'name', 'days'], 'features');
  assert.deepEqual(rows, [{ id: 'a', name: 'Sign in, with "magic" link', days: '2' }]);
  assert.throws(() => parseCsv('', ['id'], 'features'), /the file is empty/);
  assert.throws(() => parseCsv('id,name\na,b\n', ['id', 'days'], 'features'), /missing column\(s\) days/);
  assert.throws(() => parseCsv('id,name\na\n', ['id'], 'features'), /line 2: expected 2 values, found 1/);
});

test('parseFeatures: a good list', () => {
  const f = parseFeatures(`${HEAD}auth,Sign in,3,,yes,\nbook,Book,2.5,auth,no,5\n`);
  assert.equal(f.length, 2);
  assert.deepEqual(f[0], { id: 'auth', name: 'Sign in', days: 3, dependsOn: [], core: true, value: 3, valueAssumed: true, line: 2 });
  assert.equal(f[1].days, 2.5);
  assert.deepEqual(f[1].dependsOn, ['auth']);
  assert.equal(f[1].valueAssumed, false);
});

test('parseFeatures: the optional columns can be left out', () => {
  const f = parseFeatures('id,name,days\na,A,1\n');
  assert.equal(f[0].core, false);
  assert.deepEqual(f[0].dependsOn, []);
  assert.equal(f[0].value, 3);
});

test('parseFeatures: every bad row is named with its line, none is skipped', () => {
  const bad = `${HEAD},No id,1,,,\na,A,0,,,\na,Twice,1,,,\nb c,Space,1,,,\nd,,x,,maybe,9\ne,E,1,zz,,\n`;
  let msg = '';
  try { parseFeatures(bad); } catch (err) { msg = err.message; }
  assert.match(msg, /line 2: id is empty/);
  assert.match(msg, /line 3: days must be a number above 0/);
  assert.match(msg, /line 4: id a is used twice/);
  assert.match(msg, /line 5: id "b c" contains a space/);
  assert.match(msg, /line 6: name is empty/);
  assert.match(msg, /line 6: days must be a number/);
  assert.match(msg, /line 6: core must be yes or no/);
  assert.match(msg, /line 6: value must be a whole number from 1 to 5/);
  assert.match(msg, /line 7: e depends on zz, which is not in the list/);
});

test('parseFeatures: a header without rows is refused', () => {
  assert.throws(() => parseFeatures(HEAD), /no features/);
});

test('parseTeam: defaults and limits', () => {
  assert.deepEqual(parseTeam(), { people: 1, daysPerWeek: 5, firstWeeks: 6, releaseWeeks: 2 });
  assert.deepEqual(parseTeam({ people: '3', releaseWeeks: '1' }), { people: 3, daysPerWeek: 5, firstWeeks: 6, releaseWeeks: 1 });
  assert.throws(() => parseTeam({ people: 0 }), /people must be a number/);
  assert.throws(() => parseTeam({ daysPerWeek: 8 }), /days per week/);
  assert.throws(() => parseTeam({ firstWeeks: 'soon' }), /first release weeks/);
});
