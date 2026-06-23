'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProviderRoot,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts } = useToast();

  return (
    <ToastProviderRoot>
      {children}
      {toasts.map(({ id, title, description, variant }) => (
        <Toast key={id} variant={variant}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProviderRoot>
  );
}
