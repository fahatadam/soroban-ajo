import { useState, useMemo, useCallback } from 'react'

export type SortDirection = 'asc' | 'desc' | null

export interface SortState {
  column: string | null
  direction: SortDirection
}

export interface FilterState {
  [columnId: string]: string
}

export interface PaginationState {
  page: number
  pageSize: number
}

export interface UseTableOptions<T> {
  data: T[]
  getRowId?: (row: T) => string
  initialPageSize?: number
  initialSort?: SortState
}

export interface UseTableReturn<T> {
  // Processed data
  rows: T[]
  totalRows: number
  // Sort
  sort: SortState
  setSort: (column: string) => void
  // Filter
  filters: FilterState
  setFilter: (columnId: string, value: string) => void
  clearFilters: () => void
  // Pagination
  pagination: PaginationState
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  // Selection
  selectedIds: Set<string>
  toggleRow: (id: string) => void
  toggleAll: () => void
  clearSelection: () => void
  isAllSelected: boolean
  isIndeterminate: boolean
}

export function useTable<T extends Record<string, unknown>>({
  data,
  getRowId = (row) => String(row.id ?? ''),
  initialPageSize = 10,
  initialSort = { column: null, direction: null },
}: UseTableOptions<T>): UseTableReturn<T> {
  const [sort, setSortState] = useState<SortState>(initialSort)
  const [filters, setFilters] = useState<FilterState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 1. Filter
  const filteredData = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([, v]: [string, string]) => v.trim() !== '')
    if (activeFilters.length === 0) return data

    return data.filter((row) =>
      activeFilters.every(([key, value]: [string, string]) => {
        const cell = row[key]
        return String(cell ?? '').toLowerCase().includes(value.toLowerCase())
      }),
    )
  }, [data, filters])

  // 2. Sort
  const sortedData = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredData

    const key = sort.column
    return [...filteredData].sort((a, b) => {
      const av = a[key]
      const bv = b[key]

      if (typeof av === 'number' && typeof bv === 'number') {
        return sort.direction === 'asc' ? av - bv : bv - av
      }

      const as = String(av ?? '')
      const bs = String(bv ?? '')
      const cmp = as.localeCompare(bs)
      return sort.direction === 'asc' ? cmp : -cmp
    })
  }, [filteredData, sort])

  // 3. Paginate
  const totalRows = sortedData.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pagination.pageSize))

  const rows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return sortedData.slice(start, start + pagination.pageSize)
  }, [sortedData, pagination])

  // Sort toggle: asc → desc → null
  const setSort = useCallback((column: string) => {
    setSortState((prev) => {
      if (prev.column !== column) return { column, direction: 'asc' }
      if (prev.direction === 'asc') return { column, direction: 'desc' }
      return { column: null, direction: null }
    })
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const setFilter = useCallback((columnId: string, value: string) => {
    setFilters((prev) => ({ ...prev, [columnId]: value }))
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setPagination((p) => ({ ...p, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setPagination({ page: 1, pageSize })
  }, [])

  // Selection
  const pageIds = useMemo(() => rows.map(getRowId), [rows, getRowId])
  const isAllSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const isIndeterminate = !isAllSelected && pageIds.some((id) => selectedIds.has(id))

  const toggleRow = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
    },
    [],
  )

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (isAllSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }, [isAllSelected, pageIds])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  return {
    rows,
    totalRows,
    sort,
    setSort,
    filters,
    setFilter,
    clearFilters,
    pagination,
    totalPages,
    setPage,
    setPageSize,
    selectedIds,
    toggleRow,
    toggleAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
  }
}
