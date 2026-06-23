'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  Network,
  MapPin,
  CalendarRange,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PermissionGate } from '@/components/shared/permission-gate';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'DASHBOARD.VIEW' },
  { href: '/users', label: 'Users', icon: Users, permission: 'USERS.VIEW' },
  { href: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, permission: 'ROLES.VIEW' },
  { href: '/companies', label: 'Companies', icon: Building2, permission: 'COMPANY.VIEW' },
  { href: '/divisions', label: 'Divisions', icon: Network, permission: 'DIVISION.VIEW' },
  { href: '/branches', label: 'Branches', icon: MapPin, permission: 'BRANCH.VIEW' },
  { href: '/financial-years', label: 'Financial Years', icon: CalendarRange, permission: 'FINANCIAL_YEAR.VIEW' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col bg-primary md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-gold">
          <span className="font-serif text-sm font-bold leading-none text-gold-foreground">F</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide text-primary-foreground">FMS</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-primary-foreground/55">Enterprise</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'signature-rule relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/10 text-primary-foreground before:animate-fade-in'
                  : 'text-primary-foreground/65 before:hidden hover:bg-white/5 hover:text-primary-foreground',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );

          return item.permission ? (
            <PermissionGate key={item.href} permission={item.permission}>
              {link}
            </PermissionGate>
          ) : (
            link
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <p className="px-3 text-[10px] uppercase tracking-[0.14em] text-primary-foreground/40">
          Freight Management System
        </p>
      </div>
    </aside>
  );
}
