# Helpdesk — Support Ticketing System

Next.js 15 (App Router) · TypeScript · Tailwind · MongoDB Atlas/Mongoose · Auth.js v5 · Zod · Nodemailer (Gmail) · Cloudinary · Recharts

## Quick start
```bash
npm install
cp .env.example .env.local     # fill in the values (see below)
npm run seed                   # 1 admin, 2 agents, 3 users, 4 categories, 17 tickets
npm run dev                    # http://localhost:3000
```
Seeded logins (password = `SEED_PASSWORD`, default `ChangeMe123!`):
`admin@helpdesk.test`, `bilal@helpdesk.test`, `sara@helpdesk.test`, `hamza@example.com`, `zainab@example.com`, `usman@example.com`

## Setup notes
- **MongoDB Atlas**: create a free cluster, add a DB user, allow your IP (or 0.0.0.0/0 for Vercel), paste the URI into `MONGODB_URI`.
- **AUTH_SECRET**: `npx auth secret` or `openssl rand -base64 33`.
- **Local ports and sessions**: leave `AUTH_URL` and `NEXTAUTH_URL` unset in local development; Auth.js then uses the active request host and port. `APP_URL` is only used for email links. Browser cookies are shared between ports on the same hostname, so sign out or clear localhost cookies when switching between ports; use `localhost` and `127.0.0.1` if you need separate local cookie jars.
- **Gmail SMTP**: enable 2-Step Verification, create an **App Password**, use it as `SMTP_PASS`. Gmail caps ~500 mails/day.
  If SMTP isn't configured the app still works; emails are skipped with a console warning.
- **Cloudinary (free)**: copy the cloud name / API key / secret from the same account into `.env.local`; never put real credentials in `.env.example` or client-side code. Restart the dev server after changing them. New free accounts may block *PDF delivery* by default
  (Settings → Security → "Allow delivery of PDF and ZIP files") — enable it or restrict uploads to images in `ALLOWED_MIME`.
  If image uploads return 403, verify the cloud name, API key and API secret are from the same Cloudinary account and that the account/API key allows signed image uploads.
- **Cron**: `vercel.json` calls `/api/cron/maintenance` daily (Hobby plan limit; use hourly on Pro). It flags SLA breaches and auto-closes
  tickets Resolved for 3+ days. Set `CRON_SECRET` — Vercel sends it as a Bearer token. Locally:
  `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/maintenance`.
  SLA breaches are *also* flagged lazily whenever the ticket list or analytics loads, so the flag is accurate between cron runs.

## Security model
| Concern | How it's handled |
|---|---|
| Route protection | `middleware.ts` (edge, role-by-path) **and** `requirePageUser()` in every page **and** `requireApiUser()` in every API route |
| Stale roles / disabled accounts | Guards re-read the user from MongoDB on each request, not just the JWT |
| Ticket isolation | One filter, `ticketScope(user)` (`lib/tickets/queries.ts`): user → `createdBy = me`, agent → `assignedAgent = me`, admin → all. Used by list, detail, reply, update and assign. Others' tickets return **404** |
| Internal notes | Excluded in the DB query for users (not merely hidden in the UI); users also can't post them (403) |
| Passwords | bcrypt (cost 12), `select: false` on the field, constant-time login path for unknown emails |
| Registration | Always creates role `user`; role can't be supplied |
| Input validation | Zod schemas in `lib/validators.ts`, shared by client forms and server routes; list filters fall back safely |
| CSRF | Same-origin check on every mutating API request + SameSite cookies from Auth.js |
| Uploads | Auth required, ≤4 MB, MIME allow-list **and** magic-byte check; ticket/message only accept URLs from *your* Cloudinary account |
| Rate limits | Login, register, upload, ticket + message creation (in-memory — swap for Upstash/Redis when running multiple instances) |
| Headers | HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy |

## SLA defaults (`lib/constants.ts`)
Urgent 1h/8h · High 4h/24h · Medium 8h/72h · Low 24h/120h (response/resolution). Changing a ticket's priority re-bases both deadlines on its creation time.

## Behaviour worth knowing
- Staff public reply sets the first-response time and moves *Open → In Progress*. A user reply on *Waiting on User* or *Resolved* reopens it (and cancels auto-close).
- Closed tickets accept no replies; staff can reopen by changing status.
- Deactivating/demoting an agent unassigns their open tickets.

## Testing role-based login
1. Start the app on one port with `npm run dev` and open that exact origin (for example, `http://localhost:3000`).
2. Sign in as a `user` to test **My tickets** and **New ticket**; users should be redirected away from admin pages.
3. Sign out, then sign in as an `agent` to test **My queue**; agents should be redirected away from admin pages and ticket creation.
4. Sign out, then sign in as an `admin` to test **Analytics**, **All tickets**, **Users**, and **Categories**.
5. To test another port, sign out first or clear cookies for `localhost`, then use that port consistently for login and navigation. Cookies are not isolated by port.

## Layout
```
src/auth.ts, auth.config.ts, middleware.ts   Auth.js + edge route gate
src/models/                                  User, Category, Ticket, Message, ActivityLog, Counter
src/lib/tickets/                             queries (reads + access scope), service (writes), notify (email), maintenance (SLA + auto-close)
src/lib/                                     guard, validators, sla, mailer, cloudinary, analytics, rate-limit
src/app/api/                                 thin route handlers
src/app/(app)/                               role-aware pages: tickets, tickets/[id], admin/*
src/components/                              forms, SlaTimer, filters, charts
scripts/seed.ts                              npm run seed
```
