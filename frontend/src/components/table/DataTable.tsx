import React from 'react'
import clsx from 'clsx'
import { Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useTable, UseTableOptions } from '../../hooks/useTable'
import { TableHeader, ColumnDef } from './TableHeader'
import { TableRow } from './TableRow'

export type { ColumnDef }

export interface DataTableProps<T extends Record<string, unknown>> extends UseTableOptions<T> {
  columns: ColumnDef<T>[]
  selectable?: boolean
  onRowClick?: (row: T) => void
  density?: 'compact' | 'comfortable' | 'spacious'
  sticky?: boolean
  loading?: boolean
  emptyMessage?: string
  /** Global search across all filterable columns */
  searchable?: boolean
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  getRowId,
  initialPageSize,
  initialSort,
  selectable = false,
  onRowClick,
  density = 'comfortable',
  sticky = false,
  loading = false,
  emptyMessage = 'No results found.',
  searchable = false,
  className,
}: DataTableProps<T>) {
  const [globalSearch, setGlobalSearch] = React.useState('')

  // Apply global search on top of data before passing to hook
  const filteredBySearch = React.useMemo(() => {
    if (!globalSearch.trim()) return data
    const q = globalSearch.toLowerCase()
    return data.filter((row) =>
      columns
        .filter((c) => c.filterable !== false)
        .some((c) => {
          const val =
            typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor as keyof T]
          return String(val ?? '').toLowerCase().includes(q)
        }),
    )
  }, [data, globalSearch, columns])

  const table = useTable<T>({
    data: filteredBySearch,
    getRowId,
    initialPageSize,
    initialSort,
  })

  const colSpan = columns.length + (selectable ? 1 : 0)
  const startItem = (table.pagination.page - 1) * table.pagination.pageSize + 1
  const endItem = Math.min(table.pagination.page * table.pagination.pageSize, table.totalRows)

  const hasActiveFilters =
    globalSearch.trim() !== '' ||
    Object.values(table.filters).some((v) => v.trim() !== '')

  return (
    <div className={clsx('flex flex-col gap-0 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden', className)}>

      {/* Toolbar */}
      {(searchable || hasActiveFilters) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          {searchable && (
            <div className="relative max-w-xs w-full">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search…"
                aria-label="Search table"
                className={clsx(
                  'w-full pl-8 pr-8 py-1.5 text-sm rounded-lg',
                  'border border-gray-200 dark:border-gray-700',
                  'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'placeholder:text-gray-400',
                )}
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={() => {
                setGlobalSearch('')
                table.clearFilters()
              }}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 whitespace-nowrap"
            >
              Clear filters
            </button>
          )}

          {table.selectedIds.size > 0 && (
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              {table.selectedIds.size} selected
            </span>
          )}
        </div>
      )}

      {/* Responsive scroll wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" role="grid" aria-rowcount={table.totalRows}>
          <TableHeader
            columns={columns}
            sort={table.sort}
            onSort={table.setSort}
            filters={table.filters}
            onFilter={table.setFilter}
            selectable={selectable}
            isAllSelected={table.isAllSelected}
            isIndeterminate={table.isIndeterminate}
            onToggleAll={table.toggleAll}
            density={density}
            sticky={sticky}
          />

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-7 h-7 rounded-full border-[3px] border-primary-500 border-t-transparent animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span>
                  </div>
                </td>
              </tr>
            ) : table.rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-600">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 10h18M3 14h18M10 3v18M14 3v18" />
                    </svg>
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              table.rows.map((row) => {
                const id = (getRowId ?? ((r) => String(r.id ?? '')))(row)
                return (
                  <TableRow
                    key={id}
                    row={row}
                    rowId={id}
                    columns={columns}
                    isSelected={table.selectedIds.has(id)}
                    selectable={selectable}
                    onSelect={table.toggleRow}
                    onClick={onRowClick}
                    density={density}
                  />
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        {/* Page size */}
        <div className="flex items-center gap-2">
          <label htmlFor="dt-page-size" className="text-xs">Rows</label>
          <select
            id="dt-page-size"
            value={table.pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className={clsx(
              'text-xs rounded-md border border-gray-200 dark:border-gray-700',
              'bg-gray-50 dark:bg-gray-800 px-2 py-1',
              'focus:outline-none focus:ring-1 focus:ring-primary-500',
            )}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-xs">
            {table.totalRows === 0 ? 'No results' : `${startItem}–${endItem} of ${table.totalRows}`}
          </span>
        </div>

        {/* Page nav */}
        <div className="flex items-center gap-1">
          <NavButton onClick={() => table.setPage(1)} disabled={table.pagination.page === 1} aria-label="First page">
            <ChevronsLeft size={15} />
          </NavButton>
          <NavButton onClick={() => table.setPage(table.pagination.page - 1)} disabled={table.pagination.page === 1} aria-label="Previous page">
            <ChevronLeft size={15} />
          </NavButton>

          <PageNumbers
            current={table.pagination.page}
            total={table.totalPages}
            onSelect={table.setPage}
          />

          <NavButton onClick={() => table.setPage(table.pagination.page + 1)} disabled={table.pagination.page === table.totalPages} aria-label="Next page">
            <ChevronRight size={15} />
          </NavButton>
          <NavButton onClick={() => table.setPage(table.totalPages)} disabled={table.pagination.page === table.totalPages} aria-label="Last page">
            <ChevronsRight size={15} />
          </NavButton>
        </div>
      </div>
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────

function NavButton({
  children,
  disabled,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode
  disabled: boolean
  onClick: () => void
  'aria-label': string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={clsx(
        'p-1 rounded-md transition-colors',
        disabled
          ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
      )}
    >
      {children}
    </button>
  )
}

function PageNumbers({
  current,
  total,
  onSelect,
}: {
  current: number
  total: number
  onSelect: (p: number) => void
}) {
  const pages: (number | '…')[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('…')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('…')
    pages.push(total)
  }

  return (
    <>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-gray-400 select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onSelect(p)}
            aria-label={`Page ${p}`}
            aria-current={current === p ? 'page' : undefined}
            className={clsx(
              'min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors',
              current === p
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            {p}
          </button>
        ),
      )}
    </>
  )
}
