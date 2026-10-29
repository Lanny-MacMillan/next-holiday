# Unifying the holiday pages: what exists and what to decide

Status: proposal, no code changed. The aim is that adding a holiday, or a section to one, means writing configuration, not copying a 400-line page.

## What exists today

The 15 holiday landing pages (`/easter`, `/christmas`, ...) are already data-driven through `HolidayPageTemplate`. The pages under them are not: **52 hand-written pages, about 22,000 lines**, plus 13 one-offs.

| Kind        | Pages | Lines | Where they agree and differ                                                           |
| ----------- | ----- | ----- | ------------------------------------------------------------------------------------- |
| Tasks       | 15    | 5,834 | Two sort families (below); completion toggle on 6 pages only                          |
| Gift lists  | 11    | 4,657 | Same sort options on all 11; sizes 364 to 545 lines, so features differ in other ways |
| Events      | 8     | 3,518 | Same sort family as most decorations; Hanukkah has no sort                            |
| Decorations | 7     | 3,179 | Same sort family as events                                                            |
| Cards       | 6     | 2,436 | No sorting on any                                                                     |
| Guest lists | 5     | 2,718 | Only Graduation has sorting (name, RSVP, email)                                       |

Task sort options come in two families: `priority / title / dueDate / assignedTo` (13 pages) and `priority / dateDue / assignedTo / category` (Christmas and Hanukkah tasks, and 14 of the events and decorations pages). Pages in a kind also build their share-member list and wire their modals in different ways.

One-offs (13): supplies list (New Year, 4th of July), date ideas (Anniversary, Valentine's), costume ideas and trick-or-treat prep (Halloween), games (Baby Shower), reservations (Valentine's), resolution tracker (New Year), party planning (Birthday), meal planning (Thanksgiving), daily principles (Kwanzaa), candle lighting (Hanukkah), plus the basket list (Easter) and shopping list (Thanksgiving) that are gift-list variants.

## Proposed shape

Six shared page components, one per kind (checklist for tasks, events, decorations and similar; gift list; cards; guest list), each taking a small config: title, description, back link, theme classes, which category it shows, labels, the sort options it offers. Today each page also carries its own gradient class (`birthday-gradient`, `kwanzaa-gradient`, ...), so the config carries that too.

The 52 `page.tsx` files stay, as short wrappers that pass their config. URLs, bookmarks and the smoke tests do not change, and nothing is hidden behind a dynamic route.

## Decisions needed

Each has my recommendation; where the pages disagree, the unified page has to pick one behaviour, and some holidays will visibly change.

1. **Task sorting.** One set for every task-like list. _Recommend: priority, due date, assignee, category, title._ (Adds options to some pages, removes none that anyone uses.)
2. **Completion toggle in place.** Six task pages let you tick a task off from the list; nine do not. _Recommend: everywhere._
3. **Guest-list sorting.** Only Graduation has it. _Recommend: name, RSVP, email on all five._
4. **One-off pages.** _Recommend: supplies list, date ideas, costume ideas, trick-or-treat prep, games, reservations and resolution tracker become checklist configs; basket list and shopping list become gift-list configs; party planning, meal planning, daily principles and candle lighting stay bespoke_ (they have behaviour no other page has).
5. **Routing.** Keep the 52 files as wrappers (recommended) or replace them with one dynamic route `[holiday]/[section]`? The wrappers cost 5 to 10 lines each and keep every route explicit.
6. **Christmas as the reference or a fresh start.** Christmas pages are the biggest and the most featureful. _Recommend: start from the most common behaviour across holidays, then bring in any Christmas feature you want everywhere._ Which Christmas-only features, if any, should every holiday get?
7. **Rollout order and size.** _Recommend one kind per pull request: gift lists first (most uniform), then cards, guest lists, and the checklist kinds last._ Each PR lists the visible behaviour changes for you to approve before it merges.

## How we stay safe

- Browser tests already cover: sign-in, adding a gift, access isolation, sharing, opening a page directly, accessibility. Before each kind migrates, add one browser test for it (add an item, reload, still there).
- `pages.smoke.test.tsx` and `pages.populated.test.tsx` render every page and stay green throughout.
- The size of each PR should shrink, not grow: each kind should remove most of its lines.

## Rough size

About 22,000 lines becoming roughly 3,000 to 4,000 (six shared components plus 65 small configs). Gift lists alone are about 4,600 lines going to one component and 11 configs.
