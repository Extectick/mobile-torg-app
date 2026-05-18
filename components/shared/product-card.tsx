'use client'

import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatNumber,
  getPackagePriceLabel,
  ProductPackage,
  useProductPurchase,
} from './use-product-purchase'
import { useCart } from '@/store/cart'

interface Props {
  id: number
  name: string
  price: number
  unit: string
  imageUrl: string
  description?: string | null
  packages?: ProductPackage[]
  onOpenProduct?: (id: number) => void
  className?: string
}

export const ProductCard: React.FC<React.PropsWithChildren<Props>> = ({
  id,
  name,
  price,
  unit,
  imageUrl,
  description,
  packages = [],
  onOpenProduct,
  className,
}) => {
  const cartItems = useCart((state) => state.items)
  const setItemQuantity = useCart((state) => state.setItemQuantity)
  const getQuantityForPackage = React.useCallback((packageId: number) => (
    cartItems.find((item) => item.productId === id && item.packageId === packageId)?.quantity ?? 0
  ), [cartItems, id])
  const handleCartQuantityChange = React.useCallback((nextQuantity: number, itemPackage: ProductPackage) => {
    const nextPrice = itemPackage.price ?? price * itemPackage.quantity

    setItemQuantity({
      productId: id,
      packageId: itemPackage.id,
      unit: itemPackage.unit,
      packageName: itemPackage.name,
      packageQuantity: itemPackage.quantity,
      price: nextPrice,
      minSaleQuantity: itemPackage.minSaleQuantity,
      quantityStep: itemPackage.quantityStep,
      quantityPrecision: itemPackage.quantityPrecision,
    }, nextQuantity)
  }, [id, price, setItemQuantity])
  const {
    availablePackages,
    selectedPackage,
    selectedPackageId,
    packagePrice,
    quantityInput,
    quantityPrecision,
    showPackageMeta,
    showQuantityControls,
    increment,
    decrement,
    handlePackageSelect,
    handleQuantityInputChange,
    handleQuantityBlur,
    handleQuantityFocus,
  } = useProductPurchase({
    price,
    unit,
    packages,
    getQuantityForPackage,
    onQuantityChange: handleCartQuantityChange,
  })

  const handleOpenProduct = () => onOpenProduct?.(id)

  return (
    <article
      className={cn(
        'group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition duration-300',
        'hover:border-primary/25 hover:shadow-lg',
        className,
      )}
    >
      <button
        type="button"
        onClick={handleOpenProduct}
        className="flex min-w-0 flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
      >
        <div className="relative z-10 flex aspect-[4/3] items-center justify-center overflow-hidden bg-gray-50 ring-1 ring-black/[0.03] transition duration-300 group-hover:shadow-md group-hover:ring-primary/20">
          <img
            className="h-full w-full object-contain"
            src={imageUrl}
            alt={name}
            loading="lazy"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col px-4 pb-2 pt-4">
          <h3 className="line-clamp-2 min-h-[3.25rem] text-lg font-extrabold leading-snug text-black">
            {name}
          </h3>

          <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
            {description || 'Описание продукции скоро появится'}
          </p>
        </div>
      </button>

      <div className="px-4 pt-1">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {availablePackages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePackageSelect(item.id)}
              className={cn(
                'shrink-0 rounded-md px-2.5 py-1 text-xs font-extrabold transition',
                selectedPackageId === item.id
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100',
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
        {showPackageMeta && (
          <p className="mt-1 truncate text-xs font-semibold text-gray-400">
            {formatNumber(selectedPackage.quantity, quantityPrecision)} {selectedPackage.unit} / {selectedPackage.name}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 px-4 pb-4 pt-2">
        <div className="min-w-0 pr-1">
          <span className="block text-xs font-semibold uppercase leading-none text-gray-400">
            {getPackagePriceLabel(selectedPackage.name)}
          </span>
          <span className="block whitespace-nowrap text-[clamp(1.2rem,2.7vw,1.45rem)] font-extrabold leading-none text-black">
            {packagePrice} ₽
          </span>
        </div>

        {!showQuantityControls ? (
          <button
            type="button"
            onClick={increment}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition hover:bg-primary/90 active:scale-95"
            aria-label={`Добавить ${name}`}
          >
            <Plus className="size-5" />
          </button>
        ) : (
          <div className="flex h-10 shrink-0 items-center overflow-hidden rounded-lg bg-primary text-white shadow-sm">
            <button
              type="button"
              onClick={decrement}
              className="flex size-9 items-center justify-center transition hover:bg-white/10 active:bg-white/15"
              aria-label={`Уменьшить количество ${name}`}
            >
              <Minus className="size-4" />
            </button>
            <input
              className="h-full w-14 border-0 bg-transparent p-0 text-center text-sm font-extrabold text-white outline-none [appearance:textfield] placeholder:text-white/70 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={quantityInput}
              onFocus={handleQuantityFocus}
              onBlur={handleQuantityBlur}
              onChange={handleQuantityInputChange}
              aria-label={`Количество ${name}`}
            />
            <button
              type="button"
              onClick={increment}
              className="flex size-9 items-center justify-center transition hover:bg-white/10 active:bg-white/15"
              aria-label={`Увеличить количество ${name}`}
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
