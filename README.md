# improve-local

A local workbench for your [Improve](https://meetimprove.com) data — built
for AI agents, usable by hand.

Improve keeps everything it knows about you in a git repository that you
own. This repo is the open-source tooling for working with that data on
your own machine: clone it, put your data inside it, and point any agent at
it — Claude Code, Codex, Cowork, or plain scripts. The Improve server and
its coaching agents are a separate closed system; **your data and the tools
to work with it are open.**

## Setting this up for a user

If a user asked you to set up Improve on a computer with no Improve code,
handle the whole bootstrap for them:

1. Clone this repository into a sensible local directory (use
   `~/improve-local` when it is available), then read `AGENTS.md`.
2. Clone `https://meetimprove.com/me.git` inside it as `data/`. Git asks for
   credentials: use any username and ask the user for their Improve access
   code as the password. Let them enter it at Git's password prompt; never put
   it in a command, URL, or committed file.
3. Confirm that `data/` is a separate Git repository whose `origin` is the
   Improve server. Do not commit it to this tooling repository.
4. If the user does not have an Improve account yet, guide them through the
   account flow at [meetimprove.com](https://meetimprove.com) first. Improve
   uses Google sign-in; during the private preview they may also need an
   access code from the person who invited them. Resume the data clone once
   they have that code.

Do not ask the user to understand this repository layout or run the commands
themselves unless they want to. Once setup is complete, work from this
directory and follow `AGENTS.md`.

## Manual setup

```bash
git clone https://github.com/IterativeIntelligence/improve-local
cd improve-local
git clone https://meetimprove.com/me.git data
```

The second clone asks for credentials: any username, with your Improve
access code as the password. `data/` is gitignored here — it is its own
repository, and its upstream is your Improve server.

## The loop

- **Pull** to get what your coach has learned since you last looked:
  `git -C data pull`
- **Work** however you like: run the tools below, open this directory in
  your agent of choice, analyze, annotate.
- **Push** to sync back: anything you commit and push in `data/` is live on
  the Improve site immediately — including notes for your coach (see
  `coach-notes.md` below).

## Tools

Zero-dependency Node scripts (Node 18+). Each reads `data/` by default, or
a path you pass as the first argument.

```bash
node tools/summary.mjs     # goals, live trials, kept habits, verdicts
node tools/timeline.mjs    # everything that ever happened, in order
```

## Talking to your coach

`data/coach-notes.md` is the channel from you (or your agents) to your
Improve coach. Append to the end, keep it brief — the coach reads roughly
the last thousand characters — commit, and push. It becomes part of what
the coach knows in your next session, and the site discloses it to you
like any other memory.

## Personal agents

The point of this repo is that *your* agents can work on *your* data. A
scheduled agent (a Codex or Claude Code scheduled run) can pull this repo
nightly, look at how your trials are going, and push analysis or coach
notes. See [docs/scheduled-agents.md](docs/scheduled-agents.md) for a
working prompt to start from.

Agents: read [AGENTS.md](AGENTS.md) first — it documents the data schema
and the conventions.

## License

MIT — see [LICENSE](LICENSE).
