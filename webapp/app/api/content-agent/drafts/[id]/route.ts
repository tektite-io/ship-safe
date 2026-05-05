import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VALID_STATUSES = new Set(['draft', 'approved', 'published', 'rejected']);

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: {
    status?: string;
    publishedUrl?: string;
    title?: string;
    description?: string;
    content?: string;
    tags?: string[];
    keywords?: string[];
  };
  try {
    body = await req.json() as { status?: string; publishedUrl?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.status && !VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'Invalid draft status' }, { status: 400 });
  }

  const existing = await prisma.contentDraft.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!existing) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

  const draft = await prisma.contentDraft.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(typeof body.title === 'string' ? { title: body.title.trim().slice(0, 220) } : {}),
      ...(typeof body.description === 'string' ? { description: body.description.trim().slice(0, 600) } : {}),
      ...(typeof body.content === 'string' ? { content: body.content.trim() } : {}),
      ...(Array.isArray(body.tags) ? { tags: body.tags.slice(0, 10) } : {}),
      ...(Array.isArray(body.keywords) ? { keywords: body.keywords.slice(0, 20) } : {}),
      publishedUrl: body.status === 'published' ? body.publishedUrl : undefined,
      publishedAt: body.status === 'published' ? new Date() : undefined,
    },
  });

  return NextResponse.json({ draft });
}
