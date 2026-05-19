'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  name: string
  image?: string | null
  productCount: number
  active?: boolean
  onClick?: () => void
  className?: string
}

export const CategoryCard: React.FC<Props> = ({
  name,
  image,
  productCount,
  active,
  onClick,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group min-w-0 overflow-hidden rounded-lg border bg-white text-left shadow-sm transition duration-300',
        'hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary/50 hover:shadow-md',
        active && 'border-primary shadow-md shadow-primary/10',
        className,
      )}
    >
      <div className="flex aspect-16/10 items-center justify-center overflow-hidden bg-secondary transition duration-300 group-hover:bg-secondary/80">
        <img
          src={image || '/window.svg'}
          alt={name}
          className="h-auto w-full object-contain"
        />
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-bold">{name}</p>
          <p className="text-sm text-gray-400">{productCount} товаров</p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-gray-400 transition group-hover:text-primary" />
      </div>
    </button>
  )
}
