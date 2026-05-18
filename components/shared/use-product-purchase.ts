'use client'

import React from 'react'

export interface ProductPackage {
  id: number
  name: string
  unit: string
  quantity: number
  minSaleQuantity: number
  quantityStep: number
  quantityPrecision: number
  price: number | null
  isDefault: boolean
}

interface UseProductPurchaseProps {
  price: number
  unit: string
  packages?: ProductPackage[]
  quantity?: number
  getQuantityForPackage?: (packageId: number) => number
  onQuantityChange?: (quantity: number, selectedPackage: ProductPackage) => void
}

export const formatNumber = (value: number, precision = 3) => {
  const rounded = Number(value.toFixed(precision))

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(precision).replace(/0+$/, '').replace(/\.$/, '')
}

export const getPackagePriceLabel = (name: string) => {
  if (name === 'коробка') return 'за коробку'
  if (name === 'упаковка') return 'за упаковку'
  if (name === 'банка') return 'за банку'

  return `за ${name}`
}

export function useProductPurchase({
  price,
  unit,
  packages = [],
  quantity: controlledQuantity,
  getQuantityForPackage,
  onQuantityChange,
}: UseProductPurchaseProps) {
  const availablePackages = React.useMemo<ProductPackage[]>(() => {
    if (packages.length > 0) {
      return packages
    }

    return [{
      id: 0,
      name: unit,
      unit,
      quantity: 1,
      minSaleQuantity: unit === 'кг' ? 2 : 1,
      quantityStep: unit === 'кг' ? 0.1 : 1,
      quantityPrecision: unit === 'кг' ? 1 : 0,
      price,
      isDefault: true,
    }]
  }, [packages, price, unit])

  const defaultPackage = availablePackages.find((item) => item.isDefault) ?? availablePackages[0]
  const [selectedPackageId, setSelectedPackageId] = React.useState(defaultPackage.id)
  const [uncontrolledQuantity, setUncontrolledQuantity] = React.useState(0)
  const [quantityInput, setQuantityInput] = React.useState('')
  const [isEditingQuantity, setIsEditingQuantity] = React.useState(false)
  const isControlled = controlledQuantity !== undefined || getQuantityForPackage !== undefined

  React.useEffect(() => {
    setSelectedPackageId(defaultPackage.id)
    setUncontrolledQuantity(0)
    setQuantityInput('')
    setIsEditingQuantity(false)
  }, [defaultPackage.id])

  const selectedPackage = availablePackages.find((item) => item.id === selectedPackageId) ?? defaultPackage
  const quantity = getQuantityForPackage?.(selectedPackageId) ?? controlledQuantity ?? uncontrolledQuantity
  const packagePrice = selectedPackage.price ?? price * selectedPackage.quantity
  const hasQuantity = quantity > 0
  const totalPrice = hasQuantity ? Number((packagePrice * quantity).toFixed(2)) : 0
  const quantityStep = selectedPackage.quantityStep || 1
  const quantityPrecision = selectedPackage.quantityPrecision ?? 0
  const minSaleQuantity = selectedPackage.minSaleQuantity || quantityStep

  const normalizeQuantity = React.useCallback((value: number, { allowZero = true } = {}) => {
    if (!Number.isFinite(value)) {
      return 0
    }

    if (value <= 0 && allowZero) {
      return 0
    }

    const minQuantity = allowZero ? minSaleQuantity : Math.max(minSaleQuantity, quantityStep)
    const clampedValue = Math.max(value, minQuantity)
    const stepsFromMin = Math.round((clampedValue - minSaleQuantity) / quantityStep)
    const normalized = minSaleQuantity + stepsFromMin * quantityStep

    return Number(normalized.toFixed(quantityPrecision))
  }, [minSaleQuantity, quantityPrecision, quantityStep])

  const updateQuantity = React.useCallback((value: number) => {
    if (!Number.isFinite(value)) {
      if (isControlled) {
        onQuantityChange?.(0, selectedPackage)
      } else {
        setUncontrolledQuantity(0)
      }
      setQuantityInput('')
      return
    }

    const nextValue = normalizeQuantity(value)
    if (isControlled) {
      onQuantityChange?.(nextValue, selectedPackage)
    } else {
      setUncontrolledQuantity(nextValue)
    }
    setQuantityInput(nextValue > 0 ? formatNumber(nextValue, quantityPrecision) : '')
  }, [isControlled, normalizeQuantity, onQuantityChange, quantityPrecision, selectedPackage])

  React.useEffect(() => {
    if (!isControlled || isEditingQuantity) {
      return
    }

    setQuantityInput(quantity > 0 ? formatNumber(quantity, quantityPrecision) : '')
  }, [isControlled, isEditingQuantity, quantity, quantityPrecision])

  const increment = React.useCallback(() => {
    updateQuantity(quantity > 0 ? quantity + quantityStep : minSaleQuantity)
  }, [minSaleQuantity, quantity, quantityStep, updateQuantity])

  const decrement = React.useCallback(() => {
    updateQuantity(quantity <= minSaleQuantity ? 0 : quantity - quantityStep)
  }, [minSaleQuantity, quantity, quantityStep, updateQuantity])

  const handlePackageSelect = React.useCallback((packageId: number) => {
    const nextPackage = availablePackages.find((item) => item.id === packageId)

    setSelectedPackageId(packageId)

    if (!nextPackage || quantity <= 0) {
      return
    }

    const nextStep = nextPackage.quantityStep || 1
    const nextPrecision = nextPackage.quantityPrecision ?? 0
    const nextMinQuantity = nextPackage.minSaleQuantity || nextStep
    const stepsFromMin = Math.round((Math.max(quantity, nextMinQuantity) - nextMinQuantity) / nextStep)
    const nextQuantity = Number((nextMinQuantity + stepsFromMin * nextStep).toFixed(nextPrecision))

    if (isControlled) {
      onQuantityChange?.(nextQuantity, nextPackage)
    } else {
      setUncontrolledQuantity(nextQuantity)
    }
    setQuantityInput(formatNumber(nextQuantity, nextPrecision))
  }, [availablePackages, isControlled, onQuantityChange, quantity])

  const handleQuantityInputChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(',', '.')
    const quantityPattern = quantityPrecision > 0
      ? new RegExp(`^\\d*\\.?\\d{0,${quantityPrecision}}$`)
      : /^\d*$/

    if (!quantityPattern.test(value)) {
      return
    }

    setQuantityInput(value)

    if (value === '') {
      if (isControlled) {
        onQuantityChange?.(0, selectedPackage)
      } else {
        setUncontrolledQuantity(0)
      }
      return
    }

    const nextValue = Number(value)

    if (Number.isFinite(nextValue)) {
      if (isControlled) {
        onQuantityChange?.(Math.max(0, nextValue), selectedPackage)
      } else {
        setUncontrolledQuantity(Math.max(0, nextValue))
      }
    }
  }, [isControlled, onQuantityChange, quantityPrecision, selectedPackage])

  const handleQuantityBlur = React.useCallback(() => {
    setIsEditingQuantity(false)
    const nextQuantity = quantity > 0 ? normalizeQuantity(quantity, { allowZero: false }) : 0

    if (isControlled) {
      onQuantityChange?.(nextQuantity, selectedPackage)
    } else {
      setUncontrolledQuantity(nextQuantity)
    }
    setQuantityInput(nextQuantity > 0 ? formatNumber(nextQuantity, quantityPrecision) : '')
  }, [isControlled, normalizeQuantity, onQuantityChange, quantity, quantityPrecision, selectedPackage])

  const handleQuantityFocus = React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const input = event.currentTarget

    setIsEditingQuantity(true)
    requestAnimationFrame(() => input.select())
  }, [])

  const handleQuantityKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    event.currentTarget.blur()
  }, [])

  return {
    availablePackages,
    selectedPackage,
    selectedPackageId,
    packagePrice,
    totalPrice,
    hasQuantity,
    quantity,
    quantityInput,
    quantityPrecision,
    isEditingQuantity,
    showPackageMeta: selectedPackage.quantity !== 1 || selectedPackage.name !== selectedPackage.unit,
    showQuantityControls: quantity > 0 || isEditingQuantity,
    increment,
    decrement,
    handlePackageSelect,
    handleQuantityInputChange,
    handleQuantityBlur,
    handleQuantityFocus,
    handleQuantityKeyDown,
  }
}
