'use client'

import React from 'react'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CartItem, getCartTotals, useCart } from '@/store/cart'
import { formatNumber } from './use-product-purchase'
import { formatMoney, formatQuantity, getMinimumOrderProgressColor, MINIMUM_ORDER_AMOUNT } from './cart-format'
import { useCartProductMeta } from './use-cart-product-meta'

const normalizeQuantity = (item: CartItem, value: number, { allowZero = true } = {}) => {
  if (!Number.isFinite(value)) {
    return 0
  }

  if (value <= 0 && allowZero) {
    return 0
  }

  const step = item.quantityStep || 1
  const precision = item.quantityPrecision ?? 0
  const minQuantity = item.minSaleQuantity || step
  const clampedValue = Math.max(value, minQuantity)
  const stepsFromMin = Math.round((clampedValue - minQuantity) / step)

  return Number((minQuantity + stepsFromMin * step).toFixed(precision))
}

export const CartItemRow: React.FC<{ item: CartItem }> = ({ item }) => {
  const updateQuantity = useCart((state) => state.updateQuantity)
  const removeItem = useCart((state) => state.removeItem)
  const [draftQuantity, setDraftQuantity] = React.useState(() => formatNumber(item.quantity, item.quantityPrecision))
  const [isEditing, setIsEditing] = React.useState(false)
  const itemName = item.name || `Товар #${item.productId}`
  const itemTotal = item.price * item.quantity

  React.useEffect(() => {
    if (!isEditing) {
      setDraftQuantity(formatNumber(item.quantity, item.quantityPrecision))
    }
  }, [isEditing, item.quantity, item.quantityPrecision])

  const handleIncrement = () => {
    const step = item.quantityStep || 1
    const minQuantity = item.minSaleQuantity || step
    const nextQuantity = normalizeQuantity(item, item.quantity > 0 ? item.quantity + step : minQuantity, { allowZero: false })

    updateQuantity(item.productId, item.packageId, nextQuantity)
  }

  const handleDecrement = () => {
    const minQuantity = item.minSaleQuantity || item.quantityStep || 1

    if (item.quantity <= minQuantity) {
      removeItem(item.productId, item.packageId)
      return
    }

    updateQuantity(
      item.productId,
      item.packageId,
      normalizeQuantity(item, item.quantity - (item.quantityStep || 1), { allowZero: false }),
    )
  }

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(',', '.')
    const precision = item.quantityPrecision ?? 0
    const quantityPattern = precision > 0
      ? new RegExp(`^\\d*\\.?\\d{0,${precision}}$`)
      : /^\d*$/

    if (!quantityPattern.test(value)) {
      return
    }

    setDraftQuantity(value)

    if (value === '') {
      return
    }

    const nextQuantity = Number(value)

    if (Number.isFinite(nextQuantity)) {
      updateQuantity(item.productId, item.packageId, Math.max(0, nextQuantity))
    }
  }

  const handleQuantityBlur = () => {
    setIsEditing(false)

    if (draftQuantity === '') {
      removeItem(item.productId, item.packageId)
      return
    }

    const nextQuantity = normalizeQuantity(item, Number(draftQuantity), { allowZero: true })

    if (nextQuantity <= 0) {
      removeItem(item.productId, item.packageId)
      return
    }

    updateQuantity(item.productId, item.packageId, nextQuantity)
    setDraftQuantity(formatNumber(nextQuantity, item.quantityPrecision))
  }

  return (
    <li className="group animate-in fade-in slide-in-from-right-1 duration-200">
      <div className="flex gap-2.5 px-3 py-2.5 transition duration-200 hover:bg-primary/4">
        <div className="flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 ring-1 ring-black/5">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full object-contain"
              loading="lazy"
            />
          ) : (
            <ShoppingCart className="size-7 text-primary/45" />
          )}
        </div>

        <div className="min-w-0 flex-1 border-b border-black/8 pb-2.5 group-last:border-b-0 group-last:pb-0">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-2">
            <div className="min-w-0">
              <p className="line-clamp-2 text-[13px] font-extrabold leading-tight text-black">
                {itemName}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.productId, item.packageId)}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
              aria-label={`Удалить ${itemName}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div className="min-w-0">
              <span className="block truncate text-[10px] font-semibold leading-none text-gray-400">
                за {formatNumber(item.packageQuantity, item.quantityPrecision)} {item.unit} / {item.packageName}
              </span>
              <span className="mt-0.5 block truncate text-base font-black leading-none text-black">
                {formatMoney(item.price)}
              </span>
            </div>

            <div className="grid h-8 w-[6.25rem] shrink-0 grid-cols-[1.65rem_minmax(2.95rem,1fr)_1.65rem] items-center overflow-hidden rounded-lg bg-primary text-white shadow-sm">
              <button
                type="button"
                onClick={handleDecrement}
                className="flex h-full items-center justify-center transition hover:bg-white/10 active:bg-white/15"
                aria-label={`Уменьшить количество ${itemName}`}
              >
                <Minus className="size-4" />
              </button>
              <input
                className="h-full min-w-0 border-0 bg-transparent p-0 text-center text-sm font-extrabold text-white outline-none [appearance:textfield] placeholder:text-white/70 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                type="text"
                inputMode="decimal"
                enterKeyHint="done"
                pattern="[0-9]*[.,]?[0-9]*"
                value={draftQuantity}
                onFocus={(event) => {
                  setIsEditing(true)
                  requestAnimationFrame(() => event.currentTarget.select())
                }}
                onBlur={handleQuantityBlur}
                onChange={handleQuantityChange}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    event.currentTarget.blur()
                  }
                }}
                aria-label={`Количество ${itemName}`}
              />
              <button
                type="button"
                onClick={handleIncrement}
                className="flex h-full items-center justify-center transition hover:bg-white/10 active:bg-white/15"
                aria-label={`Увеличить количество ${itemName}`}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-400">Сумма</span>
            <span className="text-lg font-black leading-none text-primary">
              {formatMoney(itemTotal)}
            </span>
          </div>
        </div>
      </div>
    </li>
  )
}

export const DesktopCartPanel: React.FC = () => {
  const cartItems = useCart((state) => state.items)
  const cartHydrated = useCart((state) => state.hydrated)
  const { totalAmount, totalCount } = React.useMemo(() => getCartTotals(cartItems), [cartItems])
  const remainingAmount = Math.max(MINIMUM_ORDER_AMOUNT - totalAmount, 0)
  const progress = Math.min((totalAmount / MINIMUM_ORDER_AMOUNT) * 100, 100)
  const progressColor = getMinimumOrderProgressColor(progress)
  const hasItems = cartHydrated && cartItems.length > 0
  useCartProductMeta()

  return (
    <aside className="hidden lg:block lg:w-(--desktop-cart-width) lg:shrink-0 lg:self-start lg:pr-1 [@media_(min-width:1024px)_and_(min-height:850px)]:sticky [@media_(min-width:1024px)_and_(min-height:850px)]:top-[calc(var(--app-header-height,80px)+16px)]">
      <div className="flex max-h-[calc(100dvh-var(--app-header-height,80px)-32px)] min-h-[28rem] flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm animate-in fade-in slide-in-from-right-2 duration-200">
        <div className="shrink-0 border-b border-black/5 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <ShoppingCart className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-black leading-none text-black">Корзина</h2>
              <p className="mt-1 text-xs font-bold text-gray-400">
                {hasItems ? `${cartItems.length} позиций` : 'Пока пусто'}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar">
          {hasItems ? (
            <ul>
              {cartItems.map((item) => (
                <CartItemRow key={`${item.productId}:${item.packageId}`} item={item} />
              ))}
            </ul>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 py-10 text-center">
              <span className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <ShoppingCart className="size-10" />
              </span>
              <p className="mt-5 text-lg font-black text-black">В вашей корзине пока пусто</p>
              <p className="mt-2 text-sm font-semibold leading-5 text-gray-400">
                Добавьте товары из каталога, и они появятся здесь построчно.
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-black/5 bg-white p-4 shadow-[0_-18px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-extrabold text-black">
              {cartItems.length} поз. / {formatQuantity(totalCount)} шт.
            </p>
            <p className="shrink-0 text-xl font-black text-black">
              {formatMoney(totalAmount)}
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-[width,background-color] duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>

          <p className={cn(
            'mt-2 text-xs font-bold',
            remainingAmount > 0 ? 'text-gray-500' : 'text-primary',
          )}>
            {remainingAmount > 0
              ? `До минимального заказа осталось ${formatMoney(remainingAmount)}`
              : 'Минимальная сумма набрана'}
          </p>
        </div>
      </div>
    </aside>
  )
}
