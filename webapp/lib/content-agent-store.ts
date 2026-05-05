import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { BlogPost } from '@/data/blog';
import type { ContentAgentConfig, ContentAgentResult } from '@/lib/content-agent';

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

export async function createContentAgentRun(userId: string | null, mode: string, config?: Partial<ContentAgentConfig>) {
  return prisma.contentAgentRun.create({
    data: {
      userId,
      mode,
      config: (config ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function completeContentAgentRun(
  runId: string,
  result: ContentAgentResult,
  userId: string | null,
) {
  const draft = result.post
    ? await upsertContentDraft(result.post, result, userId)
    : null;

  return prisma.contentAgentRun.update({
    where: { id: runId },
    data: {
      status: result.status,
      selectedTopic: toJson(result.topic),
      candidateCount: result.candidateCount,
      selectedCount: result.selectedCount,
      sourceCount: result.sourceCount,
      guardrails: result.guardrails as Prisma.InputJsonValue,
      draftId: draft?.id,
      completedAt: new Date(),
    },
    include: { draft: true },
  });
}

export async function failContentAgentRun(runId: string, error: unknown) {
  return prisma.contentAgentRun.update({
    where: { id: runId },
    data: {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown content agent error',
      completedAt: new Date(),
    },
  });
}

export async function upsertContentDraft(
  post: BlogPost,
  result: ContentAgentResult,
  userId: string | null,
) {
  const citations = result.topic
    ? [
        {
          title: result.topic.title,
          url: result.topic.url,
          sourceId: result.topic.sourceId,
          publishedAt: result.topic.publishedAt,
        },
      ]
    : [];

  return prisma.contentDraft.upsert({
    where: { slug: post.slug },
    update: {
      title: post.title,
      description: post.description,
      author: post.author,
      tags: post.tags as Prisma.InputJsonValue,
      keywords: post.keywords as Prisma.InputJsonValue,
      content: post.content,
      coverImage: post.coverImage,
      sourceTopic: toJson(result.topic),
      citations: citations as Prisma.InputJsonValue,
      guardrails: result.guardrails as Prisma.InputJsonValue,
      userId,
    },
    create: {
      userId,
      slug: post.slug,
      title: post.title,
      description: post.description,
      author: post.author,
      tags: post.tags as Prisma.InputJsonValue,
      keywords: post.keywords as Prisma.InputJsonValue,
      content: post.content,
      coverImage: post.coverImage,
      sourceTopic: toJson(result.topic),
      citations: citations as Prisma.InputJsonValue,
      guardrails: result.guardrails as Prisma.InputJsonValue,
    },
  });
}
