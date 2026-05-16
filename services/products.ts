import { Product } from "@prisma/client"
import { axiosInstance } from "./instance"
import { AxiosRequestConfig } from "axios";
import axios from "axios"; // Импортируем axios для isCancel
import { ApiPoutes } from "./constants";

// Поиск продуктов
export const search = async (
  query: string, 
  config?: AxiosRequestConfig & { limit?: number }
): Promise<Product[]> => {
  try {
    const response = await axiosInstance.get<Product[]>(ApiPoutes.SEARCH_PRODUCTS, {
      params: { 
        query,
        limit: config?.limit 
      },
      signal: config?.signal
    });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) { // Используем axios.isCancel вместо axiosInstance.isCancel
      console.log('Request canceled:', error.message);
      return [];
    }
    console.error('Search error:', error);
    throw error;
  }
};
