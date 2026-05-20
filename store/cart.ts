'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const GUEST_CART_STORAGE_KEY = 'mobile-torg-cart'

export interface CartItem {
  productId: number
  packageId: number
  name?: string
  imageUrl?: string
  quantity: number
  unit: string
  packageName: string
  packageQuantity: number
  price: number
  minSaleQuantity: number
  quantityStep: number
  quantityPrecision: number
}

interface MergePrompt {
  userId: number
  serverItemsCount: number
}

interface CartState {
  items: CartItem[]
  hydrated: boolean
  mergePrompt: MergePrompt | null
  setHydrated: () => void
  addItem: (item: CartItem) => void
  updateItemMeta: (productId: number, meta: Pick<CartItem, 'name' | 'imageUrl'>) => void
  updateQuantity: (productId: number, packageId: number, quantity: number) => void
  setItemQuantity: (item: Omit<CartItem, 'quantity'>, quantity: number) => void
  removeItem: (productId: number, packageId: number) => void
  clearGuestCart: () => void
  mergeGuestCartAfterLogin: (userId: number) => Promise<'empty' | 'merged' | 'prompt'>
  confirmGuestCartMerge: () => Promise<void>
  declineGuestCartMerge: () => void
}

const getCartItemKey = (item: Pick<CartItem, 'productId' | 'packageId'>) => `${item.productId}:${item.packageId}`

const normalizeQuantity = (quantity: number) => (Number.isFinite(quantity) && quantity > 0 ? quantity : 0)

const mergeItems = (items: CartItem[], incomingItem: CartItem) => {
  const incomingKey = getCartItemKey(incomingItem)
  const nextItems = items.filter((item) => getCartItemKey(item) !== incomingKey)
  const quantity = normalizeQuantity(incomingItem.quantity)

  if (quantity <= 0) {
    return nextItems
  }

  return [...nextItems, { ...incomingItem, quantity }]
}

const postGuestCartMerge = async (userId: number, items: CartItem[]) => {
  await fetch('/api/cart/merge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      strategy: 'merge',
      items,
    }),
  })
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      mergePrompt: null,

      setHydrated: () => set({ hydrated: true }),

      addItem: (item) => {
        set((state) => ({
          items: mergeItems(state.items, item),
        }))
      },

      updateItemMeta: (productId, meta) => {
        set((state) => ({
          items: state.items.map((item) => (
            item.productId === productId
              ? {
                  ...item,
                  name: item.name || meta.name,
                  imageUrl: item.imageUrl || meta.imageUrl,
                }
              : item
          )),
        }))
      },

      updateQuantity: (productId, packageId, quantity) => {
        const nextQuantity = normalizeQuantity(quantity)

        set((state) => ({
          items: state.items.flatMap((item) => {
            if (item.productId !== productId || item.packageId !== packageId) {
              return [item]
            }

            return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity }] : []
          }),
        }))
      },

      setItemQuantity: (item, quantity) => {
        const nextQuantity = normalizeQuantity(quantity)

        set((state) => ({
          items: nextQuantity > 0
            ? mergeItems(state.items, { ...item, quantity: nextQuantity })
            : state.items.filter((cartItem) => getCartItemKey(cartItem) !== getCartItemKey(item)),
        }))
      },

      removeItem: (productId, packageId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId || item.packageId !== packageId),
        }))
      },

      clearGuestCart: () => set({ items: [], mergePrompt: null }),

      mergeGuestCartAfterLogin: async (userId) => {
        const guestItems = get().items

        if (guestItems.length === 0) {
          return 'empty'
        }

        const response = await fetch(`/api/cart?userId=${userId}`)
        const serverCart = await response.json()
        const serverItemsCount = Array.isArray(serverCart.items) ? serverCart.items.length : 0

        if (serverItemsCount > 0) {
          set({ mergePrompt: { userId, serverItemsCount } })
          return 'prompt'
        }

        await postGuestCartMerge(userId, guestItems)
        set({ items: [], mergePrompt: null })

        return 'merged'
      },

      confirmGuestCartMerge: async () => {
        const { mergePrompt, items } = get()

        if (!mergePrompt) {
          return
        }

        await postGuestCartMerge(mergePrompt.userId, items)
        set({ items: [], mergePrompt: null })
      },

      declineGuestCartMerge: () => {
        set({ items: [], mergePrompt: null })
      },
    }),
    {
      name: GUEST_CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    },
  ),
)

export const getCartTotals = (items: CartItem[]) => ({
  totalAmount: Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)),
  totalCount: Number(items.reduce((sum, item) => sum + item.quantity, 0).toFixed(3)),
})
