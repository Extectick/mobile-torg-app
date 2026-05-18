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
  unit: string
  categoryId: number
  packages?: {
    id: number
    name: string
    unit: string
    quantity: number
    minSaleQuantity: number
    quantityStep: number
    quantityPrecision: number
    price: number | null
    isDefault: boolean
  }[]
}

interface Props {
  items: CatalogProduct[]
  onOpenProduct?: (id: number) => void
  className?: string
}

export const ProductsGrid: React.FC<Props> = ({ items, onOpenProduct, className }) => {
  return (
    <div className={cn('grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-4 sm:gap-5 xl:gap-6', className)}>
      {items.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          description={product.description}
          imageUrl={product.imagesJson}
          price={product.price}
          unit={product.unit}
          packages={product.packages}
          onOpenProduct={onOpenProduct}
        />
      ))}
    </div>
  )
}
