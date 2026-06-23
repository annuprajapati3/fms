import { Badge } from '@/components/ui/badge';
import { UserStatus } from '@/types';

const STATUS_VARIANT: Record<UserStatus, 'success' | 'secondary' | 'destructive' | 'warning'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  SUSPENDED: 'warning',
  LOCKED: 'destructive',
};

export function StatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
