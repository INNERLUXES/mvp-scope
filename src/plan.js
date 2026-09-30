// How the plan is cut. docs/method.md says the same in words; a change here changes that page too.

const round1 = (x) => Math.round(x * 10) / 10;

// A dependency loop (a needs b, b needs a) has no order to build in. Returns the loop as a list of ids, or null.
export function findCycle(features) {
  const byId = new Map(features.map((f) => [f.id, f]));
  const state = new Map();
  const stack = [];
  function visit(id) {
    state.set(id, 1);
    stack.push(id);
    for (const d of byId.get(id).dependsOn) {
      if (state.get(d) === 1) return [...stack.slice(stack.indexOf(d)), d];
      if (!state.has(d)) {
        const found = visit(d);
        if (found) return found;
      }
    }
    stack.pop();
    state.set(id, 2);
    return null;
  }
  for (const f of features) {
    if (!state.has(f.id)) {
      const found = visit(f.id);
      if (found) return found;
    }
  }
  return null;
}

// The first release: every core feature and everything a core feature needs, in an order that can be built.
// Each item says why it is there: "core", or the core feature that pulled it in.
export function firstRelease(features) {
  const byId = new Map(features.map((f) => [f.id, f]));
  const why = new Map();
  const order = [];
  function take(id, reason) {
    if (why.has(id)) return;
    why.set(id, byId.get(id).core ? 'core' : reason);
    for (const d of byId.get(id).dependsOn) take(d, byId.get(id).core ? `needed by ${id}` : reason);
    order.push(id);
  }
  for (const f of features) if (f.core) take(f.id, 'core');
  return order.map((id) => ({ ...byId.get(id), reason: why.get(id) }));
}

// The features left after the first release, cut into releases of a fixed length. A feature is ready when
// everything it needs is in an earlier release or earlier in the same one; among the ready ones the most value
// per day goes first. A feature longer than a whole release gets one of its own and is named as one to split.
export function laterReleases(features, taken, capacity, firstNumber = 2) {
  const done = new Set(taken);
  let left = features.filter((f) => !done.has(f.id));
  const releases = [];
  const oversize = [];
  let number = firstNumber;
  while (left.length) {
    let room = capacity;
    const items = [];
    for (;;) {
      const ready = left
        .filter((f) => f.dependsOn.every((d) => done.has(d)))
        .sort((a, b) => b.value / b.days - a.value / a.days || a.line - b.line);
      let pick = ready.find((f) => f.days <= room + 1e-9);
      let big = false;
      if (!pick) {
        if (items.length || !ready.length) break;
        pick = ready[0];
        big = true;
      }
      items.push({ ...pick, reason: `value ${pick.value}${pick.valueAssumed ? ' (assumed)' : ''}, ${round1(pick.value / pick.days)} per day` });
      done.add(pick.id);
      room -= pick.days;
      left = left.filter((f) => f.id !== pick.id);
      if (big) { oversize.push(pick.id); break; }
    }
    if (!items.length) throw new Error('internal: no feature could be placed, the dependency check should have caught this');
    const days = round1(items.reduce((s, f) => s + f.days, 0));
    releases.push({ number: number++, items, days });
  }
  return { releases, oversize };
}

export function plan(features, team) {
  const cycle = findCycle(features);
  if (cycle) throw new Error(`dependency loop: ${cycle.join(' -> ')}`);
  const weekly = team.people * team.daysPerWeek;
  const limitDays = round1(team.firstWeeks * weekly);
  const releaseDays = round1(team.releaseWeeks * weekly);
  const firstItems = firstRelease(features);
  const firstDays = round1(firstItems.reduce((s, f) => s + f.days, 0));
  const first = firstItems.length
    ? { chosen: true, items: firstItems, days: firstDays, weeks: round1(firstDays / weekly), limitDays, fits: firstDays <= limitDays, overBy: round1(Math.max(0, firstDays - limitDays)) }
    : { chosen: false, items: [], days: 0, weeks: 0, limitDays, fits: null, overBy: 0 };
  const later = laterReleases(features, firstItems.map((f) => f.id), releaseDays, first.chosen ? 2 : 1);
  for (const r of later.releases) r.weeks = round1(r.days / weekly);
  const totalDays = round1(features.reduce((s, f) => s + f.days, 0));
  return {
    team: { ...team, weekly, releaseDays },
    totals: { features: features.length, days: totalDays, weeks: round1(totalDays / weekly) },
    first,
    releases: later.releases,
    oversize: later.oversize,
    // a value is only used to order the later releases, so only those features can have an assumed one
    assumedValue: later.releases.flatMap((x) => x.items).filter((f) => f.valueAssumed).map((f) => f.id)
  };
}

// True when the first release does not fit the limit, for --fail-if-over.
export function overLimit(result) {
  return result.first.chosen && !result.first.fits;
}
