import { axiosInstance } from './instance'
import { CartItem } from '@/store/cart'

export const getServerCart = async (userId: number) => {
  const { data } = await axiosInstance.get('/cart', {
    params: { userId },
  })

  return data
}

export const mergeGuestCart = async (userId: number, items: CartItem[], strategy: 'merge' | 'replace' = 'merge') => {
  const { data } = await axiosInstance.post('/cart/merge', {
    userId,
    items,
    strategy,
  })

  return data
}

