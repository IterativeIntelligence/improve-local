#!/usr/bin/env node
// Everything that ever happened in an Improve data repo, in chronological
// order: sessions, trial starts, check-ins (with notes), and verdicts.
//
//   node tools/timeline.mjs [data-dir]    (default ./data or $IMPROVE_DATA)

import { readData, day } from "./lib.mjs";

const { history, trials } = readData(process.argv[2]);

const events = [];
for (const e of history) {
  const n = (e.answers ?? []).length;
  events.push({
    at: e.at,
    text: `session: "${e.goal}" (${n} answer${n === 1 ? "" : "s"}; recommended: ${(e.recommended ?? []).join(", ") || "—"})`,
  });
}
for (const t of trials) {
  events.push({ at: t.startedAt, text: `trial started: ${t.title} — ${t.how}` });
  for (const c of t.checkIns ?? []) {
    events.push({
      at: c.at,
      text: `check-in [${t.title}]: ${c.label} (covers ${c.days}d)${c.note ? ` — ${c.note}` : ""}`,
    });
  }
  if (t.verdict) {
    events.push({
      at: t.verdict.at,
      text: `verdict [${t.title}]: ${t.verdict.outcome} — ${t.verdict.summary}`,
    });
  }
}

events.sort((a, b) => String(a.at).localeCompare(String(b.at)));
for (const e of events) console.log(`${day(e.at)}  ${e.text}`);
