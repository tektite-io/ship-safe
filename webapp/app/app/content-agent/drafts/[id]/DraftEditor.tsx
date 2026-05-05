'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DraftActions from '../../DraftActions';
import styles from '../../content-agent.module.css';

interface Props {
  draft: {
    id: string;
    title: string;
    description: string;
    content: string;
    tags: string[];
    keywords: string[];
    status: string;
  };
}

export default function DraftEditor({ draft }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(draft.title);
  const [description, setDescription] = useState(draft.description);
  const [content, setContent] = useState(draft.content);
  const [tags, setTags] = useState(draft.tags.join(', '));
  const [keywords, setKeywords] = useState(draft.keywords.join(', '));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const res = await fetch(`/api/content-agent/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          content,
          tags: splitCsv(tags),
          keywords: splitCsv(keywords),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.editorShell}>
      <div className={styles.editorToolbar}>
        <DraftActions draftId={draft.id} status={draft.status} />
        <button className={styles.primaryButton} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save edits'}
        </button>
        {saved && <span className={styles.savedText}>Saved</span>}
        {error && <span className={styles.errorText}>{error}</span>}
      </div>

      <label className={styles.field}>
        <span>Title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>

      <label className={styles.field}>
        <span>Description</span>
        <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>

      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span>Tags</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Keywords</span>
          <input value={keywords} onChange={(event) => setKeywords(event.target.value)} />
        </label>
      </div>

      <label className={styles.field}>
        <span>Markdown</span>
        <textarea className={styles.markdownEditor} value={content} onChange={(event) => setContent(event.target.value)} />
      </label>
    </div>
  );
}

function splitCsv(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}
