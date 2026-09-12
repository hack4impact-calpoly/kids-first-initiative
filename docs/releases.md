# Releases

For the person deploying the website or a game. See [operations.md](operations.md) for rollback.

## Current production path

Checked 5 September 2026: `develop` is the repository default branch, `main` does not exist remotely,
and the latest GitHub production deployment is website commit `3258a3f`. The existing handoff
records Vercel production as following `develop`; the hosting owner must confirm that dashboard setting.
Treat a merge to `develop` as a production release until the branch switch is verified.

1. Open a PR against `develop`; include behavior changed and verification evidence.
2. Require passing checks and review. Coordinate changes affecting lessons with the partner.
3. Merge, then verify Vercel deployed the expected commit and both game/quiz loops still work.
   Public `/api/health` currently returns `401`; use deployment details and the
   [runbook](operations.md) until that is resolved.

## Release a Unity game

Editing Unity source does not change the live website. Compiled WebGL files are committed under
`public/game/StatesOfMatter/` and `public/game/PenguinRun/` in this repository.

1. Verify the source revision in the owning Unity repository, including real gameplay.
2. In the **website repository**, run **Actions → build-unity-webgl** from `develop`.
3. Select `penguin-run` or `states-of-matter`, enter the source branch/tag/commit, and leave
   `promote` enabled.
4. Review the resulting PR: correct source SHA and game, only that game's directory changed,
   successful artifact validation and site build in the promotion job.
5. Approve queued PR workflows if GitHub requests it, inspect their results, and test the real
   game build on the intended devices. Merge into `develop` when the release is ready.
6. Verify the deployed markers `/game/<Game>/_source_sha.txt` and `_build_id.txt`, then play the
   game through to its post-quiz. A successful build does not prove it renders or plays correctly.

The workflow takes its Unity version from the source project's `ProjectVersion.txt`, pulls Git LFS
assets, stamps provenance, validates build files, and runs the site build before opening a PR.
Required credentials are in the [handoff checklist](handoff.md). A failed validation opens no PR.

Promotion uses `GITHUB_TOKEN`. GitHub can create PR workflow runs that wait for a maintainer's
approval; do not assume the checks ran automatically. The promotion job's own validation/build
provides evidence even before approval. See [GitHub's workflow-trigger rules](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
The browser suite stubs Unity, so it does not replace a real game check.

## Proposed controlled release path

The checked-in [`promote-to-production`](../.github/workflows/promote-to-production.yml) workflow
is intended to fast-forward `main` to a commit already in `develop` with successful CI for that
exact commit. It has **not been accepted as an operational release path** in this handoff.

| Branch    | Intended use after activation                                           |
| --------- | ----------------------------------------------------------------------- |
| `develop` | Integration and preview deployments; PRs continue to target this branch |
| `main`    | Production; advanced only by the verified promotion mechanism           |

The repository and hosting owners must complete these steps together:

- [ ] Confirm the workflow token can read Actions runs. It currently declares `contents: write`
      only, while its CI lookup needs Actions read access; verify/correct permissions before activation.
- [ ] Configure branch protection/rulesets with actual CI check names and a promotion identity that
      is allowed to update `main`. Do not disable protection just to get a promotion through.
- [ ] Choose a reviewed `develop` commit with passing CI and create `main` at that commit.
- [ ] Change Vercel's Production Branch to `main`; confirm preview and production environments use
      the intended service credentials. Keeping the default GitHub branch as `develop` is fine.
- [ ] Run a promotion and confirm a Vercel production deployment actually follows. A pushed Git ref
      is not sufficient evidence of a deployment; token-triggered GitHub push workflows do not rerun CI.
- [ ] Rehearse rollback and the next corrected release, then update this page and [handoff.md](handoff.md).

Once verified, release through **Actions → promote-to-production**, selecting the reviewed commit.
A failed gate means no release: inspect CI, ancestry, and permissions. Never force-push `main` to
bypass a gate. A revert merged into `develop` must also be promoted to affect production.
