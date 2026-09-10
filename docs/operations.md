# Operations runbook

For the support owner and incoming developer. Contacts and account ownership belong in the
[handoff checklist](handoff.md). Partner-facing troubleshooting is in the [partner guide](partner-guide.md).

## When a class is blocked

1. Record the time, page/game, device/browser, affected group, and visible error. Keep learner names,
   answers, and credentials out of tickets and shared screenshots.
2. Check the current production deployment in Vercel, then database connectivity in Atlas. If
   sign-in fails, check the Clerk application. The public health probe is currently blocked; see below.
3. If a recent release broke the lesson, have the hosting owner roll back to a known working
   deployment. Tell the educator whether to retry or pause, through the agreed support channel.
4. After recovery, verify a real learner can save progress and complete a quiz. Record the cause,
   affected release, recovery action, and any missing data for follow-up.

## Services and health

| Service                | Responsibility                                                            |
| ---------------------- | ------------------------------------------------------------------------- |
| Vercel                 | Website, API, static Unity builds; production currently follows `develop` |
| MongoDB Atlas          | Classroom rosters, game saves, quiz results, registered-user records      |
| Clerk                  | Registered-user identity and role claims                                  |
| GitHub Actions / Unity | Build games from their source repositories and open website promotion PRs |

**Known monitoring blocker, verified 5 September 2026:** an unauthenticated request to
`/api/health` on the live site returns `401`. The handler is designed to report deployment health,
but [`src/proxy.ts`](../src/proxy.ts) requires sign-in before the request reaches it. Resolve that
restriction and verify the complete request path before configuring a public health monitor.

```sh
curl -i --max-time 20 https://kids-first-initiative-site.vercel.app/api/health
```

When the handler is reachable, its response is `200` for healthy checks and `503` for failed checks:

| Field             | Meaning and limit                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `release`         | Website commit, or `null` if deployment metadata is unavailable                                                                   |
| `checks.database` | Connection state; this does not test successful reads/writes or restore capability                                                |
| `checks.games[]`  | Presence of `index.html`, `_source_sha.txt`, and `_build_id.txt`, plus source/build identifiers; this does not load the real game |

Use Vercel's deployment commit and the game markers under `/game/<Game>/` to identify a release
while public health is blocked. `node scripts/validate-webgl-build.mjs` performs more complete
artifact checks locally/CI; actual gameplay still needs a browser and device.

## Logging and alerts

[`reportError`](../src/lib/server/observability.ts) emits JSON containing `scope`, `event`,
`correlationId`, environment, release, message, and optional stack. Search Vercel logs by those
fields where the call site uses them. A correlation ID identifies a report; it is not automatically
propagated through every request. Other code still uses ordinary console messages.

The context filter drops objects/arrays but accepts strings. **It does not redact names, answers,
secrets, error messages, or stacks.** Callers must supply non-identifying context and review the
error itself. Do not add raw request bodies or learner details to logs.

The browser's game-save and quiz-save failures largely use console logging; a server log monitor
will not see all of them. `setErrorSink` connects reports from this server module to an optional
tracker, not every browser error. Confirm coverage and data capture before selecting a vendor.

Suggested initial alerts, to tune after observing traffic:

| Signal                          | Starting threshold                                   | First action                                                      |
| ------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| Public health, once unblocked   | Two consecutive failures, checked every five minutes | Inspect Vercel and Atlas                                          |
| Database errors                 | Any in five minutes                                  | Check database access, availability, and connection limits        |
| Production deployment fails     | Each failed production build                         | Inspect the build log; verify the prior deployment still serves   |
| Game boot / save / quiz failure | Configure after these browser events are collected   | Determine scope; protect unsaved work and inspect game/API errors |

Give every alert a named responder and backup in [handoff.md](handoff.md). Send a test alert and
record delivery; an intended threshold is not evidence that monitoring exists.

## Roll back

1. Open Vercel's production deployment history and select a known working deployment. Use
   **Instant Rollback** where available; confirm the target commit before proceeding.
2. Verify the production URL, actual game loading, and a synthetic learner's quiz/save flow.
3. Create a revert PR against `develop` so the bad change does not return with the next release.
   Revert a normal/squash commit with `git revert <sha>`; use `git revert -m 1 <sha>` only for a merge
   commit after confirming its first parent. A game artifact promotion is reverted the same way.
4. After the corrected deployment passes verification, restore normal production promotion.
   If `main` has become production, the revert on `develop` must also be promoted.

A rollback changes deployed code, not MongoDB data or configuration. Vercel may disable automatic
production assignment after a rollback; check before assuming a subsequent merge goes live.
See [Vercel's rollback procedure](https://vercel.com/docs/instant-rollback) and the
[release guide](releases.md).

## Backup and recovery

The repository is not a backup of learner records. An Atlas owner must verify the production
cluster's backup features and fill in this record:

| Recovery setting                       | Confirmed value                |
| -------------------------------------- | ------------------------------ |
| Backup enabled / retention             | **Unverified** / \_\_\_ days   |
| Point-in-time recovery                 | **Unverified**                 |
| Acceptable data loss / time to restore | **_ / _**, agreed with partner |
| Authorized restore operator / backup   | **_ / _**                      |
| Last successful drill / evidence       | **_ / _**                      |

For a restore drill:

1. Restore a chosen backup into an isolated temporary cluster; never overwrite production for a drill.
2. Give only the drill operator access. Use a local/private environment pointed at that cluster
   and verify class history, rosters, quizzes, and saved progress against the expected snapshot.
   Use an approved test account; do not expose restored learner records in a public preview.
3. Record the snapshot time, elapsed recovery time, checks, and any missing records. Compare these
   with the agreed recovery targets.
4. Remove the temporary environment and cluster after recording evidence; revoke temporary access.

A real production restore requires coordination with the partner: stop conflicting writes and
identify which records would be lost since the restore point before replacing production data.

## Routine ownership

Before a teaching session, verify the intended release and test both games. Regularly review failed
deployments, browser reports, dependency alerts, backups, and service billing. Review access at each
team transition. Track incidents and follow-up work in the repository that owns the failure.
