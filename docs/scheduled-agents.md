# Scheduled personal agents

The reason your data is a git repo: your own agents can work it on a
schedule. A scheduled run (Codex, Claude Code, or any agent that can run
shell commands) pulls the latest data, looks at what changed, and pushes
back anything useful — analysis for you, notes for your coach.

## Setup

Run your agent from a checkout of this repo with `data/` cloned inside it
(see the README). Give the scheduled run a prompt like the one below, and
schedule it daily or weekly with your agent's own scheduler (`claude`
scheduled tasks, Codex scheduled runs, cron — anything).

## A starting prompt

> Work in ~/improve-local. Read AGENTS.md first and follow its rules.
>
> 1. `git -C data pull` to get my latest Improve data.
> 2. Look at what changed since the last run (git log/diff on data/):
>    new check-ins, verdicts, sessions.
> 3. Update `data/notes/weekly-review.md` with a short, honest picture:
>    how each live trial is going (adherence from check-ins), anything
>    that keeps getting in the way, and one pattern worth knowing.
> 4. If — and only if — you found something my coach genuinely needs
>    (a pattern across trials, a constraint I keep hitting), append one or
>    two short bullets to `data/coach-notes.md`. Do not repeat what the
>    check-ins already say; the coach sees those.
> 5. Commit with a clear message and `git -C data push`.
>
> Be conservative: additive changes only, never rewrite history, never
> touch history.json or trials.json.

## What happens on push

Everything you push is immediately live in your Improve account. The tail
of `coach-notes.md` becomes part of what your coach knows in your next
session — and Improve shows it back to you in its "here's what I remember"
disclosure, so nothing your agent tells your coach is invisible to you.
