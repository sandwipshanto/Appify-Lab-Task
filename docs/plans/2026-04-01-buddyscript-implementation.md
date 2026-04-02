# BuddyScript Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert 3 static HTML/CSS pages into a full-stack Next.js social media app with auth, feed, posts, likes, comments, and deployment.

**Architecture:** Next.js 14 App Router monorepo with custom JWT auth, Prisma ORM, PostgreSQL (Neon), Cloudinary image uploads, deployed on Vercel.

**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL, bcrypt, jose, Cloudinary, Upstash Redis, Vitest, Playwright, Bootstrap (existing CSS)

**Design Doc:** `docs/plans/2026-04-01-buddyscript-fullstack-design.md`

---

## Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `buddyscript/` (new Next.js project root)
- Create: `buddyscript/.env.example`
- Create: `buddyscript/.env.local`
- Create: `buddyscript/next.config.js`
- Create: `buddyscript/.eslintrc.json`
- Create: `buddyscript/.prettierrc`
- Create: `buddyscript/tsconfig.json` (auto-generated, verify strict)

**Step 1: Create Next.js project**

```bash
cd "F:/AppifyLab Task"
npx create-next-app@14 buddyscript --typescript --eslint --app --src-dir --no-tailwind --import-alias "@/*"
```

**Step 2: Install dependencies**

```bash
cd buddyscript
npm install prisma @prisma/client bcryptjs jose @upstash/ratelimit @upstash/redis cloudinary
npm install -D @types/bcryptjs vitest @vitejs/plugin-react @playwright/test tsx wait-on
```

**Step 3: Configure TypeScript strict mode**

Verify `tsconfig.json` has `"strict": true`. If not, set it.

**Step 4: Create .env.example**

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Auth
JWT_SECRET="your-secret-key-min-32-chars"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

**Step 5: Configure next.config.js with safe baseline security headers**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

Do **not** add a static `Content-Security-Policy` string with `script-src 'self'` here. In Next.js App Router that can block framework hydration scripts and break the app. If you later add CSP, implement it with nonces/hashes and verify it against the deployed build.

**Step 6: Configure ESLint and Prettier**

`.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**Step 7: Create environment validation**

Create `buddyscript/src/lib/env.ts`:
```ts
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

Wire it into app startup — call `validateEnv()` at the top of `src/app/layout.tsx` (server component, runs once on startup):
```ts
import { validateEnv } from '@/lib/env';
validateEnv();
```

**Step 8: Setup Playwright early**

Playwright must be available from the first UI task so agents can verify with E2E tests immediately.

```bash
npx playwright install chromium
```

Create `buddyscript/playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
});
```

Create `buddyscript/e2e/.gitkeep` so the directory exists.

**Step 9: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js project with TypeScript, ESLint, security headers, env validation"
```

---

## Task 2: Copy CSS Assets & Configure Styling

**Files:**
- Copy: `assets/css/*` → `buddyscript/public/assets/css/`
- Copy: `assets/images/*` → `buddyscript/public/assets/images/`
- Copy: `assets/fonts/*` → `buddyscript/public/assets/fonts/`
- Copy: `assets/js/bootstrap.bundle.min.js` → `buddyscript/public/assets/js/`
- Create: `buddyscript/src/app/layout.tsx` (update with CSS imports)

**Step 1: Copy all static assets**

```bash
cp -r "../assets" "buddyscript/public/assets"
```

**Step 2: Update root layout with CSS and font imports**

`buddyscript/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buddy Script',
  icons: { icon: '/assets/images/logo-copy.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/common.css" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="stylesheet" href="/assets/css/responsive.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Step 3: Verify CSS loads correctly**

Run: `npm run dev`
Visit `http://localhost:3000` — verify fonts load, no 404s on CSS/images in browser console.

**Step 4: Commit**

```bash
git add .
git commit -m "feat: copy static assets and configure CSS/font imports in root layout"
```

---

## Task 3: Prisma Schema & Database Setup

**Files:**
- Create: `buddyscript/prisma/schema.prisma`
- Create: `buddyscript/src/lib/db.ts`

**Step 1: Initialize Prisma**

```bash
cd buddyscript
npx prisma init
```

**Step 2: Write the Prisma schema**

`buddyscript/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Visibility {
  PUBLIC
  PRIVATE
}

model User {
  id        String   @id @default(uuid())
  firstName String   @db.VarChar(50)
  lastName  String   @db.VarChar(50)
  email     String   @unique @db.VarChar(255)
  password  String
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts        Post[]
  comments     Comment[]
  postLikes    PostLike[]
  commentLikes CommentLike[]

  // Note: @unique on email already creates an index, no need for @@index([email])
  @@index([createdAt])
}

model Post {
  id           String     @id @default(uuid())
  content      String     @db.Text
  imageUrl     String?
  visibility   Visibility @default(PUBLIC)
  authorId     String
  likeCount    Int        @default(0)
  commentCount Int        @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  author   User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments Comment[]
  likes    PostLike[]

  @@index([authorId])
  @@index([createdAt(sort: Desc), id(sort: Desc)])
  @@index([authorId, visibility, createdAt(sort: Desc), id(sort: Desc)])
  @@index([visibility, createdAt(sort: Desc), id(sort: Desc)])
}

model Comment {
  id        String    @id @default(uuid())
  content   String    @db.Text
  postId    String
  authorId  String
  parentId  String?
  likeCount Int       @default(0)
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  post    Post          @relation(fields: [postId], references: [id], onDelete: Cascade)
  author  User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent  Comment?      @relation("CommentReplies", fields: [parentId], references: [id], onDelete: SetNull)
  replies Comment[]     @relation("CommentReplies")
  likes   CommentLike[]

  @@index([postId, parentId, createdAt(sort: Desc), id(sort: Desc)])
  @@index([authorId])
}

model PostLike {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([postId, createdAt(sort: Desc), id(sort: Desc)])
}

model CommentLike {
  id        String   @id @default(uuid())
  userId    String
  commentId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  comment Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([userId, commentId])
  @@index([commentId, createdAt(sort: Desc), id(sort: Desc)])
}
```

**Step 3: Create Prisma client singleton**

`buddyscript/src/lib/db.ts`:
```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Step 4: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration created and applied, Prisma client generated.

**Step 5: Verify by running Prisma Studio**

```bash
npx prisma studio
```

Expected: Opens browser, shows all 5 tables with correct columns.

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Prisma schema with User, Post, Comment, PostLike, CommentLike tables"
```

---

## Task 4: Auth Helpers & Utilities

**Files:**
- Create: `buddyscript/src/lib/auth.ts`
- Create: `buddyscript/src/lib/validators.ts`
- Create: `buddyscript/src/lib/rate-limit.ts`
- Test: `buddyscript/src/__tests__/lib/auth.test.ts`
- Test: `buddyscript/src/__tests__/lib/validators.test.ts`

**Step 1: Write unit tests for auth helpers**

`buddyscript/src/__tests__/lib/auth.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, signJWT, verifyJWT } from '@/lib/auth';

describe('Password hashing', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('Test1234');
    expect(hash).not.toBe('Test1234');
    expect(await comparePassword('Test1234', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});

describe('JWT', () => {
  it('signs and verifies a token', async () => {
    const token = await signJWT({ userId: 'test-id' });
    const payload = await verifyJWT(token);
    expect(payload.userId).toBe('test-id');
  });

  it('rejects a tampered token', async () => {
    const token = await signJWT({ userId: 'test-id' });
    await expect(verifyJWT(token + 'x')).rejects.toThrow();
  });
});
```

**Step 2: Write unit tests for validators**

`buddyscript/src/__tests__/lib/validators.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validateRegistration, validateLogin, validatePost, validateComment } from '@/lib/validators';

describe('validateRegistration', () => {
  it('accepts valid input', () => {
    const result = validateRegistration({
      firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'Test1234',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty firstName', () => {
    const result = validateRegistration({
      firstName: '', lastName: 'Doe', email: 'john@example.com', password: 'Test1234',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak password', () => {
    const result = validateRegistration({
      firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = validateRegistration({
      firstName: 'John', lastName: 'Doe', email: 'notanemail', password: 'Test1234',
    });
    expect(result.success).toBe(false);
  });

  it('normalizes email to lowercase', () => {
    const result = validateRegistration({
      firstName: 'John', lastName: 'Doe', email: '  JOHN@Example.COM  ', password: 'Test1234',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('john@example.com');
  });
});

describe('validatePost', () => {
  it('accepts text post', () => {
    const result = validatePost({ content: 'Hello world', visibility: 'PUBLIC' });
    expect(result.success).toBe(true);
  });

  it('rejects empty content without image', () => {
    const result = validatePost({ content: '', visibility: 'PUBLIC' });
    expect(result.success).toBe(false);
  });

  it('accepts empty content with image', () => {
    const result = validatePost({ content: '', visibility: 'PUBLIC', imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid visibility', () => {
    const result = validatePost({ content: 'Hello', visibility: 'INVALID' });
    expect(result.success).toBe(false);
  });
});

describe('validateComment', () => {
  it('accepts valid comment', () => {
    const result = validateComment({ content: 'Nice post!' });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = validateComment({ content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects content over 2000 chars', () => {
    const result = validateComment({ content: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
npx vitest run
```

Expected: FAIL — modules not found.

**Step 4: Implement auth helpers**

`buddyscript/src/lib/auth.ts`:
```ts
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = 'token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signJWT(payload: { userId: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as { userId: string };
}

export async function setAuthCookie(userId: string): Promise<void> {
  const token = await signJWT({ userId });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function requireUser(): Promise<{ userId: string }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    return await verifyJWT(token);
  } catch {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
}

export async function requirePostAccess(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  if (post.visibility === 'PRIVATE' && post.authorId !== userId) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  return post;
}
```

**Step 5: Implement validators**

`buddyscript/src/lib/validators.ts`:
```ts
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export function validateRegistration(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): ValidationResult<{ firstName: string; lastName: string; email: string; password: string }> {
  const errors: Record<string, string> = {};
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();
  const email = input.email?.trim().toLowerCase();
  const password = input.password;

  if (!firstName || firstName.length > 50) errors.firstName = 'First name is required (max 50 chars)';
  if (!lastName || lastName.length > 50) errors.lastName = 'Last name is required (max 50 chars)';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
    errors.email = 'Valid email is required';
  if (!password || password.length < 8 || password.length > 128)
    errors.password = 'Password must be 8-128 characters';
  else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    errors.password = 'Password must contain at least one letter and one number';

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { firstName, lastName, email, password } };
}

export function validateLogin(input: { email: string; password: string }): ValidationResult<{ email: string; password: string }> {
  const errors: Record<string, string> = {};
  const email = input.email?.trim().toLowerCase();
  const password = input.password;

  if (!email) errors.email = 'Email is required';
  if (!password) errors.password = 'Password is required';

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { email, password } };
}

export function validatePost(input: {
  content: string;
  visibility: string;
  imageUrl?: string;
}): ValidationResult<{ content: string; visibility: 'PUBLIC' | 'PRIVATE'; imageUrl?: string }> {
  const errors: Record<string, string> = {};
  const content = input.content?.trim();
  const visibility = input.visibility;
  const imageUrl = input.imageUrl?.trim();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!content && !imageUrl) errors.content = 'Post must have text or an image';
  if (content && content.length > 5000) errors.content = 'Post content max 5000 characters';
  if (visibility !== 'PUBLIC' && visibility !== 'PRIVATE') errors.visibility = 'Visibility must be PUBLIC or PRIVATE';
  if (imageUrl && cloudName && !imageUrl.startsWith(`https://res.cloudinary.com/${cloudName}/`))
    errors.imageUrl = 'Invalid image URL';

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { content: content || '', visibility: visibility as 'PUBLIC' | 'PRIVATE', imageUrl } };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateComment(input: {
  content: string;
  parentId?: string;
}): ValidationResult<{ content: string; parentId?: string }> {
  const errors: Record<string, string> = {};
  const content = input.content?.trim();

  if (!content || content.length < 1) errors.content = 'Comment cannot be empty';
  if (content && content.length > 2000) errors.content = 'Comment max 2000 characters';
  if (input.parentId && !UUID_REGEX.test(input.parentId)) errors.parentId = 'Invalid parent comment ID';

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { content, parentId: input.parentId } };
}
```

**Step 6: Implement rate limiter**

`buddyscript/src/lib/rate-limit.ts`:
```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'ratelimit:login',
});

export const registerRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 m'),
  prefix: 'ratelimit:register',
});

export const createPostRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:post',
});

export const commentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'ratelimit:comment',
});

export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'ratelimit:upload',
});

export function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
```

**Step 7: Configure Vitest**

Create `buddyscript/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 8: Run tests to verify they pass**

```bash
npx vitest run
```

Expected: All auth and validator tests PASS.

**Step 9: Commit**

```bash
git add .
git commit -m "feat: add auth helpers (JWT, bcrypt), validators, rate limiting, with unit tests"
```

---

## Task 5: Auth API Routes

**Files:**
- Create: `buddyscript/src/app/api/auth/register/route.ts`
- Create: `buddyscript/src/app/api/auth/login/route.ts`
- Create: `buddyscript/src/app/api/auth/logout/route.ts`
- Create: `buddyscript/src/app/api/auth/me/route.ts`
- Test: `buddyscript/src/__tests__/api/auth.test.ts`

**Step 1: Write integration tests for auth API**

All state-changing integration tests in Tasks 5, 8, 9, 10, and 11 must send `Origin: ORIGIN` so the same-origin CSRF check is exercised in CI instead of being bypassed in tests.

`buddyscript/src/__tests__/api/auth.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ORIGIN = new URL(BASE_URL).origin;
const JSON_HEADERS = { 'Content-Type': 'application/json', Origin: ORIGIN };

describe('Auth API', () => {
  let authCookie: string;

  it('registers a new user', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        firstName: 'Test', lastName: 'User',
        email: `test-${Date.now()}@example.com`, password: 'Test1234',
      }),
    });
    expect(res.status).toBe(201);
    authCookie = res.headers.get('set-cookie') || '';
    expect(authCookie).toContain('token=');
  });

  it('rejects duplicate email', async () => {
    const email = `dup-${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ firstName: 'A', lastName: 'B', email, password: 'Test1234' }),
    });
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ firstName: 'C', lastName: 'D', email, password: 'Test1234' }),
    });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    const email = `login-${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ firstName: 'A', lastName: 'B', email, password: 'Test1234' }),
    });
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password: 'Test1234' }),
    });
    expect(res.status).toBe(200);
    authCookie = res.headers.get('set-cookie') || '';
    expect(authCookie).toContain('token=');
  });

  it('rejects wrong password', async () => {
    const email = `wrong-${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ firstName: 'A', lastName: 'B', email, password: 'Test1234' }),
    });
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password: 'Wrong123' }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid email or password');
  });

  it('returns current user with valid cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: authCookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBeDefined();
  });

  it('returns 401 without cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    expect(res.status).toBe(401);
  });

  it('clears cookie on logout', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: authCookie, Origin: ORIGIN },
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie') || '';
    expect(setCookie).toContain('token=');
    expect(setCookie).toContain('Max-Age=0');
  });
});
```

**Step 2: Implement register route**

`buddyscript/src/app/api/auth/register/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, setAuthCookie } from '@/lib/auth';
import { validateRegistration } from '@/lib/validators';
import { registerRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const { success: rateLimitOk } = await registerRateLimit.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await request.json();
  const validation = validateRegistration(body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const { firstName, lastName, email, password } = validation.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { firstName, lastName, email, password: hashedPassword },
  });

  await setAuthCookie(user.id);

  return NextResponse.json(
    { user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } },
    { status: 201 }
  );
}
```

**Step 3: Implement login route**

`buddyscript/src/app/api/auth/login/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, setAuthCookie } from '@/lib/auth';
import { validateLogin } from '@/lib/validators';
import { loginRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const { success: rateLimitOk } = await loginRateLimit.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await request.json();
  const validation = validateLogin(body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const { email, password } = validation.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await comparePassword(password, user.password))) {
    console.error(`[AUTH] Failed login attempt from IP: ${ip}`);
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await setAuthCookie(user.id);

  return NextResponse.json({
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
  });
}
```

**Step 4: Implement logout and me routes**

`buddyscript/src/app/api/auth/logout/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
```

`buddyscript/src/app/api/auth/me/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { userId } = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

**Step 5: Implement middleware**

`buddyscript/src/middleware.ts`:
```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const protectedRoutes = ['/feed'];
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF protection: validate Origin header on state-changing requests to API routes
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (!origin || new URL(origin).host !== host) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const token = request.cookies.get('token')?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  if (pathname === '/' ) {
    return NextResponse.redirect(new URL(isAuthenticated ? '/feed' : '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/feed/:path*', '/login', '/register', '/api/:path*'],
};
```

**Step 6: Run integration tests**

Start dev server in one terminal, run tests in another:
```bash
npm run dev &
npx vitest run src/__tests__/api/auth.test.ts
```

Expected: All auth tests PASS.

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add auth API routes (register, login, logout, me) with middleware and integration tests"
```

---

## Task 6: Login & Registration Pages (UI)

**Files:**
- Create: `buddyscript/src/app/login/page.tsx`
- Create: `buddyscript/src/app/register/page.tsx`
- Create: `buddyscript/src/components/auth/LoginForm.tsx`
- Create: `buddyscript/src/components/auth/RegisterForm.tsx`

**Step 1: Convert login.html to LoginForm component**

Extract the form section from the original `login.html` (lines 26-110) into a React Client Component. Preserve all CSS class names and HTML structure exactly. Add:
- Controlled inputs with `name` and `id` attributes
- Form submission handler that calls `/api/auth/login`
- Inline error display with `aria-live="polite"`
- Disabled button + spinner during submission
- Link to `/register` page

**Step 2: Convert registration.html to RegisterForm component**

Extract from original `registration.html` (lines 26-115). Same approach. Fix the bugs from original:
- Button text: "Register now" (not "Login now")
- Bottom text: "Already have an account? Login" (not "Don't have an account?")
- Use `type="checkbox"` for terms agreement (not radio)

**Required functional additions (not in original HTML but required by task):**
- Add `firstName` and `lastName` fields: insert two new `_social_registration_form_input` divs above the existing Email field, reusing the exact same class structure (`_social_registration_form_input`, `_social_registration_label`, `_social_registration_input`, `_mar_b14`, `_mar_b8`). This preserves visual consistency using existing CSS.
- These are the ONLY additions to the registration page markup.

**Step 3: Create page wrappers**

`buddyscript/src/app/login/page.tsx` and `buddyscript/src/app/register/page.tsx` — server components that render the background shapes + the form component.

**Step 4: Write E2E tests for auth pages**

Create `buddyscript/e2e/auth.spec.ts`:
- Visit `/login` — verify form elements visible, layout matches original
- Visit `/register` — verify form elements visible, layout matches original
- Register a new user → verify redirect to `/feed` (will show empty feed page placeholder until Task 7)
- Login with valid credentials → verify redirect
- Login with invalid credentials → verify inline error message, no redirect
- Visit `/login` while logged in → verify redirect to `/feed`
- Visit `/feed` without auth → verify redirect to `/login`
- Take screenshots of `/login` and `/register` for visual comparison

**Step 5: Run E2E tests**

```bash
npx playwright test e2e/auth.spec.ts
```

Expected: All PASS.

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add login and registration pages with E2E tests matching original design"
```

---

## Task 7: Feed Page Layout & Navbar

**Files:**
- Create: `buddyscript/src/app/feed/page.tsx`
- Create: `buddyscript/src/components/layout/Navbar.tsx`
- Create: `buddyscript/src/components/layout/LeftSidebar.tsx`
- Create: `buddyscript/src/components/layout/RightSidebar.tsx`
- Create: `buddyscript/src/components/layout/FeedLayout.tsx`
- Create: `buddyscript/src/components/ui/DarkModeToggle.tsx`

**Step 1: Create Navbar component**

Extract from `feed.html` (lines 51-549). Convert inline SVGs to React. Include profile dropdown (Client Component for toggle logic). **Simplify non-essential nav items** — keep the visual structure but remove or simplify inert elements (notification badges, friend request links, search bar) to static non-interactive placeholders. Focus engineering effort on scoring features, not pixel-perfect conversion of non-functional chrome.

**Step 2: Create LeftSidebar and RightSidebar**

Extract from `feed.html`. These are mostly static content. Keep them minimal — the task says "You may ignore most of the design elements — focus only on the main functionality of the feed." Sidebars should look reasonable but don't need full fidelity.

**Step 3: Create DarkModeToggle component** *(LOW PRIORITY — implement only after all scoring features are complete and tested)*

The dark mode toggle exists in the provided HTML/CSS design. Client Component. Use `localStorage` to persist state. Toggle `_dark_wrapper` class on the layout wrapper. **Skip this entirely if behind schedule** — it is not a scoring feature.

**Step 4: Create FeedLayout** *(CORE — required)*

3-column layout wrapper matching original `feed.html` structure. Uses the existing `_layout_inner_wrap`, `_layout_left_wrap`, `_layout_middle_wrap`, `_layout_right_wrap` classes.

**Step 5: Create feed page**

`buddyscript/src/app/feed/page.tsx`:
```tsx
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { getFeedPage } from '@/lib/feed';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Server component: SSR first page using the same two-query merge strategy as the API.
// This gives instant content on load, then PostFeed (Client Component) handles infinite scroll.
export default async function FeedPage() {
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/login');
  const { userId } = await verifyJWT(token);

  const { posts, nextCursor: initialCursor } = await getFeedPage(userId, null, 10);

  return (
    <FeedLayout>
      <CreatePost userId={userId} />
      <PostFeed initialPosts={posts} initialCursor={initialCursor} userId={userId} />
    </FeedLayout>
  );
}
```

**Step 6: Write E2E tests for feed layout**

Create `buddyscript/e2e/feed-layout.spec.ts`:
- Visit `/feed` while logged in — verify 3-column layout visible
- Verify dark mode toggle works and class persists after reload (check localStorage)
- Verify navbar profile dropdown toggles open/close
- Take screenshot of `/feed` for visual comparison with original design
- Verify all original nav items are present in DOM (even if inert)

**Step 7: Run E2E tests**

```bash
npx playwright test e2e/feed-layout.spec.ts
```

Expected: All PASS.

**Step 8: Commit**

```bash
git add .
git commit -m "feat: add feed page layout with navbar, sidebars, dark mode toggle, and E2E tests"
```

---

## Task 8: Posts API Routes

**Files:**
- Create: `buddyscript/src/lib/feed.ts` (shared two-query feed helper — used by SSR and API)
- Create: `buddyscript/src/app/api/posts/route.ts` (GET feed, POST create)
- Create: `buddyscript/src/app/api/posts/[id]/route.ts` (GET single, DELETE)
- Test: `buddyscript/src/__tests__/api/posts.test.ts`

**Step 1: Write integration tests for posts API**

Test: create post, get feed (newest first), private post filtering, get single post (includes comments), get private post as other user (403), delete own post, delete other's post (403), cursor pagination.

**Step 2: Create shared feed query helper**

Create `buddyscript/src/lib/feed.ts` — a single shared implementation of the two-query merge strategy used by both the SSR feed page and the API route. This ensures the scale-critical query logic is defined once and stays consistent:

```ts
import { prisma } from './db';

const POST_SELECT = (userId: string) => ({
  id: true,
  content: true,
  imageUrl: true,
  visibility: true,
  likeCount: true,
  commentCount: true, // Use denormalized counter — no COUNT() subquery at scale
  createdAt: true,
  authorId: true,
  author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  likes: { where: { userId }, select: { id: true } },
});

/**
 * Two-query merge strategy for scale:
 * Instead of WHERE (visibility = 'PUBLIC' OR authorId = userId) which can't
 * use a single index efficiently at millions of rows, execute two parallel
 * queries and merge:
 * 1. Public posts (uses composite index on [visibility, createdAt, id])
 * 2. User's private posts (uses index on [authorId, createdAt, id])
 * Then merge, sort, take limit, derive cursor.
 */
export async function getFeedPage(
  userId: string,
  cursor: string | null,
  limit: number = 10
) {
  const cursorFilter = cursor
    ? parseCursor(cursor)
    : undefined;

  const [publicPosts, privatePosts] = await Promise.all([
    prisma.post.findMany({
      where: {
        visibility: 'PUBLIC',
        ...(cursorFilter && {
          OR: [
            { createdAt: { lt: cursorFilter.createdAt } },
            { createdAt: cursorFilter.createdAt, id: { lt: cursorFilter.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: POST_SELECT(userId),
    }),
    prisma.post.findMany({
      where: {
        authorId: userId,
        visibility: 'PRIVATE',
        ...(cursorFilter && {
          OR: [
            { createdAt: { lt: cursorFilter.createdAt } },
            { createdAt: cursorFilter.createdAt, id: { lt: cursorFilter.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: POST_SELECT(userId),
    }),
  ]);

  // Merge, deduplicate, sort, take limit
  const merged = [...publicPosts, ...privatePosts]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))
    .slice(0, limit);

  const nextCursor = merged.length === limit
    ? `${merged[merged.length - 1].createdAt.toISOString()}_${merged[merged.length - 1].id}`
    : null;

  return { posts: merged, nextCursor };
}

function parseCursor(cursor: string) {
  const [iso, id] = cursor.split('_');
  return { createdAt: new Date(iso), id };
}
```

**Step 3: Implement GET /api/posts (feed)**

- `requireUser()` guard
- Parse `?cursor=...&limit=10` from query params
- Call `getFeedPage(userId, cursor, limit)` — the shared helper handles two-query merge, cursor logic, and sorting
- Return: `{ posts: [...], nextCursor: string | null }`

**Step 4: Implement POST /api/posts (create)**

- `requireUser()` guard
- Rate limit with `createPostRateLimit` (10/min per IP)
- Validate with `validatePost()`
- Validate imageUrl against Cloudinary cloud name
- Create post in DB
- Return created post with 201

**Step 4: Implement GET /api/posts/:id**

- `requireUser()` guard
- `requirePostAccess()` check
- Return post with author info, likeCount, commentCount, current user like status
- Include first page of top-level comments (limit 20) with up to 3 replies each (same shape as GET /api/posts/:id/comments)
- This provides a complete single-post view in one request

**Step 5: Implement DELETE /api/posts/:id**

- `requireUser()` guard
- Verify post belongs to current user (403 if not)
- Hard delete (CASCADE removes comments and likes)
- Best-effort Cloudinary image deletion if imageUrl exists

**Step 6: Run tests**

```bash
npx vitest run src/__tests__/api/posts.test.ts
```

Expected: All PASS.

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add posts API with feed pagination, visibility filtering, CRUD operations"
```

---

## Task 9: Likes API Routes

**Files:**
- Create: `buddyscript/src/app/api/posts/[id]/like/route.ts`
- Create: `buddyscript/src/app/api/posts/[id]/likes/route.ts`
- Create: `buddyscript/src/app/api/comments/[id]/like/route.ts`
- Create: `buddyscript/src/app/api/comments/[id]/likes/route.ts`
- Test: `buddyscript/src/__tests__/api/likes.test.ts`

**Step 1: Write integration tests**

Test: like post, like again (idempotent 200), unlike, unlike again (idempotent 200), likeCount updates, likes list returns users, like private post by other user (403), like comment, comment like on private post (403), like/unlike soft-deleted comment or reply (409, no counter change).

**Step 2: Implement POST/DELETE /api/posts/:id/like**

- `requireUser()` + `requirePostAccess()`
- POST: upsert PostLike + increment likeCount in transaction. Return `{ liked: true, likeCount }`.
- DELETE: find and delete PostLike + decrement likeCount in transaction. Return `{ liked: false, likeCount }`.
- Idempotent: POST returns 200 if already liked, DELETE returns 200 if not liked.

**Step 3: Implement GET /api/posts/:id/likes**

- `requireUser()` + `requirePostAccess()`
- Cursor-paginated, limit 50
- Return `{ users: [{ id, firstName, lastName, avatar }], nextCursor }`

**Step 4: Implement comment like routes (same pattern)**

- Resolve comment → get postId → `requirePostAccess()`
- For `POST` / `DELETE`, if `comment.deletedAt` is set, return `409 Conflict` and do not mutate `likeCount`
- `GET /api/comments/:id/likes` may still return historical likers for deleted comments/replies if the parent post is visible
- Same create/delete/list pattern as post likes but on CommentLike table

**Step 5: Run tests**

```bash
npx vitest run src/__tests__/api/likes.test.ts
```

Expected: All PASS.

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add like/unlike API for posts and comments with idempotency and counter updates"
```

---

## Task 10: Comments API Routes

**Files:**
- Create: `buddyscript/src/app/api/posts/[id]/comments/route.ts`
- Create: `buddyscript/src/app/api/comments/[id]/route.ts`
- Create: `buddyscript/src/app/api/comments/[id]/replies/route.ts`
- Test: `buddyscript/src/__tests__/api/comments.test.ts`

**Step 1: Write integration tests**

Test: create comment, create reply, reply-to-reply rejected (400), cross-post reply rejected (400), get paginated comments with inline replies, get paginated replies for a comment, soft delete comment, commentCount updates, comment on private post by other user (403).

**Step 2: Implement GET /api/posts/:id/comments**

- `requireUser()` + `requirePostAccess()`
- Get top-level comments (parentId = null), cursor-paginated, limit 20. **Do NOT filter by deletedAt** — include all top-level comments.
- For soft-deleted comments: replace `content` with null, set `deleted: true` flag. Only hide a deleted top-level comment if ALL its replies are also deleted.
- For each top-level comment, fetch up to 4 latest replies ordered newest-first; return the first 3 inline (also including soft-deleted replies as placeholders) and derive `hasMoreReplies` from whether a 4th reply exists
- Include: author info, likeCount, whether current user liked, `hasMoreReplies`

**Step 3: Implement POST /api/posts/:id/comments**

- `requireUser()` + `requirePostAccess()`
- Rate limit with `commentRateLimit` (20/min per IP)
- Validate with `validateComment()`
- If parentId: verify parent exists, belongs to same post, has no parentId itself (2-level threading)
- Create comment + increment post's commentCount in transaction
- Return created comment with 201

**Step 4: Implement GET /api/comments/:id/replies**

- `requireUser()`, resolve comment → `requirePostAccess()`
- Cursor-paginated, limit 20
- Same include pattern as comments

**Step 5: Implement DELETE /api/comments/:id**

- `requireUser()`, resolve comment → `requirePostAccess()`
- Verify comment belongs to current user
- Soft delete: set `deletedAt` to now
- Decrement post's commentCount in transaction

**Step 6: Run tests**

```bash
npx vitest run src/__tests__/api/comments.test.ts
```

Expected: All PASS.

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add comments API with nested replies, soft delete, 2-level threading enforcement"
```

---

## Task 11: Image Upload API

**Files:**
- Create: `buddyscript/src/app/api/upload/signature/route.ts`
- Test: `buddyscript/src/__tests__/api/upload.test.ts`

**Step 1: Write integration test**

Test: authenticated user gets signed params, unauthenticated user gets 401, params contain required fields (timestamp, signature, api_key).

**Step 2: Implement POST /api/upload/signature**

```ts
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { uploadRateLimit, getClientIP } from '@/lib/rate-limit';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: Request) {
  await requireUser();

  // Rate limit uploads: 5/min per IP
  const ip = getClientIP(request);
  const { success } = await uploadRateLimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 });
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const uploadPreset = 'buddyscript_signed';
  const params = {
    timestamp,
    folder: 'buddyscript',
    upload_preset: uploadPreset,
    allowed_formats: 'jpg,png,gif,webp',
    max_file_size: 5242880,
  };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

  return NextResponse.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    folder: 'buddyscript',
    uploadPreset,
  });
}
```

**Step 3: Run tests**

```bash
npx vitest run src/__tests__/api/upload.test.ts
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add Cloudinary signed upload endpoint"
```

---

## Task 12: CreatePost Component

**Files:**
- Create: `buddyscript/src/components/feed/CreatePost.tsx`

**Step 1: Build CreatePost Client Component**

- Extract the post creation area from `feed.html` (lines 984-998 area)
- Preserve all CSS classes
- Controlled textarea
- Image upload button → file picker → validate MIME/size client-side → get signature → upload to Cloudinary → show preview
- Visibility toggle (PUBLIC/PRIVATE) — add a small select/dropdown next to the existing post action buttons, using the existing `_feed_inner_text_area_bottom` container and reusing `_btn1` / form-control classes from the provided CSS. This is a required functional addition (task requires public/private posts) placed within the existing layout structure.
- Upload progress indicator
- Submit → POST `/api/posts` → prepend new post to feed (via callback prop or context)
- Disabled submit button during flight

**Step 2: Test manually + E2E**

- Create text post → appears in feed
- Create image post → image displayed
- Create private post → verify via API

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add CreatePost component with image upload and visibility toggle"
```

---

## Task 13: PostCard & PostFeed Components

**Files:**
- Create: `buddyscript/src/components/feed/PostCard.tsx`
- Create: `buddyscript/src/components/feed/PostFeed.tsx`
- Create: `buddyscript/src/components/feed/LikeButton.tsx`
- Create: `buddyscript/src/components/feed/LikesList.tsx`
- Create: `buddyscript/src/hooks/useInfiniteScroll.ts`

**Step 1: Build PostCard component**

- Extract the post card structure from `feed.html` timeline section
- Display: author name/avatar, timestamp, content, image, likeCount, commentCount
- LikeButton: optimistic toggle (POST/DELETE), shows filled/unfilled state
- LikesList: click on like count → modal/popover with paginated user list, `role="dialog"`, focus trap, Escape to close
- Comment toggle: click comment icon → expand CommentSection (built in next task)
- Delete button (own posts only): confirm → DELETE → remove from feed

**Step 2: Build PostFeed component**

- Client Component that receives `initialPosts` and `initialCursor` props from the server component
- The feed page (server component) fetches the first page of posts server-side and passes them as props — this gives instant content on load (SSR advantage) and avoids a loading spinner for the initial render
- After hydration, infinite scroll fetches subsequent pages from `/api/posts` client-side via `useInfiniteScroll` hook (Intersection Observer on sentinel div)
- Handles empty state, error state, and loading indicator for subsequent pages
- Prepends new posts from CreatePost

**Step 3: Build useInfiniteScroll hook**

```ts
// Watches a ref element via IntersectionObserver
// Calls loadMore() when sentinel enters viewport
// Returns { sentinelRef, isLoading, hasMore }
```

**Step 4: Test with E2E**

- Feed loads posts newest first
- Scroll to bottom → more posts load
- Like/unlike → count updates
- Click like count → see who liked

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add PostCard, PostFeed with infinite scroll, LikeButton with optimistic UI, LikesList modal"
```

---

## Task 14: CommentSection Components

**Files:**
- Create: `buddyscript/src/components/feed/CommentSection.tsx`
- Create: `buddyscript/src/components/feed/CommentCard.tsx`
- Create: `buddyscript/src/components/feed/ReplyCard.tsx`

**Step 1: Build CommentSection**

- Client Component, receives postId
- Fetches comments from `/api/posts/:id/comments`
- Shows list of CommentCards
- Comment input form at bottom
- Submit → POST `/api/posts/:id/comments` → append to list
- Focus returns to input after submit

**Step 2: Build CommentCard**

- Displays: author, content, timestamp, likeCount, LikeButton, LikesList (reuse same component from PostCard — click count to see who liked)
- "Reply" button → shows inline reply input
- Reply submit → POST with parentId
- Shows up to 3 replies inline (ReplyCards)
- "Load more replies" button → fetches from `/api/comments/:id/replies`
- Soft-deleted comments: show "This comment has been deleted" placeholder
- Delete button (own comments only)

**Step 3: Build ReplyCard**

- Same as CommentCard but visually indented, no nested replies
- LikeButton + LikesList for replies (reuse same components — "show who liked" is required for posts, comments, AND replies per task requirements)

**Step 4: Test with E2E**

- Add comment → appears under post
- Reply to comment → appears nested
- Like comment → count updates
- Like reply → count updates (explicitly test reply likes, not just comment likes)
- Click reply like count → modal shows who liked the reply
- Delete own comment → shows deleted placeholder
- Load more replies

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add CommentSection with threaded replies, like/unlike, soft delete"
```

---

## Task 15: Full E2E Test Suite & Visual Verification

Playwright config and basic auth E2E tests already exist from Tasks 1, 6, and 7. This task adds comprehensive interaction tests and visual verification.

**Files:**
- Create: `buddyscript/e2e/feed.spec.ts`
- Create: `buddyscript/e2e/interactions.spec.ts`
- Create: `buddyscript/e2e/visual.spec.ts`

**Step 1: Write feed E2E tests**

`e2e/feed.spec.ts`:
- Create text-only post → appears at top of feed
- Create post with image → image displayed
- Create private post → visible to author, NOT visible to second user (2 browser contexts)
- Infinite scroll → scroll to bottom, verify more posts load
- Empty feed state for new user

**Step 2: Write interaction E2E tests**

`e2e/interactions.spec.ts`:
- Like a post → count increments, icon fills
- Unlike a post → count decrements, icon unfills
- Click likes count on post → modal opens showing users who liked
- Add comment → appears under post, commentCount increments
- Reply to comment → appears nested under parent
- Like a comment → count increments
- Click likes count on comment → modal opens showing users who liked the comment
- Like a reply → count increments (separate from comment like test)
- Unlike a reply → count decrements
- Click likes count on reply → modal opens showing users who liked the reply
- Delete own post → removed from feed
- Delete own comment → shows "deleted" placeholder
- *(Optional)* Dark mode toggle → classes applied, persists after reload

**Step 3: Write visual verification tests**

`e2e/visual.spec.ts`:
- Screenshot `/login` page — save to `e2e/screenshots/login.png`
- Screenshot `/register` page — save to `e2e/screenshots/register.png`
- Screenshot `/feed` page (with seeded data) — save to `e2e/screenshots/feed.png`
- Agent compares these against original HTML pages visually

**Step 4: Run full E2E suite**

```bash
npx playwright test
```

Expected: All PASS.

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add comprehensive E2E tests for feed, interactions, and visual verification"
```

---

## Task 16: Seed Data

**Files:**
- Create: `buddyscript/prisma/seed.ts`
- Modify: `buddyscript/package.json` (add prisma seed script)

**Step 1: Create seed script**

`buddyscript/prisma/seed.ts`:
- Create 3 demo users (with hashed passwords)
- Create 15-20 posts (mix of public/private, some with images from Cloudinary sample assets)
- Create comments and replies on various posts
- Create likes on posts and comments
- Update denormalized counters

**Step 2: Add to package.json**

```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

**Step 3: Run seed**

```bash
npx prisma db seed
```

**Step 4: Verify in browser**

Visit `/feed` — see populated feed with posts, comments, likes.

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add seed data with demo users, posts, comments, and likes"
```

---

## Task 17: GitHub Actions CI

**Files:**
- Create: `buddyscript/.github/workflows/ci.yml`

**Step 1: Create CI workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  DATABASE_URL: ${{ secrets.CI_BUILD_DATABASE_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ secrets.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME }}
  CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
  CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
  UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
  UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: buddyscript/package-lock.json
      - run: npm ci
        working-directory: buddyscript
      - run: npx eslint .
        working-directory: buddyscript
      - run: npx tsc --noEmit
        working-directory: buddyscript

  unit-tests:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.CI_UNIT_DATABASE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: buddyscript/package-lock.json
      - run: npm ci
        working-directory: buddyscript
      - name: Run Prisma migrations on test database
        run: npx prisma migrate deploy
        working-directory: buddyscript
      - name: Seed test database
        run: npx prisma db seed
        working-directory: buddyscript
      - name: Run unit and API integration tests
        run: npx vitest run
        working-directory: buddyscript

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck]
    env:
      DATABASE_URL: ${{ secrets.CI_E2E_DATABASE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: buddyscript/package-lock.json
      - run: npm ci
        working-directory: buddyscript
      - name: Run Prisma migrations
        run: npx prisma migrate deploy
        working-directory: buddyscript
      - name: Seed database
        run: npx prisma db seed
        working-directory: buddyscript
      - name: Build application
        run: npx next build
        working-directory: buddyscript
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        working-directory: buddyscript
      - name: Start server and run E2E tests
        run: |
          npm start &
          npx wait-on http://localhost:3000 --timeout 30000
          npx playwright test
        working-directory: buddyscript

  build:
    runs-on: ubuntu-latest
    needs: [unit-tests, e2e-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: buddyscript/package-lock.json
      - run: npm ci
        working-directory: buddyscript
      - name: Production build verification
        run: npx next build
        working-directory: buddyscript
```

> **Note:** Add `wait-on` as a dev dependency in Task 1 Step 2: `npm install -D wait-on`

> **IMPORTANT — CI database isolation:** `CI_UNIT_DATABASE_URL` and `CI_E2E_DATABASE_URL` MUST point to different dedicated, disposable databases or Neon branches. The jobs run in parallel and both execute `prisma migrate deploy` + `prisma db seed`, so sharing one database will cause flaky CI. `CI_BUILD_DATABASE_URL` must also be non-production, but it can be a separate branch used only to satisfy build-time env validation.

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add GitHub Actions CI pipeline with lint, typecheck, test, build"
```

---

## Task 18: Deployment & README

**Files:**
- Create: `buddyscript/README.md`
- Modify: Vercel project configuration

**Step 1: Deploy to Vercel**

- Connect GitHub repo to Vercel
- Set root directory to `buddyscript`
- Configure all environment variables in Vercel dashboard
- Run `prisma migrate deploy` on production database
- Run seed on production database

**Step 2: Write README.md**

Include: project overview, live URL, demo credentials, tech stack, architecture decisions (with diagrams if time allows), setup instructions, env vars, DB setup, running locally, running tests, scale considerations, what was built vs what was out of scope.

**Step 3: Final verification**

- Visit live URL — test all features manually
- Run targeted smoke checks against production URL (auth, create post, private visibility, likes). Keep the full destructive E2E suite on local/staging.
- Verify all pages match original design via screenshots

**Step 4: Commit**

```bash
git add .
git commit -m "docs: add comprehensive README with setup, architecture, and deployment guide"
```

---

## Task 19: Submission Package (Video + Final Checklist)

This task must be completed BEFORE the deadline.

**Step 1: Pre-submission checklist**

- [ ] All features working on live URL
- [ ] Demo credentials in README
- [ ] Seed data visible on production
- [ ] All tests passing (vitest + playwright)
- [ ] CI pipeline green on GitHub
- [ ] No console.log() left in production code (only console.error for auth logging)
- [ ] .env.example is complete and accurate
- [ ] No .env or secrets committed to repo

**Step 2: Record video walkthrough**

Record screen capture demonstrating (in order):
1. Registration flow (fill form, submit, redirect to feed)
2. Login flow (existing user, redirect to feed)
3. Creating a text post
4. Creating a post with image upload
5. Creating a private post → show it's visible to author
6. Log in as different user → show private post is NOT visible
7. Like/unlike a post → show count change
8. Click like count → show who liked modal
9. Add a comment on a post
10. Reply to a comment
11. Like a comment → show count change
12. Click like count on comment → show who liked
13. Like a reply → show count change (explicitly demonstrate reply likes work)
14. Click like count on reply → show who liked the reply
15. Delete own comment → show "deleted" placeholder
16. Delete own post → removed from feed
17. Infinite scroll → scroll to bottom, more posts load
18. Brief code walkthrough: project structure, Prisma schema, auth implementation, key API routes, two-query feed strategy
19. *(If implemented)* Dark mode toggle → show it persists on reload

**Step 3: Upload video**

- Upload to YouTube as unlisted
- Add title: "BuddyScript — Full-Stack Social Media App (AppifyLab Task Submission)"
- Add description with live URL and GitHub repo link

**Step 4: Final README update**

Add video URL and any last-minute notes to README.

**Step 5: Commit and push**

```bash
git add .
git commit -m "docs: add video walkthrough link and finalize submission"
git push origin main
```

---

## Task Summary

| Task | Description | Depends On | Checkpoint |
|------|-------------|------------|------------|
| 1 | Project scaffolding, config & Playwright setup | — | |
| 2 | Copy CSS assets & styling | 1 | |
| 3 | Prisma schema & DB setup | 1 | |
| 4 | Auth helpers & utilities (with tests) | 1 | |
| 5 | Auth API routes (with tests) | 3, 4 | **CHECKPOINT 1** |
| 6 | Login & Registration pages (UI + E2E) | 2, 5 | |
| 7 | Feed page layout & navbar (UI + E2E) | 2, 5 | **CHECKPOINT 2** |
| 8 | Posts API routes (with tests) | 3, 4 | |
| 9 | Likes API routes (with tests) | 3, 4 | |
| 10 | Comments API routes (with tests) | 3, 4 | |
| 11 | Image upload API | 4 | **CHECKPOINT 3** |
| 12 | CreatePost component | 7, 8, 11 | |
| 13 | PostCard & PostFeed components | 7, 8, 9 | |
| 14 | CommentSection components (with LikesList on comments/replies) | 13, 10 | **CHECKPOINT 4** |
| 15 | Full E2E test suite & visual verification | 6, 12, 13, 14 | **CHECKPOINT 5** |
| 16 | Seed data | 3 | |
| 17 | GitHub Actions CI (with Playwright) | 15 | |
| 18 | Deployment & README | All | |
| 19 | Submission package (video + final checklist) | 18 | **CHECKPOINT 6** |

---

## Checkpoints — Manual Testing Gates

Stop at each checkpoint, verify everything listed, and only proceed when satisfied. These are designed so you can test the app yourself at each natural milestone.

### CHECKPOINT 1 — Auth Backend Complete (after Task 5)

**What's ready:** Project scaffolded, DB migrated, auth API fully functional.

**Manual test steps:**
1. `cd buddyscript && npm run dev`
2. Test registration: `curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"Test1234"}' -v` → expect 201, `Set-Cookie` header with `token=...`
3. Test login: `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Test1234"}' -v` → expect 200, cookie set
4. Test /me with cookie: `curl http://localhost:3000/api/auth/me -H "Cookie: token=<paste token>" -v` → expect 200 with user data
5. Test /me without cookie: `curl http://localhost:3000/api/auth/me -v` → expect 401
6. Test validation: empty email, short password, duplicate registration → expect 400/409
7. Verify all Vitest tests pass: `npx vitest run`

**Pass criteria:** All auth endpoints return correct status codes and cookies. Rate limiting works (6th login in 1 min returns 429).

---

### CHECKPOINT 2 — Auth UI + Feed Layout (after Task 7)

**What's ready:** Login/register pages render, auth flow works end-to-end in browser, feed page shows 3-column layout (empty).

**Manual test steps:**
1. Open `http://localhost:3000/login` — should match the original `login.html` design
2. Open `http://localhost:3000/register` — should match `registration.html` with added name fields
3. Register a new user → should redirect to `/feed`
4. Verify `/feed` shows 3-column layout with navbar, left sidebar, right sidebar
5. Open `/feed` in incognito (not logged in) → should redirect to `/login`
6. Open `/login` while logged in → should redirect to `/feed`
7. Compare login/register pages side-by-side with original HTML files — CSS classes and structure should match

**Pass criteria:** Full auth round-trip works in browser. Pages visually match the provided design. Protected route redirects work.

---

### CHECKPOINT 3 — All API Routes Complete (after Task 11)

**What's ready:** Posts, likes, comments, replies, upload signature — all backend APIs functional.

**Manual test steps (use curl or Postman with auth cookie):**
1. Create a public post: `POST /api/posts` with `{"content":"Hello world","visibility":"PUBLIC"}` → 201
2. Create a private post: `POST /api/posts` with `{"content":"Secret","visibility":"PRIVATE"}` → 201
3. Get feed: `GET /api/posts` → should show public post, private post visible to author
4. Log in as different user, get feed → private post should NOT appear
5. Like a post: `POST /api/posts/:id/like` → `{liked: true, likeCount: 1}`
6. Like again (idempotent): `POST /api/posts/:id/like` → `{liked: true, likeCount: 1}` (no error)
7. Unlike: `DELETE /api/posts/:id/like` → `{liked: false, likeCount: 0}`
8. Add a comment: `POST /api/posts/:id/comments` with `{"content":"Nice post!"}`
9. Reply to comment: `POST /api/posts/:id/comments` with `{"content":"Thanks!","parentId":"<comment_id>"}`
10. Reply-to-reply (should fail): send parentId of the reply → expect 400
11. Like a comment: `POST /api/comments/:id/like` → works
12. Like a reply: `POST /api/comments/:reply_id/like` → works
13. Get who liked: `GET /api/posts/:id/likes` and `GET /api/comments/:id/likes` → user lists
14. Get upload signature: `POST /api/upload/signature` → returns timestamp, signature, apiKey
15. Verify all Vitest tests pass: `npx vitest run`

**Pass criteria:** Every API endpoint returns correct responses. Private post authorization works. Like idempotency works. 2-level threading enforced. All integration tests green.

---

### CHECKPOINT 4 — Full UI Complete (after Task 14)

**What's ready:** Everything works in the browser — create posts, infinite scroll, likes, comments, replies, like lists, image upload.

**Manual test steps:**
1. Create a text-only post → appears at top of feed immediately
2. Create a post with image → upload progress shows, image renders in post
3. Create a private post → visible to you, not to other users
4. Scroll down → infinite scroll loads more posts
5. Like a post → count updates, icon fills (optimistic, instant)
6. Unlike → count decrements
7. Click like count on a post → modal shows list of users who liked
8. Add a comment → appears under post, comment count updates
9. Reply to a comment → appears nested/indented
10. Like a comment → count updates
11. Like a reply → count updates
12. Click like count on a reply → modal shows who liked the reply
13. Delete own post → disappears from feed
14. Delete own comment → shows "deleted" placeholder
15. Test with 2 browser windows (2 different users) — verify private posts are isolated

**Pass criteria:** All required features work visually. No broken UI states. Optimistic updates feel instant. Private/public isolation works.

---

### CHECKPOINT 5 — All Tests Green (after Task 15)

**What's ready:** Full E2E test suite passes, visual screenshots taken.

**Manual test steps:**
1. Run full Vitest suite: `npx vitest run` → all pass
2. Run full Playwright suite: `npx playwright test` → all pass
3. Review screenshots in `e2e/screenshots/` — compare with original HTML pages
4. Check test count — should cover: auth flows, post CRUD, likes (post + comment + reply), comments/replies, private post isolation, infinite scroll

**Pass criteria:** Zero test failures. Screenshots look correct. No skipped tests.

---

### CHECKPOINT 6 — Submission Ready (after Task 19)

**What's ready:** Deployed, seeded, documented, video recorded.

**Manual test steps:**
1. Visit live URL → login page loads
2. Log in with demo credentials from README → feed loads with seeded data
3. Run through all features on live site (same as Checkpoint 4 steps)
4. Verify GitHub repo is public and clean (no .env, no node_modules)
5. Verify README has: project overview, live URL, demo creds, tech stack, architecture decisions, setup instructions
6. Verify CI pipeline is green on GitHub
7. Watch your own video walkthrough — does it demonstrate every required feature?
8. Check video shows: register, login, text post, image post, private post, like/unlike, who liked, comment, reply, reply like, delete post, delete comment, infinite scroll

**Pass criteria:** Live site works. Repo is clean. README is complete. Video covers all features. CI is green. Ready to submit.

---

**Parallelizable groups:**
- Tasks 2, 3, 4 can run in parallel after Task 1
- Tasks 8, 9, 10, 11 can run in parallel after Tasks 3, 4
- Tasks 6, 7 can run in parallel after Tasks 2, 5
- Tasks 12, 13 can start once their deps are done
- Task 16 (seed data) can run anytime after Task 3

**Priority order:** All scoring features (auth, feed CRUD, likes, comments/replies, reply likes, private/public, "who liked") → testing/CI → deploy/README/video → non-essential polish (dark mode, sidebar fidelity). Never spend time on non-essential polish while any scoring feature is incomplete.

**Timeline targets (4 days remaining):**
- **Day 1 (Apr 2):** Tasks 1-5 — scaffolding, DB, auth backend
- **Day 2 (Apr 3):** Tasks 6-11 — auth UI, feed layout, all API routes
- **Day 3 (Apr 4):** Tasks 12-16 — feed UI components, E2E tests, seed data
- **Day 4 (Apr 5):** Tasks 17-19 — CI, deploy, README, video, submission
- **Buffer (Apr 6):** Deadline day — final fixes only if needed
