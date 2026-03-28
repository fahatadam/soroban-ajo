import { UserProfile, UserPreferences, Activity } from '../hooks/useProfile'

const STORAGE_PREFIX = 'soroban_ajo_profile_'
const ACTIVITIES_PREFIX = 'soroban_ajo_activities_'
const PREFERENCES_PREFIX = 'soroban_ajo_preferences_'

/**
 * Profile Service - Handles user profile management and persistence.
 * Uses localStorage as the persistence layer in this client-side implementation.
 */
export class ProfileService {
  /**
   * Get profile by address
   * Equivalent to: GET /api/profile/:address
   */
  static async getProfile(address: string): Promise<UserProfile | null> {
    try {
      const key = `${STORAGE_PREFIX}${address.toLowerCase()}`
      const data = localStorage.getItem(key)
      
      if (!data) {
        return null
      }

      return JSON.parse(data) as UserProfile
    } catch (error) {
      console.error('ProfileService.getProfile error:', error)
      throw new Error('Failed to fetch profile')
    }
  }

  /**
   * Update an existing user profile.
   * 
   * @param address - User's Stellar wallet address
   * @param updates - Partial profile data to update
   * @returns The updated profile
   * @throws {Error} If profile is not found or update fails
   */
  static async updateProfile(
    address: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const existing = await this.getProfile(address)
      
      if (!existing) {
        throw new Error('Profile not found')
      }

      const updated: UserProfile = {
        ...existing,
        ...updates,
        address: existing.address, // Prevent address modification
      }

      const key = `${STORAGE_PREFIX}${address.toLowerCase()}`
      localStorage.setItem(key, JSON.stringify(updated))

      return updated
    } catch (error) {
      console.error('ProfileService.updateProfile error:', error)
      throw new Error('Failed to update profile')
    }
  }

  /**
   * Initialize a new profile for a wallet address.
   * 
   * @param address - User's Stellar wallet address
   * @returns The newly created or existing profile
   * @throws {Error} If creation fails
   */
  static async createProfile(address: string): Promise<UserProfile> {
    try {
      const existing = await this.getProfile(address)
      
      if (existing) {
        return existing
      }

      const newProfile: UserProfile = {
        address,
        joinedDate: new Date().toISOString(),
        preferences: {
          notifications: true,
          emailUpdates: false,
          theme: 'auto',
          language: 'en',
          currency: 'USD',
          emailNotifications: {
            enabled: false,
            frequency: 'instant',
            events: {
              contributionDue24h: true,
              contributionDue1h: false,
              contributionOverdue: true,
              payoutReceived: true,
              memberJoined: false,
              cycleCompleted: true,
              announcements: false,
              groupInvitation: true,
              securityAlerts: true,
            },
          },
        },
        stats: {
          totalGroups: 0,
          activeGroups: 0,
          completedGroups: 0,
          totalContributions: 0,
          totalReceived: 0,
        },
      }

      const key = `${STORAGE_PREFIX}${address.toLowerCase()}`
      localStorage.setItem(key, JSON.stringify(newProfile))

      return newProfile
    } catch (error) {
      console.error('ProfileService.createProfile error:', error)
      throw new Error('Failed to create profile')
    }
  }

  /**
   * Get user activities
   * Equivalent to: GET /api/profile/:address/activities
   */
  static async getActivities(
    address: string,
    limit: number = 50
  ): Promise<Activity[]> {
    try {
      const key = `${ACTIVITIES_PREFIX}${address.toLowerCase()}`
      const data = localStorage.getItem(key)
      
      if (!data) {
        return []
      }

      const activities = JSON.parse(data) as Activity[]
      return activities.slice(0, limit)
    } catch (error) {
      console.error('ProfileService.getActivities error:', error)
      throw new Error('Failed to fetch activities')
    }
  }

  /**
   * Log a new activity for the user.
   * 
   * @param address - User's Stellar wallet address
   * @param activity - Activity details (excluding ID and timestamp)
   * @returns The recorded activity
   */
  static async addActivity(
    address: string,
    activity: Omit<Activity, 'id' | 'timestamp'>
  ): Promise<Activity> {
    try {
      const newActivity: Activity = {
        ...activity,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      }

      const key = `${ACTIVITIES_PREFIX}${address.toLowerCase()}`
      const existing = await this.getActivities(address, 1000)
      
      const updated = [newActivity, ...existing].slice(0, 100) // Keep last 100
      localStorage.setItem(key, JSON.stringify(updated))

      return newActivity
    } catch (error) {
      console.error('ProfileService.addActivity error:', error)
      throw new Error('Failed to add activity')
    }
  }

  /**
   * Update preferences
   * Equivalent to: PATCH /api/profile/:address/preferences
   */
  static async updatePreferences(
    address: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    try {
      const profile = await this.getProfile(address)
      
      if (!profile) {
        throw new Error('Profile not found')
      }

      const updated: UserPreferences = {
        ...profile.preferences,
        ...preferences,
      }

      await this.updateProfile(address, { preferences: updated })

      return updated
    } catch (error) {
      console.error('ProfileService.updatePreferences error:', error)
      throw new Error('Failed to update preferences')
    }
  }

  /**
   * Upload and process a profile image.
   * Currently simulates an upload and returns a data URL.
   * 
   * @param file - Image file to upload
   * @returns Data URL or CID of the uploaded image
   * @throws {Error} If validation fails
   */
  static async uploadProfileImage(file: File): Promise<string> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('Image must be less than 5MB')
      }

      // Simulate IPFS upload
      // In production: upload to IPFS and return CID
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onloadend = () => {
          const base64 = reader.result as string
          // In production, this would be an IPFS CID like:
          // 'ipfs://QmXxxx...'
          resolve(base64)
        }
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'))
        }
        
        reader.readAsDataURL(file)
      })
    } catch (error) {
      console.error('ProfileService.uploadProfileImage error:', error)
      throw new Error('Failed to upload image')
    }
  }

  /**
   * Delete profile (for testing/cleanup)
   */
  static async deleteProfile(address: string): Promise<void> {
    try {
      const profileKey = `${STORAGE_PREFIX}${address.toLowerCase()}`
      const activitiesKey = `${ACTIVITIES_PREFIX}${address.toLowerCase()}`
      const preferencesKey = `${PREFERENCES_PREFIX}${address.toLowerCase()}`
      
      localStorage.removeItem(profileKey)
      localStorage.removeItem(activitiesKey)
      localStorage.removeItem(preferencesKey)
    } catch (error) {
      console.error('ProfileService.deleteProfile error:', error)
      throw new Error('Failed to delete profile')
    }
  }

  /**
   * Check if profile exists
   */
  static async profileExists(address: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(address)
      return profile !== null
    } catch (error) {
      return false
    }
  }

  /**
   * Get or create profile
   * Ensures a profile always exists for the given address
   */
  static async getOrCreateProfile(address: string): Promise<UserProfile> {
    try {
      const existing = await this.getProfile(address)
      
      if (existing) {
        return existing
      }

      return await this.createProfile(address)
    } catch (error) {
      console.error('ProfileService.getOrCreateProfile error:', error)
      throw new Error('Failed to get or create profile')
    }
  }
}

export default ProfileService
