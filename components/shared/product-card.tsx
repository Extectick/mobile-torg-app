'use client'

import React from 'react'
import { Loader2, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatNumber,
  getPackagePriceLabel,
  ProductPackage,
  useProductPurchase,
} from './use-product-purchase'
import { useCart } from '@/store/cart'
import { Skeleton } from '../ui/skeleton'

interface Props {
  id: number
  name: string
  price: number
  unit: string
  imageUrl: string
  description?: string | null
  packages?: ProductPackage[]
  onOpenProduct?: (id: number) => void
  isOpening?: boolean
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
  isOpening = false,
  className,
}) => {
  const [imageLoaded, setImageLoaded] = React.useState(false)
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
    showQuantityControls,
    increment,
    decrement,
    handlePackageSelect,
    handleQuantityInputChange,
    handleQuantityBlur,
    handleQuantityFocus,
    handleQuantityKeyDown,
  } = useProductPurchase({
    price,
    unit,
    packages,
    getQuantityForPackage,
    onQuantityChange: handleCartQuantityChange,
  })

  React.useEffect(() => {
    setImageLoaded(false)
  }, [imageUrl])

  const handleOpenProduct = () => {
    if (isOpening) {
      return
    }

    onOpenProduct?.(id)
  }

  return (
    <article
      className={cn(
        'group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition duration-300',
        'hover:border-primary/25 hover:shadow-lg',
        !imageLoaded && 'pointer-events-none',
        className,
      )}
    >
      {!imageLoaded && (
        <div className="absolute inset-0 z-20 bg-white">
          <Skeleton className="aspect-(--product-card-image-ratio) rounded-none" />
          <div className="space-y-3 px-3 pb-4 pt-3 sm:px-4">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex items-end justify-between gap-3 pt-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        </div>
      )}
      {isOpening && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}
      <button
        type="button"
        onClick={handleOpenProduct}
        disabled={isOpening || !imageLoaded}
        className="flex min-w-0 flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-wait"
      >
        <div className="relative z-10 flex aspect-(--product-card-image-ratio) items-center justify-center overflow-hidden bg-gray-50 ring-1 ring-black/3 transition duration-300 group-hover:shadow-md group-hover:ring-primary/20">
          <img
            className="h-full w-full object-contain"
            src={imageUrl}
            alt={name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col px-2.5 pb-1.5 pt-3 min-[430px]:px-3 sm:px-4 lg:pt-3">
          <h3 className="line-clamp-2 min-h-10 text-sm font-extrabold leading-tight text-black min-[430px]:text-[15px] sm:min-h-13 sm:text-lg lg:min-lg:min-h-12t-[17px]">
            {name}
          </h3>

          <p className="mt-1 hidden text-sm leading-5 text-gray-500 sm:line-clamp-2 sm:block sm:min-h-10 lg:min-h-9 lg:leading-[1.15rem]">
            {description || 'Описание продукции скоро появится'}
          </p>
        </div>
      </button>

      <div className="px-2.5 pt-1 min-[430px]:px-3 sm:px-4">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {availablePackages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePackageSelect(item.id)}
              className={cn(
                'shrink-0 rounded-md px-2 py-1 text-[11px] font-extrabold transition sm:px-2.5 sm:text-xs',
                selectedPackageId === item.id
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100',
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-end gap-1.5 px-2.5 pb-3 pt-2 min-[430px]:gap-2 min-[430px]:px-3 sm:px-4 sm:pb-4 lg:pb-3">
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-semibold uppercase leading-none text-gray-400 sm:text-xs">
            {selectedPackage.quantity !== 1 || selectedPackage.name !== selectedPackage.unit
              ? `за ${formatNumber(selectedPackage.quantity, quantityPrecision)} ${selectedPackage.unit} / ${selectedPackage.name}`
              : getPackagePriceLabel(selectedPackage.name)}
          </span>
          <span className="block whitespace-nowrap text-[clamp(1.12rem,5.4vw,1.38rem)] font-extrabold leading-none text-black min-[430px]:text-[clamp(1.2rem,5.6vw,1.5rem)] sm:text-[clamp(1.2rem,2.7vw,1.45rem)]">
            {formatNumber(packagePrice, 2)} ₽
          </span>
        </div>

        {!showQuantityControls ? (
          <button
            type="button"
            onClick={increment}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition hover:bg-primary/90 active:scale-95 min-[430px]:size-9 sm:size-10"
            aria-label={`Добавить ${name}`}
          >
            <Plus className="size-4 min-[430px]:size-5" />
          </button>
        ) : (
          <div className="grid h-8 w-[5.5rem] shrink-0 grid-cols-[1.5rem_minmax(2rem,1fr)_1.5rem] items-center overflow-hidden rounded-lg bg-primary text-white shadow-sm min-[430px]:h-9 min-[430px]:w-[6.25rem] min-[430px]:grid-cols-[1.75rem_minmax(2.25rem,1fr)_1.75rem] sm:h-10 sm:w-28 sm:grid-cols-[2rem_minmax(2.5rem,1fr)_2rem]">
            <button
              type="button"
              onClick={decrement}
              className="flex h-full min-w-0 items-center justify-center transition hover:bg-white/10 active:bg-white/15"
              aria-label={`Уменьшить количество ${name}`}
            >
              <Minus className="size-3.5 min-[430px]:size-4" />
            </button>
            <input
              className="h-full min-w-0 border-0 bg-transparent p-0 text-center text-xs font-extrabold text-white outline-none [appearance:textfield] placeholder:text-white/70 min-[430px]:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              type="text"
              inputMode="decimal"
              enterKeyHint="done"
              pattern="[0-9]*[.,]?[0-9]*"
              value={quantityInput}
              onFocus={handleQuantityFocus}
              onBlur={handleQuantityBlur}
              onChange={handleQuantityInputChange}
              onKeyDown={handleQuantityKeyDown}
              aria-label={`Количество ${name}`}
            />
            <button
              type="button"
              onClick={increment}
              className="flex h-full min-w-0 items-center justify-center transition hover:bg-white/10 active:bg-white/15"
              aria-label={`Увеличить количество ${name}`}
            >
              <Plus className="size-3.5 min-[430px]:size-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
