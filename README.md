# BuddyScript

A full-stack social media application built with Next.js 14, featuring authentication, posts with image uploads, likes, comments with threaded replies, and privacy controls.

## Live Demo

**URL:** https://buddyscript-blue.vercel.app/

**Demo Credentials:**
| Email | Password |
|-------|----------|
| alice@demo.com | Demo1234 |
| bob@demo.com | Demo1234 |
| charlie@demo.com | Demo1234 |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Bootstrap + custom CSS (provided design) |
| Auth | Custom JWT (bcryptjs + jose, httpOnly cookies) |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Image Upload | Cloudinary (signed uploads) |
| Rate Limiting & Caching | Upstash Redis |
| Testing | Vitest (74 tests) + Playwright (22 E2E tests) |
| CI | GitHub Actions |
| Deployment | Vercel |

## Architecture Decisions

### Authentication
- JWT tokens stored in httpOnly cookies (not localStorage) to prevent XSS token theft
- HS256 signing with jose library
- Two-layer auth: middleware for UX redirects + `requireUser()` guard on every API route
- CSRF protection via Origin header validation on all state-changing requests
- Rate limiting on auth endpoints to prevent brute force

### Feed & Pagination
- **Cursor-based pagination** with composite cursor (`createdAt_id`) for consistent results even as new posts are created
- **Two-query merge strategy**: one query for public posts, one for the current user's private posts, merged and sorted — avoids complex OR conditions that defeat index usage
- **SSR first page** with client-side infinite scroll for subsequent pages
- Composite index `(createdAt DESC, id DESC)` optimized for the cursor query pattern

### Data Model
- **Denormalized counters** (`likeCount`, `commentCount`) on Post and Comment — avoids COUNT queries at scale
- **Separate like tables** (`PostLike`, `CommentLike`) instead of polymorphic — clear foreign keys, no ambiguity
- **Self-referencing comments** with `parentId` for threading (null = top-level, set = reply, max 2 levels)
- **Soft delete** for comments (preserves thread structure, shows "deleted" placeholder)

### Security
- Input validation with length bounds on all endpoints
- Private posts invisible to non-authors at every endpoint (feed, direct access, likes, comments)
- Returns 404 (not 403) for private posts to prevent existence enumeration
- Image uploads: MIME allowlist, 5MB limit, Cloudinary signed uploads
- Rate limiting on auth, post creation, comments, and uploads
- Password hashing with bcrypt (10 rounds)

### UI/UX
Beyond faithfully preserving the original HTML/CSS design, the app includes production-grade UX polish throughout:

**Authentication Forms**
- Password visibility toggle (eye icon) on login and both registration password fields
- Real-time inline validation on blur — per-field error (✗) and success (✓) indicators
- Live password-match indicator on the repeat password field
- Error border highlighting (red border + subtle box-shadow) on invalid fields
- Loading spinner on submit buttons ("Logging in…" / "Registering…") with button disabled during request
- Proper `autoComplete` attributes (`email`, `current-password`, `new-password`, `given-name`) for password manager support
- Terms & conditions agreement gate before registration

**Feed Interactions**
- Optimistic UI for likes with 300ms debounce, server-returned final state, and automatic revert on error
- Optimistic likes list — "Who liked this" modal instantly patches with current user on like/unlike
- Optimistic share counter with clipboard copy + server-side share tracking
- New post slide-in animation (fade + translateY) with auto-scroll to top of feed
- Skeleton loaders (shimmer animation) during infinite scroll loading
- Auto-expanding textareas for post composer, comments, and replies
- Character counter appears at 80% of limit, turns red at 95% — hidden for short messages
- Image preview with remove button before upload; client-side MIME + size validation before upload starts
- Multi-phase submit feedback: "Uploading…" → "Posting…" → default
- Image lightbox with zoom-in cursor hint, fullscreen overlay, Escape/click-outside dismiss
- "Scroll to top" floating pill with glassmorphism (backdrop blur), appears after 500px scroll
- Empty feed state with illustration and "Create your first post!" prompt
- Toast notifications (react-hot-toast) for all success/error feedback — no `alert()` calls

**Comments & Replies**
- Auto-focus comment input on section expand; auto-focus reply input on reply section expand
- Enter to submit, Shift+Enter for newline
- Submit button visually dimmed when input is empty
- Soft-deleted comments show at reduced opacity with italic "This comment has been deleted" — preserves thread context
- Reaction pill badges on comment/reply bubbles (clickable to open likes list)
- Like text turns bold + blue when actively liked

**Modals & Accessibility**
- Custom confirm dialog for all destructive actions (post/comment/reply delete) — replaces `window.confirm()`
- All modals: Escape key dismiss, click-outside dismiss, focus-on-mount, `role="dialog"` + `aria-modal`
- Confirm modal has fade-in + slide-in animation, loading state, and danger (red) styling
- Navbar profile dropdown: keyboard accessible (Enter/Space to toggle)
- Click-outside hook reused across post kebab menu, profile dropdown, and all modals (supports touch events)

**Navigation & Perceived Performance**
- Smart root redirect: `/` → `/feed` if authenticated, `/login` if not
- Auth-route guarding: logged-in users visiting `/login` or `/register` auto-redirect to `/feed`
- SSR first page for fast LCP, client-side infinite scroll for subsequent pages
- Live "time ago" timestamps that tick every 60 seconds without page refresh
- Network error handling on every fetch with user-friendly messages (never raw errors)

### Caching (Upstash Redis)
A multi-layer Redis caching strategy reduces API response times by 80-90% on cache hits while maintaining data freshness:

| Layer | Key Pattern | TTL | What It Caches |
|-------|-------------|-----|----------------|
| Feed Page | `feed:v1:{userId}:{cursor}:{limit}` | 30s | Full feed response (posts + per-user like/share state) |
| Session | `session:{tokenSuffix}` | 1h | Decoded JWT payload (avoids repeated crypto verification) |
| Post Counters | `cnt:post:{id}:{likes\|comments\|shares}` | 5min | Write-through like/comment/share counts |
| Comment Tree | `cmt:v1:{postId}:{userId}:{cursor}` | 60s | Formatted comment tree with replies |
| Replies | `rpl:v1:{commentId}:{userId}:{cursor}` | 60s | Reply listings per comment |

**Invalidation strategy:**
- User-scoped: when a user acts (like, comment, post), only *their* cache is invalidated — other users see updates within TTL
- Write-through counters: interaction counts are SET in Redis after every DB mutation
- Short TTLs as safety net: stale data self-heals even if explicit invalidation is missed
- Graceful degradation: if Redis is unavailable, all reads fall through to PostgreSQL seamlessly

## Project Structure

```
buddyscript/
├── prisma/
│   ├── schema.prisma          # Data model
│   ├── seed.ts                # Demo data
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # login, register, logout, me
│   │   │   ├── posts/         # CRUD, likes, comments
│   │   │   ├── comments/      # likes, replies, delete
│   │   │   └── upload/        # Cloudinary signature
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   └── feed/              # Protected feed page (SSR)
│   ├── components/
│   │   ├── auth/              # LoginForm, RegisterForm
│   │   ├── layout/            # Navbar, Sidebars, FeedLayout
│   │   └── feed/              # CreatePost, PostCard, PostFeed,
│   │                          # LikeButton, LikesList, CommentSection
│   ├── hooks/                 # useInfiniteScroll
│   ├── lib/                   # auth, db, feed, validators, rate-limit
│   └── middleware.ts          # Auth redirects + CSRF
├── e2e/                       # Playwright E2E tests
├── __tests__/                 # Vitest API integration tests
└── public/assets/             # CSS and static images
```

## Setup Instructions

### Prerequisites
- Node.js 20+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- [Cloudinary](https://cloudinary.com) account (free tier)
- [Upstash Redis](https://upstash.com) (free tier, optional — rate limiting skipped if not configured)

### Local Development

```bash
# Clone the repository
git clone <repo-url>
cd buddyscript

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database
npx prisma migrate deploy
npx prisma db seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` and log in with any demo account.

### Environment Variables

| Variable | Description |
|----------|------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (optional) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (optional) |

### Running Tests

```bash
# Unit + API integration tests (74 tests)
npx vitest run

# E2E tests (22 tests, requires dev server running)
npx playwright test

# Run specific test file
npx playwright test e2e/interactions.spec.ts
```

## Scale Considerations

This system is designed assuming millions of posts and reads:

- **Cursor-based pagination** avoids OFFSET performance degradation
- **Composite indexes** on all query paths (feed, comments, replies, likes)
- **Denormalized counters** eliminate COUNT(*) on hot paths
- **Two-query merge** for feed avoids OR conditions that prevent index usage
- **Multi-layer Redis caching** with short TTLs reduces DB load by ~80-90% on read-heavy paths
- **Write-through counters** in Redis provide instant feedback on interactions without extra DB reads
- **Rate limiting** via Redis protects against abuse
- **Connection pooling** via Prisma's built-in pool management

## What Was Built

- User registration and login with secure JWT auth
- Feed page with posts (newest first), infinite scroll
- Post creation with text and image upload
- Public/private post visibility
- Like/unlike system for posts, comments, and replies
- "Who liked this" modal for posts, comments, and replies
- Comments with threaded replies (2-level max)
- Soft delete for comments
- Post deletion
- CSRF protection, rate limiting, input validation
- Multi-layer Redis caching (feed, session, counters, comments)
- 74 API integration tests + 22 E2E browser tests
- CI pipeline with lint, typecheck, tests, build verification
- Seed data with 3 demo users and realistic content

## Out of Scope

- Forgot password / email verification
- Real-time updates (WebSockets)
- User profiles / avatars upload
- Friend system
- Notifications
- Dark mode
- Search functionality
- Mobile-responsive optimizations beyond provided CSS
