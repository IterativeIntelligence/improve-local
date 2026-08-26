// Shared plumbing for the improve-local tools. Zero dependencies.

import { readFileSync } from "node:fs";
import path from "node:path";

export function readData(argDir) {
  const dir = path.resolve(argDir || process.env.IMPROVE_DATA || "data");
  const read = (name) => {
    try {
      const parsed = JSON.parse(readFileSync(path.join(dir, name), "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const history = read("history.json");
  const trials = read("trials.json");
  if (history.length === 0 && trials.length === 0) {
    console.error(
      `No Improve data found in ${dir}.\n` +
        `Clone yours first:  git clone https://meetimprove.com/me.git data\n` +
        `(password: your Improve access code)`
    );
    process.exit(1);
  }
  return { history, trials, dir };
}

export function day(at) {
  return String(at).slice(0, 10);
}

// Whole days elapsed since an ISO timestamp, by calendar date.
export function dayDiff(at) {
  const from = new Date(String(at).slice(0, 10) + "T12:00:00Z").getTime();
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const to = new Date(key + "T12:00:00Z").getTime();
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

// "Yes x3 · Not today x1" — check-in labels weighted by the days each tap
// covered, in first-seen order.
export function tally(checkIns = []) {
  const counts = new Map();
  for (const c of checkIns) {
    counts.set(c.label, (counts.get(c.label) ?? 0) + (c.days ?? 1));
  }
  return [...counts.entries()].map(([l, n]) => `${l} x${n}`).join(" · ");
}
