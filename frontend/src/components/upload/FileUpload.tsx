import React, { useRef, useCallback, useEffect, useState, DragEvent, ChangeEvent } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { ImagePreview } from './ImagePreview'
import { useFileUpload, FileUploadOptions } from '../../hooks/useFileUpload'

export interface FileUploadProps extends FileUploadOptions {
  variant?: 'avatar' | 'group'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  disabled?: boolean
  className?: string
  onSuccess?: (url: string) => void
}

export const FileUpload: React.FC<FileUploadProps> = ({
  variant = 'avatar',
  size = 'md',
  label,
  disabled = false,
  className,
  onSuccess,
  onUpload,
  maxSizeBytes,
  acceptedTypes,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const { file, previewUrl, isUploading, error, handleFile, upload, reset } = useFileUpload({
    maxSizeBytes,
    acceptedTypes,
    onUpload,
  })

  // Auto-upload when a file is selected and onUpload handler is provided
  useEffect(() => {
    if (!file || !onUpload) return
    upload().then((url) => {
      if (url && onSuccess) onSuccess(url)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected) handleFile(selected)
      e.target.value = ''
    },
    [handleFile],
  )

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) handleFile(dropped)
  }

  const openFilePicker = () => {
    if (!disabled && !isUploading) inputRef.current?.click()
  }

  const isAvatar = variant === 'avatar'
  const accept = (acceptedTypes ?? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']).join(',')

  return (
    <div className={clsx('flex flex-col items-center gap-3', className)}>
      {label && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Upload ${isAvatar ? 'profile picture' : 'group image'}`}
        aria-disabled={disabled || isUploading}
        onClick={openFilePicker}
        onKeyDown={(e: React.KeyboardEvent) =>
          (e.key === 'Enter' || e.key === ' ') && openFilePicker()
        }
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={clsx(
          'relative cursor-pointer select-none',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          isAvatar ? 'rounded-full' : 'rounded-xl',
          isDragging && 'ring-2 ring-primary-500 ring-offset-2',
          (disabled || isUploading) && 'cursor-not-allowed opacity-60',
        )}
      >
        <ImagePreview
          src={previewUrl}
          onRemove={
            previewUrl
              ? () => {
                  reset()
                }
              : undefined
          }
          variant={variant}
          size={size}
        />

        {/* Hover overlay — no image */}
        {!previewUrl && (
          <div
            className={clsx(
              'absolute inset-0 flex items-center justify-center',
              'opacity-0 hover:opacity-100 transition-opacity',
              isAvatar ? 'rounded-full' : 'rounded-xl',
              'bg-black/30',
            )}
            aria-hidden="true"
          >
            <Upload size={16} className="text-white" />
          </div>
        )}

        {/* Hover overlay — has image */}
        {previewUrl && !isUploading && (
          <div
            className={clsx(
              'absolute inset-0 flex flex-col items-center justify-center gap-1',
              'opacity-0 hover:opacity-100 transition-opacity',
              isAvatar ? 'rounded-full' : 'rounded-xl',
              'bg-black/40',
            )}
            aria-hidden="true"
          >
            <Upload size={16} className="text-white" />
            <span className="text-white text-xs font-medium">Change</span>
          </div>
        )}

        {/* Upload spinner */}
        {isUploading && (
          <div
            className={clsx(
              'absolute inset-0 flex items-center justify-center',
              isAvatar ? 'rounded-full' : 'rounded-xl',
              'bg-black/50',
            )}
            aria-label="Uploading"
          >
            <Loader2 size={20} className="text-white animate-spin" aria-hidden="true" />
          </div>
        )}
      </div>

      {!previewUrl && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Click or drag &amp; drop to upload
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-500 dark:text-red-400 text-center max-w-[200px]">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled || isUploading}
      />
    </div>
  )
}
