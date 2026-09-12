# Game Progress Bridge

The embedded Unity games report progress to the website through the WebGL
template's `window.postUnityProgress(payload)` function. The template wraps the
payload in a same-origin `unity-progress` message; Unity code should not post a
second message envelope directly.

## Numeric Level Progress

Penguin Run may continue to report numeric levels:

```json
{
  "completedLevels": [1, 2],
  "levelCompleted": 2
}
```

## Stable Stage Progress

Games with multiple activities or phases should report stable IDs:

```json
{
  "completedStageIds": ["matter-kitchen/melt-chocolate", "matter-kitchen/pour-juice"],
  "stageCompleted": {
    "activityId": "matter-kitchen",
    "stageId": "pour-juice",
    "attempts": 1,
    "completedAt": "2026-07-13T20:15:00.0000000Z"
  }
}
```

`completedLevels` and `completedStageIds` are complete save snapshots, not
incremental additions. Send `levelCompleted` or `stageCompleted` only for the
completion that triggered the message. The website unions completion snapshots
with stored progress so an older or newly initialized client cannot erase a
completion. The singular completion field is used for analytics.

Activity and stage IDs use lowercase kebab case and must not be renamed when a
Unity scene or display label changes. A stage's persisted key is
`activityId/stageId`.

The website accepts both formats so existing Penguin Run builds remain
compatible while States of Matter moves away from scene names and numeric IDs.

## Completion and persistence

The game first emits `unity-ready`; `UnityIFrame` replies with `site-context`. Progress messages
must come from the embedded frame and the same origin. Keep the message envelope in the WebGL
template so Unity does not wrap it twice.

To finish, send a full snapshot with `gameCompleted: true`. For example, Penguin Run's final
snapshot includes `completedLevels: [1, 2, 3]`. `GamePlayer` saves it before routing to the post-quiz,
deduplicates completion navigation, and offers retry/sign-in/rejoin when that save fails.
States of Matter emits the final signal from its explicit **TAKE THE QUIZ** action.

The website stores completion records, but local Unity `PlayerPrefs` are a separate persistence
layer. Do not promise offline recovery, cross-device resume, or isolation between children sharing
one browser without testing those flows. See the game repositories' current limitations.

Contract tests use `e2e/support/gameBridge.ts`, which replaces Unity with a shell. Changes to
completion IDs, context, payloads, or quiz routing need coordinated website/game review and a real
WebGL playthrough. Website save inspection alone does not prove Unity restored its runtime state.
