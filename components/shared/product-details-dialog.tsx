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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
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
  const [lastProduct, setLastProduct] = React.useState<CatalogProduct | null>(product)
  const [isDesktop, setIsDesktop] = React.useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  ))
  const displayedProduct = product ?? lastProduct
  const cartItems = useCart((state) => state.items)
  const setItemQuantity = useCart((state) => state.setItemQuantity)

  React.useEffect(() => {
    if (product) {
      setLastProduct(product)
    }
  }, [product])

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleChange = () => setIsDesktop(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const getQuantityForPackage = React.useCallback((packageId: number) => {
    if (!displayedProduct) {
      return 0
    }

    return cartItems.find((item) => item.productId === displayedProduct.id && item.packageId === packageId)?.quantity ?? 0
  }, [cartItems, displayedProduct])
  const handleCartQuantityChange = React.useCallback((nextQuantity: number, itemPackage: ProductPackage) => {
    if (!displayedProduct) {
      return
    }

    const nextPrice = itemPackage.price ?? displayedProduct.price * itemPackage.quantity

    setItemQuantity({
      productId: displayedProduct.id,
      packageId: itemPackage.id,
      name: displayedProduct.name,
      imageUrl: displayedProduct.imagesJson,
      unit: itemPackage.unit,
      packageName: itemPackage.name,
      packageQuantity: itemPackage.quantity,
      price: nextPrice,
      minSaleQuantity: itemPackage.minSaleQuantity,
      quantityStep: itemPackage.quantityStep,
      quantityPrecision: itemPackage.quantityPrecision,
    }, nextQuantity)
  }, [displayedProduct, setItemQuantity])
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
    price: displayedProduct?.price ?? 0,
    unit: displayedProduct?.unit ?? 'шт',
    packages: displayedProduct?.packages ?? [],
    getQuantityForPackage,
    onQuantityChange: handleCartQuantityChange,
  })

  const detailsContent = displayedProduct ? (
    <div className="relative grid max-h-[92dvh] gap-0 overflow-y-auto lg:max-h-[min(86dvh,58rem)] lg:grid-cols-[minmax(30rem,1.18fr)_minmax(24rem,0.82fr)] xl:grid-cols-[minmax(34rem,1.2fr)_minmax(26rem,0.8fr)] 2xl:grid-cols-[minmax(40rem,1.24fr)_minmax(28rem,0.76fr)]">
            <div className="flex min-h-60 items-center justify-center bg-gray-50 p-4 ring-1 ring-black/3 sm:min-h-85 sm:p-6 lg:min-h-[min(70dvh,44rem)] lg:p-10 xl:min-h-[min(72dvh,48rem)] 2xl:min-h-[min(74dvh,54rem)] 2xl:p-12">
              <img
                src={displayedProduct.imagesJson}
                alt={displayedProduct.name}
                className="max-h-65 w-full object-contain sm:max-h-85 lg:max-h-[min(62vh,620px)] xl:max-h-[min(64vh,700px)] 2xl:max-h-[min(66vh,780px)]"
              />
            </div>

            <div className="flex min-w-0 flex-col p-4 pb-0 sm:p-6 sm:pb-0 lg:p-8 lg:pb-8 xl:p-10 2xl:p-12">
              {isDesktop ? (
                <DialogHeader className="p-0 pr-8 text-left">
                  <DialogTitle className="text-2xl font-extrabold leading-tight text-black sm:text-3xl lg:text-4xl">
                    {displayedProduct.name}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-6 text-gray-500 sm:text-base lg:text-lg lg:leading-7">
                    {displayedProduct.description || 'Описание продукции скоро появится'}
                  </DialogDescription>
                </DialogHeader>
              ) : (
                <DrawerHeader className="p-0 pr-8 text-left">
                  <DrawerTitle className="text-2xl font-extrabold leading-tight text-black sm:text-3xl lg:text-4xl">
                    {displayedProduct.name}
                  </DrawerTitle>
                  <DrawerDescription className="text-sm leading-6 text-gray-500 sm:text-base lg:text-lg lg:leading-7">
                    {displayedProduct.description || 'Описание продукции скоро появится'}
                  </DrawerDescription>
                </DrawerHeader>
              )}

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

              <div className="sticky bottom-0 z-10 -mx-4 mt-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:px-0 lg:pb-0 lg:pt-8">
                {!showQuantityControls ? (
                  <button
                    type="button"
                    onClick={increment}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-extrabold text-white shadow-xl shadow-primary/25 ring-1 ring-white/50 transition hover:bg-primary/90 active:scale-[0.99] lg:h-14"
                    aria-label={`Добавить ${displayedProduct.name}`}
                  >
                    <Plus className="size-5" />
                    Добавить
                  </button>
                ) : (
                  <div className="flex h-12 w-full items-center overflow-hidden rounded-xl bg-primary text-white shadow-xl shadow-primary/25 ring-1 ring-white/50 lg:h-14">
                    <button
                      type="button"
                      onClick={decrement}
                      className="flex h-full w-14 items-center justify-center transition hover:bg-white/10 active:bg-white/15 lg:w-16"
                      aria-label={`Уменьшить количество ${displayedProduct.name}`}
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
                      aria-label={`Количество ${displayedProduct.name}`}
                    />
                    <button
                      type="button"
                      onClick={increment}
                      className="flex h-full w-14 items-center justify-center transition hover:bg-white/10 active:bg-white/15 lg:w-16"
                      aria-label={`Увеличить количество ${displayedProduct.name}`}
                    >
                      <Plus className="size-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
  ) : null

  if (isDesktop) {
    return (
      <Dialog open={open && Boolean(displayedProduct)} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(80rem,calc(100vw-3rem))] max-w-none overflow-hidden p-0 sm:max-w-none md:max-w-none lg:max-w-none xl:w-[min(92rem,calc(100vw-4rem))] 2xl:w-[min(108rem,calc(100vw-5rem))] min-[2200px]:w-[min(118rem,calc(100vw-6rem))]">
          {detailsContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open && Boolean(displayedProduct)} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh] overflow-hidden rounded-t-xl bg-white p-0">
        {detailsContent}
      </DrawerContent>
    </Drawer>
  )
}
