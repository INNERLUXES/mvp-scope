// The plan in four formats. Every format carries the same facts: a limit that is exceeded, a feature to split and
// a value that was assumed are never left out of one of them.

const n = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
const days = (x) => `${n(x)} day${x === 1 ? '' : 's'}`;
const feats = (x) => `${x} feature${x === 1 ? '' : 's'}`;
const weeks = (x) => `${n(x)} week${x === 1 ? '' : 's'}`;

function head(r) {
  const t = r.team;
  return `MVP scope: ${feats(r.totals.features)}, ${days(r.totals.days)} of work. `
    + `Team: ${n(t.people)} ${t.people === 1 ? 'person' : 'people'} x ${n(t.daysPerWeek)} days a week = ${days(t.weekly)} a week.`;
}

function firstLine(r) {
  const f = r.first;
  if (!f.chosen) return 'First release: not chosen. No feature is marked core, so nothing says what the first release must prove.';
  const verdict = f.fits ? 'fits' : `does NOT fit, ${days(f.overBy)} over`;
  return `First release: ${feats(f.items.length)}, ${days(f.days)}, about ${weeks(f.weeks)} (limit ${weeks(r.team.firstWeeks)}, ${days(f.limitDays)}): ${verdict}`;
}

function notes(r) {
  const out = [];
  if (r.first.chosen && !r.first.fits) out.push(`The first release is over its limit. Cut a core feature, move work out of it, or change the limit on purpose.`);
  if (r.oversize.length) out.push(`Longer than one release (${days(r.team.releaseDays)}), split them: ${r.oversize.join(', ')}`);
  if (r.assumedValue.length) out.push(`Value 3 assumed for ${r.assumedValue.length} feature(s) without one: ${r.assumedValue.join(', ')}`);
  return out;
}

export function toText(r) {
  const lines = [head(r), '', firstLine(r)];
  const w = Math.max(4, ...[...r.first.items, ...r.releases.flatMap((x) => x.items)].map((f) => f.id.length));
  const row = (f) => `  ${f.id.padEnd(w)}  ${days(f.days).padStart(9)}  ${f.name}  (${f.reason})`;
  for (const f of r.first.items) lines.push(row(f));
  lines.push('', `Later releases, ${weeks(r.team.releaseWeeks)} each (${days(r.team.releaseDays)}): ${r.releases.length}`);
  for (const rel of r.releases) {
    lines.push(`Release ${rel.number}: ${feats(rel.items.length)}, ${days(rel.days)}`);
    for (const f of rel.items) lines.push(row(f));
  }
  const nn = notes(r);
  if (nn.length) lines.push('', ...nn);
  return lines.join('\n');
}

const md = (s) => String(s).replace(/[|\\`*_[\]<>]/g, (c) => `\\${c}`);

export function toMarkdown(r) {
  const lines = [`# MVP scope`, '', head(r), '', `## ${md(firstLine(r))}`, ''];
  const table = (items) => {
    const t = ['| Feature | Name | Days | Why here |', '|---|---|---|---|'];
    for (const f of items) t.push(`| ${md(f.id)} | ${md(f.name)} | ${n(f.days)} | ${md(f.reason)} |`);
    return t;
  };
  if (r.first.items.length) lines.push(...table(r.first.items), '');
  for (const rel of r.releases) lines.push(`## Release ${rel.number}: ${feats(rel.items.length)}, ${days(rel.days)}`, '', ...table(rel.items), '');
  const nn = notes(r);
  if (nn.length) lines.push('## Notes', '', ...nn.map((x) => `- ${md(x)}`), '');
  return lines.join('\n').trimEnd();
}

export function toJson(r) {
  const item = (f) => ({ id: f.id, name: f.name, days: f.days, dependsOn: f.dependsOn, core: f.core, value: f.value, valueAssumed: f.valueAssumed, reason: f.reason });
  return JSON.stringify({
    team: r.team,
    totals: r.totals,
    firstRelease: { ...r.first, items: r.first.items.map(item) },
    releases: r.releases.map((x) => ({ ...x, items: x.items.map(item) })),
    oversize: r.oversize,
    assumedValue: r.assumedValue,
    notes: notes(r)
  }, null, 2);
}

const cell = (v) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// One line per feature, in build order, ready for a spreadsheet or a ticket import.
export function toCsv(r) {
  const out = ['release,id,name,days,reason,note'];
  const note = (f) => (r.oversize.includes(f.id) ? 'split: longer than one release' : r.assumedValue.includes(f.id) ? 'value assumed' : '');
  for (const f of r.first.items) out.push([1, f.id, f.name, n(f.days), f.reason, r.first.fits ? note(f) : 'first release over its limit'].map(cell).join(','));
  for (const rel of r.releases) for (const f of rel.items) out.push([rel.number, f.id, f.name, n(f.days), f.reason, note(f)].map(cell).join(','));
  return out.join('\n');
}
