# Phase 1: Scaffold, DB, Auth & Dashboard Shell — Research

**Researched:** 2026-04-11
**Domain:** Next.js 16 App Router, Supabase Auth SSR, Tailwind CSS 4, Recharts 3, ElevenLabs prompt engineering
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** SARA non-transferability: hard block + soft redirect. Zero wiggle room. No escalation path to human agent for any transferability request.
- **D-02:** Exact scripted response for non-transferability is provided (BM + EN) — SARA must not improvise. Redirect caller to check family member's eligibility at sara.gov.my or call back with their own MyKad.
- **D-03:** Trigger conditions for non-transferability refusal: using another person's MyKad, sending balance to family member, using a representative (wakil), or any sharing/transferring variation.
- **D-04:** Language lock fires on ANY English request — no confirmation step. Response: "Sure, I'll continue in English."
- **D-05:** Root cause of language bug is "Match the caller's language" instruction — must be fully replaced, not amended.
- **D-06:** Full language rules: session start detects opening language (default BM if unclear); English lock on any English request → lock for full session → no revert even if caller speaks BM; BM lock on explicit BM request after English; NEVER alternate within single response.
- **D-07:** Keep installed Next.js version (16.2.3). Do NOT downgrade to v14.
- **D-08:** Update CLAUDE.md and spec references from "Next.js 14" to "Next.js 15/16 (App Router, TypeScript strict)".
- **D-09:** Avoid `<Form>` component (v15+ feature) — use standard `<form>` or Shadcn Form.
- **D-10:** Seed realistic mock data into Supabase — NOT hardcoded in frontend.
- **D-11:** Seed volumes: ~120 calls, ~5-8 transcript turns each, ~15 tickets, full KB from 4 kb_*.txt files.
- **D-12:** All seed rows use `caller_name LIKE 'DEMO_%'` with `is_test=true` for clean pre-go-live flush.
- **D-13:** Merchant seed endpoint: `POST /api/seed/merchants` — admin-only with idempotency guard.
- **D-14:** Four merchant seed guards: (1) admin role only, (2) idempotency if count > 0 → 409, (3) batch insert in chunks of 500, (4) return `{ inserted: N, skipped: 0, duration_ms: N }`.
- **D-15:** Seed Merchants button on Integrations page — admin-only, visible only when `merchants.count === 0`. After seed, button disappears and shows "10,194 outlets loaded."

### Claude's Discretion

- Exact skeleton/loading state design for stat cards and tables
- Specific Supabase RLS policy syntax (must enforce correct role access)
- Seed SQL file format (inline migration or separate seed.sql)
- Exact Recharts chart config for stacked bar and donut

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 1 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AGENT-01 | SARA voice agent enforces non-transferability (cannot use another person's MyKad) | ElevenLabs prompt engineering — scripted override block with exact BM/EN response text (D-01 to D-03) |
| AGENT-02 | SARA voice agent maintains English language once switched (never reverts to BM) | ElevenLabs prompt engineering — replace "match caller language" with explicit lock rules (D-04 to D-06) |
| INFRA-01 | Next.js project scaffolded with TypeScript strict, Tailwind CSS, App Router, no src/ dir | Already scaffolded at mykasih-crm/ — VERIFIED in codebase |
| INFRA-02 | Shadcn UI initialized with dark theme and CSS variables | Already initialized — components.json confirmed, 16 UI components present |
| INFRA-03 | All 12 CSS color tokens defined as CSS variables in globals.css | globals.css needs full rewrite — current file only has 2 tokens |
| INFRA-04 | Inter font loaded from Google Fonts as primary typeface | layout.tsx needs font swap: Geist → Inter + JetBrains Mono via next/font/google |
| INFRA-05 | Supabase browser client (lib/supabase/client.ts) and server client (lib/supabase/server.ts) created | @supabase/ssr 0.10.2 installed — use createBrowserClient / createServerClient with getAll/setAll pattern |
| INFRA-06 | Middleware protects all /dashboard/* routes; unauthenticated users redirect to /login | Next.js 16 renames middleware.ts → proxy.ts — CRITICAL BREAKING CHANGE (both filenames compile but docs mandate proxy.ts) |
| INFRA-07 | All 6 Supabase tables created with indexes and RLS enabled | supabase_migrations.sql ready — run in Supabase SQL Editor |
| INFRA-08 | .env.local created with all required environment variables | 10 env vars defined in CLAUDE.md — create .env.local from template |
| AUTH-01 | User can sign in with email and password via Supabase Auth | Supabase Auth email/password — supabase.auth.signInWithPassword() |
| AUTH-02 | After sign-in, system reads user role from users table and redirects by role | Read users table for role after auth, use router.push() for client-side redirect |
| AUTH-03 | Invalid credentials show error message below the login button | Handle AuthApiError from signInWithPassword, display below button per UI-SPEC |
| AUTH-04 | User session persists across browser refresh | @supabase/ssr handles this via cookie-based session — middleware must refresh tokens |
| MERCH-01 | POST /api/seed/merchants bulk-inserts 10,194 outlets into Supabase | merchants.json at project root confirmed (10,194 rows, 6 fields) — batch in chunks of 500 |
| MERCH-02 | lib/merchant-lookup.ts exports lookupByPostcode(postcode) | Query merchants table WHERE postcode LIKE first4% — return nearest outlets |
| MERCH-03 | lib/merchant-lookup.ts exports lookupByState(state, city?) | Query merchants table WHERE state = X AND (city = Y if provided) — return top 10 |
| DASH-01 | Fixed sidebar (260px) with all 14 nav items in 5 sections, logo, active state | UI-SPEC fully specifies all 14 items, 5 groups, Lucide icons — build from spec |
| DASH-02 | Sidebar bottom: user avatar, name, role badge, logout, AI Connected dot | UI-SPEC specifies all footer elements |
| DASH-03 | Topbar: page title, date in BM/EN, search, bell, user avatar dropdown | UI-SPEC specifies all topbar elements |
| DASH-04 | EN/BM language toggle; preference saved to localStorage and users.language | useLanguage() hook pattern — localStorage + Supabase sync |
| DASH-05 | 4 stat cards: interactions today, resolution rate, open tickets, avg duration | Query Supabase /api/analytics/summary — stat card spec in UI-SPEC |
| DASH-06 | Stacked bar chart (last 7 days, voice/chat) using Recharts | Recharts 3.8.1 installed — BarChart + Bar (stacked) pattern documented |
| DASH-07 | Donut chart for call categories using Recharts | Recharts PieChart + Pie with innerRadius for donut — 6 category colors from CSS vars |
| DASH-08 | Recent Interactions table (last 10) with channel badge, click → transcript modal | Supabase query calls table ORDER BY timestamp DESC LIMIT 10 — modal placeholder in Phase 1 |
| DASH-09 | All tables have loading skeleton (Shadcn Skeleton) and empty state | Shadcn Skeleton already installed — pulse animation, aria-busy="true" pattern |
</phase_requirements>

---

## Summary

Phase 1 delivers the complete foundational layer: Supabase schema + seed data, Supabase Auth with role-based redirects, Next.js 16 app shell with dark-themed sidebar/topbar/dashboard home, and two SARA ElevenLabs voice agent prompt fixes. The majority of the scaffolding is already in place — the Next.js project is created, all npm dependencies are installed (including Shadcn UI components, Recharts, lucide-react, @supabase/ssr), and the database migration SQL is ready to run.

The most critical technical discoveries are: (1) Next.js 16 has renamed `middleware.ts` to `proxy.ts` — both filenames compile (MIDDLEWARE_FILENAME and PROXY_FILENAME both exist in the build constants), but `proxy.ts` is the canonical filename in the docs and the migration direction; (2) @supabase/ssr 0.10.2 requires the `getAll`/`setAll` cookie pattern in both middleware/proxy and server client — the older `get`/`set`/`remove` pattern is deprecated and causes authentication bugs; (3) Tailwind CSS 4 uses `@import "tailwindcss"` syntax (already in globals.css), not the v3 `@tailwind base/components/utilities` directives. The globals.css file needs a full rewrite to inject the 12 CSS color token variables.

The SARA prompt fixes are pure text edits in the ElevenLabs dashboard — no code changes required. The merchant seed involves reading merchants.json (10,194 rows verified) and batch-inserting in chunks of 500 via the Supabase service role client to bypass RLS.

**Primary recommendation:** Proceed in wave order — (1) globals.css + font swap → (2) Supabase schema + env → (3) auth proxy + login page → (4) dashboard layout shell → (5) dashboard home with data → (6) merchant seed endpoint → (7) SARA prompt fixes.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.3 | App framework (App Router) | Already installed [VERIFIED: package.json] |
| react | 19.2.4 | UI runtime | Already installed [VERIFIED: package.json] |
| typescript | ^5 | Type safety | Already installed, strict mode on [VERIFIED: tsconfig.json] |
| tailwindcss | ^4 | Utility CSS | Already installed, v4 syntax in use [VERIFIED: globals.css] |
| @supabase/ssr | 0.10.2 | Supabase SSR auth client | Already installed — replaces deprecated auth-helpers-nextjs [VERIFIED: package.json] |
| @supabase/supabase-js | ^2.103.0 | Supabase data client | Already installed [VERIFIED: package.json] |
| recharts | 3.8.1 | Chart library | Already installed [VERIFIED: package.json] |
| lucide-react | ^1.8.0 | Icons | Already installed [VERIFIED: package.json] |
| next-themes | ^0.4.6 | Theme management | Already installed [VERIFIED: package.json] |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-* | various | Shadcn UI primitives | All UI component work — already in node_modules |
| sonner | ^2.0.7 | Toast notifications | Success/error toasts — already configured in components/ui/sonner.tsx |

### Shadcn UI Components (already installed in components/ui/)

All 16 components are already present — do NOT run `npx shadcn add` for these:
`avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `separator`, `skeleton`, `sonner`, `switch`, `table`, `tabs`

[VERIFIED: ls mykasih-crm/components/ui/]

### No Additional Installs Required

All dependencies for Phase 1 are already in node_modules. No `npm install` steps needed unless a new package is identified during implementation.

---

## Architecture Patterns

### Project Structure (existing + Phase 1 additions)

```
mykasih-crm/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          ← NEW: login page
│   ├── (dashboard)/
│   │   ├── layout.tsx            ← NEW: sidebar + topbar wrapper
│   │   └── page.tsx              ← NEW: dashboard home (stats, charts, recent)
│   ├── api/
│   │   ├── analytics/
│   │   │   └── summary/route.ts  ← NEW: dashboard stats query
│   │   └── seed/
│   │       └── merchants/route.ts ← NEW: merchant bulk insert
│   ├── globals.css               ← REWRITE: add 12 CSS vars, swap Geist → Inter
│   └── layout.tsx                ← MODIFY: swap font import
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           ← NEW
│   │   ├── Topbar.tsx            ← NEW
│   │   └── LanguageToggle.tsx    ← NEW
│   ├── dashboard/
│   │   ├── StatCard.tsx          ← NEW
│   │   ├── CallVolumeChart.tsx   ← NEW (stacked bar)
│   │   ├── CategoryDonut.tsx     ← NEW (donut)
│   │   └── RecentInteractions.tsx ← NEW
│   ├── calls/
│   │   └── ChannelBadge.tsx      ← NEW
│   └── ui/                       ← ALREADY EXISTS (16 components)
├── lib/
│   ├── supabase/
│   │   ├── client.ts             ← NEW: createBrowserClient
│   │   └── server.ts             ← NEW: createServerClient
│   ├── merchant-lookup.ts        ← NEW
│   └── translations.ts           ← NEW: EN/BM strings
├── hooks/
│   └── useLanguage.ts            ← NEW: language toggle hook
├── proxy.ts                      ← NEW: route protection (NOT middleware.ts)
└── .env.local                    ← NEW: all 10 env vars
```

### Pattern 1: Supabase Browser Client (Singleton)

**What:** Single browser-side Supabase client, reused across the session.
**When to use:** Client components, event handlers, client-side auth calls.

```typescript
// Source: @supabase/ssr dist/main/createBrowserClient.d.ts + README
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 2: Supabase Server Client (Per-Request)

**What:** New server-side client created per request, reads/writes cookies.
**When to use:** Server Components, Route Handlers, Server Actions.

```typescript
// Source: @supabase/ssr createServerClient.d.ts — getAll/setAll pattern is REQUIRED
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — cookies cannot be set.
            // Middleware (proxy.ts) handles session refresh in this case.
          }
        },
      },
    }
  )
}
```

### Pattern 3: Next.js 16 Auth Proxy (proxy.ts — NOT middleware.ts)

**What:** Route protection and session refresh before page render.
**When to use:** Protecting all /dashboard/* routes, redirecting unauthenticated users.

```typescript
// Source: next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
// Source: next/dist/lib/constants.js — PROXY_FILENAME = 'proxy' (both middleware + proxy compile)
// proxy.ts (at mykasih-crm root, NOT mykasih-crm/middleware.ts)
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not use getSession() for auth decisions — use getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isDashboardRoute = pathname.startsWith('/(dashboard)') ||
    pathname === '/' || pathname.startsWith('/voice-calls') ||
    pathname.startsWith('/chat-messages') // etc.

  if (!user && isDashboardRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**CRITICAL:** The proxy function exports as `proxy` (not `middleware`). The exported config uses `matcher`. Both `middleware.ts` and `proxy.ts` are recognized by the Next.js 16 build (MIDDLEWARE_FILENAME = 'middleware', PROXY_FILENAME = 'proxy' both exist in constants.js), but `proxy.ts` with export `proxy()` is the canonical approach for this version.

### Pattern 4: Role-Based Redirect After Login

**What:** After successful auth, read role from users table and redirect.
**When to use:** Login form submit handler.

```typescript
// Source: REQUIREMENTS.md AUTH-02, CONTEXT.md D-07
// Redirect map — apply after supabase.auth.signInWithPassword() success
const ROLE_REDIRECTS: Record<string, string> = {
  admin: '/',
  mykasih: '/',
  qmedia: '/analytics',
  supervisor: '/live-monitor',
}

// After sign-in:
const { data: userRecord } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()

const destination = ROLE_REDIRECTS[userRecord?.role ?? 'mykasih'] ?? '/'
router.push(destination)
```

### Pattern 5: Font Setup (Inter + JetBrains Mono as CSS Variables)

**What:** Load two Google Fonts and expose them as CSS variables for use in @theme.
**When to use:** Root layout.tsx.

```typescript
// Source: next/dist/docs/01-app/01-getting-started/13-fonts.md — variable font pattern
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '600'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400'],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

Then in globals.css (Tailwind v4 @theme inline):
```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);
}
```

### Pattern 6: Recharts Stacked Bar Chart

**What:** Last-7-days stacked bar chart with voice/chat channels.
**When to use:** Dashboard home CallVolumeChart component.

```tsx
// Source: recharts 3.8.1 installed — standard BarChart stacked pattern [ASSUMED - training]
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// data shape: [{ day: 'Mon', voice: 12, chat: 8 }, ...]
<ResponsiveContainer width="100%" height={240}>
  <BarChart data={data}>
    <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
    <Tooltip
      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
    />
    <Bar dataKey="voice" stackId="a" fill="var(--chart-voice)" radius={[0,0,0,0]} />
    <Bar dataKey="chat" stackId="a" fill="var(--chart-chat)" radius={[4,4,0,0]} />
  </BarChart>
</ResponsiveContainer>
```

### Pattern 7: Recharts Donut Chart

**What:** Category breakdown donut chart.
**When to use:** Dashboard home CategoryDonut component.

```tsx
// Source: recharts 3.8.1 [ASSUMED - training]
'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = [
  'var(--accent-primary)',
  'var(--accent-teal)',
  'var(--status-green)',
  'var(--status-yellow)',
  'var(--chart-voice)',
  'var(--chart-chat)',
]

// data shape: [{ name: 'eligibility', value: 32 }, ...]
<ResponsiveContainer width="100%" height={240}>
  <PieChart>
    <Pie data={data} cx="40%" cy="50%" innerRadius={60} outerRadius={100}
         dataKey="value">
      {data.map((_, index) => (
        <Cell key={index} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip
      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
    />
  </PieChart>
</ResponsiveContainer>
```

### Pattern 8: Merchant Batch Insert (chunks of 500)

**What:** Bulk-insert 10,194 rows avoiding Supabase payload limit.
**When to use:** POST /api/seed/merchants route handler.

```typescript
// Source: CONTEXT.md D-14, merchants.json verified 10,194 rows [VERIFIED: Node.js]
// Use service role key — bypasses RLS for insert
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}

const batches = chunk(merchants, 500)
let inserted = 0
for (const batch of batches) {
  const { count } = await supabaseAdmin.from('merchants').insert(batch)
  inserted += count ?? batch.length
}
```

### Anti-Patterns to Avoid

- **`getSession()` for auth checks:** Returns unverified cookie data. Use `getUser()` in proxy.ts for authorization decisions. [VERIFIED: @supabase/ssr README]
- **`get`/`set`/`remove` cookie methods:** Deprecated in @supabase/ssr 0.10.2. Use `getAll`/`setAll`. The old pattern causes random logouts and JSON parsing errors. [VERIFIED: @supabase/ssr createServerClient.d.ts]
- **`auth-helpers-nextjs`:** Deprecated package. The project already uses @supabase/ssr — do not introduce auth-helpers-nextjs. [VERIFIED: @supabase/ssr README]
- **Hardcoded hex values in components:** Use CSS custom properties only (`var(--bg-surface)`). CLAUDE.md enforces this. [VERIFIED: CLAUDE.md]
- **`any` TypeScript types:** Strict mode is on. All Supabase queries must be typed. [VERIFIED: tsconfig.json strict: true]
- **`<Form>` component:** Next.js 15+ feature with breaking edge cases — use standard `<form>` element. [VERIFIED: CONTEXT.md D-09]
- **`middleware.ts` with `export function middleware()`:** Works (backward compat) but the canonical pattern for Next.js 16 is `proxy.ts` with `export function proxy()`. [VERIFIED: next/dist/lib/constants.js + proxy.md]
- **Direct service role key exposure in client:** SUPABASE_SERVICE_ROLE_KEY must only be used in server-side route handlers, never NEXT_PUBLIC_.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session management | Custom JWT/cookie logic | @supabase/ssr createBrowserClient + createServerClient | Token refresh, concurrent request handling, edge cases built-in |
| Route protection | Custom middleware checks | proxy.ts with supabase.auth.getUser() | Standard Next.js + Supabase SSR pattern |
| Toast notifications | Custom toast component | sonner (already installed in components/ui/sonner.tsx) | Already configured |
| Loading states | CSS spinner components | Shadcn Skeleton (already installed) | Consistent pulse animation, aria-busy support |
| Icon set | Custom SVGs | lucide-react (already installed, 1.8.0) | All 14 sidebar icons already available |
| Charts | Custom D3/canvas charts | recharts (already installed, 3.8.1) | BarChart, PieChart with innerRadius for donut |
| Database batch inserts | Custom retry/chunking | 500-row chunks with @supabase/supabase-js insert() | Supabase has payload size limits; chunking avoids 413 errors |

**Key insight:** Every dependency for Phase 1 is already installed. The work is configuration + implementation, not dependency discovery.

---

## Common Pitfalls

### Pitfall 1: Using `middleware.ts` with `export function middleware()`

**What goes wrong:** Creates confusion — the function name `middleware` is deprecated. While the file compiles (MIDDLEWARE_FILENAME='middleware' still exists in constants.js), the canonical Next.js 16 approach is `proxy.ts` with `export function proxy()`. Mixing file names with wrong function names causes silent failures.
**Why it happens:** Training data predates Next.js 16's rename.
**How to avoid:** Create `proxy.ts` at the project root with `export function proxy()` and `export const config = { matcher: [...] }`.
**Warning signs:** CONTEXT.md says "create middleware.ts" — this is now stale. Use `proxy.ts`.

### Pitfall 2: Using `getSession()` for Authorization in proxy.ts

**What goes wrong:** `getSession()` reads session from cookies without server-side verification. A malicious client could craft a cookie with a spoofed user ID. Session appears valid but the user may be unauthorized.
**Why it happens:** `getSession()` is the obvious-sounding function but it's explicitly documented as unsafe for authorization.
**How to avoid:** Always use `supabase.auth.getUser()` in proxy.ts and any server-side authorization check.
**Warning signs:** Any proxy code that calls `getSession()` to make redirect decisions.

### Pitfall 3: `get`/`set`/`remove` Cookie Pattern in createServerClient

**What goes wrong:** Deprecated cookie pattern causes random logouts, early session termination, JSON parsing errors, and increased token refresh requests.
**Why it happens:** Old tutorials and AI training data use the deprecated pattern.
**How to avoid:** Always use `getAll`/`setAll` in both createServerClient calls (proxy.ts and server.ts).
**Warning signs:** Any code using `cookies: { get(name), set(name, value), remove(name) }` shape.

### Pitfall 4: Tailwind v3 Syntax in globals.css

**What goes wrong:** `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;` directives will fail silently or throw errors with Tailwind v4.
**Why it happens:** Tailwind v4 changed the import mechanism from directives to `@import "tailwindcss"`.
**How to avoid:** Keep the existing `@import "tailwindcss";` line. Do NOT add Tailwind v3 directives.
**Warning signs:** Any AI-generated globals.css that includes `@tailwind base/components/utilities`.

### Pitfall 5: Concurrent Supabase Session Refresh (Two Tabs)

**What goes wrong:** Two browser tabs open simultaneously with an expired session both attempt token refresh. The second tab's refresh fails because the refresh token was already consumed by the first tab. The second tab receives `session: null`.
**Why it happens:** Supabase refresh tokens are single-use.
**How to avoid:** Handle `null` session gracefully in all components. The proxy.ts middleware pattern mitigates this for navigation but not for parallel fetch calls.
**Warning signs:** "User is logged out" errors that only appear when multiple tabs are open.

### Pitfall 6: RLS Blocking Merchant Seed Insert

**What goes wrong:** The RLS policy on merchants only allows `INSERT TO service_role`. If the seed endpoint uses the anon key (createBrowserClient), inserts are rejected by RLS even though the user is authenticated.
**Why it happens:** Authenticated users are not the service_role.
**How to avoid:** The seed endpoint must use `SUPABASE_SERVICE_ROLE_KEY` (server-side only), not the anon key.
**Warning signs:** 403 errors from Supabase on the seed endpoint even with valid admin JWT.

### Pitfall 7: SARA Language Lock — "Match the Caller's Language" Instruction

**What goes wrong:** The existing SARA prompt contains "Match the caller's language" which causes language to revert when the caller returns to BM after requesting English. This mirrors current input rather than locking.
**Why it happens:** Generic language matching instruction was used instead of explicit session-level lock.
**How to avoid:** Fully replace the tone/language section. Do NOT amend or add to the existing instruction — the old instruction must be deleted and replaced with the explicit D-06 lock rules.
**Warning signs:** SARA reverts to BM mid-conversation after English was requested.

### Pitfall 8: Supabase users Table vs Auth Users

**What goes wrong:** Supabase has two separate user stores: `auth.users` (managed by Supabase Auth) and the public `users` table (custom). After sign-in, the user exists in `auth.users` but may not yet have a row in the public `users` table if it wasn't seeded.
**Why it happens:** Creating a user in Supabase Auth does not automatically create a row in the custom `users` table.
**How to avoid:** Seed admin/staff users in both `auth.users` (via Supabase Auth dashboard) AND the public `users` table with matching `id` (uuid). The role-based redirect reads from the public `users` table.
**Warning signs:** `userRecord` is null after sign-in → role-based redirect defaults to '/' for all users.

---

## Runtime State Inventory

Step 2.5: SKIPPED — This is a greenfield phase building new infrastructure, not a rename/refactor/migration phase.

---

## Environment Availability Audit

### Required Environment Variables

All 10 env vars must be in `.env.local` before any code runs. They are defined in CLAUDE.md.

| Variable | Required By | Available | Notes |
|----------|-------------|-----------|-------|
| NEXT_PUBLIC_SUPABASE_URL | INFRA-05, all DB | Must configure | Supabase project URL (Singapore) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | INFRA-05, auth | Must configure | Supabase anon/public key |
| SUPABASE_SERVICE_ROLE_KEY | MERCH-01 (seed endpoint) | Must configure | Server-side only — never NEXT_PUBLIC |
| ELEVENLABS_API_KEY | AGENT-01, AGENT-02 | Must configure | For prompt API calls |
| ELEVENLABS_AGENT_ID | AGENT-01, AGENT-02 | Documented in CLAUDE.md | agent_6501knqvg098fdh8355x9v4d3ycz |
| ELEVENLABS_WEBHOOK_SECRET | Phase 2 | Phase 2 only — not needed Phase 1 | — |
| ANTHROPIC_API_KEY | Phase 3 | Phase 3 only | — |
| META_WA_PHONE_NUMBER_ID | Phase 3 | Pending approval | — |
| META_WA_ACCESS_TOKEN | Phase 3 | Pending approval | — |
| META_WA_VERIFY_TOKEN | Phase 3 | Pending approval | — |
| N8N_WEBHOOK_SECRET | Phase 3 | Phase 3 only | — |
| N8N_BASE_URL | Phase 3 | Phase 3 only | — |
| NEXT_PUBLIC_ANAM_AGENT_ID | Phase 6 | Documented in CLAUDE.md | 32d94abf-9bfd-45c4-8076-b1ea6ef9e229 |

**Phase 1 blocking env vars:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

**Missing dependencies with no fallback:**
- Supabase project credentials — must be retrieved from Supabase dashboard before any server-side work can run

### Runtime Tools

| Tool | Required By | Available | Version |
|------|-------------|-----------|---------|
| Node.js | next dev, npm scripts | Yes | v24.7.0 [VERIFIED: node --version] |
| npm | Package installs | Yes | bundled with Node 24 |
| Next.js dev server | Development | Yes | 16.2.3 [VERIFIED: package.json] |
| Supabase SQL Editor | INFRA-07 | External — browser-based | — |
| ElevenLabs dashboard | AGENT-01, AGENT-02 | External — browser-based | — |

---

## Code Examples

### globals.css Full Rewrite

```css
/* Source: CONTEXT.md code_context + UI-SPEC.md globals.css Rewrite Contract */
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);
}

:root {
  /* Surface */
  --bg-primary:     #0D1117;
  --bg-surface:     #161B22;
  --bg-border:      #21262D;

  /* Accent */
  --accent-primary: #2E7D32;
  --accent-teal:    #00897B;

  /* Text */
  --text-primary:   #E6EDF3;
  --text-muted:     #7D8590;

  /* Status */
  --status-green:   #3FB950;
  --status-yellow:  #D29922;
  --status-red:     #F85149;

  /* Charts / Channel */
  --chart-voice:    #43A047;
  --chart-chat:     #00897B;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
}
```

### Supabase Auth Sign-In with Error Handling

```typescript
// Source: supabase.auth.signInWithPassword — standard Supabase pattern [ASSUMED - training]
// app/(auth)/login/page.tsx — client component
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ROLE_REDIRECTS: Record<string, string> = {
  admin: '/',
  mykasih: '/',
  qmedia: '/analytics',
  supervisor: '/live-monitor',
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const destination = ROLE_REDIRECTS[userRecord?.role ?? 'mykasih'] ?? '/'
    router.push(destination)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* inputs */}
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      {error && <p style={{ color: 'var(--status-red)' }}>{error}</p>}
    </form>
  )
}
```

### ChannelBadge Component

```tsx
// Source: UI-SPEC.md ChannelBadge spec
// components/calls/ChannelBadge.tsx
import { Phone, MessageSquare } from 'lucide-react'

interface ChannelBadgeProps {
  channel: 'voice' | 'chat'
}

export function ChannelBadge({ channel }: ChannelBadgeProps) {
  const isVoice = channel === 'voice'
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold"
      style={{
        background: isVoice ? 'rgba(67,160,71,0.15)' : 'rgba(0,137,123,0.15)',
        border: `1px solid ${isVoice ? 'rgba(67,160,71,0.4)' : 'rgba(0,137,123,0.4)'}`,
        color: isVoice ? 'var(--chart-voice)' : 'var(--chart-chat)',
      }}
    >
      {isVoice ? <Phone size={12} /> : <MessageSquare size={12} />}
      {isVoice ? 'Voice' : 'Chat'}
    </span>
  )
}
```

### Merchant Lookup Utilities

```typescript
// Source: REQUIREMENTS.md MERCH-02, MERCH-03 — postcode prefix match pattern
// lib/merchant-lookup.ts
import { createClient } from '@/lib/supabase/server'

export async function lookupByPostcode(postcode: string) {
  const supabase = await createClient()
  const prefix = postcode.slice(0, 4)
  const { data } = await supabase
    .from('merchants')
    .select('*')
    .like('postcode', `${prefix}%`)
    .limit(10)
  return data ?? []
}

export async function lookupByState(state: string, city?: string) {
  const supabase = await createClient()
  let query = supabase.from('merchants').select('*').eq('state', state)
  if (city) query = query.eq('city', city)
  const { data } = await query.limit(10)
  return data ?? []
}
```

### SARA Non-Transferability Prompt Block

```
// Source: CONTEXT.md D-01 to D-03 — exact scripted response (do NOT paraphrase)
// To insert verbatim into ElevenLabs agent prompt under a "Non-Transferability" section:

NON-TRANSFERABILITY RULE (ABSOLUTE — NO EXCEPTIONS):
If the caller asks to use their SARA credit for someone else, use someone else's MyKad,
send balance to a family member, use a representative (wakil), or any variation of
sharing or transferring SARA credit:

1. DO NOT offer any workaround, exception, or escalation path.
2. DO NOT transfer to a human agent for this request — this is a program rule with no exceptions.
3. Respond with EXACTLY this text in the caller's current language:

   BM: "Maaf, baki SARA pada MyKad anda adalah peribadi dan tidak boleh dipindahkan atau
   diwakilkan kepada sesiapa. Setiap individu mesti menggunakan MyKad sendiri semasa membuat
   pembelian di kaunter."

   EN: "I'm sorry, the SARA credit on your MyKad is personal and cannot be transferred or
   used by anyone else. Each person must use their own MyKad at the counter."

4. Then add (both languages): "You may check your family member's own eligibility at
   sara.gov.my or they can call back with their own MyKad."
```

### SARA Language Lock Prompt Replacement

```
// Source: CONTEXT.md D-04 to D-06 — replace existing tone/language section entirely

LANGUAGE RULES (replace all existing language instructions):
- Session start: detect the caller's opening language and respond in kind. Default to BM if unclear.
- English lock: the moment the caller says ANYTHING equivalent to requesting English
  (e.g. "English please", "boleh cakap English?", "in English", "speak English") —
  immediately switch to English, respond "Sure, I'll continue in English." and LOCK
  for the entire session. Do NOT revert to BM even if the caller speaks BM afterward.
- BM lock: if the caller explicitly requests BM after an English session —
  switch immediately and lock to BM for the rest of the session.
- NEVER alternate languages within a single response.
- NEVER mirror the caller's current language if a lock has been set — the lock overrides.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` (createBrowserClient/createServerClient) | ~2023 | auth-helpers-nextjs is deprecated — project already uses ssr package |
| `get`/`set`/`remove` cookies in createServerClient | `getAll`/`setAll` only | @supabase/ssr 0.5+ | Old pattern causes random logouts; deprecated in 0.10.2 |
| `middleware.ts` with `export function middleware()` | `proxy.ts` with `export function proxy()` | Next.js 16 | Both still compile; proxy.ts is canonical going forward |
| Tailwind `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 | Already in use in this project's globals.css |
| `getSession()` for authorization | `getUser()` for authorization | @supabase/ssr README | getSession is not verified server-side |

**Deprecated/outdated:**
- `auth-helpers-nextjs`: Fully deprecated — do not import
- `get`/`set`/`remove` cookie methods in createServerClient: Deprecated in 0.10.2 — causes auth bugs
- `middleware.ts` function name: Deprecated — replaced by proxy.ts in Next.js 16

---

## Validation Architecture

`nyquist_validation` is `true` in config.json — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test config files found in mykasih-crm/ |
| Config file | None — Wave 0 must create |
| Quick run command | `npm test` (after Wave 0 setup) |
| Full suite command | `npm test` |

No `jest.config.*`, `vitest.config.*`, `playwright.config.*`, or test directories were found in `mykasih-crm/`. Test infrastructure is a Wave 0 gap.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | signInWithPassword returns user on valid credentials | unit | `npm test -- --testPathPattern=auth` | Wave 0 |
| AUTH-02 | Role-based redirect map returns correct path | unit | `npm test -- --testPathPattern=auth` | Wave 0 |
| AUTH-03 | Error message displayed on bad credentials | component smoke | manual — login form UI test | Wave 0 |
| AUTH-04 | Session persists across reload | manual | manual — browser refresh check | manual-only |
| MERCH-01 | POST /api/seed/merchants returns 409 if already seeded | integration | `npm test -- --testPathPattern=seed` | Wave 0 |
| MERCH-02 | lookupByPostcode returns outlets matching first 4 digits | unit | `npm test -- --testPathPattern=merchant-lookup` | Wave 0 |
| MERCH-03 | lookupByState filters by state and optional city | unit | `npm test -- --testPathPattern=merchant-lookup` | Wave 0 |
| INFRA-03 | All 12 CSS vars present in globals.css | smoke | `grep --count "var(--" globals.css` (12 vars) | manual check |
| DASH-01 | Sidebar renders 14 nav items | component | manual — visual check | manual-only |
| AGENT-01 | SARA refuses IC transfer requests | manual | manual — ElevenLabs test call | manual-only |
| AGENT-02 | SARA locks to English after switch | manual | manual — ElevenLabs test call | manual-only |

### Sampling Rate
- **Per task commit:** `npm test` (unit tests only — sub 30s once Wave 0 sets up vitest)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `mykasih-crm/vitest.config.ts` — vitest is recommended for Next.js + Vite compatibility; install: `npm install -D vitest @vitejs/plugin-react`
- [ ] `mykasih-crm/tests/lib/merchant-lookup.test.ts` — covers MERCH-02, MERCH-03
- [ ] `mykasih-crm/tests/lib/auth-redirects.test.ts` — covers AUTH-01, AUTH-02
- [ ] `mykasih-crm/tests/api/seed-merchants.test.ts` — covers MERCH-01 idempotency guard

Note: AUTH-04, DASH-01, AGENT-01, AGENT-02 are manual-only — they require browser session state or live ElevenLabs integration that cannot be unit tested.

---

## Security Domain

`security_enforcement` is not set in config.json → treat as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase Auth email/password — signInWithPassword() |
| V3 Session Management | Yes | @supabase/ssr cookie-based sessions with proxy.ts refresh |
| V4 Access Control | Yes | Proxy.ts route protection + Supabase RLS on all 6 tables |
| V5 Input Validation | Yes | TypeScript strict types on all form inputs; Supabase parameterized queries |
| V6 Cryptography | No | No custom crypto — Supabase handles all password hashing |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Spoofed session cookie | Spoofing | Use getUser() (server-verified) not getSession() in proxy.ts |
| CSRF on login form | Tampering | Standard `<form>` with server action or Supabase client; no custom token needed |
| RLS bypass on seed endpoint | Elevation of privilege | Validate admin JWT before using service role key; idempotency guard |
| XSS via IC data in UI | Tampering | React escapes by default; never render raw IC — always use maskIC() pattern |
| Service role key leak | Information disclosure | SUPABASE_SERVICE_ROLE_KEY must never be NEXT_PUBLIC_; server-side route handlers only |
| ElevenLabs webhook spoofing | Spoofing | Phase 2 — validate ELEVENLABS_WEBHOOK_SECRET header on all webhook routes |

### Project-Specific Security Constraints (from CLAUDE.md)

- IC masking: ALWAYS mask before Supabase write — format `880512-**-****`
- No plain-text personal data in any DB field
- RLS enabled on all tables (confirmed in supabase_migrations.sql)
- Admin MFA enforced via Supabase Auth settings
- Webhook secrets validated on every incoming request
- `is_test=true` on ALL test calls from Testing Console

---

## Project Constraints (from CLAUDE.md)

The following directives from `CLAUDE.md` are binding on the planner and executor:

| Directive | Category | Enforcement |
|-----------|----------|-------------|
| TypeScript strict mode — no `any` | Code quality | tsconfig.json strict: true — already active |
| Never hardcode hex colors — use CSS vars | Design | All components use `var(--token)` syntax |
| Never store plain IC numbers | PDPA | maskIC() applied before every Supabase write |
| Never edit on main/master branch directly | Git | Create feature branch for all Phase 1 work |
| Conventional commits format | Git | feat/fix/chore/docs prefixes |
| Always try/catch on API routes | Code quality | All route handlers wrapped |
| Always return proper HTTP status codes | API | 200/201/409/401/403/500 as appropriate |
| Always add loading skeleton + empty state to tables | UI | Shadcn Skeleton + empty state on all tables |
| Always tag test calls: is_test=true | Data integrity | Testing Console calls must set is_test=true |
| Always show channel badge on every row | UI | ChannelBadge component on all interaction rows |
| Seed data uses `DEMO_` prefix + is_test=true | Data integrity | Pre-go-live cleanup via DELETE WHERE is_test=true AND caller_name LIKE 'DEMO_%' |
| No `<Form>` component from Next.js | Compatibility | Use standard `<form>` or Shadcn Form |
| Next.js 16 (not "Next.js 14") in all references | Documentation | Update CLAUDE.md and any remaining spec references |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Recharts 3.x BarChart stacked pattern uses `stackId` prop on each Bar | Code Examples — stacked bar | Charts render side-by-side instead of stacked; fix: verify with recharts 3 changelog |
| A2 | Recharts 3.x PieChart donut achieved via `innerRadius` prop on Pie | Code Examples — donut | Donut ring does not appear; fix: check recharts 3 docs for innerRadius API changes |
| A3 | Supabase `signInWithPassword` error type is `AuthApiError` with message property | Code Examples — auth | Error message not displayed correctly; fix: log the actual error shape |
| A4 | `next/font/google` exports `JetBrains_Mono` as a named export in Next.js 16 | Code Examples — fonts | Font import fails; fix: check next/font/google exports |
| A5 | ElevenLabs agent prompt can be fully replaced via ElevenLabs web dashboard | SARA prompt sections | If prompt is locked/versioned differently; fix: check ElevenLabs dashboard for agent prompt editing |

**All claims except A1-A5 are VERIFIED via codebase inspection or CITED from in-repo docs.**

---

## Open Questions

1. **Supabase project credentials**
   - What we know: The Supabase project exists (CLAUDE.md says "Supabase project: Created")
   - What's unclear: Actual URL and anon key values are not in the repo
   - Recommendation: Planner should include a task to retrieve credentials from Supabase dashboard and populate .env.local before any server-side tasks run

2. **ElevenLabs agent prompt editing**
   - What we know: Agent ID is `agent_6501knqvg098fdh8355x9v4d3ycz`, the agent is live
   - What's unclear: Whether the ElevenLabs dashboard allows full prompt replacement or only incremental edits
   - Recommendation: AGENT-01 and AGENT-02 tasks should note: open ElevenLabs dashboard → find agent → go to prompt/instructions tab → replace language section and add non-transferability block

3. **Supabase auth.users vs public users table seeding**
   - What we know: The public `users` table schema is defined; the migration creates it
   - What's unclear: How staff accounts will be created (manual in Supabase Auth dashboard, or via CLI)
   - Recommendation: Planner should include a task to create at least one admin account in Supabase Auth + insert matching row in public users table with correct role for initial login testing

---

## Sources

### Primary (HIGH confidence — verified in codebase)
- `mykasih-crm/package.json` — all installed dependency versions confirmed
- `mykasih-crm/tsconfig.json` — strict mode, module resolution confirmed
- `mykasih-crm/app/globals.css` — Tailwind v4 syntax confirmed, needs rewrite
- `mykasih-crm/app/layout.tsx` — Geist font currently loaded, needs swap
- `mykasih-crm/components.json` — Shadcn default preset, slate base, CSS vars
- `mykasih-crm/components/ui/` (ls) — 16 installed components listed
- `mykasih-crm/node_modules/@supabase/ssr/dist/main/createBrowserClient.d.ts` — API signature
- `mykasih-crm/node_modules/@supabase/ssr/dist/main/createServerClient.d.ts` — getAll/setAll requirement
- `mykasih-crm/node_modules/@supabase/ssr/README.md` — getUser vs getSession, auth-helpers deprecation
- `mykasih-crm/node_modules/@supabase/ssr/dist/main/index.js` — exports confirmed
- `mykasih-crm/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` — proxy.ts convention, migration from middleware.ts
- `mykasih-crm/node_modules/next/dist/docs/01-app/02-guides/authentication.md` — auth patterns, getUser() mandate
- `mykasih-crm/node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` — font variable pattern
- `mykasih-crm/node_modules/next/dist/docs/01-app/01-getting-started/11-css.md` — Tailwind v4 @import syntax
- `mykasih-crm/node_modules/next/dist/lib/constants.js` — MIDDLEWARE_FILENAME and PROXY_FILENAME both defined
- `C:/Users/navie/MyKasih/merchants.json` — 10,194 rows, 6 fields (chain, outlet_name, state, city, postcode, address) [Node.js verified]
- `C:/Users/navie/MyKasih/supabase_migrations.sql` — 6 tables, indexes, RLS policies
- `.planning/phases/01-scaffold-db-auth-dashboard-shell/01-CONTEXT.md` — locked decisions D-01 to D-15
- `.planning/phases/01-scaffold-db-auth-dashboard-shell/01-UI-SPEC.md` — complete component specs

### Secondary (MEDIUM confidence — cited from in-repo official docs)
- Next.js 16 auth guide proxy pattern — `proxy.ts` with `supabase.auth.getUser()` for route protection
- @supabase/ssr README — concurrent request refresh token limitation, middleware pattern mitigation

### Tertiary (LOW confidence — training data, flagged in Assumptions Log)
- Recharts 3.x BarChart stackId prop (A1)
- Recharts 3.x PieChart innerRadius for donut (A2)
- Supabase AuthApiError shape (A3)
- next/font/google JetBrains_Mono export name (A4)
- ElevenLabs dashboard prompt replacement flow (A5)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json and node_modules
- Architecture patterns: HIGH — proxy.ts, createServerClient, font patterns all verified in Next.js 16 in-repo docs
- Recharts patterns: LOW — recharts version verified but specific 3.x API details are training data
- Pitfalls: HIGH — getSession/getUser, deprecated cookies, Tailwind v4 syntax all verified in-repo
- SARA prompt: HIGH — scripted text and rules captured verbatim from CONTEXT.md decisions

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable libraries) — except Next.js 16 patterns (fast-moving, re-verify if version bumps)
