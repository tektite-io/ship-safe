import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DraftEditor from './DraftEditor';
import PublishDraftButton from './PublishDraftButton';
import styles from '../../content-agent.module.css';

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: 'Content Draft — Ship Safe' };

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asCitationArray(value: unknown): Array<{ title?: string; url?: string; publishedAt?: string }> {
  return Array.isArray(value)
    ? value.filter((item): item is { title?: string; url?: string; publishedAt?: string } => typeof item === 'object' && item !== null)
    : [];
}

function renderPreview(markdown: string) {
  return markdown.split('\n').map((line, index) => {
    if (line.startsWith('## ')) return <h2 key={index}>{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={index}>{line.slice(4)}</h3>;
    if (line.startsWith('- ')) return <li key={index}>{line.slice(2)}</li>;
    if (!line.trim()) return <br key={index} />;
    return <p key={index}>{line}</p>;
  });
}

export default async function ContentDraftPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  const draft = await prisma.contentDraft.findFirst({
    where: { id, userId: session.user.id },
    include: {
      runs: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!draft) notFound();

  const tags = asStringArray(draft.tags);
  const keywords = asStringArray(draft.keywords);
  const guardrails = asStringArray(draft.guardrails);
  const citations = asCitationArray(draft.citations);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/app/content-agent" className={styles.secondaryLink}>Back to content agent</Link>
          <h1>{draft.title}</h1>
          <p className={styles.subtitle}>{draft.description}</p>
        </div>
        <div className={styles.headerActions}>
          <span className={`${styles.status} ${styles[`status_${draft.status}`] ?? ''}`}>{draft.status}</span>
          <PublishDraftButton draftId={draft.id} status={draft.status} publishedUrl={draft.publishedUrl} />
        </div>
      </div>

      <div className={styles.detailGrid}>
        <section className={styles.detailMain}>
          <DraftEditor
            draft={{
              id: draft.id,
              title: draft.title,
              description: draft.description,
              content: draft.content,
              tags,
              keywords,
              status: draft.status,
            }}
          />

          <div className={styles.previewPanel}>
            <div className={styles.sectionHeader}>
              <h2>Preview</h2>
            </div>
            <div className={styles.markdownPreview}>
              {renderPreview(draft.content)}
            </div>
          </div>
        </section>

        <aside className={styles.detailSide}>
          <section className={styles.sidePanel}>
            <h2>Guardrails</h2>
            {guardrails.length === 0 ? (
              <p>No guardrails recorded.</p>
            ) : guardrails.map((guardrail) => (
              <div key={guardrail} className={styles.guardrail}>{guardrail}</div>
            ))}
          </section>

          <section className={styles.sidePanel}>
            <h2>Citations</h2>
            {citations.length === 0 ? (
              <p>No citations recorded.</p>
            ) : citations.map((citation) => (
              <a key={citation.url ?? citation.title} href={citation.url} className={styles.citation} target="_blank" rel="noreferrer">
                <span>{citation.title ?? citation.url}</span>
                {citation.publishedAt && <small>{new Date(citation.publishedAt).toLocaleDateString()}</small>}
              </a>
            ))}
          </section>

          <section className={styles.sidePanel}>
            <h2>SEO</h2>
            <div className={styles.tagRow}>{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className={styles.keywordList}>{keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
          </section>

          <section className={styles.sidePanel}>
            <h2>Runs</h2>
            {draft.runs.length === 0 ? <p>No linked runs.</p> : draft.runs.map((run) => (
              <div key={run.id} className={styles.compactRun}>
                <span className={`${styles.status} ${styles[`status_${run.status}`] ?? ''}`}>{run.status}</span>
                <small>{new Date(run.createdAt).toLocaleString()}</small>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
