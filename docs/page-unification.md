# Holiday pages: one component per kind, one config per page

Adding a holiday, or a section to one, means writing a few lines of configuration, not copying a 400-line page.

## What exists

The pages under a holiday (`/easter/tasks`, `/birthday/gift-list`, ...) are short wrappers: each renders one shared component with a config.

| Kind                                                     | Component (`src/components/templates/`) | Configs (`src/config/`)                                                                            | Pages |
| -------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- | ----- |
| Gift lists, shopping and basket lists, supplies lists    | `GiftListPage`                          | `giftListConfigs.ts`                                                                               | 15    |
| Cards                                                    | `CardsPage`                             | `cardPageConfigs.ts`                                                                               | 6     |
| Guest lists                                              | `GuestListPage`                         | `guestListConfigs.ts`                                                                              | 5     |
| Tasks, events, decorations, and checklist-style one-offs | `TasksPage`                             | `taskPageConfigs.ts`, `eventPageConfigs.ts`, `decorationPageConfigs.ts`, `checklistPageConfigs.ts` | 36    |
| Holiday landing pages (`/easter`, `/christmas`, ...)     | `HolidayPageTemplate`                   | (props in each landing page)                                                                       | 15    |

Events, decorations, reservations, resolutions, costume ideas and the like are tasks stored with a different `category`, so they share `TasksPage`. A config picks the category (`taskCategory`), the wording (`variant` or `labels`), colours, and optional extras (`starter` list, `footer`, `summary`). Gift, card and guest pages share the holiday-sharing logic in the `useSharedHoliday` hook: on a holiday shared with the user, the share carries the owner's holiday id, and the current user is always assignable.

## Adding to it

- **A new holiday with the usual sections:** add a config entry per section in the matching `*Configs.ts` file (copy the closest holiday) and a 5-line wrapper `page.tsx` that renders the shared component with it.
- **A new kind of checklist** (for example a different category): add an entry to `checklistPageConfigs.ts` with `taskCategory` and `labels`.
- **Behaviour that only one page needs:** prefer a config option on the shared component if a second page could use it. Only write a bespoke page when the behaviour is really its own.

## What stayed its own page

Party planning (Birthday), meal planning (Thanksgiving), daily principles (Kwanzaa), candle lighting (Hanukkah) and Valentine's date ideas (its own card, a custom summary of total / completed / high-priority / due-soon, and a completed section that only appears when something is completed). Each has behaviour no other page has, and forcing them in would have made the shared pages harder to read. Several of them also carry a starter list of default items.

## How it was kept safe

Every kind was added with a browser test first (add an item, reload, it is still there; tick it off, reload, it is still done), on several holidays. `pages.smoke.test.tsx` and `pages.populated.test.tsx` render every page throughout, and each shared component has its own unit tests.

## Differences that were settled (the most common behaviour won)

- **Sorting:** priority, due date, title, and assignee on shared holidays (category only on Christmas, the one tasks page that shows every category). Cards sort by recipient, guest lists by name, RSVP or email, and gift lists by recipient, store or price.
- **Completing a task, event, decoration or similar** always uses the completion toggle, so whoever assigned it is notified. Nine task pages used a plain update that sent no notice.
- **Assigning** works on any shared holiday. Sharing itself needs Plus, enforced by the API.
- **Add and edit** show success and error toasts everywhere.
- **Bugs found and fixed on the way:** guest forms ignored the RSVP chosen when adding on three holidays; Graduation's edit form lost the guest's current RSVP; the trick-or-treat starter list added tasks the page never showed; the sort menu did nothing on five cards pages.

## Still open

- **Starter lists.** A few pages offer a built-in list on an empty page (Kwanzaa and New Year decorations, trick-or-treat prep, reservations, and the bespoke pages). They started as an experiment for holidays with standard traditions (Kwanzaa, Hanukkah), where set items could be pre-populated instead of hand-written; some are just ideas rather than real traditions. They are unchanged and worth reviewing list by list.
- **A free user's plan after a server-side change.** `loadHome` ignores a server-side plan change for 30 seconds after a free user's last load (it treats a recent `free` as a just-made downgrade). It is recorded as a known-issue test in `src/__tests__/store/loadHome.test.ts`.
- **Restyling.** The pages were unified without changing how they look; the shared components are the place to do a restyle once, for every holiday.
