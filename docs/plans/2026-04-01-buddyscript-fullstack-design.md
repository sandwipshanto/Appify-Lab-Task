# BuddyScript Full-Stack Conversion — Design Document

**Date:** 2026-04-01
**Deadline:** 2026-04-06
**Context:** AppifyLab full-stack engineering role task. Convert 3 static HTML/CSS pages (login, register, feed) into a React/Next.js app with backend and database.

---

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js 14 (App Router) | Full-stack in one repo, SSR, fast to build |
| Styling | Existing Bootstrap + CSS files | Task requires sticking to provided design |
| Auth | Custom JWT (bcrypt + jose, httpOnly cookies) | Demonstrates deep understanding |
| ORM | Prisma | Type-safe, great DX, migrations |
| Database | PostgreSQL on Neon | Serverless, free tier, Vercel-optimized |
| Images | Cloudinary (free tier) | Scalable, auto-optimized |
| Deploy | Vercel | Zero-config for Next.js, free tier |

---

## Database Schema

### User
- `id` — UUID, PK
- `firstName` — String
- `lastName` — String
- `email` — String, unique, indexed, stored lowercase/trimmed
- `password` — String (bcrypt hash, 12 salt rounds)
- `avatar` — String? (Cloudinary URL)
- `createdAt` — DateTime, indexed
- `updatedAt` — DateTime

### Post
- `id` — UUID, PK
- `content` — Text
- `imageUrl` — String? (Cloudinary URL)
- `visibility` — Enum (PUBLIC, PRIVATE)
- `authorId` — UUID, FK -> User, indexed
- `likeCount` — Int, default 0 (denormalized counter)
- `commentCount` — Int, default 0 (denormalized counter)
- `createdAt` — DateTime, indexed
- `updatedAt` — DateTime
- **Composite index:** `(createdAt DESC, id DESC)` for cursor-based feed pagination

### Comment
- `id` — UUID, PK
- `content` — Text
- `postId` — UUID, FK -> Post, indexed
- `authorId` — UUID, FK -> User, indexed
- `parentId` — UUID?, FK -> Comment, indexed (null = top-level, set = reply to top-level only — no reply-to-reply)
- `likeCount` — Int, default 0 (denormalized counter)
- `deletedAt` — DateTime? (soft delete — null means active)
- `createdAt` — DateTime, indexed
- `updatedAt` — DateTime
- **Composite index:** `(postId, parentId, createdAt DESC, id DESC)` for paginated top-level comments and replies

### PostLike (separate table — no polymorphic ambiguity)
- `id` — UUID, PK
- `userId` — UUID, FK -> User, indexed
- `postId` — UUID, FK -> Post, indexed
- `createdAt` — DateTime
- **UNIQUE(userId, postId)** — one like per user per post
- **Composite index:** `(postId, createdAt DESC, id DESC)` for paginated likes-list

### CommentLike (separate table)
- `id` — UUID, PK
- `userId` — UUID, FK -> User, indexed
- `commentId` — UUID, FK -> Comment, indexed
- `createdAt` — DateTime
- **UNIQUE(userId, commentId)** — one like per user per comment
- **Composite index:** `(commentId, createdAt DESC, id DESC)` for paginated likes-list

### Design Notes
- Like tables are split to eliminate invalid states (no CHECK constraint needed, no nullable FKs)
- Denormalized `likeCount` and `commentCount` avoid COUNT(*) queries on hot read paths — updated atomically via Prisma transactions on like/comment create/delete
- Composite index on Post `(createdAt DESC, id DESC)` ensures stable cursor pagination under concurrent writes

---

## API Routes

### Auth
- `POST /api/auth/register` — Create account (validates, hashes, sets JWT cookie)
- `POST /api/auth/login` — Login, returns httpOnly JWT cookie
- `POST /api/auth/logout` — Clears the cookie
- `GET /api/auth/me` — Returns current user from JWT

### Posts
- `GET /api/posts` — Feed (cursor pagination, visibility filtering)
- `POST /api/posts` — Create post (text + optional image + visibility: PUBLIC|PRIVATE, defaults PUBLIC). If `imageUrl` is provided, server validates it matches the pattern `https://res.cloudinary.com/<our_cloud_name>/` before accepting — rejects arbitrary external URLs.
- `GET /api/posts/:id` — Single post with comments (authorization checked)
- `DELETE /api/posts/:id` — Delete own post

### Likes
- `POST /api/posts/:id/like` — Like a post (creates PostLike, increments likeCount)
- `DELETE /api/posts/:id/like` — Unlike a post (deletes PostLike, decrements likeCount)
- `POST /api/comments/:id/like` — Like a comment
- `DELETE /api/comments/:id/like` — Unlike a comment
- `GET /api/posts/:id/likes` — List who liked a post (paginated, limit 50, cursor-based)
- `GET /api/comments/:id/likes` — List who liked a comment (paginated, limit 50, cursor-based)

**Like/unlike uses explicit create/delete (not toggle).** Server always returns the final like state and count so optimistic UI can reconcile. **Idempotency:** POST /like returns 200 with `{liked: true}` if already liked (no error, no duplicate). DELETE /like returns 200 with `{liked: false}` if not currently liked. This makes retries and optimistic rollbacks safe.

### Comments
- `GET /api/posts/:id/comments` — Get top-level comments for a post (cursor-paginated, limit 20, each includes up to 3 latest replies inline)
- `GET /api/comments/:id/replies` — Get replies for a specific comment (cursor-paginated, limit 20; used for "load more replies")
- `POST /api/posts/:id/comments` — Add comment or reply. If `parentId` is set, server validates: (a) parent belongs to same postId, (b) parent itself has no parentId (i.e., parent is top-level) — this enforces exactly 2-level threading, rejecting reply-to-reply with 400
- `DELETE /api/comments/:id` — Soft delete own comment (resolves parent post, checks visibility). See Delete Behavior section below.

### Upload
- `POST /api/upload/signature` — Generate Cloudinary signed upload params (timestamp, signature, api_key, upload_preset). Client then uploads directly to Cloudinary's upload endpoint using these params. This avoids proxying large files through our API.

---

## Auth Flow & Security

### Registration
1. Client submits firstName, lastName, email, password
2. Server validates: email format, email normalized to lowercase/trimmed, password min 8 chars with at least one letter and one number, email not already taken
3. Password hashed with bcrypt (12 salt rounds)
4. User created in DB
5. JWT signed with `jose` (HS256, contains userId, 7-day expiry)
6. Set as `httpOnly`, `secure`, `sameSite: lax`, `path: /` cookie
7. Redirect to /feed

### Login
1. Client submits email, password
2. Email normalized to lowercase/trimmed
3. Server finds user by email, compares with `bcrypt.compare()`
4. Same JWT + cookie flow as registration
5. Redirect to /feed

### Route Protection — Two Layers

**Layer 1: Middleware (UX optimization)**
- `middleware.ts` runs on every request
- Reads JWT from cookie, verifies with `jose`
- Protected routes (/feed) -> no valid token -> redirect to /login
- Auth routes (/login, /register) -> valid token -> redirect to /feed

**Layer 2: API route guards (authoritative)**
- Every mutating/protected API route calls `requireUser(request)` helper
- Returns parsed user from JWT or throws 401
- This is the real security boundary — middleware is convenience only

### Security Measures
- **httpOnly cookies** — no JS access, prevents XSS token theft
- **bcrypt** for passwords (not SHA/MD5)
- **Prisma parameterized queries** — SQL injection prevented
- **Input validation** on all API routes (reject malformed data early)
- **sameSite: lax** + no GET mutations — CSRF safe
- **Rate limiting** on auth endpoints via Upstash Redis (serverless-compatible, works across Vercel function instances): 5 login attempts per minute per IP, 3 registration attempts per minute per IP. Uses `@upstash/ratelimit` with sliding window algorithm.
- **Email normalization** — lowercase, trimmed before storage and lookup
- **Password policy** — minimum 8 chars, at least one letter and one number
- **Auth error logging** — log failed login attempts (no sensitive data in logs)
- **XSS prevention:** All user-generated content (posts, comments, names) rendered as plain text via React's default escaping. **Never use `dangerouslySetInnerHTML`**. No HTML/markdown parsing of user content.
- **Security headers** via `next.config.js` headers: `Content-Security-Policy` (restrict scripts to self, restrict styles to self + fonts.googleapis.com), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`

### Input Validation Rules

| Field | Rules |
|-------|-------|
| `firstName` | Required, trimmed, 1-50 chars |
| `lastName` | Required, trimmed, 1-50 chars |
| `email` | Required, valid email format, lowercase, trimmed, max 255 chars |
| `password` | Required, 8-128 chars, at least one letter and one number |
| `post.content` | Required (unless image provided), trimmed, max 5000 chars |
| `post.visibility` | Required, must be `PUBLIC` or `PRIVATE` |
| `post.imageUrl` | Optional, must match `https://res.cloudinary.com/<cloud_name>/` |
| `comment.content` | Required, trimmed, 1-2000 chars |
| `comment.parentId` | Optional UUID, must be top-level comment on same post |

All validated server-side. Client-side validation mirrors these for UX but is never trusted.

### Next.js Caching Policy

All authenticated routes and API endpoints must be fully dynamic — **no static caching** of user-specific content.

- **`/feed` page:** `export const dynamic = 'force-dynamic'` — prevents stale private/public content across users
- **All `/api/*` routes:** Already dynamic by default in App Router route handlers (no action needed)
- **`/api/auth/me`:** Dynamic, returns current user from cookie
- **Fetch calls in Server Components:** Use `{ cache: 'no-store' }` for any data that depends on the authenticated user
- **Static pages:** Only `/login` and `/register` can be static (no user-specific content)

---

## Authorization Matrix — Private Posts

| Action | Public Post | Private Post (author) | Private Post (others) |
|--------|------------|----------------------|----------------------|
| See in feed | Yes | Yes | **No (filtered out)** |
| View directly (GET /api/posts/:id) | Yes | Yes | **403** |
| Like/unlike | Yes | Yes | **403** |
| Comment/reply | Yes | Yes | **403** |
| View likes list | Yes | Yes | **403** |
| View comments | Yes | Yes | **403** |
| Delete | Own only | Yes | **403** |

**Rule:** Private posts are invisible to non-authors at every level. If you can't see the post, you can't interact with it in any way.

**Enforcement:**
- All API endpoints that take a `postId` verify visibility before proceeding
- All API endpoints that take a `commentId` resolve the parent post first, then verify visibility — this covers: `POST/DELETE /api/comments/:id/like`, `GET /api/comments/:id/likes`, `DELETE /api/comments/:id`
- A shared `requirePostAccess(postId, userId)` helper handles both cases: direct post endpoints call it with the postId param, comment endpoints call it after resolving `comment.postId`

---

## Delete Behavior

### Deleting a Post
- **Hard delete** the post record (CASCADE deletes all associated Comments, PostLikes, CommentLikes via Prisma `onDelete: Cascade`)
- Cloudinary image cleanup: best-effort async deletion via Cloudinary admin API (non-blocking — if it fails, orphaned image is acceptable)
- No counter adjustments needed since the parent entity is gone

### Deleting a Comment
- **Soft delete** — set `deletedAt` to current timestamp. The comment remains in DB to preserve reply thread structure.
- UI shows "This comment has been deleted" placeholder instead of content
- `likeCount` stays as-is (likes on deleted comments are frozen)
- Parent post's `commentCount` is decremented by 1 (atomic Prisma transaction)
- If a top-level comment is soft-deleted and all its replies are also soft-deleted, the entire thread can be hidden in the UI

### Why soft delete for comments?
Hard-deleting a top-level comment would orphan all its replies (broken `parentId` references) or require cascading deletion of replies the author didn't write. Soft delete preserves thread integrity while respecting the author's intent.

---

## Page Structure

### Routes
- `/` — Redirect to /feed if logged in, /login if not
- `/login` — Login page (public)
- `/register` — Registration page (public)
- `/feed` — Feed page (protected)

### Middleware
- `middleware.ts` — JWT verification on every request
  - Protected routes -> redirect to /login if no token
  - Auth routes -> redirect to /feed if already logged in

### Components
- `auth/` — LoginForm, RegisterForm
- `feed/` — FeedLayout, CreatePost, PostCard, PostFeed, LikeButton, LikesList, CommentSection, CommentCard, ReplyCard
- `layout/` — Navbar, LeftSidebar, RightSidebar
- `ui/` — DarkModeToggle, Avatar

---

## Design Fidelity

The task requires sticking to the provided HTML/CSS design exactly. To ensure this:

- **Preserve original HTML structure and CSS class names** — React components wrap the exact same markup from the provided HTML files
- **Import all 4 CSS files as-is:** bootstrap.min.css, common.css, main.css, responsive.css
- **No Tailwind, no CSS modules, no styled-components** — only the provided CSS
- **Components extract sections from the original HTML** — e.g., the navbar markup in feed.html becomes the Navbar component with identical class names and structure
- **Visual verification** — side-by-side comparison of original HTML pages vs React rendering before submission

---

## Feed Pagination

- **Sort:** `ORDER BY createdAt DESC, id DESC` (stable ordering under concurrent writes)
- **Cursor:** composite `(createdAt, id)` — client sends last post's createdAt + id
- **Page size:** 10 posts per request
- **Infinite scroll:** Intersection Observer on sentinel div at bottom of feed
- **Custom hook:** `useInfiniteScroll` watches sentinel, triggers next fetch
- **Feed query filters:** `WHERE (visibility = 'PUBLIC' OR authorId = currentUserId) AND (createdAt, id) < cursor`

---

## Image Upload Flow & Security

**Flow:** Client calls `POST /api/upload/signature` -> server validates auth, generates Cloudinary signed params -> client uploads directly to Cloudinary's REST endpoint using signed params -> Cloudinary returns URL -> client includes URL in post creation request.

- **MIME allowlist:** only `image/jpeg`, `image/png`, `image/gif`, `image/webp` (enforced via Cloudinary upload preset `allowed_formats`)
- **Size limit:** 5MB max (enforced via Cloudinary upload preset `max_file_size`, also validated client-side before upload)
- **Signed uploads:** server generates signature using Cloudinary API secret — client never has the secret, only the one-time signed params
- **Image transformations:** auto-format, auto-quality, max width 1200px via Cloudinary URL transforms
- **Orphan cleanup:** if post creation fails after image upload, the imageUrl is not persisted (orphaned images acceptable at free-tier scale; Cloudinary admin API can clean up later)

---

## UX States

| State | Behavior |
|-------|----------|
| **Loading (feed)** | Skeleton cards matching PostCard layout |
| **Loading (comments)** | Spinner below post |
| **Empty feed** | "No posts yet. Be the first to share something!" message |
| **Form errors** | Inline error messages below each input field (red text) |
| **Auth errors** | "Invalid email or password" (generic, no user enumeration) |
| **Upload progress** | Progress bar or percentage in CreatePost area |
| **Optimistic like** | Instant UI update; revert on server error with brief toast |
| **Network error** | Toast notification: "Something went wrong. Please try again." |
| **Disabled submit** | Button disabled + spinner while request in flight (prevents double submit) |

### Accessibility

While the original HTML design has limited accessibility, we improve where possible without breaking the design:

- **Form labels:** All inputs have associated `<label>` elements (already in original design — preserve them)
- **Button labels:** Icon-only buttons (like, comment, dark mode toggle) get `aria-label` attributes
- **Focus management:** After login/register redirect, focus moves to main content. After adding a comment, focus returns to the comment input.
- **Keyboard navigation:** All interactive elements (buttons, links, form controls) are keyboard-accessible via native HTML elements (no div-as-button)
- **Error announcements:** Form validation errors use `aria-live="polite"` region so screen readers announce them
- **Toast notifications:** Use `role="alert"` for network error toasts
- **Likes list modal:** Uses `role="dialog"`, `aria-modal="true"`, focus trapped inside, Escape key closes it
- **Loading states:** Skeleton loaders have `aria-busy="true"` on the feed container

---

## Scale Considerations

This is a demo deployment on free-tier infrastructure. However, the architecture is designed with production scale in mind:

### What We Build (demo)
- Neon free-tier PostgreSQL with Prisma connection pooling
- Denormalized counters on Post and Comment (avoid COUNT queries)
- Composite indexes for feed pagination
- Cursor-based pagination (no OFFSET)
- Cloudinary for image offloading

### Production-Scale Design Notes (documented for evaluators)
- **Read replicas:** Neon supports read replicas; feed reads would route to replica
- **Caching:** Feed and popular posts would use Redis/Vercel KV for hot read paths
- **Connection pooling:** Neon's built-in serverless pooler handles connection limits; at scale, PgBouncer or Prisma Accelerate
- **Denormalized counters** eliminate N+1 COUNT queries — updated atomically in transactions
- **CDN:** Cloudinary serves images from edge; static assets via Vercel CDN
- **Horizontal scaling:** Vercel serverless functions scale automatically; DB is the bottleneck, solved by read replicas + caching

These notes will be included in the README to demonstrate awareness of production architecture.

---

## Quality Gates & Testing Strategy

Tests serve two purposes: (1) AI agents verify their own work after each task, (2) evaluators see professional test coverage.

### Testing Layers

| Layer | Tool | Purpose | When to Run |
|-------|------|---------|-------------|
| **Unit tests** | Vitest | Auth helpers, validators, authorization logic | After each backend task |
| **API integration tests** | Vitest + fetch | Full API flows against local dev server | After each API endpoint is built |
| **E2E tests** | Playwright (via MCP) | Full user flows in real browser | After each UI feature is complete |
| **Visual verification** | Playwright screenshots | Compare React pages to original HTML design | After UI conversion tasks |

### Unit Tests (Vitest)
- JWT sign/verify with valid, expired, and tampered tokens
- Password hash/compare
- Input validators (email format, password policy, visibility enum)
- `requireUser()` guard — returns user or throws 401
- `requirePostAccess()` — returns post or throws 403 for private posts
- Email normalization (lowercase, trim)

### API Integration Tests (Vitest)
- **Auth flow:** register → login → me → logout → me (401)
- **Registration validation:** duplicate email (409), invalid email (400), weak password (400)
- **Login validation:** wrong password (401), non-existent email (401), generic error message (no user enumeration)
- **Post CRUD:** create public post, create private post, get feed (private post hidden from other user), get own feed (private post visible), delete own post, delete other's post (403)
- **Like/unlike:** like a post, like again (idempotent 200), unlike, unlike again (idempotent 200), check likeCount updates, check likes list returns correct users
- **Comments:** create comment, create reply, reply-to-reply rejected (400), cross-post reply rejected (400), delete own comment (soft delete), get paginated comments, get paginated replies
- **Comment likes:** same like/unlike tests as posts but on comments
- **Private post authorization:** other user cannot like/comment/view likes on private post (403)
- **Image URL validation:** reject non-Cloudinary URLs (400)

### E2E Tests (Playwright via MCP)
Playwright MCP server enables AI agents to run browser-based verification during development.

**Auth flows:**
- Register new user → lands on /feed
- Login existing user → lands on /feed
- Visit /feed without auth → redirected to /login
- Visit /login while logged in → redirected to /feed
- Invalid credentials → error message shown, no redirect

**Feed flows:**
- Create text-only post → appears at top of feed
- Create post with image → image displayed in post card
- Create private post → visible to author, not visible to other user (test with 2 browser contexts)
- Infinite scroll → load more posts on scroll to bottom

**Interaction flows:**
- Like a post → count increments, icon fills
- Unlike a post → count decrements, icon unfills
- Click likes count → see list of users who liked
- Add comment → appears under post, commentCount increments
- Reply to comment → appears nested under parent
- Like a comment → count increments
- Delete own post → removed from feed
- Delete own comment → shows "deleted" placeholder

**Dark mode:**
- Toggle dark mode → classes applied, persists after page reload

**Visual verification:**
- Screenshot /login, /register, /feed pages
- Compare layout and structure to original HTML pages (agent visual inspection)

### CI/Quality
- TypeScript strict mode
- ESLint + Prettier
- Prisma migration workflow: `prisma migrate dev` locally, `prisma migrate deploy` in production
- Environment validation: check required env vars (DATABASE_URL, JWT_SECRET, CLOUDINARY_*, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) on startup

### GitHub Actions CI Pipeline
```yaml
# .github/workflows/ci.yml — runs on push and PR to main
- Checkout code
- Setup Node 20
- Install dependencies (npm ci)
- Lint (eslint .)
- Type check (tsc --noEmit)
- Run unit + integration tests (vitest run)
- Run E2E tests (npx playwright test)
- Build (next build)
```
All gates must pass before merge. Keeps the repo clean for evaluators reviewing commit history.

### Agent Workflow Integration
After completing each implementation task, agents MUST:
1. Run relevant unit/integration tests to verify backend logic
2. Run relevant E2E tests to verify UI behavior
3. Fix any failures before marking the task as complete
4. This is a hard gate — no task is done until tests pass

---

## Deliverables Plan

### GitHub Repository
- Clean commit history with meaningful messages
- `.env.example` with all required variables documented
- README.md with: project overview, tech stack, setup instructions, environment variables, database setup, deployment steps, architecture decisions, scale considerations
- Demo credentials in README for evaluator testing

### Seed Data
- `prisma/seed.ts` creates demo users and sample posts/comments/likes so evaluator sees a populated feed immediately

### Live Deployment
- Vercel (frontend + API) + Neon (database)
- Environment variables configured in Vercel dashboard
- Seed data pre-loaded on production database

### Video Walkthrough
- Registration flow
- Login flow
- Creating a post (text + image)
- Public vs private post visibility
- Liking/unliking posts and comments
- Commenting and replying
- Viewing who liked
- Dark mode toggle
- Code walkthrough: project structure, key files, database schema, auth implementation

### Documentation
- README.md covers all decisions
- Design doc (this file) linked from README

---

## Out of Scope
- Forgot password
- Stories/story viewer
- Chat/messaging
- Friend requests
- Notifications
- Profile page
- Groups/events
- Search functionality
