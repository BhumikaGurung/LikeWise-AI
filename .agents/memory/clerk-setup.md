---
name: Clerk setup
description: How Replit-managed Clerk was provisioned and how the dev auth bypass interacts with it.
---

# Clerk Setup

## What's configured
- Replit-managed Clerk provisioned via `setupClerkWhitelabelAuth()`.
- Three secrets auto-set: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`.
- Frontend (`App.tsx`) derives the key via `publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` — this is canonical and must not be changed.

## Dev auth bypass interaction
- `app.ts` skips `clerkMiddleware` when the publishable key is missing or shorter than 30 chars.
- With real Clerk keys now set, `hasValidClerkKey` is `true` → real `clerkMiddleware` runs in dev.
- The dev bypass (`dev-user-001`) only activates if Clerk keys are removed again.
- The bypass is gated behind `NODE_ENV !== "production"` — it throws in prod if keys are absent.

**Why:** The frontend throws at module load if `clerkPubKey` is falsy (line 36 of App.tsx). Without provisioned Clerk, the preview is a blank error screen.

**How to apply:** If Clerk ever breaks again (Failed to load Clerk JS), call `checkClerkManagementStatus()` first — if `not_configured`, call `setupClerkWhitelabelAuth()` and restart both workflows.
