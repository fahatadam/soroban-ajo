import React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import clsx from 'clsx'
import { SortState } from '../../hooks/useTable'

export interface ColumnDef<T> {
  id: string
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface TableHeaderProps<T> {
  columns: ColumnDef<T>[]
  sort: SortState
  onSort: (columnId: string) => void
  filters: Record<string, string>
  onFilter: (columnId: string, value: string) => void
  selectable?: boolean
  isAllSelected?: boolean
  isIndeterminate?: boolean
  onToggleAll?: () => void
  density?: 'compact' | 'comfortable' | 'spacious'
  sticky?: boolean
}

const densityHeader: Record<string, string> = {
  compact: 'px-3 py-2 text-xs',
  comfortable: 'px-4 py-3 text-sm',
  spacious: 'px-6 py-4 text-sm',
}

export function TableHeader<T>({
  columns,
  sort,
  onSort,
  filters,
  onFilter,
  selectable = false,
  isAllSelected = false,
  isIndeterminate = false,
  onToggleAll,
  density = 'comfortable',
  sticky = false,
}: TableHeaderProps<T>) {
  const hasFilters = columns.some((c) => c.filterable)

  return (
    <thead
      className={clsx(
        'bg-gray-50 dark:bg-gray-800',
        sticky && 'sticky top-0 z-10',
      )}
    >
      {/* Column headers */}
      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
        {selectable && (
          <th className={clsx(densityHeader[density], 'w-10')}>
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => { if (el) el.indeterminate = isIndeterminate }}
              onChange={onToggleAll}
              aria-label="Select all rows on this page"
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
            />
          </th>
        )}
        {columns.map((col) => {
          const isActive = sort.column === col.id
          const align = col.align ?? 'left'

          return (
            <th
              key={col.id}
              style={{ width: col.width }}
              className={clsx(
                densityHeader[density],
                'font-semibold text-gray-600 dark:text-gray-300 select-none whitespace-nowrap',
                `text-${align}`,
                col.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
              )}
              onClick={() => col.sortable && onSort(col.id)}
              aria-sort={
                isActive
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : col.sortable
                  ? 'none'
                  : undefined
              }
            >
              <span className="inline-flex items-center gap-1">
                {col.header}
                {col.sortable && (
                  <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">
                    {isActive && sort.direction === 'asc' ? (
                      <ChevronUp size={14} className="text-primary-600" />
                    ) : isActive && sort.direction === 'desc' ? (
                      <ChevronDown size={14} className="text-primary-600" />
                    ) : (
                      <ChevronsUpDown size={14} className="opacity-40 group-hover:opacity-100" />
                    )}
                  </span>
                )}
              </span>
            </th>
          )
        })}
      </tr>

      {/* Filter row */}
      {hasFilters && (
        <tr className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {selectable && <th />}
          {columns.map((col) => (
            <th key={col.id} className="px-3 py-1.5">
              {col.filterable ? (
                <input
                  type="text"
                  value={filters[col.id] ?? ''}
                  onChange={(e) => onFilter(col.id, e.target.value)}
                  placeholder={`Filter ${col.header.toLowerCase()}…`}
                  aria-label={`Filter by ${col.header}`}
                  className={clsx(
                    'w-full text-xs rounded-md border border-gray-200 dark:border-gray-700',
                    'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
                    'px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-600',
                  )}
                />
              ) : null}
            </th>
          ))}
        </tr>
      )}
    </thead>
  )
}
