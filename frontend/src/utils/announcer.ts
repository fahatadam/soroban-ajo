let announcer: HTMLDivElement | null = null;

/**
 * Get or create the live region announcer element.
 * Internal utility for accessibility.
 * 
 * @returns The screen reader announcer div
 */
function getAnnouncer(): HTMLDivElement {
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
  }
  return announcer;
}

/**
 * Announce a message to screen readers using a live region.
 * 
 * @param message - The text to announce
 * @param priority - Announcement priority ('polite' or 'assertive')
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const el = getAnnouncer();
  el.setAttribute('aria-live', priority);
  el.textContent = message;
  
  setTimeout(() => {
    el.textContent = '';
  }, 1000);
}

/**
 * Announce a page navigation event.
 * 
 * @param pageName - Name of the page navigated to
 */
export function announceNavigation(pageName: string) {
  announce(`Navigated to ${pageName}`);
}

/**
 * Announce an error message with high priority.
 * 
 * @param error - The error message
 */
export function announceError(error: string) {
  announce(error, 'assertive');
}

/**
 * Announce a success message.
 * 
 * @param message - The success message
 */
export function announceSuccess(message: string) {
  announce(message, 'polite');
}
