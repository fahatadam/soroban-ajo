'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Transaction, TransactionSortField, SortDirection } from '@/types';

// ─── Extended transaction with group name ─────────────────────────────────────

export interface TxRow extends Transaction {
  groupName?: string;
  hash?: string;
}

// ─── Filter / sort state ──────────────────────────────────────────────────────

/**
 * Configuration for filtering transaction history.
 */
export interface TxFilters {
  /** Text search across ID, member, and group names */
  search: string;
  type: Transaction['type'] | 'all';
  status: Transaction['status'] | 'all';
  /** Start date filter (ISO string) */
  dateFrom: string;
  /** End date filter (ISO string) */
  dateTo: string;
  groupId: string | 'all';
}

export const DEFAULT_FILTERS: TxFilters = {
  search: '',
  type: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  groupId: 'all',
};

export interface TxSort {
  field: TransactionSortField | 'status' | 'groupName';
  direction: SortDirection;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
export { PAGE_SIZE_OPTIONS };

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Comprehensive hook for managing large transaction history sets.
 * Provides client-side filtering, sorting by multiple fields, 
 * and efficient pagination.
 * 
 * @param transactions - Full array of raw transaction rows
 * @returns Filtered/Sorted data and pagination control actions
 */
export function useTransactionHistory(transactions: TxRow[]) {
  const [filters, setFilters] = useState<TxFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<TxSort>({ field: 'date', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim();
    return transactions.filter((tx) => {
      // Free-text search
      if (q) {
        const haystack = [tx.id, tx.member, tx.groupId, tx.groupName ?? '']
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Type
      if (filters.type !== 'all' && tx.type !== filters.type) return false;
      // Status
      if (filters.status !== 'all' && tx.status !== filters.status) return false;
      // Group
      if (filters.groupId !== 'all' && tx.groupId !== filters.groupId) return false;
      // Date range
      const txDate = (tx.timestamp || tx.date || '').slice(0, 10);
      if (filters.dateFrom && txDate < filters.dateFrom) return false;
      if (filters.dateTo && txDate > filters.dateTo) return false;
      return true;
    });
  }, [transactions, filters]);

  // ── Sorting ────────────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case 'date':
          cmp = new Date(a.timestamp || a.date || 0).getTime() -
                new Date(b.timestamp || b.date || 0).getTime();
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'member':
          cmp = a.member.localeCompare(b.member);
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'groupName':
          cmp = (a.groupName ?? '').localeCompare(b.groupName ?? '');
          break;
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sort]);

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize]
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  const updateFilter = useCallback(<K extends keyof TxFilters>(key: K, value: TxFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const toggleSort = useCallback((field: TxSort['field']) => {
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'desc' }
    );
    setPage(1);
  }, []);

  const changePageSize = useCallback((size: PageSizeOption) => {
    setPageSize(size);
    setPage(1);
  }, []);

  // ── Export helpers ─────────────────────────────────────────────────────────

  /** Returns the full filtered+sorted set (not paginated) for export */
  const exportData = sorted;

  return {
    // state
    filters,
    sort,
    page: safePage,
    pageSize,
    totalPages,
    totalFiltered: filtered.length,
    totalAll: transactions.length,
    // data
    rows: paginated,
    exportData,
    // actions
    updateFilter,
    resetFilters,
    toggleSort,
    setPage,
    changePageSize,
  };
}
