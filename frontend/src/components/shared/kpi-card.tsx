'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: 'default' | 'success' | 'warning' | 'destructive';
}

const ICON_ACCENT_CLASSES: Record<NonNullable<KpiCardProps['accent']>, string> = {
  default: 'text-primary bg-primary/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  destructive: 'text-destructive bg-destructive/10',
};

export function KpiCard({ label, value, icon: Icon, accent = 'default' }: KpiCardProps) {
  const previousValue = useRef(value);
  const [justChanged, setJustChanged] = useState(false);

  useEffect(() => {
    if (previousValue.current !== value) {
      previousValue.current = value;
      setJustChanged(true);
      const timeout = setTimeout(() => setJustChanged(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return (
    <Card
      className={cn(
        'animate-rise-in transition-shadow',
        justChanged && 'animate-gold-pulse',
      )}
    >
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-serif text-[1.75rem] font-semibold leading-none tabular-nums text-foreground">
            {value}
          </p>
        </div>
        {Icon && (
          <div className={cn('rounded-full p-3', ICON_ACCENT_CLASSES[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
