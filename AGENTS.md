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
    // Optional: very short LM-generated display title for the goal —
    // what the Improve goals list shows. Absent on older entries.
    "title": "Better sleep",
    "answers": [{ "q": "question asked", "a": "user's answer" }],
    "recommended": ["card titles that were proposed"],
    "decisions": { "card title": "accepted" | "already_does" | "too_annoying" | "skipped" },
    "discussion": [{ "text": "things the user said about the cards" }],
    // Optional: card revisions the coach agreed to while discussing the
    // cards — the latest agreed protocol per card title; future cards for
    // this goal are expected to respect them. Absent on older entries.
    "amendments": [{ "title": "card title", "how": "the agreed protocol" }],
    // Optional: id of the saved web conversation this session came from —
    // conversations/<convId>.json in this repo. Absent on older entries.
    "convId": "uuid"
  }
]
```

### `data/conversations/` — saved web conversations (server-written)

One `conversations/<uuid>.json` per web goal conversation:
`{ id, goal, title?, startedAt, updatedAt, snapshot }` (`title` is the
goal's short display title, when one was generated). `snapshot` is the web
client's full UI state, autosaved so the Improve home page can list every
goal conversation and reopen it — treat it as opaque client state (its
shape follows the web app's resume snapshot and can change between app
versions). The durable facts an agent should read live in `history.json`
and `trials.json`; don't edit snapshots by hand. Oldest snapshots past
100 are pruned by the server (their `history.json` entries remain).

### `data/trials.json` — trials and habits, newest last

```jsonc
[
  {
    "id": "t_…",
    "startedAt": "ISO timestamp",
    "goal": "the goal this trial serves",
    "title": "imperative card title",
    // Optional accepted-card context retained so a kept habit can reopen why
    // it fit and the linked evidence. Absent on trials accepted by older apps.
    "why": "personalized rationale for this protocol",
    "how": "the exact protocol",
    "expect": "predicted outcome",
    "evidence": "short research rationale (present only with refs)",
    "refs": ["studyflow-study-id"],
    "trial": "trial plan sentence (length + success signal)",
    "days": 5,                    // calendar-length trial window
    // Optional reporting rhythm, distinct from how often the protocol itself
    // happens. One of daily, twice_weekly, weekly; absent legacy data means
    // daily. Sparse schedules always include the final trial day.
    "checkInCadence": "daily" | "twice_weekly" | "weekly",
    // Optional behavior-opportunity scope, distinct from reporting cadence.
    // The label is the user's accepted phrase; weekdays use lowercase
    // sun/mon/tue/wed/thu/fri/sat. Only these dates inside the calendar
    // window count. Absent legacy data means every calendar day is eligible.
    "eligibility": {
      "label": "non-cafe mornings",
      "weekdays": ["sun", "mon", "wed", "fri"]
    },
    "risk": "likeliest derailer (premortem)",
    "fallback": "minimum version for a hard day",
    // Optional: Apple Health metric that measures this trial's outcome
    // passively on the user's iPhone. One of: sleep, steps, exercise,
    // resting_heart_rate, hrv, weight, mindfulness. Granted Health data also
    // syncs under data/health/ as documented below.
    "metric": "sleep",
    // Optional: the check-in reminder offer (strictly opt-in). "reminders"
    // is the user's recorded answer — absent means never answered, and no
    // client schedules anything then. remindAt/remindText are the coach's
    // proposed nudge plan (time may be user-adjusted; kept even on "no").
    // Opted-in nudges follow checkInCadence and eligibility, never calendar
    // dates outside the server-derived check-in schedule.
    "reminders": "yes" | "no",
    "remindAt": "17:00",          // 24-hour HH:MM
    "remindText": "one-line nudge text",
    // Optional: where an opted-in nudge lands — the iPhone app's local
    // notifications or Linq text (auto-selecting iMessage/RCS/SMS).
    // "imessage" may appear only on older, never-activated records.
    "remindChannel": "app" | "text" | "imessage",
    "remindPhone": "+15550100100",
    "remindTimeZone": "America/Los_Angeles", // IANA zone for server text
    // Text consent is yes above, while this state says whether delivery is
    // actually usable. Pending requires the user's inbound setup text;
    // failed/stopped states do not deliver. activationCodeHash is temporary.
    "textReminder": {
      "status": "pending" | "active" | "failed" | "stopped",
      "activationCodeHash": "sha256 hex (pending only)",
      "setupNumber": "+15550100999",
      "activatedAt": "ISO timestamp",
      "stoppedAt": "ISO timestamp",
      "lastError": "short delivery failure (optional)",
      "deliveries": [{
        "key": "stable opportunity/idempotency key",
        "scheduledFor": "local timestamp plus [IANA zone]",
        "attemptedAt": "ISO timestamp",
        "updatedAt": "ISO timestamp",
        "status": "attempting" | "accepted" | "sent" | "delivered" | "failed",
        "messageId": "Linq message id (optional)",
        "service": "iMessage" | "RCS" | "SMS",
        "errorCode": 2024
      }]
    },
    // Optional: how the outcome gets read. "manual" = the user types a
    // reading with each scheduled tap (see checkIns[].value), "health" = the
    // iPhone app's Apple Health share, "none" = judged by feel at wrap-up.
    // Absent = the question was never asked (older trials).
    "measurement": "manual" | "health" | "none",
    // Optional accepted schema for the reading collected at each scheduled
    // check-in. A boolean outcome is represented by the check-in label itself
    // and has no checkIns[].value. A numeric outcome may carry value only when
    // both its metric and unit were defined. Older schema-less trials with an
    // already-stored finite value remain legacy numeric trials.
    "outcomeMeasure":
      { "type": "boolean", "metric": "named mark before noon" }
      | { "type": "number", "metric": "morning weight", "unit": "lb" },
    // Optional outcome-display fields carried from the accepted card, so
    // clients can show the target without the card: the expected outcome
    // ("−3–5 lb"), the horizon question ("weigh-ins down?"), days until
    // the outcome is judged, which way the metric moves, the baseline
    // label, and how many taps make a fair test.
    "heroStat": "−3–5 lb",
    "outcomeQuestion": "weigh-ins down?",
    // The chart's honesty pair (SPECS.md C-25): the outcome chart's y-axis
    // label with real units, and how that quantity is measured as part of
    // the plan (the check-in tap, a scheduled reading, or Apple Health).
    "yAxis": "morning weight (lb)",
    "measure": "weigh-in with Friday's coffee",
    "horizonDays": 90,
    "trendDirection": "up" | "down",
    "curveShape": "linear" | "accelerating" | "decelerating" | "sigmoid",
    // Optional model-committed forecast checkpoints (SPECS.md C-26) in the
    // yAxis units: day 0 = baseline, last day = horizonDays; the wrap-up
    // scores typed readings against this band.
    "forecast": [{ "day": 0, "low": 142, "high": 142 }, { "day": 90, "low": 133, "high": 138 }],
    "baselineLabel": "≈142 systolic, morning avg",
    "need": 8,
    "checkIns": [
      {
        "at": "ISO timestamp",
        // "No opportunity" is the neutral value for a closed/non-work day
        // when the protocol had no valid chance to happen. It is stored as
        // context but excluded from adherence, streaks, and success claims.
        "label": "Yes | Partly | Not today | No opportunity | Every day | Most days | …",
        // Elapsed span this one tap covers, never a completion count. For an
        // eligibility-scoped trial this counts eligible opportunities, not
        // the calendar dates between them.
        "days": 2,
        // Canonical meaning of the whole span. Older rows may omit this;
        // derive it from label. Only Yes/Every day are "did". Partly,
        // Most days, A few days, and Mostly are "partial" aggregate reports
        // whose exact day-by-day completions are unknown. No opportunity is
        // "not_applicable" and stays outside adherence denominators.
        "adherence": "did" | "partial" | "missed" | "not_applicable",
        // Present on sparse-cadence and eligibility-scoped trials: the
        // scheduled trial-day report this row answers (for example 4, 7,
        // 11… for twice_weekly, or an eligible daily opportunity).
        "scheduledDay": 4,
        // note/value are absent for "No opportunity": there was no barrier
        // to explain and no protocol-linked outcome reading to attribute.
        "note": "what got in the way (optional)",
        // Present only for measurement="manual" plus numeric outcomeMeasure.
        "value": 171.4            // optional typed outcome reading (T-10/T-19)
      }
    ],
    "review": [{ "from": "user" | "coach", "text": "wrap-up turns" }],
    "status": "active" | "done" | "habit",   // habit = kept, in maintenance
    "verdict": {
      "at": "ISO timestamp",
      "outcome": "keep | reduce | repair | abandon | extend | replaced",
      "summary": "what happened vs. prediction, and the decision"
    },
    // Kept-habit maintenance (optional on legacy data). nextSpotCheckAt is
    // present while status="habit", names the exact promised check date, and
    // advances after each maintenance check-in. Explicit retirement or an
    // accepted restart changes status to "done", removes that date, and keeps
    // the original keep verdict plus all history alongside these fields.
    "nextSpotCheckAt": "YYYY-MM-DD",
    "retiredAt": "ISO timestamp",
    "retirementSummary": "why it left current practice",
    "supersedes": "id of the trial this one replaced (optional)"
  }
]
```

Useful derived facts: adherence comes from applicable `checkIns`
(`adherence` weighted by `days`, with partial spans receiving half credit);
`No opportunity` spans are neutral and stay outside the
denominator rather than counting as success or failure. For sparse
`checkInCadence`, only scheduled opportunities count toward tracking progress
and reminder/analytics denominators; calendar days between them are not misses,
and an unreported scheduled check-in is missing data rather than proof the
behavior failed. When `eligibility` is present, only matching weekdays inside
the calendar-length window count toward catch-up spans, reminders, charts,
forecasts, scoring, or review; all other dates are outside the plan, not
misses. An absent `eligibility` retains the legacy every-calendar-day scope.
`status: "habit"` means the user kept it and it is current practice; a
`status: "done"` record with `retiredAt` is a previously kept habit whose
successful verdict and history still stand. Chains of `supersedes` show how a
protocol evolved. Habit check-ins are occasional maintenance spot-checks, not
a streak.

### `data/health/` — granted Apple Health data (optional)

`health/<metric>/daily.ndjson` holds compact daily rollups reaching far back;
`health/<metric>/raw/YYYY-MM.ndjson` holds high-frequency samples for recent
weeks and explicitly kept windows. Older raw samples are pruned while daily
rollups remain. `health/requests.json` lets the user or an agent request a
specific date range and resolution for the phone to upload on its next sync.

### `data/app.json` — iPhone-app marker (optional, server-written)

`{"firstSeenAt": "ISO timestamp"}`, written by the server on the
account's first request from the native iPhone app. Its presence is how
the web app knows app-channel nudges can actually fire; don't create or
edit it by hand.

### `data/modules/` — data-source modules (optional)

One directory per connected data source (CPAP machine, Oura ring,
Withings scale, genome files, …). The code for each lives in this repo
under `modules/<name>/`; the data it collects lives in the user's repo
under `data/modules/<name>/`, in files documented by that module's
README. Shared conventions (see `modules/SPEC.md` §3): `daily.ndjson`
is one JSON line per day with a `date` field where the **last line per
date wins**; `raw/YYYY-MM.ndjson` holds prunable high-frequency
samples; `connection.json` is non-secret connection state — its
presence means the module is connected. Secrets never live in the data
repo (local connectors keep them in the gitignored `secrets/`).

Work with modules through `node tools/modules.mjs`
(`list` / `serve` / `connect` / `sync` / `import` / `validate` /
`run`). When analyzing a user's health data, check `data/modules/` (and
the legacy `data/health/`) for what's actually available before
assuming. If the user opted their full genome into the repo,
`data/modules/genomics/sources.json` points at it (`full_file`) and
`node tools/modules.mjs run genomics lookup <rsid…>` answers genotype
queries; report genotypes and sourced associations, never diagnoses.

### `data/settings.json` — your answers to Improve's own questions (optional)

```jsonc
{
  // Standing, all-or-nothing consent to share anonymized StudyFlow records
  // of your COMPLETED trials into Improve's private research corpus.
  // Absent or false: nothing is shared. Set it on the site's /data page or
  // edit + push. Turning it on exports your whole completed-trial history
  // (all-or-nothing by design, so shared evidence can't select on wins).
  "shareTrials": true,
  "shareTrialsAt": "ISO timestamp"    // when the answer last changed
}
```

### `data/studyflow-export.json` — what left this repo (server-written)

When `shareTrials` is on, the server exports one anonymized StudyFlow
record per completed trial (standardized facts only — concept-coded
exposure/outcome, window dates, measurement statistics, adherence counts,
and the verdict as a continuation outcome; never your goals, notes, or
conversations). This file maps trial id → `{ "studyId", "at" }`, and your
own byte-exact copy of each shared record lands in `library/<studyId>.study`
(so it also renders at `/study/<studyId>` for you).

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
