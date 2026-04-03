import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getFeedPage } from '@/lib/feed';
import FeedLayout from '@/components/layout/FeedLayout';
import PostFeed from '@/components/feed/PostFeed';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/login');

  let userId: string;
  try {
    const payload = await verifyJWT(token);
    userId = payload.userId;
  } catch {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, avatar: true },
  });

  if (!user) redirect('/login');

  const { posts: rawPosts, nextCursor } = await getFeedPage(userId, null, 10);

  const posts = rawPosts.map((p) => ({
    id: p.id,
    content: p.content,
    imageUrl: p.imageUrl,
    visibility: p.visibility as 'PUBLIC' | 'PRIVATE',
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    createdAt: p.createdAt.toISOString(),
    authorId: p.authorId,
    author: p.author,
    liked: p.likes.length > 0,
  }));

  return (
    <FeedLayout user={user}>
      <PostFeed
        initialPosts={posts}
        initialCursor={nextCursor}
        user={user}
      />
    </FeedLayout>
  );
}
