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
- `Leaderboard` (`src/components/common/Leaderboard.tsx`) is the first card on the holiday landing page. It only appears on a holiday that is shared, meaning the share has at least one member besides the owner (`shared` in the API response). It can be collapsed to a one-line summary, and the choice is remembered in the persisted `leaderboardUi` slice. If everyone else on the share has opted out, you see just your own level, progress and streak.
- `GET /api/users/me/progress` returns the caller's own account-wide level, streak, holidays completed and global badges. The "Your progress" card on Settings (`ProgressCard`) shows it, so badges are visible even when no holiday is shared.

## Privacy

`user_preferences.show_on_leaderboard` (default on, toggle in Settings) hides a person from other people's boards. They still earn points and see their own row. Only the name and picture are exposed, never the email.

## Badges

Definitions are in `src/config/badgeConfigs.ts`: a key, name, description, a stat and a target. Add a badge by adding an entry (and a glyph in `BadgeIcon.tsx`).

| Badge        | Earned by                                                           |
| ------------ | ------------------------------------------------------------------- |
| First Step   | Completing your first item                                          |
| Task Tackler | 10 tasks                                                            |
| Gift Guru    | 10 gifts                                                            |
| Pen Pal      | 10 cards                                                            |
| Early Bird   | 5 tasks finished before their due date                              |
| On a Roll    | 3-day streak                                                        |
| Week Warrior | 7-day streak                                                        |
| Rising Star  | Level 5                                                             |
| Holiday Hero | Everything on a holiday done (at least 3 items); earned per holiday |

- Stats come from the user's whole ledger (`badgeStats` in `src/lib/badges.ts`). Holiday Hero is the only per-holiday badge; the rest are earned once per person.
- Badges are checked after every award (`awardBadges`, in the same file as the sync) and written to `user_achievements`, with `scope` set to `global` or the holiday id. A badge stays earned even if the items behind it are later un-completed or deleted. A badge failure is logged and never affects the points or the completion.
- The leaderboard response includes the viewer's badges with progress (`3/10`). A badge earned in the last 48 hours is marked New. Badges are drawn as SVG icons and, like the leaderboard, only show on shared holidays.
- Other people's badges are not shown.

## Not built yet

- A notice at the moment a badge is earned (today it shows up, marked New, the next time the card loads).
- Other people's badges on the leaderboard.
- **Quests, kudos, unlockable themes.** Each needs its own tables.
- Points on items that are created already completed are not awarded.
- Deleting a single completed item keeps its points. Clearing a holiday's data clears its points too.

## Applying the schema change

The live database is kept in sync with `npx prisma db push` (the migration history is incomplete, see the README). The change is additive: two new tables and one new column with a default.
