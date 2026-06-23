'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/auth.hooks';
import { ContextSwitcher } from './context-switcher';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-t-2 border-t-gold/60 bg-card px-6">
      <ContextSwitcher />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" className="gap-2 font-medium">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {user?.firstName?.[0]?.toUpperCase()}
              {user?.lastName?.[0]?.toUpperCase() ?? ''}
            </span>
            {user?.firstName} {user?.lastName ?? ''}
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
              onSelect={() => logout.mutate()}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}
