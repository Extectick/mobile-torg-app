'use client'

import React from 'react'
import { useCart } from '@/store/cart'

interface ProductMetaResponse {
  name?: string
  imagesJson?: string
}

export const useCartProductMeta = () => {
  const cartItems = useCart((state) => state.items)
  const cartHydrated = useCart((state) => state.hydrated)
  const updateItemMeta = useCart((state) => state.updateItemMeta)
  const missingMetaProductIds = React.useMemo(() => (
    Array.from(new Set(
      cartItems
        .filter((item) => !item.name || !item.imageUrl)
        .map((item) => item.productId),
    ))
  ), [cartItems])

  React.useEffect(() => {
    if (!cartHydrated || missingMetaProductIds.length === 0) {
      return
    }

    const controller = new AbortController()

    const loadMissingMeta = async () => {
      await Promise.all(missingMetaProductIds.map(async (productId) => {
        try {
          const response = await fetch(`/api/products/${productId}`, {
            signal: controller.signal,
          })

          if (!response.ok) {
            return
          }

          const product = await response.json() as ProductMetaResponse

          if (product.name || product.imagesJson) {
            updateItemMeta(productId, {
              name: product.name,
              imageUrl: product.imagesJson,
            })
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            console.error('Failed to load cart product metadata:', error)
          }
        }
      }))
    }

    loadMissingMeta()

    return () => controller.abort()
  }, [cartHydrated, missingMetaProductIds, updateItemMeta])
}
