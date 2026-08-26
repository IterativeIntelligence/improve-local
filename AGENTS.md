# Working in improve-local

You are working on a user's personal Improve data. The data lives in
`data/`, which is the user's OWN git repository — its upstream is their
Improve server, and pushes go live on their Improve site immediately.

## Ground rules

- `data/` belongs to the user. Never rewrite its history, never force-push,
  never delete `history.json` or `trials.json`. Additive changes only
  unless the user explicitly asks otherwise.
- Pull before you work (`git -C data pull`); commit with clear messages and
  push when the user wants changes synced.
- Free-form analysis, reports, and scratch work belong in new files or a
  `notes/` directory inside `data/` — the server ignores everything except
  the files below, so extra files are safe.
- `data/coach-notes.md` is the one file the user's Improve coach reads:
  append at the end, keep entries short and factual (the coach reads about
  the last 1,000 characters). Write there only what the user would want
  their coach to know.

## Data schema

### `data/history.json` — intake sessions, newest last

```jsonc
[
  {
    "at": "2026-08-26T17:00:00.000Z",   // when the session happened
    "goal": "I want to sleep better",
    "answers": [{ "q": "question asked", "a": "user's answer" }],
    "recommended": ["card titles that were proposed"],
    "decisions": { "card title": "accepted" | "already_does" },
    "discussion": [{ "text": "things the user said about the cards" }]
  }
]
```

### `data/trials.json` — trials and habits, newest last

```jsonc
[
  {
    "id": "t_…",
    "startedAt": "ISO timestamp",
    "goal": "the goal this trial serves",
    "title": "imperative card title",
    "how": "the exact protocol",
    "expect": "predicted outcome",
    "trial": "trial plan sentence (length + success signal)",
    "days": 5,                    // planned length
    "risk": "likeliest derailer (premortem)",
    "fallback": "minimum version for a hard day",
    "checkIns": [
      {
        "at": "ISO timestamp",
        "label": "Yes | Partly | Not today | Every day | Most days | …",
        "days": 2,                // how many days this one tap covers
        "note": "what got in the way (optional)"
      }
    ],
    "review": [{ "from": "user" | "coach", "text": "wrap-up turns" }],
    "status": "active" | "done" | "habit",   // habit = kept, in maintenance
    "verdict": {
      "at": "ISO timestamp",
      "outcome": "keep | reduce | repair | abandon | extend | replaced",
      "summary": "what happened vs. prediction, and the decision"
    },
    "supersedes": "id of the trial this one replaced (optional)"
  }
]
```

Useful derived facts: adherence comes from `checkIns` (labels weighted by
`days`); `status: "habit"` means the user kept it and it is current
practice; chains of `supersedes` show how a protocol evolved.

## Tools

- `node tools/summary.mjs [data-dir]` — current state: live trials, kept
  habits, past verdicts.
- `node tools/timeline.mjs [data-dir]` — every event in chronological
  order.

Both print plain text and take the data directory as an optional argument
(default `./data`, or `$IMPROVE_DATA`).
