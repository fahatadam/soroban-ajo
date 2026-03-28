'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, ArrowUpRight, HeartPulse, ShieldAlert, Users } from 'lucide-react';
import { nextApiClient } from '@/lib/apiClient';
import { apiPaths } from '@/lib/apiEndpoints';

interface DashboardMetrics {
  activeUsers: number;
  activeGroups: number;
  transactionsLast24h: number;
  pendingModerationFlags: number;
}

interface HealthPayload {
  status: 'healthy' | 'degraded' | 'unhealthy' | string;
  uptime?: number;
  metrics?: DashboardMetrics;
}

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  admin?: { email?: string };
}

interface DashboardData {
  health?: HealthPayload;
  recentAudit?: AuditLog[];
  pendingFlags?: Array<{
    id: string;
    reason: string;
    contentType: string;
    createdAt: string;
  }>;
  kycSummary?: Record<string, number>;
}

const statusStyles = {
  healthy: 'text-green-400 bg-green-500/10 border-green-500/20',
  degraded: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  unhealthy: 'text-red-400 bg-red-500/10 border-red-500/20',
} as const;

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    nextApiClient
      .request<DashboardData>({
        path: apiPaths.admin.dashboard,
        auth: 'admin',
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const metrics = data?.health?.metrics;
  const kycSummary = data?.kycSummary || {};
  const systemStatus = data?.health?.status ?? 'unknown';

  const kycTotal = Object.values(kycSummary).reduce((sum, value) => sum + Number(value || 0), 0);

  const statusClass =
    statusStyles[systemStatus as keyof typeof statusStyles] || 'text-gray-300 bg-gray-500/10 border-gray-500/20';

  const statCards = [
    {
      label: 'Active Users',
      value: metrics?.activeUsers ?? '—',
      className: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      icon: Users,
    },
    {
      label: 'Groups Running',
      value: metrics?.activeGroups ?? '—',
      className: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
      icon: Activity,
    },
    {
      label: 'Transactions (24h)',
      value: metrics?.transactionsLast24h ?? '—',
      className: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      icon: ArrowUpRight,
    },
    {
      label: 'Pending Flags',
      value: metrics?.pendingModerationFlags ?? '—',
      className: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      icon: ShieldAlert,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-amber-400 text-sm animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-800 bg-gray-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Platform Operations Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Unified view for platform health, user governance, and analytics.
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs uppercase ${statusClass}`}>
            <HeartPulse className="w-3.5 h-3.5" />
            System {systemStatus}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className={`rounded-lg border p-4 ${card.className}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase opacity-80">{card.label}</div>
              <card.icon className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Platform Health Monitor</h2>
            <Link href="/admin/settings" className="text-xs text-amber-400 hover:text-amber-300">
              Configure thresholds →
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded border border-gray-800 bg-gray-950 px-3 py-4">
              <div className="text-xs text-gray-500 uppercase mb-1">Uptime</div>
              <div className="text-xl font-semibold text-gray-200">
                {typeof data?.health?.uptime === 'number'
                  ? `${Math.floor(data.health.uptime / 3600)}h`
                  : 'Unavailable'}
              </div>
            </div>
            <div className="rounded border border-gray-800 bg-gray-950 px-3 py-4">
              <div className="text-xs text-gray-500 uppercase mb-1">KYC Pending</div>
              <div className="text-xl font-semibold text-yellow-400">{kycSummary.pending ?? 0}</div>
            </div>
            <div className="rounded border border-gray-800 bg-gray-950 px-3 py-4">
              <div className="text-xs text-gray-500 uppercase mb-1">KYC Completion</div>
              <div className="text-xl font-semibold text-green-400">
                {kycTotal > 0
                  ? `${Math.round((((kycSummary.approved ?? 0) as number) / kycTotal) * 100)}%`
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Admin Actions</h2>
          <div className="space-y-2">
            <QuickLink title="Manage Users" description="Suspend, reinstate, and review user activity." href="/admin/users" />
            <QuickLink title="View Analytics" description="Open advanced funnel and prediction metrics." href="/admin/analytics" />
            <QuickLink title="Moderation Queue" description="Resolve pending flags and content reports." href="/admin/moderation" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">Recent Audit Activity</h2>
          <div className="space-y-2">
            {(data.recentAudit || []).slice(0, 5).map(entry => (
              <div key={entry.id} className="rounded border border-gray-800 bg-gray-950 px-3 py-2">
                <div className="text-sm text-gray-200">{entry.action.replace(/_/g, ' ')}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {entry.admin?.email ?? 'system'} · {entry.targetType}:{entry.targetId} ·{' '}
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
            {(!data.recentAudit || data.recentAudit.length === 0) && (
              <p className="text-xs text-gray-500">No recent audit entries.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">Flag Queue Snapshot</h2>
          <div className="space-y-2">
            {(data.pendingFlags || []).slice(0, 5).map(flag => (
              <div key={flag.id} className="rounded border border-gray-800 bg-gray-950 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-gray-200">{flag.reason}</div>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {flag.contentType} · {new Date(flag.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {(!data.pendingFlags || data.pendingFlags.length === 0) && (
              <p className="text-xs text-gray-500">No pending moderation flags.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickLink({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="group block rounded border border-gray-800 bg-gray-950 px-3 py-2 hover:border-amber-500/30 transition-colors"
    >
      <div className="text-sm text-gray-200 group-hover:text-amber-300">{title}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </Link>
  );
}
