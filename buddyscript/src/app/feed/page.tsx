import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/db';
import FeedLayout from '@/components/layout/FeedLayout';

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
    select: { firstName: true, lastName: true, avatar: true },
  });

  if (!user) redirect('/login');

  return (
    <FeedLayout user={user}>
      <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24" style={{ textAlign: 'center' }}>
        <p>No posts yet. Create your first post!</p>
      </div>
    </FeedLayout>
  );
}
