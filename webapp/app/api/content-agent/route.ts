import { NextRequest, NextResponse } from 'next/server';
import { runContentAgent, type ContentAgentConfig } from '@/lib/content-agent';

export async function GET(req: NextRequest) {
  const auth = authorize(req);
  if (auth) return auth;

  const mode = req.nextUrl.searchParams.get('mode') === 'publish' ? 'publish' : 'draft';
  if (mode === 'publish' && process.env.CONTENT_AGENT_ALLOW_AUTOPUBLISH !== 'true') {
    return NextResponse.json(
      { error: 'Autopublish is disabled. Set CONTENT_AGENT_ALLOW_AUTOPUBLISH=true to enable CMS publishing.' },
      { status: 403 },
    );
  }

  const result = await runContentAgent({ mode });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = authorize(req);
  if (auth) return auth;

  let body: Partial<ContentAgentConfig>;
  try {
    body = await req.json() as Partial<ContentAgentConfig>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.mode === 'publish' && process.env.CONTENT_AGENT_ALLOW_AUTOPUBLISH !== 'true') {
    return NextResponse.json(
      { error: 'Autopublish is disabled. Set CONTENT_AGENT_ALLOW_AUTOPUBLISH=true to enable CMS publishing.' },
      { status: 403 },
    );
  }

  const result = await runContentAgent(body);
  return NextResponse.json(result, { status: result.status === 'skipped' ? 200 : 201 });
}

function authorize(req: NextRequest) {
  const secret = process.env.CONTENT_AGENT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CONTENT_AGENT_SECRET is not configured' }, { status: 500 });
  }

  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return undefined;
}
