# Points and leaderboard

Completing a task, gift or card earns points. Each holiday has a leaderboard of the people who share it.

## Rules

All of them live in `src/lib/points.ts` (pure functions, unit-tested).

| Completed          | Points                                                    |
| ------------------ | --------------------------------------------------------- |
| Task, low priority | 5                                                         |
| Task, medium       | 10                                                        |
| Task, high         | 20                                                        |
| Gift               | 10                                                        |
| Card               | 5                                                         |
| Early bonus        | +5 on a task finished on an earlier day than its due date |

- **Who earns them:** the person who completed the item, not the assignee.
- **One award per item.** The ledger has a unique key on `(entityType, entityId)`. Un-completing an item deletes its award, so ticking and unticking cannot farm points. Re-completing awards again (to whoever does it).
- **Daily cap:** 200 points per user per UTC day. An award that crosses the cap is trimmed; after it, nothing is awarded.
- **Levels:** level `n` starts at `50 * (n - 1)^2` points (level 2 at 50, level 3 at 200, level 4 at 450).
- **Streak:** consecutive UTC days with at least one award. Still alive if the last award was yesterday.
- **Team goal:** completed items over all items in the holiday. Shown as progress, no points attached.
- **Ranking:** equal points share a rank and the next rank is skipped (1, 1, 3).

Level, streak, rank and team goal are worked out from the ledger when asked for. Only `point_events` is stored.

## Where it runs

- `syncCompletionPoints` (`src/lib/server/points.ts`) is called after every write that can change `isCompleted`: task PUT, PATCH and PATCH-by-id, gift PUT and PATCH-by-id, and both card PUT formats. It compares before and after, never throws, and logs a warning if it fails, so a points problem cannot fail a completion. `completion-points.test.ts` checks every one of those routes calls it.
- `GET /api/holidays/[id]/leaderboard[?year=2026]` returns the ranking, the caller's level and the team goal. It uses `assertHolidayAccess`, so only people with access to the holiday can read it, and it lists only that holiday's account members, share owner and share members.
- `Leaderboard` (`src/components/common/Leaderboard.tsx`) is shown on the holiday landing page. With nobody else on the holiday it shows just your level, progress and streak.

## Privacy

`user_preferences.show_on_leaderboard` (default on, toggle in Settings) hides a person from other people's boards. They still earn points and see their own row. Only the name and picture are exposed, never the email.

## Not built yet

- **Badges.** The `user_achievements` table exists (`userId`, `key`, `scope`, `earnedAt`, unique per user, key and scope). Nothing awards or shows them. Definitions are meant to live in a config file, like the page configs.
- **Quests, kudos, unlockable themes.** Each needs its own tables.
- Points on items that are created already completed are not awarded.
- Deleting a single completed item keeps its points. Clearing a holiday's data clears its points too.

## Applying the schema change

The live database is kept in sync with `npx prisma db push` (the migration history is incomplete, see the README). The change is additive: two new tables and one new column with a default.
