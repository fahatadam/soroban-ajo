/**
 * @file GroupDetailPage.tsx
 * @description The primary dashboard page for a specific savings group.
 * Orchestrates multiple sub-components across tabs (Overview, Members, History, Settings)
 * and provides group-level actions like inviting members and making contributions.
 */

import React, { useState } from 'react'
import { ContributionForm } from './ContributionForm'
import { MemberList } from './MemberList'
import { TransactionHistory } from './TransactionHistory'
import InviteModal from './InviteModal'
import { GroupHeader } from './group/GroupHeader'
import { MemberCard } from './group/MemberCard'
import { ContributionTimeline } from './group/ContributionTimeline'
import { useGroupDetail, useGroupMembers } from '../hooks/useContractData'

type TabKey = 'overview' | 'members' | 'timeline' | 'settings'

/**
 * Properties for the GroupDetailPage component.
 */
interface GroupDetailPageProps {
  /** The unique identifier of the group to display */
  groupId: string
  /** Optional group name passed from parent (overridden by fetched data) */
  groupName?: string
  /** Callback for sharing the group invite */
  onShareLink?: () => void
  /** Callback for copying the group invite link to clipboard */
  onCopyLink?: () => void
}

/**
 * A tabbed dashboard component for viewing and interacting with a single Ajo group.
 * Fetches real-time group and member data from the Soroban contract.
 * 
 * @param props - Component properties
 */
export const GroupDetailPage: React.FC<GroupDetailPageProps> = ({
  groupId,
  groupName: propGroupName,
  onShareLink,
  onCopyLink,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const { data: groupDetail, isLoading: isLoadingDetail } = useGroupDetail(groupId)
  const { data: members, isLoading: isLoadingMembers } = useGroupMembers(groupId)

  const groupName = groupDetail?.name || propGroupName || 'Loading...'
  const groupStatus = groupDetail?.status || 'active'
  const memberCount = members?.length || 0
  const maxMembers = groupDetail?.maxMembers || 10
  const cycleLength = groupDetail?.cycleLength || 30
  const contributionAmount = groupDetail?.contributionAmount || 500
  const totalCollected = groupDetail?.totalCollected || 0
  const nextPayoutDate = groupDetail?.nextPayoutDate || 'TBD'

  const handleInvite = () => {
    setIsInviteModalOpen(true)
    onShareLink?.()
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: `Members (${memberCount})` },
    { key: 'timeline', label: 'Timeline' },
    { key: 'settings', label: 'Settings' },
  ]

  return (
    <div className="space-y-5">
      {/* Redesigned header */}
      <GroupHeader
        groupId={groupId}
        groupName={groupName}
        status={groupStatus}
        memberCount={memberCount}
        maxMembers={maxMembers}
        cycleLength={cycleLength}
        contributionAmount={contributionAmount}
        totalCollected={totalCollected}
        isLoading={isLoadingDetail}
        onInvite={handleInvite}
      />

      <InviteModal
        groupId={groupId}
        groupName={groupName}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      {/* Tabs */}
      <div className="rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 overflow-hidden">
        <div className="border-b border-white/10">
          <nav className="flex gap-1 px-4 pt-2">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                  activeTab === key
                    ? 'bg-white/10 text-white border-b-2 border-indigo-400'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-5">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                {/* Next payout card */}
                <div className="rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 p-4">
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Next Payout</p>
                  <p className="text-2xl font-bold text-white">
                    {isLoadingDetail ? '...' : nextPayoutDate}
                  </p>
                </div>
                <TransactionHistory groupId={groupId} />
              </div>
              <ContributionForm groupId={groupId} contributionAmount={contributionAmount} />
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              {isLoadingMembers ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4 h-32 animate-pulse" />
                  ))}
                </div>
              ) : members && members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {members.map((member, i) => (
                    <MemberCard key={member.address} member={member} groupId={groupId} rank={i + 1} />
                  ))}
                </div>
              ) : (
                <MemberList groupId={groupId} />
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="max-w-2xl">
              <ContributionTimeline transactions={[]} isLoading={isLoadingDetail} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-bold text-white">Group Settings</h3>
              <p className="text-white/50 text-sm">
                Settings for group creator — pause, update metadata, or cancel the group.
              </p>
              <button className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors">
                Cancel Group (Creator Only)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
