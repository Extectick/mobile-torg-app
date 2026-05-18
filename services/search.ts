import { AxiosRequestConfig } from "axios"
import axios from "axios"
import { axiosInstance } from "./instance"
import { ApiPoutes } from "./constants"

export interface SearchProduct {
  id: number
  name: string
  description: string | null
  price: number
  unit: string
  imagesJson: string
  categoryId: number
  packages: {
    id: number
    name: string
    unit: string
    quantity: number
    minSaleQuantity: number
    quantityStep: number
    quantityPrecision: number
    price: number | null
    isDefault: boolean
  }[]
  category?: {
    name: string
  }
}

export interface SearchCategory {
  id: number
  name: string
  image: string | null
  parentId: number | null
  productCount: number
}

export interface SearchResponse {
  products: SearchProduct[]
  categories: SearchCategory[]
}

export const search = async (
  query: string,
  config?: AxiosRequestConfig & { limit?: number },
): Promise<SearchResponse> => {
  try {
    const response = await axiosInstance.get<SearchResponse>(ApiPoutes.SEARCH, {
      params: {
        query,
        limit: config?.limit,
      },
      signal: config?.signal,
    })

    return response.data
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message)
      return { products: [], categories: [] }
    }

    console.error("Search error:", error)
    throw error
  }
}
