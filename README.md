# 🎄 next-holiday

**Plan, organize, and conquer the holidays — one checklist at a time.**
`next-holiday` is a mobile-first holiday planning app built with [Next.js](https://nextjs.org/), styled with [ShadCN UI](https://ui.shadcn.com/), and powered by AWS.

---

## ✨ Features

* 🎁 **Gift Planning** – Track gifts, budgets, and recipients
* 📝 **Task Lists** – Organize holiday chores and to-dos
* 📬 **Card Address Book** – Manage addresses for holiday cards
* 📅 **Holiday Dashboards** – Visual progress indicators per holiday
* 🌙 **Light / Dark Mode** – Powered by ShadCN UI and Tailwind CSS
* ☁️ **AWS Backed** – Uses AWS for authentication, storage, and backend logic
* 🧩 **Gamification** – Earn badges, unlock festive themes, and level up your holiday spirit through completed tasks

---

## 🧱 Tech Stack

| Layer      | Tech                                  |
| ---------- | ------------------------------------- |
| Frontend   | Next.js, React, Tailwind              |
| UI Library | ShadCN UI                             |
| State      | Zustand / React Context (TBD)         |
| Backend    | AWS Lambda, API Gateway, DynamoDB     |
| Auth       | Auth0 / Amazon Cognito (or NextAuth)  |
| Hosting    | Vercel or AWS Amplify                 |

---

## 📦 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-org/next-holiday.git
cd next-holiday
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Run the dev server

```bash
npm run dev
# or
yarn dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure (WIP)

```
/app            # Next.js App Router pages
/components     # Reusable UI components
/lib            # AWS helpers, utilities
/styles         # Global styles
/types          # Shared TypeScript types
```

---

## 🚀 Roadmap

* [ ] Holiday creation and customization
* [ ] Multi-user support (shared lists)
* [ ] Push notifications for tasks
* [ ] Offline mode
* [ ] PDF export of cards/gift list
* [ ] Gamification: clear holiday clutter, task streaks, holiday spirit meter, unlockables

---

## 👨‍👩‍👧‍👦 Inspiration

This app was inspired by the chaos of the holiday season — cards, gifts, tasks, and all the little things that fall through the cracks. Built to help families and planners stay on top of it all.

---

## 📃 License

MIT © \[Your Name or Org]
