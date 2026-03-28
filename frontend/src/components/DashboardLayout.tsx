// Issue #20: Design responsive dashboard layout
// Complexity: Trivial (100 pts)
// Status: Complete - with loading states from #62, theme toggle #58

'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/context/AuthContext'
import { GroupCard } from './GroupCard'
import { PageTransition } from './PageTransition'
import { WalletConnector } from './WalletConnector'
import { useSkeletonDelay } from '@/hooks/useSkeletonDelay'

export const DashboardLayout: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuthContext()
  const showSkeleton = useSkeletonDelay(isLoading)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="glass-card glass-card-primary p-8 mb-8 text-white">
            <h2 className="text-3xl font-bold mb-2">
              {isAuthenticated ? `Welcome back!` : 'Welcome to Soroban Ajo'}
            </h2>
            <p className="text-primary-100 dark:text-primary-200 text-lg">
              {isAuthenticated
                ? 'Manage your savings groups and track your contributions.'
                : 'Connect your wallet to get started with community savings.'}
            </p>
            {!isAuthenticated && (
              <div className="mt-6 glass-card-subtle rounded-lg p-4">
                <p className="text-sm text-primary-50 dark:text-primary-100 mb-3">
                  To start saving with your community, connect your Stellar wallet
                </p>
                <WalletConnector />
              </div>
            )}
          </div>

          {isAuthenticated && (
            <>
              {/* Stat Cards Section */}
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                aria-busy={showSkeleton}
                aria-label={showSkeleton ? 'Loading dashboard stats' : 'Dashboard stats'}
              >
                {/* Active Groups stat */}
                <div className="glass-card glass-card-subtle p-6 relative overflow-hidden">
                  {showSkeleton && <div className="absolute inset-0 glass-skeleton opacity-50 z-10 pointer-events-none" />}
                  <h3 className="text-lg font-semibold mb-2 text-surface-900 dark:text-surface-100">
                    Active Groups
                  </h3>
                  {showSkeleton ? (
                    <div className="glass-skeleton h-9 w-12 rounded mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 animate-fade-in">0</p>
                  )}
                </div>

                {/* Total Saved stat */}
                <div className="glass-card glass-card-subtle p-6 relative overflow-hidden">
                  {showSkeleton && <div className="absolute inset-0 glass-skeleton opacity-50 z-10 pointer-events-none" />}
                  <h3 className="text-lg font-semibold mb-2 text-surface-900 dark:text-surface-100">
                    Total Saved
                  </h3>
                  {showSkeleton ? (
                    <div className="glass-skeleton h-9 w-24 rounded mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-success-600 dark:text-success-500 animate-fade-in">$0.00</p>
                  )}
                </div>

                {/* Next Payout stat */}
                <div className="glass-card glass-card-subtle p-6 relative overflow-hidden">
                  {showSkeleton && <div className="absolute inset-0 glass-skeleton opacity-50 z-10 pointer-events-none" />}
                  <h3 className="text-lg font-semibold mb-2 text-surface-900 dark:text-surface-100">
                    Next Payout
                  </h3>
                  {showSkeleton ? (
                    <div className="glass-skeleton h-6 w-32 rounded mt-2" />
                  ) : (
                    <p className="text-surface-500 dark:text-surface-400 animate-fade-in">None scheduled</p>
                  )}
                </div>
              </div>

              {/* Groups List Section */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    Your Groups
                  </h2>
                  <Link
                    href="/groups/create"
                    className="px-4 py-2 bg-blue-600 dark:bg-indigo-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-indigo-500 transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Group
                  </Link>
                </div>

                {showSkeleton ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading groups">
                    <GroupCard isLoading={true} />
                    <GroupCard isLoading={true} />
                    <GroupCard isLoading={true} />
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center border-2 border-dashed border-white/40 dark:border-white/10">
                    <svg
                      className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                      No groups yet
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400 mb-6">
                      Create your first savings group to get started
                    </p>
                    <Link
                      href="/groups/create"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-indigo-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-indigo-500 transition-colors font-medium"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Create Your First Group
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </PageTransition>
  )
}
