import { ApiError, nextApiClient } from '@/lib/apiClient'
import { apiPaths } from '@/lib/apiEndpoints'

type KycStatusResponse = {
  status: {
    level: number
    status: string
    requestedAt?: string
    verifiedAt?: string
    rejectedAt?: string
    documents?: unknown[]
  }
}

function errorMessageFromApi(e: unknown, fallback: string): string {
  if (e instanceof ApiError && e.body && typeof e.body === 'object' && 'error' in e.body) {
    const msg = (e.body as { error?: unknown }).error
    if (typeof msg === 'string') return msg
  }
  return fallback
}

/**
 * KYC Service - Handles interaction with backend KYC verification endpoints.
 */
export class KycService {
  /**
   * Get the current KYC status for the logged-in user.
   * 
   * @returns The user's KYC status details
   */
  static async getStatus(): Promise<KycStatusResponse['status']> {
    const data = await nextApiClient.request<KycStatusResponse>({
      path: apiPaths.kyc.status,
      method: 'GET',
    })
    return data.status
  }

  /**
   * Submit a request for KYC verification.
   * 
   * @throws {Error} If the request fails
   */
  static async requestVerification(): Promise<void> {
    try {
      await nextApiClient.request({
        path: apiPaths.kyc.request,
        method: 'POST',
      })
    } catch (e) {
      throw new Error(errorMessageFromApi(e, 'Failed to request verification'))
    }
  }

  /**
   * Upload a KYC document for verification.
   * 
   * @param docType - Type of document (e.g., 'ID', 'ADDRESS')
   * @param data - Base64 encoded document data
   * @throws {Error} If the upload fails
   */
  static async uploadDocument(docType: string, data: string): Promise<void> {
    try {
      await nextApiClient.request({
        path: apiPaths.kyc.upload,
        method: 'POST',
        body: { docType, data },
      })
    } catch (e) {
      throw new Error(errorMessageFromApi(e, 'Failed to upload document'))
    }
  }
}
