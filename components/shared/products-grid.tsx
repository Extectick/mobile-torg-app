'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ProductCard } from './product-card'

export interface CatalogProduct {
  id: number
  name: string
  description?: string | null
  imagesJson: string
  price: number
  categoryId: number
}

interface Props {
  items: CatalogProduct[]
  className?: string
}

export const ProductsGrid: React.FC<Props> = ({ items, className }) => {
  return (
    <div className={cn('grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 xl:gap-8', className)}>
      {items.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          description={product.description}
          imageUrl={product.imagesJson}
          price={product.price}
        />
      ))}
    </div>
  )
}
