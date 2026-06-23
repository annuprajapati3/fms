'use client';

import * as React from 'react';
import type { ToastVariant } from '@/components/ui/toast';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

export interface ToasterToast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

type ActionType =
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

let count = 0;
function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

interface State {
  toasts: ToasterToast[];
}

const listeners: ((state: State) => void)[] = [];
let memoryState: State = { toasts: [] };

function dispatch(action: ActionType): void {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function queueRemove(toastId: string): void {
  if (timeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    timeouts.delete(toastId);
    dispatch({ type: 'REMOVE_TOAST', toastId });
  }, TOAST_REMOVE_DELAY);
  timeouts.set(toastId, timeout);
}

function reducer(state: State, action: ActionType): State {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case 'DISMISS_TOAST': {
      if (action.toastId) {
        queueRemove(action.toastId);
      } else {
        state.toasts.forEach((t) => queueRemove(t.id));
      }
      return { ...state, toasts: state.toasts };
    }
    case 'REMOVE_TOAST':
      if (!action.toastId) return { ...state, toasts: [] };
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };
    default:
      return state;
  }
}

export function toast(props: Omit<ToasterToast, 'id'>): { id: string; dismiss: () => void } {
  const id = genId();
  dispatch({ type: 'ADD_TOAST', toast: { ...props, id } });
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });
  setTimeout(dismiss, TOAST_REMOVE_DELAY);
  return { id, dismiss };
}

export function useToast(): State & { dismiss: (toastId?: string) => void } {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { ...state, dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }) };
}
