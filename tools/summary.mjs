#!/usr/bin/env node
// Current state of an Improve data repo: goals, live trials, kept habits,
// and past verdicts. Zero dependencies; Node 18+.
//
//   node tools/summary.mjs [data-dir]     (default ./data or $IMPROVE_DATA)

import { readData, day, dayDiff, tally } from "./lib.mjs";

const { history, trials, dir } = readData(process.argv[2]);

console.log(`Improve data in ${dir}\n`);

const active = trials.filter((t) => t.status === "active");
if (active.length) {
  console.log("LIVE TRIALS");
  for (const t of active) {
    const onDay = Math.min(dayDiff(t.startedAt) + 1, t.days);
    console.log(`  ${t.title}  (day ${onDay} of ${t.days} — ${t.goal})`);
    console.log(`    protocol: ${t.how}`);
    console.log(`    predicted: ${t.expect}`);
    const marks = tally(t.checkIns);
    if (marks) console.log(`    check-ins: ${marks}`);
    for (const c of t.checkIns) {
      if (c.note) console.log(`    got in the way (${day(c.at)}): ${c.note}`);
    }
  }
  console.log();
}

const habits = trials.filter((t) => t.status === "habit");
if (habits.length) {
  console.log("KEPT HABITS");
  for (const t of habits) {
    const kept = t.verdict ? ` since ${day(t.verdict.at)}` : "";
    console.log(`  ${t.title}${kept}  (${t.goal})`);
    const marks = tally(t.checkIns);
    if (marks) console.log(`    spot-checks: ${marks}`);
  }
  console.log();
}

const done = trials.filter((t) => t.status === "done" && t.verdict);
if (done.length) {
  console.log("PAST TRIALS");
  for (const t of done) {
    console.log(
      `  ${day(t.startedAt)}  ${t.title} -> ${t.verdict.outcome}: ${t.verdict.summary}`
    );
  }
  console.log();
}

if (history.length) {
  console.log("SESSIONS");
  for (const e of history) {
    const decided = Object.entries(e.decisions ?? {})
      .map(([title, d]) => `${d === "accepted" ? "accepted" : "already does"} "${title}"`)
      .join("; ");
    console.log(`  ${day(e.at)}  ${e.goal}${decided ? ` — ${decided}` : ""}`);
  }
}
