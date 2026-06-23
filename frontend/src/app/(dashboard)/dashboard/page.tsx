'use client';

import { Building2, Users, ShieldAlert, CalendarClock, Network, MapPin } from 'lucide-react';
import { KpiCard } from '@/components/shared/kpi-card';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardSummary } from '@/features/dashboard/dashboard.hooks';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          data.financialYear ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Financial Year {data.financialYear.code} · {data.financialYear.status}
            </span>
          ) : (
            'No active financial year selected'
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Companies (Platform-wide)" value={data.organization.totalCompanies} icon={Building2} />
        <KpiCard label="Divisions (Current Company)" value={data.organization.totalDivisions} icon={Network} />
        <KpiCard label="Branches (Current Company)" value={data.organization.totalBranches} icon={MapPin} />
        <KpiCard label="Roles Configured" value={data.security.totalRoles} icon={ShieldAlert} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Users" value={data.users.totalUsers} icon={Users} />
        <KpiCard label="Active Users" value={data.users.activeUsers} icon={Users} accent="success" />
        <KpiCard label="Inactive Users" value={data.users.inactiveUsers} icon={Users} accent="warning" />
        <KpiCard label="Locked Users" value={data.users.lockedUsers} icon={Users} accent="destructive" />
      </div>

      {data.security.recentFailedLogins > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldAlert className="h-5 w-5 text-warning" />
            <p className="text-sm">
              <strong>{data.security.recentFailedLogins}</strong> failed login attempt(s) in the last 24 hours.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity recorded.</p>
          ) : (
            <ul className="divide-y">
              {data.recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <span className="font-medium">{activity.actorName ?? 'System'}</span>{' '}
                    <span className="text-muted-foreground">{activity.description ?? activity.action}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{activity.entityType}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(activity.createdAt), 'dd MMM, HH:mm')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
