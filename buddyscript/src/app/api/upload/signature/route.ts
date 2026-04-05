import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { uploadRateLimit, getClientIP } from '@/lib/rate-limit';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: Request) {
  try {
    await requireUser();

    const ip = getClientIP(request);
    const { success } = await uploadRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many uploads. Try again later.' },
        { status: 429 }
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'buddyscript';
    const params: Record<string, string | number> = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      folder,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
