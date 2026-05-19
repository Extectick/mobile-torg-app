'use client'

import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCartTotals, useCart } from '@/store/cart'

const MINIMUM_ORDER_AMOUNT = 7000

const formatMoney = (value: number) => `${Math.ceil(value).toLocaleString('ru-RU')} ₽`
const formatQuantity = (value: number) => Number.isInteger(value) ? String(value) : value.toLocaleString('ru-RU')

export const MobileCartBar: React.FC = () => {
  const cartItems = useCart((state) => state.items)
  const cartHydrated = useCart((state) => state.hydrated)
  const [searchFocused, setSearchFocused] = React.useState(false)
  const { totalAmount, totalCount } = React.useMemo(() => getCartTotals(cartItems), [cartItems])
  const remainingAmount = Math.max(MINIMUM_ORDER_AMOUNT - totalAmount, 0)
  const progress = Math.min((totalAmount / MINIMUM_ORDER_AMOUNT) * 100, 100)
  const showCartBar = cartHydrated && totalAmount > 0 && !searchFocused

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

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
      <div className="mx-auto max-w-lg rounded-2xl border border-primary/20 bg-white/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <ShoppingCart className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
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
                className={cn(
                  'h-full rounded-full transition-[width,background-color] duration-300',
                  remainingAmount > 0 ? 'bg-primary' : 'bg-[#7da324]',
                )}
                style={{ width: `${progress}%` }}
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
          </div>
        </div>
      </div>
    </div>
  )
}
