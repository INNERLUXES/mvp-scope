// The feature list, checked row by row. A bad row stops the run with its line number: a plan that silently
// drops a feature, or reads "5 days" as zero, is a plan nobody should sign a budget on.

function csvRows(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const s = String(text).replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

// CSV with a header line -> list of objects keyed by the lower-cased header names.
export function parseCsv(text, required, name) {
  const rows = csvRows(text);
  if (!rows.length) throw new Error(`${name}: the file is empty`);
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const missing = required.filter((r) => !head.includes(r));
  if (missing.length) throw new Error(`${name}: missing column(s) ${missing.join(', ')}`);
  return rows.slice(1).map((r, i) => {
    if (r.length !== head.length) throw new Error(`${name} line ${i + 2}: expected ${head.length} values, found ${r.length}`);
    return Object.fromEntries(head.map((h, k) => [h, r[k].trim()]));
  });
}

const YES = new Set(['yes', 'y', 'true', '1', 'core']);
const NO = new Set(['', 'no', 'n', 'false', '0']);

// features.csv: id,name,days[,depends_on][,core][,value]
//   days        your estimate in working days, more than 0
//   depends_on  ids separated by ; (a feature that must exist first)
//   core        yes when the first release cannot prove the idea without it
//   value       1 to 5, how much users gain from it; empty means 3 and is reported as assumed
export function parseFeatures(text) {
  const rows = parseCsv(text, ['id', 'name', 'days'], 'features');
  if (!rows.length) throw new Error('features: the file has a header but no features');
  const errors = [];
  const seen = new Set();
  const features = rows.map((r, i) => {
    const line = `features line ${i + 2}`;
    const id = r.id;
    if (!id) errors.push(`${line}: id is empty`);
    else if (/[;\s]/.test(id)) errors.push(`${line}: id "${id}" contains a space or a ;`);
    else if (seen.has(id)) errors.push(`${line}: id ${id} is used twice`);
    seen.add(id);
    if (!r.name) errors.push(`${line}: name is empty`);
    const days = Number(r.days);
    if (r.days === '' || !Number.isFinite(days) || days <= 0 || days > 1000) errors.push(`${line}: days must be a number above 0 and at most 1000, not "${r.days}"`);
    const coreText = (r.core ?? '').toLowerCase();
    if (!YES.has(coreText) && !NO.has(coreText)) errors.push(`${line}: core must be yes or no, not "${r.core}"`);
    let value = 3, assumed = true;
    if (r.value !== undefined && r.value !== '') {
      value = Number(r.value);
      assumed = false;
      if (!Number.isInteger(value) || value < 1 || value > 5) errors.push(`${line}: value must be a whole number from 1 to 5, not "${r.value}"`);
    }
    const dependsOn = (r.depends_on ?? '').split(';').map((d) => d.trim()).filter(Boolean);
    return { id, name: r.name, days, dependsOn, core: YES.has(coreText), value, valueAssumed: assumed, line: i + 2 };
  });
  for (const f of features) {
    for (const d of f.dependsOn) {
      if (!seen.has(d)) errors.push(`features line ${f.line}: ${f.id} depends on ${d}, which is not in the list`);
    }
  }
  if (errors.length) throw new Error(`invalid feature list:\n  ${errors.join('\n  ')}`);
  return features;
}

// The team and the release lengths the plan is cut to.
export function parseTeam({ people = 1, daysPerWeek = 5, firstWeeks = 6, releaseWeeks = 2 } = {}) {
  const errors = [];
  const n = (v, name, min, max) => {
    const x = Number(v);
    if (!Number.isFinite(x) || x < min || x > max) errors.push(`${name} must be a number from ${min} to ${max}, not "${v}"`);
    return x;
  };
  const team = {
    people: n(people, 'people', 0.5, 100),
    daysPerWeek: n(daysPerWeek, 'days per week', 0.5, 7),
    firstWeeks: n(firstWeeks, 'first release weeks', 0.5, 52),
    releaseWeeks: n(releaseWeeks, 'release weeks', 0.5, 12)
  };
  if (errors.length) throw new Error(errors.join('\n'));
  return team;
}
