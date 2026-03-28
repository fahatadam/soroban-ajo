'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export type RefundStatus = 'pending' | 'voting' | 'approved' | 'rejected' | 'executed'

export interface RefundRequest {
  id: string
  groupId: string
  requestedBy: string
  reason: string
  amount?: string
  status: RefundStatus
  votes: Record<string, 'yes' | 'no'>
  votingDeadline: string
  createdAt: string
  executedAt?: string
  txHash?: string
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('ajo_auth_token') : null
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function useRefund(groupId: string) {
  const qc = useQueryClient()
  const key = ['refunds', groupId]

  const { data: refunds = [], isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => apiFetch<{ data: RefundRequest[] }>(`/api/refunds/group/${groupId}`).then((r) => r.data),
    enabled: !!groupId,
  })

  const requestMutation = useMutation({
    mutationFn: (body: { reason: string; amount?: string }) =>
      apiFetch<RefundRequest>('/api/refunds', {
        method: 'POST',
        body: JSON.stringify({ groupId, ...body }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const voteMutation = useMutation({
    mutationFn: ({ id, vote }: { id: string; vote: 'yes' | 'no' }) =>
      apiFetch<RefundRequest>(`/api/refunds/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ vote }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const executeMutation = useMutation({
    mutationFn: ({ id, txHash }: { id: string; txHash: string }) =>
      apiFetch<RefundRequest>(`/api/refunds/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify({ txHash }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return {
    refunds,
    isLoading,
    error: error ? (error as Error).message : null,
    requestRefund: requestMutation.mutateAsync,
    isRequesting: requestMutation.isPending,
    vote: voteMutation.mutateAsync,
    isVoting: voteMutation.isPending,
    execute: executeMutation.mutateAsync,
    isExecuting: executeMutation.isPending,
  }
}
