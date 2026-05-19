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
    showPackageMeta,
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
          <Skeleton className="[aspect-ratio:var(--product-card-image-ratio)] rounded-none" />
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
        <div className="relative z-10 flex [aspect-ratio:var(--product-card-image-ratio)] items-center justify-center overflow-hidden bg-gray-50 ring-1 ring-black/[0.03] transition duration-300 group-hover:shadow-md group-hover:ring-primary/20">
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
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-extrabold leading-tight text-black min-[430px]:text-[15px] sm:min-h-[3.25rem] sm:text-lg lg:min-h-[3rem] lg:text-[17px]">
            {name}
          </h3>

          <p className="mt-1 hidden text-sm leading-5 text-gray-500 sm:line-clamp-2 sm:block sm:min-h-10 lg:min-h-[2.25rem] lg:leading-[1.15rem]">
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
        {showPackageMeta && (
          <p className="mt-1 truncate text-xs font-semibold text-gray-400">
            {formatNumber(selectedPackage.quantity, quantityPrecision)} {selectedPackage.unit} / {selectedPackage.name}
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 px-2.5 pb-3 pt-2 min-[430px]:px-3 sm:flex-row sm:items-end sm:justify-between sm:gap-2 sm:px-4 sm:pb-4 lg:pb-3">
        <div className="min-w-[5rem] flex-1 pr-1">
          <span className="block truncate text-[10px] font-semibold uppercase leading-none text-gray-400 sm:text-xs">
            {getPackagePriceLabel(selectedPackage.name)}
          </span>
          <span className="block whitespace-nowrap text-lg font-extrabold leading-none text-black min-[430px]:text-xl sm:text-[clamp(1.2rem,2.7vw,1.45rem)]">
            {formatNumber(packagePrice, 2)} ₽
          </span>
        </div>

        {!showQuantityControls ? (
          <button
            type="button"
            onClick={increment}
            className="flex h-9 w-full shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition hover:bg-primary/90 active:scale-95 sm:size-10 sm:w-10"
            aria-label={`Добавить ${name}`}
          >
            <Plus className="size-5" />
          </button>
        ) : (
          <div className="flex h-9 w-full shrink-0 items-center overflow-hidden rounded-lg bg-primary text-white shadow-sm sm:h-10 sm:w-[8.25rem]">
            <button
              type="button"
              onClick={decrement}
              className="flex h-full w-9 items-center justify-center transition hover:bg-white/10 active:bg-white/15"
              aria-label={`Уменьшить количество ${name}`}
            >
              <Minus className="size-4" />
            </button>
            <input
              className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-center text-sm font-extrabold text-white outline-none [appearance:textfield] placeholder:text-white/70 sm:w-14 sm:flex-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
              className="flex h-full w-9 items-center justify-center transition hover:bg-white/10 active:bg-white/15"
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
