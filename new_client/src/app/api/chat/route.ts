import type { NextRequest } from 'next/server';
import { getServerAccessToken } from '@/lib/getServerAccessToken';

export async function GET(req: NextRequest) {
  const accessToken = await getServerAccessToken();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  // Pythonサーバーにリクエスト
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_CHAT_AGENT_API_BASE_URL}/projects/${projectId}/chat_history`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...accessToken },
    }
  );

  const data = await res.json();

  return new Response(JSON.stringify(data));
}

export async function POST(req: NextRequest) {
  const accessToken = await getServerAccessToken();
  const { projectId, message } = await req.json();
  /// Pythonサーバーにリクエスト
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_CHAT_AGENT_API_BASE_URL}/projects/${projectId}/chat_stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...accessToken,
      },
      body: JSON.stringify({
        input_text: message,
      }),
    }
  );

  // Pythonサーバーからのレスポンスをそのままストリーミング転送
  return new Response(res.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
