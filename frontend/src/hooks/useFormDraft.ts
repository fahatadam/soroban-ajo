// frontend/src/hooks/useFormDraft.ts

import { useEffect, useRef } from 'react';
import { saveDraft, getDraft, clearDraft } from '../utils/storage';

interface UseFormDraftOptions<T> {
  key: string;
  data: T;
  onRestore: (draft: T) => void;
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Hook to automatically persist form state to local storage.
 * Restores unsaved changes when the user returns to the form.
 * 
 * @template T - Type of the form data object
 * @param options - Configuration including storage key, current data, and restore callback
 * @returns Object with a method to manually clear the draft
 */
export const useFormDraft = <T>({
  key,
  data,
  onRestore,
  enabled = true,
  debounceMs = 500,
}: UseFormDraftOptions<T>) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft on mount
  useEffect(() => {
    if (!enabled) return;

    const draft = getDraft<T>(key);

    if (draft && JSON.stringify(draft) !== JSON.stringify(data)) {
      const shouldRestore = window.confirm('Resume editing your saved draft?');
      if (shouldRestore) {
        onRestore(draft);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  // Auto-save (debounced)
  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveDraft(key, data);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, debounceMs, enabled]);

  const removeDraft = () => clearDraft(key);

  return { removeDraft };
};