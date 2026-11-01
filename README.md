# HAIR BY REI · Website

Website, appointment requests and private admin dashboard for Reilly Gray (HAIR BY REI) at Salon Bohème, Dieppe, New Brunswick.

- **Booking**: "Book" buttons open the appointment request form (MongoDB + Resend + admin dashboard). Reilly's Square page, https://reilly-gray-boheme.square.site, is offered as a secondary "book online" link.
- **Content**: brand details, the service menu and gallery captions live in `src/data/salon.ts`. The photographs are the site's original images; see `docs/PHOTOS_NEEDED.md` for swapping in Reilly's own work.
- **Database name**: still `TerrySalonDB` on purpose, so existing appointments and admin data keep working. Renaming it requires migrating the data first.

- **Public site**: editorial homepage with GSAP animations, hair gallery, services and an appointment request form.
- **Appointment API** (`/api/appointments`): validates requests, saves them to MongoDB Atlas, then emails the stylist through Resend.
- **Admin dashboard** (`/admin/login` → `/admin/appointments`): one administrator signs in to review, approve or reject requests; customers are emailed the decision.

## Tech stack

| Part | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling / motion | Tailwind CSS 4, GSAP (ScrollTrigger, SplitText, Flip) |
| Database | MongoDB Atlas, official `mongodb` driver (database `TerrySalonDB`) |
| Email | Resend |
| Runtime | Node.js **20.9 or newer** (required by Next.js 16); package manager **npm** |

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in real values (see below)
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm run lint      # ESLint
npm run build     # production build (also type-checks)
npm run start     # serve the production build
```

## Environment variables

All variables are **server-only**. Never commit real values and never prefix them with `NEXT_PUBLIC_`.
Locally they live in `.env.local` (ignored by Git); in production they are set in the hosting dashboard.
`.env.example` contains safe placeholders for each one.

| Variable | Used for |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (Atlas → Connect → Drivers) |
| `RESEND_API_KEY` | Resend API key for all emails |
| `RESEND_FROM_EMAIL` | Sender address, e.g. `HAIR BY REI <bookings@your-domain.com>` (must be on a domain verified in Resend) |
| `BOOKING_NOTIFICATION_EMAIL` | Inbox that receives new request notifications; also the reply-to on customer emails |
| `ADMIN_EMAIL` | Email the administrator signs in with |
| `ADMIN_PASSWORD_HASH` | Salted scrypt hash of the admin password (never the password itself) |
| `ADMIN_SESSION_SECRET` | Random secret (32+ characters) that signs admin login sessions |

### Admin credentials

Generate the password hash and session secret (the password is typed hidden and never stored):

```bash
node scripts/hash-admin-password.mjs
```

Copy the two printed lines into `.env.local` (and into the hosting dashboard), and set `ADMIN_EMAIL`.
Changing the password or `ADMIN_SESSION_SECRET` signs out every existing session.

## Publish to GitHub

`.gitignore` already excludes `.env`, `.env.local`, `.env.*.local`, `node_modules`, `.next` and build output.
Before pushing, confirm no environment file is staged:

```bash
git status --short          # .env.local must NOT appear
git ls-files | grep -i env  # should list only .env.example
```

## Deploy on Vercel

1. Sign in at [vercel.com](https://vercel.com) with GitHub → **Add New… → Project** → import this repository.
2. Framework preset: **Next.js** (detected automatically). Keep the default build command (`next build`) and output settings.
3. Under **Environment Variables**, add all seven variables from the table above for the **Production** environment
   (and Preview, if you use preview deployments). Paste values from your own records, never from a chat or email.
4. Click **Deploy**.
5. **MongoDB Atlas → Network Access**: Vercel's servers use changing IP addresses, so Atlas must allow them
   (commonly `0.0.0.0/0`). Keep a strong, unique database user password, and give that user access only to `TerrySalonDB`.
6. **Resend**: verify the website's domain, then set `RESEND_FROM_EMAIL` to an address on it. Until then Resend only
   delivers to the Resend account owner's inbox, so customers will not receive approval/rejection emails.
7. After deploying, test: submit a booking, check it appears in Atlas and the notification arrives,
   then sign in at `https://<your-domain>/admin/login` and approve or reject a test request.
8. Optional: add a custom domain under **Project → Settings → Domains**.

Changing an environment variable in Vercel requires a **redeploy** before it takes effect.

> Vercel's free **Hobby** plan is intended for personal, non-commercial projects. A business website should run on a
> plan whose terms allow commercial use (for example Vercel Pro). Check the current terms before going live.

## Security notes

- Admin pages and admin APIs verify the signed, HTTP-only session cookie on the server for every request;
  status changes also require a same-origin request. Sessions expire after 8 hours.
- Failed admin logins are rate-limited per IP (stored in the `adminLoginAttempts` collection, auto-expiring).
- Approve/reject is an atomic `pending → approved | rejected` update, so a decision (and its customer email) happens once.
- Approving a request does **not** check calendar availability; Reilly confirms the exact time with the client.
