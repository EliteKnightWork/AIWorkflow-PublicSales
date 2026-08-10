import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/api/generated/endpoints/users';
import { getServerAccessToken } from '@/lib/getServerAccessToken';

export const dynamic = 'force-dynamic'; // このルートだけ動的

export async function GET() {
  try {
    const accessToken = await getServerAccessToken();

    const userData = await getCurrentUser({
      headers: {
        ...accessToken,
      },
    });

    const userId = userData.id ?? null;
    return NextResponse.json({ userId });
  } catch {
    return NextResponse.json({ userId: null }, { status: 200 });
  }
}
