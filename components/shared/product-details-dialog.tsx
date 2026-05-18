'use client'

import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CatalogProduct } from './products-grid'
import {
  formatNumber,
  getPackagePriceLabel,
  ProductPackage,
  useProductPurchase,
} from './use-product-purchase'
import { useCart } from '@/store/cart'

interface Props {
  product: CatalogProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProductDetailsDialog: React.FC<Props> = ({ product, open, onOpenChange }) => {
  const cartItems = useCart((state) => state.items)
  const setItemQuantity = useCart((state) => state.setItemQuantity)
  const getQuantityForPackage = React.useCallback((packageId: number) => {
    if (!product) {
      return 0
    }

    return cartItems.find((item) => item.productId === product.id && item.packageId === packageId)?.quantity ?? 0
  }, [cartItems, product])
  const handleCartQuantityChange = React.useCallback((nextQuantity: number, itemPackage: ProductPackage) => {
    if (!product) {
      return
    }

    const nextPrice = itemPackage.price ?? product.price * itemPackage.quantity

    setItemQuantity({
      productId: product.id,
      packageId: itemPackage.id,
      unit: itemPackage.unit,
      packageName: itemPackage.name,
      packageQuantity: itemPackage.quantity,
      price: nextPrice,
      minSaleQuantity: itemPackage.minSaleQuantity,
      quantityStep: itemPackage.quantityStep,
      quantityPrecision: itemPackage.quantityPrecision,
    }, nextQuantity)
  }, [product, setItemQuantity])
  const {
    availablePackages,
    selectedPackage,
    selectedPackageId,
    packagePrice,
    totalPrice,
    hasQuantity,
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
    price: product?.price ?? 0,
    unit: product?.unit ?? 'шт',
    packages: product?.packages ?? [],
    getQuantityForPackage,
    onQuantityChange: handleCartQuantityChange,
  })

  return (
    <Dialog open={open && Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-none overflow-hidden p-0 sm:max-w-none md:max-w-none lg:w-[min(72rem,calc(100vw-3rem))] lg:max-w-none xl:w-[76rem] 2xl:w-[82rem]">
        {product && (
          <div className="grid max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] 2xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
            <div className="flex min-h-[240px] items-center justify-center bg-gray-50 p-4 ring-1 ring-black/[0.03] sm:min-h-[340px] sm:p-6 lg:min-h-[520px] xl:min-h-[560px] 2xl:min-h-[620px]">
              <img
                src={product.imagesJson}
                alt={product.name}
                className="max-h-[260px] w-full object-contain sm:max-h-[340px] lg:max-h-[min(56vh,520px)] xl:max-h-[min(58vh,560px)] 2xl:max-h-[min(60vh,620px)]"
              />
            </div>

            <div className="flex min-w-0 flex-col p-4 sm:p-6 lg:p-7 xl:p-8 2xl:p-10">
              <DialogHeader className="pr-8 text-left">
                <DialogTitle className="text-2xl font-extrabold leading-tight text-black sm:text-3xl lg:text-4xl">
                  {product.name}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-gray-500 sm:text-base lg:text-lg lg:leading-7">
                  {product.description || 'Описание продукции скоро появится'}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 lg:mt-8">
                <p className="mb-2 text-sm font-extrabold text-gray-500">Упаковка</p>
                <div className="flex flex-wrap gap-2">
                  {availablePackages.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePackageSelect(item.id)}
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm font-extrabold transition',
                        selectedPackageId === item.id
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/25'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100',
                      )}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>

                {showPackageMeta && (
                  <p className="mt-2 text-sm font-semibold text-gray-400">
                    {formatNumber(selectedPackage.quantity, quantityPrecision)} {selectedPackage.unit} / {selectedPackage.name}
                  </p>
                )}
              </div>

              <div className="mt-5 rounded-xl bg-gray-50 p-4 lg:mt-8 lg:p-5">
                <span className="block text-xs font-semibold uppercase leading-none text-gray-400">
                  {getPackagePriceLabel(selectedPackage.name)}
                </span>
                <span className="mt-1 block text-3xl font-extrabold leading-none text-black lg:text-4xl">
                  {packagePrice} ₽
                </span>
              </div>

              {hasQuantity && (
                <div className="mt-3 rounded-xl bg-primary/10 p-4 ring-1 ring-primary/15 lg:p-5">
                  <span className="block text-xs font-semibold uppercase leading-none text-primary/70">
                    Сумма
                  </span>
                  <span className="mt-1 block text-3xl font-extrabold leading-none text-primary lg:text-4xl">
                    {totalPrice} ₽
                  </span>
                </div>
              )}

              <div className="mt-auto pt-5 lg:pt-8">
                {!showQuantityControls ? (
                  <button
                    type="button"
                    onClick={increment}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-extrabold text-white shadow-sm transition hover:bg-primary/90 active:scale-[0.99] lg:h-14"
                    aria-label={`Добавить ${product.name}`}
                  >
                    <Plus className="size-5" />
                    Добавить
                  </button>
                ) : (
                  <div className="flex h-12 w-full items-center overflow-hidden rounded-xl bg-primary text-white shadow-sm lg:h-14">
                    <button
                      type="button"
                      onClick={decrement}
                      className="flex h-full w-14 items-center justify-center transition hover:bg-white/10 active:bg-white/15 lg:w-16"
                      aria-label={`Уменьшить количество ${product.name}`}
                    >
                      <Minus className="size-5" />
                    </button>
                    <input
                      className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-center text-base font-extrabold text-white outline-none [appearance:textfield] placeholder:text-white/70 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      type="text"
                      inputMode="decimal"
                      enterKeyHint="done"
                      pattern="[0-9]*[.,]?[0-9]*"
                      value={quantityInput}
                      onFocus={handleQuantityFocus}
                      onBlur={handleQuantityBlur}
                      onChange={handleQuantityInputChange}
                      onKeyDown={handleQuantityKeyDown}
                      aria-label={`Количество ${product.name}`}
                    />
                    <button
                      type="button"
                      onClick={increment}
                      className="flex h-full w-14 items-center justify-center transition hover:bg-white/10 active:bg-white/15 lg:w-16"
                      aria-label={`Увеличить количество ${product.name}`}
                    >
                      <Plus className="size-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
