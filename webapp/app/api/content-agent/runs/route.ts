import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runContentAgent, type ContentAgentConfig } from '@/lib/content-agent';
import {
  completeContentAgentRun,
  createContentAgentRun,
  failContentAgentRun,
} from '@/lib/content-agent-store';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const runs = await prisma.contentAgentRun.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      draft: {
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json({ runs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Partial<ContentAgentConfig> = {};
  try {
    body = await req.json() as Partial<ContentAgentConfig>;
  } catch {
    body = {};
  }

  if (body.mode === 'publish' && process.env.CONTENT_AGENT_ALLOW_AUTOPUBLISH !== 'true') {
    return NextResponse.json(
      { error: 'Autopublish is disabled. Review and approve drafts before enabling publication.' },
      { status: 403 },
    );
  }

  const mode = body.mode ?? 'draft';
  const run = await createContentAgentRun(session.user.id, mode, body);

  try {
    const result = await runContentAgent(body);
    const completed = await completeContentAgentRun(run.id, result, session.user.id);
    return NextResponse.json({ run: completed, result }, { status: 201 });
  } catch (error) {
    await failContentAgentRun(run.id, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Content agent failed' },
      { status: 500 },
    );
  }
}
