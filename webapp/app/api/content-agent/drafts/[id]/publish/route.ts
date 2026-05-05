import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { publishDraftToGitHubPr } from '@/lib/content-publisher';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const draft = await prisma.contentDraft.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  if (draft.status !== 'approved') {
    return NextResponse.json({ error: 'Approve this draft before publishing.' }, { status: 400 });
  }

  try {
    const pr = await publishDraftToGitHubPr(draft, session.user.id);
    const updated = await prisma.contentDraft.update({
      where: { id: draft.id },
      data: {
        status: 'published',
        publishedUrl: pr.url,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ draft: updated, pr });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish draft' },
      { status: 500 },
    );
  }
}
