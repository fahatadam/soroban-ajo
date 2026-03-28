import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
}

/**
 * Hook to register global keyboard shortcuts.
 * 
 * @param shortcuts - Array of shortcut configurations (key, modifiers, and callback)
 */
export function useKeyboardNavigation(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(({ key, ctrl, shift, alt, callback }) => {
        if (
          e.key === key &&
          (ctrl === undefined || e.ctrlKey === ctrl) &&
          (shift === undefined || e.shiftKey === shift) &&
          (alt === undefined || e.altKey === alt)
        ) {
          e.preventDefault();
          callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Specialized hook for handling the Escape key.
 * 
 * @param callback - Function to execute when Escape is pressed
 * @param isActive - Whether the listener should be active
 */
export function useEscapeKey(callback: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [callback, isActive]);
}
