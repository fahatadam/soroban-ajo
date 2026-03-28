import { useState, useMemo } from 'react'
import { Group } from '@/types'

/**
 * Extended group interface for the explore discovery page.
 * Includes derived stats like popularity scores and creator reputation.
 */
export interface ExploreGroup extends Group {
  tags: string[]
  popularity: number
  creatorReputation: number
  creatorGroupsCount: number
  totalRaised: number
  isJoined: boolean
}

/**
 * Filter configuration for group discovery.
 */
export interface ExploreFilters {
  /** Text search for name or description */
  search: string
  minAmount: number | ''
  maxAmount: number | ''
  minMembers: number | ''
  maxMembers: number | ''
  minDuration: number | ''
  maxDuration: number | ''
  status: 'all' | 'active' | 'completed' | 'paused'
  tags: string[]
  frequency: 'all' | 'weekly' | 'monthly'
}

export type ExploreSortField = 'popularity' | 'createdAt' | 'members' | 'amount' | 'totalRaised'

export interface ExploreSort {
  field: ExploreSortField
  direction: 'asc' | 'desc'
}

const ITEMS_PER_PAGE = 9

export const ALL_TAGS = ['savings', 'housing', 'education', 'emergency', 'business', 'vacation', 'family', 'community']

const defaultFilters: ExploreFilters = {
  search: '',
  minAmount: '',
  maxAmount: '',
  minMembers: '',
  maxMembers: '',
  minDuration: '',
  maxDuration: '',
  status: 'all',
  tags: [],
  frequency: 'all',
}

const MOCK_GROUPS: ExploreGroup[] = [
  {
    id: 'g1',
    name: 'Monthly Savers Circle',
    description: 'A community of dedicated savers working together toward financial freedom. We contribute monthly and rotate payouts fairly among trusted members.',
    creator: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5TO85CAJTL73B57GNTV5M',
    cycleLength: 30,
    contributionAmount: 100,
    maxMembers: 10,
    currentMembers: 8,
    totalContributions: 4800,
    status: 'active',
    createdAt: '2024-01-15',
    nextPayoutDate: '2024-03-01',
    frequency: 'monthly',
    duration: 10,
    tags: ['savings', 'community'],
    popularity: 92,
    creatorReputation: 4.8,
    creatorGroupsCount: 3,
    totalRaised: 9600,
    isJoined: false,
  },
  {
    id: 'g2',
    name: 'Housing Down Payment Fund',
    description: 'Helping members save for their first home. High commitment group with rigorous screening to ensure all members meet contribution deadlines.',
    creator: 'GBRP7XKJMZYVDCQFNHW2NQ3BPLT4UXREA6FQHZDK8CM5YN9V3SN2Q',
    cycleLength: 30,
    contributionAmount: 500,
    maxMembers: 8,
    currentMembers: 6,
    totalContributions: 18000,
    status: 'active',
    createdAt: '2023-11-01',
    nextPayoutDate: '2024-02-28',
    frequency: 'monthly',
    duration: 8,
    tags: ['housing', 'savings'],
    popularity: 78,
    creatorReputation: 4.9,
    creatorGroupsCount: 5,
    totalRaised: 24000,
    isJoined: false,
  },
  {
    id: 'g3',
    name: 'College Tuition Savers',
    description: 'Parents and students pooling resources for higher education expenses. Flexible contribution schedule with monthly payouts.',
    creator: 'GCLT9ADKPVMRWXUQBTHYZFJ6NK2SE8OCIG5LQRMBWP4A3HVD7YK7R',
    cycleLength: 30,
    contributionAmount: 200,
    maxMembers: 12,
    currentMembers: 9,
    totalContributions: 10800,
    status: 'active',
    createdAt: '2024-01-20',
    nextPayoutDate: '2024-03-15',
    frequency: 'monthly',
    duration: 12,
    tags: ['education', 'family'],
    popularity: 71,
    creatorReputation: 4.5,
    creatorGroupsCount: 2,
    totalRaised: 21600,
    isJoined: false,
  },
  {
    id: 'g4',
    name: 'Weekly Emergency Stash',
    description: 'Build your emergency fund quickly with weekly micro-contributions. Perfect for anyone starting their financial safety net.',
    creator: 'GDMN3PVKQRXZTJWYHIBOALSUF5EC4D8GNLJ2QOAM9T7BCRK6WF9T',
    cycleLength: 7,
    contributionAmount: 50,
    maxMembers: 20,
    currentMembers: 15,
    totalContributions: 3000,
    status: 'active',
    createdAt: '2024-02-01',
    nextPayoutDate: '2024-02-22',
    frequency: 'weekly',
    duration: 20,
    tags: ['emergency', 'savings'],
    popularity: 85,
    creatorReputation: 4.2,
    creatorGroupsCount: 4,
    totalRaised: 4000,
    isJoined: false,
  },
  {
    id: 'g5',
    name: 'Small Business Startup Pool',
    description: 'Entrepreneurs supporting each other to launch small businesses. Larger contributions with quarterly payouts for business capital.',
    creator: 'GBXR4TYWNZPQHKFD3CVMUASJ8LEB6OI5GMDQRTNKYV2CHX7P9M2C',
    cycleLength: 90,
    contributionAmount: 1000,
    maxMembers: 5,
    currentMembers: 4,
    totalContributions: 16000,
    status: 'active',
    createdAt: '2023-10-01',
    nextPayoutDate: '2024-04-01',
    frequency: 'monthly',
    duration: 5,
    tags: ['business', 'savings'],
    popularity: 63,
    creatorReputation: 4.7,
    creatorGroupsCount: 1,
    totalRaised: 20000,
    isJoined: false,
  },
  {
    id: 'g6',
    name: 'Summer Vacation Fund',
    description: 'Travel together or individually with funds from this vacation savings group. Monthly contributions for a summer payout.',
    creator: 'GDYH5RFPKBJNMQVXLW3OAZUTC9SED2I7GHCQR4MKY8VBNO6P1B',
    cycleLength: 30,
    contributionAmount: 150,
    maxMembers: 8,
    currentMembers: 5,
    totalContributions: 2250,
    status: 'active',
    createdAt: '2024-01-10',
    nextPayoutDate: '2024-06-01',
    frequency: 'monthly',
    duration: 8,
    tags: ['vacation', 'savings'],
    popularity: 74,
    creatorReputation: 4.3,
    creatorGroupsCount: 2,
    totalRaised: 3600,
    isJoined: false,
  },
  {
    id: 'g7',
    name: 'Community Growth Circle',
    description: 'A tight-knit community group focused on collective wealth building. All members are vetted and active contributors.',
    creator: 'GCNQ8LTYVFPKBJEM6DRAXUS3WZI5OHG9NLQCM2RBWP7K4V0D',
    cycleLength: 30,
    contributionAmount: 75,
    maxMembers: 15,
    currentMembers: 12,
    totalContributions: 5400,
    status: 'active',
    createdAt: '2023-12-01',
    nextPayoutDate: '2024-03-01',
    frequency: 'monthly',
    duration: 15,
    tags: ['community', 'savings'],
    popularity: 88,
    creatorReputation: 4.6,
    creatorGroupsCount: 6,
    totalRaised: 6750,
    isJoined: false,
  },
  {
    id: 'g8',
    name: 'Rent Assistance Network',
    description: "Helping renters build stability by saving for deposits and first month's rent. Bi-weekly contributions with monthly payouts.",
    creator: 'GBMK6QZYDVFPNJRXWCATO4LUH2SE8IB7GQMO3KYTCNXPVR5S8E',
    cycleLength: 30,
    contributionAmount: 250,
    maxMembers: 10,
    currentMembers: 10,
    totalContributions: 12500,
    status: 'active',
    createdAt: '2023-09-01',
    nextPayoutDate: '2024-02-15',
    frequency: 'monthly',
    duration: 10,
    tags: ['housing', 'community'],
    popularity: 95,
    creatorReputation: 5.0,
    creatorGroupsCount: 8,
    totalRaised: 25000,
    isJoined: false,
  },
  {
    id: 'g9',
    name: 'Weekly Micro Savers',
    description: 'Low barrier entry for anyone wanting to start saving. Just $25 weekly to build consistent savings habits in a supportive community.',
    creator: 'GDTV2NKPQXRYBWHZOFASM6JEU3DL9IGC4NQMBT5YRVCKH7P3F',
    cycleLength: 7,
    contributionAmount: 25,
    maxMembers: 20,
    currentMembers: 18,
    totalContributions: 2250,
    status: 'active',
    createdAt: '2024-01-05',
    nextPayoutDate: '2024-02-19',
    frequency: 'weekly',
    duration: 20,
    tags: ['savings', 'community'],
    popularity: 90,
    creatorReputation: 4.4,
    creatorGroupsCount: 3,
    totalRaised: 2500,
    isJoined: false,
  },
  {
    id: 'g10',
    name: 'Education Scholarship Pool',
    description: 'Professionals and parents funding certification courses and degree programs. Three-month cycles with substantial payouts.',
    creator: 'GCXP3MRTZKVYSQNJDWBFHAI4OLE6UG8QCFM2BYPT9VRDKX5J6G',
    cycleLength: 90,
    contributionAmount: 300,
    maxMembers: 6,
    currentMembers: 4,
    totalContributions: 7200,
    status: 'active',
    createdAt: '2023-12-15',
    nextPayoutDate: '2024-03-15',
    frequency: 'monthly',
    duration: 6,
    tags: ['education', 'savings'],
    popularity: 58,
    creatorReputation: 4.7,
    creatorGroupsCount: 2,
    totalRaised: 10800,
    isJoined: false,
  },
  {
    id: 'g11',
    name: 'Family Emergency Fund',
    description: 'Families coming together to build emergency safety nets. Monthly contributions with priority payouts for urgent needs.',
    creator: 'GBLM9XRPKVFTNWCQYH5AJZUE3BS7OID6GNQMLT4RBWCPX2T5H',
    cycleLength: 30,
    contributionAmount: 125,
    maxMembers: 8,
    currentMembers: 7,
    totalContributions: 3500,
    status: 'active',
    createdAt: '2024-01-25',
    nextPayoutDate: '2024-03-25',
    frequency: 'monthly',
    duration: 8,
    tags: ['emergency', 'family'],
    popularity: 69,
    creatorReputation: 4.5,
    creatorGroupsCount: 1,
    totalRaised: 4000,
    isJoined: false,
  },
  {
    id: 'g12',
    name: 'Digital Nomad Travel Fund',
    description: 'Remote workers pooling funds for travel and coworking. Quarterly payouts to fund adventure and exploration worldwide.',
    creator: 'GDKN4RTZWYVSQHPJXCFBAMO6LUI3EG5DCNQMLT8RBWKPX9B8I',
    cycleLength: 90,
    contributionAmount: 200,
    maxMembers: 10,
    currentMembers: 6,
    totalContributions: 4800,
    status: 'active',
    createdAt: '2024-01-01',
    nextPayoutDate: '2024-04-01',
    frequency: 'monthly',
    duration: 10,
    tags: ['vacation', 'community'],
    popularity: 76,
    creatorReputation: 4.1,
    creatorGroupsCount: 2,
    totalRaised: 8000,
    isJoined: false,
  },
  {
    id: 'g13',
    name: 'Freelancer Business Capital',
    description: 'Freelancers and solopreneurs funding equipment, software, and marketing. Bi-monthly payouts to support business growth.',
    creator: 'GCZQ7PVKNYFSRXWCJTOAL5UH3BE8IG6DQMO4KYTCNXPVR2S9J',
    cycleLength: 60,
    contributionAmount: 400,
    maxMembers: 6,
    currentMembers: 5,
    totalContributions: 8000,
    status: 'active',
    createdAt: '2023-11-15',
    nextPayoutDate: '2024-03-15',
    frequency: 'monthly',
    duration: 6,
    tags: ['business', 'savings'],
    popularity: 61,
    creatorReputation: 4.6,
    creatorGroupsCount: 3,
    totalRaised: 9600,
    isJoined: false,
  },
  {
    id: 'g14',
    name: 'Home Renovation Circle',
    description: 'Homeowners saving for renovations and repairs. Monthly contributions with rotating payouts for major home improvement projects.',
    creator: 'GBWT5NKPQXRZYWHFOAS4JEU6DL8IGCMNQMBT2YRVCKH9P7C9K',
    cycleLength: 30,
    contributionAmount: 350,
    maxMembers: 8,
    currentMembers: 8,
    totalContributions: 14000,
    status: 'completed',
    createdAt: '2023-06-01',
    nextPayoutDate: '2024-02-01',
    frequency: 'monthly',
    duration: 8,
    tags: ['housing', 'savings'],
    popularity: 82,
    creatorReputation: 4.9,
    creatorGroupsCount: 4,
    totalRaised: 16800,
    isJoined: false,
  },
  {
    id: 'g15',
    name: 'Student Loan Payoff Group',
    description: 'Recent graduates helping each other pay off student loans faster. Bi-weekly contributions with monthly payouts to tackle debt.',
    creator: 'GDFS8QMTVKYPRXWCJTO3LUH5BE9IG4DQMO6KYTCNXPVR7S2V7L',
    cycleLength: 30,
    contributionAmount: 175,
    maxMembers: 12,
    currentMembers: 9,
    totalContributions: 9450,
    status: 'active',
    createdAt: '2024-01-30',
    nextPayoutDate: '2024-03-30',
    frequency: 'monthly',
    duration: 12,
    tags: ['education', 'savings'],
    popularity: 73,
    creatorReputation: 4.3,
    creatorGroupsCount: 1,
    totalRaised: 12600,
    isJoined: false,
  },
  {
    id: 'g16',
    name: 'Neighborhood Watch Fund',
    description: 'Community members saving for local security improvements and emergency preparedness. Low monthly contribution with collective impact.',
    creator: 'GCMH2TRPKVFYNWCQZH5AJUE6BS8OID3GNQMLT7RBWCPX4T2A4M',
    cycleLength: 30,
    contributionAmount: 50,
    maxMembers: 20,
    currentMembers: 14,
    totalContributions: 4200,
    status: 'paused',
    createdAt: '2023-10-15',
    nextPayoutDate: '2024-04-15',
    frequency: 'monthly',
    duration: 20,
    tags: ['community', 'emergency'],
    popularity: 55,
    creatorReputation: 3.9,
    creatorGroupsCount: 1,
    totalRaised: 6000,
    isJoined: false,
  },
  {
    id: 'g17',
    name: 'Holiday Gift Savings',
    description: 'Friends and family saving together for holiday gifts and celebrations. Small weekly amounts add up to meaningful holiday budgets.',
    creator: 'GBYL6PTZWYVSQHNKXCFBAO4LUI5EG8DCNQMLT3RBWKPX6B1N',
    cycleLength: 7,
    contributionAmount: 40,
    maxMembers: 15,
    currentMembers: 11,
    totalContributions: 2200,
    status: 'active',
    createdAt: '2024-01-08',
    nextPayoutDate: '2024-12-01',
    frequency: 'weekly',
    duration: 15,
    tags: ['family', 'savings'],
    popularity: 80,
    creatorReputation: 4.4,
    creatorGroupsCount: 2,
    totalRaised: 3000,
    isJoined: false,
  },
  {
    id: 'g18',
    name: 'Professional Development Fund',
    description: 'Career-focused individuals saving for conferences, certifications, and courses. Monthly payouts for professional growth opportunities.',
    creator: 'GDMK3RTZVKYSQHPJXCFBAMO5LUI4EG7DCNQMLT9RBWKPX8B6P6O',
    cycleLength: 30,
    contributionAmount: 80,
    maxMembers: 10,
    currentMembers: 7,
    totalContributions: 3360,
    status: 'active',
    createdAt: '2024-02-01',
    nextPayoutDate: '2024-05-01',
    frequency: 'monthly',
    duration: 10,
    tags: ['education', 'business'],
    popularity: 66,
    creatorReputation: 4.5,
    creatorGroupsCount: 2,
    totalRaised: 4800,
    isJoined: false,
  },
]

/**
 * Hook for managing the group exploration and discovery state.
 * Handles client-side filtering, multi-field sorting, and pagination of 
 * available savings groups.
 * 
 * @returns Filtered data, pagination state, and update actions
 */
export function useExplore() {
  const [filters, setFilters] = useState<ExploreFilters>(defaultFilters)
  const [sort, setSort] = useState<ExploreSort>({ field: 'popularity', direction: 'desc' })
  const [page, setPage] = useState(1)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())

  const filteredGroups = useMemo(() => {
    let result = MOCK_GROUPS.map(g => ({ ...g, isJoined: joinedIds.has(g.id) }))

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        g =>
          g.name.toLowerCase().includes(q) ||
          g.creator.toLowerCase().includes(q) ||
          (g.description?.toLowerCase().includes(q) ?? false)
      )
    }

    if (filters.minAmount !== '') result = result.filter(g => g.contributionAmount >= Number(filters.minAmount))
    if (filters.maxAmount !== '') result = result.filter(g => g.contributionAmount <= Number(filters.maxAmount))
    if (filters.minMembers !== '') result = result.filter(g => g.maxMembers >= Number(filters.minMembers))
    if (filters.maxMembers !== '') result = result.filter(g => g.maxMembers <= Number(filters.maxMembers))
    if (filters.minDuration !== '') result = result.filter(g => (g.duration ?? 0) >= Number(filters.minDuration))
    if (filters.maxDuration !== '') result = result.filter(g => (g.duration ?? 0) <= Number(filters.maxDuration))

    if (filters.status !== 'all') result = result.filter(g => g.status === filters.status)
    if (filters.frequency !== 'all') result = result.filter(g => g.frequency === filters.frequency)
    if (filters.tags.length > 0) result = result.filter(g => filters.tags.some(tag => g.tags.includes(tag)))

    result.sort((a, b) => {
      let aVal: number
      let bVal: number
      switch (sort.field) {
        case 'popularity':
          aVal = a.popularity; bVal = b.popularity; break
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break
        case 'members':
          aVal = a.currentMembers; bVal = b.currentMembers; break
        case 'amount':
          aVal = a.contributionAmount; bVal = b.contributionAmount; break
        case 'totalRaised':
          aVal = a.totalRaised; bVal = b.totalRaised; break
        default:
          aVal = a.popularity; bVal = b.popularity
      }
      return sort.direction === 'desc' ? bVal - aVal : aVal - bVal
    })

    return result
  }, [filters, sort, joinedIds])

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / ITEMS_PER_PAGE))

  const paginatedGroups = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredGroups.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredGroups, page])

  const updateFilters = (updates: Partial<ExploreFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    setPage(1)
  }

  const joinGroup = (groupId: string) => {
    setJoinedIds(prev => new Set([...prev, groupId]))
  }

  return {
    filteredGroups,
    paginatedGroups,
    filters,
    updateFilters,
    resetFilters,
    sort,
    setSort: (s: ExploreSort) => { setSort(s); setPage(1) },
    page,
    setPage,
    totalPages,
    totalCount: filteredGroups.length,
    joinGroup,
  }
}
