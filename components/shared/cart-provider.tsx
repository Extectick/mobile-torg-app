'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui'
import { useCart } from '@/store/cart'

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const mergePrompt = useCart((state) => state.mergePrompt)
  const confirmGuestCartMerge = useCart((state) => state.confirmGuestCartMerge)
  const declineGuestCartMerge = useCart((state) => state.declineGuestCartMerge)
  const [isMerging, setIsMerging] = React.useState(false)

  const handleConfirmMerge = async () => {
    try {
      setIsMerging(true)
      await confirmGuestCartMerge()
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <>
      {children}
      <Dialog open={Boolean(mergePrompt)} onOpenChange={(open) => {
        if (!open && !isMerging) {
          declineGuestCartMerge()
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Перенести корзину?</DialogTitle>
            <DialogDescription>
              В аккаунте уже есть товары в корзине. Перенести товары, которые были добавлены до входа?
            </DialogDescription>
          </DialogHeader>

          {mergePrompt && (
            <p className="text-sm text-gray-500">
              В сохраненной корзине: {mergePrompt.serverItemsCount} поз.
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={declineGuestCartMerge}
              disabled={isMerging}
            >
              Не переносить
            </Button>
            <Button
              type="button"
              onClick={handleConfirmMerge}
              disabled={isMerging}
            >
              {isMerging ? 'Перенос...' : 'Перенести'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

