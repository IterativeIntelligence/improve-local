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
    "decisions": { "card title": "accepted" | "already_does" | "too_annoying" | "skipped" },
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
    // Optional: Apple Health metric that measures this trial's outcome
    // passively on the user's iPhone. One of: sleep, steps, exercise,
    // resting_heart_rate, hrv, weight, mindfulness. Health SAMPLES never
    // appear in this repo — only on-device summaries the user was shown.
    "metric": "sleep",
    // Optional: the check-in reminder offer (strictly opt-in). "reminders"
    // is the user's recorded answer — absent means never answered, and no
    // client schedules anything then. remindAt/remindText are the coach's
    // proposed nudge plan (time may be user-adjusted; kept even on "no").
    "reminders": "yes" | "no",
    "remindAt": "17:00",          // 24-hour HH:MM
    "remindText": "one-line nudge text",
    // Optional: where an opted-in nudge lands — the iPhone app's local
    // notifications (default) or iMessage. remindPhone is the number the
    // user gave for texting (present only for the imessage channel).
    "remindChannel": "app" | "imessage",
    "remindPhone": "+15550100100",
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

### `data/app.json` — iPhone-app marker (optional, server-written)

`{"firstSeenAt": "ISO timestamp"}`, written by the server on the
account's first request from the native iPhone app. Its presence is how
the web app knows app-channel nudges can actually fire; don't create or
edit it by hand.

### `data/library/` — your personal study library (optional)

Papers you (or your agents) have ingested for yourself, in the StudyFlow
DSL — the same facts-only language the shared Improve library uses (spec:
the `library/SPEC.md` + `INGEST.md` published from the Improve app repo;
any study record you hold a link to is also fetchable as plain text at
`https://meetimprove.com/api/study/<id>/raw`).

- `library/<id>.study` — the extracted facts (id: `[a-z0-9-]+`, e.g.
  `firstauthor-year-topic`). Push it and the Improve site lists it under
  "Your library" and renders it at `/study/<id>`.
- `library/<id>.pdf` — the source PDF, same basename. Stays private to
  you; the site serves it back only to you, and the study title on the
  viewer page opens it.

Ingest with your own agent: read the paper's PDF natively, write the
`.study` file per the StudyFlow spec, put both files here, push.

## Tools

- `node tools/summary.mjs [data-dir]` — current state: live trials, kept
  habits, past verdicts.
- `node tools/timeline.mjs [data-dir]` — every event in chronological
  order.

Both print plain text and take the data directory as an optional argument
(default `./data`, or `$IMPROVE_DATA`).
