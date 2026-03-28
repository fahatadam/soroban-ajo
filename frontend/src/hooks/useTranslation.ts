import { useTranslations as useNextIntlTranslations, useFormatter } from 'next-intl';

/**
 * Hook for internationalization, providing translation and formatting utilities.
 * Uses `next-intl` internally with custom helpers for currency and relative time.
 * 
 * @param namespace - Optional localization namespace
 * @returns Translation function 't' and various formatters (date, number, currency)
 */
export function useTranslation(namespace?: string) {
  const t = useNextIntlTranslations(namespace);
  const format = useFormatter();

  return {
    t,
    formatDate: (date: Date | number, options?: Intl.DateTimeFormatOptions) => 
      format.dateTime(date, options),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => 
      format.number(value, options),
    formatCurrency: (value: number, currency = 'XLM') => {
      if (currency === 'XLM') {
        return `${format.number(value, { minimumFractionDigits: 2, maximumFractionDigits: 7 })} XLM`;
      }
      return format.number(value, { style: 'currency', currency });
    },
    formatRelativeTime: (date: Date | number) => {
      const now = Date.now();
      const timestamp = typeof date === 'number' ? date : date.getTime();
      const diff = now - timestamp;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      return format.relativeTime(
        days || hours || minutes || seconds,
        days ? 'day' : hours ? 'hour' : minutes ? 'minute' : 'second'
      );
    }
  };
}
