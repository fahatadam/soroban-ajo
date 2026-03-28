import { useState, useCallback } from 'react'

export interface FileUploadOptions {
  maxSizeBytes?: number
  acceptedTypes?: string[]
  onUpload?: (file: File) => Promise<string>
}

export interface FileUploadState {
  file: File | null
  previewUrl: string | null
  isUploading: boolean
  error: string | null
  uploadedUrl: string | null
}

export interface UseFileUploadReturn extends FileUploadState {
  handleFile: (file: File) => void
  upload: () => Promise<string | null>
  reset: () => void
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function useFileUpload(options: FileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxSizeBytes = DEFAULT_MAX_SIZE,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    onUpload,
  } = options

  const [state, setState] = useState<FileUploadState>({
    file: null,
    previewUrl: null,
    isUploading: false,
    error: null,
    uploadedUrl: null,
  })

  const handleFile = useCallback(
    (file: File) => {
      if (!acceptedTypes.includes(file.type)) {
        setState((prev: FileUploadState) => ({
          ...prev,
          error: `File type not supported. Accepted: ${acceptedTypes.map((t) => t.split('/')[1]).join(', ')}`,
        }))
        return
      }

      if (file.size > maxSizeBytes) {
        const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(0)
        setState((prev: FileUploadState) => ({
          ...prev,
          error: `File too large. Maximum size is ${maxMB}MB`,
        }))
        return
      }

      const previewUrl = URL.createObjectURL(file)
      setState({ file, previewUrl, isUploading: false, error: null, uploadedUrl: null })
    },
    [acceptedTypes, maxSizeBytes],
  )

  const upload = useCallback(async (): Promise<string | null> => {
    if (!state.file || !onUpload) return null

    setState((prev: FileUploadState) => ({ ...prev, isUploading: true, error: null }))

    try {
      const url = await onUpload(state.file)
      setState((prev: FileUploadState) => ({ ...prev, isUploading: false, uploadedUrl: url }))
      return url
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setState((prev: FileUploadState) => ({ ...prev, isUploading: false, error: message }))
      return null
    }
  }, [state.file, onUpload])

  const reset = useCallback(() => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl)
    setState({ file: null, previewUrl: null, isUploading: false, error: null, uploadedUrl: null })
  }, [state.previewUrl])

  return { ...state, handleFile, upload, reset }
}
