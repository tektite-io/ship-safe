import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL;
const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET;

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return {
      origin: url.origin,
      pathname: url.pathname,
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || null,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!ORCHESTRATOR_URL || !ORCHESTRATOR_SECRET) {
    return NextResponse.json({
      ok: false,
      configured: false,
      hasUrl: !!ORCHESTRATOR_URL,
      hasSecret: !!ORCHESTRATOR_SECRET,
      error: 'ORCHESTRATOR_URL or ORCHESTRATOR_SECRET is missing.',
    }, { status: 200 });
  }

  const target = `${ORCHESTRATOR_URL.replace(/\/+$/, '')}/health`;

  try {
    const res = await fetch(target, {
      headers: { Authorization: `Bearer ${ORCHESTRATOR_SECRET}` },
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    const contentType = res.headers.get('content-type') ?? '';
    const text = await res.text();
    let json: unknown = null;
    if (contentType.includes('application/json')) {
      try { json = JSON.parse(text); } catch {}
    }

    return NextResponse.json({
      ok: res.ok && !!json,
      configured: true,
      target: safeUrl(target),
      status: res.status,
      contentType,
      json,
      preview: text.replace(/\s+/g, ' ').slice(0, 300),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      configured: true,
      target: safeUrl(target),
      error: error instanceof Error ? error.message : 'Unknown orchestrator health error',
    });
  }
}
