# glowme.io default landing page plan (planning-only)

## 1) Repo inspection summary

- **Frontend surface serving `glowme.io`**: single Vite SPA in this repo (`package.json`, `vite.config.js`, `vercel.json`).
- **Runtime entrypoints**:
  - HTML shell: `index.html`
  - Client bootstrap: `src/main.jsx`
  - Route tree: `src/App.tsx`
- **Current public/auth route split**:
  - Public root route: `path="/"` -> `LandingPage` (`src/pages/LandingPage.tsx`)
  - Public-only auth routes: `/login`, `/register` (`src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`)
  - Protected routes wrapped in `ProtectedRoute` (`src/components/ProtectedRoute.tsx`): `/dashboard`, `/profile`, `/settings`, `/birth-data`, `/discovery`
  - Catch-all: `*` redirects to `/`
- **Auth/bootstrap behavior impacting public pages**:
  - `AppRoutes` blocks all routes behind `isInitialized`/`isLoading` from `AuthProvider` before rendering routes (`src/App.tsx`).
  - `AuthProvider` boots auth via `useCurrentUser` and sets init state after first resolve (`src/providers/AuthProvider.tsx`).
- **Current root-page app-oriented content** (must be removed/replaced on main page):
  - “Find your perfect match through Magic 10 compatibility” and dating/matching language (`src/pages/LandingPage.tsx`)
  - CTA buttons to `/register` and `/login` labeled “Start Your GLOW Journey” / “Sign In” (`src/pages/LandingPage.tsx`)
  - “Mobile-First Dating Experience” and similar app/product copy (`src/pages/LandingPage.tsx`)
- **Reusable UI/styling primitives available**:
  - Tailwind utility styling throughout pages/components (`src/index.css`, Tailwind via `@tailwindcss/vite` in `vite.config.js`)
  - Shadcn/Radix component set in `src/components/ui/*` (e.g., `card.jsx`, `button.jsx`, `separator.jsx`)
  - Existing gradient + typographic style pattern used in current landing/auth screens.
- **Account/admin surfaces to preserve**:
  - Login/register entry points (`/login`, `/register`)
  - Protected account routes (`/dashboard`, `/profile`, `/settings`, `/birth-data`, `/discovery`)
  - Admin constants exist in `src/core/constants/index.ts` (`/admin*`) but no explicit admin route registration in `src/App.tsx`; keep current behavior unchanged.
- **Deploy/build/CI shape relevant to root-page change**:
  - Build: `npm run build` (with `prebuild` auth guard + registry type generation) (`package.json`)
  - Hosting/routing: Vercel rewrite `/(.*) -> /index.html` means root-page change is SPA-route/component level (`vercel.json`)
  - Existing CI workflow: `.github/workflows/smoke-birth-data.yml` targets auth/birth-data flow; no homepage-specific check today.
- **Current SEO/head baseline**:
  - Global page title/description currently app-oriented in `index.html`:
    - `<title>GLOW - Human Design Dating</title>`
    - meta description references matching app language.
  - No route-specific head management library observed.

## 2) Current root behavior

Today `/` renders `LandingPage` (`src/pages/LandingPage.tsx`) after auth bootstrap completes (`src/App.tsx` + `src/providers/AuthProvider.tsx`). The page is publicly reachable but currently markets the app/matching experience and funnels to sign-up/sign-in.

For a default Stripe-review-friendly landing page, `/` should keep public accessibility but replace app-focused messaging with business/policy information and support details from approved facts.

## 3) Recommended implementation approach

Use the **least-risk in-place replacement**:

1. Keep `path="/"` in `src/App.tsx` unchanged.
2. Replace `src/pages/LandingPage.tsx` content with a static, one-page public business landing page (no auth state dependency, no new API calls, no new routes).
3. Update root document metadata in `index.html` to align with business/service framing instead of app/dating framing.
4. Reuse existing Tailwind and optional existing UI primitives; avoid new dependencies.

Why this is lowest risk:
- No router topology changes.
- No backend contract changes.
- No auth guard changes.
- Preserves account/admin paths and existing smoke workflow scope.

## 4) Proposed page structure

One-page structure (single `/` surface):

1. **Hero / business overview**
   - Business name (Glow)
   - Plain statement of offerings
2. **Services sold**
   - Human Design readings
   - Customized relationship matching systems
3. **Support**
   - Public support email (`support@glowme.io`)
4. **Refund / dispute policy**
   - Refund before delivery only
   - Minimal dispute guidance text (requires business approval if not already approved verbatim)
5. **Cancellation policy**
   - No scheduled readings currently; cancellation policy not applicable
6. **Return policy**
   - No physical goods sold; returns not applicable
7. **Restrictions**
   - 18+ only
8. **Promotions**
   - No active promotions
9. **Footer/legal essentials**
   - Domain/business identity reiteration
   - Support contact repetition

## 5) Proposed copy outline

> Draft copy below is planning text to be finalized in implementation pass.

- **Hero / overview**
  - Heading: “Glow”
  - Subheading: “Glow provides Human Design services and customized relationship matching systems.”
- **Services**
  - “Human Design readings”
  - “Customized relationship matching systems”
- **Support**
  - “Customer support: support@glowme.io”
- **Refund/dispute**
  - Refund: “Refunds are available only before the purchased product or service is delivered.”
  - Dispute (minimal candidate text): “If you have a billing concern, contact support@glowme.io first so we can review and resolve it.”
  - **Approval flag**: dispute wording requires business approval before ship unless approved copy already exists in source-of-truth docs.
- **Cancellation**
  - “Glow does not offer scheduled readings at this time, so a cancellation policy is not currently applicable.”
- **Returns**
  - “Glow does not sell physical goods, so return policy is not applicable.”
- **Restrictions**
  - “Services are available to customers 18 years or older.”
- **Promotions**
  - “There are no active promotions at this time.”
- **Footer / legal essentials**
  - “Glow · glowme.io · support@glowme.io”

## 6) File-by-file change plan (for implementation pass)

Likely edits:

- `src/pages/LandingPage.tsx`
  - Replace app-centric/CTA-heavy content with static policy-oriented business landing layout.
  - Remove register/login marketing CTA emphasis from root page.
- `index.html`
  - Update `<title>` and `<meta name="description">` to business/service framing aligned with Stripe review.

Potentially touched (only if needed for cleanup/refactor):
- `src/App.tsx`
  - Keep route mapping as-is; only touch if cleanup is required around duplicated route entries.
- `src/index.css` or `src/App.css`
  - Minimal styling additions only if existing utility classes are insufficient.

No planned changes:
- Auth/data providers (`src/providers/*`)
- Protected/account pages (`src/pages/*` except `LandingPage.tsx`)
- Backend API client and payment flows (`src/core/api/*`)

## 7) Auth and routing impact

- `/` remains public route (`src/App.tsx`), so no login required to view the default landing page.
- Existing `/login` and `/register` remain available and unchanged.
- Existing protected account routes stay behind `ProtectedRoute`.
- No changes to auth bootstrap logic (`AuthProvider`) are required for the content-only root page swap.
- Because current `AppRoutes` waits for auth bootstrap before showing routes, initial load of `/` may still briefly show global app loader; implementation pass can keep this behavior for minimal risk unless product decides to decouple public page rendering from auth bootstrap.

## 8) Verification plan (for implementation pass)

Minimal checks after implementation:

1. **Route behavior**
   - Navigate to `/` in logged-out state: page renders landing content (not app shell).
2. **Public visibility without auth**
   - Confirm landing content is accessible without session and without redirect to `/login`.
3. **Stripe-review content presence**
   - Confirm visible presence of: business name, services sold, support contact, refund/dispute area, cancellation status, return status, 18+ restriction, promotions status.
4. **App references removed from main page**
   - Confirm no root-page copy references app/dating/mobile app funnels on `src/pages/LandingPage.tsx` output.
5. **No account/admin breakage**
   - Spot check `/login`, `/register`, and one protected route redirect flow (e.g., `/dashboard` when logged out redirects correctly).
6. **CI/test impact**
   - Existing smoke workflow is birth-data/auth oriented; homepage changes likely need at least a lightweight static content check in CI (optional but recommended).

## 9) Risks and open questions

1. **Auth bootstrap gating on public root**
   - Current architecture delays route render until auth bootstrap resolves; may add unnecessary wait on public landing.
   - Matters for first paint/perceived reliability during Stripe review.
2. **Dispute wording source-of-truth unclear**
   - Repo inspection did not find approved legal dispute text specific to billing disputes for this page.
   - Matters for compliance/brand/legal sign-off; must be approved before ship.
3. **Admin surface definition mismatch**
   - Admin route constants exist but explicit admin routes are not registered in `src/App.tsx`.
   - Matters when asserting “no admin breakage”; implementation pass should verify actual admin entry points in deployment/runtime.

