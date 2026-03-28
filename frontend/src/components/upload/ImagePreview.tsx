import React from 'react'
import { X, User, Users } from 'lucide-react'
import clsx from 'clsx'

export interface ImagePreviewProps {
  src: string | null
  onRemove?: () => void
  variant?: 'avatar' | 'group'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles: Record<string, string> = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}

const iconSizes: Record<string, number> = {
  sm: 24,
  md: 32,
  lg: 40,
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  onRemove,
  variant = 'avatar',
  size = 'md',
  className,
}) => {
  const isAvatar = variant === 'avatar'
  const PlaceholderIcon = isAvatar ? User : Users

  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center flex-shrink-0',
        sizeStyles[size],
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt="Preview"
          className={clsx(
            'w-full h-full object-cover',
            isAvatar ? 'rounded-full' : 'rounded-xl',
            'border-2 border-gray-200 dark:border-gray-700',
          )}
        />
      ) : (
        <div
          className={clsx(
            'w-full h-full flex items-center justify-center',
            'bg-gray-100 dark:bg-gray-800',
            'border-2 border-dashed border-gray-300 dark:border-gray-600',
            isAvatar ? 'rounded-full' : 'rounded',
          )}
          aria-label={isAvatar ? 'No profile picture' : 'No group image'}
        >
          <PlaceholderIcon
            size={iconSizes[size]}
            className="text-gray-400 dark:text-gray-500"
            aria-hidden="true"
          />
        </div>
      )}

      {src && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove image"
          className={clsx(
            'absolute -top-1 -right-1',
            'w-5 h-5 rounded-full',
            'bg-red-500 hover:bg-red-600',
            'text-white flex items-center justify-center',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1',
          )}
        >
          <X size={12} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
