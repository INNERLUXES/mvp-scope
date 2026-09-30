import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeatures, parseTeam, plan, toText, toMarkdown, toJson, toCsv } from '../src/index.js';

const HEAD = 'id,name,days,depends_on,core,value\n';
const make = (rows, team) => plan(parseFeatures(HEAD + rows.join('\n')), parseTeam(team));
const over = () => make(['a,A,8,,yes,', 'b,B,4,a,yes,', 'big,Big,15,,,', 'c,"=cmd|x",1,,,2'], { firstWeeks: 2 });

test('every format says the first release is over its limit', () => {
  const r = over();
  assert.match(toText(r), /does NOT fit, 2 days over/);
  assert.match(toMarkdown(r), /does NOT fit, 2 days over/);
  assert.equal(JSON.parse(toJson(r)).firstRelease.fits, false);
  assert.match(toCsv(r), /^1,a,A,8,core,first release over its limit$/m);
});

test('every format names the feature to split and the assumed values', () => {
  const r = over();
  for (const out of [toText(r), toMarkdown(r), toJson(r)]) {
    assert.match(out, /split them: big/);
    assert.match(out, /Value 3 assumed for 1 feature\(s\) without one: big/);
  }
  assert.match(toCsv(r), /,big,Big,15,.*,split: longer than one release$/m);
});

test('text: header, singular and plural, decimals', () => {
  const r = make(['a,A,1,,yes,', 'b,B,2.5,,,4'], { people: 1 });
  const t = toText(r);
  assert.match(t, /^MVP scope: 2 features, 3.5 days of work\. Team: 1 person x 5 days a week = 5 days a week\./);
  assert.match(t, /First release: 1 feature, 1 day, about 0.2 weeks/);
  assert.match(t, /Release 2: 1 feature, 2.5 days/);
});

test('without a core feature every format says the first release was not chosen', () => {
  const r = make(['a,A,1,,,', 'b,B,1,,,'], {});
  assert.match(toText(r), /First release: not chosen/);
  assert.match(toMarkdown(r), /First release: not chosen/);
  assert.equal(JSON.parse(toJson(r)).firstRelease.chosen, false);
  assert.doesNotMatch(toCsv(r), /^1,.*first release/m);
});

test('markdown escapes table characters, csv defuses formulas', () => {
  const r = over();
  assert.match(toMarkdown(r), /\=cmd\\|x|=cmd\\|x/);
  assert.match(toCsv(r), /,'=cmd\|x,/);
});
