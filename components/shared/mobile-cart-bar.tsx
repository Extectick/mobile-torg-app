'use client'

import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCartTotals, useCart } from '@/store/cart'
import { formatMoney, formatQuantity, getMinimumOrderProgressColor, MINIMUM_ORDER_AMOUNT } from './cart-format'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '../ui/drawer'
import { CartItemRow } from './desktop-cart-panel'
import { useCartProductMeta } from './use-cart-product-meta'

export const MobileCartBar: React.FC = () => {
  const cartItems = useCart((state) => state.items)
  const cartHydrated = useCart((state) => state.hydrated)
  const [cartOpen, setCartOpen] = React.useState(false)
  const [searchFocused, setSearchFocused] = React.useState(false)
  const { totalAmount, totalCount } = React.useMemo(() => getCartTotals(cartItems), [cartItems])
  const remainingAmount = Math.max(MINIMUM_ORDER_AMOUNT - totalAmount, 0)
  const progress = Math.min((totalAmount / MINIMUM_ORDER_AMOUNT) * 100, 100)
  const progressColor = getMinimumOrderProgressColor(progress)
  const showCartBar = cartHydrated && totalAmount > 0 && !searchFocused
  useCartProductMeta()

  React.useEffect(() => {
    const handleSearchFocusChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ focused?: boolean }>
      setSearchFocused(Boolean(customEvent.detail?.focused))
    }

    window.addEventListener('mobile-search-focus-change', handleSearchFocusChange)

    return () => window.removeEventListener('mobile-search-focus-change', handleSearchFocusChange)
  }, [])

  React.useEffect(() => {
    if (showCartBar) {
      document.documentElement.style.setProperty(
        '--mobile-floating-search-bottom',
        'calc(env(safe-area-inset-bottom) + 6.7rem)',
      )
      return
    }

    document.documentElement.style.removeProperty('--mobile-floating-search-bottom')

    return () => {
      document.documentElement.style.removeProperty('--mobile-floating-search-bottom')
    }
  }, [showCartBar])

  if (!showCartBar) {
    return null
  }

  const summary = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-extrabold text-black">
          {cartItems.length} поз. / {formatQuantity(totalCount)} шт.
        </p>
        <p className="shrink-0 text-base font-black text-black">
          {formatMoney(totalAmount)}
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: progressColor,
          }}
        />
      </div>

      <p className={cn(
        'mt-1 text-xs font-bold',
        remainingAmount > 0 ? 'text-gray-500' : 'text-primary',
      )}>
        {remainingAmount > 0
          ? `До минимального заказа осталось ${formatMoney(remainingAmount)}`
          : 'Минимальная сумма набрана'}
      </p>
    </>
  )

  return (
    <>
      <Drawer open={cartOpen} onOpenChange={setCartOpen}>
        <DrawerContent className="max-h-[88dvh] overflow-hidden rounded-t-xl bg-white p-0 lg:hidden">
          <DrawerHeader className="border-b border-black/5 px-4 pb-3 pt-4 text-left">
            <DrawerTitle className="flex items-center gap-3 text-[22px] font-extrabold">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <ShoppingCart className="size-5" />
              </span>
              <span>
                Корзина
                <span className="mt-1 block text-xs font-bold text-gray-400">
                  {cartItems.length} позиций
                </span>
              </span>
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Список товаров в корзине
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 scrollbar">
            <ul>
              {cartItems.map((item) => (
                <CartItemRow key={`${item.productId}:${item.packageId}`} item={item} />
              ))}
            </ul>
          </div>

          <div className="shrink-0 border-t border-black/5 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-[0_-18px_40px_rgba(0,0,0,0.08)]">
            {summary}
          </div>
        </DrawerContent>
      </Drawer>

      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="mx-auto block w-full max-w-lg rounded-2xl border border-primary/20 bg-white/95 p-3 text-left shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur transition active:scale-[0.99]"
          aria-label="Открыть корзину"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <ShoppingCart className="size-5" />
            </span>

            <div className="min-w-0 flex-1">
              {summary}
            </div>
          </div>
        </button>
      </div>
    </>
  )
}
