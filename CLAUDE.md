# PROJECT INSTRUCTIONS — READ BEFORE ANY ACTION

## Stakes

This project is for a competitive full-stack engineering role (50k-200k BDT/month). 1,000 people applied, 400 shortlisted.  This is the highest-priority task — every decision must be made as if the developer's career depends on it, because it does.

**Zero tolerance for:**
- Sloppy code, half-finished features, or placeholder implementations
- Security vulnerabilities (XSS, SQL injection, insecure auth)
- Skipping validation or error handling
- Breaking the provided design
- Unnecessary complexity or over-engineering

**Every line of code must be:**
- Production-grade and secure
- Clean, readable, and well-structured
- Following best practices for the chosen stack

---

## Task Description

Convert three provided HTML/CSS pages (Login, Register, Feed) into a React.js/Next.js application with backend and database.

### Requirements

**1. Authentication & Authorization**
- Secure auth system (JWT-based with httpOnly cookies)
- Registration: first name, last name, email, password
- Users sign up and log in to access the feed page
- No forgot password needed

**2. Feed Page**
- Protected route, accessible only to logged-in users
- All users see posts from all other users
- Posts displayed with most recent at top
- Focus on main functionality, ignore non-essential design elements

**Required feed functionalities:**
- Create posts with text and image
- Show posts newest first
- Display like/unlike state correctly
- Comments, replies, and their like/unlike system
- Show who has liked a post, comment, or reply
- Support private and public posts:
  - Private: visible only to the author
  - Public: visible to everyone

**3. Evaluation Criteria**
- Best practices for development, security, and performance
- Standard database design and modeling
- System designed assuming millions of posts and reads
- Security and UX are top priorities

**4. Deliverables**
- GitHub repository for code review
- Video walkthrough on YouTube (unlisted)
- Live deployed URL (recommended)
- Brief documentation of decisions made

---

## Tech Stack (Decided)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14 (App Router) |
| Styling | Existing Bootstrap + CSS files from provided design (DO NOT change the design) |
| Auth | Custom JWT (bcrypt + jose, httpOnly cookies) |
| ORM | Prisma |
| Database | PostgreSQL on Neon |
| Images | Cloudinary (free tier) |
| Deploy | Vercel |

---

## Design Constraint

**Stick to the provided HTML/CSS design exactly.** Do not change or use any alternative design. The existing CSS files (bootstrap.min.css, common.css, main.css, responsive.css) must be imported and used as-is. Convert HTML structure into React components faithfully.

---

## Key Architecture Decisions

- Cursor-based pagination for feed with composite index `(createdAt DESC, id DESC)`
- Infinite scroll via Intersection Observer
- Optimistic UI for likes with server-returned final state
- Comments use self-referencing parentId pattern (null = top-level, set = reply)
- Separate PostLike and CommentLike tables (no polymorphic ambiguity)
- Denormalized likeCount/commentCount on Post and Comment (avoid COUNT queries at scale)
- Visibility filtering at query level — private posts invisible to non-authors at every endpoint (feed, direct access, likes, comments)
- Two-layer auth: middleware for UX redirects + `requireUser()` guard on every API route (401/403)
- Rate limiting on auth endpoints, email normalization, password policy
- Explicit like/unlike (POST/DELETE, not toggle)
- Image uploads: MIME allowlist, 5MB limit, Cloudinary signed uploads
- Dark mode preserved from original design, state in localStorage
- Preserve exact HTML structure and CSS class names from provided design

---

## Testing & Verification

Every implementation task MUST be verified before marking complete. Tests are gates, not optional.

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit tests | Vitest | Auth helpers, validators, authorization logic |
| API integration tests | Vitest + fetch | Full API flows against local dev server |
| E2E tests | Playwright (via MCP) | Full user flows in real browser |
| Visual verification | Playwright screenshots | Compare React pages to original HTML design |

**Agent workflow:** After each task → run relevant tests → fix failures → then mark complete.

---

## Design Doc

Full design document: `docs/plans/2026-04-01-buddyscript-fullstack-design.md`
