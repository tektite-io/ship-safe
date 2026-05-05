'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../../content-agent.module.css';

export default function PublishDraftButton({
  draftId,
  status,
  publishedUrl,
}: {
  draftId: string;
  status: string;
  publishedUrl?: string | null;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  async function publish() {
    setPublishing(true);
    setError('');

    try {
      const res = await fetch(`/api/content-agent/drafts/${draftId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to publish draft');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish draft');
    } finally {
      setPublishing(false);
    }
  }

  if (publishedUrl) {
    return (
      <a className={styles.primaryButton} href={publishedUrl} target="_blank" rel="noreferrer">
        Open publish PR
      </a>
    );
  }

  return (
    <div className={styles.publishControl}>
      <button className={styles.primaryButton} onClick={publish} disabled={publishing || status !== 'approved'}>
        {publishing ? 'Creating PR...' : 'Publish PR'}
      </button>
      {status !== 'approved' && <span className={styles.publishHint}>Approve before publishing</span>}
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
