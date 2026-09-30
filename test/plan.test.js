import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeatures, parseTeam, findCycle, firstRelease, laterReleases, plan, overLimit } from '../src/index.js';

const HEAD = 'id,name,days,depends_on,core,value\n';
const list = (rows) => parseFeatures(HEAD + rows.join('\n'));
const ids = (items) => items.map((f) => f.id);

test('findCycle: a loop is found and named, a tree is not', () => {
  assert.deepEqual(findCycle(list(['a,A,1,c,,', 'b,B,1,a,,', 'c,C,1,b,,'])), ['a', 'c', 'b', 'a']);
  assert.deepEqual(findCycle(list(['a,A,1,a,,'])), ['a', 'a']);
  assert.equal(findCycle(list(['a,A,1,,,', 'b,B,1,a,,', 'c,C,1,a;b,,'])), null);
});

test('plan refuses a dependency loop', () => {
  assert.throws(() => plan(list(['a,A,1,b,yes,', 'b,B,1,a,,']), parseTeam()), /dependency loop: a -> b -> a/);
});

test('firstRelease: core features, what they need, in build order, each with its reason', () => {
  const f = list(['pay,Pay,2,book,,', 'book,Book,3,cal,yes,', 'cal,Calendar,2,auth,,', 'auth,Auth,1,,yes,', 'extra,Extra,1,,,']);
  const first = firstRelease(f);
  assert.deepEqual(ids(first), ['auth', 'cal', 'book']);
  assert.deepEqual(first.map((x) => x.reason), ['core', 'needed by book', 'core']);
});

test('firstRelease: a dependency of a dependency names the core feature that pulled it in', () => {
  const first = firstRelease(list(['a,A,1,,,', 'b,B,1,a,,', 'c,C,1,b,yes,']));
  assert.deepEqual(first.map((x) => [x.id, x.reason]), [['a', 'needed by c'], ['b', 'needed by c'], ['c', 'core']]);
});

test('laterReleases: most value per day first, never before what it needs', () => {
  const f = list(['low,Low,2,,,1', 'high,High,2,dep,,5', 'dep,Dep,4,,,1']);
  const { releases } = laterReleases(f, [], 10);
  // high has the most value per day but waits for dep, which has the least; low goes first as the best of the ready ones
  assert.deepEqual(ids(releases[0].items), ['low', 'dep', 'high']);
  const tight = laterReleases(f, [], 4).releases;
  assert.deepEqual(tight.map((r) => ids(r.items)), [['low'], ['dep'], ['high']]);
});

test('laterReleases: a release is filled with the next feature that still fits', () => {
  const f = list(['a,A,6,,,5', 'b,B,6,,,5', 'c,C,4,,,1']);
  const { releases } = laterReleases(f, [], 10);
  assert.deepEqual(releases.map((r) => ids(r.items)), [['a', 'c'], ['b']]);
  assert.deepEqual(releases.map((r) => r.days), [10, 6]);
});

test('laterReleases: a feature longer than a release gets its own and is named to split', () => {
  const r = laterReleases(list(['big,Big,15,,,5', 'small,Small,2,,,1']), [], 10);
  assert.deepEqual(r.releases.map((x) => ids(x.items)), [['small'], ['big']]);
  assert.deepEqual(r.oversize, ['big']);
});

test('plan: the first release against its limit', () => {
  const f = list(['a,A,8,,yes,', 'b,B,4,a,yes,', 'c,C,3,,,']);
  const ok = plan(f, parseTeam({ people: 1, firstWeeks: 3 }));
  assert.equal(ok.first.days, 12);
  assert.equal(ok.first.weeks, 2.4);
  assert.equal(ok.first.limitDays, 15);
  assert.equal(ok.first.fits, true);
  assert.equal(overLimit(ok), false);
  const over = plan(f, parseTeam({ people: 1, firstWeeks: 2 }));
  assert.equal(over.first.fits, false);
  assert.equal(over.first.overBy, 2);
  assert.equal(overLimit(over), true);
});

test('plan: without a core feature the first release is not chosen, and says so', () => {
  const r = plan(list(['a,A,2,,,', 'b,B,2,,,']), parseTeam());
  assert.equal(r.first.chosen, false);
  assert.equal(r.first.fits, null);
  assert.equal(overLimit(r), false);
  assert.equal(r.releases[0].number, 1);
  assert.deepEqual(ids(r.releases[0].items), ['a', 'b']);
});

test('plan: totals, team capacity and assumed values', () => {
  const r = plan(list(['a,A,2.5,,yes,', 'b,B,1.5,,,', 'c,C,1,,,4']), parseTeam({ people: 2, daysPerWeek: 4, releaseWeeks: 1 }));
  assert.deepEqual(r.totals, { features: 3, days: 5, weeks: 0.6 });
  assert.equal(r.team.weekly, 8);
  assert.equal(r.team.releaseDays, 8);
  assert.deepEqual(r.assumedValue, ['b']);
  assert.equal(r.releases.flatMap((x) => x.items).length, 2);
});

test('plan: every feature appears exactly once', () => {
  const f = list(['a,A,3,,yes,', 'b,B,5,a,,2', 'c,C,30,b,,5', 'd,D,1,,,1', 'e,E,4,a;d,yes,']);
  const r = plan(f, parseTeam());
  const all = [...ids(r.first.items), ...r.releases.flatMap((x) => ids(x.items))];
  assert.deepEqual([...all].sort(), ['a', 'b', 'c', 'd', 'e']);
  assert.ok(ids(r.first.items).includes('d'), 'd is needed by the core feature e');
});
