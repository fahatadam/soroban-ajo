import React from 'react'
import clsx from 'clsx'
import { ColumnDef } from './TableHeader'

export interface TableRowProps<T> {
  row: T
  rowId: string
  columns: ColumnDef<T>[]
  isSelected?: boolean
  selectable?: boolean
  onSelect?: (id: string) => void
  onClick?: (row: T) => void
  density?: 'compact' | 'comfortable' | 'spacious'
}

const densityCell: Record<string, string> = {
  compact: 'px-3 py-1.5 text-sm',
  comfortable: 'px-4 py-3 text-sm',
  spacious: 'px-6 py-4 text-base',
}

export function TableRow<T extends Record<string, unknown>>({
  row,
  rowId,
  columns,
  isSelected = false,
  selectable = false,
  onSelect,
  onClick,
  density = 'comfortable',
}: TableRowProps<T>) {
  const cellClass = densityCell[density]
  const isClickable = !!onClick

  const getCellValue = (col: ColumnDef<T>): React.ReactNode => {
    const raw =
      typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor as keyof T]
    return col.render ? col.render(raw as unknown, row) : (raw as React.ReactNode)
  }

  return (
    <tr
      className={clsx(
        'border-b border-gray-100 dark:border-gray-800 transition-colors',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'bg-white dark:bg-gray-900',
        isClickable && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
        !isClickable && 'hover:bg-gray-50/60 dark:hover:bg-gray-800/60',
      )}
      onClick={() => onClick?.(row)}
      aria-selected={selectable ? isSelected : undefined}
    >
      {selectable && (
        <td className={clsx(cellClass, 'w-10')}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onSelect?.(rowId)
            }}
            aria-label={`Select row ${rowId}`}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
          />
        </td>
      )}
      {columns.map((col) => (
        <td
          key={col.id}
          className={clsx(
            cellClass,
            `text-${col.align ?? 'left'}`,
            'text-gray-800 dark:text-gray-200',
          )}
        >
          {getCellValue(col)}
        </td>
      ))}
    </tr>
  )
}
