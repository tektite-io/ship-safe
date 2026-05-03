import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Get Started — Ship Safe' };

const steps = [
  {
    n: 1,
    icon: '🔍',
    title: 'Scan your first repo',
    desc: 'Upload a zip or connect GitHub to get your security score in under 60 seconds.',
    href: '/app/scan',
    cta: 'Run a scan',
  },
  {
    n: 2,
    icon: '🤖',
    title: 'Auto-fix with the agent',
    desc: 'The agent shows a diff for every fix and asks before writing. Every change is reversible.',
    href: '/app/scan',
    cta: 'Try the agent',
  },
  {
    n: 3,
    icon: '📡',
    title: 'Monitor your repo',
    desc: 'Set up scheduled scans and get emailed when your score drops.',
    href: '/app/repos',
    cta: 'Add a repo',
  },
  {
    n: 4,
    icon: '👥',
    title: 'Invite your team',
    desc: 'Share scans, assign fixes, and track your team\'s security score over time.',
    href: '/app/team',
    cta: 'Invite teammates',
  },
];

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const scanCount = await prisma.scan.count({ where: { userId: session.user.id } });
  if (scanCount > 0) redirect('/app');

  const name = session.user.name?.split(' ')[0] ?? 'there';

  return (
    <main style={{ minHeight: '100vh', background: '#020817', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 640, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👋</div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Welcome, {name}
          </h1>
          <p style={{ color: '#64748b' }}>
            Ship Safe scans your codebase with 23 AI agents. Here&apos;s how to get the most out of it.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
          {steps.map(step => (
            <Link
              key={step.n}
              href={step.href}
              style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: '#0f172a', borderRadius: 12, padding: '1.25rem 1.5rem', textDecoration: 'none', border: '1px solid #1e293b', transition: 'border-color 0.15s' }}
            >
              <div style={{ fontSize: '1.75rem', flexShrink: 0 }}>{step.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '0.2rem' }}>
                  {step.n}. {step.title}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{step.desc}</div>
              </div>
              <div style={{ color: '#0ea5e9', fontSize: '0.875rem', fontWeight: 600, flexShrink: 0 }}>
                {step.cta} →
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/app" style={{ color: '#475569', fontSize: '0.875rem', textDecoration: 'none' }}>
            Skip for now — go to dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
