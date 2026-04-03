import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/login');

  try {
    await verifyJWT(token);
  } catch {
    redirect('/login');
  }

  return (
    <div className="_layout_main_wrapper">
      <div className="container py-5 text-center">
        <h2>Feed</h2>
        <p>Feed page coming soon.</p>
      </div>
    </div>
  );
}
