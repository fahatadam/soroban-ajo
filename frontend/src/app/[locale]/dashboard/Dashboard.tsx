'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '@/hooks/useDashboard'
import { useJoinGroup } from '@/hooks/useContractData'
import { GroupsGrid } from '@/components/GroupsGrid'
import { GroupsList } from '@/components/GroupsList'
import { UserGroupsDashboard } from '@/components/UserGroupsDashboard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const router = useRouter()
  const { address } = useAuth()
  const joinGroupMutation = useJoinGroup()

  const {
    viewMode, setViewMode,
    filterStatus, setFilterStatus,
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    totalPages, groups,
    isLoading, stats, userAddress,
  } = useDashboard(address || undefined)

  const handleGroupClick = (groupId: string) => router.push(`/groups/${groupId}`)

  const handleJoinGroup = async (groupId: string) => {
    try {
      await joinGroupMutation.mutateAsync(groupId)
      toast.success('Successfully joined the group!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join group')
    }
  }

  const EmptyState = () => (
    <div className="text-center py-20 px-6 rounded-2xl backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10">
      <div className="mb-6">
        <svg className="h-10 w-10 text-white/50 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No groups found</h3>
      <p className="text-sm text-white/50 max-w-sm mx-auto">
        {searchQuery || filterStatus !== 'all'
          ? 'Try adjusting your filters or search query'
          : 'Get started by creating or joining a savings group'}
      </p>
      {!searchQuery && filterStatus === 'all' && (
        <button onClick={() => router.push('/groups/create')} className="mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity">
          Create Your First Group
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="mt-1 text-white/60 text-sm">Manage your savings groups</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <StatsCard
            label="Total Savings"
            value={`${stats.totalSavingsXLM.toLocaleString()} XLM`}
            gradient="from-indigo-500 to-purple-600"
            isLoading={isLoading}
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatsCard
            label="Active Groups"
            value={stats.activeGroupsCount}
            gradient="from-emerald-500 to-teal-600"
            isLoading={isLoading}
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <StatsCard
            label="Groups Created"
            value={stats.createdGroupsCount}
            gradient="from-pink-500 to-rose-600"
            isLoading={isLoading}
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
          />
          <StatsCard
            label="Groups Joined"
            value={stats.joinedGroupsCount}
            gradient="from-amber-500 to-orange-600"
            isLoading={isLoading}
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
          />
        </div>

        {/* Quick Actions + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity groups={groups ?? []} isLoading={isLoading} />
          </div>
        </div>

        {/* User Groups Dashboard */}
        {userAddress && (
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <UserGroupsDashboard groups={groups ?? []} userAddress={userAddress} isLoading={isLoading} />
          </div>
        )}

        {/* Controls */}
        <div className="mb-4 space-y-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
              />
            </div>
            <div className="flex gap-1 p-1 rounded-xl backdrop-blur-md bg-white/10 border border-white/20">
              {(['grid', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === mode ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'completed', 'paused'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === status ? 'bg-white/20 text-white border border-white/30' : 'text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70'}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Groups Content */}
        <div className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          {!isLoading && (groups ?? []).length === 0 ? (
            <EmptyState />
          ) : viewMode === 'grid' ? (
            <GroupsGrid groups={groups ?? []} isLoading={isLoading} onGroupClick={handleGroupClick} />
          ) : (
            <GroupsList groups={groups} isLoading={isLoading} onGroupClick={handleGroupClick} onJoinGroup={handleJoinGroup} />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white text-sm disabled:opacity-40 hover:bg-white/20 transition-colors">
              Previous
            </button>
            <div className="flex gap-1.5">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${currentPage === i + 1 ? 'bg-white/20 text-white border border-white/30' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white text-sm disabled:opacity-40 hover:bg-white/20 transition-colors">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
