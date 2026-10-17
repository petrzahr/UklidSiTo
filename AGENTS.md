# UklidSiTo

## Stack
- Next.js 15 (App Router, `src/app`) + React 19, TypeScript 5.7, npm
- Server Actions in `app/actions`, Route Handlers in `app/api/auth` and `app/api/tasks`
- Tailwind CSS 3.4 + PostCSS + autoprefixer; clsx + tailwind-merge; icons from lucide-react
- Validation: Zod (`lib/validation`)
- Database: Google Sheets via `googleapis` (Sheets v4) and a service account
- Auth: Google Identity Services (popup) + ID token verification via `google-auth-library`
- Email: Resend, sender domain `uklidsito.byzahr.app`
- Tests: Vitest 3, tests in `tests/unit`
- Hosting: Vercel, `uklidsito.byzahr.app`; env vars in Vercel Project Settings

## Commands
- Installed packages and scripts: check `package.json` only (don't scan node_modules).
- Dev: `npm run dev`
- Build / regression check: `npm run build`. Must pass before every commit.
- Tests: Vitest via the test script in `package.json`. Must pass before every commit.
- Lint: ESLint is not installed and `next lint` is deprecated - don't run or set up linting without asking.

## Architecture Rules
- Strict layering: `src/repositories` -> `src/services` -> `src/app`.
  - Only `src/repositories/google-sheets/` talks to the Sheets API.
  - Business logic lives in services. Server Actions and Route Handlers stay thin and call services.
  - Never call `googleapis` or Resend directly from `app/`.
- Validate every Server Action and Route Handler input with Zod schemas from `lib/validation`.
- Server Components by default; `"use client"` only where interactivity requires it. Server-only modules (repositories, services, auth, email) must never be imported into client components.

## Google Sheets as Database (high risk - user data)
- The sheet structure (sheet names, column order, headers) is the schema. Any change needs a migration plan and backward compatibility - put it in the plan and wait for approval.
- Never delete or overwrite rows/sheets in bulk without explicit approval.
- Minimize API calls: batch reads/writes, no per-row requests in loops; keep Sheets API quotas in mind.

## Auth & Security
- Server Actions are public HTTP endpoints: every action and protected route handler must check the session (and admin rights where relevant) on the server. Never rely on UI hiding.
- Admin is a single user defined by `ADMIN_EMAIL`. Don't add roles or users without approval.
- ID token verification must check audience (our client ID) and email_verified.
- Session: HttpOnly, Secure, SameSite cookie signed with HMAC (`SESSION_SECRET`) in `src/lib/auth/session.ts`. Don't change the session format or crypto without approval.
- Public task links `/task/[token]` (`src/lib/security/token.ts`): tokens must stay unguessable, compared in constant time, and expose only that task's data. Changes need approval.
- Service account currently uses a JSON key (`GOOGLE_PRIVATE_KEY`). Known tech debt: don't spread key usage elsewhere; migration to Workload Identity Federation (Vercel OIDC) only when I ask.

## Email (Resend)
- All sending goes through `src/services/email-service.ts`.
- Never send real emails from tests or local dev - mock the email service in tests.

## Bug Fixing
- Confine edits to the files actually causing the issue.
- Add or update a Vitest test in `tests/unit` reproducing the bug when practical.
- Verify with `npm run build` and tests before reporting the bug as fixed.

## Git Workflow
- Work on the `develop` branch.
- After an approved task is implemented and build + tests pass, automatically:
  - Check changed files with `git status`.
  - Stage the changes and create a local commit (Conventional Commits).

## File Exclusions
- Don't open or search: `node_modules/`, `.next/`, `dist/`, `build/`, `out/`, `package-lock.json`, `*.tsbuildinfo`, `*.map`, `*.log`, and binary/vector assets (`*.svg`, `*.png`, `*.jpg`, `*.ico`, `*.webp`).
