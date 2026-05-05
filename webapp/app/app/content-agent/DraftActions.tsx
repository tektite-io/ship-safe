'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './content-agent.module.css';

export default function DraftActions({ draftId, status }: { draftId: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function updateStatus(nextStatus: 'approved' | 'rejected' | 'draft') {
    setPending(nextStatus);
    try {
      const res = await fetch(`/api/content-agent/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update draft');
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={styles.draftActions}>
      {status !== 'approved' && (
        <button className={styles.iconButton} onClick={() => updateStatus('approved')} disabled={pending !== null} title="Approve draft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      )}
      {status !== 'rejected' && (
        <button className={styles.iconButton} onClick={() => updateStatus('rejected')} disabled={pending !== null} title="Reject draft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      {status !== 'draft' && (
        <button className={styles.iconButton} onClick={() => updateStatus('draft')} disabled={pending !== null} title="Move back to draft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v6h6" />
          </svg>
        </button>
      )}
    </div>
  );
}
